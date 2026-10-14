require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');

// Prints the variable NAMES in your .env that look like DB settings
console.log('DB-related variables:', Object.keys(process.env).filter(k => /DB|MONGO/i.test(k)));

const uri = process.env.DB_URI || process.env.MONGO_URI || process.env.DB_LOCAL_URI;

mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then(() => { console.log('Connected'); process.exit(0); })
  .catch(err => { console.log('FAILED:', err.code || err.message); process.exit(1); });