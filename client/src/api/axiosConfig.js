import axios from 'axios';

// axios 인스턴스 생성
const apiClient = axios.create({
  // 환경변수가 있으면 쓰고, 없으면 Render 백엔드 주소를 직접 사용
  baseURL: (import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || 'https://yunn-shoppingmall-backend.onrender.com/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 Authorization 헤더에 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 요청 전 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    // 응답 후 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('API Response:', response.status, response.data);
    }
    return response;
  },
  (error) => {
    // 에러 로깅
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.status, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
