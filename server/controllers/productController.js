const Product = require('../models/Product');

// CREATE - 새 상품 생성
const createProduct = async (req, res) => {
  try {
    const { productCode, name, options, price, category, images, description } = req.body;

    // 필수 필드 검증
    if (!productCode || !name || !options || !price || !category || !images) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.',
        required: ['productCode', 'name', 'options', 'price', 'category', 'images'],
      });
    }

    // options 배열 검증
    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: '상품옵션은 최소 하나 이상 필요합니다.',
      });
    }

    // images 배열 검증
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: '이미지는 최소 하나 이상 필요합니다.',
      });
    }

    // category 검증
    const validCategories = ['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '카테고리는 TOP, OUTER, PANTS, DRESS/SKIRT, BAG/SHOES 중 하나여야 합니다.',
      });
    }

    // price 검증
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        message: '상품가격은 0 이상의 숫자여야 합니다.',
      });
    }

    const productData = {
      productCode,
      name,
      options,
      price,
      category,
      images,
    };

    // description이 제공된 경우 추가
    if (description) {
      productData.description = description;
    }

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      data: savedProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      // 중복 상품코드 오류
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 상품코드입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 모든 상품 조회
const getAllProducts = async (req, res) => {
  try {
    const { category, page = 1, limit = 2, search } = req.query; // 기본값을 2로 변경
    const query = {};

    // category 필터링
    if (category && ['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'].includes(category)) {
      query.category = category;
    }

    // 검색 기능 (상품명 또는 상품코드로 검색)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// READ - 특정 상품 조회
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// UPDATE - 상품 정보 수정
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCode, name, options, price, category, images, description } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    // category 검증 (제공된 경우)
    if (category && !['TOP', 'OUTER', 'PANTS', 'DRESS/SKIRT', 'BAG/SHOES'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: '카테고리는 TOP, OUTER, PANTS, DRESS/SKIRT, BAG/SHOES 중 하나여야 합니다.',
      });
    }

    // price 검증 (제공된 경우)
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({
        success: false,
        message: '상품가격은 0 이상의 숫자여야 합니다.',
      });
    }

    // options 배열 검증 (제공된 경우)
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false,
          message: '상품옵션은 최소 하나 이상 필요합니다.',
        });
      }
    }

    // images 배열 검증 (제공된 경우)
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
          success: false,
          message: '이미지는 최소 하나 이상 필요합니다.',
        });
      }
    }

    const updateData = {};
    if (productCode) updateData.productCode = productCode;
    if (name) updateData.name = name;
    if (options) updateData.options = options;
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category;
    if (images) updateData.images = images;
    if (description !== undefined) updateData.description = description;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '상품 정보가 성공적으로 수정되었습니다.',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 상품코드입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// DELETE - 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
