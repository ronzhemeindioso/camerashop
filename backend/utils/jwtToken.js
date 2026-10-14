// Shared cookie options so login and logout always match.
// Computed per call because .env is loaded after this file is required.
const getCookieOptions = () => {
    const isProd = (process.env.NODE_ENV || '').toUpperCase() === 'PRODUCTION'
    return {
        httpOnly: true,
        // sameSite 'none' requires Secure (https). In local dev (http://localhost) use 'lax'.
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    }
}

const sendToken = (user, statusCode, res) => {

    // Create Jwt token
    const token = user.getJwtToken();

    const options = {
        ...getCookieOptions(),
        expires: new Date(
            Date.now() + (Number(process.env.COOKIE_EXPIRES_TIME) || 7) * 24 * 60 * 60 * 1000
        ),
    }
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    })

}

sendToken.getCookieOptions = getCookieOptions
module.exports = sendToken;