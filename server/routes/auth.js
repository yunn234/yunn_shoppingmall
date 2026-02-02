const express = require('express');
const router = express.Router();
const { loginUser, getCurrentUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// LOGIN - 사용자 로그인
router.post('/login', loginUser);

// GET CURRENT USER - 토큰으로 현재 로그인한 사용자 정보 가져오기
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
