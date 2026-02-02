import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);

  // 배송지 정보
  const [shipping, setShipping] = useState({
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    detailAddress: '',
    deliveryMemo: '',
  });

  // 결제 정보
  const [payment, setPayment] = useState({
    method: '카드결제',
    status: '결제대기',
  });

  // 할인 정보
  const [discount, setDiscount] = useState({
    couponCode: '',
    couponDiscount: 0,
    pointUsed: 0,
  });

  // 약관 동의
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
  });

  // 이메일
  const [email, setEmail] = useState({ local: '', domain: '' });

  // 포트원(아임포트) 결제 모듈 초기화
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp01888673'); // 고객사 식별코드
      console.log('포트원 결제 모듈이 초기화되었습니다.');
    } else {
      console.warn('포트원 스크립트가 로드되지 않았습니다.');
    }
  }, []);

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
          const userData = response.data.data;
          setUser(userData);
          // 사용자 정보로 기본값 설정
          setShipping(prev => ({
            ...prev,
            recipientName: userData.name || '',
            recipientPhone: userData.phoneNumber || '',
            address: userData.address || '',
          }));
          if (userData.email) {
            const [local, ...domainParts] = userData.email.split('@');
            setEmail({
              local: local || '',
              domain: domainParts.join('@') || '',
            });
          }
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
        const cartData = response.data.data;
        if (!cartData.items || cartData.items.length === 0) {
          alert('장바구니가 비어있습니다.');
          navigate('/cart');
          return;
        }
        setCart(cartData);
      } else {
        alert('장바구니를 불러올 수 없습니다.');
        navigate('/cart');
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error);
      alert('장바구니를 불러오는 중 오류가 발생했습니다.');
      navigate('/cart');
    } finally {
      setCartLoading(false);
    }
  };

  // 금액 계산
  const calculateAmounts = () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return { subtotal: 0, shippingFee: 0, discount: 0, total: 0 };
    }

    const subtotal = cart.items.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    const shippingFee = subtotal >= 70000 ? 0 : 2500;
    const totalDiscount = discount.couponDiscount + discount.pointUsed;
    const total = subtotal + shippingFee - totalDiscount;

    return { subtotal, shippingFee, discount: totalDiscount, total };
  };

  const { subtotal, shippingFee, discount: totalDiscount, total } = calculateAmounts();

  // 주소 검색 (다음 주소 API)
  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드
        let addr = ''; // 주소 변수
        let extraAddr = ''; // 참고항목 변수

        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }

        // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
        if(data.userSelectedType === 'R'){
          // 법정동명이 있을 경우 추가한다. (법정리는 제외)
          // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
          if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
            extraAddr += data.bname;
          }
          // 건물명이 있고, 공동주택일 경우 추가한다.
          if(data.buildingName !== '' && data.apartment === 'Y'){
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
          if(extraAddr !== ''){
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        // 우편번호와 주소 정보를 해당 필드에 넣는다.
        setShipping(prev => ({
          ...prev,
          postalCode: data.zonecode,
          address: addr + extraAddr,
        }));

        // 커서를 상세주소 필드로 이동한다.
        document.getElementById('detailAddress')?.focus();
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5
    }).open();
  };

  // 할인 코드 적용
  const handleApplyCoupon = () => {
    if (!discount.couponCode) {
      alert('할인 코드를 입력해주세요.');
      return;
    }
    alert('할인 코드 적용 기능은 준비 중입니다.');
  };

  // 약관 동의 처리
  const handleAgreementChange = (name) => {
    if (name === 'all') {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
      });
    } else {
      setAgreements(prev => ({
        ...prev,
        [name]: !prev[name],
        all: false,
      }));
    }
  };

  // 주문하기
  const handleCheckout = async () => {
    // 유효성 검증
    if (!shipping.recipientName) {
      alert('받는사람 이름을 입력해주세요.');
      return;
    }
    if (!shipping.recipientPhone) {
      alert('휴대전화 번호를 입력해주세요.');
      return;
    }
    if (!shipping.postalCode || !shipping.address) {
      alert('주소를 입력해주세요.');
      return;
    }
    if (!agreements.terms || !agreements.privacy) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    // 포트원이 초기화되지 않았으면 경고
    if (!window.IMP) {
      alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    // 주문번호 생성 (임시 - 서버에서 최종 생성됨)
    const tempOrderNumber = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 포트원 결제 요청
    window.IMP.request_pay(
      {
        pg: getPortOnePGCode(payment.method), // PG사 코드
        pay_method: getPortOnePayMethod(payment.method), // 결제수단
        merchant_uid: tempOrderNumber, // 주문번호
        name: cart.items.length === 1 
          ? cart.items[0].product.name 
          : `${cart.items[0].product.name} 외 ${cart.items.length - 1}건`, // 상품명
        amount: total, // 결제금액
        buyer_email: email.local && email.domain ? `${email.local}@${email.domain}` : user?.email || '', // 구매자 이메일
        buyer_name: shipping.recipientName, // 구매자 이름
        buyer_tel: shipping.recipientPhone, // 구매자 전화번호
        buyer_addr: shipping.address + (shipping.detailAddress ? ' ' + shipping.detailAddress : ''), // 구매자 주소
        buyer_postcode: shipping.postalCode, // 구매자 우편번호
      },
      async (rsp) => {
        // 결제 완료 후 콜백
        if (rsp.success) {
          try {
            // 결제 검증 및 주문 생성
            const orderData = {
              shipping: {
                ...shipping,
                shippingFee: shippingFee,
              },
              payment: {
                method: payment.method,
                status: '결제완료',
                totalAmount: total,
                imp_uid: rsp.imp_uid, // 포트원 결제 고유번호
                merchant_uid: rsp.merchant_uid, // 주문번호
              },
              discount: {
                ...discount,
              },
              // 서버에서 장바구니에서 자동으로 가져오므로 items는 보내지 않음
            };

            console.log('주문 데이터:', orderData);
            const response = await apiClient.post('/orders', orderData);

            if (response.data?.success) {
              // 주문 성공 페이지로 이동
              navigate('/orders/success', { state: { order: response.data.data } });
            } else {
              // 주문 실패 페이지로 이동
              navigate('/orders/failure', {
                state: {
                  error: {
                    message: response.data?.message || '주문 처리 중 오류가 발생했습니다.',
                    error: response.data?.error || '알 수 없는 오류',
                  },
                },
              });
            }
          } catch (error) {
            console.error('주문 생성 오류:', error);
            // 주문 실패 페이지로 이동
            navigate('/orders/failure', {
              state: {
                error: {
                  message: error.response?.data?.message || '주문 처리 중 오류가 발생했습니다.',
                  error: error.response?.data?.error || error.message || '알 수 없는 오류',
                  code: error.response?.status || 'UNKNOWN',
                },
              },
            });
          }
        } else {
          // 결제 실패 - 주문 실패 페이지로 이동
          navigate('/orders/failure', {
            state: {
              error: {
                message: `결제가 실패했습니다: ${rsp.error_msg || '알 수 없는 오류'}`,
                error: rsp.error_msg || '결제 실패',
                code: rsp.error_code || 'PAYMENT_FAILED',
              },
            },
          });
          console.error('결제 실패:', rsp);
        }
      }
    );
  };

  // 포트원 PG사 코드 변환
  const getPortOnePGCode = (method) => {
    switch (method) {
      case '카드결제':
        return 'html5_inicis'; // 이니시스
      case '계좌이체':
        return 'html5_inicis';
      case '네이버페이':
        return 'naverpay';
      case '카카오페이':
        return 'kakaopay';
      case '무통장입금':
        return 'html5_inicis';
      default:
        return 'html5_inicis';
    }
  };

  // 포트원 결제수단 코드 변환
  const getPortOnePayMethod = (method) => {
    switch (method) {
      case '카드결제':
        return 'card';
      case '계좌이체':
        return 'trans';
      case '네이버페이':
        return 'naverpay';
      case '카카오페이':
        return 'kakaopay';
      case '무통장입금':
        return 'vbank';
      default:
        return 'card';
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

  if (loading || cartLoading) {
    return (
      <div className="checkout-container">
        <Navbar user={user} loading={loading} onLogout={handleLogout} />
        <div className="checkout-loading">로딩 중...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="checkout-container">
      <Navbar user={user} loading={loading} onLogout={handleLogout} />
      
      <div className="checkout-content">
        <h1 className="checkout-title">주문/결제</h1>

        {/* 배송지 정보 */}
        <section className="checkout-section">
          <h2 className="section-title">배송지</h2>
          <div className="form-group">
            <label>받는사람</label>
            <input
              type="text"
              value={shipping.recipientName}
              onChange={(e) => setShipping({ ...shipping, recipientName: e.target.value })}
              placeholder="받는사람 이름"
            />
          </div>
          <div className="form-group">
            <label>주소</label>
            <div className="address-row">
              <input
                type="text"
                value={shipping.postalCode}
                onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                placeholder="우편번호"
              />
              <button type="button" className="address-search-btn" onClick={handleAddressSearch}>
                주소검색
              </button>
            </div>
            <input
              type="text"
              value={shipping.address}
              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
              placeholder="기본주소"
            />
            <input
              id="detailAddress"
              type="text"
              value={shipping.detailAddress}
              onChange={(e) => setShipping({ ...shipping, detailAddress: e.target.value })}
              placeholder="나머지 주소"
            />
          </div>
          <div className="form-group">
            <label>일반전화</label>
            <div className="phone-row">
              <select>
                <option>02</option>
              </select>
              <input type="text" />
              <input type="text" />
            </div>
          </div>
          <div className="form-group">
            <label>휴대전화</label>
            <div className="phone-row">
              <select>
                <option>010</option>
              </select>
              <input
                type="text"
                value={shipping.recipientPhone.split('-')[0] || ''}
                onChange={(e) => {
                  const parts = shipping.recipientPhone.split('-');
                  setShipping({
                    ...shipping,
                    recipientPhone: `${e.target.value}-${parts[1] || ''}-${parts[2] || ''}`,
                  });
                }}
              />
              <input
                type="text"
                value={shipping.recipientPhone.split('-')[1] || ''}
                onChange={(e) => {
                  const parts = shipping.recipientPhone.split('-');
                  setShipping({
                    ...shipping,
                    recipientPhone: `${parts[0] || ''}-${e.target.value}-${parts[2] || ''}`,
                  });
                }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>이메일</label>
            <div className="email-row">
              <input
                type="text"
                value={email.local}
                onChange={(e) => setEmail({ ...email, local: e.target.value })}
              />
              <span>@</span>
              <input
                type="text"
                value={email.domain}
                onChange={(e) => setEmail({ ...email, domain: e.target.value })}
              />
              <button type="button" className="direct-input-btn">직접입력</button>
            </div>
          </div>
          <div className="form-group">
            <label>메시지 선택</label>
            <select
              value={shipping.deliveryMemo}
              onChange={(e) => setShipping({ ...shipping, deliveryMemo: e.target.value })}
            >
              <option value="">-- 메시지 선택 (선택사항) --</option>
              <option value="부재시 문앞에 놓아주세요">부재시 문앞에 놓아주세요</option>
              <option value="부재시 경비실에 맡겨주세요">부재시 경비실에 맡겨주세요</option>
              <option value="배송 전 연락 부탁드립니다">배송 전 연락 부탁드립니다</option>
            </select>
          </div>
        </section>

        {/* 주문상품 */}
        <section className="checkout-section">
          <h2 className="section-title">주문상품</h2>
          {cart.items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div key={item._id} className="order-item">
                <img
                  src={product.images?.[0] || ''}
                  alt={product.name}
                  className="order-item-image"
                />
                <div className="order-item-info">
                  <h3>{product.name}</h3>
                  {item.selectedOptions && (item.selectedOptions.color || item.selectedOptions.size) && (
                    <p className="order-item-option">
                      [옵션: {item.selectedOptions.color || ''} {item.selectedOptions.size || ''}]
                    </p>
                  )}
                  <p className="order-item-quantity">수량: {item.quantity}개</p>
                  <p className="order-item-price">₩{(product.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
          <div className="shipping-fee-info">
            배송비(무료)원: ₩{shippingFee === 0 ? '0' : shippingFee.toLocaleString()}
          </div>
        </section>

        {/* 할인/부가결제 */}
        <section className="checkout-section">
          <h2 className="section-title">할인/부가결제</h2>
          <div className="coupon-section">
            <div className="coupon-input-row">
              <input
                type="text"
                value={discount.couponCode}
                onChange={(e) => setDiscount({ ...discount, couponCode: e.target.value })}
                placeholder="할인코드 입력"
              />
              <button type="button" className="apply-coupon-btn" onClick={handleApplyCoupon}>
                코드 적용
              </button>
            </div>
            <div className="applied-amount">적용금액: -₩{totalDiscount.toLocaleString()}</div>
          </div>
        </section>

        {/* 결제정보 */}
        <section className="checkout-section">
          <h2 className="section-title">결제정보</h2>
          <div className="payment-summary">
            <div className="summary-row">
              <span>주문상품</span>
              <span>₩{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>+₩{shippingFee.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>할인/부가결제</span>
              <span>-₩{totalDiscount.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>최종 결제 금액</span>
              <span className="final-amount">₩{total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* 결제수단 */}
        <section className="checkout-section">
          <h2 className="section-title">결제수단 선택</h2>
          <div className="payment-methods">
            {['카드결제', '계좌이체', '네이버페이', '카카오페이', '무통장입금'].map((method) => (
              <button
                key={method}
                type="button"
                className={`payment-method-btn ${payment.method === method ? 'active' : ''}`}
                onClick={() => setPayment({ ...payment, method })}
              >
                {method}
              </button>
            ))}
          </div>
          {payment.method === '무통장입금' && (
            <div className="form-group">
              <label>예금주명</label>
              <input type="text" placeholder="예금주명을 입력하세요" />
              <p className="form-note">
                소액 결제의 경우 PG사 정책에 따라 결제 금액 제한이 있을 수 있습니다.
              </p>
            </div>
          )}
        </section>

        {/* 현금영수증 / 세금계산서 */}
        <section className="checkout-section">
          <div className="receipt-section">
            <div className="receipt-option">
              <label>
                <input type="radio" name="cashReceipt" defaultChecked />
                현금영수증 신청
              </label>
              <label>
                <input type="radio" name="cashReceipt" />
                신청안함
              </label>
            </div>
            <div className="receipt-option">
              <label>
                <input type="radio" name="taxInvoice" defaultChecked />
                세금계산서 신청
              </label>
              <label>
                <input type="radio" name="taxInvoice" />
                신청안함
              </label>
            </div>
          </div>
        </section>

        {/* 약관 동의 */}
        <section className="checkout-section">
          <div className="agreement-section">
            <label className="agreement-all">
              <input
                type="checkbox"
                checked={agreements.all}
                onChange={() => handleAgreementChange('all')}
              />
              모든 약관 동의
            </label>
            <label className="agreement-item">
              <input
                type="checkbox"
                checked={agreements.terms}
                onChange={() => handleAgreementChange('terms')}
              />
              [필수] 쇼핑몰 이용약관 동의
              <span className="view-link">→</span>
            </label>
            <label className="agreement-item">
              <input
                type="checkbox"
                checked={agreements.privacy}
                onChange={() => handleAgreementChange('privacy')}
              />
              [필수] 개인정보 수집 및 이용 동의
              <span className="view-link">→</span>
            </label>
          </div>
        </section>

        {/* 결제하기 버튼 */}
        <div className="checkout-footer">
          <button className="checkout-submit-btn" onClick={handleCheckout}>
            ₩{total.toLocaleString()} 결제하기
          </button>
          <p className="checkout-note">
            무이자 할부 안내 및 최소 결제금액 안내
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
