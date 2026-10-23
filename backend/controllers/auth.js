const User = require('../models/user');
const mongoose = require('mongoose')
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const sendToken = require('../utils/jwtToken');
   const { initializeApp, getApps, cert } = require('firebase-admin/app')
   const { getAuth } = require('firebase-admin/auth')
   const path = require('path')

   if (!getApps().length) {
       initializeApp({
           credential: cert(require(path.join(__dirname, '../config/firebase-service-account.json'))),
       })
   }

// A simple purple avatar with the user's first letter - used when nobody uploads a photo
const defaultAvatar = (name = '') => {
    const first = String(name).trim().charAt(0).toUpperCase()
    const letter = /^[A-Z0-9]$/.test(first) ? first : '?'
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">' +
        '<rect width="150" height="150" fill="#7e3d84"/>' +
        '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">' +
        letter + '</text></svg>'
    return {
        public_id: 'default_avatar',
        url: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    }
}

// Register: name, email and password are enough. The avatar is optional (set it later in "Set up your profile").
exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body || {}

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please enter your name, email and password' })
        }

        let avatarData = defaultAvatar(name)
        if (avatar) {
            const result = await cloudinary.v2.uploader.upload(avatar, {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            })
            avatarData = { public_id: result.public_id, url: result.secure_url }
        }

        const user = await User.create({ name, email, password, avatar: avatarData })
        const token = user.getJwtToken()

        // never send the password hash back to the browser
        const safeUser = user.toObject()
        delete safeUser.password

        return res.status(201).json({
            success: true,
            user: safeUser,
            token
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This email is already registered' })
        }
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(e => e.message).join(', ')
            return res.status(400).json({ success: false, message })
        }
        console.log(error)
        return res.status(500).json({ success: false, message: 'Could not create your account. Please try again.' })
    }
}

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        // Checks if email and password is entered by user
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter email & password' })
        }

        // Finding user in database (password is select:false, so ask for it explicitly)
        const user = await User.findOne({ email }).select('+password')
        if (!user) {
            return res.status(401).json({ message: 'Invalid Email or Password' })
        }

        // Checks if password is correct or not
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return res.status(401).json({ message: 'Invalid Email or Password' })
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' })
        }

        user.password = undefined // never send the hash back
        sendToken(user, 200, res)
    } catch (err) {
        console.error('Login error:', err)
        return res.status(500).json({ message: 'Login failed: ' + err.message })
    }
}

exports.socialLogin = async (req, res) => {
    try {
        const { idToken } = req.body || {}
        if (!idToken) {
            return res.status(400).json({ message: 'Missing login token' })
        }

        const decoded = await getAuth().verifyIdToken(idToken)
        const { email, name, picture, uid } = decoded
        if (!email) {
            return res.status(400).json({ message: 'Your account has no email. Please use another login method.' })
        }

        let user = await User.findOne({ email })

        if (user && user.deletedAt) {
            return res.status(403).json({ message: 'This account has been deactivated' })
        }

        if (user && user.isActive === false) {
            return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' })
        }

        if (!user) {
            user = await User.create({
                name: (name || email.split('@')[0]).slice(0, 30),
                email,
                // the schema requires a password, so give social users a random one they never use
                password: crypto.randomBytes(24).toString('hex'),
                avatar: {
                    public_id: `social_${uid}`,
                    url: picture || 'https://res.cloudinary.com/demo/image/upload/avatar.png',
                },
            })
        }

        user.password = undefined
        sendToken(user, 200, res)
    } catch (err) {
        console.error('Social login error:', err.message)
        return res.status(401).json({ message: 'Social login failed' })
    }
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })

    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });

}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

// Update my profile. Every field is optional - only the ones that are sent get changed.
// name, email, phoneNo, address (house no. & street), barangay, city, province, postalCode, country, avatar (base64 image)
exports.updateProfile = async (req, res, next) => {
    try {
        const body = req.body || {}
        const newUserData = {}

        // name / email can be changed but never blanked
        if (body.name && String(body.name).trim()) newUserData.name = String(body.name).trim()
        if (body.email && String(body.email).trim()) newUserData.email = String(body.email).trim()

        // optional details (an empty string clears them)
        for (const field of ['phoneNo', 'address', 'barangay', 'city', 'province', 'postalCode', 'country']) {
            if (body[field] !== undefined) newUserData[field] = body[field]
        }

        // new avatar photo
        if (body.avatar) {
            const current = await User.findById(req.user.id)
            // the generated letter avatar is not stored on Cloudinary, so there is nothing to remove
            if (current && current.avatar && current.avatar.public_id && current.avatar.public_id !== 'default_avatar') {
                try { await cloudinary.v2.uploader.destroy(current.avatar.public_id) } catch (e) { console.log(e) }
            }
            const result = await cloudinary.v2.uploader.upload(body.avatar, {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            })
            newUserData.avatar = {
                public_id: result.public_id,
                url: result.secure_url
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
        })
        if (!user) {
            return res.status(401).json({ message: 'User Not Updated' })
        }

        return res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'That email is already used by another account' })
        }
        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(e => e.message).join(', ')
            return res.status(400).json({ success: false, message })
        }
        console.log(error)
        return res.status(500).json({ success: false, message: 'Could not update your profile' })
    }
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    });

}

exports.allUsers = async (req, res, next) => {
    // ?deleted=true lists the trash, otherwise only active users
    const filter = req.query.deleted === 'true' ? { deletedAt: { $ne: null } } : { deletedAt: null }
    const users = await User.find(filter);
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    user.deletedAt = new Date()
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({
        success: true,
    })
}

exports.restoreUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: `User does not found with id: ${req.params.id}` })
    }

    user.deletedAt = null
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({
        success: true,
    })
}

// Admin: activate / inactivate an account (PUT body: { isActive: true | false })
exports.setUserActive = async (req, res, next) => {
    const { isActive } = req.body || {}
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be true or false' })
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: `User does not found with id: ${req.params.id}` })
    }
    if (!isActive && String(user._id) === String(req.user._id)) {
        return res.status(400).json({ message: 'You cannot inactivate your own account' })
    }

    user.isActive = isActive
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({
        success: true,
        isActive: user.isActive,
    })
}

// Admin: permanently remove users that are already in the trash (body: { ids: [...] })
exports.permanentDeleteUsers = async (req, res, next) => {
    const { ids } = req.body || {}

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Select at least one user to delete permanently' })
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))

    // deletedAt: { $ne: null } -> never touches an active user
    const users = await User.find({ _id: { $in: validIds }, deletedAt: { $ne: null } })
    if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'No deleted users found' })
    }

    // remove uploaded avatars from Cloudinary (skip the shared default / social-login pictures)
    for (const user of users) {
        const id = user.avatar && user.avatar.public_id
        if (id && !id.includes('default_avatar') && !id.startsWith('social_')) {
            try { await cloudinary.v2.uploader.destroy(id) } catch (e) { console.log(e) }
        }
    }

    const result = await User.deleteMany({ _id: { $in: users.map(u => u._id) } })

    return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} user(s) permanently deleted`
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        // useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please enter name, email and password' })
        }
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' })
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ success: false, message: 'A user with this email already exists' })
        }

        await User.create({
            name,
            email,
            password,
            role: role || 'user',
            // avatar is required by the model; use a default for admin-created users
            avatar: {
                public_id: 'avatars/default_avatar',
                url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg'
            }
        })

        return res.status(201).json({ success: true, message: 'User created' })
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
    }
}

exports.logout = async (req, res, next) => {
    res.clearCookie('token', sendToken.getCookieOptions())

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    })
}