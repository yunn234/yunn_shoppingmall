const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGODB_ATLAS_URL을 우선 사용, 없으면 로컬 주소 사용
    const mongoUri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall';
    
    const conn = await mongoose.connect(mongoUri);
    
    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
    
    // 연결 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 오류:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 연결이 끊어졌습니다.');
    });
    
    // 프로세스 종료 시 연결 종료
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 연결이 종료되었습니다.');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
