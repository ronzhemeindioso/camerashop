const User = require('../models/user');
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

exports.registerUser = async (req, res, next) => {
    console.log(req.body)
    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    }, (err, res) => {
        console.log(err, res);
    });
    const { name, email, password, } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        },
    })
    //test token
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    })
    // sendToken(user, 200, res)
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

exports.updateProfile = async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // Update avatar
    if (req.body.avatar !== '') {
        let user = await User.findById(req.user.id)
        // console.log(user)
        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);
        // console.log("Res", res)
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
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