const nodemailer = require('nodemailer');

// options:
//   email        - recipient
//   subject      - subject line
//   message      - plain text (wrapped in <p>) - used when `html` is not given
//   html         - full HTML body (optional, overrides `message`)
//   attachments  - nodemailer attachments, e.g. [{ filename, content: Buffer, contentType }] (optional)
const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || `<p>${options.message}</p>`
    }

    if (options.message) message.text = options.message
    if (options.attachments && options.attachments.length) message.attachments = options.attachments

    await transporter.sendMail(message)
}

module.exports = sendEmail;
