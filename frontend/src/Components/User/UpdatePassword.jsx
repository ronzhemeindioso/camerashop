import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import { updatePassword, clearErrors } from '../../actions/userActions'
import { UPDATE_PASSWORD_RESET } from '../../constants/userConstants'
import './Login.css'

const UpdatePassword = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { error, isUpdated, loading } = useSelector(state => state.user)

    const [oldPassword, setOldPassword] = useState('')
    const [password, setPassword] = useState('')

    // Same minimal layout as Forgot Password: lavender page, single card, no top menu or footer (see Login.css)
    useEffect(() => {
        document.body.classList.add('login-mode', 'forgot-mode')
        return () => document.body.classList.remove('login-mode', 'forgot-mode')
    }, [])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
        if (isUpdated) {
            toast.success('Password updated', { position: 'bottom-right' })
            navigate('/me')
            dispatch({ type: UPDATE_PASSWORD_RESET })
        }
    }, [dispatch, error, navigate, isUpdated])

    const submitHandler = (e) => {
        e.preventDefault()

        const formData = new FormData()
        formData.set('oldPassword', oldPassword)
        formData.set('password', password)

        dispatch(updatePassword(formData))
    }

    return (
        <>
            <MetaData title={'Change Password'} />

            <div className="login-page">
                <div className="login-card login-card-single">
                    <section className="login-form-wrap">
                        <form onSubmit={submitHandler} className="login-form">
                            <h1>UPDATE PASSWORD</h1>
                            <p className="login-hint">
                                Enter your current password, then choose a new one (at least 6 characters).
                            </p>

                            <div className="login-field">
                                <label htmlFor="old_password_field">Old password</label>
                                <i className="fa fa-lock" aria-hidden="true"></i>
                                <input
                                    type="password"
                                    id="old_password_field"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <div className="login-field">
                                <label htmlFor="new_password_field">New password</label>
                                <i className="fa fa-key" aria-hidden="true"></i>
                                <input
                                    type="password"
                                    id="new_password_field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <button
                                id="update_password_button"
                                type="submit"
                                className="login-submit"
                                disabled={loading ? true : false}>
                                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </button>

                            <p className="login-back">
                                <Link to="/me">&larr; Back to profile</Link>
                            </p>
                        </form>
                    </section>
                </div>
            </div>
        </>
    )
}

export default UpdatePassword
