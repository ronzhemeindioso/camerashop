import React from 'react'
import { Link } from 'react-router-dom';

const Product = ({ product }) => {
    const image = product.images && product.images[0] ? product.images[0].url : null
    const soldOut = product.stock === 0

    return (
        <article className="product-card">
            <Link to={`/product/${product._id}`} className="product-card-media" aria-label={product.name}>
                {image && <img src={image} alt={product.name} />}
                {soldOut && <span className="product-badge">Sold out</span>}
            </Link>

            <div className="product-card-body">
                <h3 className="product-card-title">
                    <Link to={`/product/${product._id}`}>{product.name}</Link>
                </h3>

                <div className="ratings">
                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                    </div>
                    <span id="no_of_reviews">({product.numOfReviews})</span>
                </div>

                <p className="product-card-price">${product.price}</p>

                <Link to={`/product/${product._id}`} className="product-card-btn">View details</Link>
            </div>
        </article>
    )
}

export default Product