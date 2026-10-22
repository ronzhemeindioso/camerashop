const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be longer than 6 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    // Optional profile details (filled in on the "Set up your profile" page, can be skipped)
    phoneNo: {
        type: String,
        default: '',
        trim: true,
        maxLength: [20, 'Phone number is too long']
    },
    address: {
        type: String,
        default: '',
        trim: true,
        maxLength: [200, 'Address is too long']
    },
    barangay: {
        type: String,
        default: '',
        trim: true,
        maxLength: [80, 'Barangay is too long']
    },
    city: {
        type: String,
        default: '',
        trim: true,
        maxLength: [60, 'City is too long']
    },
    province: {
        type: String,
        default: '',
        trim: true,
        maxLength: [60, 'Province is too long']
    },
    postalCode: {
        type: String,
        default: '',
        trim: true,
        maxLength: [12, 'Postal code is too long']
    },
    country: {
        type: String,
        default: '',
        trim: true
    },
    role: {
        type: String,
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Soft delete: null = active, a date = deleted at that time (row is kept in the DB)
    deletedAt: {
        type: Date,
        default: null
    }
})
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10)
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Set token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

    return resetToken

}

module.exports = mongoose.model('User', userSchema);