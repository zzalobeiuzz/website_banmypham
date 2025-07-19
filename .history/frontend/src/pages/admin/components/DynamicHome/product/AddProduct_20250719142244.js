import React, { useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import 
import { API_BASE } from "../../../../../constants";
import useHttp from "../../../../../hooks/useHttp";
import ImageUploader from "../../../../../utils/patchedUploader";
import BarcodeScannerPopup from "../../BarcodeScannerPopup";
import "./style.scss";

Quill.register("modules/imageUploader", ImageUploader);

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["image", "link"],
    ["clean"]
  ],
  imageUploader: {
    // 🔽 Đây là nơi bạn truyền `upload()` — chính là cái được gọi trong PatchedImageUploader
    upload: async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // base64
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};


const AddProduct = () => {
  const navigate = useNavigate();
  const { request } = useHttp();

  const [productData, setProductData] = useState({
    productCode: "",
    name: "",
    price: "",
    type: "",
    stockQuantity: "",
    supplierID: "",
    isHot: false,
    intro: "",
    usage: "",
    ingredients: "",
    instructions: "",
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategoryID, setSelectedCategoryID] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategoryID, setSelectedSubCategoryID] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data || []);
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error.message);
      }
    };
    fetchCategories();
  }, [request]);

  const handleChange = (key, value) => {
    setProductData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCategoryChange = (e) => {
    const catID = e.target.value;
    setSelectedCategoryID(catID);
    setSelectedSubCategoryID("");
    const category = categories.find((c) => c.CategoryID === catID);
    setSubCategories(category?.SubCategories || []);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return Number(value).toLocaleString("vi-VN") + "đ";
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    handleChange("price", raw);
  };

  const handleSubmitAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ProductID", productData.productCode);
      formData.append("ProductName", productData.name);
      formData.append("Price", productData.price);
      formData.append("Type", productData.type);
      formData.append("CategoryID", selectedCategoryID);
      formData.append("SubCategoryID", selectedSubCategoryID);
      formData.append("StockQuantity", productData.stockQuantity);
      formData.append("SupplierID", productData.supplierID);
      formData.append("IsHot", productData.isHot ? 1 : 0);
      formData.append("Intro", productData.intro);
      formData.append("Usage", productData.usage);
      formData.append("Ingredients", productData.ingredients);
      formData.append("Instructions", productData.instructions);
      formData.append("Image", imageFile);
      const detailID = `DTL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      formData.append("DetailID", detailID);

      const res = await request("POST", `${API_BASE}/api/admin/products/add`, formData);

      if (res.success) {

        navigate(-1);
      }

     

    } catch (error) {
      console.log(error);
      alert(`❌ Lỗi: ${error.message || "Không xác định"}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleImageChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFileName(file.name);
  
      // ✅ Reset lại input để chọn lại cùng file vẫn kích hoạt
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // Nếu là file local
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log("File local:", file.name);
      if (file && file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setFileName(file.name);
      }
    } else if (e.dataTransfer.items && e.dataTransfer.items[0]) {
      // Nếu là link từ web
      const item = e.dataTransfer.items[0];
      if (item.kind === "string" && item.type === "text/uri-list") {
        item.getAsString((url) => {
          console.log("URL từ web:", url);
          setImagePreview(url);
          setFileName(url.split("/").pop());
          setImageFile(null); // Không có file local
        });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };



  const handleScanBarcode = () => setShowScanner(true);
  const handleCloseScanner = () => setShowScanner(false);

  const handleBarcodeResult = async (barcode) => {
    try {
      const data = await request("GET", `${API_BASE}/api/admin/products/checkProductExistence?code=${barcode}`);
      if (data.exists && data.product) {
        alert("⚠️ Sản phẩm đã tồn tại!");
        setProductData({
          productCode: data.product.id || "",
          name: data.product.name,
          price: data.product.price,
          type: data.product.type || "",
          stockQuantity: data.product.stockQuantity || "",
          supplierID: data.product.supplierID || "",
          isHot: data.product.isHot === 1,
          intro: "",
          usage: "",
          ingredients: "",
          instructions: "",
        });
        setSelectedCategoryID(data.product.categoryId || "");
        setSelectedSubCategoryID(data.product.subCategoryId || "");

        const category = categories.find((c) => c.CategoryID === data.product.categoryId);
        setSubCategories(category?.SubCategories || []);
      } else {
        handleChange("productCode", barcode);
      }
    } catch (err) {
      alert(err.message || "Lỗi kiểm tra sản phẩm!");
    }
    setShowScanner(false);
  };

  const handleGoBack = () => navigate(-1);

  return (
    <div className="form-add-product-wrapper">
      {showScanner && (
        <BarcodeScannerPopup
          onClose={handleCloseScanner}
          onScanSuccess={handleBarcodeResult}
        />
      )}

      <div className="barcode-wrapper">
        <div className="barcode-actions">
          <button type="button" className="btn-back" onClick={handleGoBack}>
            ← Quay lại
          </button>
          <h2>Thêm sản phẩm mới</h2>
          <button type="button" className="btn-scan" onClick={handleScanBarcode}>
            Quét mã
          </button>
        </div>
      </div>

      <div className="left-panel">
        <h3>Hình ảnh sản phẩm</h3>
        <div
          className={`image-preview-wrapper ${isDragging ? "dragging" : ""}`}
          style={{
            backgroundImage: imageFile ? `url(${imagePreview})` : "none",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!imageFile && <div className="image-overlay">Kéo ảnh vào hoặc chọn ảnh từ máy</div>}
        </div>

        <div className="file-input-wrapper">
          <label htmlFor="fileUpload" className="custom-file-label">Chọn ảnh</label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {fileName && <div className="file-name">{fileName}</div>}
        </div>
      </div>

      <div className="right-panel">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitAdd();
          }}>
          <div className="form-group d-flex">
            <div className="input-id w-25">
              <label>Mã sản phẩm</label>
              <input
                type="text"
                value={productData.productCode}
                onChange={(e) => handleChange("productCode", e.target.value)}
                required
              />
            </div>
            <div className="input-name flex-fill">
              <label>Tên sản phẩm</label>
              <input
                type="text"
                value={productData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("Tên sản phẩm thay đổi:", fileName);
                  handleChange("name", value);
                }}
                required
              />
            </div>
          </div>

          <div className="form-group d-flex flex-wrap gap-2">
            <div className="input-price">
              <label>Giá</label>
              <input
                type="text"
                value={formatCurrency(productData.price)}
                onChange={handlePriceChange}
                required
              />
            </div>

            <div className="input-category w-25">
              <label>Danh mục</label>
              <select value={selectedCategoryID} onChange={handleCategoryChange}>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>
                ))}
              </select>
            </div>

            <div className="input-type">
              <label>Danh mục con</label>
              <select
                value={selectedSubCategoryID}
                onChange={(e) => setSelectedSubCategoryID(e.target.value)}
                disabled={!selectedCategoryID}
              >
                <option value="">Chọn danh mục con</option>
                {subCategories.map((sub) => (
                  <option key={sub.SubCategoryID} value={sub.SubCategoryID}>{sub.SubCategoryName}</option>
                ))}
              </select>
            </div>

            <div className="input-stock">
              <label>Số lượng tồn</label>
              <input
                type="number"
                value={productData.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", e.target.value)}
              />
            </div>

            <div className="input-supplier">
              <label>Nhà cung cấp</label>
              <input
                type="text"
                value={productData.supplierID}
                onChange={(e) => handleChange("supplierID", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mô tả (Giới thiệu)</label>
            <ReactQuill
              theme="snow"
              value={productData.intro}
              onChange={(val) => handleChange("intro", val)}
              modules={quillModules}
            />
          </div>

          <div className="form-group">
            <label>Công dụng</label>
            <ReactQuill
              theme="snow"
              value={productData.usage}
              onChange={(val) => handleChange("usage", val)}
              modules={quillModules}
            />
          </div>

          <div className="form-group">
            <label>Thành phần</label>
            <ReactQuill
              theme="snow"
              value={productData.ingredients}
              onChange={(val) => handleChange("ingredients", val)}
              modules={quillModules}
            />
          </div>

          <div className="form-group">
            <label>Hướng dẫn sử dụng</label>
            <ReactQuill
              theme="snow"
              value={productData.instructions}
              onChange={(val) => handleChange("instructions", val)}
              modules={quillModules}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang thêm..." : "Thêm sản phẩm"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
