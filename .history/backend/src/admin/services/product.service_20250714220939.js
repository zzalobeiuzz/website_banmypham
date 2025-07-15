const productModel = require("../models/product.model");
//=========================UPDATE THÔNG TIN SẢN PHẨM====================
exports.updateProduct = async (product) => {
    console.log("productID:",product.ProductID)
  const exists = await productModel.checkProductExists(product.ProductID);

  if (!exists) {
    return { success: false, message: `Sản phẩm ID ${product.ProductID} không tồn tại` };
  }

  return await productModel.updateProduct(product);
};
//=========================CHECK SẢN PHẨM TỒN TẠI====================
exports.checkProductExistence = async (barcode) => {
  const product = await productModel.checkProductExists(barcode);
  if (product) {
    return {
      exists: true,
      product: {
        id: product.ProductID,
        name: product.ProductName,
        description: product.Description,
        isHot: product.IsHot,
        type: product.Type,
        price: product.Price,
        categoryId: product.CategoryID,
        stockQuantity: product.StockQuantity,
        createdAt: product.CreatedAt,
        updatedAt: product.UpdatedAt,
        supplierId: product.SupplierID,
        image: product.Image,
      },
    };
  } else {
    return {
      exists: false,
    };
  }
};





exports.addProduct = async (req) => {
  const detailID = `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const {
    ProductCode,
    Name,
    Price,
    Type,
    CategoryID,
    SubCategoryID,
    StockQuantity,
    SupplierID,
    IsHot,
    Intro,
    Usage,
    Ingredients,
    Instructions,
  } = req.body;

  let imagePath = "";
  if (req.file) {
    imagePath = `/assets/pictures/${req.file.filename}`;
  }

  const product = {
    ProductCode,
    Name,
    Price: parseInt(Price) || 0,
    Type,
    CategoryID,
    SubCategoryID,
    StockQuantity: parseInt(StockQuantity) || 0,
    SupplierID,
    IsHot: parseInt(IsHot) || 0,
    Intro,
    Usage,
    Ingredients,
    Instructions,
    Image: imagePath,
    DetailID: detailID,
  };

  // Gọi DB (ví dụ hàm addProductDB) ở đây
  await addProductDB(product);

  return product; // Có thể trả về nếu cần trả data cho client
};

// Ví dụ hàm gọi DB
async function addProductDB(product) {
  // Viết query insert
  // await db.query("INSERT INTO ...", [product...])
}


