import React from 'react'
import { Link } from 'react-router-dom'

// The dark title bar at the top of the Shop, About and Contact pages
const PageBanner = ({ crumb, title, text }) => (
    <section className="sf-full sf-banner">
        <div className="sf-container">
            <div className="sf-crumbs"><Link to="/">Home</Link> / {crumb}</div>
            <h1>{title}</h1>
            <p>{text}</p>
        </div>
        <img className="sf-banner-img" src="/images/camera.svg" alt="" />
    </section>
)

export default PageBanner
