import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import './ProductRegister.css';

function ProductRegister() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    price: '',
    discountPrice: '',
    description: '',
  });
  const [options, setOptions] = useState([
    { color: '', size: '', stock: '' }
  ]);
  const [images, setImages] = useState([]); // Cloudinary URL 배열
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 상품코드 자동 생성
  const generateProductCode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const code = `PR-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
    setFormData(prev => ({ ...prev, productCode: code }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { color: '', size: '', stock: '' }]);
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // Cloudinary Upload Widget 열기
  // 필요한 환경 변수:
  // 1. VITE_CLOUDINARY_CLOUD_NAME: Cloudinary 계정의 cloud name (예: "dxyz1234")
  // 2. VITE_CLOUDINARY_UPLOAD_PRESET: 업로드 프리셋 이름 (예: "unsigned-preset")
  // 
  // 설정 방법:
  // 1. Cloudinary 계정 생성: https://cloudinary.com
  // 2. Dashboard에서 Cloud Name 확인
  // 3. Settings > Upload > Upload presets에서 "Add upload preset" 클릭
  // 4. "Unsigned" 선택하고 이름 설정 후 저장
  // 5. client 폴더에 .env 파일 생성 후 아래 변수 추가:
  //    VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
  //    VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
  const openCloudinaryWidget = () => {
    // Cloudinary 스크립트 로드 확인
    if (typeof window.cloudinary === 'undefined') {
      alert('Cloudinary 위젯을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    // 환경 변수에서 Cloudinary 설정 가져오기
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // 환경 변수 검증
    if (!cloudName || !uploadPreset) {
      alert(
        'Cloudinary 설정이 필요합니다.\n\n' +
        'client 폴더에 .env 파일을 생성하고 다음 변수를 설정해주세요:\n\n' +
        'VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name\n' +
        'VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset\n\n' +
        '설정 후 개발 서버를 재시작해주세요.'
      );
      console.error('Cloudinary 환경 변수 누락:', {
        cloudName: cloudName ? '설정됨' : '누락',
        uploadPreset: uploadPreset ? '설정됨' : '누락'
      });
      return;
    }

    // Cloudinary Upload Widget 생성 및 설정
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName, // Cloudinary 계정의 cloud name
        uploadPreset: uploadPreset, // 업로드 프리셋 이름
        multiple: true, // 다중 이미지 업로드 허용
        maxFiles: 10, // 최대 업로드 파일 수
        resourceType: 'image', // 이미지 리소스 타입
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'], // 허용된 파일 형식
        maxFileSize: 10000000, // 최대 파일 크기 (10MB)
        cropping: false, // 이미지 크롭 기능 비활성화 (필요시 true로 변경)
        showAdvancedOptions: false, // 고급 옵션 숨기기
        folder: 'products', // 업로드 폴더 (선택사항)
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary 업로드 오류:', error);
          alert('이미지 업로드 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
          return;
        }

        // 업로드 성공 시
        if (result && result.event === 'success') {
          const imageUrl = result.info.secure_url; // HTTPS URL
          setImages(prev => [...prev, imageUrl]);
          console.log('이미지 업로드 성공:', imageUrl);
        }
      }
    );

    // 위젯 열기
    widget.open();
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productCode.trim()) {
      newErrors.productCode = '상품코드는 필수입니다.';
    }
    if (!formData.category) {
      newErrors.category = '카테고리는 필수입니다.';
    }
    if (!formData.name.trim()) {
      newErrors.name = '상품명은 필수입니다.';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = '판매가는 0 이상의 숫자여야 합니다.';
    }
    if (!formData.discountPrice || parseFloat(formData.discountPrice) < 0) {
      newErrors.discountPrice = '할인가는 0 이상의 숫자여야 합니다.';
    }
    
    // 옵션 검증
    const hasValidOption = options.some(opt => opt.color && opt.size && opt.stock);
    if (!hasValidOption) {
      newErrors.options = '최소 하나 이상의 유효한 옵션이 필요합니다.';
    }

    // 이미지 검증
    if (images.length === 0) {
      newErrors.images = '최소 하나 이상의 이미지가 필요합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 옵션 데이터 변환 (서버 스키마에 맞게 { optionName, optionValue } 형태로)
      const productOptions = options
        .filter(opt => opt.color && opt.size && opt.stock) // 유효한 옵션만 필터링
        .map(opt => ({
          optionName: '색상/사이즈',
          optionValue: `${opt.color}/${opt.size}`,
          // stock은 서버 스키마에 없으므로 제외
        }));

      // 서버로 전송할 상품 데이터 준비
      const productData = {
        productCode: formData.productCode.toUpperCase().trim(),
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price), // 판매가만 전송 (할인가는 서버 스키마에 없음)
        options: productOptions,
        images: images, // Cloudinary에서 업로드된 URL 배열
      };

      // 상품 설명이 있으면 추가
      if (formData.description.trim()) {
        productData.description = formData.description.trim();
      }

      console.log('상품 등록 요청 데이터:', productData);

      // 서버 API 호출: POST /api/products
      const response = await apiClient.post('/products', productData);

      console.log('상품 등록 응답:', response.data);

      // 성공 응답 확인
      if (response.data?.success) {
        alert('상품이 성공적으로 등록되었습니다!');
        // 등록 성공 후 관리자 페이지로 이동
        navigate('/admin');
      } else {
        alert('상품 등록 처리 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('상품 등록 오류 상세:', error);

      // 서버에서 반환한 에러 메시지 처리
      if (error.response) {
        const errorData = error.response.data;
        let errorMessage = '상품 등록 중 오류가 발생했습니다.';

        // 서버 응답 구조에 맞춰 에러 메시지 추출
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        // 유효성 검증 오류인 경우 상세 메시지 표시
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorList = errorData.errors.join('\n');
          alert(`${errorMessage}\n\n${errorList}`);
        } else {
          alert(errorMessage);
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
        console.error('요청 오류:', error.request);
      } else {
        // 요청 설정 중 오류가 발생한 경우
        alert('요청을 처리하는 중 오류가 발생했습니다.');
        console.error('요청 설정 오류:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">로딩 중...</div>;
  }

  const categories = ['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'];
  const colors = ['블랙', '화이트', '그레이', '베이지', '브라운', '네이비', '핑크', '레드'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="product-register-container">
      {/* Sidebar - Admin과 동일 */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">LUMI</h1>
          <p className="sidebar-subtitle">관리자 패널</p>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/admin')}>
            <span className="nav-icon">▦</span>
            <span className="nav-label">대시보드</span>
          </button>
          <button className="nav-item active">
            <span className="nav-icon">📦</span>
            <span className="nav-label">상품 관리</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🛒</span>
            <span className="nav-label">주문 관리</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">👥</span>
            <span className="nav-label">회원 관리</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">통계</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">설정</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <p className="admin-email">{user?.email || 'admin@lumi.com'}</p>
            <button className="logout-button" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }}>
              로그아웃 →
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="product-register-main">
        {/* Header */}
        <header className="product-register-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/admin')}>
              ←
            </button>
            <h1 className="page-title">상품 등록</h1>
          </div>
          <div className="header-right">
            <button className="cancel-button" onClick={() => navigate('/admin')}>
              취소
            </button>
            <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </header>

        {/* Form Content */}
        <div className="product-register-content">
          <div className="form-columns">
            {/* Left Column */}
            <div className="form-left">
              {/* 기본 정보 */}
              <section className="form-section">
                <h2 className="section-title">기본 정보</h2>
                
                <div className="form-group">
                  <label htmlFor="productCode">
                    상품코드 <span className="required">*</span>
                  </label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      id="productCode"
                      name="productCode"
                      value={formData.productCode}
                      onChange={handleChange}
                      placeholder="PR-000001"
                      className={errors.productCode ? 'error' : ''}
                    />
                    <button type="button" className="auto-generate-btn" onClick={generateProductCode}>
                      자동생성
                    </button>
                  </div>
                  {errors.productCode && <span className="error-message">{errors.productCode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    카테고리 <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={errors.category ? 'error' : ''}
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <span className="error-message">{errors.category}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    상품명 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="상품명을 입력하세요"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="price">
                    판매가 <span className="required">*</span>
                  </label>
                  <div className="price-input">
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className={errors.price ? 'error' : ''}
                    />
                    <span className="unit">원</span>
                  </div>
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="discountPrice">
                    할인가 <span className="required">*</span>
                  </label>
                  <div className="price-input">
                    <input
                      type="number"
                      id="discountPrice"
                      name="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className={errors.discountPrice ? 'error' : ''}
                    />
                    <span className="unit">원</span>
                  </div>
                  {errors.discountPrice && <span className="error-message">{errors.discountPrice}</span>}
                </div>
              </section>

              {/* 상품 옵션 */}
              <section className="form-section">
                <div className="section-header-with-button">
                  <h2 className="section-title">상품 옵션</h2>
                  <button type="button" className="add-option-btn" onClick={addOption}>
                    + 옵션 추가
                  </button>
                </div>
                
                {options.map((option, index) => (
                  <div key={index} className="option-row">
                    <span className="option-number">#{index + 1}</span>
                    <select
                      value={option.color}
                      onChange={(e) => handleOptionChange(index, 'color', e.target.value)}
                      className="option-select"
                    >
                      <option value="">색상 선택</option>
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                    <select
                      value={option.size}
                      onChange={(e) => handleOptionChange(index, 'size', e.target.value)}
                      className="option-select"
                    >
                      <option value="">사이즈 선택</option>
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <div className="stock-input">
                      <input
                        type="number"
                        value={option.stock}
                        onChange={(e) => handleOptionChange(index, 'stock', e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                      <span className="unit">개</span>
                    </div>
                    {options.length > 1 && (
                      <button
                        type="button"
                        className="remove-option-btn"
                        onClick={() => removeOption(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {errors.options && <span className="error-message">{errors.options}</span>}
              </section>

              {/* 상품 설명 */}
              <section className="form-section">
                <h2 className="section-title">상품 설명</h2>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="상품에 대한 상세 설명을 입력하세요"
                  rows="8"
                  className="description-textarea"
                />
              </section>
            </div>

            {/* Right Column */}
            <div className="form-right">
              {/* 상품 이미지 */}
              <section className="form-section">
                <h2 className="section-title">
                  상품 이미지 <span className="required">*</span>
                </h2>
                <p className="image-instruction">
                  첫 번째 이미지가 대표 이미지로 사용됩니다. 권장 사이즈: 1000x1000px
                </p>
                
                <div className="image-upload-area" onClick={openCloudinaryWidget}>
                  <div className="upload-label">
                    <div className="upload-icon">↑</div>
                    <p>클릭하여 이미지 업로드</p>
                    <p className="upload-hint">PNG, JPG, WEBP (최대 10MB)</p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="image-preview-grid">
                    {images.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.images && <span className="error-message">{errors.images}</span>}
              </section>

              {/* 등록 정보 미리보기 */}
              <section className="form-section preview-section">
                <h2 className="section-title">등록 정보 미리보기</h2>
                <div className="preview-list">
                  <div className="preview-item">
                    <span className="preview-label">상품코드</span>
                    <span className="preview-value">{formData.productCode || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">카테고리</span>
                    <span className="preview-value">{formData.category || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">상품명</span>
                    <span className="preview-value">{formData.name || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">판매가</span>
                    <span className="preview-value">{formData.price ? `₩${parseInt(formData.price).toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">할인가</span>
                    <span className="preview-value">{formData.discountPrice ? `₩${parseInt(formData.discountPrice).toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">옵션 수</span>
                    <span className="preview-value">{options.filter(opt => opt.color && opt.size && opt.stock).length}개</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">이미지</span>
                    <span className="preview-value">{images.length}장</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductRegister;
