// 🧠 Import thư viện và hook cần thiết
import lottie from "lottie-web"; // 🎞️ Thư viện để hiển thị animation Lottie
import React, { useEffect, useRef, useState } from "react"; // 📦 React hooks
import { useParams } from "react-router-dom"; // 🔁 Lấy params từ URL
import { API_BASE, UPLOAD_BASE } from "../../../../../constants"; // 🔗 Các hằng số URL API và upload
import useHttp from "../../../../../hooks/useHttp"; // 📡 Custom hook xử lý request
import "./style.scss"; // 🎨 SCSS riêng cho component

const ProductDetail = () => {
  // 📌 Lấy mã sản phẩm từ URL
  const { id } = useParams();

  // 🔧 Dùng custom hook để gọi API
  const { request } = useHttp();

  // 🔁 Ref DOM dùng cho animation Lottie
  const loadingRef = useRef();

  // 🧠 Trạng thái dữ liệu sản phẩm
  const [product, setProduct] = useState(null);

  // ⌛ Trạng thái loading
  const [loading, setLoading] = useState(true);

  // 👁️ Trạng thái kiểm soát việc hiển thị nội dung
  const [showContent, setShowContent] = useState(false);

  // 🛎️ Gọi API khi component mount để lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await request(
          "GET",
          `${API_BASE}/api/admin/products/productDetail?code=${id}`
        );
        setProduct(res.data); // ✅ Lưu thông tin sản phẩm

        // 🕒 Delay 1.5 giây để giả lập loading và đồng bộ hiệu ứng
        setTimeout(() => {
          setShowContent(true); // Hiện nội dung chính
          setLoading(false);    // Tắt trạng thái loading
        }, 1500);
      } catch (err) {
        console.error("❌ Không lấy được chi tiết sản phẩm:", err);
      }
    };

    fetchProduct();
  }, [id, request]);

  // 🌈 Gọi animation loading nếu loading = true
  useEffect(() => {
    if (loadingRef.current && loading) {
      const anim = lottie.loadAnimation({
        container: loadingRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/animations/Trail loading.json", // 🔄 File animation JSON
      });

      // 🧹 Cleanup animation khi unmount hoặc loading = false
      return () => anim.destroy();
    }
  }, [loading]);

  // 🖼️ Tạo đường dẫn ảnh: nếu đã là URL thì giữ nguyên, nếu không thì thêm tiền tố upload
  const imageUrl = product?.Image?.startsWith("http")
    ? product.Image
    : `${UPLOAD_BASE}/pictures/${product?.Image || "default.jpg"}`;

}

export default ProductDetail;
