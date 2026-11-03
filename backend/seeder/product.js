// Seeds camera-shop products for these categories only:
//   Cameras, Lenses, Tripods & Stabilizers, Lighting, Memory Cards,
//   Bags & Cases, Batteries & Chargers, Accessories
//
//   node seeder/cameraProduct.js            add the sample products that are not in the database yet (nothing is deleted)
//   node seeder/cameraProduct.js --fresh    delete only products in the categories above, then add the samples
//
// Photos are Cloudinary demo images (placeholders). Replace them from Admin > Products > Edit.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Product = require('../models/product');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../config/.env') });

const DEMO = 'https://res.cloudinary.com/demo/image/upload';
const photo = (n, file) => ({ public_id: `seed/camera-${n}`, url: `${DEMO}/${file}` });
const PHOTOS = ['sample.jpg', 'cld-sample.jpg', 'cld-sample-2.jpg', 'cld-sample-3.jpg', 'cld-sample-4.jpg', 'cld-sample-5.jpg'];

const CATEGORIES = [
    'Cameras',
    'Lenses',
    'Tripods & Stabilizers',
    'Lighting',
    'Memory Cards',
    'Bags & Cases',
    'Batteries & Chargers',
    'Accessories',
];

// name, category, seller, price (sell), costPrice, stock, description
const rows = [
    // Cameras
    ['Full-Frame Mirrorless Camera 33MP', 'Cameras', 'Sony', 109990, 94000, 5, '33MP full-frame mirrorless body with real-time eye tracking, 4K 60p video and dual card slots.'],
    ['APS-C Mirrorless Camera 26MP', 'Cameras', 'Fujifilm', 69990, 58500, 7, '26MP APS-C camera with film simulation modes and in-body image stabilization.'],
    ['Beginner DSLR Camera 24MP', 'Cameras', 'Nikon', 34990, 28500, 10, 'Easy-to-use DSLR with a guided menu, Bluetooth transfer and a long-lasting battery.'],
    ['Compact Point-and-Shoot 20MP', 'Cameras', 'Panasonic', 21990, 17400, 14, 'Pocket compact with a 10x optical zoom and built-in Wi-Fi.'],
    ['360° Action Camera', 'Cameras', 'Insta360', 24990, 20100, 6, 'Dual-lens 5.7K camera with invisible selfie stick effect and horizon leveling.'],
    ['Instant Print Camera Mini', 'Cameras', 'Fujifilm', 4990, 3600, 35, 'Credit-card-size instant prints with a selfie mirror and automatic exposure.'],

    // Lenses
    ['35mm f/1.8 Wide Prime Lens', 'Lenses', 'Sigma', 18990, 14800, 9, 'Sharp wide-angle prime for street, travel and low-light shooting.'],
    ['85mm f/1.4 Portrait Lens', 'Lenses', 'Nikon', 54990, 45500, 4, 'Creamy background blur and fast autofocus for professional portraits.'],
    ['70-200mm f/4 Telephoto Zoom', 'Lenses', 'Canon', 42990, 35200, 5, 'Compact telephoto zoom with image stabilization for sports and wildlife.'],
    ['16mm f/1.4 Wide Lens APS-C', 'Lenses', 'Sigma', 24990, 19900, 8, 'Bright wide lens for vlogging, astrophotography and interiors.'],
    ['100mm f/2.8 Macro Lens', 'Lenses', 'Tamron', 39990, 33000, 3, '1:1 macro lens with moisture-resistant construction for close-up detail.'],
    ['Variable ND Filter 67mm', 'Lenses', 'K&F Concept', 1890, 1100, 40, 'Adjustable 2 to 9 stop neutral density filter for video and long exposures.'],

    // Tripods & Stabilizers
    ['Carbon Fiber Travel Tripod', 'Tripods & Stabilizers', 'Manfrotto', 12990, 9800, 11, 'Lightweight carbon legs with a ball head. Supports up to 8 kg.'],
    ['Flexible Mini Tripod', 'Tripods & Stabilizers', 'Joby', 1490, 880, 45, 'Bendable legs that wrap around poles and branches. Fits phones and compact cameras.'],
    ['Monopod with Fluid Base', 'Tripods & Stabilizers', 'Benro', 4290, 3000, 16, 'Four-section aluminum monopod with a three-leg base for steady video.'],
    ['Camera Gimbal Stabilizer', 'Tripods & Stabilizers', 'DJI', 17990, 14200, 6, '3-axis gimbal for mirrorless cameras with a 12-hour battery.'],
    ['Handheld Camera Cage Rig', 'Tripods & Stabilizers', 'SmallRig', 3490, 2300, 19, 'Aluminum cage with cold shoe mounts and 1/4"-20 threads for accessories.'],
    ['Phone Selfie Tripod Stick', 'Tripods & Stabilizers', 'Ulanzi', 890, 480, 60, 'Extendable selfie stick that turns into a tripod, with a Bluetooth remote.'],

    // Lighting
    ['LED Panel Light Bi-Color', 'Lighting', 'Godox', 5490, 3900, 13, 'Adjustable 3200K to 5600K LED panel with a dimmer and battery support.'],
    ['Speedlight Flash TTL', 'Lighting', 'Godox', 6990, 5000, 10, 'Wireless TTL flash with high-speed sync and a fast recycle time.'],
    ['RGB Tube Light 2ft', 'Lighting', 'Neewer', 3990, 2700, 17, 'Pocket tube light with full-color RGB effects and magnetic mounting.'],
    ['Folding Softbox 60cm', 'Lighting', 'Neewer', 1290, 720, 28, 'Collapsible softbox with a grid and a Bowens-style mount.'],
    ['5-in-1 Light Reflector 80cm', 'Lighting', 'Godox', 690, 340, 50, 'Collapsible reflector with translucent, silver, gold, white and black sides.'],
    ['Light Stand 2.8m', 'Lighting', 'Neewer', 1190, 650, 0, 'Air-cushioned aluminum stand that folds down for travel.'],

    // Memory Cards
    ['64GB SD Card V30', 'Memory Cards', 'SanDisk', 590, 400, 150, 'UHS-I SDXC card for Full HD and 4K video. Up to 150 MB/s read speed.'],
    ['256GB SD Card V60', 'Memory Cards', 'Lexar', 2290, 1700, 70, 'UHS-II card for continuous burst shooting and 4K 60p video.'],
    ['512GB CFexpress Type B', 'Memory Cards', 'ProGrade', 14990, 11800, 8, 'High-speed CFexpress card for 8K RAW video and long bursts.'],
    ['128GB microSD A2', 'Memory Cards', 'SanDisk', 790, 540, 110, 'microSD with an SD adapter for action cameras and drones.'],
    ['USB 3.0 Dual Card Reader', 'Memory Cards', 'Anker', 790, 450, 42, 'Reads SD and microSD cards at the same time. Plug and play.'],
    ['Memory Card Case 8 Slots', 'Memory Cards', 'Pelican', 490, 250, 65, 'Water-resistant case that holds four SD and four microSD cards.'],

    // Bags & Cases
    ['Camera Sling Bag 10L', 'Bags & Cases', 'Lowepro', 4590, 3200, 15, 'Quick-access sling with a tripod strap and a tablet pocket.'],
    ['Roller Camera Case 35L', 'Bags & Cases', 'Pelican', 15990, 12000, 3, 'Wheeled hard case with customizable foam dividers for travel.'],
    ['Padded Camera Insert', 'Bags & Cases', 'Peak Design', 2490, 1600, 22, 'Soft padded insert that turns any bag into a camera bag.'],
    ['Waterproof Dry Bag 10L', 'Bags & Cases', 'Sea to Summit', 1190, 650, 34, 'Roll-top dry bag that keeps gear safe from rain and splashes.'],
    ['Lens Pouch Neoprene', 'Bags & Cases', 'Tenba', 690, 350, 48, 'Padded neoprene pouch with a drawstring for mid-size lenses.'],
    ['Mirrorless Camera Half Case', 'Bags & Cases', 'Wasabi', 1490, 850, 20, 'Faux-leather half case with quick battery access and a neck strap.'],

    // Batteries & Chargers
    ['Rechargeable Camera Battery NP-FZ100', 'Batteries & Chargers', 'Wasabi', 1990, 1250, 30, '2280mAh replacement battery for compatible mirrorless bodies.'],
    ['Rechargeable Camera Battery LP-E6NH', 'Batteries & Chargers', 'Canon', 3290, 2500, 18, 'Original 2130mAh battery pack for EOS R and DSLR models.'],
    ['USB-C Battery Charger Dual', 'Batteries & Chargers', 'Wasabi', 1290, 750, 36, 'Dual-bay charger with USB-C input and a charge indicator.'],
    ['AA Rechargeable Batteries 8-Pack', 'Batteries & Chargers', 'Eneloop', 1790, 1200, 44, 'Pre-charged NiMH cells for flashes. Reusable up to 2000 times.'],
    ['Dummy Battery AC Adapter', 'Batteries & Chargers', 'Wasabi', 2290, 1500, 9, 'Power your camera from a wall outlet for long shoots and streaming.'],
    ['Travel Battery Charger Kit', 'Batteries & Chargers', 'Anker', 1490, 900, 25, 'Compact charger with a car adapter and a set of plug heads.'],

    // Accessories
    ['Camera Strap Quick Release', 'Accessories', 'Peak Design', 3290, 2200, 24, 'Adjustable strap with anchor links for fast on and off.'],
    ['Wireless Shutter Remote', 'Accessories', 'Pixel', 1190, 650, 38, 'Remote with a timer and an interval function for time-lapses.'],
    ['Lens Cleaning Kit Pro', 'Accessories', 'Giottos', 790, 420, 70, 'Rocket blower, brush, cleaning fluid and microfiber cloths.'],
    ['Shotgun Microphone On-Camera', 'Accessories', 'Rode', 5990, 4400, 12, 'Directional mic with a windscreen and a shock mount.'],
    ['Hot Shoe Bubble Level', 'Accessories', 'Vello', 290, 120, 80, 'Two-axis level to keep horizons straight.'],
    ['Silica Gel Dry Box Cabinet', 'Accessories', 'Andbon', 3490, 2400, 4, 'Moisture-control cabinet that protects lenses from fungus.'],
    ['UV Protection Filter 77mm', 'Accessories', 'Hoya', 1090, 600, 55, 'Multi-coated clear filter that shields the front lens element.'],
    ['Camera Screen Protector Tempered Glass', 'Accessories', 'Puluz', 290, 110, 100, 'Scratch-resistant glass for the rear LCD. Easy bubble-free install.'],
];

const products = rows.map(([name, category, seller, price, costPrice, stock, description], i) => ({
    name, category, seller, price, costPrice, stock, description,
    images: [photo(i + 1, PHOTOS[i % PHOTOS.length])],
}));

const seedCameraProducts = async () => {
    const fresh = process.argv.includes('--fresh');
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with HOST: ${con.connection.host}`);

        if (fresh) {
            // only touches the camera categories, other products stay
            const { deletedCount } = await Product.deleteMany({ category: { $in: CATEGORIES } });
            console.log(`Old camera products cleared (${deletedCount})...`);
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

        console.log(`✅ Camera products seeded: ${added} added, ${skipped} already existed.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Camera product seeding failed:', error.message);
        process.exit(1);
    }
};

seedCameraProducts();