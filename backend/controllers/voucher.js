const Voucher = require('../models/voucher')

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// ---------- helpers shared with the order controller ----------

const findVoucherByCode = (code) => {
    if (!code || typeof code !== 'string') return null
    return Voucher.findOne({ code: code.trim().toUpperCase() })
}

// How much the voucher takes off an items subtotal (never more than the subtotal itself)
const calculateDiscount = (voucher, itemsPrice) => {
    let discount = voucher.discountType === 'percent'
        ? (itemsPrice * voucher.discountValue) / 100
        : voucher.discountValue
    if (voucher.discountType === 'percent' && voucher.maxDiscount > 0) {
        discount = Math.min(discount, voucher.maxDiscount)
    }
    return roundMoney(Math.min(discount, itemsPrice))
}

const timesUsedBy = (voucher, userId) =>
    voucher.usedBy.filter(u => String(u.user) === String(userId)).length

// Returns a message explaining why the voucher can't be used, or null when it can
const getVoucherError = (voucher, userId, itemsPrice) => {
    if (!voucher || !voucher.isActive) return 'Invalid voucher code'
    const now = new Date()
    if (voucher.startsAt && voucher.startsAt > now) return 'This voucher is not active yet'
    if (voucher.expiresAt && voucher.expiresAt < now) return 'This voucher has expired'
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) return 'This voucher has been fully redeemed'
    if (voucher.perUserLimit > 0 && timesUsedBy(voucher, userId) >= voucher.perUserLimit) return 'You have already used this voucher'
    if (itemsPrice < voucher.minPurchase) return `Spend at least $${voucher.minPurchase.toFixed(2)} on items to use this voucher`
    return null
}

// Atomically records a use of the voucher. Returns { voucher, at } or null if the limits were hit
// in the meantime (two people grabbing the last use, the same user ordering twice at once, ...).
const claimVoucher = async (voucher, userId) => {
    const at = new Date()
    const now = new Date()
    const filter = {
        _id: voucher._id,
        isActive: true,
        $and: [
            { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
            { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] }
        ]
    }
    if (voucher.usageLimit > 0) filter.usedCount = { $lt: voucher.usageLimit }
    if (voucher.perUserLimit > 0) {
        filter.$expr = {
            $lt: [
                { $size: { $filter: { input: '$usedBy', cond: { $eq: ['$$this.user', userId] } } } },
                voucher.perUserLimit
            ]
        }
    }
    const updated = await Voucher.findOneAndUpdate(
        filter,
        { $inc: { usedCount: 1 }, $push: { usedBy: { user: userId, at } } },
        { new: true }
    )
    return updated ? { voucher: updated, at } : null
}

// Undoes claimVoucher (used when the order could not be saved)
const releaseVoucher = async (claim, userId) => {
    try {
        await Voucher.updateOne(
            { _id: claim.voucher._id },
            { $inc: { usedCount: -1 }, $pull: { usedBy: { user: userId, at: claim.at } } }
        )
    } catch (error) {
        console.error('Could not release voucher:', error.message)
    }
}

const publicVoucher = (v) => ({
    code: v.code,
    description: v.description,
    discountType: v.discountType,
    discountValue: v.discountValue,
    minPurchase: v.minPurchase,
    maxDiscount: v.maxDiscount,
    expiresAt: v.expiresAt
})

const errorResponse = (res, error) => {
    if (error && error.code === 11000) {
        return res.status(400).json({ message: 'A voucher with that code already exists' })
    }
    if (error && error.name === 'ValidationError') {
        return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') })
    }
    if (error && error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid value for ' + error.path })
    }
    console.error(error)
    return res.status(500).json({ message: error.message || 'Something went wrong' })
}

// ---------- customer endpoints ----------

// Check a code against the current cart  =>  POST /api/v1/voucher/validate   body: { code, itemsPrice }
// This is only a preview - the order endpoint checks everything again when the order is placed.
exports.validateVoucher = async (req, res) => {
    try {
        const { code, itemsPrice } = req.body || {}
        if (!code || !String(code).trim()) {
            return res.status(400).json({ message: 'Please enter a voucher code' })
        }
        const subtotal = Number(itemsPrice)
        if (!Number.isFinite(subtotal) || subtotal < 0) {
            return res.status(400).json({ message: 'Invalid cart total' })
        }

        const voucher = await findVoucherByCode(code)
        const problem = getVoucherError(voucher, req.user._id, subtotal)
        if (problem) return res.status(400).json({ message: problem })

        res.status(200).json({
            success: true,
            voucher: publicVoucher(voucher),
            discount: calculateDiscount(voucher, subtotal)
        })
    } catch (error) {
        errorResponse(res, error)
    }
}

// Vouchers the signed-in customer can still use  =>  GET /api/v1/vouchers/available
exports.getAvailableVouchers = async (req, res) => {
    try {
        const now = new Date()
        const vouchers = await Voucher.find({
            isActive: true,
            $and: [
                { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
                { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] }
            ]
        }).sort({ createdAt: -1 })

        const usable = vouchers.filter(v =>
            !(v.usageLimit > 0 && v.usedCount >= v.usageLimit) &&
            !(v.perUserLimit > 0 && timesUsedBy(v, req.user._id) >= v.perUserLimit)
        )
        res.status(200).json({ success: true, vouchers: usable.map(publicVoucher) })
    } catch (error) {
        errorResponse(res, error)
    }
}

// ---------- admin endpoints ----------

const EDITABLE_FIELDS = [
    'code', 'description', 'discountType', 'discountValue', 'minPurchase',
    'maxDiscount', 'usageLimit', 'perUserLimit', 'startsAt', 'expiresAt', 'isActive'
]

const pickFields = (body = {}) => {
    const data = {}
    EDITABLE_FIELDS.forEach(field => {
        if (body[field] !== undefined) {
            // an empty date box means "no date"
            data[field] = (field === 'startsAt' || field === 'expiresAt') && body[field] === '' ? null : body[field]
        }
    })
    return data
}

// POST /api/v1/admin/voucher/new
exports.newVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.create(pickFields(req.body))
        res.status(201).json({ success: true, voucher })
    } catch (error) {
        errorResponse(res, error)
    }
}

// GET /api/v1/admin/vouchers
exports.getAdminVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find().select('-usedBy').sort({ createdAt: -1 })
        res.status(200).json({ success: true, vouchers })
    } catch (error) {
        errorResponse(res, error)
    }
}

// PUT /api/v1/admin/voucher/:id
exports.updateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id)
        if (!voucher) return res.status(404).json({ message: 'Voucher not found' })

        voucher.set(pickFields(req.body))
        await voucher.save()
        res.status(200).json({ success: true, voucher })
    } catch (error) {
        errorResponse(res, error)
    }
}

// DELETE /api/v1/admin/voucher/:id
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id)
        if (!voucher) return res.status(404).json({ message: 'Voucher not found' })
        res.status(200).json({ success: true })
    } catch (error) {
        errorResponse(res, error)
    }
}

exports.roundMoney = roundMoney
exports.findVoucherByCode = findVoucherByCode
exports.calculateDiscount = calculateDiscount
exports.getVoucherError = getVoucherError
exports.claimVoucher = claimVoucher
exports.releaseVoucher = releaseVoucher
