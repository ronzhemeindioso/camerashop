const Order = require('../models/order');
const Product = require('../models/product');



// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

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
        res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    res.status(200).json({
        success: true,
        order
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

const STATUS_FLOW = ['Processing', 'Shipped', 'Delivered']

// Admin updates the status of an order  =>  PUT /api/v1/admin/order/:id   body: { status }
exports.updateOrder = async (req, res, next) => {
    const { status } = req.body || {}

    if (!STATUS_FLOW.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${STATUS_FLOW.join(', ')}`
        })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'No Order found with this ID'
        })
    }

    if (order.orderStatus === 'Delivered') {
        return res.status(400).json({
            success: false,
            message: 'You have already delivered this order'
        })
    }

    if (STATUS_FLOW.indexOf(status) < STATUS_FLOW.indexOf(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: `This order is already ${order.orderStatus}, it cannot go back to ${status}`
        })
    }

    // The first time the order leaves "Processing", take the items out of stock - only once.
    if (status !== 'Processing' && !order.stockDeducted) {
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

    order.orderStatus = status
    if (status === 'Delivered') {
        order.deliveredAt = Date.now()
    }
    await order.save()

    return res.status(200).json({
        success: true,
        order
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