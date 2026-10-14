const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Product = require('../models/product');

dotenv.config({ path: path.join(__dirname, '../config/.env') });

const products = [
    {
        name: 'Sample Laptop',
        price: 120,
        description: 'A great laptop for everyday use.',
        category: 'Laptops',
        seller: 'Dell',
        stock: 25,
        images: [
            {
                public_id: 'products/sample1',
                url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg'
            }
        ]
    },
    {
        name: 'Wireless Headphones',
        price: 200,
        description: 'Noise-cancelling wireless headphones.',
        category: 'Headphones',
        seller: 'Sony',
        stock: 40,
        images: [
            {
                public_id: 'products/sample2',
                url: 'https://res.cloudinary.com/demo/image/upload/v1690000000/sample.jpg'
            }
        ]
    }
];

const seedProducts = async () => {
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with HOST: ${con.connection.host}`);

        await Product.deleteMany();
        console.log('Old products cleared...');

        await Product.create(products);
        console.log('✅ Products seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Product seeding failed:', error.message);
        process.exit(1);
    }
};

seedProducts();