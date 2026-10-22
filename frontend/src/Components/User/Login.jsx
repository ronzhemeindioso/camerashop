import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
// import { getUser, authenticate } from '../../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import './Login.css'
import { login, socialLogin, clearErrors } from '../../actions/userActions'
import { googleProvider, facebookProvider } from '../../firebase'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { loginSchema } from '../../validation/schemas'

const Login = () => {
    const { isAuthenticated, error, loading, user } = useSelector(state => state.auth)
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })
    // const [loading, setLoading] = useState(false)
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()

    const submitHandler = ({ email, password }) => {
        dispatch(login(email.trim(), password))
    }

    // const login = async (email, password) => {
    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         }
    //         const { data } = await axios.post(`http://localhost:4001/api/v1/login`, { email, password }, config)
    //         console.log(data)
    //         authenticate(data, () => navigate("/"))

    //     } catch (error) {

    //         toast.error("invalid user or password", {
    //             position: 'bottom-right'
    //         })
    //     }
    // }

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''
    // console.log(redirect)
    // useEffect(() => {
    //     if (getUser()) {
    //         navigate('/')
    //     }
    // }, [])

    // useEffect(() => {
    //     if (getUser() && redirect === 'shipping') {
    //         navigate(`/${redirect}`)
    //     }
    // }, [])
    console.log(isAuthenticated)
    useEffect(() => {
        if (isAuthenticated && redirect === 'shipping') {
            navigate(`/${redirect}`)
        }
        else if (isAuthenticated && user?.role === 'admin')
            navigate('/dashboard')
        else if (isAuthenticated)
            navigate('/')
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors());
        }
    }, [error, isAuthenticated, user, dispatch, navigate, redirect])

    useEffect(() => {
        document.body.classList.add('login-mode')
        return () => document.body.classList.remove('login-mode')
    }, [])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <div className="login-page">
                        <div className="login-card">
                            {/* Left: welcome panel */}
                            <aside className="login-side">
                                <span className="login-circle login-circle-1" />
                                <span className="login-circle login-circle-2" />
                                <span className="login-circle login-circle-3" />

                                <Link to="/" className="login-brand">Aperture</Link>

                                <div className="login-side-body">
                                    <h2>Hey There!</h2>
                                    <p>
                                        Welcome back.<br />
                                        You are just one step away from your cart.
                                    </p>
                                    <span className="login-side-question">Don't have an account?</span>
                                    <Link to="/register" className="login-ghost-btn">Sign Up</Link>
                                </div>
                            </aside>

                            {/* Right: form */}
                            <section className="login-form-wrap">
                                <form onSubmit={handleSubmit(submitHandler)} className="login-form" noValidate>
                                    <h1>SIGN IN</h1>

                                    <div className={`login-field ${errors.email ? 'has-error' : ''}`}>
                                        <label htmlFor="email_field">Email</label>
                                        <i className="fa fa-envelope-o" aria-hidden="true"></i>
                                        <input
                                            type="email"
                                            id="email_field"
                                            {...register('email')}
                                            autoComplete="email"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && <span className="login-error" role="alert">{errors.email.message}</span>}
                                    </div>

                                    <div className={`login-field ${errors.password ? 'has-error' : ''}`}>
                                        <label htmlFor="password_field">Password</label>
                                        <i className="fa fa-lock" aria-hidden="true"></i>
                                        <input
                                            type="password"
                                            id="password_field"
                                            {...register('password')}
                                            autoComplete="current-password"
                                            aria-invalid={!!errors.password}
                                        />
                                        {errors.password && <span className="login-error" role="alert">{errors.password.message}</span>}
                                    </div>

                                    <div className="login-row">
                                        <Link to="/password/forgot" className="login-forgot">Forgot Password?</Link>
                                    </div>

                                    <button id="login_button" type="submit" className="login-submit">
                                        SIGN IN
                                    </button>

                                    <div className="login-divider"><span>or continue with</span></div>

                                    <div className="login-social">
                                        <button type="button" className="login-social-btn"
                                            onClick={() => dispatch(socialLogin(googleProvider))}>
                                            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                            </svg>
                                            <span>Google</span>
                                        </button>
                                        <button type="button" className="login-social-btn"
                                            onClick={() => dispatch(socialLogin(facebookProvider))}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"/>
                                            </svg>
                                            <span>Facebook</span>
                                        </button>
                                    </div>

                                    <p className="login-mobile-signup">
                                        Don't have an account? <Link to="/register">Sign Up</Link>
                                    </p>
                                </form>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
export default Login