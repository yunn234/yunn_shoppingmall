const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '유효한 이메일 형식이 아닙니다.'],
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    },
    phoneNumber: {
      type: String,
      required: [true, '전화번호는 필수입니다.'],
      trim: true,
    },
    userType: {
      type: String,
      required: [true, '사용자 유형은 필수입니다.'],
      enum: {
        values: ['customer', 'admin'],
        message: '사용자 유형은 customer 또는 admin이어야 합니다.',
      },
      default: 'customer',
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 인덱스 추가 (검색 성능 향상)
// email은 unique: true로 이미 인덱스가 생성되므로 제외
userSchema.index({ userType: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
