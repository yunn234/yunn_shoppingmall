const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" 형식

    // 토큰이 없는 경우
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    // 토큰에서 사용자 ID로 사용자 정보 조회
    const user = await User.findById(decoded.userId).select('-password');

    // 사용자가 존재하지 않는 경우
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // req.user에 사용자 정보 추가 (다음 미들웨어/컨트롤러에서 사용)
    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
      });
    }

    return res.status(500).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = { authenticateToken };
