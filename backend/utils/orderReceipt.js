const PDFDocument = require('pdfkit');

const STORE_NAME = () => process.env.SMTP_FROM_NAME || 'ShopIT'

// HTML email can show the peso sign; the PDF's built-in Helvetica font has no peso glyph, so the PDF uses "PHP"
const money = (n) => `\u20B1${Number(n || 0).toFixed(2)}`
const pdfMoney = (n) => `PHP ${Number(n || 0).toFixed(2)}`
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
                    ${order.discountPrice > 0 ? smallRow(`Voucher${order.voucher && order.voucher.code ? ' (' + order.voucher.code + ')' : ''}`, '-' + money(order.discountPrice)) : ''}
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
// Simple, formal layout in the store theme:
//   header (store + order details)  ->  Billed to / Payment  ->  items table  ->  totals
exports.buildReceiptPdf = (order, customerName, customerEmail) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Receipt - Order ${order._id}`, Author: STORE_NAME() } })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width, H = doc.page.height
    const L = 50, R = W - 50
    const X2 = 330                                   // right-hand column
    const colQty = 330, colPrice = 380, colSub = 465
    const nameW = colQty - L - 24
    const s = order.shippingInfo || {}
    const pay = order.paymentInfo || {}
    const paid = pay.status === 'succeeded'
    const orderNo = String(order._id).slice(-8).toUpperCase()
    const payText = order.orderStatus === 'Refunded' ? 'Refunded' : (paid ? 'Paid' : 'Unpaid')

    const heading = (text, x, y) => doc.fillColor(C.main).font('Helvetica-Bold').fontSize(8.5)
        .text(text.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false })
    // plain text line, returns next y
    const line = (text, x, y, w, opts = {}) => {
        doc.fillColor(opts.color || C.text).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        const h = doc.heightOfString(String(text), { width: w })
        doc.text(String(text), x, y, { width: w })
        return y + h + 4
    }
    // "Label   value" row, returns next y
    const row = (name, value, x, y, w, labelW, bold = false) => {
        doc.fillColor(C.muted).font('Helvetica').fontSize(10).text(name, x, y, { width: labelW, lineBreak: false })
        doc.fillColor(C.text).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        const h = doc.heightOfString(String(value), { width: w - labelW })
        doc.text(String(value), x + labelW, y, { width: w - labelW })
        return y + Math.max(h, 12) + 4
    }

    const footer = () => {
        doc.moveTo(L, H - 60).lineTo(R, H - 60).lineWidth(0.5).strokeColor(C.line).stroke()
        doc.fillColor(C.muted).font('Helvetica').fontSize(8)
            .text(`${STORE_NAME()}  |  Thank you for your purchase. This receipt was generated automatically.`, L, H - 46, { width: R - L, align: 'center', lineBreak: false })
    }

    // ----- header: store name left, order details right -----
    doc.rect(0, 0, W, 10).fill(C.main)
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(22).text(STORE_NAME(), L, 46, { width: X2 - L - 10, lineBreak: false, ellipsis: true })
    doc.fillColor(C.main).font('Helvetica').fontSize(9)
        .text('OFFICIAL RECEIPT', L, 76, { characterSpacing: 2, lineBreak: false })
    const meta = [['Order No.', `#${orderNo}`], ['Date', fmtDate(order.paidAt || order.createdAt)], ['Status', order.orderStatus]]
    meta.forEach(([k, v], i) => {
        const yy = 46 + i * 15
        doc.fillColor(C.muted).font('Helvetica').fontSize(9.5).text(k, 330, yy, { width: 70, lineBreak: false })
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9.5).text(v, 400, yy, { width: R - 400, align: 'right', lineBreak: false })
    })
    doc.moveTo(L, 104).lineTo(R, 104).lineWidth(1.5).strokeColor(C.rule).stroke()

    // ----- left: billed to + delivery address | right: payment -----
    const top = 124
    const lw = X2 - L - 30
    heading('Billed to', L, top)
    let yL = top + 18
    yL = line(customerName || '-', L, yL, lw, { bold: true })
    if (customerEmail) yL = line(customerEmail, L, yL, lw)
    yL = line(`Phone: ${s.phoneNo || '-'}`, L, yL, lw)

    yL += 10
    heading('Delivery address', L, yL)
    yL += 18
    yL = line(s.address || '-', L, yL, lw)
    yL = line(`${s.city || ''}, ${s.postalCode || ''}`, L, yL, lw)
    yL = line(s.country || '-', L, yL, lw)
    if (order.trackingNumber) yL = line(`Tracking no.: ${order.trackingNumber}`, L, yL + 2, lw)

    heading('Payment', X2, top)
    let yR = top + 18
    yR = row('Status', payText, X2, yR, R - X2, 62, true)
    if (order.paidAt) yR = row('Paid on', fmtDate(order.paidAt), X2, yR, R - X2, 62)
    yR = row('Reference', pay.id || '-', X2, yR, R - X2, 62)

    // ----- items table -----
    let y = Math.max(yL, yR) + 22
    const tableHeader = (yy) => {
        doc.rect(L, yy, R - L, 24).fill(C.dark)
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
        doc.text('Item', L + 10, yy + 8, { width: nameW, lineBreak: false })
        doc.text('Qty', colQty, yy + 8, { width: 40, align: 'center', lineBreak: false })
        doc.text('Price', colPrice, yy + 8, { width: 75, align: 'right', lineBreak: false })
        doc.text('Subtotal', colSub, yy + 8, { width: R - colSub - 10, align: 'right', lineBreak: false })
        return yy + 34
    }
    y = tableHeader(y)

    for (const item of order.orderItems) {
        doc.font('Helvetica').fontSize(10)
        const rowH = Math.max(doc.heightOfString(item.name, { width: nameW }), 12) + 16
        if (y + rowH > H - 85) {            // no room left on this page: continue on a new page
            footer(); doc.addPage()
            y = tableHeader(50)
        }
        doc.fillColor(C.text).font('Helvetica').fontSize(10)
        doc.text(item.name, L + 10, y, { width: nameW })
        doc.text(String(item.quantity), colQty, y, { width: 40, align: 'center', lineBreak: false })
        doc.text(pdfMoney(item.price), colPrice, y, { width: 75, align: 'right', lineBreak: false })
        doc.text(pdfMoney(lineTotal(item)), colSub, y, { width: R - colSub - 10, align: 'right', lineBreak: false })
        y += rowH
        doc.moveTo(L, y - 7).lineTo(R, y - 7).lineWidth(0.5).strokeColor(C.line).stroke()
    }

    // ----- totals (right, directly under the items) -----
    if (y + 110 > H - 70) { footer(); doc.addPage(); y = 50 }
    y += 6
    const totalLine = (name, value) => {
        doc.font('Helvetica').fontSize(10).fillColor(C.muted).text(name, X2, y, { width: 110, lineBreak: false })
        doc.fillColor(C.text).text(value, X2 + 110, y, { width: R - X2 - 120, align: 'right', lineBreak: false })
        y += 18
    }
    totalLine('Items subtotal', pdfMoney(order.itemsPrice))
    if (order.discountPrice > 0) totalLine(`Voucher${order.voucher && order.voucher.code ? ` (${order.voucher.code})` : ''}`, '-' + pdfMoney(order.discountPrice))
    totalLine('Shipping', Number(order.shippingPrice) > 0 ? pdfMoney(order.shippingPrice) : 'Free')
    totalLine('Tax', pdfMoney(order.taxPrice))
    doc.moveTo(X2, y + 2).lineTo(R, y + 2).lineWidth(1.5).strokeColor(C.rule).stroke()
    y += 12
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.dark).text('Grand total', X2, y, { width: 110, lineBreak: false })
    doc.fillColor(C.main).fontSize(13).text(pdfMoney(order.totalPrice), X2 + 90, y - 1, { width: R - X2 - 100, align: 'right', lineBreak: false })

    footer()
    doc.end()
})