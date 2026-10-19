const mongoose = require('mongoose')
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

    const resPerPage = 8;
    const productsCount = await Product.countDocuments({ deletedAt: null });

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(Product.find({ deletedAt: null }), req.query).search().filter()

    // Count everything that matches the search/price filter BEFORE paginating,
    // so the frontend knows how many pages there really are
    const filteredProductsCount = await apiFeatures.query.clone().countDocuments();

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query;

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

// Bulk soft delete: body = { ids: ['<productId>', '<productId>', ...] }
exports.bulkDeleteProducts = async (req, res) => {
    const { ids } = req.body || {}

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Select at least one product to delete'
        })
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No valid product ids were sent'
        })
    }

    const result = await Product.updateMany(
        { _id: { $in: validIds }, deletedAt: null },
        { deletedAt: new Date() }
    )

    return res.status(200).json({
        success: true,
        deletedCount: result.modifiedCount,
        message: `${result.modifiedCount} product(s) deleted`
    })
}

// Permanent delete (hard delete). Only products that are already in the trash can be removed.
// body = { ids: ['<productId>', ...] }
exports.permanentDeleteProducts = async (req, res) => {
    const { ids } = req.body || {}

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Select at least one product to delete permanently'
        })
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))

    // deletedAt: { $ne: null } -> never touches an active product
    const products = await Product.find({ _id: { $in: validIds }, deletedAt: { $ne: null } })
    if (products.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No deleted products found'
        })
    }

    // remove the photos from Cloudinary first
    for (const product of products) {
        for (const img of product.images) {
            try { await cloudinary.v2.uploader.destroy(img.public_id) } catch (e) { console.log(e) }
        }
    }

    const result = await Product.deleteMany({ _id: { $in: products.map(p => p._id) } })

    return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} product(s) permanently deleted`
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
    if (!mongoose.Types.ObjectId.isValid(req.query.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product id'
        })
    }
    const product = await Product.findById(req.query.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
}

// Admin deletes a review  =>  DELETE /api/v1/reviews?id=<reviewId>&productId=<productId>
exports.deleteReview = async (req, res, next) => {
    const { id, productId } = req.query

    if (!id || !productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            success: false,
            message: 'Review id and product id are required'
        })
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    const exists = product.reviews.some(review => review._id.toString() === id.toString())
    if (!exists) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        })
    }

    // keep every review except the deleted one
    const reviews = product.reviews.filter(review => review._id.toString() !== id.toString());
    const numOfReviews = reviews.length;

    // new average is calculated from the remaining reviews (0 when none are left)
    const ratings = numOfReviews === 0
        ? 0
        : reviews.reduce((acc, item) => acc + item.rating, 0) / numOfReviews

    product.reviews = reviews
    product.numOfReviews = numOfReviews
    product.ratings = ratings
    await product.save({ validateBeforeSave: false })

    return res.status(200).json({
        success: true,
        numOfReviews,
        ratings
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