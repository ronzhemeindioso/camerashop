import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import AdminLayout from './AdminLayout'
// import { getToken } from '../../Utils/helpers';
// import axios from 'axios'
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { productSchema, PRODUCT_CATEGORIES, imageFileError } from '../../validation/schemas'
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { newProduct, clearErrors } from '../../actions/productActions'
import { NEW_PRODUCT_RESET } from '../../constants/productConstants'

const FieldError = ({ error }) => error ? <div className="invalid-feedback">{error.message}</div> : null

const NewProduct = () => {
    const dispatch = useDispatch()
    const { loading, error, success } = useSelector(state => state.newProduct)

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(productSchema),
        defaultValues: { name: '', price: '', costPrice: '', description: '', category: 'Cameras', stock: '', seller: '' },
    })
    const [images, setImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])
    // const [error, setError] = useState('')
    // const [loading, setLoading] = useState(true)
    // const [success, setSuccess] = useState('')
    // const [product, setProduct] = useState({})

    const categories = PRODUCT_CATEGORIES

    let navigate = useNavigate()

    const submitHandler = (values) => {
        const formData = new FormData();
        formData.set('name', values.name.trim());
        formData.set('price', values.price);
        formData.set('costPrice', values.costPrice);
        formData.set('description', values.description.trim());
        formData.set('category', values.category);
        formData.set('stock', values.stock);
        formData.set('seller', values.seller.trim());

        images.forEach(image => {
            formData.append('images', image)
        })

        dispatch(newProduct(formData))
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
                            <form className="shadow-lg" onSubmit={handleSubmit(submitHandler)} encType='multipart/form-data' noValidate>
                                <div className="adm-form-head">
                                    <h2>New product</h2>
                                    <p>Add a product to your catalogue</p>
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
                                        {categories.map(category => (
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