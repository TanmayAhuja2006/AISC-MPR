const router     = require('express').Router();
const wrapper    = require('../middleware/wrapper');
const auth       = require('../middleware/authMiddleware');
const { register, login, getMe } = require('../controller/authController');

// Public
router.post('/register', wrapper(register));
router.post('/login',    wrapper(login));

// Protected
router.get('/me', auth, wrapper(getMe));

module.exports = router;
