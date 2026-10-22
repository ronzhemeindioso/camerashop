import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import MetaData from '../Layout/MetaData'
import { register, socialLogin, clearErrors } from '../../actions/userActions'
import { googleProvider, facebookProvider } from '../../firebase'
import './Login.css'
import './Register.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// A new account has no phone / address yet, so send it to the (skippable) profile setup page
const needsSetup = (user) => !!user && !user.phoneNo && !user.address

const Register = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { isAuthenticated, error, user } = useSelector(state => state.auth)

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const { name, email, password, confirm } = form

    // same page look as the login page (no search / cart in the header)
    useEffect(() => {
        document.body.classList.add('login-mode')
        return () => document.body.classList.remove('login-mode')
    }, [])

    // logged in (by registering, or by Google / Facebook) -> move on
    useEffect(() => {
        if (isAuthenticated) {
            if (user?.role === 'admin') navigate('/dashboard')
            else navigate(needsSetup(user) ? '/setup-profile' : '/')
        }
    }, [isAuthenticated, user, navigate])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
            setSubmitting(false)
        }
    }, [error, dispatch])

    const onChange = (e) => {
        const { name: field, value } = e.target
        setForm(prev => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const validate = () => {
        const next = {}
        if (!name.trim()) next.name = 'Please enter your name'
        else if (name.trim().length > 30) next.name = 'Your name cannot exceed 30 characters'

        if (!email.trim()) next.email = 'Please enter your email'
        else if (!EMAIL_RE.test(email.trim())) next.email = 'Please enter a valid email address'

        if (!password) next.password = 'Please enter a password'
        else if (password.length < 6) next.password = 'Your password must be at least 6 characters'

        if (!confirm) next.confirm = 'Please confirm your password'
        else if (confirm !== password) next.confirm = 'Passwords do not match'

        setErrors(next)
        return Object.keys(next).length === 0
    }

    const submitHandler = (e) => {
        e.preventDefault()
        if (!validate()) return
        setSubmitting(true)
        dispatch(register({ name: name.trim(), email: email.trim(), password }))
    }

    return (
        <>
            <MetaData title={'Register User'} />

            <div className="login-page">
                <div className="login-card reg-compact">
                    {/* Left: welcome panel */}
                    <aside className="login-side">
                        <span className="login-circle login-circle-1" />
                        <span className="login-circle login-circle-2" />
                        <span className="login-circle login-circle-3" />

                        <Link to="/" className="login-brand">Aperture</Link>

                        <div className="login-side-body">
                            <h2>Join Aperture</h2>
                            <p>Create your free account in a few seconds.</p>
                            <ul className="reg-perks">
                                <li><i className="fa fa-shopping-cart" aria-hidden="true"></i> Save your cart and checkout faster</li>
                                <li><i className="fa fa-truck" aria-hidden="true"></i> Track every order you place</li>
                                <li><i className="fa fa-star-o" aria-hidden="true"></i> Rate and review what you buy</li>
                            </ul>
                        </div>
                    </aside>

                    {/* Right: form */}
                    <section className="login-form-wrap">
                        <form onSubmit={submitHandler} className="login-form reg-form" noValidate>
                            <h1>CREATE ACCOUNT</h1>
                            <p className="reg-sub">Just the basics for now. Profile setup is optional.</p>

                            <div className={`login-field ${errors.name ? 'has-error' : ''}`}>
                                <label htmlFor="name_field">Name</label>
                                <i className="fa fa-user-o" aria-hidden="true"></i>
                                <input
                                    type="text"
                                    id="name_field"
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    autoComplete="name"
                                />
                                {errors.name && <span className="reg-error">{errors.name}</span>}
                            </div>

                            <div className={`login-field ${errors.email ? 'has-error' : ''}`}>
                                <label htmlFor="email_field">Email</label>
                                <i className="fa fa-envelope-o" aria-hidden="true"></i>
                                <input
                                    type="email"
                                    id="email_field"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    autoComplete="email"
                                />
                                {errors.email && <span className="reg-error">{errors.email}</span>}
                            </div>

                            <div className={`login-field ${errors.password ? 'has-error' : ''}`}>
                                <label htmlFor="password_field">Password</label>
                                <i className="fa fa-lock" aria-hidden="true"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password_field"
                                    name="password"
                                    className="has-eye"
                                    value={password}
                                    onChange={onChange}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="reg-eye"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                </button>
                                {errors.password && <span className="reg-error">{errors.password}</span>}
                            </div>

                            <div className={`login-field ${errors.confirm ? 'has-error' : ''}`}>
                                <label htmlFor="confirm_field">Confirm password</label>
                                <i className="fa fa-lock" aria-hidden="true"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirm_field"
                                    name="confirm"
                                    value={confirm}
                                    onChange={onChange}
                                    autoComplete="new-password"
                                />
                                {errors.confirm && <span className="reg-error">{errors.confirm}</span>}
                            </div>

                            <button id="register_button" type="submit" className="login-submit" disabled={submitting}>
                                {submitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                            </button>

                            <div className="login-divider"><span>or sign up with</span></div>

                            <div className="login-social">
                                <button type="button" className="login-social-btn"
                                    onClick={() => dispatch(socialLogin(googleProvider))}>
                                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                    <span>Google</span>
                                </button>
                                <button type="button" className="login-social-btn"
                                    onClick={() => dispatch(socialLogin(facebookProvider))}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
                                    </svg>
                                    <span>Facebook</span>
                                </button>
                            </div>

                            <p className="login-mobile-signup">
                                Already have an account? <Link to="/login">Sign In</Link>
                            </p>
                        </form>
                    </section>
                </div>
            </div>
        </>
    )
}

export default Register
