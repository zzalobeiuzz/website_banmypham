return (
  <div className="product-detail__container">
    {/* 🟡 Loading Animation */}
    {loading && (
      <div className="product-detail__loading">
        <div ref={loadingRef} className="product-detail__lottie" />
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    )}

    {/* 🟢 Chỉ hiển thị sau khi loading xong và có sản phẩm */}
    {!loading && product && (
      <div className="product-detail__wrapper show">
        {/* Hình ảnh */}
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

        {/* Thông tin sản phẩm */}
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