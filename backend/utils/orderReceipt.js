const PDFDocument = require('pdfkit');

const STORE_NAME = () => process.env.SMTP_FROM_NAME || 'ShopIT'

const money = (n) => `$${Number(n || 0).toFixed(2)}`
const escapeHtml = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }) : '-'
const lineTotal = (item) => Number(item.price) * Number(item.quantity)

// ---------- status wording ----------
const STATUS_TEXT = {
    Processing: 'We are preparing your order.',
    Shipped: 'Good news - your order is on its way.',
    Delivered: 'Your order has been delivered. Thank you for shopping with us!',
    Returned: 'We have recorded the return of your order.',
    Refunded: 'We have recorded a refund for your order.'
}

// ---------- style (plain, formal) ----------
const C = { text: '#2a1633', muted: '#6b5d73', line: '#e2d6e8', rule: '#7e3d84', head: '#f3ecf6', dark: '#2a1633', main: '#7e3d84', light: '#e6d8ef' }

// ---------- HTML email body (table layout + inline styles for email clients) ----------
const EMAIL_HEADLINE = {
    Processing: 'Order Received!',
    Shipped: 'Your Order Is On Its Way!',
    Delivered: 'Order Delivered!',
    Returned: 'Return Recorded',
    Refunded: 'Refund Recorded'
}

exports.buildOrderEmailHtml = (order, customerName) => {
    const s = order.shippingInfo || {}
    const store = STORE_NAME()
    const sans = 'font-family:Arial,Helvetica,sans-serif;'
    const shortId = String(order._id).slice(-8)
    const headline = EMAIL_HEADLINE[order.orderStatus] || 'Order Update'

    const itemRows = order.orderItems.map(item => `
        <tr>
            <td style="padding:14px 0;border-bottom:1px solid ${C.head};font-size:15px;color:${C.dark};">${escapeHtml(item.name)} <span style="color:${C.muted};">(${item.quantity})</span></td>
            <td style="padding:14px 0;border-bottom:1px solid ${C.head};font-size:15px;color:${C.dark};text-align:right;white-space:nowrap;">${money(lineTotal(item))}</td>
        </tr>`).join('')

    const smallRow = (label, value) => `
        <tr>
            <td style="padding:8px 0 0;font-size:13px;color:${C.muted};">${label}</td>
            <td style="padding:8px 0 0;font-size:13px;color:${C.muted};text-align:right;">${value}</td>
        </tr>`

    const tracking = order.trackingNumber ? `
        <tr><td style="padding:0 32px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="background:${C.head};border-radius:10px;padding:14px 18px;font-size:14px;color:${C.dark};">
                    <span style="color:${C.muted};font-size:12px;letter-spacing:1px;text-transform:uppercase;">Tracking number</span><br>
                    <b style="font-size:16px;letter-spacing:1px;">${escapeHtml(order.trackingNumber)}</b>
                </td>
            </tr></table>
        </td></tr>` : ''

    return `
    <div style="background:#f3f1f4;padding:20px 10px;${sans}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${C.dark};padding:20px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="width:36px;height:36px;background:${C.main};border-radius:9px;text-align:center;color:#ffffff;font-size:18px;font-weight:bold;line-height:36px;">${escapeHtml(store.charAt(0).toUpperCase())}</td>
                <td style="padding-left:12px;font-size:20px;font-weight:bold;color:#ffffff;">${escapeHtml(store)}</td>
            </tr></table>
        </td></tr>

        <tr><td align="center" style="padding:40px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="width:68px;height:68px;background:${C.head};border-radius:34px;text-align:center;color:${C.main};font-size:30px;line-height:68px;">&#10003;</td>
            </tr></table>
            <h1 style="margin:22px 0 10px;font-size:26px;color:${C.main};">${escapeHtml(headline)}</h1>
            <p style="margin:0;font-size:15px;line-height:1.6;color:${C.muted};">Hi ${escapeHtml(customerName || 'there')},<br>${escapeHtml(STATUS_TEXT[order.orderStatus] || 'Your order has been updated.')}</p>
        </td></tr>

        <tr><td style="padding:26px 32px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.head};border-radius:10px;padding:15px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="font-size:15px;font-weight:bold;color:${C.dark};">Order Confirmation No.</td>
                    <td style="font-size:15px;font-weight:bold;color:${C.dark};text-align:right;" title="${order._id}">#${shortId}</td>
                </tr></table>
            </td></tr></table>
        </td></tr>
        ${tracking}

        <tr><td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
                <tr><td colspan="2" style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${smallRow('Items subtotal', money(order.itemsPrice))}
                    ${smallRow('Shipping', money(order.shippingPrice))}
                    ${smallRow('Tax', money(order.taxPrice))}
                </table></td></tr>
                <tr>
                    <td style="padding:16px 0 0;border-top:1px solid ${C.head};font-size:15px;font-weight:bold;letter-spacing:.5px;color:${C.dark};">TOTAL</td>
                    <td style="padding:16px 0 0;border-top:1px solid ${C.head};font-size:17px;font-weight:bold;color:${C.main};text-align:right;">${money(order.totalPrice)}</td>
                </tr>
            </table>
        </td></tr>

        <tr><td style="padding:28px 32px 36px;font-size:14px;line-height:1.7;color:${C.muted};">
            <div style="font-size:14px;font-weight:bold;color:${C.dark};margin-bottom:6px;">Delivery Address</div>
            ${escapeHtml(s.address)}<br>${escapeHtml(s.city)}, ${escapeHtml(s.postalCode)}<br>${escapeHtml(s.country)}
        </td></tr>

        <tr><td align="center" style="background:${C.dark};padding:30px 32px;">
            <div style="font-size:16px;color:#ffffff;">Please see the attached PDF for your full receipt.</div>
            <div style="font-size:13px;color:${C.light};margin-top:8px;">Thanks for shopping with us!</div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin:0 auto;padding:16px 0 4px;text-align:center;font-size:12px;color:${C.muted};">Order placed ${fmtDate(order.createdAt)} &middot; ${escapeHtml(store)}</div>
    </div>`
}

