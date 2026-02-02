const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();

// CORS 설정
app.use(cors({
  origin: [
    'https://yunn-shoppingmall-pront.vercel.app', // 내 Vercel 프론트엔드 주소
    'http://localhost:3000',                     // 로컬 테스트용
    'http://localhost:5173'                      // Vite 로컬 테스트용
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
connectDB();

// 라우트
app.use('/api', routes);
app.use('/', routes);

// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
