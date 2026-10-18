import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions'


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
    // localStorage.setItem('cartItems', JSON.stringify(cartItems))

    const totalUnits = cartItems.reduce((acc, item) => acc + Number(item.quantity), 0)
    const totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)

    return (
        <>
            <MetaData title={'Your Cart'} />
            {cartItems.length === 0 ? (
                <div className="cart-page cart-empty">
                    <h2>Your cart is empty</h2>
                    <Link to="/">Continue shopping</Link>
                </div>
            ) : (
                <div className="cart-page">
                    <h2 className="cart-title">Your cart <span>({totalUnits} {totalUnits === 1 ? 'item' : 'items'})</span></h2>

                    <div className="cart-layout">
                        <ul className="cart-list">
                            {cartItems.map(item => (
                                <li className="cart-row" key={item.product}>
                                    <img src={item.image} alt={item.name} />

                                    <div className="cart-row-info">
                                        <Link to={`/products/${item.product}`}>{item.name}</Link>
                                        <span className="cart-row-price">${item.price}</span>
                                    </div>

                                    <div className="cart-qty">
                                        <button type="button" aria-label="Decrease quantity" onClick={() => decreaseQty(item.product, item.quantity)}>&minus;</button>
                                        <span>{item.quantity}</span>
                                        <button type="button" aria-label="Increase quantity" onClick={() => increaseQty(item.product, item.quantity, item.stock)}>+</button>
                                    </div>

                                    <button type="button" className="cart-remove" onClick={() => removeCartItemHandler(item.product)}>Remove</button>
                                </li>
                            ))}
                        </ul>

                        <aside className="cart-summary">
                            <div className="cart-summary-line">
                                <span>Items</span>
                                <span>{totalUnits}</span>
                            </div>
                            <div className="cart-summary-line cart-summary-total">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <button type="button" className="cart-checkout" onClick={checkoutHandler}>Check out</button>
                        </aside>
                    </div>
                </div>
            )}
        </>
    )
}

export default Cart