const Cart = require('../models/Cart');
const Product = require('../models/Product');

// CREATE - 장바구니에 상품 추가
const addToCart = async (req, res) => {
  try {
    const userId = req.userId || req.user._id; // 인증 미들웨어에서 설정된 사용자 ID
    const { productId, quantity, selectedOptions } = req.body;

    // 필수 필드 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID는 필수입니다.',
      });
    }

    // 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 수량 검증
    const itemQuantity = quantity && quantity > 0 ? quantity : 1;

    // 사용자의 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // 장바구니가 없으면 새로 생성
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    // 동일한 상품과 옵션이 이미 장바구니에 있는지 확인
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.selectedOptions.color === (selectedOptions?.color || '') &&
        item.selectedOptions.size === (selectedOptions?.size || '')
    );

    if (existingItemIndex > -1) {
      // 이미 존재하는 경우 수량만 증가
      cart.items[existingItemIndex].quantity += itemQuantity;
    } else {
      // 새로운 아이템 추가
      cart.items.push({
        product: productId,
        quantity: itemQuantity,
        selectedOptions: {
          color: selectedOptions?.color || '',
          size: selectedOptions?.size || '',
        },
      });
    }

    await cart.save();

    // populate로 상품 정보 포함하여 반환
    await cart.populate({
      path: 'items.product',
      select: 'name price images category',
    });

    res.status(200).json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니에 상품을 추가하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 현재 사용자의 장바구니 조회
const getCart = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price images category status',
    });

    if (!cart) {
      // 장바구니가 없으면 빈 장바구니 생성
      cart = new Cart({
        user: userId,
        items: [],
      });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 조회하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// UPDATE - 장바구니 아이템 수량 수정
const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // 수량 검증
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상이어야 합니다.',
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다.',
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // populate로 상품 정보 포함하여 반환
    await cart.populate({
      path: 'items.product',
      select: 'name price images category status',
    });

    res.status(200).json({
      success: true,
      message: '장바구니 아이템이 수정되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템을 수정하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// DELETE - 장바구니 아이템 삭제
const removeCartItem = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다.',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // populate로 상품 정보 포함하여 반환
    await cart.populate({
      path: 'items.product',
      select: 'name price images category status',
    });

    res.status(200).json({
      success: true,
      message: '장바구니에서 아이템이 삭제되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템을 삭제하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// DELETE - 장바구니 전체 비우기
const clearCart = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 비우기 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 비우는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
