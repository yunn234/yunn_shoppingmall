const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByOrderNumber,
  getAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  cancelOrder,
} = require('../controllers/orderController');

// 모든 주문 라우트는 인증이 필요함
router.use(authenticateToken);

// CREATE - 주문 생성 (장바구니에서 주문하기)
router.post('/', createOrder);

// READ - 현재 사용자의 주문 목록 조회
router.get('/my', getMyOrders);

// READ - 주문번호로 주문 조회
router.get('/order-number/:orderNumber', getOrderByOrderNumber);

// READ - 관리자용 전체 주문 목록 조회
router.get('/all', getAllOrders);

// READ - 주문 ID로 주문 상세 조회
router.get('/:id', getOrderById);

// UPDATE - 주문 상태 변경
router.put('/:id/status', updateOrderStatus);

// UPDATE - 배송 정보 업데이트 (관리자만)
router.put('/:id/shipping', updateShippingInfo);

// DELETE - 주문 취소
router.delete('/:id', cancelOrder);

module.exports = router;
