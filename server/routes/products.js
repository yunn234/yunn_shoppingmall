const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// CREATE - 새 상품 생성
router.post('/', createProduct);

// READ - 모든 상품 조회
router.get('/', getAllProducts);

// READ - 특정 상품 조회
router.get('/:id', getProductById);

// UPDATE - 상품 정보 수정
router.put('/:id', updateProduct);

// DELETE - 상품 삭제
router.delete('/:id', deleteProduct);

module.exports = router;
