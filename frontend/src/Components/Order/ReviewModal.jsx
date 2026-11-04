import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { checkReviewEligibility, submitReview, clearErrors } from '../../actions/productActions'
import { NEW_REVIEW_RESET } from '../../constants/productConstants'
import { errMsg, successMsg } from '../../Utils/helpers'
import './orders.css'

const RATING_TEXT = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

// Pop-up used by "Write a review" buttons.
// product = { id, name, image }.  It is shown while `product` is not null.
// Uses the same Redux actions as the Product page, so the review ends up in the same place.
const ReviewModal = ({ product, onClose, onDone }) => {
    const dispatch = useDispatch()
    const { loading: checking, canReview, hasReviewed, review: myReview } = useSelector(state => state.reviewEligibility)
    const { loading: saving, success, error, updated, masked } = useSelector(state => state.newReview)

    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState('')

    const productId = product && product.id
    // true once the eligibility check for THIS product has started (so old data is never pre-filled)
    const sawLoading = useRef(false)

    // each time the pop-up opens: check eligibility and load the customer's existing review
    useEffect(() => {
        if (!productId) return
        sawLoading.current = false
        setRating(0)
        setHover(0)
        setComment('')
        dispatch(checkReviewEligibility(productId))
    }, [dispatch, productId])

    useEffect(() => {
        if (checking) sawLoading.current = true
    }, [checking])

    // pre-fill the form when the customer already reviewed this product (edit mode)
    useEffect(() => {
        if (productId && !checking && sawLoading.current && myReview) {
            setRating(myReview.rating)
            setComment(myReview.comment)
        }
    }, [productId, checking, myReview])

    // result of submitting
    useEffect(() => {
        if (error) {
            errMsg(error)
            dispatch(clearErrors())
        }
        if (success) {
            successMsg(updated ? 'Review updated' : 'Review submitted')
            if (masked) errMsg('Some words in your review were masked')
            dispatch({ type: NEW_REVIEW_RESET })
            if (onDone) onDone()
            onClose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error, success])

    if (!product) return null

    const submit = () => {
        if (rating < 1) return errMsg('Please choose a star rating')
        if (!comment.trim()) return errMsg('Please write a comment')
        dispatch(submitReview({ rating, comment, productId }))
    }

    const shown = hover || rating

    return (
        <div className="od-modal-bg" onClick={onClose}>
            <div className="od-modal" role="dialog" aria-modal="true" aria-label="Write a review" onClick={(e) => e.stopPropagation()}>
                <div className="od-modal-head">
                    <h3>{hasReviewed ? 'Edit your review' : 'Write a review'}</h3>
                    <button type="button" className="od-modal-close" aria-label="Close" onClick={onClose}>&times;</button>
                </div>

                <div className="od-modal-body">
                <div className="od-modal-product">
                    {product.image && <img src={product.image} alt={product.name} />}
                    <strong>{product.name}</strong>
                </div>

                {checking ? (
                    <p className="od-note">Loading...</p>
                ) : !canReview ? (
                    <p className="od-note">Only customers with a delivered order can review this product.</p>
                ) : (
                    <>
                        <span className="od-label">Your rating</span>
                        <div className="od-stars" onMouseLeave={() => setHover(0)}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                                    className={`od-star ${n <= rating ? 'on' : ''} ${hover && n <= hover ? 'hover' : ''}`}
                                    onMouseEnter={() => setHover(n)}
                                    onClick={() => setRating(n)}
                                >
                                    <i className="fa fa-star" />
                                </button>
                            ))}
                            <span className="od-rating-text">{RATING_TEXT[shown]}</span>
                        </div>

                        <label className="od-label" htmlFor="od-review-comment">Your review</label>
                        <textarea
                            id="od-review-comment"
                            className="od-textarea"
                            placeholder="What did you like or dislike about this product?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />

                        <div className="od-modal-foot">
                            <button type="button" className="od-btn od-btn--ghost" onClick={onClose}>Cancel</button>
                            <button type="button" className="od-btn od-btn--solid" disabled={saving} onClick={submit}>
                                {saving ? 'Saving...' : (hasReviewed ? 'Update review' : 'Submit review')}
                            </button>
                        </div>
                    </>
                )}
                </div>
            </div>
        </div>
    )
}

export default ReviewModal
