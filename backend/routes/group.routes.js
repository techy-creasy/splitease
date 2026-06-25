const express = require('express');
const router = express.Router();
const { createGroup, getGroups, getGroup, deleteGroup, addMember, removeMember } = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .post(createGroup)
  .get(getGroups);

router.route('/:id')
  .get(getGroup)
  .delete(deleteGroup);

router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:memberId')
  .delete(removeMember);

module.exports = router;
