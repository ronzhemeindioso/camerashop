import React, { useState } from 'react'
import MetaData from './Layout/MetaData'
import PageBanner from './PageBanner'

const SUPPORT_EMAIL = 'support@aperture.com'

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [errors, setErrors] = useState({})

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Please enter your name'
        if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email'
        if (!form.message.trim()) e.message = 'Please write a message'
        return e
    }

    // opens the visitor's email app with the message filled in
    const onSubmit = (e) => {
        e.preventDefault()
        const found = validate()
        setErrors(found)
        if (Object.keys(found).length) return
        const subject = form.subject.trim() || `Message from ${form.name.trim()}`
        const body = `${form.message.trim()}\n\n${form.name.trim()}\n${form.email.trim()}`
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    return (
        <>
            <MetaData title={'Contact Us'} />

            <PageBanner crumb="Contact" title="Get in focus" text="For questions about orders, products or your account, get in touch." />

            <section className="sf-full sf-section">
                <div className="sf-container">
                    <div className="sf-contact">
                        <div className="sf-info">
                            <div className="sf-info-item">
                                <i className="fa fa-envelope" aria-hidden="true"></i>
                                <div><strong>Email</strong><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>
                            </div>
                            <div className="sf-info-item">
                                <i className="fa fa-phone" aria-hidden="true"></i>
                                <div><strong>Phone</strong><span>+63 900 000 0000</span></div>
                            </div>
                            <div className="sf-info-item">
                                <i className="fa fa-clock-o" aria-hidden="true"></i>
                                <div><strong>Hours</strong><span>Monday to Friday, 9:00 AM – 6:00 PM</span></div>
                            </div>
                        </div>

                        <form className="sf-form" onSubmit={onSubmit} noValidate>
                            <span className="sf-tag">// message</span>
                            <h2>Send us a message</h2>

                            <div className="sf-field">
                                <label htmlFor="c-name">Name</label>
                                <input id="c-name" name="name" value={form.name} onChange={onChange} />
                                {errors.name && <div className="sf-error">{errors.name}</div>}
                            </div>
                            <div className="sf-field">
                                <label htmlFor="c-email">Email</label>
                                <input id="c-email" name="email" type="email" value={form.email} onChange={onChange} />
                                {errors.email && <div className="sf-error">{errors.email}</div>}
                            </div>
                            <div className="sf-field">
                                <label htmlFor="c-subject">Subject (optional)</label>
                                <input id="c-subject" name="subject" value={form.subject} onChange={onChange} />
                            </div>
                            <div className="sf-field">
                                <label htmlFor="c-message">Message</label>
                                <textarea id="c-message" name="message" rows="5" value={form.message} onChange={onChange} />
                                {errors.message && <div className="sf-error">{errors.message}</div>}
                            </div>

                            <button type="submit" className="sf-btn amber">Send message</button>
                            <p className="sf-note">This opens your email app with the message ready to send.</p>
                        </form>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Contact
