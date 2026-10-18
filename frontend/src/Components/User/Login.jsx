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

const Login = () => {
    const { isAuthenticated, error, loading, user } = useSelector(state => state.auth)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [loading, setLoading] = useState(false)
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()

    const submitHandler = (e) => {
        e.preventDefault();
        // login(email, password)
        dispatch(login(email, password))
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
                                <form onSubmit={submitHandler} className="login-form">
                                    <h1>SIGN IN</h1>

                                    <div className="login-field">
                                        <label htmlFor="email_field">Email</label>
                                        <i className="fa fa-envelope-o" aria-hidden="true"></i>
                                        <input
                                            type="email"
                                            id="email_field"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>

                                    <div className="login-field">
                                        <label htmlFor="password_field">Password</label>
                                        <i className="fa fa-lock" aria-hidden="true"></i>
                                        <input
                                            type="password"
                                            id="password_field"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>

                                    <div className="login-row">
                                        <Link to="/password/forgot" className="login-forgot">Forgot Password?</Link>
                                    </div>

                                    <button id="login_button" type="submit" className="login-submit">
                                        SIGN IN
                                    </button>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                        <button type="button" className="login-submit"
                                            onClick={() => dispatch(socialLogin(googleProvider))}>
                                            Continue with Google
                                        </button>
                                        <button type="button" className="login-submit"
                                            onClick={() => dispatch(socialLogin(facebookProvider))}>
                                            Continue with Facebook
                                        </button>
                                    </div>

                                    <p className="login-mobile-signup">
                                        New user? <Link to="/register">Create an account</Link>
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