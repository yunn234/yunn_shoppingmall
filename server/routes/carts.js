const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

// 모든 장바구니 라우트는 인증이 필요함
router.use(authenticateToken);

// CREATE - 장바구니에 상품 추가
router.post('/items', addToCart);

// READ - 현재 사용자의 장바구니 조회
router.get('/', getCart);

// UPDATE - 장바구니 아이템 수량 수정
router.put('/items/:itemId', updateCartItem);

// DELETE - 장바구니 아이템 삭제
router.delete('/items/:itemId', removeCartItem);

// DELETE - 장바구니 전체 비우기
router.delete('/', clearCart);

module.exports = router;
