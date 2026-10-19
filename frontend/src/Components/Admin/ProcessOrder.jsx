import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import AdminLayout from './AdminLayout'
import { money } from './adminHelpers'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import axios from 'axios'
// import { getToken } from '../../Utils/helpers'
import { useDispatch, useSelector } from 'react-redux'
import { getOrderDetails, updateOrder, clearErrors } from '../../actions/orderActions'
import { UPDATE_ORDER_RESET } from '../../constants/orderConstants'
const STATUS_FLOW = ['Processing', 'Shipped', 'Delivered']

const ProcessOrder = () => {
    const dispatch = useDispatch();
    const { loading, order = {} } = useSelector(state => state.orderDetails)

    const { error, isUpdated } = useSelector(state => state.order)
    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order

    const [status, setStatus] = useState('')
    // const [loading, setLoading] = useState(true)
    // const [error, setError] = useState('')
    // const [order, setOrder] = useState({})
    // const [isUpdated, setIsUpdated] = useState(false)
    let navigate = useNavigate()

    let { id } = useParams();

    const orderId = id;
    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-center'
    });

    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-center'
    });

    // const getOrderDetails = async (id) => {
    //     try {
    //         const config = {
    //             headers: {

    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }

    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, config)
    //         setOrder(data.order)
    //         setLoading(false)
    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }
    // const updateOrder = async (id, formData) => {

    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }
    //         const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, formData, config)
    //         setIsUpdated(data.success)


    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }

    useEffect(() => {
        dispatch(getOrderDetails(orderId))
        if (error) {
            errMsg(error);
            dispatch(clearErrors())
            // setError('')
        }
        if (isUpdated) {
            successMsg('Order updated successfully');
            dispatch({ type: UPDATE_ORDER_RESET })

            // setIsUpdated('')
            navigate('/admin/orders')
        }
    }, [error, isUpdated, orderId])

    // start the dropdown on the order's current status (it used to start empty)
    useEffect(() => {
        if (orderStatus) setStatus(orderStatus)
    }, [orderStatus])

    const isDelivered = orderStatus === 'Delivered'

    const updateOrderHandler = (id) => {
        if (isDelivered) {
            errMsg('This order is already delivered and can no longer be updated')
            return
        }
        if (!status) {
            errMsg('Please choose a status')
            return
        }
        dispatch(updateOrder(id, { status }))
    }

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded' ? true : false
    return (
        <>
            <MetaData title={`Process Order # ${order && order._id}`} />
            <AdminLayout title="Process order" subtitle="Review the order and update its status">
                    <>
                        {loading ? <Loader /> : (
                            <div className="row d-flex justify-content-around">
                                <div className="col-12 col-lg-7 order-details">
                                    <h2 className="my-5">Order # {order._id}</h2>
                                    <h4 className="mb-4">Shipping Info</h4>
                                    <p><b>Name:</b> {user && user.name}</p>
                                    <p><b>Phone:</b> {shippingInfo && shippingInfo.phoneNo}</p>
                                    <p className="mb-4"><b>Address:</b>{shippingDetails}</p>
                                    <p><b>Amount:</b> {money(totalPrice)}</p>
                                    <hr />
                                    <h4 className="my-4">Payment</h4>
                                    <p className={isPaid ? "greenColor" : "redColor"}><b>{isPaid ? "PAID" : "NOT PAID"}</b></p>
                                    <h4 className="my-4">Stripe ID</h4>
                                    <p><b>{paymentInfo && paymentInfo.id}</b></p>

                                    <h4 className="my-4">Order Status:</h4>
                                    <p className={order.orderStatus && String(order.orderStatus).includes('Delivered') ? "greenColor" : "redColor"} ><b>{orderStatus}</b></p>
                                    <h4 className="my-4">Order Items:</h4>
                                    <hr />
                                    <div className="cart-item my-1">
                                        {orderItems && orderItems.map(item => (
                                            <div key={item.product} className="row my-5">
                                                <div className="col-4 col-lg-2">
                                                    <img src={item.image} alt={item.name} height="45" width="65" />
                                                </div>

                                                <div className="col-5 col-lg-5">
                                                    <Link to={`/products/${item.product}`}>{item.name}</Link>
                                                </div>
                                                <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                    <p>{money(item.price)}</p>
                                                </div>
                                                <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                    <p>{item.quantity} Piece(s)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <hr />
                                </div>
                                <div className="col-12 col-lg-3 mt-5">
                                    <h4 className="my-4">Status</h4>
                                    {isDelivered ? (
                                        <div
                                            style={{
                                                background: '#e8f5e9',
                                                border: '1px solid #a5d6a7',
                                                color: '#1b5e20',
                                                borderRadius: 10,
                                                padding: '14px 16px',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            <i className="fa fa-lock"></i> <b>Delivered</b>
                                            <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                                                This order is complete and can no longer be updated.
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <select
                                                    className="form-control"
                                                    name='status'
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value)}
                                                >
                                                    {STATUS_FLOW.map(option => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                            disabled={STATUS_FLOW.indexOf(option) < STATUS_FLOW.indexOf(orderStatus)}
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button className="btn btn-primary btn-block" onClick={() => updateOrderHandler(order._id)}>
                                                Update Status
                                            </button>
                                        </>
                                    )}

                                </div>
                            </div>
                        )}
                    </>
                </AdminLayout>
        </>
    )
}

export default ProcessOrder