import React, { useState, useEffect } from 'react'
import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'

import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios';
// import { getToken } from '../../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { updateProduct, getProductDetails, clearErrors } from '../../actions/productActions'
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants'


const UpdateProduct = () => {
    const dispatch = useDispatch()
    const { error, product } = useSelector(state => state.productDetails);
    const { loading, error: updateError, isUpdated } = useSelector(state => state.product);

    // console.log(product)
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [costPrice, setCostPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState(0);
    const [seller, setSeller] = useState('');
    const [images, setImages] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])
    // const [error, setError] = useState('')
    // const [product, setProduct] = useState({})
    // const [loading, setLoading] = useState(true)
    // const [updateError, setUpdateError] = useState('')
    // const [isUpdated, setIsUpdated] = useState(false)

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
    let { id } = useParams();
    let navigate = useNavigate();

    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-right'
    });
    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-right'
    });

    // const getProductDetails = async (id) => {
    //     try {
    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
    //         setProduct(data.product)
    //         setLoading(false)

    //     } catch (error) {
    //         setError(error.response.data.message)

    //     }
    // }

    // const updateProduct = async (id, productData) => {
    //     try {

    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }
    //         const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/product/${id}`, productData, config)
    //         setIsUpdated(data.success)

    //     } catch (error) {
    //         setUpdateError(error.response.data.message)

    //     }
    // }
    // Cost price is admin-only data, so it comes from the protected admin endpoint
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API}/admin/product/${id}`, { withCredentials: true })
            .then(({ data }) => setCostPrice(data.product.costPrice ?? 0))
            .catch(() => { })
    }, [id])

    // Always load fresh data when the page opens, otherwise the product cached in Redux
    // (with its old images) is shown again after an update
    useEffect(() => {
        dispatch(getProductDetails(id))
    }, [dispatch, id])

    useEffect(() => {
        if (product && product._id !== id) {
            dispatch(getProductDetails(id))
        } else {
            setName(product.name);
            setPrice(product.price);
            setDescription(product.description);
            setCategory(product.category);
            setSeller(product.seller);
            setStock(product.stock)
            setOldImages(product.images)
        }
        if (error) {
            errMsg(error)
            dispatch(clearErrors())

        }
        if (updateError) {
            errMsg(updateError);
            dispatch(clearErrors())

        }
        if (isUpdated) {
            navigate('/admin/products');
            successMsg('Product updated successfully');
            dispatch({ type: UPDATE_PRODUCT_RESET })

        }
    }, [error, updateError, product, id, isUpdated])

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
        // tell the server which existing images to keep (the rest are deleted)
        formData.set('keepImages', JSON.stringify((oldImages || []).map(img => img.public_id)));
        images.forEach(image => {
            formData.append('images', image)
        })
        dispatch(updateProduct(product._id, formData))
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

    const removeOldImage = (index) => {
        setOldImages(old => old.filter((_, i) => i !== index))
    }

    const removeNewImage = (index) => {
        setImagesPreview(old => old.filter((_, i) => i !== index))
        setImages(old => old.filter((_, i) => i !== index))
    }
    return (
        <>
            <MetaData title={'Update Product'} />
            <AdminLayout>
                    <>
                        <div className="wrapper my-5">
                            <form className="shadow-lg" onSubmit={submitHandler} encType='multipart/form-data'>
                                <div className="adm-form-head">
                                    <h2>Edit product</h2>
                                    <p>Update the details of this product</p>
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
                                        {(category && !categories.includes(category) ? [category, ...categories] : categories).map(category => (
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
                                        {oldImages && oldImages.map((img, index) => (
                                            <div className="adm-img-preview" key={img.public_id || img.url}>
                                                <img src={img.url} alt="Product" width="55" height="52" />
                                                <button type="button" className="adm-img-remove" aria-label="Remove image" onClick={() => removeOldImage(index)}>&times;</button>
                                            </div>
                                        ))}
                                        {imagesPreview.map((img, index) => (
                                            <div className="adm-img-preview" key={`new-${index}`}>
                                                <img src={img} alt="Images Preview" width="55" height="52" />
                                                <button type="button" className="adm-img-remove" aria-label="Remove image" onClick={() => removeNewImage(index)}>&times;</button>
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
                                        UPDATE
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                </AdminLayout>
        </>
    )
}

export default UpdateProduct