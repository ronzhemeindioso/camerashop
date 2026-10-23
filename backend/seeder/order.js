// Seeds 10 sample orders spread over the last ~8 months (different dates and statuses),
// so the dashboard charts and the orders list have something to show.
//
//   node seeder/order.js            replace the previous seeded orders with a fresh set of 10
//   node seeder/order.js --fresh    delete ALL orders first, then add the 10
//
// Needs products and at least one user in the database (run seeder/product.js first).
// Product stock is not changed by this seeder.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../config/.env') });

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const ADDRESSES = [
    { address: '12 Rizal Ave', city: 'Manila', phoneNo: '09171234567', postalCode: '1000', country: 'PH' },
    { address: '88 Katipunan Rd', city: 'Quezon City', phoneNo: '09181234567', postalCode: '1108', country: 'PH' },
    { address: '5 Ayala Ave', city: 'Makati', phoneNo: '09191234567', postalCode: '1226', country: 'PH' },
    { address: '27 Ortigas Center', city: 'Pasig', phoneNo: '09201234567', postalCode: '1605', country: 'PH' },
    { address: '301 Session Rd', city: 'Baguio', phoneNo: '09211234567', postalCode: '2600', country: 'PH' },
];

// daysAgo: how long ago it was placed | status: where the order is now
// items: [index into the product list, quantity]  (the index wraps around if there are fewer products)
const PLAN = [
    { daysAgo: 2, hour: 10, status: 'Processing', items: [[0, 1], [8, 2]] },
    { daysAgo: 5, hour: 14, status: 'Shipped', items: [[3, 1]] },
    { daysAgo: 9, hour: 9, status: 'Delivered', items: [[5, 1], [10, 2]] },
    { daysAgo: 16, hour: 16, status: 'Delivered', items: [[2, 1]] },
    { daysAgo: 27, hour: 11, status: 'Returned', items: [[7, 1]] },
    { daysAgo: 45, hour: 13, status: 'Delivered', items: [[12, 1], [14, 3]] },
    { daysAgo: 75, hour: 18, status: 'Delivered', items: [[1, 1], [9, 1]] },
    { daysAgo: 110, hour: 12, status: 'Refunded', items: [[6, 2]] },
    { daysAgo: 160, hour: 15, status: 'Delivered', items: [[4, 1], [11, 1]] },
    { daysAgo: 230, hour: 10, status: 'Delivered', items: [[13, 2]] },
];

const round2 = (n) => Math.round(n * 100) / 100;

// the dates each status was reached, relative to when the order was placed
const buildHistory = (placed, status) => {
    const at = (offset) => new Date(placed.getTime() + offset)
    const steps = [{ status: 'Processing', at: placed }];
    const flow = ['Shipped', 'Delivered', 'Returned', 'Refunded'];
    const offsets = { Shipped: 1 * DAY + 2 * HOUR, Delivered: 3 * DAY + 4 * HOUR, Returned: 6 * DAY, Refunded: 8 * DAY };
    const reached = { Processing: 0, Shipped: 1, Delivered: 2, Returned: 3, Refunded: 4 }[status];
    for (let i = 0; i < reached; i++) steps.push({ status: flow[i], at: at(offsets[flow[i]]) });
    return steps;
};

const seedOrders = async () => {
    const fresh = process.argv.includes('--fresh');
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with HOST: ${con.connection.host}`);

        const products = await Product.find({ deletedAt: null }).sort({ createdAt: 1 });
        if (products.length === 0) {
            console.error('❌ No products found. Run `node seeder/product.js` first.');
            process.exit(1);
        }

        let users = await User.find({ role: 'user', deletedAt: null });
        if (users.length === 0) users = await User.find({ deletedAt: null });
        if (users.length === 0) {
            console.error('❌ No users found. Run `node seeder/user.js` first.');
            process.exit(1);
        }

        if (fresh) {
            const { deletedCount } = await Order.deleteMany();
            console.log(`All old orders cleared (${deletedCount})...`);
        } else {
            const { deletedCount } = await Order.deleteMany({ 'paymentInfo.id': /^seed_order_/ });
            if (deletedCount) console.log(`Previous seeded orders cleared (${deletedCount})...`);
        }

        const now = Date.now();
        const orders = PLAN.map((plan, i) => {
            const placed = new Date(now - plan.daysAgo * DAY);
            placed.setHours(plan.hour, (i * 17) % 60, 0, 0);

            const orderItems = plan.items.map(([index, quantity]) => {
                const product = products[index % products.length];
                return {
                    name: product.name,
                    quantity,
                    price: product.price,
                    image: (product.images[0] && product.images[0].url) || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
                    product: product._id,
                };
            });

            // same rules as the checkout page
            const itemsPrice = round2(orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0));
            const shippingPrice = itemsPrice > 200 ? 0 : 25;
            const taxPrice = round2(itemsPrice * 0.05);
            const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

            const statusHistory = buildHistory(placed, plan.status);
            const delivered = statusHistory.find((s) => s.status === 'Delivered');
            const shipped = statusHistory.find((s) => s.status === 'Shipped');

            return {
                user: users[i % users.length]._id,
                shippingInfo: ADDRESSES[i % ADDRESSES.length],
                orderItems,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
                paymentInfo: { id: `seed_order_${i + 1}`, status: 'succeeded' },
                paidAt: placed,
                orderStatus: plan.status,
                statusHistory,
                deliveredAt: delivered ? delivered.at : undefined,
                trackingNumber: shipped ? `PH${String(7000000 + i * 1371)}` : undefined,
                stockDeducted: false,
                createdAt: placed,
            };
        });

        await Order.create(orders);
        console.log(`✅ ${orders.length} orders seeded (spread over the last ${PLAN[PLAN.length - 1].daysAgo} days).`);
        console.table(orders.map((o) => ({
            date: o.createdAt.toISOString().slice(0, 10),
            status: o.orderStatus,
            items: o.orderItems.length,
            total: o.totalPrice,
        })));

        process.exit(0);
    } catch (error) {
        console.error('❌ Order seeding failed:', error.message);
        process.exit(1);
    }
};

seedOrders();