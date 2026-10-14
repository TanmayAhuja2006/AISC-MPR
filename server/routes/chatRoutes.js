const router  = require('express').Router();
const wrapper = require('../middleware/wrapper');
const auth    = require('../middleware/authMiddleware');
const upload  = require('../middleware/uploadMiddleware');
const {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  renameSession,
  sendMessage,
} = require('../controller/chatController');

router.use(auth);

router.post('/sessions',                         wrapper(createSession));
router.get('/sessions',                          wrapper(getSessions));
router.get('/sessions/:sessionId',               wrapper(getSession));
router.delete('/sessions/:sessionId',            wrapper(deleteSession));
router.patch('/sessions/:sessionId/title',       wrapper(renameSession));
router.post('/sessions/:sessionId/message',      wrapper(sendMessage));

module.exports = router;
