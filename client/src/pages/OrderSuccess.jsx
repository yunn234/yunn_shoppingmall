import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './OrderSuccess.css';

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // location.state에서 주문 정보 가져오기
    const orderFromState = location.state?.order;
    
    if (orderFromState) {
      setOrder(orderFromState);
      setLoading(false);
    } else {
      // state에 주문 정보가 없으면 주문 목록으로 리다이렉트
      navigate('/');
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
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    setUser(null);
    alert('로그아웃되었습니다.');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="order-success-container">
        <Navbar user={user} loading={false} onLogout={handleLogout} />
        <div className="order-success-loading">로딩 중...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-success-container">
        <Navbar user={user} loading={false} onLogout={handleLogout} />
        <div className="order-success-error">
          <h2>주문 정보를 찾을 수 없습니다.</h2>
          <button onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-success-container">
      <Navbar user={user} loading={false} onLogout={handleLogout} />
      
      <div className="order-success-content">
        <div className="success-icon">✓</div>
        <h1 className="success-title">주문이 완료되었습니다!</h1>
        <p className="success-message">주문해주셔서 감사합니다.</p>

        {/* 주문 정보 */}
        <div className="order-info-section">
          <h2 className="section-title">주문 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">주문번호</span>
              <span className="info-value">{order.orderNumber || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">주문일시</span>
              <span className="info-value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">주문상태</span>
              <span className={`info-value status ${order.status}`}>
                {order.status || '주문접수'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">결제수단</span>
              <span className="info-value">{order.payment?.method || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">결제상태</span>
              <span className={`info-value status ${order.payment?.status}`}>
                {order.payment?.status || '-'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">결제금액</span>
              <span className="info-value amount">
                ₩{order.totalAmount?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="order-items-section">
          <h2 className="section-title">주문 상품</h2>
          <div className="order-items-list">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="order-item-card">
                  <img
                    src={item.image || item.product?.images?.[0] || ''}
                    alt={item.productName}
                    className="order-item-image"
                  />
                  <div className="order-item-details">
                    <h3 className="order-item-name">{item.productName}</h3>
                    <p className="order-item-code">상품코드: {item.productCode}</p>
                    {item.selectedOptions && (item.selectedOptions.color || item.selectedOptions.size) && (
                      <p className="order-item-options">
                        옵션: {item.selectedOptions.color || ''} {item.selectedOptions.size || ''}
                      </p>
                    )}
                    <p className="order-item-quantity">수량: {item.quantity}개</p>
                    <p className="order-item-price">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>주문 상품 정보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 배송 정보 */}
        {order.shipping && (
          <div className="shipping-info-section">
            <h2 className="section-title">배송 정보</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">받는사람</span>
                <span className="info-value">{order.shipping.recipientName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">연락처</span>
                <span className="info-value">{order.shipping.recipientPhone || '-'}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">배송주소</span>
                <span className="info-value">
                  [{order.shipping.postalCode || ''}] {order.shipping.address || ''} {order.shipping.detailAddress || ''}
                </span>
              </div>
              {order.shipping.deliveryMemo && (
                <div className="info-item full-width">
                  <span className="info-label">배송 메시지</span>
                  <span className="info-value">{order.shipping.deliveryMemo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 금액 정보 */}
        <div className="amount-info-section">
          <h2 className="section-title">결제 정보</h2>
          <div className="amount-details">
            <div className="amount-row">
              <span>상품금액</span>
              <span>₩{order.subtotal?.toLocaleString() || '0'}</span>
            </div>
            <div className="amount-row">
              <span>배송비</span>
              <span>₩{order.shipping?.shippingFee?.toLocaleString() || '0'}</span>
            </div>
            {order.discount && (order.discount.couponDiscount > 0 || order.discount.pointUsed > 0) && (
              <>
                {order.discount.couponDiscount > 0 && (
                  <div className="amount-row discount">
                    <span>할인쿠폰</span>
                    <span>-₩{order.discount.couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                {order.discount.pointUsed > 0 && (
                  <div className="amount-row discount">
                    <span>사용포인트</span>
                    <span>-₩{order.discount.pointUsed.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
            <div className="amount-row total">
              <span>최종 결제금액</span>
              <span className="total-amount">₩{order.totalAmount?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/')}>
            쇼핑 계속하기
          </button>
          <button className="btn-secondary" onClick={() => navigate('/orders/my')}>
            주문 내역 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
