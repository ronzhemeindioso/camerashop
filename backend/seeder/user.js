const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../config/.env') });

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        avatar: {
            public_id: 'avatars/default_avatar',
            url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg'
        }
    },
    {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'customer123',
        role: 'user',
        avatar: {
            public_id: 'avatars/default_avatar',
            url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg'
        }
    }
];

const seedUsers = async () => {
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with HOST: ${con.connection.host}`);

        await User.deleteMany();
        console.log('Old users cleared...');

        await User.create(users);
        console.log('✅ Users seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ User seeding failed:', error.message);
        process.exit(1);
    }
};

seedUsers();