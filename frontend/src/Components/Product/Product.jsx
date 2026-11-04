import React from 'react'
import { Link } from 'react-router-dom';
import { peso } from '../../Utils/helpers'

const Product = ({ product }) => {
    const image = product.images && product.images[0] ? product.images[0].url : null
    const soldOut = product.stock === 0
    const lowStock = product.stock > 0 && product.stock <= 5

    return (
        <Link to={`/product/${product._id}`} className="product-card">
            <div className="product-card-media">
                {image && <img src={image} alt={product.name} />}
                {soldOut && <span className="product-badge">Sold out</span>}
                {lowStock && <span className="product-badge low">Only {product.stock} left</span>}
                <span className="product-quick">View details</span>
            </div>

            <div className="product-card-body">
                {product.category && <span className="product-card-cat">{product.category}</span>}
                <h3 className="product-card-title">{product.name}</h3>

                <div className="ratings">
                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                    </div>
                    <span id="no_of_reviews">({product.numOfReviews})</span>
                </div>

                <p className="product-card-price">{peso(product.price)}</p>
            </div>
        </Link>
    )
}

export default Product