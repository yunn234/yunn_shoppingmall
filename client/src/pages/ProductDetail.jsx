import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('상세정보');
  const [expandedSections, setExpandedSections] = useState({
    comment: false,
    fabric: true,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/products/${id}`);
        if (response.data?.success) {
          setProduct(response.data.data);
          // 옵션에서 색상 추출
          if (response.data.data.options && response.data.data.options.length > 0) {
            const colors = response.data.data.options
              .map(opt => opt.optionValue?.split('/')[0])
              .filter((color, index, self) => color && self.indexOf(color) === index);
            if (colors.length > 0) {
              setSelectedColor(colors[0]);
            }
          }
        } else {
          alert('상품을 찾을 수 없습니다.');
          navigate('/');
        }
      } catch (error) {
        console.error('상품 조회 오류:', error);
        alert('상품 정보를 불러오는 중 오류가 발생했습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    setUser(null);
    alert('로그아웃되었습니다.');
    window.location.href = '/';
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    // 로그인 확인
    const token = localStorage.getItem('token');
    if (!token) {
      alert('장바구니에 추가하려면 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      // 선택한 색상에 해당하는 옵션 찾기
      let selectedSize = '';
      if (product.options && selectedColor) {
        const matchingOption = product.options.find(opt => {
          const optionParts = opt.optionValue?.split('/') || [];
          return optionParts[0] === selectedColor;
        });
        if (matchingOption) {
          const optionParts = matchingOption.optionValue?.split('/') || [];
          selectedSize = optionParts[1] || '';
        }
      }

      const cartData = {
        productId: product._id,
        quantity: quantity,
        selectedOptions: {
          color: selectedColor || '',
          size: selectedSize,
        },
      };

      const response = await apiClient.post('/carts/items', cartData);

      if (response.data?.success) {
        alert('장바구니에 상품이 추가되었습니다.');
        // 장바구니 페이지로 이동할 수도 있음 (선택사항)
        // navigate('/cart');
      } else {
        alert(response.data?.message || '장바구니에 상품을 추가하는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('장바구니에 상품을 추가하는 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return <div className="product-detail-loading">로딩 중...</div>;
  }

  if (!product) {
    return null;
  }

  // 옵션에서 색상 추출
  const colors = product.options
    ? product.options
        .map(opt => opt.optionValue?.split('/')[0])
        .filter((color, index, self) => color && self.indexOf(color) === index)
    : [];

  const tabs = ['상세정보', '디테일컷', '상품리뷰 (0)', '상품문의 (0)', '이용안내'];

  return (
    <div className="product-detail-container">
      <Navbar user={user} loading={false} onLogout={handleLogout} />

      <div className="product-detail-content">
        {/* Left Column - Product Images and Details */}
        <div className="product-detail-left">
          <div className="product-main-image">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="main-product-img"
              />
            ) : (
              <div className="no-image">이미지 없음</div>
            )}
          </div>

          {/* Brand Info Card */}
          <div className="brand-info-card">
            <h3>LUMI</h3>
            <p>A company founded in 2024</p>
          </div>

          {/* Detail Tabs */}
          <div className="detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === '상세정보' && (
              <div className="detail-info">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>상품 상세 정보가 없습니다.</p>
                )}
              </div>
            )}
            {activeTab === '디테일컷' && (
              <div className="detail-cut">
                {product.images && product.images.length > 1 ? (
                  <div className="detail-images">
                    {product.images.slice(1).map((img, index) => (
                      <img key={index} src={img} alt={`Detail ${index + 1}`} />
                    ))}
                  </div>
                ) : (
                  <p>디테일 이미지가 없습니다.</p>
                )}
              </div>
            )}
            {activeTab === '상품리뷰 (0)' && (
              <div className="product-reviews">
                <p>등록된 리뷰가 없습니다.</p>
              </div>
            )}
            {activeTab === '상품문의 (0)' && (
              <div className="product-inquiries">
                <p>등록된 문의가 없습니다.</p>
              </div>
            )}
            {activeTab === '이용안내' && (
              <div className="usage-guide">
                <h3>배송 안내</h3>
                <p>배송비: 2,500원 (70,000원 이상 구매 시 무료)</p>
                <p>배송 기간: 주문 후 2-3일 소요</p>
                <h3>교환/반품 안내</h3>
                <p>상품 수령 후 7일 이내 교환/반품 가능</p>
                <p>단, 상품의 하자 또는 배송 오류의 경우 배송비는 무료입니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Fixed Product Info */}
        <div className="product-detail-right">
          <div className="product-info-panel">
            <h1 className="product-detail-name">{product.name}</h1>
            <p className="product-detail-price">₩{parseInt(product.price).toLocaleString()}</p>

            {/* Comment Section */}
            <div className="info-section">
              <button 
                className="section-toggle"
                onClick={() => toggleSection('comment')}
              >
                COMMENT {expandedSections.comment ? '▲' : '▼'}
              </button>
              {expandedSections.comment && (
                <div className="section-content">
                  <p>상품에 대한 코멘트가 없습니다.</p>
                </div>
              )}
            </div>

            {/* Fabric/Size Section */}
            <div className="info-section">
              <button 
                className="section-toggle"
                onClick={() => toggleSection('fabric')}
              >
                FABRIC / SIZE {expandedSections.fabric ? '▲' : '▼'}
              </button>
              {expandedSections.fabric && (
                <div className="section-content">
                  <p><strong>FABRIC:</strong> - POLY 90% SPAN 10%</p>
                  <p><strong>SIZE:</strong> 허리 38.5(조절가능) / 힙 46.5 / 밑단 62 / 총길이 94.5</p>
                </div>
              )}
            </div>

            {/* Purchase Info */}
            <div className="purchase-info">
              <div className="info-row">
                <span className="info-label">판매가</span>
                <span className="info-value">₩{parseInt(product.price).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">배송비</span>
                <span className="info-value">2,500(70,000 이상 구매 시 무료)</span>
              </div>
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="color-selection">
                <label className="selection-label">색상</label>
                <div className="color-buttons">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Guide Button */}
            <button className="size-guide-btn">
              <span className="size-icon">👖</span>
              <span>고객님 사이즈를 찾아보세요!</span>
            </button>

            {/* Quantity */}
            <div className="quantity-section">
              <label className="selection-label">수량</label>
              <div className="quantity-control">
                <button onClick={() => handleQuantityChange(-1)}>-</button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                />
                <button onClick={() => handleQuantityChange(1)}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-cart" onClick={handleAddToCart}>장바구니</button>
              <button className="btn-wishlist">관심상품</button>
              <button className="btn-purchase">구매하기</button>
            </div>

            {/* Payment Options */}
            <div className="payment-options">
              <div className="naver-pay-section">
                <div className="naver-logo">NAVER</div>
                <p>네이버ID로 간편구매</p>
                <button className="btn-naver-pay">N pay 구매</button>
                <button className="btn-like">찜</button>
                <p className="naver-pay-text">네이버페이</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
