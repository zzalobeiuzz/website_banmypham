import React from "react";

// Component dùng chung để hiển thị danh sách sản phẩm và cho phép chọn sản phẩm
// trong nhiều ngữ cảnh (thương hiệu, lô hàng...). Khác biệt giữa các ngữ cảnh
// được truyền qua props như tiêu đề cột context, kiểu chọn, hàm resolve ảnh.
// Gợi ý ngữ cảnh:
// - Thương hiệu: thường multiple + contextHeader "Thương hiệu hiện tại".
// - Lô hàng: thường single + contextHeader "Thuộc lô hàng".
// Component cha quyết định toàn bộ hành vi qua props.
const ProductAssignPicker = ({
  // Danh sách sản phẩm đầu vào.
  products,
  // Danh sách ProductID đang được chọn.
  selectedIds,
  // Callback chọn/bỏ chọn; xử lý cụ thể do component cha quyết định.
  onToggleProduct,
  // "multiple" => checkbox, "single" => radio.
  selectionMode = "multiple",
  // Nội dung hiển thị khi danh sách rỗng.
  emptyText = "Không có sản phẩm phù hợp.",
  // Bật/tắt khu vực filter theo mã/tên.
  showFilters = true,
  // Giá trị input filter mã/barcode.
  searchCode = "",
  // Giá trị input filter tên sản phẩm.
  searchName = "",
  // Callback cập nhật filter mã/barcode.
  onSearchCodeChange,
  // Callback cập nhật filter tên.
  onSearchNameChange,
  // Header cho cột context (ví dụ: Thương hiệu hiện tại, Thuộc lô hàng...).
  contextHeader = "Nguồn",
  // Hàm lấy giá trị context tương ứng mỗi dòng sản phẩm.
  getContextValue,
  // Có hiển thị cột ảnh hay không.
  showImage = true,
  // Hàm chuẩn hóa URL ảnh theo ngữ cảnh cha.
  resolveImageUrl,
  // Ảnh fallback khi ảnh gốc bị lỗi.
  fallbackImageUrl,
}) => {
  // Chuẩn hóa dữ liệu để tránh lỗi khi props không đúng kiểu mong đợi.
  const resolvedProducts = Array.isArray(products) ? products : [];
  const resolvedSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  // Lấy URL ảnh sản phẩm theo resolver từ component cha.
  const getImageUrl = (item) => {
    const rawImage = item?.Image || item?.image || "";
    if (typeof resolveImageUrl === "function") {
      return resolveImageUrl(rawImage);
    }
    return String(rawImage || "").trim();
  };

  return (
    <div className="shared-product-assign">
      {/* Khối filter theo mã/barcode và tên sản phẩm */}
      {showFilters && (
        <div className="shared-product-assign__filters">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => onSearchCodeChange?.(e.target.value)}
            placeholder="Tìm theo ID/Barcode"
          />
          <input
            type="text"
            value={searchName}
            onChange={(e) => onSearchNameChange?.(e.target.value)}
            placeholder="Tìm theo tên sản phẩm"
          />
        </div>
      )}

      {/* Bảng chọn sản phẩm dùng chung */}
      <div className="shared-product-assign__table-wrap">
        <table className="shared-product-assign__table">
          <thead>
            <tr>
              <th>Chọn</th>
              {showImage && <th>Ảnh</th>}
              <th>Mã sản phẩm</th>
              <th>Barcode</th>
              <th>Tên sản phẩm</th>
              <th>{contextHeader}</th>
            </tr>
          </thead>
          <tbody>
            {/* Trạng thái rỗng */}
            {resolvedProducts.length === 0 ? (
              <tr>
                <td colSpan={showImage ? 6 : 5}>{emptyText}</td>
              </tr>
            ) : (
              resolvedProducts.map((item) => {
                // Chuẩn hóa field vì dữ liệu từ từng API có thể khác key.
                const pid = String(item?.ProductID || item?.id || "").trim();
                const pname = item?.ProductName || item?.name || "N/A";
                const barcode = item?.Barcode || item?.barcode || "N/A";
                const contextValue = getContextValue ? getContextValue(item) : "N/A";
                const checked = resolvedSelectedIds.includes(pid);
                const imageUrl = getImageUrl(item);

                return (
                  <tr key={pid || pname}>
                    <td>
                      <input
                        // Nếu selectionMode là single thì dùng radio, ngược lại dùng checkbox.
                        type={selectionMode === "single" ? "radio" : "checkbox"}
                        name={selectionMode === "single" ? "shared-product-assign-single" : undefined}
                        checked={checked}
                        // Trả về cả ProductID và object item để cha xử lý linh hoạt.
                        onChange={() => onToggleProduct?.(pid, item)}
                      />
                    </td>
                    {showImage && (
                      <td>
                        <img
                          className="shared-product-assign__thumb"
                          src={imageUrl || fallbackImageUrl || ""}
                          alt={pname}
                          loading="lazy"
                          onError={(e) => {
                            if (fallbackImageUrl) {
                              e.currentTarget.src = fallbackImageUrl;
                            }
                          }}
                        />
                      </td>
                    )}
                    <td>{pid || "N/A"}</td>
                    <td>{barcode}</td>
                    <td>{pname}</td>
                    <td>{contextValue}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductAssignPicker;
