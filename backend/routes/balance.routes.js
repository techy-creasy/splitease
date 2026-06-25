const express = require('express');
const router = express.Router();
const { getGroupBalances } = require('../controllers/balance.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/:groupId', getGroupBalances);

module.exports = router;
