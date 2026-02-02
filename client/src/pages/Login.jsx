import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [saveId, setSaveId] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 토큰 확인 및 자동 리다이렉트
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      // 토큰이 없으면 저장된 아이디만 불러오기
      if (!token) {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
          setFormData((prev) => ({
            ...prev,
            email: savedEmail,
          }));
          setSaveId(true);
        }
        setIsCheckingAuth(false);
        return;
      }

      // 토큰이 있으면 유저 정보 확인
      try {
        const response = await apiClient.get('/auth/me');
        
        if (response.data && response.data.success) {
          // 유효한 토큰이 있고 유저 정보를 가져올 수 있으면 메인 페이지로 리다이렉트
          navigate('/');
        } else {
          // 응답이 유효하지 않으면 토큰 삭제
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsCheckingAuth(false);
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 삭제하고 로그인 페이지에 머물기
        console.error('인증 확인 오류:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 저장된 아이디 불러오기
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
          setFormData((prev) => ({
            ...prev,
            email: savedEmail,
          }));
          setSaveId(true);
        }
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '아이디(이메일)를 입력하세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력하세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 폼 유효성 검증
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('로그인 요청:', { email: formData.email.trim() });

      // 서버에 로그인 요청
      const response = await apiClient.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log('로그인 응답:', response.data);

      // 서버 응답 구조: { success: true, message: '...', data: { user: {...}, token: '...' } }
      if (response.data && response.data.success) {
        const { user, token } = response.data.data || {};

        // 토큰과 사용자 정보 저장
        if (token) {
          localStorage.setItem('token', token);
          console.log('토큰이 저장되었습니다.');
        }

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          console.log('사용자 정보가 저장되었습니다:', user);
        }

        // 아이디 저장 처리
        if (saveId) {
          localStorage.setItem('savedEmail', formData.email.trim());
        } else {
          localStorage.removeItem('savedEmail');
        }

        alert('로그인에 성공했습니다!');
        // 메인 페이지로 이동
        navigate('/');
      } else {
        // 예상치 못한 응답 구조
        alert('로그인 응답 형식이 올바르지 않습니다.');
        console.error('예상치 못한 응답:', response.data);
      }
    } catch (error) {
      console.error('로그인 오류 상세:', error);

      // 서버에서 반환한 에러 메시지 처리
      if (error.response) {
        const errorData = error.response.data;
        let errorMessage = '로그인 중 오류가 발생했습니다.';

        // 서버 응답 구조에 맞춰 에러 메시지 추출
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        // 에러 메시지를 폼에 표시
        if (error.response.status === 401) {
          // 인증 실패 (이메일 또는 비밀번호 오류)
          setErrors({
            email: '',
            password: errorMessage,
          });
        } else if (error.response.status === 400) {
          // 잘못된 요청
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const formErrors = {};
            errorData.errors.forEach((err) => {
              if (err.includes('이메일')) formErrors.email = err;
              if (err.includes('비밀번호')) formErrors.password = err;
            });
            setErrors(formErrors);
          } else {
            alert(errorMessage);
          }
        } else {
          alert(errorMessage);
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
        console.error('요청 오류:', error.request);
      } else {
        // 요청 설정 중 오류가 발생한 경우
        alert('요청을 처리하는 중 오류가 발생했습니다.');
        console.error('요청 설정 오류:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 소셜 로그인 핸들러 (추후 구현)
  const handleSocialLogin = (provider) => {
    alert(`${provider} 로그인은 추후 구현 예정입니다.`);
  };

  const handleLogout = () => {
    // 로그인 페이지에서는 로그아웃 기능이 필요 없지만 Navbar props를 위해 추가
  };

  // 인증 확인 중일 때는 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="login-container">
        <Navbar user={null} loading={false} onLogout={handleLogout} />
        <div className="login-content" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Navbar user={null} loading={false} onLogout={handleLogout} />
      {/* 헤더 */}
      <div className="login-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>LOGIN</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="login-content">
        {/* 소셜 로그인 */}
        <div className="social-login-section">
          <button
            className="social-btn kakao"
            onClick={() => handleSocialLogin('카카오')}
          >
            <span className="social-icon">💬</span>
            <span>카카오로 시작하기</span>
          </button>
          <button
            className="social-btn naver"
            onClick={() => handleSocialLogin('네이버')}
          >
            <span className="social-icon">N</span>
            <span>네이버로 시작하기</span>
          </button>
          <button
            className="social-btn facebook"
            onClick={() => handleSocialLogin('페이스북')}
          >
            <span className="social-icon">f</span>
            <span>페이스북으로 시작하기</span>
          </button>
          <button
            className="social-btn apple"
            onClick={() => handleSocialLogin('애플')}
          >
            <span className="social-icon">🍎</span>
            <span>애플로 시작하기</span>
          </button>
        </div>

        {/* 일반 로그인 */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="아이디"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="login-buttons">
            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
            <button
              type="button"
              className="signup-btn"
              onClick={() => navigate('/signup')}
            >
              회원가입
            </button>
          </div>

          <div className="login-options">
            <div className="left-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={saveId}
                  onChange={(e) => setSaveId(e.target.checked)}
                />
                <span>아이디 저장</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>보안접속</span>
              </label>
            </div>
            <div className="right-options">
              <button type="button" className="link-btn" onClick={() => alert('아이디 찾기 기능은 추후 구현 예정입니다.')}>
                아이디찾기
              </button>
              <span className="divider">|</span>
              <button type="button" className="link-btn" onClick={() => alert('비밀번호 찾기 기능은 추후 구현 예정입니다.')}>
                비밀번호찾기
              </button>
            </div>
          </div>
        </form>

        {/* 비회원 주문조회 */}
        <div className="non-member-section">
          <h2>NON-MEMBER</h2>
          <div className="non-member-form">
            <input
              type="password"
              placeholder="비회원주문 비밀번호"
              className="non-member-input"
            />
            <button
              type="button"
              className="non-member-btn"
              onClick={() => alert('비회원 주문조회 기능은 추후 구현 예정입니다.')}
            >
              비회원 주문조회
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
