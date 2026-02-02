import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import './Navbar.css';

function Navbar({ user, loading, onLogout }) {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-menu-wrapper')) {
        setShowUserDropdown(false);
      }
      if (showLoginDropdown && !event.target.closest('.login-menu-wrapper')) {
        setShowLoginDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown, showLoginDropdown]);

  // 장바구니 아이템 수 가져오기
  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setCartItemCount(0);
        return;
      }

      try {
        const response = await apiClient.get('/carts');
        if (response.data?.success && response.data.data?.items) {
          const totalCount = response.data.data.items.reduce((sum, item) => {
            return sum + (item.quantity || 0);
          }, 0);
          setCartItemCount(totalCount);
        } else {
          setCartItemCount(0);
        }
      } catch (error) {
        // 에러가 발생해도 수량을 0으로 설정 (로그인 만료 등)
        setCartItemCount(0);
      }
    };

    if (user) {
      fetchCartCount();
      // 주기적으로 장바구니 수량 업데이트 (선택사항)
      const interval = setInterval(fetchCartCount, 30000); // 30초마다 업데이트
      return () => clearInterval(interval);
    } else {
      setCartItemCount(0);
    }
  }, [user]);

  const handleLogout = () => {
    setShowUserDropdown(false);
    onLogout();
  };

  const isLoggedIn = !loading && user;
  const isLoggedOut = !loading && !user;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="menu-button">☰</button>
      </div>
      <div className="nav-center">
        <h1 className="logo">LUMI</h1>
      </div>
      <div className="nav-right">
        {isLoggedOut ? (
          <div className="login-menu-wrapper">
            <button 
              className="user-icon-button"
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
            >
              👤
            </button>
            {showLoginDropdown && (
              <div className="dropdown-menu-login">
                <button 
                  className="dropdown-item-login"
                  onClick={() => {
                    setShowLoginDropdown(false);
                    navigate('/login');
                  }}
                >
                  로그인
                </button>
                <button 
                  className="dropdown-item-login"
                  onClick={() => {
                    setShowLoginDropdown(false);
                    navigate('/signup');
                  }}
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        ) : isLoggedIn ? (
          <div className="user-nav-info">
            <div className="user-menu-wrapper">
              <button 
                className="welcome-button-nav"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <span>{user.name}님 환영합니다</span>
                <span className="dropdown-arrow-nav">{showUserDropdown ? '▲' : '▼'}</span>
              </button>
              {showUserDropdown && (
                <div className="dropdown-menu-nav">
                  <button 
                    className="dropdown-item-nav"
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/orders/my');
                    }}
                  >
                    내 주문목록
                  </button>
                  <button className="dropdown-item-nav logout" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
            {user.userType === 'admin' && (
              <button className="admin-button" onClick={() => navigate('/admin')}>
                어드민
              </button>
            )}
          </div>
        ) : null}
        <div className="cart-icon-wrapper">
          <button 
            className="icon-button" 
            onClick={() => navigate('/cart')}
            title="장바구니"
          >
            🛒
          </button>
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </div>
        <button className="icon-button">🔍</button>
      </div>
    </nav>
  );
}

export default Navbar;
