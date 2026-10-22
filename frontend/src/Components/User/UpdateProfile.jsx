import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { countries } from 'countries-list'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { profileSchema, MAX_IMAGE_MB } from '../../validation/schemas'
import 'react-toastify/dist/ReactToastify.css'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { loadUser } from '../../actions/userActions'
import './Profile.css'
import './UpdateProfile.css'

const API = import.meta.env.VITE_API
const ADDRESS_KEYS = ['address', 'barangay', 'city', 'province']

// "25 random st" -> "25 Random St" (only lifts first letters, never lowercases acronyms)
const titleCase = (str) => str.replace(/(^|[\s\-/(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())

// Philippine numbers: keep only the 10 digits after +63, shown without spaces (9123456789)
const phDigits = (raw) => {
    let d = String(raw || '').replace(/\D/g, '')
    if (d.startsWith('63') && d.length === 12) d = d.slice(2)
    else if (d.startsWith('0') && d.length === 11) d = d.slice(1)
    return d.length === 10 ? d : null
}
const maskPh = (digits) => {
    return digits.replace(/\D/g, '').slice(0, 10)
}
const countryNames = Object.values(countries).map(c => c.name).sort((a, b) => a.localeCompare(b))

// same box as the profile page, but the value is an input
const Input = ({ label, error, hint, wide, children }) => (
    <label className={`profile-field ${wide ? 'wide' : ''} ${error ? 'has-error' : ''}`}>
        <span>{label}</span>
        {children}
        {error
            ? <em className="profile-error">{error}</em>
            : hint && <small className="pu-hint">{hint}</small>}
    </label>
)

// what we send to the API (no address capitalisation here, so it can be compared with the saved data)
const buildPayload = (form, intl) => {
    const payload = {}
    Object.keys(form).forEach(k => { payload[k] = form[k].trim() })
    if (!intl) {
        const d = form.phoneNo.replace(/\D/g, '')
        payload.phoneNo = d ? `+63${d}` : ''
    }
    return payload
}

const UpdateProfile = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const fileRef = useRef(null)
    const { user, loading } = useSelector(state => state.auth)

    const [phoneIntl, setPhoneIntl] = useState(false)   // true when the saved number is not a PH number
    const resolver = useMemo(() => yupResolver(profileSchema(phoneIntl)), [phoneIntl])
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        resolver,
        mode: 'onTouched',
        defaultValues: {
            name: '', email: '', phoneNo: '', address: '',
            barangay: '', city: '', province: '', postalCode: '', country: '',
        },
    })
    const form = watch()
    const [avatar, setAvatar] = useState('')            // base64 of a newly chosen photo
    const [avatarPreview, setAvatarPreview] = useState('')
    const [saving, setSaving] = useState(false)
    const [baseline, setBaseline] = useState('')        // what the account has now, to detect changes

    useEffect(() => {
        document.body.classList.add('profile-mode', 'hide-footer')
        return () => document.body.classList.remove('profile-mode', 'hide-footer')
    }, [])

    // fill the inputs with what the account already has
    useEffect(() => {
        if (!user) return
        const savedPhone = user.phoneNo || ''
        const digits = phDigits(savedPhone)
        const intl = !!savedPhone && !digits
        setPhoneIntl(intl)
        const loaded = {
            name: user.name || '',
            email: user.email || '',
            phoneNo: intl ? savedPhone : (digits ? maskPh(digits) : ''),
            address: user.address || '',
            barangay: user.barangay || '',
            city: user.city || '',
            province: user.province || '',
            postalCode: user.postalCode || '',
            country: user.country || '',
        }
        reset(loaded)
        setBaseline(JSON.stringify(buildPayload(loaded, intl)))
        setAvatarPreview(prev => prev || user.avatar?.url || '')
    }, [user])

    const phoneField = register('phoneNo')
    const setPhone = (e) => {
        if (!phoneIntl) e.target.value = maskPh(e.target.value)
        return phoneField.onChange(e)
    }
    // tidy capitalisation when the user leaves an address field
    const tidy = (key) => (e) => {
        setValue(key, titleCase(e.target.value))
        return register(key).onBlur(e)
    }

    const onPickAvatar = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file', { position: 'bottom-right' })
            return
        }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            toast.error(`Image must be smaller than ${MAX_IMAGE_MB} MB`, { position: 'bottom-right' })
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            setAvatar(reader.result)
            setAvatarPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const submitHandler = async (values) => {
        // the backend treats an empty string as "clear this field"
        const payload = buildPayload(values, phoneIntl)
        ADDRESS_KEYS.forEach(k => { payload[k] = titleCase(payload[k]) })
        if (avatar) payload.avatar = avatar

        try {
            setSaving(true)
            await axios.put(`${API}/me/update`, payload, { withCredentials: true })
            await dispatch(loadUser())
            toast.success('Profile updated', { position: 'bottom-right' })
            navigate('/me', { replace: true })
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSaving(false)
        }
    }

    if (loading || !user) return <Loader />

    const dirty = !!avatar || JSON.stringify(buildPayload(form, phoneIntl)) !== baseline
    const isAdmin = user.role === 'admin'
    const joined = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : ''

    return (
        <>
            <MetaData title={'Update Profile'} />

            <div className="profile-page">
                <form className="profile-wrap pu-wrap" onSubmit={handleSubmit(submitHandler)} noValidate>

                    <div className="pu-top">
                        <Link to="/me" className="pu-back">
                            <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to profile
                        </Link>
                        <h1 className="pu-title">Edit profile</h1>
                    </div>

                    <div className="profile-block pu-card">

                        <div className="pu-photo">
                            <button type="button" className="profile-avatar profile-avatar-edit pu-avatar"
                                onClick={() => fileRef.current && fileRef.current.click()}
                                aria-label="Change profile photo">
                                {avatarPreview && <img src={avatarPreview} alt="Avatar preview" />}
                                <span className="profile-avatar-badge"><i className="fa fa-camera" aria-hidden="true"></i></span>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
                            <div className="pu-photo-info">
                                <div className="pu-photo-meta">
                                    <span className="profile-badge">{isAdmin ? 'Admin' : 'Customer'}</span>
                                    {joined && <span className="pu-since">Member since {joined}</span>}
                                </div>
                                <p className="pu-hint">JPG or PNG, up to {MAX_IMAGE_MB} MB</p>
                            </div>
                            <button type="button" className="pu-photo-btn"
                                onClick={() => fileRef.current && fileRef.current.click()}>
                                <i className="fa fa-camera" aria-hidden="true"></i> Change photo
                            </button>
                        </div>

                        <div className="profile-section-head">
                            <h2>Personal information</h2>
                        </div>
                        <div className="profile-grid">
                            <Input label="Full name" error={errors.name?.message}>
                                <input type="text" {...register('name')} autoComplete="name"
                                    aria-invalid={!!errors.name} />
                            </Input>
                            <Input label="Email address" error={errors.email?.message}>
                                <input type="email" {...register('email')} autoComplete="email"
                                    aria-invalid={!!errors.email} />
                            </Input>
                            <Input label="Phone number" error={errors.phoneNo?.message}>
                                {phoneIntl ? (
                                    <input type="tel" {...phoneField} onChange={setPhone} placeholder="Not set"
                                        autoComplete="tel" aria-invalid={!!errors.phoneNo} />
                                ) : (
                                    <div className="pu-phone">
                                        <span className="pu-phone-prefix">+63</span>
                                        <input type="tel" inputMode="numeric" {...phoneField} onChange={setPhone}
                                            placeholder="9123456789" autoComplete="tel-national"
                                            aria-invalid={!!errors.phoneNo} />
                                    </div>
                                )}
                            </Input>
                        </div>

                        <div className="profile-section-head profile-section-gap">
                            <h2>Address</h2>
                        </div>
                        <div className="profile-grid">
                            <Input label="House no. & street" error={errors.address?.message}>
                                <input type="text" {...register('address')} onBlur={tidy('address')}
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Barangay" error={errors.barangay?.message}>
                                <input type="text" {...register('barangay')} onBlur={tidy('barangay')}
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="City / Municipality" error={errors.city?.message}>
                                <input type="text" {...register('city')} onBlur={tidy('city')}
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Province" error={errors.province?.message}>
                                <input type="text" {...register('province')} onBlur={tidy('province')}
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Postal code" error={errors.postalCode?.message}>
                                <input type="text" {...register('postalCode')} placeholder="Not set"
                                    aria-invalid={!!errors.postalCode} />
                            </Input>
                            <Input label="Country">
                                <select {...register('country')}>
                                    <option value="">Not set</option>
                                    {countryNames.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Input>
                        </div>

                        <div className="pu-footer">
                            <span className="pu-footer-note">{dirty ? 'You have unsaved changes' : 'No changes yet'}</span>
                            <Link to="/me" className="profile-btn outline">Cancel</Link>
                            <button type="submit" className="profile-btn primary" disabled={saving || !dirty}>
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}

export default UpdateProfile
