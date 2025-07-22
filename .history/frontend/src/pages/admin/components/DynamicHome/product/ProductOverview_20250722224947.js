import React from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { UPLOAD_BASE } from "../../../../../constants";

const ProductOverviewComponent = ({
  filteredProducts,
  selectMode,
  selectedProducts,
  handleCheckboxChange,
  editMode,
  handleProductChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="product-data">
      <div className="data">
        <List
          height={600} // Chiều cao khung danh sách (có thể tùy chỉnh)
          itemCount={filteredProducts.length}
          itemSize={110} // Chiều cao mỗi item (điều chỉnh nếu cần)
          width={"100%"}
        >
          {({ index, style }) => {
            const product = filteredProducts[index];
            return (
              <ul
                key={product.ProductID}
                className="list-unstyled row-data"
                style={style}
              >
                <li className="list-stt">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.ProductID)}
                      onChange={() => handleCheckboxChange(product.ProductID)}
                    />
                  )}
                  {index + 1}
                </li>
                <li className="list-id">{product.ProductID}</li>
                <li className="list-name">
                  {editMode && selectedProducts.includes(product.ProductID) ? (
                    <textarea
                      className="input-name"
                      value={product.ProductName}
                      onChange={(e) =>
                        handleProductChange(
                          product.ProductID,
                          "ProductName",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    product.ProductName
                  )}
                </li>
                <li className="list-image">
                  <img
                    src={`${UPLOAD_BASE}/pictures/${product.Image}`}
                    alt={product.ProductName}
                    width="70"
                    loading="lazy"
                  />
                </li>
                <li className="list-price">
                  {editMode && selectedProducts.includes(product.ProductID) ? (
                    <input
                      className="input-price"
                      value={product.Price}
                      onChange={(e) =>
                        handleProductChange(
                          product.ProductID,
                          "Price",
                          Number(e.target.value)
                        )
                      }
                    />
                  ) : (
                    `${product.Price.toLocaleString("vi-VN")}đ`
                  )}
                </li>
                <li className="list-category">{product.CategoryName}</li>
                <li className="list-stock">
                  {product.StockQuantity}
                  <button
                    className="view-detail"
                    onClick={() =>
                      navigate(`/admin/products/${product.ProductID}`)
                    }
                  >
                    Xem chi tiết
                  </button>
                </li>
              </ul>
            );
          }}
        </List>
      </div>
    </div>
  );
};

export default ProductOverviewComponent;
