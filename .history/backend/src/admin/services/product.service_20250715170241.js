exports.addProduct = async (req) => {
  try {
    // Tạo DetailID nếu chưa có
    req.body.DetailID = req.body.DetailID || `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    let fileUrl = "";
    if (req.file) {
      req.body.Image = req.file.filename;
      // 👉 Dùng URL public để trả về frontend
      fileUrl = `/assets/pictures/${req.file.filename}`;
    }

    // Parse numeric field
    req.body.Price = parseInt(req.body.Price) || 0;
    req.body.StockQuantity = parseInt(req.body.StockQuantity) || 0;
    req.body.IsHot = parseInt(req.body.IsHot) || 0;

    const now = new Date();
    req.body.CreatedAt = now;
    req.body.UpdatedAt = now;

    // Gọi model
    const result = await productModel.addProductDB(req.body);

    // Trả thêm fileUrl để controller gửi lại frontend
    return {
      ...result,
      fileUrl,
    };
  } catch (error) {
    console.log("❌ Lỗi trong addProduct service:", error);
    return { success: false, message: "Lỗi khi thêm sả
