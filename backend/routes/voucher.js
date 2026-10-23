const express = require('express')
const router = express.Router()

const {
    validateVoucher,
    getAvailableVouchers,
    newVoucher,
    getAdminVouchers,
    updateVoucher,
    deleteVoucher,
} = require('../controllers/voucher')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

// customers
router.post('/voucher/validate', isAuthenticatedUser, validateVoucher)
router.get('/vouchers/available', isAuthenticatedUser, getAvailableVouchers)

// admin
router.get('/admin/vouchers', isAuthenticatedUser, authorizeRoles('admin'), getAdminVouchers)
router.post('/admin/voucher/new', isAuthenticatedUser, authorizeRoles('admin'), newVoucher)
router.route('/admin/voucher/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateVoucher)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteVoucher)

module.exports = router
