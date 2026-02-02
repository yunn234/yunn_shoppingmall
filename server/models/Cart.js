const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  selectedOptions: {
    color: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: '',
    },
  },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  items: [cartItemSchema],
}, {
  timestamps: true,
});

// 인덱스 추가
cartSchema.index({ user: 1 });

// 가상 필드: 총 상품 수량
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 가상 필드: 총 금액 (상품 가격 * 수량의 합)
cartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((total, item) => {
    // populate가 되어 있다면 item.product.price 사용, 아니면 0
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);
});

// JSON 변환 시 가상 필드 포함
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
