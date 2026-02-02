const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// CREATE - 새 사용자 생성
router.post('/', createUser);

// READ - 모든 사용자 조회
router.get('/', getAllUsers);

// READ - 특정 사용자 조회
router.get('/:id', getUserById);

// UPDATE - 사용자 정보 수정
router.put('/:id', updateUser);

// DELETE - 사용자 삭제
router.delete('/:id', deleteUser);

module.exports = router;
