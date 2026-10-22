import React, { useState, useEffect } from 'react'
import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'

import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { productSchema, PRODUCT_CATEGORIES, imageFileError } from '../../validation/schemas'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios';
// import { getToken } from '../../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { updateProduct, getProductDetails, clearErrors } from '../../actions/productActions'
import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants'


const FieldError = ({ error }) => error ? <div className="invalid-feedback">{error.message}</div> : null

const UpdateProduct = () => {
    const dispatch = useDispatch()
    const { error, product } = useSelector(state => state.productDetails);
    const { loading, error: updateError, isUpdated } = useSelector(state => state.product);

    // console.log(product)
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(productSchema),
        defaultValues: { name: '', price: '', costPrice: '', description: '', category: '', stock: '', seller: '' },
    })
    const [fetchedCost, setFetchedCost] = useState('')
    const [images, setImages] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])
    // const [error, setError] = useState('')
    // const [product, setProduct] = useState({})
    // const [loading, setLoading] = useState(true)
    // const [updateError, setUpdateError] = useState('')
    // const [isUpdated, setIsUpdated] = useState(false)

    const categories = PRODUCT_CATEGORIES
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
            .then(({ data }) => setFetchedCost(data.product.costPrice ?? 0))
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

    useEffect(() => {
        if (!product || product._id !== id) return
        reset({
            name: product.name ?? '',
            price: product.price ?? '',
            costPrice: fetchedCost,
            description: product.description ?? '',
            category: product.category ?? '',
            stock: product.stock ?? '',
            seller: product.seller ?? '',
        })
    }, [product, id, fetchedCost, reset])

    const submitHandler = (values) => {
        const formData = new FormData();
        formData.set('name', values.name.trim());
        formData.set('price', values.price);
        formData.set('costPrice', values.costPrice);
        formData.set('description', values.description.trim());
        formData.set('category', values.category);
        formData.set('stock', values.stock);
        formData.set('seller', values.seller.trim());
        // tell the server which existing images to keep (the rest are deleted)
        formData.set('keepImages', JSON.stringify((oldImages || []).map(img => img.public_id)));
        images.forEach(image => {
            formData.append('images', image)
        })
        dispatch(updateProduct(product._id, formData))
    }
    const onChange = e => {
        const files = Array.from(e.target.files).filter(file => {
            const problem = imageFileError(file)
            if (problem) toast.error(problem, { position: 'bottom-right' })
            return !problem
        })
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
                            <form className="shadow-lg" onSubmit={handleSubmit(submitHandler)} encType='multipart/form-data' noValidate>
                                <div className="adm-form-head">
                                    <h2>Edit product</h2>
                                    <p>Update the details of this product</p>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        type="text"
                                        id="name_field"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        {...register('name')}
                                    />
                                    <FieldError error={errors.name} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="price_field">Sell Price</label>
                                    <input
                                        type="text"
                                        id="price_field"
                                        className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                        {...register('price')}
                                    />
                                    <FieldError error={errors.price} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cost_price_field">Cost Price</label>
                                    <input
                                        type="text"
                                        id="cost_price_field"
                                        className={`form-control ${errors.costPrice ? 'is-invalid' : ''}`}
                                        {...register('costPrice')}
                                    />
                                    <FieldError error={errors.costPrice} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description_field">Description</label>
                                    <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} id="description_field" rows="8" {...register('description')}></textarea>
                                    <FieldError error={errors.description} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="category_field">Category</label>
                                    <select className={`form-control ${errors.category ? 'is-invalid' : ''}`} id="category_field" {...register('category')}>
                                        {(product?.category && !categories.includes(product.category) ? [product.category, ...categories] : categories).map(category => (
                                            <option key={category} value={category} >{category}</option>
                                        ))}
                                    </select>
                                    <FieldError error={errors.category} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="stock_field">Stock</label>
                                    <input
                                        type="number"
                                        id="stock_field"
                                        className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                                        {...register('stock')}
                                    />
                                    <FieldError error={errors.stock} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="seller_field">Seller Name</label>
                                    <input
                                        type="text"
                                        id="seller_field"
                                        className={`form-control ${errors.seller ? 'is-invalid' : ''}`}
                                        {...register('seller')}
                                    />
                                    <FieldError error={errors.seller} />
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