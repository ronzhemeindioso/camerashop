import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { forgotPassword } from '../../actions/userActions';
import './Login.css'

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.forgotPassword)
    const [email, setEmail] = useState('')

    const submitHandler = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set('email', email);
        dispatch(forgotPassword(formData))
    }

    // Minimal layout: hides banner, footer and the whole top menu (see Login.css)
    useEffect(() => {
        document.body.classList.add('login-mode', 'forgot-mode')
        return () => document.body.classList.remove('login-mode', 'forgot-mode')
    }, [])

    return (
        <>
            <MetaData title={'Forgot Password'} />

            <div className="login-page">
                <div className="login-card login-card-single">
                    <section className="login-form-wrap">
                        <form onSubmit={submitHandler} className="login-form">
                            <h1>FORGOT PASSWORD</h1>
                            <p className="login-hint">
                                Enter your email and we'll send you a link to reset your password.
                            </p>

                            <div className="login-field">
                                <label htmlFor="email_field">Email</label>
                                <i className="fa fa-envelope-o" aria-hidden="true"></i>
                                <input
                                    type="email"
                                    id="email_field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <button
                                id="forgot_password_button"
                                type="submit"
                                className="login-submit"
                                disabled={loading ? true : false}>
                                {loading ? 'SENDING...' : 'SEND EMAIL'}
                            </button>

                            <p className="login-back">
                                <Link to="/login">&larr; Back to sign in</Link>
                            </p>
                        </form>
                    </section>
                </div>
            </div>
        </>
    )
}

export default ForgotPassword
