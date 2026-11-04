import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'

import { getOrderDetails } from '../../actions/orderActions'
import { peso } from '../../Utils/helpers'
import ReviewModal from './ReviewModal'
import './orders.css'

const statusClass = (status = '') => {
    if (status.includes('Delivered')) return 'od-chip--green'
    if (status.includes('Shipped')) return 'od-chip--blue'
    if (status.includes('Processing')) return 'od-chip--amber'
    return 'od-chip--red'
}

const OrderDetails = () => {
    const dispatch = useDispatch();
    const { loading, error, order = {} } = useSelector(state => state.orderDetails)
    // the product being reviewed in the pop-up (null = closed)
    const [reviewing, setReviewing] = useState(null)

    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    let { id } = useParams();

    useEffect(() => {
        dispatch(getOrderDetails(id))
    }, [dispatch, id])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' });
        }
    }, [error])

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`

    const isPaid = paymentInfo && paymentInfo.status === 'succeeded' ? true : false
    const isDelivered = orderStatus === 'Delivered'

    return (
        <>
            <MetaData title={'Order Details'} />

            {loading ? <Loader /> : (
                <div className="od-page od-page--narrow">
                    <Link to="/orders/me" className="od-back">&larr; Back to my orders</Link>

                    <div className="od-head">
                        <h1 className="od-title">Order details</h1>
                        <p className="od-subtitle">
                            Order #{order._id}
                            {order.createdAt && <> &middot; Placed on {new Date(order.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</>}
                        </p>
                    </div>

                    <div className="od-card">
                        <h2 className="od-card-title">Order summary</h2>
                        <div className="od-card-body">
                            <div className="od-summary">
                                <div className="od-field">
                                    <span>Order status</span>
                                    <p><span className={`od-chip ${statusClass(orderStatus || '')}`}>{orderStatus}</span></p>
                                </div>
                                <div className="od-field">
                                    <span>Payment</span>
                                    <p>
                                        {paymentInfo && paymentInfo.method === 'COD' ? 'Cash on Delivery' : 'Card'}
                                        {' \u00b7 '}
                                        <b className={isPaid ? 'od-pay-ok' : 'od-pay-no'}>
                                            {isPaid ? 'Paid' : (paymentInfo && paymentInfo.method === 'COD' ? 'Pay on delivery' : 'Not paid')}
                                        </b>
                                    </p>
                                </div>
                                <div className="od-field">
                                    <span>Name</span>
                                    <p>{user && user.name}</p>
                                </div>
                                <div className="od-field">
                                    <span>Phone</span>
                                    <p>{shippingInfo && shippingInfo.phoneNo}</p>
                                </div>
                                <div className="od-field od-field--full">
                                    <span>Shipping address</span>
                                    <p>{shippingDetails}</p>
                                </div>
                                {order.trackingNumber && (
                                    <div className="od-field od-field--full">
                                        <span>Tracking number</span>
                                        <p>{order.trackingNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="od-card">
                        <h2 className="od-card-title">Items</h2>

                        {orderItems && orderItems.map(item => (
                            <div key={item.product} className="od-item">
                                <img src={item.image} alt={item.name} />

                                <div className="od-item-main">
                                    <Link to={`/product/${item.product}`} className="od-item-name">{item.name}</Link>
                                    <p className="od-item-meta">Qty {item.quantity} &times; {peso(item.price)}</p>
                                </div>

                                <span className="od-item-price">{peso(item.price * item.quantity)}</span>

                                {isDelivered && (
                                    <div className="od-item-review">
                                        <button
                                            type="button"
                                            className="od-btn od-btn--solid"
                                            onClick={() => setReviewing({ id: item.product, name: item.name, image: item.image })}
                                        >
                                            Write a review
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="od-totals">
                            <div className="od-totals-row"><span>Subtotal</span><span>{peso(order.itemsPrice)}</span></div>
                            <div className="od-totals-row"><span>Shipping</span><span>{peso(order.shippingPrice)}</span></div>
                            <div className="od-totals-row"><span>Tax</span><span>{peso(order.taxPrice)}</span></div>
                            {order.discountPrice > 0 && (
                                <div className="od-totals-row">
                                    <span>Voucher{order.voucher && order.voucher.code ? ` (${order.voucher.code})` : ''}</span>
                                    <span>-{peso(order.discountPrice)}</span>
                                </div>
                            )}
                            <div className="od-totals-row od-totals-row--grand"><span>Total</span><span>{peso(totalPrice)}</span></div>
                        </div>
                    </div>
                </div>
            )}

            <ReviewModal
                product={reviewing}
                onClose={() => setReviewing(null)}
            />
        </>
    )
}

export default OrderDetails
