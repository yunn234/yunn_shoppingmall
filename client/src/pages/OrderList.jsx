import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './OrderList.css';

function OrderList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [dateRange, setDateRange] = useState('3개월');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('로그인이 필요합니다.');
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
      fetchOrders();
    }
  }, [loading, user, statusFilter, dateRange, startDate, endDate, currentPage]);

  // 날짜 범위 설정
  useEffect(() => {
    const today = new Date();
    const setDateRangeByPeriod = (period) => {
      const end = new Date(today);
      let start = new Date(today);
      
      switch (period) {
        case '오늘':
          start = new Date(today);
          start.setHours(0, 0, 0, 0);
          break;
        case '1주일':
          start.setDate(today.getDate() - 7);
          break;
        case '1개월':
          start.setMonth(today.getMonth() - 1);
          break;
        case '3개월':
          start.setMonth(today.getMonth() - 3);
          break;
        case '6개월':
          start.setMonth(today.getMonth() - 6);
          break;
        default:
          start.setMonth(today.getMonth() - 3);
      }
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    };

    if (dateRange !== '직접입력') {
      setDateRangeByPeriod(dateRange);
    }
  }, [dateRange]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter !== '전체') {
        params.status = statusFilter;
      }

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const response = await apiClient.get('/orders/my', { params });

      if (response.data?.success) {
        const ordersData = response.data.data || [];
        console.log('주문 목록 데이터:', ordersData);
        if (ordersData.length > 0) {
          console.log('첫 번째 주문:', ordersData[0]);
          if (ordersData[0].items && ordersData[0].items.length > 0) {
            const firstItem = ordersData[0].items[0];
            console.log('첫 번째 주문 아이템:', firstItem);
            console.log('이미지 URL (item.image):', firstItem.image);
            console.log('상품 이미지 (item.product?.images):', firstItem.product?.images);
            console.log('상품 전체 데이터:', firstItem.product);
            console.log('최종 이미지 URL:', firstItem.image || firstItem.product?.images?.[0]);
          }
        }
        setOrders(ordersData);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error);
      setOrders([]);
      setTotalPages(1);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\s/g, '').replace(/\./g, '-').slice(0, -1);
  };

  const formatDateTime = (dateString) => {
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

  const getImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      console.log('getImageUrl: URL이 없거나 문자열이 아님:', url);
      return '';
    }
    
    // 빈 문자열 체크
    if (url.trim() === '') {
      console.log('getImageUrl: 빈 문자열');
      return '';
    }

    // Cloudinary URL이 아니면 그대로 반환
    if (!url.includes('cloudinary.com')) {
      console.log('getImageUrl: Cloudinary URL이 아님:', url);
      return url;
    }

    // 이미 최적화 옵션이 들어있으면 그대로 반환
    if (url.includes('q_auto')) {
      console.log('getImageUrl: 이미 최적화됨:', url);
      return url;
    }

    try {
      const parts = url.split('/upload/');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const optimized = `${parts[0]}/upload/q_auto,f_auto/${parts[1]}`;
        console.log('getImageUrl: 최적화 완료:', optimized);
        return optimized;
      }
    } catch (e) {
      console.error("URL 최적화 중 에러:", e, "원본 URL:", url);
    }
    
    console.log('getImageUrl: 원본 반환:', url);
    return url;
  };

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
      <div className="order-list-container">
        <Navbar user={user} loading={loading} onLogout={handleLogout} />
        <div className="order-list-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      <Navbar user={user} loading={loading} onLogout={handleLogout} />
      
      <div className="order-list-content">
        <h1 className="page-title">주문조회</h1>

        {/* 주문 상태별 탭 */}
        <div className="order-status-tabs">
          {[
            { value: '전체', label: '전체' },
            { value: '주문접수', label: '주문접수' },
            { value: '결제완료', label: '결제완료' },
            { value: '배송준비', label: '배송준비' },
            { value: '배송중', label: '배송중' },
            { value: '배송완료', label: '배송완료' },
            { value: '주문취소', label: '주문취소' },
            { value: '환불처리중', label: '환불처리중' },
            { value: '환불완료', label: '환불완료' },
          ].map((tab) => {
            // 각 탭별 주문 개수 계산
            const count = tab.value === '전체' 
              ? orders.length 
              : orders.filter(order => order.status === tab.value).length;
            
            return (
              <button
                key={tab.value}
                className={`status-tab ${statusFilter === tab.value ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1); // 탭 변경 시 첫 페이지로 이동
                }}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 검색 필터 */}
        <div className="search-filters">
          <div className="filter-row">
            <label>전체 주문처리상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="전체">전체</option>
              <option value="주문접수">주문접수</option>
              <option value="결제완료">결제완료</option>
              <option value="배송준비">배송준비</option>
              <option value="배송중">배송중</option>
              <option value="배송완료">배송완료</option>
              <option value="주문취소">주문취소</option>
            </select>
          </div>

          <div className="filter-row">
            <div className="date-buttons">
              {['오늘', '1주일', '1개월', '3개월', '6개월'].map((period) => (
                <button
                  key={period}
                  className={`date-btn ${dateRange === period ? 'active' : ''}`}
                  onClick={() => setDateRange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange('직접입력');
                }}
              />
              <span>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange('직접입력');
                }}
              />
              <button className="search-btn" onClick={handleSearch}>
                조회
              </button>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="info-text">
          <ul>
            <li>기본적으로 최근 3개월간의 자료가 조회되며, 기간 검색시 주문처리완료 후 36개월 이내의 주문내역을 조회하실 수 있습니다.</li>
            <li>완료 후 36개월 이상 경과한 주문은 [과거주문내역]에서 확인할 수 있습니다.</li>
            <li>주문번호를 클릭하시면 해당 주문에 대한 상세내역을 확인하실 수 있습니다.</li>
            <li>교환/반품 신청은 배송완료일 기준 7일까지 가능합니다.</li>
          </ul>
        </div>

        {/* 주문 목록 */}
        {ordersLoading ? (
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        ) : orders.length === 0 ? (
          <div className="empty-message">주문 내역이 없습니다.</div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>주문일자</th>
                  <th>[주문번호]</th>
                  <th>이미지</th>
                  <th>상품정보</th>
                  <th>수량</th>
                  <th>상품구매금액</th>
                  <th>주문처리상태</th>
                  <th>취소/교환/반품</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  order.items && order.items.map((item, itemIndex) => (
                    <tr key={`${order._id}-${itemIndex}`}>
                      {itemIndex === 0 && (
                        <>
                          <td rowSpan={order.items.length} className="order-date-cell">
                            {formatDate(order.createdAt)}
                          </td>
                          <td rowSpan={order.items.length} className="order-number-cell">
                            <button
                              className="order-number-link"
                              onClick={() => navigate(`/orders/${order._id}`)}
                            >
                              [{order.orderNumber}]
                            </button>
                          </td>
                        </>
                      )}
                      <td className="image-cell">
                        {(() => {
                          // 이미지 URL을 찾는 순서: 1. item.image, 2. item.product (문자열), 3. item.product.images[0], 4. item.product.image
                          let imageUrl = '';
                          
                          // 1. item.image 확인
                          if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
                            imageUrl = item.image;
                          }
                          // 2. item.product가 문자열(URL)인지 확인
                          else if (item.product && typeof item.product === 'string' && item.product.trim() !== '') {
                            imageUrl = item.product;
                          }
                          // 3. item.product.images[0] 확인
                          else if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
                            imageUrl = item.product.images[0];
                          }
                          // 4. item.product.image 필드 확인
                          else if (item.product?.image && typeof item.product.image === 'string' && item.product.image.trim() !== '') {
                            imageUrl = item.product.image;
                          }
                          
                          // 최종 URL 생성
                          const finalImageUrl = imageUrl ? getImageUrl(imageUrl) : '';
                          
                          if (!finalImageUrl) {
                            return (
                              <div className="product-image-placeholder">
                                이미지 없음
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              <img
                                src={finalImageUrl}
                                alt={item.productName || '상품 이미지'}
                                className="product-image"
                                style={{
                                  display: 'block',
                                  opacity: 1,
                                }}
                                onError={(e) => {
                                  console.error('이미지 로드 실패:', finalImageUrl);
                                  e.target.style.display = 'none';
                                  // 바로 뒤에 있는 product-image-placeholder 찾기
                                  const placeholder = e.target.nextElementSibling;
                                  if (placeholder && placeholder.classList.contains('product-image-placeholder')) {
                                    placeholder.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="product-image-placeholder" style={{ display: 'none' }}>
                                이미지 없음
                              </div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="product-info-cell">
                        <div className="product-name">{item.productName}</div>
                        {item.selectedOptions && (item.selectedOptions.color || item.selectedOptions.size) && (
                          <div className="product-option">
                            [옵션: {item.selectedOptions.color || ''} {item.selectedOptions.size || ''}]
                          </div>
                        )}
                      </td>
                      <td className="quantity-cell">{item.quantity}</td>
                      <td className="price-cell">₩{(item.price * item.quantity).toLocaleString()}</td>
                      {itemIndex === 0 && (
                        <td rowSpan={order.items.length} className="status-cell">
                          <div className="order-status">{order.status}</div>
                          {order.shipping?.trackingNumber && (
                            <div className="shipping-info">
                              <div>{order.shipping.shippingCompany || '우체국택배'}</div>
                              <div className="tracking-number">[{order.shipping.trackingNumber}]</div>
                            </div>
                          )}
                        </td>
                      )}
                      {itemIndex === 0 && (
                        <td rowSpan={order.items.length} className="action-cell">
                          {order.status === '배송완료' && (
                            <button className="review-btn">구매후기</button>
                          )}
                          {['주문접수', '결제완료', '배송준비'].includes(order.status) && (
                            <button className="cancel-btn">주문취소</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  &lt;&lt;
                </button>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  &gt;&gt;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderList;
