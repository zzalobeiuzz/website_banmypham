import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, UPLOAD_BASE } from "../../../constants";
import useHttp from "../../../hooks/useHttp";
import { flyToCart } from "../homePage/components/FlyToCart";
import { useCart } from "../context/CartContext";
import "./beauty_trends.scss";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const resolveProductImage = (image) => {
  const raw = String(image || "").trim();
  if (!raw) return `${UPLOAD_BASE}/pictures/no_image.jpg`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  const normalized = raw
    .replace(/^\/+/, "")
    .replace(/^uploads\/?assets\/?pictures\/?/i, "")
    .replace(/^pictures\/?/i, "");

  return `${UPLOAD_BASE}/pictures/${normalized}`;
};

const getTrendLabel = (rank) => {
  if (rank === 1) return "Bán chạy nhất";
  if (rank === 2) return "Được mua nhiều";
  if (rank === 3) return "Nổi bật trong top";
  return "Sản phẩm bán chạy";
};

const ProductStockStatus = ({ stockQuantity }) => {
  const stock = Number(stockQuantity || 0);
  const inStock = stock > 0;

  return (
    <div className={`beauty-trend-stock ${inStock ? "is-available" : "is-out"}`}>
      {inStock ? `Còn hàng: ${stock.toLocaleString("vi-VN")}` : "Hết hàng"}
    </div>
  );
};

const ProductTrendImage = ({ product, className }) => (
  <div className={className}>
    <img
      src={resolveProductImage(product.Image)}
      alt={product.ProductName || "Sản phẩm"}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = `${UPLOAD_BASE}/pictures/no_image.jpg`;
      }}
    />
  </div>
);

