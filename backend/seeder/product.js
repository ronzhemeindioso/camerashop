// Seeds sample products.
//
//   node seeder/product.js            add the sample products that are not in the database yet (nothing is deleted)
//   node seeder/product.js --fresh    delete ALL products first, then add the samples
//
// Photos are Cloudinary demo images (placeholders). Replace them from Admin > Products > Edit.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Product = require('../models/product');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../config/.env') });

const DEMO = 'https://res.cloudinary.com/demo/image/upload';
const photo = (n, file) => ({ public_id: `seed/${n}`, url: `${DEMO}/${file}` });
const PHOTOS = ['sample.jpg', 'cld-sample.jpg', 'cld-sample-2.jpg', 'cld-sample-3.jpg', 'cld-sample-4.jpg', 'cld-sample-5.jpg'];

// name, category, seller, price (sell), costPrice, stock, description
const rows = [
    // Cameras
    ['Mirrorless Camera 24MP', 'Cameras', 'Sony', 42990, 35500, 8, '24MP mirrorless camera with 4K video, fast autofocus and a flip-out screen.'],
    ['Compact Vlogging Camera', 'Cameras', 'Canon', 28500, 23000, 12, 'Pocket-sized camera with a wide lens, built for vlogs and travel.'],
    ['Instant Film Camera', 'Cameras', 'Fujifilm', 5990, 4400, 30, 'Point, shoot and print. Comes with a wrist strap.'],
    ['Action Camera 4K', 'Cameras', 'GoPro', 18900, 15200, 4, 'Waterproof 4K action camera with image stabilization.'],
    // Lenses
    ['50mm f/1.8 Prime Lens', 'Lenses', 'Canon', 7490, 5600, 15, 'Lightweight prime lens with a bright aperture for portraits.'],
    ['24-70mm f/2.8 Zoom Lens', 'Lenses', 'Sony', 79990, 68000, 3, 'Professional standard zoom with constant f/2.8 aperture.'],
    // Tripods & Stabilizers
    ['Aluminum Travel Tripod', 'Tripods & Stabilizers', 'Manfrotto', 3990, 2700, 22, 'Folds down to 40 cm. Supports up to 4 kg.'],
    ['3-Axis Phone Gimbal', 'Tripods & Stabilizers', 'DJI', 6490, 4900, 18, 'Smooth handheld footage with auto face tracking.'],
    // Lighting
    ['LED Ring Light 12"', 'Lighting', 'Neewer', 1490, 850, 40, 'Dimmable ring light with a phone holder and a stand.'],
    ['Softbox Studio Kit', 'Lighting', 'Godox', 4590, 3200, 0, 'Two softboxes with stands and daylight bulbs.'],
    // Memory Cards
    ['128GB SD Card V30', 'Memory Cards', 'SanDisk', 890, 620, 120, 'UHS-I card for 4K video. Up to 170 MB/s read speed.'],
    ['256GB microSD Card', 'Memory Cards', 'Samsung', 1190, 880, 75, 'microSD with an SD adapter. A2 rated for fast app loading.'],
    // Bags & Cases
    ['Camera Backpack 20L', 'Bags & Cases', 'Lowepro', 3290, 2200, 14, 'Padded dividers, rain cover and a laptop sleeve.'],
    ['Hard Lens Case', 'Bags & Cases', 'Pelican', 1790, 1100, 2, 'Crush-proof case with a foam insert.'],
    // Batteries & Chargers
    ['Dual USB Battery Charger', 'Batteries & Chargers', 'Wasabi', 990, 600, 35, 'Charges two batteries at once. Works with most mirrorless models.'],
    // Accessories
    ['Microfiber Cleaning Kit', 'Accessories', 'Giottos', 390, 190, 90, 'Cloth, lens pen and blower for sensors and lenses.'],
    // Electronics
    ['Bluetooth Speaker', 'Electronics', 'JBL', 4290, 3100, 26, 'Portable and waterproof with 12 hours of battery life.'],
    ['Power Bank 20000mAh', 'Electronics', 'Anker', 2190, 1500, 5, 'Fast-charging power bank with two USB ports.'],
    // Laptops
    ['Ultrabook 14" i5', 'Laptops', 'Dell', 45990, 39000, 9, 'Light 14 inch laptop with 16GB RAM and a 512GB SSD.'],
    ['Creator Laptop 16"', 'Laptops', 'ASUS', 78990, 68500, 4, 'OLED display and a dedicated GPU for editing photos and video.'],
    // Headphones
    ['Wireless Noise-Cancelling Headphones', 'Headphones', 'Sony', 12990, 9800, 20, 'Active noise cancelling with 30 hours of playback.'],
    ['In-Ear Earbuds', 'Headphones', 'Samsung', 3490, 2400, 55, 'True wireless earbuds with a charging case.'],
    // Everyday categories
    ['Hand-Roasted Coffee Beans 1kg', 'Food', 'Local Roasters', 890, 520, 60, 'Medium roast, whole beans. Notes of chocolate and caramel.'],
    ['Photography for Beginners', 'Books', 'Lens Press', 690, 380, 25, 'A friendly guide to exposure, composition and editing.'],
    ['Canvas Sneakers', 'Clothes/Shoes', 'Urban Step', 1990, 1100, 32, 'Everyday sneakers with a cushioned insole.'],
    ['Vitamin C Serum', 'Beauty/Health', 'Glow Lab', 790, 420, 48, 'Brightening serum with hyaluronic acid.'],
    ['Yoga Mat 6mm', 'Sports', 'FitLife', 1190, 650, 28, 'Non-slip mat with a carry strap.'],
    ['2-Person Camping Tent', 'Outdoor', 'TrailPro', 3990, 2700, 7, 'Quick-pitch tent, waterproof, with a carry bag.'],
    ['Ceramic Desk Lamp', 'Home', 'Casa', 1490, 850, 16, 'Warm light desk lamp with a touch dimmer.'],
];

const products = rows.map(([name, category, seller, price, costPrice, stock, description], i) => ({
    name, category, seller, price, costPrice, stock, description,
    images: [photo(`product-${i + 1}`, PHOTOS[i % PHOTOS.length])],
}));

const seedProducts = async () => {
    const fresh = process.argv.includes('--fresh');
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with HOST: ${con.connection.host}`);

        if (fresh) {
            const { deletedCount } = await Product.deleteMany();
            console.log(`Old products cleared (${deletedCount})...`);
        }

        // link the products to the admin account when there is one
        const admin = await User.findOne({ role: 'admin' });

        let added = 0;
        let skipped = 0;
        for (const p of products) {
            const exists = await Product.exists({ name: p.name });
            if (exists) { skipped++; continue; }
            await Product.create({ ...p, user: admin ? admin._id : undefined });
            added++;
        }

        console.log(`✅ Products seeded: ${added} added, ${skipped} already existed.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Product seeding failed:', error.message);
        process.exit(1);
    }
};

seedProducts();