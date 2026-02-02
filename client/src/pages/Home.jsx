import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './Home.css';

const CATEGORIES = ['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'];

// ProductCard 컴포넌트 분리
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  // 서버에서 받은 데이터 형식에 맞게 변환
  const getImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300x400?text=No+Image';
    
    // Cloudinary URL인 경우 최적화 옵션 추가
    if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
      const uploadIndex = url.indexOf('/image/upload/');
      const afterUpload = url.substring(uploadIndex + '/image/upload/'.length);
      
      // 이미 변환 옵션이 있는지 확인 (q_auto, f_auto 등)
      if (!afterUpload.includes('q_auto') && !afterUpload.includes('f_auto')) {
        // 변환 옵션이 없으면 추가
        const beforeUpload = url.substring(0, uploadIndex + '/image/upload/'.length);
        return `${beforeUpload}q_auto,f_auto/${afterUpload}`;
      }
    }
    return url;
  };

  const imageUrl = product.images && product.images.length > 0 
    ? getImageUrl(product.images[0])
    : 'https://via.placeholder.com/300x400?text=No+Image';
  const priceFormatted = typeof product.price === 'number' 
    ? product.price.toLocaleString() 
    : product.price;

  const handleClick = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-image">
        <img src={imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <p className="product-price">₩{priceFormatted}</p>
      </div>
    </div>
  );
};

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('TOP');
  const [weeklyBestProducts, setWeeklyBestProducts] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
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
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // 상품 데이터 가져오기
  useEffect(() => {
    fetchAllProducts();
  }, [selectedCategory]);

  const fetchAllProducts = async () => {
    setProductsLoading(true);
    try {
      // 전체 상품 조회 (페이지네이션 없이 모든 상품 가져오기)
      // limit을 충분히 크게 설정하여 모든 상품 가져오기
      const response = await apiClient.get('/products', {
        params: {
          page: 1,
          limit: 100, // 충분히 큰 값으로 설정
          ...(selectedCategory && { category: selectedCategory }),
        },
      });

      if (response.data?.success) {
        const allProducts = response.data.data || [];
        
        // 판매중인 상품만 필터링
        const activeProducts = allProducts.filter(
          product => product.status === '판매중' || !product.status
        );

        // WEEKLY BEST: 최신 상품 4개 (또는 전체 상품 중 4개)
        const weeklyBest = activeProducts.slice(0, 4);
        setWeeklyBestProducts(weeklyBest);

        // NEW ITEM: 나머지 상품 (최대 8개)
        const newItems = activeProducts.slice(4, 12);
        setNewItems(newItems);
      }
    } catch (error) {
      console.error('상품 데이터 조회 오류:', error);
      // 에러 발생 시 빈 배열로 설정
      setWeeklyBestProducts([]);
      setNewItems([]);
    } finally {
      setProductsLoading(false);
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

  return (
    <div className="home-container">
      <Navbar user={user} loading={loading} onLogout={handleLogout} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-image-placeholder">
            <p>Hero Image</p>
          </div>
        </div>
      </section>

      {/* WEEKLY BEST Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">WEEKLY BEST</h2>
          <p className="section-subtitle">주간 베스트 상품</p>
        </div>
        
        <div className="category-tabs">
          <div className="tabs-container">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="tab-arrows">
            <button className="arrow-button">▲</button>
            <button className="arrow-button">▼</button>
          </div>
        </div>

        {productsLoading ? (
          <div className="loading-message">상품을 불러오는 중...</div>
        ) : weeklyBestProducts.length === 0 ? (
          <div className="empty-message">등록된 상품이 없습니다.</div>
        ) : (
          <div className="products-grid">
            {weeklyBestProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="more-button-container">
          <button className="more-button">더보기</button>
        </div>
      </section>

      {/* NEW ITEM Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">NEW ITEM</h2>
          <p className="section-subtitle">신상품</p>
        </div>

        {productsLoading ? (
          <div className="loading-message">상품을 불러오는 중...</div>
        ) : newItems.length === 0 ? (
          <div className="empty-message">등록된 상품이 없습니다.</div>
        ) : (
          <div className="products-grid">
            {newItems.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="more-button-container">
          <button className="more-button">더보기</button>
        </div>
      </section>

      {/* MAJOR CATEGORY Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">MAJOR CATEGORY</h2>
          <p className="section-subtitle">주요 카테고리</p>
        </div>
        <div className="category-grid">
          <div className="category-card">
            <div className="category-image-placeholder">
              <p>Category 1</p>
            </div>
            <p className="category-description">카테고리 설명</p>
          </div>
          <div className="category-card">
            <div className="category-image-placeholder">
              <p>Category 2</p>
            </div>
            <p className="category-description">카테고리 설명</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>CS CENTER</h3>
            <p>전화: 1588-0000</p>
            <p>이메일: cs@lumi.com</p>
            <p>운영시간: 평일 09:00 - 18:00</p>
          </div>
          <div className="footer-section">
            <h3>회사정보</h3>
            <p>주소: 서울시 강남구 테헤란로 123</p>
            <p>사업자등록번호: 123-45-67890</p>
          </div>
          <div className="footer-section">
            <h3>이용약관</h3>
            <p>이용약관 | 개인정보처리방침</p>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2026 LUMI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
