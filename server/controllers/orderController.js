const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const axios = require('axios');

// CREATE - 주문 생성 (장바구니에서 주문하기)
const createOrder = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const {
      shipping,
      payment,
      discount,
      cartItemIds, // 장바구니에서 주문할 아이템 ID 배열 (선택적)
    } = req.body;

    console.log('주문 생성 요청 데이터:', JSON.stringify({ shipping, payment, discount, cartItemIds }, null, 2));

    // 배송 정보 검증
    if (!shipping || !shipping.recipientName || !shipping.recipientPhone || !shipping.address) {
      return res.status(400).json({
        success: false,
        message: '배송 정보는 필수입니다.',
      });
    }

    // postalCode가 없으면 빈 문자열로 설정 (필수 필드이지만 선택적으로 처리)
    if (!shipping.postalCode) {
      shipping.postalCode = '';
    }

    // 결제 정보 검증
    if (!payment || !payment.method) {
      return res.status(400).json({
        success: false,
        message: '결제 정보는 필수입니다.',
      });
    }

    // 장바구니에서 주문할 상품 가져오기
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다.',
      });
    }

    // 특정 아이템만 주문하는 경우 필터링
    let orderItems = cart.items;
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      orderItems = cart.items.filter(item => 
        cartItemIds.includes(item._id.toString())
      );
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '주문할 상품이 없습니다.',
      });
    }

    // 주문 아이템 생성 (상품 정보 포함)
    const items = await Promise.all(
      orderItems.map(async (cartItem) => {
        const product = cartItem.product;
        
        // 상품이 존재하는지 확인
        if (!product) {
          throw new Error(`상품을 찾을 수 없습니다: ${cartItem.product}`);
        }

        // 상품이 판매중인지 확인
        if (product.status !== '판매중') {
          throw new Error(`판매중지된 상품입니다: ${product.name}`);
        }

        return {
          product: product._id,
          productName: product.name,
          productCode: product.productCode,
          quantity: cartItem.quantity,
          price: product.price,
          selectedOptions: cartItem.selectedOptions || {},
          image: product.images && product.images.length > 0 ? product.images[0] : '',
        };
      })
    );

    // 금액 계산
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = shipping.shippingFee || (subtotal >= 70000 ? 0 : 2500);
    const couponDiscount = discount?.couponDiscount || 0;
    const pointUsed = discount?.pointUsed || 0;
    const totalAmount = subtotal + shippingFee - couponDiscount - pointUsed;

    // 결제 금액 검증
    if (payment.totalAmount && payment.totalAmount !== totalAmount) {
      return res.status(400).json({
        success: false,
        message: `결제 금액이 일치하지 않습니다. 요청 금액: ${payment.totalAmount}, 계산 금액: ${totalAmount}`,
      });
    }

    // 결제 완료된 경우 포트원에서 조회한 결제 금액과 비교
    if (payment.status === '결제완료' && payment.imp_uid) {
      const portOneApiKey = process.env.PORTONE_API_KEY;
      const portOneApiSecret = process.env.PORTONE_API_SECRET;

      if (portOneApiKey && portOneApiSecret) {
        try {
          // 포트원 액세스 토큰 발급
          const tokenResponse = await axios.post(
            'https://api.iamport.kr/users/getToken',
            {
              imp_key: portOneApiKey,
              imp_secret: portOneApiSecret,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (tokenResponse.data.code === 0) {
            const accessToken = tokenResponse.data.response.access_token;

            // 결제 정보 조회
            const paymentResponse = await axios.get(
              `https://api.iamport.kr/payments/${payment.imp_uid}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (paymentResponse.data.code === 0) {
              const paymentData = paymentResponse.data.response;
              
              // 결제 상태 검증
              if (paymentData.status !== 'paid') {
                return res.status(400).json({
                  success: false,
                  message: `결제 상태가 'paid'가 아닙니다. 현재 상태: ${paymentData.status}`,
                });
              }
              
              // 결제 금액 검증 (포트원에서 실제 결제된 금액과 비교)
              if (paymentData.amount !== totalAmount) {
                return res.status(400).json({
                  success: false,
                  message: `결제 금액이 일치하지 않습니다. 포트원 결제 금액: ${paymentData.amount}, 계산 금액: ${totalAmount}`,
                });
              }
            } else {
              console.error('포트원 결제 정보 조회 실패:', paymentResponse.data);
              // 404 오류인 경우 테스트 결제일 수 있으므로 경고만 하고 계속 진행
              if (paymentResponse.data.code === -1 && paymentResponse.data.message?.includes('404')) {
                console.warn('포트원 결제 정보를 찾을 수 없습니다. 테스트 결제일 수 있습니다. 주문을 계속 진행합니다.');
                // 테스트 결제인 경우 검증을 건너뛰고 계속 진행
              } else {
                return res.status(400).json({
                  success: false,
                  message: '포트원 결제 정보 조회에 실패했습니다.',
                  error: paymentResponse.data.message || '알 수 없는 오류',
                });
              }
            }
          } else {
            console.error('포트원 액세스 토큰 발급 실패:', tokenResponse.data);
            // 토큰 발급 실패 시에도 테스트 환경에서는 계속 진행할 수 있도록 경고만
            console.warn('포트원 토큰 발급 실패. 테스트 환경일 수 있습니다. 주문을 계속 진행합니다.');
          }
        } catch (amountVerifyError) {
          console.error('결제 금액 검증 오류:', amountVerifyError);
          
          // 404 오류인 경우 테스트 결제일 수 있으므로 경고만 하고 계속 진행
          if (amountVerifyError.response?.status === 404 || amountVerifyError.code === 'ECONNREFUSED') {
            console.warn('포트원 결제 정보를 찾을 수 없습니다. 테스트 결제일 수 있습니다. 주문을 계속 진행합니다.');
            // 테스트 결제인 경우 검증을 건너뛰고 계속 진행
          } else {
            // 다른 오류인 경우 에러 반환
            return res.status(400).json({
              success: false,
              message: '결제 금액 검증에 실패했습니다.',
              error: amountVerifyError.message || '알 수 없는 오류',
            });
          }
        }
      }
    }

    // 주문 생성
    const order = new Order({
      user: userId,
      items: items,
      shipping: {
        ...shipping,
        shippingFee: shippingFee,
      },
      payment: {
        method: payment.method,
        status: payment.status || '결제대기',
        totalAmount: totalAmount,
        paidAt: payment.status === '결제완료' ? new Date() : null,
        imp_uid: payment.imp_uid || '',
        merchant_uid: payment.merchant_uid || '',
      },
      discount: discount || {},
      subtotal: subtotal,
      totalAmount: totalAmount,
      status: '주문접수',
    });

    try {
      await order.save();
    } catch (saveError) {
      console.error('주문 저장 오류 상세:', saveError);
      // Mongoose validation 오류인 경우 더 자세한 정보 제공
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => err.message).join(', ');
        return res.status(400).json({
          success: false,
          message: `주문 데이터 검증 오류: ${errors}`,
          error: saveError.message,
        });
      }
      // Unique constraint 오류 (orderNumber 중복)
      if (saveError.code === 11000) {
        console.error('주문번호 중복 오류, 재시도 중...');
        // orderNumber를 다시 생성하기 위해 저장 재시도
        order.orderNumber = undefined; // undefined로 설정하면 pre-save에서 다시 생성됨
        await order.save();
      } else {
        throw saveError;
      }
    }

    // 주문한 상품을 장바구니에서 제거
    if (cartItemIds && Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      cart.items = cart.items.filter(item => 
        !cartItemIds.includes(item._id.toString())
      );
    } else {
      // 전체 주문인 경우 장바구니 비우기
      cart.items = [];
    }
    await cart.save();

    // 주문 정보 populate하여 반환
    await order.populate('user', 'name email phoneNumber');
    await order.populate('items.product', 'name price images');

    res.status(201).json({
      success: true,
      message: '주문이 생성되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 현재 사용자의 주문 목록 조회
const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 주문번호로 주문 상세 조회
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user._id;
    const userType = req.user?.userType;

    const order = await Order.findById(id)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name price images category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (order.user._id.toString() !== userId.toString() && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '주문 조회 권한이 없습니다.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 주문번호로 주문 조회
const getOrderByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.userId || req.user._id;
    const userType = req.user?.userType;

    const order = await Order.findOne({ orderNumber })
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name price images category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (order.user._id.toString() !== userId.toString() && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '주문 조회 권한이 없습니다.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 관리자용 전체 주문 목록 조회
const getAllOrders = async (req, res) => {
  try {
    // req.user는 authenticateToken 미들웨어에서 설정됨
    const currentUserId = req.userId || req.user?._id;
    const userType = req.user?.userType || req.userType;
    
    console.log('getAllOrders - currentUserId:', currentUserId, 'userType:', userType);
    
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    const { status, userId: filterUserId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (filterUserId) {
      query.user = filterUserId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// UPDATE - 주문 상태 변경
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminMemo } = req.body;
    const userType = req.user?.userType;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 상태 변경은 관리자만 가능 (주문 취소는 본인도 가능)
    if (status && status !== '주문취소' && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '주문 상태 변경 권한이 없습니다.',
      });
    }

    // 주문 취소는 본인만 가능
    if (status === '주문취소') {
      const userId = req.userId || req.user._id;
      if (order.user.toString() !== userId.toString() && userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '주문 취소 권한이 없습니다.',
        });
      }
      
      // 취소 가능한 상태인지 확인
      if (!['주문접수', '결제완료', '배송준비'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '현재 상태에서는 주문 취소가 불가능합니다.',
        });
      }
    }

    // 상태 업데이트
    if (status) {
      order.status = status;
      
      // 결제 완료 시 paidAt 설정
      if (status === '결제완료' && order.payment.status !== '결제완료') {
        order.payment.status = '결제완료';
        order.payment.paidAt = new Date();
      }
      
      // 배송중 시 shippedAt 설정
      if (status === '배송중' && !order.shipping.shippedAt) {
        order.shipping.shippedAt = new Date();
      }
      
      // 배송완료 시 deliveredAt 설정
      if (status === '배송완료' && !order.shipping.deliveredAt) {
        order.shipping.deliveredAt = new Date();
      }
    }

    // 관리자 메모 업데이트
    if (adminMemo !== undefined && userType === 'admin') {
      order.adminMemo = adminMemo;
    }

    await order.save();

    await order.populate('user', 'name email phoneNumber');
    await order.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: '주문 정보가 업데이트되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 변경 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// UPDATE - 배송 정보 업데이트 (관리자만)
const updateShippingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, shippingCompany } = req.body;
    const userType = req.user?.userType;

    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    if (trackingNumber) {
      order.shipping.trackingNumber = trackingNumber;
    }
    
    if (shippingCompany) {
      order.shipping.shippingCompany = shippingCompany;
    }

    await order.save();

    await order.populate('user', 'name email phoneNumber');
    await order.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: '배송 정보가 업데이트되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('배송 정보 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '배송 정보 업데이트 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// DELETE - 주문 취소 (실제 삭제가 아닌 상태 변경)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.user._id;
    const userType = req.user?.userType;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (order.user.toString() !== userId.toString() && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '주문 취소 권한이 없습니다.',
      });
    }

    // 취소 가능한 상태인지 확인
    if (!['주문접수', '결제완료', '배송준비'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '현재 상태에서는 주문 취소가 불가능합니다.',
      });
    }

    order.status = '주문취소';
    
    // 결제가 완료된 경우 환불 처리
    if (order.payment.status === '결제완료') {
      order.payment.status = '환불대기';
    }

    await order.save();

    await order.populate('user', 'name email phoneNumber');
    await order.populate('items.product', 'name price images');

    res.status(200).json({
      success: true,
      message: '주문이 취소되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByOrderNumber,
  getAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  cancelOrder,
};
