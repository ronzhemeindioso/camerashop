import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";

const Search = () => {

    const [keyword, setKeyword] = useState('');
    let navigate = useNavigate();

    const searchHandler = (e) => {
        e.preventDefault()
        if (keyword.trim()) {
            navigate(`/search/${keyword}`)
        } else {
            navigate('/')
        }
    }

    return (
        <form onSubmit={searchHandler} className="search-form">
            <input
                type="text"
                id="search_field"
                placeholder="Search products..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
            />
            <button id="search_btn" type="submit" aria-label="Search">
                <i className="fa fa-search" aria-hidden="true"></i>
            </button>
        </form>
    )
}

export default Search