import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { newUserSchema } from '../../validation/schemas'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'

const FieldError = ({ error }) => error ? <div className="invalid-feedback">{error.message}</div> : null

const NewUser = () => {
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(newUserSchema),
        defaultValues: { name: '', email: '', password: '', role: 'user' },
    })
    const [saving, setSaving] = useState(false)

    const submitHandler = async ({ name, email, password, role }) => {
        setSaving(true)
        try {
            await axios.post(
                `${import.meta.env.VITE_API}/admin/user/new`,
                { name: name.trim(), email: email.trim(), password, role },
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
                        <form className="shadow-lg" onSubmit={handleSubmit(submitHandler)} noValidate>
                            <div className="adm-form-head" style={{ marginBottom: '1.25rem' }}>
                                <h2>Add user</h2>
                                <p>Create a new customer or admin account</p>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input type="text" id="name_field" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        {...register('name')} />
                                    <FieldError error={errors.name} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email_field">Email</label>
                                    <input type="email" id="email_field" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        {...register('email')} />
                                    <FieldError error={errors.email} />
                                </div>
                            </div>

                            <div style={row}>
                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input type="password" id="password_field" className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                        {...register('password')} autoComplete="new-password" />
                                    <FieldError error={errors.password} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role_field">Role</label>
                                    <select id="role_field" className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                                        {...register('role')}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                    <FieldError error={errors.role} />
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