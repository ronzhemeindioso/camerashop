import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { Carousel } from 'react-bootstrap'

import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'

import { getUser, getToken, successMsg, errMsg } from '../../Utils/helpers'
import ListReviews from '../Review/ListReviews';
import { useDispatch, useSelector } from 'react-redux'
import { getProductDetails, clearErrors, } from '../../actions/productActions'
import { addItemToCart } from '../../actions/cartActions'
const ProductDetails = () => {

    const { loading, error, product } = useSelector(state => state.productDetails);
    // const [product, setProduct] = useState({})
    const { user } = useSelector(state => state.auth)
    const [quantity, setQuantity] = useState(1)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [errorReview, setErrorReview] = useState('');
    const [success, setSuccess] = useState('')
    // const [user, setUser] = useState(getUser())

    let { id } = useParams()
    const dispatch = useDispatch()

    const increaseQty = () => {
        const count = document.querySelector('.count')
        if (count.valueAsNumber >= product.stock) return;
        const qty = count.valueAsNumber + 1;
        setQuantity(qty)
    }

    const decreaseQty = () => {
        const count = document.querySelector('.count')
        if (count.valueAsNumber <= 1) return;
        const qty = count.valueAsNumber - 1;
        setQuantity(qty)
    }

    const addToCart = async () => {
        await dispatch(addItemToCart(id, quantity));

    }

    // const productDetails = async (id) => {
    //     let link = `http://localhost:4001/api/v1/product/${id}`
    //     try {
    //         let res = await axios.get(link)
    //         setProduct(res.data.product)
    //     } catch (err) {
    //         console.log(err)
    //         // setError('Product not found')
    //     }
    // }

    function setUserRatings() {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.starValue = index + 1;
            ['click', 'mouseover', 'mouseout'].forEach(function (e) {
                star.addEventListener(e, showRatings);
            })
        })
        function showRatings(e) {
            stars.forEach((star, index) => {
                if (e.type === 'click') {
                    if (index < this.starValue) {
                        star.classList.add('orange');
                        setRating(this.starValue)
                    } else {
                        star.classList.remove('orange')
                    }
                }
                if (e.type === 'mouseover') {
                    if (index < this.starValue) {
                        star.classList.add('yellow');
                    } else {
                        star.classList.remove('yellow')
                    }
                }
                if (e.type === 'mouseout') {
                    star.classList.remove('yellow')
                }
            })
        }
    }

    const newReview = async (reviewData) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }

            const { data } = await axios.put(`${import.meta.env.VITE_API}/review`, reviewData, config)
            setSuccess(data.success)

        } catch (error) {
            setErrorReview(error.response.data.message)
        }
    }

    const reviewHandler = () => {
        const formData = new FormData();
        formData.set('rating', rating);
        formData.set('comment', comment);
        formData.set('productId', id);
        newReview(formData)

    }

    // useEffect(() => {
    //     productDetails(id)
    // }, [id,]);

    useEffect(() => {
        dispatch(getProductDetails(id))

    }, [id,]);

    // useEffect(() => {
    //     localStorage.setItem('cartItems', JSON.stringify(cartItems));
    // }, [cartItems]);

    return (
        <>
            <MetaData title={product.name} />
            <div className="pd-page">
                <div className="pd-image">
                    <Carousel pause='hover' indicators={false} controls={product.images && product.images.length > 1}>
                        {product.images && product.images.map(image => (
                            <Carousel.Item key={image.public_id}>
                                <img className="d-block w-100" src={image.url} alt={product.name} />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </div>

                <div className="pd-info">
                    <h1 className="pd-title">{product.name}</h1>

                    <div className="pd-rating">
                        <div className="rating-outer">
                            <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                        </div>
                        <span id="no_of_reviews">({product.numOfReviews} Reviews)</span>
                    </div>

                    <p className="pd-price">${product.price}</p>
                    <p className="pd-desc">{product.description}</p>

                    <div className="pd-buy">
                        <div className="pd-qty">
                            <button type="button" aria-label="Decrease quantity" onClick={decreaseQty}>&minus;</button>
                            <input type="number" className="count" value={quantity} readOnly />
                            <button type="button" aria-label="Increase quantity" onClick={increaseQty}>+</button>
                        </div>
                        <button type="button" className="pd-add" disabled={product.stock === 0} onClick={addToCart}>Add to Cart</button>
                    </div>

                    <p className="pd-meta">
                        <span className={product.stock > 0 ? 'pd-in' : 'pd-out'}>{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
                        {product.seller && <> &middot; Sold by {product.seller}</>}
                    </p>

                    {user
                        ? <button type="button" className="pd-review-btn" data-toggle="modal" data-target="#ratingModal" onClick={setUserRatings}>Write a review</button>
                        : <p className="pd-login-note"><Link to="/login">Log in</Link> to write a review.</p>}

                    <div className="row mt-2 mb-5">
                        <div className="rating w-50">

                            <div className="modal fade" id="ratingModal" tabIndex="-1" role="dialog" aria-labelledby="ratingModalLabel" aria-hidden="true">
                                <div className="modal-dialog" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="ratingModalLabel">Submit Review</h5>
                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">

                                            <ul className="stars" >
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                            </ul>

                                            <textarea
                                                name="review"
                                                id="review" className="form-control mt-3"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}

                                            >
                                            </textarea>


                                            <button className="btn my-3 float-right review-btn px-4 text-white" data-dismiss="modal" aria-label="Close" onClick={reviewHandler} >Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                {product.reviews && product.reviews.length > 0 && (

                    <ListReviews reviews={product.reviews} />

                )}

            </div>


        </>
    )
}

export default ProductDetails