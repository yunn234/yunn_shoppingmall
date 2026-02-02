import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './ProductList.css';

// Cloudinary URL 최적화 함수
const getImageUrl = (url) => {
  // URL이 없거나 문자열이 아니면 그대로 반환
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // Cloudinary URL이 아니면 그대로 반환
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  
  // 이미 최적화 옵션이 들어있으면 그대로 반환
  if (url.includes('q_auto')) {
    return url;
  }

  try {
    // /upload/ 키워드를 기준으로 주소를 자름
    const parts = url.split('/upload/');
    
    // 정확히 2개로 나뉘어야 함 (앞부분 + 뒷부분)
    if (parts.length === 2 && parts[0] && parts[1]) {
      // /upload/ 바로 뒤에 옵션을 끼워넣음
      const optimized = `${parts[0]}/upload/q_auto,f_auto/${parts[1]}`;
      return optimized;
    }
  } catch (e) {
    console.error("URL 최적화 중 에러:", e, "원본 URL:", url);
  }
  
  // 에러 발생 시 원본 URL 반환
  return url;
};

function ProductList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [loading, currentPage]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      // API 호출: GET /api/products (페이지당 2개씩 표시)
      const response = await apiClient.get('/products', {
        params: {
          page: currentPage,
          limit: 2, // 페이지당 2개씩 표시
        },
      });

      // 응답 데이터 확인
      if (response.data?.success) {
        const productsData = response.data.data || [];
        console.log('상품 목록 데이터:', productsData);
        if (productsData.length > 0) {
          console.log('첫 번째 상품:', {
            name: productsData[0].name,
            images: productsData[0].images,
            imagesType: typeof productsData[0].images,
            isArray: Array.isArray(productsData[0].images),
            firstImage: productsData[0].images?.[0]
          });
        }
        setProducts(productsData);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        // 서버에서 success: false를 반환한 경우
        console.error('상품 목록 조회 실패:', response.data);
        alert(response.data?.message || '상품 목록을 불러오는 중 오류가 발생했습니다.');
        setProducts([]);
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error);
      
      // 에러 타입에 따른 처리
      if (error.response) {
        // 서버가 응답했지만 에러 상태 코드
        const errorMessage = error.response.data?.message || '서버 오류가 발생했습니다.';
        alert(`상품 목록을 불러오는 중 오류가 발생했습니다: ${errorMessage}`);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        // 요청 설정 중 오류
        alert('요청을 처리하는 중 오류가 발생했습니다.');
      }
      
      setProducts([]);
      setTotalPages(1);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('정말 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/products/${productId}`);
      if (response.data?.success) {
        alert('상품이 삭제되었습니다.');
        fetchProducts(); // 목록 새로고침
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };

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
    { id: '대시보드', icon: '▦', label: '대시보드', path: '/admin' },
    { id: '상품 관리', icon: '📦', label: '상품 관리', path: '/admin/products' },
    { id: '주문 관리', icon: '🛒', label: '주문 관리', path: '/admin/orders' },
    { id: '회원 관리', icon: '👥', label: '회원 관리', path: '/admin/users' },
    { id: '통계', icon: '📊', label: '통계', path: '/admin/statistics' },
    { id: '설정', icon: '⚙️', label: '설정', path: '/admin/settings' },
  ];

  return (
    <div className="product-list-container">
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
              className={`nav-item ${item.id === '상품 관리' ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
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
      <div className="product-list-main">
        {/* Header */}
        <header className="product-list-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/admin')}>
              ←
            </button>
            <h1 className="page-title">상품 관리</h1>
          </div>
        </header>

        {/* Content */}
        <main className="product-list-content">
          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="action-btn active"
              onClick={() => navigate('/admin/products')}
            >
              상품 목록
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/products/register')}
            >
              상품 등록
            </button>
          </div>

          {/* Products Table */}
          <div className="products-table-container">
            {productsLoading ? (
              <div className="loading-message">상품 목록을 불러오는 중...</div>
            ) : products.length === 0 ? (
              <div className="empty-message">등록된 상품이 없습니다.</div>
            ) : (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>이미지</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th>가격</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="image-cell" style={{ position: 'relative', width: '120px', height: '120px', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
                        {product.images?.[0] ? (
                          <img 
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              opacity: 1,
                              visibility: 'visible',
                              position: 'relative',
                              zIndex: 10
                            }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td className="name-cell">{product.name}</td>
                      <td className="category-cell">{product.category}</td>
                      <td className="price-cell">₩{parseInt(product.price).toLocaleString()}</td>
                      <td className="status-cell">
                        <span className={`status-badge ${product.status === '판매중' ? 'active' : 'inactive'}`}>
                          {product.status || '판매중'}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button 
                          className="edit-btn"
                          onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        >
                          수정
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(product._id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <span className="page-info">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProductList;
