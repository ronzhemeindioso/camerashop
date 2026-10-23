const mongoose = require('mongoose')

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please enter a voucher code'],
        unique: true,
        uppercase: true,
        trim: true,
        minLength: [3, 'Voucher code must be at least 3 characters'],
        maxLength: [30, 'Voucher code cannot exceed 30 characters'],
        match: [/^[A-Z0-9_-]+$/, 'Voucher code can only contain letters, numbers, dashes and underscores']
    },
    description: {
        type: String,
        trim: true,
        maxLength: [200, 'Description cannot exceed 200 characters']
    },
    // 'percent' = % off the items subtotal, 'fixed' = a flat amount off
    discountType: {
        type: String,
        enum: { values: ['percent', 'fixed'], message: 'Discount type must be percent or fixed' },
        default: 'percent'
    },
    discountValue: {
        type: Number,
        required: [true, 'Please enter the discount value'],
        min: [0.01, 'Discount value must be greater than 0'],
        validate: {
            validator: function (value) {
                return this.discountType !== 'percent' || value <= 100
            },
            message: 'A percentage discount cannot be more than 100'
        }
    },
    // items subtotal must reach this amount before the voucher works (0 = no minimum)
    minPurchase: {
        type: Number,
        default: 0,
        min: [0, 'Minimum purchase cannot be negative']
    },
    // upper limit on a percentage discount (0 = no cap)
    maxDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Maximum discount cannot be negative']
    },
    // how many times the voucher can be used in total (0 = unlimited)
    usageLimit: {
        type: Number,
        default: 0,
        min: [0, 'Usage limit cannot be negative']
    },
    // how many times one customer can use it (0 = unlimited)
    perUserLimit: {
        type: Number,
        default: 1,
        min: [0, 'Per-user limit cannot be negative']
    },
    usedCount: {
        type: Number,
        default: 0
    },
    usedBy: [
        {
            _id: false,
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now }
        }
    ],
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Voucher', voucherSchema)
