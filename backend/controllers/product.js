const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');

exports.newProduct = async (req, res, next) => {
    try {
        // images are optional
        let images = []
        if (typeof req.body.images === 'string') {
            if (req.body.images) images.push(req.body.images)
        } else if (Array.isArray(req.body.images)) {
            images = req.body.images
        }

        let imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            try {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: 'products',
                    width: 150,
                    crop: "scale",
                });

                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                })
            } catch (error) {
                console.log(error)
            }
        }

        if (Number(req.body.price) <= Number(req.body.costPrice || 0)) {
            return res.status(400).json({
                success: false,
                message: 'Sell price must be higher than cost price'
            })
        }

        req.body.images = imagesLinks
        req.body.user = req.user.id;

        const product = await Product.create(req.body);

        return res.status(201).json({
            success: true,
            product
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: error.message || 'Product not created'
        })
    }
}

exports.getProducts = async (req, res) => {

    const resPerPage = 2;
    const productsCount = await Product.countDocuments({ deletedAt: null });

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(Product.find({ deletedAt: null }), req.query).search().filter()

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
    // if (!products)
    //     return res.status(400).json({ message: 'error loading products' })

    // return res.status(200).json({
    //     success: true,
    //     products,
    //     resPerPage,
    //     productsCount,

    // })
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getAdminProducts = async (req, res, next) => {

    // ?deleted=true lists the soft-deleted products (trash) instead of the active ones
    const filter = req.query.deleted === 'true' ? { deletedAt: { $ne: null } } : { deletedAt: null }
    const products = await Product.find(filter).select('+costPrice');
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products
    })

}
exports.getAdminSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id).select('+costPrice');
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    // console.log(req.body)
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    let images = []

    if (typeof req.body.images === 'string') {
        if (req.body.images) images.push(req.body.images)
    } else if (Array.isArray(req.body.images)) {
        images = req.body.images
    }

    // sell price must be higher than cost price (use stored values for fields not sent)
    const newPrice = req.body.price !== undefined ? Number(req.body.price) : product.price
    let newCost = req.body.costPrice !== undefined ? Number(req.body.costPrice) : undefined
    if (newCost === undefined) {
        const withCost = await Product.findById(req.params.id).select('+costPrice')
        newCost = withCost.costPrice || 0
    }
    if (newPrice <= newCost) {
        return res.status(400).json({
            success: false,
            message: 'Sell price must be higher than cost price'
        })
    }

    // existing images the admin chose to keep (all of them if the field is not sent)
    let keepIds = null
    if (typeof req.body.keepImages === 'string') {
        try { keepIds = JSON.parse(req.body.keepImages) } catch (e) { keepIds = null }
    }
    delete req.body.keepImages

    let keptImages = product.images
    if (Array.isArray(keepIds)) {
        keptImages = product.images.filter(img => keepIds.includes(img.public_id))
        const removed = product.images.filter(img => !keepIds.includes(img.public_id))
        for (const img of removed) {
            try { await cloudinary.v2.uploader.destroy(img.public_id) } catch (e) { console.log(e) }
        }
    }

    let imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products',
            width: 150,
            crop: "scale",
        });
        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }
    req.body.images = [...keptImages, ...imagesLinks]
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindandModify: false
    })
    // console.log(product)
    return res.status(200).json({
        success: true,
        product
    })
}

// Soft delete: the product stays in the database (orders and reviews keep working)
// but disappears from the storefront and the admin list.
exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.restoreProduct = async (req, res, next) => {
    const product = await Product.findOneAndUpdate(
        { _id: req.params.id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true }
    );
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Deleted product not found'
        })
    }
    return res.status(200).json({
        success: true,
        message: 'Product restored'
    })
}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }
    const product = await Product.findById(productId);
    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )
    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
    await product.save({ validateBeforeSave: false });
    if (!product)
        return res.status(400).json({
            success: false,
            message: 'review not posted'
        })
    return res.status(200).json({
        success: true
    })
}

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
}

exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.productSales = async (req, res, next) => {
    // SELECT product.name,sum(price * quantity) as total
    // FROM order
    // GROUP BY product_id
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    // console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    console.log(sales)

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
    })
    console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}