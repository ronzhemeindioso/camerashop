import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'
// import { getToken } from '../../Utils/helpers';
// import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { newProduct, clearErrors } from '../../actions/productActions'
import { NEW_PRODUCT_RESET } from '../../constants/productConstants'

const NewProduct = () => {
    const dispatch = useDispatch()
    const { loading, error, success } = useSelector(state => state.newProduct)

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [costPrice, setCostPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Cameras');
    const [stock, setStock] = useState(0);
    const [seller, setSeller] = useState('');
    const [images, setImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])
    // const [error, setError] = useState('')
    // const [loading, setLoading] = useState(true)
    // const [success, setSuccess] = useState('')
    // const [product, setProduct] = useState({})

    const categories = [
        'Cameras',
        'Lenses',
        'Tripods & Stabilizers',
        'Lighting',
        'Memory Cards',
        'Bags & Cases',
        'Batteries & Chargers',
        'Accessories'
    ]

    let navigate = useNavigate()

    const submitHandler = (e) => {
        e.preventDefault();

        if (Number(price) <= Number(costPrice)) {
            toast.error('Sell price must be higher than cost price', { position: 'bottom-right' });
            return;
        }

        const formData = new FormData();
        formData.set('name', name);
        formData.set('price', price);
        formData.set('costPrice', costPrice);
        formData.set('description', description);
        formData.set('category', category);
        formData.set('stock', stock);
        formData.set('seller', seller);

        images.forEach(image => {
            formData.append('images', image)
        })

        dispatch(newProduct(formData))
    }

    const onChange = e => {
        const files = Array.from(e.target.files)
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(oldArray => [...oldArray, reader.result])
                    setImages(oldArray => [...oldArray, reader.result])
                }
            }

            reader.readAsDataURL(file)
        })
        // allow picking the same file again after removing it
        e.target.value = ''
    }

    const removeImage = (index) => {
        setImagesPreview(old => old.filter((_, i) => i !== index))
        setImages(old => old.filter((_, i) => i !== index))
    }
    // const newProduct = async (formData) => {

    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',

    //             },
    //             withCredentials: true
    //         }

    //         const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/product/new`, formData, config)
    //         setLoading(false)
    //         setSuccess(data.success)
    //         setProduct(data.product)
    //     } catch (error) {
    //         setError(error.response.data.message)

    //     }
    // }
    // useEffect(() => {

    //     if (error) {
    //         toast.error(error, {
    //             position: 'bottom-right'
    //         });
    //     }

    //     if (success) {
    //         navigate('/admin/products');
    //         toast.success('Product created successfully', {
    //             position: 'bottom-right'
    //         })

    //     }

    // }, [error, success,])
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors())
        }

        if (success) {
            navigate('/admin/products');
            toast.success('Product created successfully', {
                position: 'bottom-right'
            })
            dispatch({ type: NEW_PRODUCT_RESET })

        }

    }, [error, dispatch, navigate, success])

    return (
        <>
            <MetaData title={'New Product'} />
            <AdminLayout>
                    <>
                        <div className="wrapper my-5">
                            <form className="shadow-lg" onSubmit={submitHandler} encType='multipart/form-data'>
                                <div className="adm-form-head">
                                    <h2>New product</h2>
                                    <p>Add a product to your catalogue</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        type="text"
                                        id="name_field"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price_field">Sell Price</label>
                                    <input
                                        type="text"
                                        id="price_field"
                                        className="form-control"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cost_price_field">Cost Price</label>
                                    <input
                                        type="text"
                                        id="cost_price_field"
                                        className="form-control"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description_field">Description</label>
                                    <textarea className="form-control" id="description_field" rows="8" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category_field">Category</label>
                                    <select className="form-control" id="category_field" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        {categories.map(category => (
                                            <option key={category} value={category} >{category}</option>
                                        ))}

                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="stock_field">Stock</label>
                                    <input
                                        type="number"
                                        id="stock_field"
                                        className="form-control"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="seller_field">Seller Name</label>
                                    <input
                                        type="text"
                                        id="seller_field"
                                        className="form-control"
                                        value={seller}
                                        onChange={(e) => setSeller(e.target.value)}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label>Images</label>

                                    <div className='custom-file'>
                                        <input
                                            type='file'
                                            name='images'
                                            className='custom-file-input'
                                            id='customFile'
                                            onChange={onChange}
                                            multiple
                                        />
                                        <label className='custom-file-label' htmlFor='customFile'>
                                            Choose Images
                                        </label>
                                    </div>

                                    <small className="text-muted d-block mt-2">Optional</small>

                                    <div className="adm-img-previews">
                                        {imagesPreview.map((img, index) => (
                                            <div className="adm-img-preview" key={index}>
                                                <img src={img} alt="Images Preview" width="55" height="52" />
                                                <button
                                                    type="button"
                                                    className="adm-img-remove"
                                                    aria-label="Remove image"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                </div>


                                <div className="adm-form-actions">
                                    <button type="button" className="btn adm-cancel" onClick={() => navigate('/admin/products')}>
                                        Cancel
                                    </button>
                                    <button
                                        id="login_button"
                                        type="submit"
                                        className="btn btn-block py-3"
                                        disabled={loading ? true : false}
                                    >
                                        {loading ? 'CREATING...' : 'CREATE'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </>
                </AdminLayout>
        </>
    )
}

export default NewProduct