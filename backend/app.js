const express = require('express');
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser')
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const voucher = require('./routes/voucher');

// app.use(cors());
// Which website may call this API. On Render, set FRONTEND_URL to your Vercel address
// (several addresses can be separated with commas).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''))
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1', voucher);

module.exports = app