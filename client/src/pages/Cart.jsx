import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('장바구니를 보려면 로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        if (error.response?.status === 401) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchCart();
    }
  }, [loading, user]);

  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const response = await apiClient.get('/carts');
      if (response.data?.success) {
        setCart(response.data.data);
      } else {
        console.error('장바구니 조회 실패:', response.data);
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await apiClient.put(`/carts/items/${itemId}`, {
        quantity: newQuantity,
      });

      if (response.data?.success) {
        setCart(response.data.data);
      } else {
        alert(response.data?.message || '수량 변경 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('수량 변경 오류:', error);
      alert('수량 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('정말 이 상품을 장바구니에서 삭제하시겠습니까?')) {
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      const response = await apiClient.delete(`/carts/items/${itemId}`);

      if (response.data?.success) {
        setCart(response.data.data);
        alert('장바구니에서 상품이 삭제되었습니다.');
      } else {
        alert(response.data?.message || '상품 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('정말 장바구니를 모두 비우시겠습니까?')) {
      return;
    }

    try {
      const response = await apiClient.delete('/carts');

      if (response.data?.success) {
        setCart(response.data.data);
        alert('장바구니가 비워졌습니다.');
      } else {
        alert(response.data?.message || '장바구니 비우기 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('장바구니 비우기 오류:', error);
      alert('장바구니 비우기 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    setUser(null);
    alert('로그아웃되었습니다.');
    window.location.href = '/';
  };

  // 총 금액 계산
  const calculateTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return { subtotal: 0, shipping: 0, total: 0 };
    }

    const subtotal = cart.items.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    const shipping = subtotal >= 70000 ? 0 : 2500;
    const total = subtotal + shipping;

    return { subtotal, shipping, total };
  };

  const { subtotal, shipping, total } = calculateTotal();

  if (loading || cartLoading) {
    return (
      <div className="cart-container">
        <Navbar user={user} loading={loading} onLogout={handleLogout} />
        <div className="cart-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <Navbar user={user} loading={loading} onLogout={handleLogout} />

      <div className="cart-content">
        <div className="cart-header">
          <h1 className="cart-title">장바구니</h1>
          {cart && cart.items && cart.items.length > 0 && (
            <button className="clear-cart-btn" onClick={handleClearCart}>
              전체 삭제
            </button>
          )}
        </div>

        {!cart || !cart.items || cart.items.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <p className="empty-message">장바구니가 비어있습니다.</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              쇼핑 계속하기
            </button>
          </div>
        ) : (
          <div className="cart-main">
            {/* 장바구니 아이템 목록 */}
            <div className="cart-items">
              {cart.items.map((item) => {
                const product = item.product;
                const isUpdating = updatingItems.has(item._id.toString());

                if (!product) {
                  return null;
                }

                return (
                  <div key={item._id} className="cart-item">
                    <div className="item-image">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          onClick={() => navigate(`/products/${product._id}`)}
                        />
                      ) : (
                        <div className="no-image">이미지 없음</div>
                      )}
                    </div>
                    <div className="item-info">
                      <h3 
                        className="item-name"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        {product.name}
                      </h3>
                      <p className="item-category">{product.category}</p>
                      {item.selectedOptions && (item.selectedOptions.color || item.selectedOptions.size) && (
                        <p className="item-options">
                          {item.selectedOptions.color && `색상: ${item.selectedOptions.color}`}
                          {item.selectedOptions.color && item.selectedOptions.size && ' / '}
                          {item.selectedOptions.size && `사이즈: ${item.selectedOptions.size}`}
                        </p>
                      )}
                      <p className="item-price">₩{parseInt(product.price).toLocaleString()}</p>
                    </div>
                    <div className="item-quantity">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item._id.toString(), item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item._id.toString(), item.quantity + 1)}
                        disabled={isUpdating}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      <p className="item-total-price">
                        ₩{(product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <div className="item-actions">
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item._id.toString())}
                        disabled={isUpdating}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 주문 요약 */}
            <div className="cart-summary">
              <h2 className="summary-title">주문 요약</h2>
              <div className="summary-row">
                <span>상품 금액</span>
                <span>₩{subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span>
                  {shipping === 0 ? (
                    <span className="free-shipping">무료</span>
                  ) : (
                    `₩${shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              {subtotal > 0 && subtotal < 70000 && (
                <p className="shipping-notice">
                  70,000원 이상 구매 시 배송비 무료
                </p>
              )}
              <div className="summary-total">
                <span>총 결제금액</span>
                <span className="total-price">₩{total.toLocaleString()}</span>
              </div>
              <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                주문하기
              </button>
              <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                쇼핑 계속하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
