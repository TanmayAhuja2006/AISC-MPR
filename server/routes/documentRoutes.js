const router  = require('express').Router();
const wrapper = require('../middleware/wrapper');
const auth    = require('../middleware/authMiddleware');
const upload  = require('../middleware/uploadMiddleware');
const {
  uploadDocument,
  getDocuments,
  deleteDocument,
} = require('../controller/documentController');

router.use(auth);

router.post('/',       upload.single('file'), wrapper(uploadDocument));
router.get('/',                               wrapper(getDocuments));
router.delete('/:docId',                      wrapper(deleteDocument));

module.exports = router;
