import {
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_RESET,
    NEW_PRODUCT_FAIL,

    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,

    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_RESET,
    UPDATE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    DELETE_PRODUCT_RESET,
    REVIEW_ELIGIBILITY_REQUEST,
    REVIEW_ELIGIBILITY_SUCCESS,
    REVIEW_ELIGIBILITY_FAIL,
    REVIEW_ELIGIBILITY_RESET,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_SUCCESS,
    NEW_REVIEW_FAIL,
    NEW_REVIEW_RESET,
    SET_PRODUCT_FILTERS,
    RESET_PRODUCT_FILTERS,
    CLEAR_ERRORS
} from '../constants/productConstants'

export const productsReducer = (state = { products: [] }, action) => {
    switch (action.type) {
        case ADMIN_PRODUCTS_REQUEST:
        case ALL_PRODUCTS_REQUEST:

            return {
                ...state,
                loading: true,
                products: []
            }
        case ALL_PRODUCTS_SUCCESS:

            return {
                ...state,
                loading: false,
                products: action.payload.products,
                productsCount: action.payload.productsCount,
                resPerPage: action.payload.resPerPage,
                filteredProductsCount: action.payload.filteredProductsCount
            }
        case ADMIN_PRODUCTS_SUCCESS:
            return {
                ...state,
                loading: false,
                products: action.payload

            }
        case ALL_PRODUCTS_FAIL:
        case ADMIN_PRODUCTS_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload
            }


        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state;
    }
}

export const productDetailsReducer = (state = { product: {} }, action) => {
    switch (action.type) {

        case PRODUCT_DETAILS_REQUEST:
            return {
                ...state,
                loading: true
            }

        case PRODUCT_DETAILS_SUCCESS:
            return {
                ...state,
                loading: false,
                product: action.payload
            }

        case PRODUCT_DETAILS_FAIL:
            return {
                ...state,
                error: action.payload
            }

        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }

        default:
            return state
    }
}

export const newProductReducer = (state = { product: {} }, action) => {
    switch (action.type) {
        case NEW_PRODUCT_REQUEST:

            return {
                ...state,
                loading: true
            }
        case NEW_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                success: action.payload.success,
                product: action.payload.product
            }
        case NEW_PRODUCT_FAIL:

            return {
                ...state,
                loading: false,
                error: action.payload
            }
        case NEW_PRODUCT_RESET:

            return {
                ...state,
                success: false
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state
    }
}

export const productReducer = (state = {}, action) => {
    switch (action.type) {

        case DELETE_PRODUCT_REQUEST:
        case UPDATE_PRODUCT_REQUEST:
            return {
                ...state,
                loading: true
            }

        case DELETE_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                isDeleted: action.payload
            }

        case UPDATE_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                isUpdated: action.payload
            }


        case DELETE_PRODUCT_FAIL:
        case UPDATE_PRODUCT_FAIL:
            return {
                ...state,
                error: action.payload
            }

        case DELETE_PRODUCT_RESET:
            return {
                ...state,
                isDeleted: false
            }
        case UPDATE_PRODUCT_RESET:
            return {
                ...state,
                isUpdated: false
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state
    }
}

// export const newReviewReducer = (state = {}, action) => {
//     switch (action.type) {
//         case NEW_REVIEW_REQUEST:
//             return {
//                 ...state,
//                 loading: true
//             }
//         case NEW_REVIEW_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 success: action.payload
//             }
//         case NEW_REVIEW_FAIL:
//             return {
//                 ...state,
//                 error: action.payload
//             }
//         case NEW_REVIEW_RESET:
//             return {
//                 ...state,
//                 success: false
//             }
//         case CLEAR_ERRORS:
//             return {
//                 ...state,
//                 error: null
//             }
//         default:
//             return state
//     }

// }


// rating / review-count filters used on the home page
export const productFiltersReducer = (state = { minRating: 0, minReviews: 0 }, action) => {
    switch (action.type) {
        case SET_PRODUCT_FILTERS:
            return { ...state, ...action.payload }
        case RESET_PRODUCT_FILTERS:
            return { minRating: 0, minReviews: 0 }
        default:
            return state
    }
}

// can the logged-in user review the product being viewed?
export const reviewEligibilityReducer = (state = { canReview: false, hasReviewed: false, review: null }, action) => {
    switch (action.type) {
        case REVIEW_ELIGIBILITY_REQUEST:
            return { ...state, loading: true }
        case REVIEW_ELIGIBILITY_SUCCESS:
            return {
                loading: false,
                canReview: action.payload.canReview,
                hasReviewed: action.payload.hasReviewed,
                review: action.payload.review
            }
        case REVIEW_ELIGIBILITY_FAIL:
            return { loading: false, canReview: false, hasReviewed: false, review: null, error: action.payload }
        case REVIEW_ELIGIBILITY_RESET:
            return { canReview: false, hasReviewed: false, review: null }
        case CLEAR_ERRORS:
            return { ...state, error: null }
        default:
            return state
    }
}

// submitting (creating / updating) a review
export const newReviewReducer = (state = {}, action) => {
    switch (action.type) {
        case NEW_REVIEW_REQUEST:
            return { ...state, loading: true }
        case NEW_REVIEW_SUCCESS:
            return {
                loading: false,
                success: action.payload.success,
                updated: action.payload.updated,
                masked: action.payload.masked
            }
        case NEW_REVIEW_FAIL:
            return { ...state, loading: false, error: action.payload }
        case NEW_REVIEW_RESET:
            return {}
        case CLEAR_ERRORS:
            return { ...state, error: null }
        default:
            return state
    }
}
