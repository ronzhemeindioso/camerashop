import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { countries } from 'countries-list'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import MetaData from '../Layout/MetaData'
import { loadUser } from '../../actions/userActions'
import './Profile.css'
import './UpdateProfile.css'

const API = import.meta.env.VITE_API
const MAX_IMAGE_MB = 5
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/
const countryNames = Object.values(countries).map(c => c.name).sort((a, b) => a.localeCompare(b))

// "25 random st" -> "25 Random St" (only lifts first letters, never lowercases acronyms)
const titleCase = (str) => str.replace(/(^|[\s\-/(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())

// Philippine numbers: keep only the 10 digits after +63, shown without spaces (9123456789)
const phDigits = (raw) => {
    let d = String(raw || '').replace(/\D/g, '')
    if (d.startsWith('63') && d.length === 12) d = d.slice(2)
    else if (d.startsWith('0') && d.length === 11) d = d.slice(1)
    return d.length === 10 ? d : null
}
const onlyDigits = (value) => value.replace(/\D/g, '').slice(0, 10)

// same field box as the Edit profile page
const Input = ({ label, error, children }) => (
    <label className={`profile-field ${error ? 'has-error' : ''}`}>
        <span>{label}</span>
        {children}
        {error && <em className="profile-error">{error}</em>}
    </label>
)

/**
 * Step 2 after registering. Everything here is optional:
 *  - "Skip for now" goes straight to the shop
 *  - "Save & continue" stores whatever was filled in (it also pre-fills the checkout shipping form)
 * The page can be opened again later at /setup-profile.
 */
const SetupProfile = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const fileRef = useRef(null)
    const { user } = useSelector(state => state.auth)

    const [phoneNo, setPhoneNo] = useState('')
    const [phoneIntl, setPhoneIntl] = useState(false)   // true when the saved number is not a PH number
    const [address, setAddress] = useState('')
    const [barangay, setBarangay] = useState('')
    const [city, setCity] = useState('')
    const [province, setProvince] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [country, setCountry] = useState('')
    const [avatar, setAvatar] = useState('')            // base64 of a newly chosen photo
    const [avatarPreview, setAvatarPreview] = useState('')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    // same page look as Edit profile (see Profile.css / UpdateProfile.css)
    useEffect(() => {
        document.body.classList.add('profile-mode', 'hide-footer')
        return () => document.body.classList.remove('profile-mode', 'hide-footer')
    }, [])

    // show what the account already has (useful when the page is opened again later)
    useEffect(() => {
        if (!user) return
        const savedPhone = user.phoneNo || ''
        const digits = phDigits(savedPhone)
        const intl = !!savedPhone && !digits
        setPhoneIntl(intl)
        setPhoneNo(intl ? savedPhone : (digits || ''))
        setAddress(user.address || '')
        setBarangay(user.barangay || '')
        setCity(user.city || '')
        setProvince(user.province || '')
        setPostalCode(user.postalCode || '')
        setCountry(user.country || '')
        setAvatarPreview(prev => prev || user.avatar?.url || '')
    }, [user])

    const goHome = () => navigate(user?.role === 'admin' ? '/dashboard' : '/')

    const clearError = (key) => setErrors(p => ({ ...p, [key]: '' }))

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

    const removeNewAvatar = () => {
        setAvatar('')
        setAvatarPreview(user?.avatar?.url || '')
        if (fileRef.current) fileRef.current.value = ''
    }

    const onPhoneChange = (e) => {
        setPhoneNo(phoneIntl ? e.target.value : onlyDigits(e.target.value))
        clearError('phoneNo')
    }

    const validate = () => {
        const next = {}
        if (phoneIntl) {
            if (phoneNo.trim() && !PHONE_RE.test(phoneNo.trim())) next.phoneNo = 'Enter a valid phone number'
        } else if (phoneNo && phoneNo.length !== 10) {
            next.phoneNo = 'Enter the 10 digits after +63, e.g. 9123456789'
        }
        if (postalCode.trim() && !/^[A-Za-z0-9\- ]{3,12}$/.test(postalCode.trim())) next.postalCode = 'Enter a valid postal code'
        setErrors(next)
        if (Object.keys(next).length) {
            setTimeout(() => {
                const bad = document.querySelector('.pu-wrap [aria-invalid="true"]')
                if (bad) bad.focus()
            }, 0)
        }
        return Object.keys(next).length === 0
    }

    const submitHandler = async (e) => {
        e.preventDefault()
        if (!validate()) return

        // only send what was filled in
        const payload = {}
        if (phoneIntl ? phoneNo.trim() : phoneNo) payload.phoneNo = phoneIntl ? phoneNo.trim() : `+63${phoneNo}`
        if (address.trim()) payload.address = titleCase(address.trim())
        if (barangay.trim()) payload.barangay = titleCase(barangay.trim())
        if (city.trim()) payload.city = titleCase(city.trim())
        if (province.trim()) payload.province = titleCase(province.trim())
        if (postalCode.trim()) payload.postalCode = postalCode.trim()
        if (country) payload.country = country
        if (avatar) payload.avatar = avatar

        // nothing filled in = same as skipping
        if (Object.keys(payload).length === 0) {
            goHome()
            return
        }

        try {
            setSaving(true)
            await axios.put(`${API}/me/update`, payload, { withCredentials: true })
            await dispatch(loadUser())
            toast.success('Profile saved', { position: 'bottom-right' })
            goHome()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSaving(false)
        }
    }

    const tidy = (value, setter) => () => setter(titleCase(value))

    return (
        <>
            <MetaData title={'Set up your profile'} />

            <div className="profile-page">
                <form className="profile-wrap pu-wrap" onSubmit={submitHandler} noValidate>

                    <div className="pu-top">
                        <span className="profile-badge pu-step">Step 2 of 2 &middot; Optional</span>
                        <h1 className="pu-title">Set up your profile</h1>
                        <p className="pu-sub">
                            Add your personal information to make checkout faster and easier.
                        </p>
                    </div>

                    <div className="profile-block pu-card">

                        <div className="pu-photo">
                            <button type="button" className="profile-avatar profile-avatar-edit pu-avatar"
                                onClick={() => fileRef.current && fileRef.current.click()}
                                aria-label="Choose a profile photo">
                                {avatarPreview && <img src={avatarPreview} alt="Profile preview" />}
                                <span className="profile-avatar-badge"><i className="fa fa-camera" aria-hidden="true"></i></span>
                            </button>
                            <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onPickAvatar} />
                            <div className="pu-photo-info">
                                <strong className="pu-photo-title">Profile photo</strong>
                                <p className="pu-hint">JPG or PNG, up to {MAX_IMAGE_MB} MB</p>
                            </div>
                            {avatar ? (
                                <button type="button" className="pu-photo-btn" onClick={removeNewAvatar}>
                                    <i className="fa fa-times" aria-hidden="true"></i> Remove new photo
                                </button>
                            ) : (
                                <button type="button" className="pu-photo-btn"
                                    onClick={() => fileRef.current && fileRef.current.click()}>
                                    <i className="fa fa-camera" aria-hidden="true"></i> Upload photo
                                </button>
                            )}
                        </div>

                        <div className="profile-section-head">
                            <h2>Contact</h2>
                        </div>
                        <div className="profile-grid">
                            <Input label="Phone number" error={errors.phoneNo}>
                                {phoneIntl ? (
                                    <input type="tel" value={phoneNo} onChange={onPhoneChange} placeholder="Not set"
                                        autoComplete="tel" aria-invalid={!!errors.phoneNo} />
                                ) : (
                                    <div className="pu-phone">
                                        <span className="pu-phone-prefix">+63</span>
                                        <input type="tel" inputMode="numeric" value={phoneNo} onChange={onPhoneChange}
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
                            <Input label="House no. & street">
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                    onBlur={tidy(address, setAddress)} autoComplete="address-line1"
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Barangay">
                                <input type="text" value={barangay} onChange={(e) => setBarangay(e.target.value)}
                                    onBlur={tidy(barangay, setBarangay)} autoComplete="address-line2"
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="City / Municipality">
                                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                                    onBlur={tidy(city, setCity)} autoComplete="address-level2"
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Province">
                                <input type="text" value={province} onChange={(e) => setProvince(e.target.value)}
                                    onBlur={tidy(province, setProvince)} autoComplete="address-level1"
                                    placeholder="Not set" autoCapitalize="words" />
                            </Input>
                            <Input label="Postal code" error={errors.postalCode}>
                                <input type="text" value={postalCode}
                                    onChange={(e) => { setPostalCode(e.target.value); clearError('postalCode') }}
                                    autoComplete="postal-code" placeholder="Not set"
                                    aria-invalid={!!errors.postalCode} />
                            </Input>
                            <Input label="Country">
                                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                                    <option value="">Select a country</option>
                                    {countryNames.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Input>
                        </div>

                        <div className="pu-footer">
                            <button type="button" className="profile-btn outline" onClick={goHome} disabled={saving}>
                                Skip for now
                            </button>
                            <button type="submit" className="profile-btn primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save & continue'}
                            </button>
                        </div>
                    </div>

                    <p className="pu-note">
                        You can come back to this any time at <Link to="/setup-profile">Set up profile</Link>.
                    </p>
                </form>
            </div>
        </>
    )
}

export default SetupProfile
