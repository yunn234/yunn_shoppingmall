import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './AdminOrderList.css';

function AdminOrderList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null); // 드롭다운 열림 상태 관리
  const dropdownRef = useRef(null);
  const [allOrdersForCount, setAllOrdersForCount] = useState([]); // 상태별 개수 계산용

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

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
    if (!loading && user) {
      fetchOrders();
    }
  }, [loading, user, statusFilter, currentPage]);

  // 전체 주문 데이터를 가져와서 개수 계산에 사용
  useEffect(() => {
    const fetchAllOrdersForCount = async () => {
      try {
        const response = await apiClient.get('/orders/all', {
          params: { page: 1, limit: 1000 }, // 모든 주문 가져오기 (개수 계산용)
        });
        if (response.data?.success) {
          setAllOrdersForCount(response.data.data || []);
        }
      } catch (error) {
        console.error('전체 주문 데이터 조회 오류:', error);
      }
    };
    if (!loading && user) {
      fetchAllOrdersForCount();
    }
  }, [loading, user]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      // 상태 필터는 서버에 보내지 않고, 클라이언트에서 필터링
      // 서버는 모든 주문을 가져오고, 클라이언트에서 필터링

      console.log('주문 목록 조회 시작 - statusFilter:', statusFilter);
      const response = await apiClient.get('/orders/all', { params });
      console.log('주문 목록 API 응답:', response.data);

      if (response.data?.success) {
        let ordersData = response.data.data || [];
        console.log('받은 주문 데이터:', ordersData.length, '개');

        // 상태 필터링
        if (statusFilter === '전체') {
          // 전체는 필터링하지 않음
        } else if (statusFilter === '처리중') {
          ordersData = ordersData.filter(order => 
            ['주문접수', '결제완료', '배송준비'].includes(order.status)
          );
          console.log('처리중 필터링 후:', ordersData.length, '개');
        } else {
          // 개별 상태 필터 (배송중, 배송완료, 주문취소, 환불처리중, 환불완료, 주문접수, 결제완료, 배송준비)
          ordersData = ordersData.filter(order => order.status === statusFilter);
          console.log(`${statusFilter} 필터링 후:`, ordersData.length, '개');
        }

        // 검색 필터링 (주문번호 또는 고객명)
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          ordersData = ordersData.filter(order => {
            const orderNumberMatch = order.orderNumber?.toLowerCase().includes(query);
            const customerNameMatch = order.user?.name?.toLowerCase().includes(query);
            return orderNumberMatch || customerNameMatch;
          });
          console.log('검색 필터링 후:', ordersData.length, '개');
        }

        console.log('최종 주문 데이터:', ordersData.length, '개');
        setOrders(ordersData);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        console.error('주문 목록 조회 실패:', response.data);
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error);
      console.error('에러 상세:', error.response?.data);
      alert(error.response?.data?.message || '주문 목록을 불러오는 중 오류가 발생했습니다.');
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

  const handleStatusChange = async (orderId, newStatus) => {
    // 상태 라벨 매핑
    const statusLabelMap = {
      '주문접수': '주문확인',
      '배송준비': '상품준비중',
      '배송중': '배송중',
      '배송완료': '배송완료',
      '주문취소': '주문취소',
    };
    const statusLabel = statusLabelMap[newStatus] || newStatus;
    
    if (!window.confirm(`주문 상태를 "${statusLabel}"로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const response = await apiClient.put(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      if (response.data?.success) {
        alert('주문 상태가 변경되었습니다.');
        setOpenDropdown(null); // 드롭다운 닫기
        fetchOrders();
      } else {
        alert(response.data?.message || '주문 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      alert(error.response?.data?.message || '주문 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 상태 변경 옵션 매핑
  const getStatusOptions = () => {
    return [
      { label: '주문확인', value: '주문접수' },
      { label: '상품준비중', value: '배송준비' },
      { label: '배송시작', value: '배송중' },
      { label: '배송중', value: '배송중' },
      { label: '배송완료', value: '배송완료' },
      { label: '주문취소', value: '주문취소' },
    ];
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('정말 이 주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/orders/${orderId}`);

      if (response.data?.success) {
        alert('주문이 취소되었습니다.');
        fetchOrders();
      } else {
        alert(response.data?.message || '주문 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 취소 오류:', error);
      alert(error.response?.data?.message || '주문 취소 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\s/g, '').replace(/\./g, '-').slice(0, -1);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      '주문접수': '처리중',
      '결제완료': '처리중',
      '배송준비': '처리중',
      '배송중': '배송중',
      '배송완료': '완료',
      '주문취소': '취소',
      '환불처리중': '환불중',
      '환불완료': '환불완료',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      '주문접수': 'yellow',
      '결제완료': 'orange',
      '배송준비': 'blue',
      '배송중': 'blue',
      '배송완료': 'green',
      '주문취소': 'red',
      '환불처리중': 'orange',
      '환불완료': 'gray',
    };
    return colorMap[status] || 'gray';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    navigate('/');
  };

  // 상태별 주문 개수 계산
  const getStatusCount = (status) => {
    if (status === '전체') return allOrdersForCount.length;
    if (status === '처리중') {
      return allOrdersForCount.filter(order => 
        ['주문접수', '결제완료', '배송준비'].includes(order.status)
      ).length;
    }
    if (status === '배송중') {
      return allOrdersForCount.filter(order => order.status === '배송중').length;
    }
    if (status === '배송완료') {
      return allOrdersForCount.filter(order => order.status === '배송완료').length;
    }
    // 개별 상태 필터 (주문취소, 환불처리중, 환불완료, 주문접수, 결제완료, 배송준비)
    return allOrdersForCount.filter(order => order.status === status).length;
  };

  return (
    <div className="admin-order-list-container">
      {/* Header */}
      <header className="admin-order-header">
        <button className="back-button" onClick={() => navigate('/admin')}>
          ←
        </button>
        <h1 className="page-title">주문 관리</h1>
      </header>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="주문번호 또는 고객명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button className="filter-btn" onClick={handleSearch}>
            필터
          </button>
        </div>

        {/* Status Tabs */}
        <div className="status-tabs">
          {[
            { label: '전체', value: '전체' },
            { label: '처리중', value: '처리중' },
            { label: '배송중', value: '배송중' },
            { label: '배송완료', value: '배송완료' },
            { label: '주문취소', value: '주문취소' },
            { label: '환불처리중', value: '환불처리중' },
            { label: '환불완료', value: '환불완료' },
            { label: '주문접수', value: '주문접수' },
            { label: '결제완료', value: '결제완료' },
            { label: '배송준비', value: '배송준비' },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`status-tab ${statusFilter === tab.value ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(tab.value);
                setCurrentPage(1);
              }}
            >
              {tab.label} ({getStatusCount(tab.value)})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list-container">
        {ordersLoading ? (
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        ) : orders.length === 0 ? (
          <div className="empty-message">주문 내역이 없습니다.</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-left">
                    <div className="order-id-section">
                      <span className="clock-icon">🕐</span>
                      <div className="order-id-info">
                        <div className="order-id">{order.orderNumber || order._id}</div>
                        <div className="order-customer-date">
                          {order.user?.name || '고객명 없음'} · {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-right">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="order-price">₩{order.totalAmount?.toLocaleString() || '0'}</div>
                    <button
                      className="view-details-btn"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      👁️ 상세보기
                    </button>
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-info-row">
                    <div className="info-label">고객 정보</div>
                    <div className="info-value">
                      {order.user?.email || '-'} · {order.user?.phoneNumber || '-'}
                    </div>
                  </div>
                  <div className="order-info-row">
                    <div className="info-label">주문 상품</div>
                    <div className="info-value">
                      {order.items?.length || 0}개 상품
                    </div>
                  </div>
                  <div className="order-info-row">
                    <div className="info-label">배송 주소</div>
                    <div className="info-value">
                      {order.shipping?.address || '-'} {order.shipping?.detailAddress || ''}
                    </div>
                  </div>
                </div>

                <div className="order-actions">
                  <div className="status-dropdown-container" ref={dropdownRef}>
                    <button
                      className="action-btn primary status-dropdown-btn"
                      onClick={() => setOpenDropdown(openDropdown === order._id ? null : order._id)}
                    >
                      주문 확인 ▼
                    </button>
                    {openDropdown === order._id && (
                      <div className="status-dropdown-menu">
                        {getStatusOptions(order.status).map((option) => (
                          <button
                            key={option.value}
                            className="status-dropdown-item"
                            onClick={() => handleStatusChange(order._id, option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
    </div>
  );
}

export default AdminOrderList;
