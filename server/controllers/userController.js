const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// CREATE - 새 사용자 생성
const createUser = async (req, res) => {
  try {
    const { email, name, password, phoneNumber, userType, address, birthDate } = req.body;

    // 필수 필드 검증
    if (!email || !name || !password || !phoneNumber || !userType) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.',
        required: ['email', 'name', 'password', 'phoneNumber', 'userType'],
      });
    }

    // userType 검증
    if (!['customer', 'admin'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType은 customer 또는 admin이어야 합니다.',
      });
    }

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      email,
      name,
      password: hashedPassword, // 암호화된 비밀번호 저장
      phoneNumber,
      userType,
    };

    // address가 제공된 경우 추가
    if (address) {
      userData.address = address;
    }

    // birthDate가 제공된 경우 추가
    if (birthDate) {
      userData.birthDate = new Date(birthDate);
    }

    const user = new User(userData);
    const savedUser = await user.save();

    // 비밀번호 제외하고 응답
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      // 중복 이메일 오류
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 모든 사용자 조회
const getAllUsers = async (req, res) => {
  try {
    const { userType, page = 1, limit = 10 } = req.query;
    const query = {};

    // userType 필터링
    if (userType && ['customer', 'admin'].includes(userType)) {
      query.userType = userType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password') // 비밀번호 제외
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 특정 사용자 조회
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// UPDATE - 사용자 정보 수정
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, phoneNumber, userType, address, birthDate } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    // userType 검증 (제공된 경우)
    if (userType && !['customer', 'admin'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType은 customer 또는 admin이어야 합니다.',
      });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (userType) updateData.userType = userType;
    if (address) updateData.address = address;
    if (birthDate !== undefined) {
      updateData.birthDate = birthDate ? new Date(birthDate) : null;
    }

    // 비밀번호가 제공된 경우 암호화
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      data: user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// DELETE - 사용자 삭제
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.',
      data: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// LOGIN - 사용자 로그인
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 사용자가 존재하지 않는 경우
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // 비밀번호가 일치하지 않는 경우
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '7d', // 7일 후 만료
      }
    );

    // 비밀번호 제외하고 사용자 정보 준비
    const userResponse = user.toObject();
    delete userResponse.password;

    // 로그인 성공 응답
    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// GET CURRENT USER - 토큰으로 현재 로그인한 사용자 정보 가져오기
const getCurrentUser = async (req, res) => {
  try {
    // authenticateToken 미들웨어에서 req.user에 사용자 정보가 추가됨
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getCurrentUser,
};
