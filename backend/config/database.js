const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 10000 }).then(con => {
        console.log(`MongoDB Database connected with HOST: ${con.connection.host}`)
    }).catch(err => {
        // Without this the process dies silently and every login fails
        console.error('MongoDB connection FAILED:', err.message)
    })
}

module.exports = connectDatabase