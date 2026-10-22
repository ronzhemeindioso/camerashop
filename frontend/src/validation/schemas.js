import * as yup from 'yup'

export const PRODUCT_CATEGORIES = [
    'Cameras',
    'Lenses',
    'Tripods & Stabilizers',
    'Lighting',
    'Memory Cards',
    'Bags & Cases',
    'Batteries & Chargers',
    'Accessories',
]

export const MAX_IMAGE_MB = 5

// Returns an error message for a bad image file, or '' when it is fine
export const imageFileError = (file) => {
    if (!file.type.startsWith('image/')) return `"${file.name}" is not an image`
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `"${file.name}" is larger than ${MAX_IMAGE_MB} MB`
    return ''
}

// "" or non-numeric input becomes NaN so typeError() fires instead of silently becoming 0
const num = (label) =>
    yup.number()
        .transform((value, original) => (String(original ?? '').trim() === '' ? NaN : value))
        .typeError(({ originalValue }) =>
            String(originalValue ?? '').trim() === '' ? `${label} is required` : `${label} must be a number`)

/* ---------------- Login ---------------- */
export const loginSchema = yup.object({
    email: yup.string().trim().required('Email is required').email('Enter a valid email'),
    password: yup.string().required('Password is required'),
})

/* ---------------- Product (new + update) ---------------- */
// The backend caps price and stock at 5 characters, hence the 99999 limit.
export const productSchema = yup.object({
    name: yup.string().trim()
        .required('Product name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    price: num('Sell price')
        .min(0.01, 'Sell price must be greater than 0')
        .max(99999, 'Sell price cannot exceed 99999')
        .moreThan(yup.ref('costPrice'), 'Sell price must be higher than cost price'),
    costPrice: num('Cost price')
        .min(0, 'Cost price cannot be negative')
        .max(99999, 'Cost price cannot exceed 99999'),
    description: yup.string().trim()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description cannot exceed 2000 characters'),
    category: yup.string()
        .required('Please select a category')
        .oneOf(PRODUCT_CATEGORIES, 'Please select a valid category'),
    stock: num('Stock')
        .integer('Stock must be a whole number')
        .min(0, 'Stock cannot be negative')
        .max(99999, 'Stock cannot exceed 99999'),
    seller: yup.string().trim()
        .required('Seller name is required')
        .max(50, 'Seller name cannot exceed 50 characters'),
})

/* ---------------- Update profile ---------------- */
const PHONE_INTL_RE = /^[0-9+\-\s()]{7,20}$/

// phoneIntl = the saved number is not a Philippine one, so it is a free-text field
export const profileSchema = (phoneIntl) => yup.object({
    name: yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
    email: yup.string().trim().required('Email is required').email('Enter a valid email'),
    phoneNo: yup.string().trim().test(
        'phone',
        phoneIntl ? 'Enter a valid phone number' : 'Enter the 10 digits after +63, e.g. 9123456789',
        (value = '') => {
            if (phoneIntl) return !value || PHONE_INTL_RE.test(value)
            const digits = value.replace(/\D/g, '')
            return !digits || digits.length === 10
        }
    ),
    address: yup.string().trim().max(200, 'Too long (max 200 characters)'),
    barangay: yup.string().trim().max(80, 'Too long (max 80 characters)'),
    city: yup.string().trim().max(60, 'Too long (max 60 characters)'),
    province: yup.string().trim().max(60, 'Too long (max 60 characters)'),
    postalCode: yup.string().trim().matches(/^$|^[A-Za-z0-9\- ]{3,12}$/, 'Enter a valid postal code'),
    country: yup.string(),
})

/* ---------------- Admin: add / edit user ---------------- */
const userBase = {
    name: yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
    email: yup.string().trim().required('Email is required').email('Enter a valid email'),
    role: yup.string().required('Please select a role').oneOf(['user', 'admin'], 'Please select a valid role'),
}

export const newUserSchema = yup.object({
    ...userBase,
    password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
})

// On edit the password is optional: blank keeps the current one
export const updateUserSchema = yup.object({
    ...userBase,
    password: yup.string().test(
        'min-if-set',
        'Password must be at least 6 characters',
        (value = '') => value.length === 0 || value.length >= 6
    ),
})