const BeautyTrendsPage = () => {
  const { request } = useHttp();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError("");

    request("GET", `${API_BASE}/api/user/products/best-selling-products`)
      .then((res) => {
        if (!mounted) return;
        const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setProducts(rows);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Không thể tải sản phẩm bán chạy.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [request]);

  const topProducts = useMemo(() => products.slice(0, 3), [products]);
  const totalSold = useMemo(
    () => products.reduce((sum, item) => sum + Number(item?.SoldQuantity || 0), 0),
    [products],
  );

  const handleAddToCart = (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    const productId = String(product?.ProductID || "").trim();
    const stockQuantity = Number(product?.StockQuantity || 0);

    if (!productId) return;

    if (stockQuantity <= 0) {
      window.alert("Không thể thêm vào giỏ. Sản phẩm đã hết hàng.");
      return;
    }

    const added = addToCart(productId, 1, stockQuantity);
    if (!added) {
      window.alert(`Chỉ còn ${stockQuantity} sản phẩm trong kho.`);
      return;
    }

    const productImage = event.currentTarget
      .closest(".beauty-trend-podium-card, .beauty-trend-card")
      ?.querySelector("img");

    if (productImage) {
      flyToCart(productImage);
    }
  };

  return (
    <main className="beauty-trends-page">
      <section className="beauty-trends-hero">
        <div className="beauty-trends-hero__content">
          <span>Sản phẩm bán chạy</span>
          <h1>Top sản phẩm bán chạy</h1>
          <p>
            Danh sách này được xếp hạng dựa trên số lượng bán ra thực tế của
            từng sản phẩm. Sản phẩm có thứ hạng càng cao nghĩa là đang được
            khách hàng mua nhiều hơn.
          </p>
        </div>

        <div className="beauty-trends-hero__stats">
          <div>
            <strong>{products.length}</strong>
            <span>sản phẩm bán chạy</span>
          </div>
          <div>
            <strong>{totalSold.toLocaleString("vi-VN")}</strong>
            <span>lượt sản phẩm đã bán</span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="beauty-trends-state">Đang tải sản phẩm bán chạy...</div>
      ) : error ? (
        <div className="beauty-trends-state beauty-trends-state--error">{error}</div>
      ) : products.length === 0 ? (
        <div className="beauty-trends-state">Chưa có dữ liệu bán hàng để xác định sản phẩm bán chạy.</div>
      ) : (
        <>
          <section className="beauty-trends-podium">
            {topProducts.map((product) => {
              const rank = Number(product.TrendRank || 0);
              const stockQuantity = Number(product.StockQuantity || 0);
              return (
                <article
                  className={`beauty-trend-podium-card beauty-trend-podium-card--rank-${rank}`}
                  key={product.ProductID}
                >
                  <Link to={`/product/${product.ProductID}`} className="beauty-trend-podium-card__link">
                    <div className="beauty-trend-podium-card__rank">#{rank}</div>
                    <ProductTrendImage product={product} className="beauty-trend-podium-card__image" />
                    <div className="beauty-trend-podium-card__body">
                      <span>{getTrendLabel(rank)}</span>
                      <h2>{product.ProductName}</h2>
                      <p>
                        Đã bán <strong>{Number(product.SoldQuantity || 0).toLocaleString("vi-VN")}</strong> sản phẩm
                      </p>
                      <ProductStockStatus stockQuantity={stockQuantity} />
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="beauty-trend-cart-btn"
                    aria-label="Thêm vào giỏ hàng"
                    title="Thêm vào giỏ hàng"
                    disabled={stockQuantity <= 0}
                    onClick={(event) => handleAddToCart(event, product)}
                  >
                    +
                  </button>
                </article>
              );
            })}
          </section>

          <section className="beauty-trends-explain">
            <div>
              <span>Cách xếp hạng</span>
              <h2>Vì sao đây là sản phẩm bán chạy?</h2>
            </div>
            <p>
              Thứ tự được tính theo tổng số lượng bán ra. Nếu hai sản phẩm có
              cùng số lượng, hệ thống ưu tiên sản phẩm có nhiều đơn hàng hơn,
              sau đó đến doanh thu. Nhờ vậy danh sách phản ánh các sản phẩm đang
              được khách mua nhiều và đều hơn.
            </p>
          </section>

          <section className="beauty-trends-list">
            <div className="beauty-trends-list__head">
              <h2>Bảng xếp hạng sản phẩm bán chạy</h2>
              <span>Cập nhật theo dữ liệu đơn hàng</span>
            </div>

            <div className="beauty-trends-grid">
              {products.map((product) => {
                const rank = Number(product.TrendRank || 0);
                const hasSale = Number(product.sale_price || 0) > 0;
                const stockQuantity = Number(product.StockQuantity || 0);
                return (
                  <article className="beauty-trend-card" key={product.ProductID}>
                    <Link to={`/product/${product.ProductID}`} className="beauty-trend-card__link">
                      <div className="beauty-trend-card__rank">#{rank}</div>
                      <ProductTrendImage product={product} className="beauty-trend-card__image" />
                      <div className="beauty-trend-card__body">
                        <span>{product.CategoryName || "Mỹ phẩm"}</span>
                        <h3>{product.ProductName}</h3>
                        <div className="beauty-trend-card__meta">
                          <strong>{Number(product.SoldQuantity || 0).toLocaleString("vi-VN")} đã bán</strong>
                          <span>{Number(product.OrderCount || 0).toLocaleString("vi-VN")} đơn</span>
                        </div>
                        <div className="beauty-trend-card__price">
                          <strong>{formatCurrency(hasSale ? product.sale_price : product.Price)}</strong>
                          {hasSale ? <span>{formatCurrency(product.Price)}</span> : null}
                        </div>
                        <ProductStockStatus stockQuantity={stockQuantity} />
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="beauty-trend-cart-btn beauty-trend-cart-btn--small"
                      aria-label="Thêm vào giỏ hàng"
                      title="Thêm vào giỏ hàng"
                      disabled={stockQuantity <= 0}
                      onClick={(event) => handleAddToCart(event, product)}
                    >
                      +
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default BeautyTrendsPage;
