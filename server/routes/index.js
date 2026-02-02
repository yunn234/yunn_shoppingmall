const express = require('express');
const router = express.Router();

// 기본 라우트
router.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API 서버가 실행 중입니다.' });
});

// 헬스 체크
router.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// User 라우트
const userRoutes = require('./users');
router.use('/users', userRoutes);

// Auth 라우트 (로그인)
const authRoutes = require('./auth');
router.use('/auth', authRoutes);

// Product 라우트
const productRoutes = require('./products');
router.use('/products', productRoutes);

  // Cart 라우트
  const cartRoutes = require('./carts');
  router.use('/carts', cartRoutes);

  // Order 라우트
  const orderRoutes = require('./orders');
  router.use('/orders', orderRoutes);

  module.exports = router;
