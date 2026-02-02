import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('대시보드');

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data?.success) {
          const userData = response.data.data;
          if (userData.userType !== 'admin') {
            alert('관리자 권한이 필요합니다.');
            navigate('/');
            return;
          }
          setUser(userData);
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    navigate('/');
  };

  if (loading) {
    return <div className="admin-loading">로딩 중...</div>;
  }

  const menuItems = [
    { id: '대시보드', icon: '▦', label: '대시보드' },
    { id: '상품 관리', icon: '📦', label: '상품 관리' },
    { id: '주문 관리', icon: '🛒', label: '주문 관리' },
    { id: '회원 관리', icon: '👥', label: '회원 관리' },
    { id: '통계', icon: '📊', label: '통계' },
    { id: '설정', icon: '⚙️', label: '설정' },
  ];

  // 더미 데이터
  const metrics = [
    { label: '총 매출', value: '₩12,450,000', change: '+12.5%', isPositive: true, icon: '₩' },
    { label: '주문 건수', value: '156', change: '+8.2%', isPositive: true, icon: '🛒' },
    { label: '방문자 수', value: '2,847', change: '-3.1%', isPositive: false, icon: '👁️' },
    { label: '회원 수', value: '1,234', change: '+5.7%', isPositive: true, icon: '👥' },
  ];

  const recentOrders = [
    { id: 'ORD-001', status: '배송중', statusColor: 'blue', product: '니콘 소프트 램스울 브이넥 니트', customer: '김민지', date: '2026-02-01', price: '₩28,000' },
    { id: 'ORD-002', status: '결제완료', statusColor: 'orange', product: '클래식 울 하프 코트', customer: '이수진', date: '2026-02-01', price: '₩158,000' },
    { id: 'ORD-003', status: '배송완료', statusColor: 'green', product: '울리 히든밴딩 융기모 와이드데님', customer: '박서연', date: '2026-01-31', price: '₩33,000' },
  ];

  const popularProducts = [
    { rank: 1, name: '니콘 소프트 램스울 브이넥 니트', sales: '342개 판매', revenue: '₩9,576,000' },
    { rank: 2, name: '클래식 울 하프 코트', sales: '128개 판매', revenue: '₩20,224,000' },
    { rank: 3, name: '울리 히든밴딩 융기모 와이드데님', sales: '256개 판매', revenue: '₩8,448,000' },
    { rank: 4, name: '아크 속기모 반목 폴라T', sales: '189개 판매', revenue: '₩3,685,500' },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">LUMI</h1>
          <p className="sidebar-subtitle">관리자 패널</p>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu(item.id);
                if (item.id === '상품 관리') {
                  navigate('/admin/products');
                } else if (item.id === '주문 관리') {
                  navigate('/admin/orders');
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <p className="admin-email">{user?.email || 'admin@lumi.com'}</p>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃 →
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="nav-icon-btn">◀</button>
            <button className="nav-icon-btn">▶</button>
            <span className="path-indicator">/admin</span>
          </div>
          <div className="header-center">
            <input type="text" className="search-input" placeholder="Q 검색..." />
          </div>
          <div className="header-right">
            <select className="latest-dropdown">
              <option>Latest</option>
            </select>
            <button className="icon-btn">▦</button>
            <button className="icon-btn">⋯</button>
            <button className="notification-btn">
              🔔
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="admin-content">
          <h1 className="dashboard-title">대시보드</h1>
          
          {/* Metrics Cards */}
          <div className="metrics-grid">
            {metrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-content">
                  <div className="metric-value">{metric.value}</div>
                  <div className="metric-label">{metric.label}</div>
                  <div className={`metric-change ${metric.isPositive ? 'positive' : 'negative'}`}>
                    {metric.isPositive ? '↑' : '↓'} {metric.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Orders and Popular Products */}
          <div className="dashboard-sections">
            {/* Recent Orders */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">최근 주문</h2>
                <button className="view-all-btn">전체보기 {'>'}</button>
              </div>
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-id">{order.id}</div>
                    <span className={`status-badge ${order.statusColor}`}>{order.status}</span>
                    <div className="order-details">
                      <p className="order-product">{order.product}</p>
                      <p className="order-customer">{order.customer}</p>
                      <p className="order-date">{order.date}</p>
                    </div>
                    <div className="order-price">{order.price}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Products */}
            <section className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">인기 상품</h2>
                <button className="view-all-btn">전체보기 {'>'}</button>
              </div>
              <div className="products-list">
                {popularProducts.map((product) => (
                  <div key={product.rank} className="product-item">
                    <span className="product-rank">{product.rank}</span>
                    <div className="product-details">
                      <p className="product-name">{product.name}</p>
                      <p className="product-sales">{product.sales}</p>
                    </div>
                    <div className="product-revenue">{product.revenue}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h2 className="quick-actions-title">빠른 작업</h2>
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/admin/products/register')}
              >
                <div className="quick-action-icon">📦</div>
                <span className="quick-action-label">상품 등록</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate('/admin/orders')}
              >
                <div className="quick-action-icon">🛒</div>
                <span className="quick-action-label">주문 확인</span>
              </button>
              <button className="quick-action-btn">
                <div className="quick-action-icon">📊</div>
                <span className="quick-action-label">매출 리포트</span>
              </button>
              <button className="quick-action-btn">
                <div className="quick-action-icon">⚙️</div>
                <span className="quick-action-label">설정</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Admin;
