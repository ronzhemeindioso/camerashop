import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { getToken } from '../../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { createOrder, clearErrors } from '../../actions/orderActions'
import { clearCart } from '../../actions/cartActions';



const Payment = () => {
    const dispatch = useDispatch();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { error, loading } = useSelector(state => state.newOrder)

    // const [loading, setLoading] = useState(true)
    let navigate = useNavigate();
    // useEffect(() => {
    // }, [])

    const order = {
        orderItems: cartItems,
        shippingInfo
    }

    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
    if (orderInfo) {
        order.itemsPrice = orderInfo.itemsPrice
        order.shippingPrice = orderInfo.shippingPrice
        order.taxPrice = orderInfo.taxPrice
        order.totalPrice = orderInfo.totalPrice
        if (orderInfo.voucherCode) {
            order.voucherCode = orderInfo.voucherCode
        }
    }

    // const createOrder = async (order) => {
    //     console.log(order)
    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }
    //         const { data } = await axios.post(`${import.meta.env.VITE_API}/order/new`, order, config)
    //         // setIsUpdated(data.success)
    //         setLoading(false)
    //         toast.success('order created', {
    //             position: 'bottom-right'
    //         });

    //         // sessionStorage.removeItem('orderInfo')
    //         // navigate('/success')

    //     } catch (error) {
    //         toast.error(error.response.data.message, {
    //             position: 'bottom-right'
    //         });
    //     }
    // }

    const submitHandler = async (e) => {
        e.preventDefault();
        const payButton = document.querySelector('#pay_btn')
        payButton.disabled = true;
        order.paymentInfo = {
            id: 'pi_1DpdYh2eZvKYlo2CYIynhU32',
            status: 'succeeded'
        }
        const result = await dispatch(createOrder(order))
        if (!result || !result.success) {
            // e.g. the voucher expired or was used up while the customer was paying
            toast.error((result && result.message) || 'Could not place the order', {
                position: 'bottom-right'
            })
            payButton.disabled = false
            return
        }
        toast.success('order created', {
            position: 'bottom-right'
        })
        sessionStorage.removeItem('orderInfo')
        dispatch(clearCart())
        navigate('/success')
    }

    return (
        <>
            <MetaData title={'Payment'} />
            <CheckoutSteps shipping confirmOrder payment />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Card Info</h1>
                        <div className="form-group">
                            <label htmlFor="card_num_field">Card Number</label>
                            <input
                                type="text"
                                id="card_num_field"
                                className="form-control"

                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="card_exp_field">Card Expiry</label>
                            <input
                                type="text"
                                id="card_exp_field"
                                className="form-control"

                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="card_cvc_field">Card CVC</label>
                            <input
                                type="text"
                                id="card_cvc_field"
                                className="form-control"

                            />
                        </div>
                        <button
                            id="pay_btn"
                            type="submit"
                            className="btn btn-block py-3"
                        >
                            Pay {` - ${orderInfo && orderInfo.totalPrice}`}
                        </button>

                    </form>
                </div>
            </div>

        </>
    )
}

export default Payment