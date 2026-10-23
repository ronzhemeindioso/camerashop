const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');
const { buildOrderEmailHtml, buildReceiptPdf } = require('../utils/orderReceipt');
const { roundMoney, findVoucherByCode, calculateDiscount, getVoucherError, claimVoucher, releaseVoucher } = require('./voucher');



// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        voucherCode

    } = req.body;

    const orderData = {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        statusHistory: [{ status: 'Processing', at: Date.now() }],
        user: req.user._id
    }

    // Voucher: the discount is worked out here from the real product prices, never from the browser's numbers
    let claim = null
    if (voucherCode) {
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' })
        }
        const products = await Product.find({ _id: { $in: orderItems.map(item => item.product) } }).select('price')
        const priceById = new Map(products.map(p => [String(p._id), p.price]))

        let serverItemsPrice = 0
        const pricedItems = []
        for (const item of orderItems) {
            const price = priceById.get(String(item.product))
            const quantity = Number(item.quantity)
            if (price === undefined) {
                return res.status(400).json({ message: `"${item.name}" is no longer available` })
            }
            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: 'Invalid item quantity' })
            }
            serverItemsPrice += price * quantity
            pricedItems.push({ ...item, price })
        }
        serverItemsPrice = roundMoney(serverItemsPrice)

        const voucher = await findVoucherByCode(voucherCode)
        const problem = getVoucherError(voucher, req.user._id, serverItemsPrice)
        if (problem) {
            return res.status(400).json({ message: problem })
        }

        claim = await claimVoucher(voucher, req.user._id)
        if (!claim) {
            return res.status(400).json({ message: 'This voucher can no longer be used' })
        }

        const discount = calculateDiscount(voucher, serverItemsPrice)
        orderData.orderItems = pricedItems
        orderData.itemsPrice = serverItemsPrice
        orderData.discountPrice = discount
        orderData.voucher = {
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue
        }
        orderData.totalPrice = roundMoney(Math.max(0, serverItemsPrice + Number(shippingPrice || 0) + Number(taxPrice || 0) - discount))
    }

    let order
    try {
        order = await Order.create(orderData)
    } catch (error) {
        // the order wasn't saved, so give the voucher use back
        if (claim) await releaseVoucher(claim, req.user._id)
        throw error
    }

    // confirmation email (status: Processing) - not awaited so checkout stays fast; it never throws
    emailOrderUpdate(order)

    res.status(200).json({
        success: true,
        order
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',
        })
    }

    const data = order.toObject()

    // Admins also get the current stock of each ordered product (shown on the process-order page)
    if (req.user && req.user.role === 'admin') {
        const products = await Product.find({ _id: { $in: data.orderItems.map(item => item.product) } }).select('stock')
        const stockById = new Map(products.map(p => [String(p._id), p.stock]))
        data.orderItems = data.orderItems.map(item => ({
            ...item,
            // null = the product no longer exists
            stock: stockById.has(String(item.product)) ? stockById.get(String(item.product)) : null
        }))
    }

    res.status(200).json({
        success: true,
        order: data
    })
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
    // console.log(orders)
    let totalAmount = 0;

    orders.forEach(order => {

        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })

    }
    return res.status(200).json({
        success: true
    })
}

const ALL_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Returned', 'Refunded']

// Where an order can go from each status (the admin page uses the same map). Refunded is final.
const NEXT_STATUS = {
    Processing: ['Shipped', 'Delivered'],
    Shipped: ['Delivered'],
    Delivered: ['Returned', 'Refunded'],
    Returned: ['Refunded'],
    Refunded: []
}

const peso = (n) => `\u20B1${Number(n || 0).toFixed(2)}`

// Emails the customer the updated order (items, subtotals, grand total) with a PDF receipt attached.
// Never throws - a mail problem must not undo a status change that was already saved.
const emailOrderUpdate = async (order) => {
    try {
        const customer = await User.findById(order.user).select('name email')
        if (!customer || !customer.email) {
            return { sent: false, reason: 'Customer has no email address' }
        }
        const pdf = await buildReceiptPdf(order, customer.name, customer.email)
        await sendEmail({
            email: customer.email,
            subject: `Your order #${order._id} is now ${order.orderStatus}`,
            message: `Your order #${order._id} is now ${order.orderStatus}. Grand total: ${peso(order.totalPrice)}. Your receipt is attached.`,
            html: buildOrderEmailHtml(order, customer.name),
            attachments: [{
                filename: `receipt-${order._id}.pdf`,
                content: pdf,
                contentType: 'application/pdf'
            }]
        })
        return { sent: true, to: customer.email }
    } catch (error) {
        console.error('Order update email failed:', error.message)
        return { sent: false, reason: error.message }
    }
}

