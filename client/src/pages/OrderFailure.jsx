import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './OrderFailure.css';

function OrderFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorInfo, setErrorInfo] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // location.state에서 에러 정보 가져오기
    const errorFromState = location.state?.error;
    
    if (errorFromState) {
      setErrorInfo(errorFromState);
    } else {
      // state에 에러 정보가 없으면 기본 에러 메시지 설정
      setErrorInfo({
        message: '주문 처리 중 오류가 발생했습니다.',
        error: '알 수 없는 오류',
      });
    }

    // 사용자 정보 가져오기
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.data);
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
        }
      }
    };

    fetchUserInfo();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    setUser(null);
    alert('로그아웃되었습니다.');
    window.location.href = '/';
  };

  return (
    <div className="order-failure-container">
      <Navbar user={user} loading={false} onLogout={handleLogout} />
      
      <div className="order-failure-content">
        <div className="failure-icon">✗</div>
        <h1 className="failure-title">주문 처리에 실패했습니다</h1>
        <p className="failure-message">
          주문 처리 중 문제가 발생했습니다. 아래 내용을 확인해주세요.
        </p>

        {/* 에러 정보 */}
        <div className="error-info-section">
          <h2 className="section-title">오류 정보</h2>
          <div className="error-details">
            <div className="error-item">
              <span className="error-label">오류 메시지</span>
              <span className="error-value">{errorInfo?.message || '알 수 없는 오류가 발생했습니다.'}</span>
            </div>
            {errorInfo?.error && (
              <div className="error-item">
                <span className="error-label">상세 오류</span>
                <span className="error-value detail">{errorInfo.error}</span>
              </div>
            )}
            {errorInfo?.code && (
              <div className="error-item">
                <span className="error-label">오류 코드</span>
                <span className="error-value">{errorInfo.code}</span>
              </div>
            )}
          </div>
        </div>

        {/* 가능한 원인 */}
        <div className="possible-causes-section">
          <h2 className="section-title">가능한 원인</h2>
          <ul className="causes-list">
            <li>결제 정보가 올바르지 않습니다</li>
            <li>장바구니에 상품이 없거나 변경되었습니다</li>
            <li>상품 재고가 부족합니다</li>
            <li>서버와의 통신 중 문제가 발생했습니다</li>
            <li>중복 주문이 감지되었습니다</li>
          </ul>
        </div>

        {/* 해결 방법 */}
        <div className="solution-section">
          <h2 className="section-title">해결 방법</h2>
          <ul className="solution-list">
            <li>장바구니를 확인하고 다시 시도해주세요</li>
            <li>결제 정보를 다시 확인해주세요</li>
            <li>잠시 후 다시 시도해주세요</li>
            <li>문제가 계속되면 고객센터로 문의해주세요</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/cart')}>
            장바구니로 돌아가기
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </button>
          <button className="btn-retry" onClick={() => navigate('/checkout')}>
            다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderFailure;
