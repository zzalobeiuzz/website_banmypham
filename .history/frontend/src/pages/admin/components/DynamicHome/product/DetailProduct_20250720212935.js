import { useNavigate } from "react-router-dom"; // 👈 THÊM vào để điều hướng

const ProductDetail = () => {
  const { id } = useParams();
  const { request } = useHttp();
  const loadingRef = useRef();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate(); // 👈 hook điều hướng

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data);
        setTimeout(() => {
          setShowContent(true);
          setLoading(false);
        }, 1500);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };

    fetchProduct();
  }, [id, request]);

  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json",
      });
      return () => anim.destroy();
    }
  }, [loading]);

  const rawImage = product?.Image;
  const imageUrl =
    typeof rawImage === "string" && rawImage.startsWith("http")
      ? rawImage
      : `${UPLOAD_BASE}/pictures/${rawImage || "default.jpg"}`;

  // 🛠️ Sự kiện xử lý nút
  const handleBack = () => navigate(-1);
  const handleEdit = () => navigate(`/admin/products/edit/${product?.id}`);
  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;
    try {
      await request("DELETE", `${API_BASE}/api/admin/products/delete/${product?.id}`);
      alert("✅ Đã xóa thành công!");
      navigate("/admin/products");
    } catch (error) {
      alert("❌ Xóa sản phẩm thất bại");
      console.error(error);
    }
  };

  return (
    <div className="product-detail__container">
      {/* 🔼 Thanh điều hướng */}
      <div className="product-detail__header">
        <button onClick={handleBack} className="btn back">⬅ Quay lại</button>
        <div className="btn-group">
          <button onClick={handleEdit} className="btn edit">✏️ Sửa</button>
          <button onClick={handleDelete} className="btn delete">🗑️ Xóa</button>
        </div>
      </div>

      {/* 🔁 Loading */}
      {loading && (
        <div className="product-detail__loading">
          <div ref={loadingRef} className="product-detail__lottie" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      )}

      {/* 🟢 Hiển thị nội dung */}
      {!loading && product && (
        <div className="product-detail__wrapper show">
          <div className="product-detail__image">
            <img
              src={imageUrl}
              alt={product?.ProductName || "Không có tên"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/placeholder.png";
              }}
            />
          </div>

          <div className="product-detail__info">
            <h2>{product?.ProductName}</h2>
            <p>
              <strong>Giá:</strong>{" "}
              {product?.Price?.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </p>
            <p>
              <strong>Tồn kho:</strong> {product?.StockQuantity}
            </p>
            <p>
              <strong>Danh mục:</strong> {product?.CategoryName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
