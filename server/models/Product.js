const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: [true, '상품코드는 필수입니다.'],
      unique: true,
      trim: true,
      uppercase: true, // 상품코드는 대문자로 저장
    },
    name: {
      type: String,
      required: [true, '상품이름은 필수입니다.'],
      trim: true,
    },
    options: {
      type: [
        {
          optionName: {
            type: String,
            required: true,
            trim: true,
          },
          optionValue: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      required: [true, '상품옵션은 필수입니다.'],
      validate: {
        validator: function (options) {
          return options && options.length > 0;
        },
        message: '최소 하나 이상의 상품옵션이 필요합니다.',
      },
    },
    price: {
      type: Number,
      required: [true, '상품가격은 필수입니다.'],
      min: [0, '상품가격은 0 이상이어야 합니다.'],
    },
    category: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      enum: {
        values: ['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'],
        message: '카테고리는 TOP, OUTER, PANTS, DRESS/SKIRT, BAG/SHOES 중 하나여야 합니다.',
      },
    },
    images: {
      type: [String],
      required: [true, '이미지는 필수입니다.'],
      validate: {
        validator: function (images) {
          return images && images.length > 0;
        },
        message: '최소 하나 이상의 이미지가 필요합니다.',
      },
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      required: false,
      enum: {
        values: ['판매중', '판매중지'],
        message: '상태는 판매중 또는 판매중지여야 합니다.',
      },
      default: '판매중',
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 인덱스 추가 (검색 성능 향상)
productSchema.index({ productCode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 1 }); // 상품명 검색을 위한 인덱스

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
