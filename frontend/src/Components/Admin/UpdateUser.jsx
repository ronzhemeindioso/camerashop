import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'

import { errMsg, successMsg, getToken } from '../../Utils/helpers';

import axios from 'axios';

const UpdateUser = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [user, setUser] = useState(true)
    const [isUpdated, setIsUpdated] = useState(false)
    let navigate = useNavigate();

    const { id } = useParams();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    }
    const getUserDetails = async (id) => {

        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/user/${id}`, config)
            setUser(data.user)
            setLoading(false)

        } catch (error) {
            setError(error.response.data.message)
        }
    }

    const updateUser = async (id, userData) => {
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/user/${id}`, userData, config)
            setIsUpdated(data.success)
            setLoading(false)

        } catch (error) {
            setError(error.response.data.message)
        }
    }

    useEffect(() => {
        // console.log(user && user._id !== userId);
        if (user && user._id !== id) {
            getUserDetails(id)
        } else {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role)
        }
        if (error) {
            errMsg(error);
            setError('');
        }
        if (isUpdated) {
            successMsg('User updated successfully')
            navigate('/admin/users')

        }
    }, [error, isUpdated, id, user])
    const submitHandler = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('role', role);
        if (password) formData.set('password', password);
        updateUser(user._id, formData)
    }

    const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }

    return (
        <>
            <MetaData title={`Update User`} />
            <AdminLayout>
                <div className="wrapper my-5">
                    <div>
                        <form className="shadow-lg" onSubmit={submitHandler}>
                            <div className="adm-form-head" style={{ marginBottom: '1.25rem' }}>
                                <h2>Edit user</h2>
                                <p>Change this user's name, email, role or password</p>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        type="text"
                                        id="name_field"
                                        className="form-control"
                                        name="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email_field">Email</label>
                                    <input
                                        type="email"
                                        id="email_field"
                                        className="form-control"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="role_field">Role</label>
                                    <select
                                        id="role_field"
                                        className="form-control"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">New password</label>
                                    <input
                                        type="password"
                                        id="password_field"
                                        className="form-control"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Leave blank to keep current"
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="adm-form-actions" style={{ marginTop: '2.5rem' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ background: 'transparent', border: 'none', color: '#6b7280', width: 'auto', flex: '0 0 auto', padding: '0 0.5rem' }}
                                    onClick={() => navigate('/admin/users')}
                                >
                                    Cancel
                                </button>
                                <button id="login_button" type="submit" className="btn">
                                    UPDATE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}

export default UpdateUser