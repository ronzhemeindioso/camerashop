const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateProfile,
    updatePassword,
    allUsers,
    deleteUser,
    getUserDetails,
    updateUser,
    logout,
    createUser,
    restoreUser,
    setUserActive,
    permanentDeleteUsers,
    socialLogin,
} = require('../controllers/auth');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')


router.post('/register', upload.single("avatar"), registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLogin);
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.put('/me/update', isAuthenticatedUser, upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, updatePassword)
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), allUsers)

router.route('/admin/user/:id').get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails).delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser).put(isAuthenticatedUser, authorizeRoles('admin'), updateUser)
router.post('/admin/user/new', isAuthenticatedUser, authorizeRoles('admin'), createUser)
router.put('/admin/user/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), restoreUser)
router.put('/admin/user/:id/status', isAuthenticatedUser, authorizeRoles('admin'), setUserActive)
router.delete('/admin/users/permanent', isAuthenticatedUser, authorizeRoles('admin'), permanentDeleteUsers)
router.get('/logout', logout);
module.exports = router;