// Admin updates the status of an order  =>  PUT /api/v1/admin/order/:id   body: { status, trackingNumber? }
exports.updateOrder = async (req, res, next) => {
    const { status, trackingNumber } = req.body || {}

    if (!ALL_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${ALL_STATUSES.join(', ')}`
        })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'No Order found with this ID'
        })
    }

    const previousStatus = order.orderStatus

    if (previousStatus === 'Refunded') {
        return res.status(400).json({
            success: false,
            message: 'This order has been refunded and is locked'
        })
    }
    if (status === previousStatus) {
        return res.status(400).json({
            success: false,
            message: `This order is already ${previousStatus}`
        })
    }
    if (!(NEXT_STATUS[previousStatus] || []).includes(status)) {
        return res.status(400).json({
            success: false,
            message: `A ${previousStatus} order cannot be changed to ${status}`
        })
    }

    // The first time the order leaves "Processing", take the items out of stock - only once.
    if ((status === 'Shipped' || status === 'Delivered') && !order.stockDeducted) {
        // 1) make sure there is enough stock for every item before touching anything
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product)
            if (product && product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for "${item.name}" (${product.stock} left, ordered ${item.quantity})`
                })
            }
        }
        // 2) deduct (a product that was permanently deleted is simply skipped)
        for (const item of order.orderItems) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
        }
        order.stockDeducted = true
    }

    // A return puts the items back into stock (only if they had been taken out)
    if (status === 'Returned' && order.stockDeducted) {
        for (const item of order.orderItems) {
            await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
        }
        order.stockDeducted = false
    }

    order.statusHistory.push({ status, at: Date.now() })
    if (status === 'Shipped' && typeof trackingNumber === 'string' && trackingNumber.trim()) {
        order.trackingNumber = trackingNumber.trim().slice(0, 100)
    }

    order.orderStatus = status
    if (status === 'Delivered') {
        order.deliveredAt = Date.now()
    }
    await order.save()

    // let the customer know about every status change
    const email = await emailOrderUpdate(order)

    return res.status(200).json({
        success: true,
        order,
        emailSent: email.sent,
        emailMessage: email.sent ? `Email sent to ${email.to}` : email.reason
    })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": 1,
                total: 1,
            }
        },
        { $sort: { total: -1 } },

    ])
    console.log(customerSales)
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        customerSales
    })

}

// Sales report with a date range  =>  GET /api/v1/admin/sales?from=2026-10-01&to=2026-10-31&groupBy=day|month&tz=Asia/Manila
// from / to are optional (leave both out for "all time"). Returns one row per day or month.
exports.salesReport = async (req, res, next) => {
    const { from, to } = req.query
    const groupBy = req.query.groupBy === 'month' ? 'month' : 'day'
    const tz = req.query.tz || 'Asia/Manila'

    const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v)
    if ((from && !isDate(from)) || (to && !isDate(to))) {
        return res.status(400).json({ success: false, message: 'Dates must look like YYYY-MM-DD' })
    }
    if (from && to && from > to) {
        return res.status(400).json({ success: false, message: '"From" date must not be after "To" date' })
    }

    const pipeline = [
        // the sale date is when the order was paid (falls back to when it was created)
        { $addFields: { saleDate: { $ifNull: ['$paidAt', '$createdAt'] } } },
        // calendar day in the admin's own timezone, e.g. "2026-10-19"
        { $addFields: { day: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate', timezone: tz } } } },
    ]

    // YYYY-MM-DD strings sort the same way dates do, so a plain string range works
    if (from || to) {
        const range = {}
        if (from) range.$gte = from
        if (to) range.$lte = to
        pipeline.push({ $match: { day: range } })
    }

    pipeline.push(
        {
            $group: {
                _id: groupBy === 'month' ? { $substrBytes: ['$day', 0, 7] } : '$day',
                total: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', total: 1, orders: 1 } }
    )

    let sales
    try {
        sales = await Order.aggregate(pipeline)
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Could not build the report: ' + error.message })
    }

    return res.status(200).json({
        success: true,
        groupBy,
        sales
    })
}

exports.salesPerMonth = async (req, res, next) => {
    const salesPerMonth = await Order.aggregate([
        // Select 
        // FROM 
        // GROUP BY month(paidAt), year(paidAt)
        {
            $group: {
                // _id: {month: { $month: "$paidAt" } },
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },

        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                _id: false,
                month: true,
                total: true,
            }
        }

    ])
    if (!salesPerMonth) {
        return res.status(404).json({
            message: 'error sales per month',
        })
    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        salesPerMonth
    })

}