import axios from 'axios';

import {
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,


    REVIEW_ELIGIBILITY_REQUEST,
    REVIEW_ELIGIBILITY_SUCCESS,
    REVIEW_ELIGIBILITY_FAIL,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_SUCCESS,
    NEW_REVIEW_FAIL,
    SET_PRODUCT_FILTERS,
    RESET_PRODUCT_FILTERS,
    MORE_PRODUCTS_REQUEST,
    MORE_PRODUCTS_SUCCESS,
    MORE_PRODUCTS_FAIL,
    CLEAR_ERRORS
} from '../constants/productConstants';

// builds the /products URL: page + search + price + category + rating + review-count filters
const productsLink = (currentPage, keyword, price, category, filters = {}) => {
    let link = `${import.meta.env.VITE_API}/products?page=${currentPage}&keyword=${keyword}&price[lte]=${price[1]}&price[gte]=${price[0]}`
    if (category) {
        link += `&category=${encodeURIComponent(category)}`
    }
    if (filters.minRating > 0) {
        link += `&ratings[gte]=${filters.minRating}`
    }
    if (filters.minReviews > 0) {
        link += `&numOfReviews[gte]=${filters.minReviews}`
    }
    return link
}

// filters: { minRating, minReviews } - both optional (0 / undefined = no filter)
export const getProducts = (currentPage = 1, keyword = '', price, category = '', filters = {}) => async (dispatch) => {
    try {
        dispatch({
            type: ALL_PRODUCTS_REQUEST
        })

        const { data } = await axios.get(productsLink(currentPage, keyword, price, category, filters))
        dispatch({
            type: ALL_PRODUCTS_SUCCESS,
            payload: data
        })

    } catch (error) {
        dispatch({
            type: ALL_PRODUCTS_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

// infinite scroll: fetch the next page and ADD it to the products already shown
export const loadMoreProducts = (currentPage, keyword = '', price, category = '', filters = {}) => async (dispatch) => {
    try {
        dispatch({ type: MORE_PRODUCTS_REQUEST })
        const { data } = await axios.get(productsLink(currentPage, keyword, price, category, filters))
        dispatch({ type: MORE_PRODUCTS_SUCCESS, payload: data })
    } catch (error) {
        dispatch({
            type: MORE_PRODUCTS_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

// keeps the category / rating / review-count filters in the Redux store
export const setProductFilters = (filters) => (dispatch) => {
    dispatch({ type: SET_PRODUCT_FILTERS, payload: filters })
}

export const resetProductFilters = () => (dispatch) => {
    dispatch({ type: RESET_PRODUCT_FILTERS })
}

// Has this user received the product (so they may review it)? Also returns their existing review.
export const checkReviewEligibility = (productId) => async (dispatch) => {
    try {
        dispatch({ type: REVIEW_ELIGIBILITY_REQUEST })
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/review/eligibility?productId=${productId}`,
            { withCredentials: true }
        )
        dispatch({ type: REVIEW_ELIGIBILITY_SUCCESS, payload: data })
    } catch (error) {
        dispatch({
            type: REVIEW_ELIGIBILITY_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

// create or update the logged-in user's review
export const submitReview = (reviewData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_REVIEW_REQUEST })
        const { data } = await axios.put(
            `${import.meta.env.VITE_API}/review`,
            reviewData,
            { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
        )
        dispatch({ type: NEW_REVIEW_SUCCESS, payload: data })
    } catch (error) {
        dispatch({
            type: NEW_REVIEW_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const getProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST })
        const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data.product
        })
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const newProduct = (productData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_PRODUCT_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json',

            },
            withCredentials: true //correct
        }
        const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/product/new`, productData, config)
        dispatch({
            type: NEW_PRODUCT_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: NEW_PRODUCT_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const getAdminProducts = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_PRODUCTS_REQUEST })
        const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`, {
            //AxiosRequestConfig parameter
            withCredentials: true //correct
        })
        dispatch({
            type: ADMIN_PRODUCTS_SUCCESS,
            payload: data.products
        })
    } catch (error) {
        dispatch({
            type: ADMIN_PRODUCTS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const updateProduct = (id, productData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PRODUCT_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json',

            },
            withCredentials: true //correct
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/product/${id}`, productData, config)
        dispatch({
            type: UPDATE_PRODUCT_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: UPDATE_PRODUCT_FAIL,
            payload: error.response.data.message
        })
    }
}

export const deleteProduct = (id) => async (dispatch) => {
    try {

        dispatch({ type: DELETE_PRODUCT_REQUEST })

        const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/product/${id}`)

        dispatch({
            type: DELETE_PRODUCT_SUCCESS,
            payload: data.success
        })

    } catch (error) {
        dispatch({
            type: DELETE_PRODUCT_FAIL,
            payload: error.response.data.message
        })
    }
}

// Bulk delete: ids = array of product _id values
export const bulkDeleteProducts = (ids) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_PRODUCT_REQUEST })

        const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/products/bulk`, {
            data: { ids },
            withCredentials: true
        })

        dispatch({
            type: DELETE_PRODUCT_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: DELETE_PRODUCT_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const newReview = (reviewData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_REVIEW_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await axios.put(`${import.meta.env.VITE_API}/review`, reviewData, config)
        dispatch({
            type: NEW_REVIEW_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: NEW_REVIEW_FAIL,
            payload: error.response.data.message
        })
    }
}

export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS

    })
}