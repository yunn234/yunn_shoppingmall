import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value,
    }));
    if (errors.phoneNumber) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: '',
      }));
    }
  };

  const handleAgreementChange = (name) => {
    if (name === 'all') {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue,
      });
    } else {
      setAgreements((prev) => ({
        ...prev,
        [name]: !prev[name],
        all: false,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력하세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력하세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력하세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력하세요.';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '휴대폰 번호를 입력하세요.';
    } else if (formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = '유효한 휴대폰 번호를 입력하세요.';
    }

    if (!agreements.terms) {
      newErrors.terms = '이용약관에 동의해주세요.';
    }

    if (!agreements.privacy) {
      newErrors.privacy = '개인정보 수집 및 이용에 동의해주세요.';
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
      // 서버로 전송할 사용자 데이터 준비
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber,
        userType: 'customer', // 일반 회원가입은 customer로 설정
      };

      console.log('회원가입 요청 데이터:', userData);

      // 서버에 POST 요청으로 사용자 생성
      const response = await apiClient.post('/users', userData);

      console.log('서버 응답:', response.data);

      // 성공 응답 확인
      if (response.data && response.data.success) {
        alert('회원가입이 완료되었습니다!');
        // 성공 시 메인 페이지로 이동
        navigate('/');
      } else {
        alert('회원가입 처리 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);

      // 서버에서 반환한 에러 메시지 처리
      if (error.response) {
        const errorData = error.response.data;
        
        // 서버에서 반환한 에러 메시지
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // 유효성 검증 오류가 배열로 반환된 경우
          errorMessage = errorData.errors.join('\n');
        }

        alert(errorMessage);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        // 요청 설정 중 오류가 발생한 경우
        alert('요청을 처리하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <h1>회원가입</h1>
        <p className="subtitle">LUMI의 회원이 되어 다양한 혜택을 누려보세요</p>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* 이메일 */}
          <div className="form-group">
            <label htmlFor="email">
              이메일 <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="password">
              비밀번호 <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              비밀번호 확인 <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* 이름 */}
          <div className="form-group">
            <label htmlFor="name">
              이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* 휴대폰 번호 */}
          <div className="form-group">
            <label htmlFor="phoneNumber">
              휴대폰 번호 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="'-' 없이 입력하세요"
              className={errors.phoneNumber ? 'error' : ''}
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>

          {/* 약관 동의 */}
          <div className="agreement-section">
            <div className="agreement-item">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreements.all}
                  onChange={() => handleAgreementChange('all')}
                />
                <span>전체 동의</span>
              </label>
            </div>

            <div className="agreement-item">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={() => handleAgreementChange('terms')}
                />
                <span>이용약관 동의 (필수)</span>
              </label>
              <button type="button" className="view-link">보기</button>
            </div>

            <div className="agreement-item">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={() => handleAgreementChange('privacy')}
                />
                <span>개인정보 수집 및 이용 동의 (필수)</span>
              </label>
              <button type="button" className="view-link">보기</button>
            </div>

            <div className="agreement-item">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreements.marketing}
                  onChange={() => handleAgreementChange('marketing')}
                />
                <span>마케팅 정보 수신 동의 (선택)</span>
              </label>
              <button type="button" className="view-link">보기</button>
            </div>

            {(errors.terms || errors.privacy) && (
              <span className="error-message">필수 약관에 동의해주세요.</span>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '회원가입'}
          </button>
        </form>

        {/* 회원가입 혜택 */}
        <div className="benefits-box">
          <h3>회원가입 혜택</h3>
          <ul>
            <li>신규 회원 10% 할인 쿠폰 즉시 지급</li>
            <li>무료 배송 쿠폰 3장</li>
            <li>구매 금액의 2% 적립</li>
            <li>생일 쿠폰 및 특별 프로모션</li>
          </ul>
        </div>

        {/* 로그인 링크 */}
        <div className="login-link">
          이미 회원이신가요? <button type="button" onClick={() => navigate('/')}>로그인</button>
        </div>

        {/* 저작권 */}
        <div className="copyright">
          © 2026 LUMI. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default SignUp;
