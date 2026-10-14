import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'

const NewUser = () => {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('user')
    const [saving, setSaving] = useState(false)

    const submitHandler = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await axios.post(
                `${import.meta.env.VITE_API}/admin/user/new`,
                { name, email, password, role },
                { withCredentials: true }
            )
            toast.success('User created successfully', { position: 'bottom-right' })
            navigate('/admin/users')
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSaving(false)
        }
    }

    const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }

    return (
        <>
            <MetaData title={'New User'} />
            <AdminLayout>
                <div className="wrapper my-5">
                    <div>
                        <form className="shadow-lg" onSubmit={submitHandler}>
                            <div className="adm-form-head" style={{ marginBottom: '1.25rem' }}>
                                <h2>Add user</h2>
                                <p>Create a new customer or admin account</p>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input type="text" id="name_field" className="form-control"
                                        value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email_field">Email</label>
                                    <input type="email" id="email_field" className="form-control"
                                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input type="password" id="password_field" className="form-control"
                                        value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role_field">Role</label>
                                    <select id="role_field" className="form-control"
                                        value={role} onChange={(e) => setRole(e.target.value)}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
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
                                <button id="login_button" type="submit" className="btn" disabled={saving}>
                                    {saving ? 'CREATING...' : 'CREATE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}

export default NewUser