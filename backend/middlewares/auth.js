const User = require('../models/user')
const jwt = require("jsonwebtoken")

// Token can come from the httpOnly cookie or an "Authorization: Bearer <token>" header
const getTokenFromRequest = (req) => {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token
    }
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer ')) {
        const bearer = header.split(' ')[1]
        if (bearer && bearer !== 'false' && bearer !== 'null' && bearer !== 'undefined') {
            return bearer
        }
    }
    return null
}

exports.isAuthenticatedUser = async (req, res, next) => {
    const token = getTokenFromRequest(req)

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token, please login again' })
    }
    if (!req.user || req.user.deletedAt) {
        return res.status(401).json({ message: 'User not found, please login again' })
    }

    if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' })
    }

    next()
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })
        }
        next()
    }
}