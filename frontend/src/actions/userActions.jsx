import axios from 'axios'
import {
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOAD_USER_REQUEST,
    LOAD_USER_SUCCESS,
    LOAD_USER_FAIL,
    LOGOUT_SUCCESS,
    LOGOUT_FAIL,
    UPDATE_PROFILE_REQUEST,
    UPDATE_PROFILE_SUCCESS,
    UPDATE_PROFILE_FAIL,
    UPDATE_PASSWORD_REQUEST,
    UPDATE_PASSWORD_SUCCESS,
    UPDATE_PASSWORD_FAIL,
    FORGOT_PASSWORD_REQUEST,
    FORGOT_PASSWORD_SUCCESS,
    FORGOT_PASSWORD_FAIL,
    CLEAR_ERRORS
} from '../constants/userConstants'

const API = import.meta.env.VITE_API
const TOKEN_KEY = 'authToken'

const errorMessage = (error) => error.response?.data?.message || error.response?.data?.error || error.message

// Save the login token in the browser and attach it to every axios request.
// The backend accepts it as a "Bearer" header in addition to the cookie,
// so the login survives page refreshes even if the cookie is blocked.
export const setAuthToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token)
        } else {
            localStorage.removeItem(TOKEN_KEY)
        }
    } catch (e) { /* storage unavailable */ }

    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete axios.defaults.headers.common['Authorization']
    }
}

// Call once at app start (see main.jsx) to re-attach a saved token.
export const restoreAuthToken = () => {
    try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
    } catch (e) { /* storage unavailable */ }
}

export const login = (email, password) => async (dispatch) => {
    try {
        dispatch({ type: LOGIN_REQUEST })
        const config = {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        }

        const { data } = await axios.post(`${API}/login`, { email, password }, config)
        setAuthToken(data.token)
        dispatch({
            type: LOGIN_SUCCESS,
            payload: data.user
        })
    } catch (error) {
        dispatch({
            type: LOGIN_FAIL,
            payload: errorMessage(error)
        })
    }
}

export const logout = () => async (dispatch) => {
    try {
        await axios.get(`${API}/logout`, { withCredentials: true })
    } catch (error) {
        dispatch({
            type: LOGOUT_FAIL,
            payload: errorMessage(error)
        })
    }
    // Always clear the local session, even if the server call failed
    setAuthToken(null)
    dispatch({ type: LOGOUT_SUCCESS })
}

export const loadUser = () => async (dispatch) => {
    try {
        dispatch({ type: LOAD_USER_REQUEST })
        const { data } = await axios.get(`${API}/me`, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        })
        dispatch({
            type: LOAD_USER_SUCCESS,
            payload: data.user
        })
    } catch (error) {
        console.log('loadUser failed:', error.response?.status, error.response?.data, error.message)
        // Only forget the saved token when the server says it is invalid
        if (error.response?.status === 401) {
            setAuthToken(null)
        }
        dispatch({
            type: LOAD_USER_FAIL,
            payload: errorMessage(error)
        })
    }
}

export const updateProfile = (userData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PROFILE_REQUEST })
        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
        }
        const { data } = await axios.put(`${API}/me/update`, userData, config)
        dispatch({
            type: UPDATE_PROFILE_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: UPDATE_PROFILE_FAIL,
            payload: errorMessage(error)
        })
    }
}

export const updatePassword = (passwords) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PASSWORD_REQUEST })
        const config = {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        }
        const { data } = await axios.put(`${API}/password/update`, passwords, config)
        dispatch({
            type: UPDATE_PASSWORD_SUCCESS,
            payload: data.success
        })
    } catch (error) {
        dispatch({
            type: UPDATE_PASSWORD_FAIL,
            payload: errorMessage(error)
        })
    }
}

export const forgotPassword = (email) => async (dispatch) => {
    try {
        dispatch({ type: FORGOT_PASSWORD_REQUEST })
        const config = {
            headers: { 'Content-Type': 'application/json' }
        }
        const { data } = await axios.post(`${API}/password/forgot`, email, config)
        dispatch({
            type: FORGOT_PASSWORD_SUCCESS,
            payload: data.message
        })
    } catch (error) {
        dispatch({
            type: FORGOT_PASSWORD_FAIL,
            payload: errorMessage(error)
        })
    }
}

export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS
    })
}