// ---------- PDF receipt (resolves with a Buffer) ----------
exports.buildReceiptPdf = (order, customerName) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width, H = doc.page.height
    const left = 50, right = W - 50
    const colQty = 320, colPrice = 380, colSub = 465
    const colW = { name: colQty - left - 16, qty: 50, price: 80, sub: right - colSub }

    const footer = () => {
        doc.moveTo(left, H - 55).lineTo(right, H - 55).lineWidth(1).strokeColor(C.main).stroke()
        doc.fillColor(C.muted).font('Helvetica').fontSize(8)
            .text('Thank you for your purchase. This receipt was generated automatically.', left, H - 42, { width: right - left, align: 'center', lineBreak: false })
    }

    // header
    doc.rect(0, 0, W, 10).fill(C.main)
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(22).text(STORE_NAME(), left, 50, { lineBreak: false })
    doc.font('Helvetica').fontSize(9).fillColor(C.main).text('OFFICIAL RECEIPT', left, 78, { characterSpacing: 1.5, lineBreak: false })
    doc.fillColor(C.text).fontSize(9)
        .text(`Order No.: ${order._id}`, 300, 52, { width: right - 300, align: 'right', lineBreak: false })
        .text(`Date: ${fmtDate(order.paidAt || order.createdAt)}`, 300, 66, { width: right - 300, align: 'right', lineBreak: false })
        .text(`Status: ${order.orderStatus}`, 300, 80, { width: right - 300, align: 'right', lineBreak: false })
    doc.moveTo(left, 100).lineTo(right, 100).lineWidth(1.5).strokeColor(C.rule).stroke()

    // billing / payment
    const s = order.shippingInfo || {}
    const pay = order.paymentInfo || {}
    const y0 = 120
    doc.fillColor(C.main).font('Helvetica-Bold').fontSize(8)
        .text('BILLED TO', left, y0, { characterSpacing: 1, lineBreak: false })
        .text('PAYMENT', 320, y0, { characterSpacing: 1, lineBreak: false })
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(10).text(customerName || '-', left, y0 + 16, { width: 230 })
    doc.font('Helvetica').fontSize(10)
        .text(`${s.address || ''}`, left, doc.y + 2, { width: 230 })
        .text(`${s.city || ''} ${s.postalCode || ''}, ${s.country || ''}`, left, doc.y, { width: 230 })
        .text(`Phone: ${s.phoneNo || '-'}`, left, doc.y, { width: 230 })
    const leftBottom = doc.y
    doc.font('Helvetica').fontSize(10)
        .text(`Status: ${pay.status || '-'}`, 320, y0 + 16, { width: right - 320 })
        .text(`Reference: ${pay.id || '-'}`, 320, doc.y + 2, { width: right - 320 })
    if (order.trackingNumber) doc.text(`Tracking: ${order.trackingNumber}`, 320, doc.y + 2, { width: right - 320 })

    // items table
    let y = Math.max(leftBottom, doc.y) + 26
    const drawTableHeader = (yy) => {
        doc.rect(left, yy, right - left, 22).fill(C.dark)
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
        doc.text('Item', left + 8, yy + 7, { width: colW.name, lineBreak: false })
        doc.text('Qty', colQty, yy + 7, { width: colW.qty, align: 'center', lineBreak: false })
        doc.text('Price', colPrice, yy + 7, { width: colW.price, align: 'right', lineBreak: false })
        doc.text('Subtotal', colSub, yy + 7, { width: colW.sub - 8, align: 'right', lineBreak: false })
        return yy + 28
    }
    y = drawTableHeader(y)

    for (const item of order.orderItems) {
        doc.font('Helvetica').fontSize(10)
        const nameH = doc.heightOfString(item.name, { width: colW.name })
        const rowH = Math.max(nameH, 12) + 14
        if (y + rowH > H - 190) {
            footer(); doc.addPage()
            y = drawTableHeader(50)
        }
        doc.fillColor(C.text).font('Helvetica').fontSize(10)
        doc.text(item.name, left + 8, y, { width: colW.name })
        doc.text(String(item.quantity), colQty, y, { width: colW.qty, align: 'center', lineBreak: false })
        doc.text(money(item.price), colPrice, y, { width: colW.price, align: 'right', lineBreak: false })
        doc.text(money(lineTotal(item)), colSub, y, { width: colW.sub - 8, align: 'right', lineBreak: false })
        y += rowH
        doc.moveTo(left, y - 6).lineTo(right, y - 6).lineWidth(0.5).strokeColor(C.line).stroke()
    }

    // totals
    if (y + 110 > H - 60) { footer(); doc.addPage(); y = 50 }
    y += 6
    const tx = 340
    const totalLine = (label, value) => {
        doc.font('Helvetica').fontSize(10).fillColor(C.muted).text(label, tx, y, { width: 110, lineBreak: false })
        doc.fillColor(C.text).text(value, colSub, y, { width: colW.sub - 8, align: 'right', lineBreak: false })
        y += 17
    }
    totalLine('Items subtotal', money(order.itemsPrice))
    totalLine('Shipping', money(order.shippingPrice))
    totalLine('Tax', money(order.taxPrice))
    doc.moveTo(tx, y + 2).lineTo(right, y + 2).lineWidth(1.5).strokeColor(C.rule).stroke()
    y += 10
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.dark).text('Grand total', tx, y, { width: 110, lineBreak: false })
    doc.fillColor(C.main).fontSize(13).text(money(order.totalPrice), colSub, y, { width: colW.sub - 8, align: 'right', lineBreak: false })

    footer()
    doc.end()
})
