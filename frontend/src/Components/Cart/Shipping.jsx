import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from "react-router-dom";
import { countries } from 'countries-list'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { useDispatch, useSelector } from 'react-redux'
import { saveShippingInfo } from '../../actions/cartActions'
import './checkout.css'

const FIELDS = ['address', 'city', 'postalCode', 'phoneNo', 'country']

const Shipping = () => {
    const dispatch = useDispatch();
    const { shippingInfo } = useSelector(state => state.cart)
    const { user } = useSelector(state => state.auth)   // details saved in "Set up your profile"
    const countriesList = Object.values(countries)
    const defaultCountry = countriesList.find(c => c.name === 'Philippines')?.name || countriesList[0]?.name || ''
    let navigate = useNavigate();

    // the address saved in the customer's profile (street + barangay + province are joined into one line)
    const saved = useMemo(() => user ? {
        address: [user.address, user.barangay, user.province].filter(Boolean).join(', '),
        city: user.city || '',
        postalCode: user.postalCode ? String(user.postalCode) : '',
        phoneNo: user.phoneNo || '',
        country: user.country || ''
    } : null, [user])
    // the saved address can be used as-is only when every field is filled in
    const hasSaved = !!saved && FIELDS.every(k => saved[k])

    // 'saved' = checkbox ticked: use the profile address (fields are locked), 'custom' = type another address
    const [mode, setMode] = useState('custom')
    const [custom, setCustom] = useState({
        address: shippingInfo.address || '',
        city: shippingInfo.city || '',
        postalCode: shippingInfo.postalCode || '',
        phoneNo: shippingInfo.phoneNo || '',
        country: shippingInfo.country || defaultCountry
    })

    // runs once, as soon as the logged-in user is known (it can load after this page opens)
    const ready = useRef(false)
    useEffect(() => {
        if (!user || ready.current) return
        ready.current = true
        const hasOwn = !!shippingInfo.address
        const sameAsSaved = hasSaved && FIELDS.every(k => String(shippingInfo[k] ?? '') === saved[k])
        if (hasSaved && (sameAsSaved || !hasOwn)) {
            setMode('saved')                       // auto-fill from the profile
        } else if (!hasOwn && saved) {
            // profile is only partly filled: pre-fill what we have, the customer completes the rest
            setCustom({ ...saved, country: saved.country || defaultCountry })
        }
        // if they already chose a different address earlier, that one stays selected
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const locked = mode === 'saved' && hasSaved
    const values = locked ? saved : custom
    const setField = (key, value) => setCustom(prev => ({ ...prev, [key]: value }))

    const submitHandler = (e) => {
        e.preventDefault()

        const { address, city, phoneNo, postalCode, country } = values
        dispatch(saveShippingInfo({ address, city, phoneNo, postalCode, country }))
        navigate('/confirm')
    }

    return (
        <>
            <MetaData title={'Shipping Info'} />
            <CheckoutSteps shipping />
            <div className="co-page co-page--narrow">
                <form className="co-card" onSubmit={submitHandler}>
                    <h1 className="co-title">Shipping Information</h1>
                    <p className="co-subtitle">Where should we deliver your order?</p>

                    {hasSaved && (
                        <label className="co-check" htmlFor="use_saved">
                            <input
                                type="checkbox"
                                id="use_saved"
                                checked={mode === 'saved'}
                                onChange={(e) => setMode(e.target.checked ? 'saved' : 'custom')}
                            />
                            <span>
                                Use my saved address
                                <small>{[saved.address, saved.city, saved.postalCode, saved.country].join(', ')}</small>
                            </span>
                        </label>
                    )}

                    <div className="co-field">
                        <label className="co-label" htmlFor="address_field">Street address</label>
                        <input
                            type="text"
                            id="address_field"
                            className="co-input"
                            value={values.address}
                            onChange={(e) => setField('address', e.target.value)}
                            readOnly={locked}
                            required
                        />
                    </div>

                    <div className="co-row-2">
                        <div className="co-field">
                            <label className="co-label" htmlFor="city_field">City</label>
                            <input
                                type="text"
                                id="city_field"
                                className="co-input"
                                value={values.city}
                                onChange={(e) => setField('city', e.target.value)}
                                readOnly={locked}
                                required
                            />
                        </div>

                        <div className="co-field">
                            <label className="co-label" htmlFor="postal_code_field">Postal code</label>
                            <input
                                type="number"
                                id="postal_code_field"
                                className="co-input"
                                value={values.postalCode}
                                onChange={(e) => setField('postalCode', e.target.value)}
                                readOnly={locked}
                                required
                            />
                        </div>
                    </div>

                    <div className="co-row-2">
                        <div className="co-field">
                            <label className="co-label" htmlFor="phone_field">Phone number</label>
                            <input
                                type="tel"
                                id="phone_field"
                                className="co-input"
                                value={values.phoneNo}
                                onChange={(e) => setField('phoneNo', e.target.value)}
                                readOnly={locked}
                                required
                            />
                        </div>

                        <div className="co-field">
                            <label className="co-label" htmlFor="country_field">Country</label>
                            <select
                                id="country_field"
                                className="co-input"
                                value={values.country}
                                onChange={(e) => setField('country', e.target.value)}
                                disabled={locked}
                                required
                            >
                                {countriesList.map(country => (
                                    <option key={country.name} value={country.name}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {locked && (
                        <p className="co-note">
                            To change your saved address, <Link to="/me/update" className="co-link-inline">edit your profile</Link>.
                        </p>
                    )}

                    <button
                        id="shipping_btn"
                        type="submit"
                        className="co-btn"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </>
    )
}

export default Shipping
