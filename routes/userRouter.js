const express= require('express')
const router=express.Router();
const {signup,login,logout,refreshToken, updatePassword, getCurrentUserProfile, updateCurrentUserProfile, deleteAccount } = require('../controllers/userController');
const {authenticate}= require('../middlewares/authMiddleware')

// User Authentication Routes
router.post('/signup', signup); 
router.post('/login', login); 
router.post('/logout', logout); 
router.patch("/update-password", authenticate, updatePassword);
router.post('/refresh-token', authController.refreshToken);


//Other Routes
router.get('/profile', authenticate, getCurrentUserProfile);
router.put('/profile', authenticate, updateCurrentUserProfile);
router.delete("/delete-account", authenticate, deleteAccount);
 
module.exports = router; 