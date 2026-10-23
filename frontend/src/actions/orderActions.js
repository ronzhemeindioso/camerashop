import axios from 'axios'
import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
    MY_ORDERS_REQUEST,
    MY_ORDERS_SUCCESS,
    MY_ORDERS_FAIL,
    ORDER_DETAILS_REQUEST,

    ORDER_DETAILS_SUCCESS,

    ORDER_DETAILS_FAIL,
    ALL_ORDERS_REQUEST,

    ALL_ORDERS_SUCCESS,

    ALL_ORDERS_FAIL,
    UPDATE_ORDER_SUCCESS,

    UPDATE_ORDER_REQUEST,

    UPDATE_ORDER_FAIL,
    DELETE_ORDER_REQUEST,
    DELETE_ORDER_SUCCESS,
    DELETE_ORDER_FAIL,
    CLEAR_ERRORS

} from '../constants/orderConstants'

export const createOrder = (order) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_ORDER_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.post(`${import.meta.env.VITE_API}/order/new`, order, config)
        dispatch({
            type: CREATE_ORDER_SUCCESS,
            payload: data
        })
        return { success: true }
    } catch (error) {
        const message = error.response?.data?.message || error.message
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: message
        })
        return { success: false, message }
    }

}

export const myOrders = () => async (dispatch) => {
    try {
        dispatch({ type: MY_ORDERS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/orders/me`, { withCredentials: true })
        dispatch({
            type: MY_ORDERS_SUCCESS,
            payload: data.orders
        })
    } catch (error) {
        dispatch({
            type: MY_ORDERS_FAIL,
            payload: error.response.data.message
        })
    }
}

// silent = true reloads the order in the background (no full-page loader), used right after a status update
export const getOrderDetails = (id, silent = false) => async (dispatch) => {
    try {
        if (!silent) dispatch({ type: ORDER_DETAILS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, { withCredentials: true })
        dispatch({
            type: ORDER_DETAILS_SUCCESS,
            payload: data.order
        })
    } catch (error) {
        dispatch({
            type: ORDER_DETAILS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const allOrders = () => async (dispatch) => {

    try {
        dispatch({ type: ALL_ORDERS_REQUEST });
        const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`, {
            //AxiosRequestConfig parameter
            withCredentials: true //correct
        })
        dispatch({
            type: ALL_ORDERS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: ALL_ORDERS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const updateOrder = (id, orderData) => async (dispatch, getState) => {
    try {
        dispatch({ type: UPDATE_ORDER_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, orderData, config)
        dispatch({
            type: UPDATE_ORDER_SUCCESS,
            payload: data.success,
            emailSent: data.emailSent,
            emailMessage: data.emailMessage
        })
        // 1) show the new status straight away from the server's reply (keeps the customer + stock info already on screen)
        const current = getState().orderDetails.order || {}
        if (data.order) {
            dispatch({
                type: ORDER_DETAILS_SUCCESS,
                payload: {
                    ...current,
                    ...data.order,
                    user: current.user,
                    orderItems: (data.order.orderItems || []).map(item => {
                        const old = (current.orderItems || []).find(o => String(o.product) === String(item.product))
                        return old && 'stock' in old ? { ...item, stock: old.stock } : item
                    })
                }
            })
        }
        // 2) then quietly reload in the background so the stock counts are exact
        dispatch(getOrderDetails(id, true))
    } catch (error) {
        dispatch({
            type: UPDATE_ORDER_FAIL,
            payload: (error.response && error.response.data && error.response.data.message) || error.message || 'Could not update the order'
        })

    }

}
export const deleteOrder = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_ORDER_REQUEST })
        const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/order/${id}`, { withCredentials: true })
        dispatch({
            type: DELETE_ORDER_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: DELETE_ORDER_FAIL,
            payload: error.response.data.message
        })
    }
}
export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS
    })
}