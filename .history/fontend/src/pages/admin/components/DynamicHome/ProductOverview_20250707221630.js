import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../../constants";
import useHttp from "../../../../hooks/useHttp";
import "./style.scss";

export const ProductOverview = () => {
  const { request } = useHttp();
  const [categories, setCategories] = useState([]);

  // Filter
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilterContent, setShowFilterContent] = useState(false);

  // Categories
  const [showCategories, setShowCategories] = useState(true);
  const [containerVisible, setContainerVisible] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await request("GET", `${API_BASE}/api/user/products/loadCategory`);
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error.status, error.message);
      }
    };
    fetchCategories();
  }, [request]);

  const handleOpen = () => {
    setShowCloseButton(true);
    setContainerVisible(true);
    setTimeout(() => {
      setShowCategories(true);
    }, 50);
  };

  const handleCloseCategories = () => {
    // Ẩn nút đóng ngay lập tức
    setShowCloseButton(false);
  
    // Sau đó bắt đầu animation đóng
    setShowCategories(false);
  
    const totalTime = categories.length * 100 + 400;
  
    // Sau khi đóng xong thì ẩn container
    setTimeout(() => {
      setContainerVisible(false);
    }, totalTime);
  };
  

  const handleToggleFilter = () => {
    if (!filterOpen) {
      setFilterOpen(true);
      setTimeout(() => setShowFilterContent(true), 300);
    } else {
      setShowFilterContent(false);
      setFilterOpen(false);
    }
  };

  return (
    <div className="product-wrapper">
      <div className="product-topbar">
        {!containerVisible && (
          <button className="toggle-button" onClick={handleOpen}>
            Mở danh mục ➜
          </button>
        )}

        {containerVisible && (
          <div className="category-buttons">
            {categories.map((category, index) => (
              <button
                key={category.CategoryID}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: showCategories
                    ? `${index * 0.1}s`
                    : `${(categories.length - index) * 0.1}s`,
                  transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                  opacity: showCategories ? 1 : 0,
                }}
              >
                {category.CategoryName}
              </button>
            ))}

            {showCloseButton && (
              <button
                className="close-button"
                onClick={handleCloseCategories}
                style={{
                  transition: "all 0.4s ease",
                  transitionDelay: showCategories
                    ? `${categories.length * 0.1}s`
                    : `${categories.length * 0.1}s`,
                  transform: showCategories ? "translateX(0)" : "translateX(-20px)",
                  opacity: showCategories ? 1 : 0,
                }}
              >
                ✖ Đóng
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`product-content ${filterOpen ? "open" : ""}`}>
        <div className="product-left">
          <div className="filter-toggle-header" onClick={handleToggleFilter}>
            {!filterOpen ? (
              <>
                <img
                  src="/assets/icons/icons8-filter.gif"
                  alt="filter icon"
                  style={{ width: "24px", height: "24px" }}
                />
                <span>Mở bộ lọc</span>
              </>
            ) : (
              <>
                <span>✖ Bộ lọc sản phẩm</span>
              </>
            )}
          </div>

          {showFilterContent && (
            <div className="filter-body">
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
              <p>Đây là các tùy chọn lọc...</p>
            </div>
          )}
        </div>

        <div className="product-right">
          <div className="fw-bold mb-3">Danh sách sản phẩm</div>
          <div className="container">
            <div className="product-data">
              <ul className="field-name list-unstyled">
                <li className="field-col list-stt">STT</li>
                <li className="field-col list-id">ID SP</li>
                <li className="field-col list-name">Tên sản phẩm</li>
                <li className="field-col list-image">Ảnh</li>
                <li className="field-col list-price">Giá</li>
                <li className="field-col list-category">Danh mục</li>
                <li className="field-col list-stock">Tồn kho</li>
              </ul>
              <
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
