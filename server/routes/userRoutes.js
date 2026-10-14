const router  = require('express').Router();
const wrapper = require('../middleware/wrapper');
const auth    = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  getHealthProfile,
  upsertHealthProfile,
} = require('../controller/userController');

router.use(auth); // All user routes require authentication

router.get('/profile',         wrapper(getProfile));
router.put('/profile',         wrapper(updateProfile));
router.get('/health-profile',  wrapper(getHealthProfile));
router.post('/health-profile', wrapper(upsertHealthProfile));

module.exports = router;
