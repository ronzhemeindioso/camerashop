import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions'
import { peso } from '../../Utils/helpers'
import './checkout.css'

const Cart = () => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector(state => state.cart)
    const navigate = useNavigate()

    const increaseQty = (id, quantity, stock) => {
        const newQty = quantity + 1;
        if (newQty > stock) return;
        dispatch(addItemToCart(id, newQty))
    }

    const decreaseQty = (id, quantity) => {
        const newQty = quantity - 1;
        if (newQty <= 0) return;
        dispatch(addItemToCart(id, newQty))
    }

    const removeCartItemHandler = (id) => {
        dispatch(removeItemFromCart(id))
    }

    const checkoutHandler = () => {
        navigate('/login?redirect=shipping')
    }

    const totalUnits = cartItems.reduce((acc, item) => acc + Number(item.quantity), 0)
    const totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)

    return (
        <>
            <MetaData title={'Your Cart'} />
            {cartItems.length === 0 ? (
                <div className="co-page co-page--narrow">
                    <div className="co-card co-empty">
                        <h2>Your cart is empty</h2>
                        <p className="co-note">Add some products to your cart to get started.</p>
                        <Link to="/" className="co-btn" style={{ marginTop: '1rem' }}>Continue shopping</Link>
                    </div>
                </div>
            ) : (
                <div className="co-page">
                    <h1 className="co-title">Shopping Cart</h1>
                    <p className="co-subtitle">{totalUnits} {totalUnits === 1 ? 'item' : 'items'} in your cart</p>

                    <div className="co-cart-layout">
                        <div className="co-card">
                            <div className="co-cart-head">
                                <span>Product</span>
                                <span>Price</span>
                                <span>Quantity</span>
                                <span style={{ textAlign: 'right' }}>Subtotal</span>
                            </div>

                            <ul className="co-cart-list">
                                {cartItems.map(item => (
                                    <li className="co-cart-row" key={item.product}>
                                        <div className="co-cart-product">
                                            <img src={item.image} alt={item.name} />
                                            <div>
                                                <Link className="co-cart-name" to={`/products/${item.product}`}>{item.name}</Link>
                                                <button type="button" className="co-cart-remove" onClick={() => removeCartItemHandler(item.product)}>Remove</button>
                                            </div>
                                        </div>

                                        <span className="co-cart-price">{peso(item.price)}</span>

                                        <div className="co-qty">
                                            <button type="button" aria-label="Decrease quantity" onClick={() => decreaseQty(item.product, item.quantity)}>&minus;</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" aria-label="Increase quantity" onClick={() => increaseQty(item.product, item.quantity, item.stock)}>+</button>
                                        </div>

                                        <span className="co-cart-sub">{peso(item.quantity * item.price)}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/" className="co-link">&larr; Continue shopping</Link>
                        </div>

                        <aside className="co-card">
                            <h2 className="co-summary-title">Order Summary</h2>
                            <div className="co-summary-line">
                                <span>Items</span>
                                <span>{totalUnits}</span>
                            </div>
                            <div className="co-summary-line">
                                <span>Shipping and tax</span>
                                <span>At checkout</span>
                            </div>
                            <div className="co-summary-line co-summary-total">
                                <span>Subtotal</span>
                                <span>{peso(totalPrice)}</span>
                            </div>
                            <button type="button" className="co-btn" onClick={checkoutHandler}>Proceed to Checkout</button>
                        </aside>
                    </div>
                </div>
            )}
        </>
    )
}

export default Cart
