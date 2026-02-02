const mongoose = require('mongoose');

// 주문 상품 아이템 스키마
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productCode: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
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
  image: {
    type: String,
    default: '',
  },
}, { _id: true });

// 결제 정보 스키마
const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['카드결제', '계좌이체', '네이버페이', '카카오페이', '무통장입금'],
    default: '카드결제',
  },
  status: {
    type: String,
    required: true,
    enum: ['결제대기', '결제완료', '결제실패', '환불완료', '환불대기'],
    default: '결제대기',
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAt: {
    type: Date,
    default: null,
  },
  refundAt: {
    type: Date,
    default: null,
  },
  refundReason: {
    type: String,
    default: '',
  },
  // 포트원(아임포트) 결제 정보
  imp_uid: {
    type: String,
    default: '',
  },
  merchant_uid: {
    type: String,
    default: '',
  },
}, { _id: false });

// 배송 정보 스키마
const shippingSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  recipientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  postalCode: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  detailAddress: {
    type: String,
    default: '',
    trim: true,
  },
  deliveryMemo: {
    type: String,
    default: '',
    trim: true,
  },
  shippingFee: {
    type: Number,
    required: true,
    min: 0,
    default: 2500,
  },
  trackingNumber: {
    type: String,
    default: '',
    trim: true,
  },
  shippingCompany: {
    type: String,
    default: '',
    trim: true,
  },
  shippedAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

// 할인 정보 스키마
const discountSchema = new mongoose.Schema({
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  pointUsed: {
    type: Number,
    default: 0,
    min: 0,
  },
  couponCode: {
    type: String,
    default: '',
  },
}, { _id: false });

// 주문 스키마
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: false, // pre('save')에서 자동 생성되므로 required: false
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        '주문접수',
        '결제완료',
        '배송준비',
        '배송중',
        '배송완료',
        '주문취소',
        '환불처리중',
        '환불완료',
      ],
      default: '주문접수',
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: '주문 상품은 최소 1개 이상이어야 합니다.',
      },
    },
    payment: {
      type: paymentSchema,
      required: true,
    },
    shipping: {
      type: shippingSchema,
      required: true,
    },
    discount: {
      type: discountSchema,
      default: () => ({}),
    },
    // 금액 정보
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // 관리자 메모
    adminMemo: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 인덱스 추가 (조회 성능 향상)
orderSchema.index({ user: 1, createdAt: -1 }); // 사용자별 주문 조회
orderSchema.index({ orderNumber: 1 }); // 주문번호로 조회
orderSchema.index({ status: 1 }); // 상태별 조회
orderSchema.index({ createdAt: -1 }); // 최신 주문 조회

// 가상 필드: 총 상품 수량
orderSchema.virtual('totalQuantity').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 주문번호 자동 생성 미들웨어 (validation 전에 실행)
// pre('validate')를 사용하여 validation 전에 orderNumber를 생성
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber || this.orderNumber.trim() === '') {
    // YYYYMMDDHHMMSS + 랜덤 4자리 형식
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }
  next();
});

// 주문번호 자동 생성 미들웨어 (save 전에도 실행 - 이중 보호)
orderSchema.pre('save', function (next) {
  if (!this.orderNumber || this.orderNumber.trim() === '') {
    // YYYYMMDDHHMMSS + 랜덤 4자리 형식
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
