import React, { memo, useCallback, useMemo, useState } from "react";
import {
  AllProductsSection,
  Banner,
  FlashSale,
  HotProduct,
  TopBrand,
  Voucher,
} from "../homePage/components";

const HomePage = () => {
  const readyKeys = useMemo(
    () => ["banner", "voucher", "flashSale", "hotProduct", "topBrand", "allProducts"],
    [],
  );
  const [readyMap, setReadyMap] = useState({});
  const pageReady = readyKeys.every((key) => readyMap[key]);

  const markReady = useCallback((key) => {
    setReadyMap((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);
  const readyHandlers = useMemo(
    () => ({
      allProducts: () => markReady("allProducts"),
      banner: () => markReady("banner"),
      flashSale: () => markReady("flashSale"),
      hotProduct: () => markReady("hotProduct"),
      topBrand: () => markReady("topBrand"),
      voucher: () => markReady("voucher"),
    }),
    [markReady],
  );

  return (
    <div className={`home-page-load-wrap ${pageReady ? "is-ready" : "is-loading"}`}>
      {!pageReady ? (
        <div className="home-page-loading" role="status" aria-live="polite">
          <div className="home-page-loading__spinner" />
          <div>Đang tải dữ liệu trang chủ...</div>
        </div>
      ) : null}

      <div className="home-floating-decor home-floating-decor--left" aria-hidden="true">
        <div className="home-floating-decor__badge">
          <span>Free</span>
          <strong>Giao nhanh</strong>
        </div>
        <div className="home-floating-decor__badge home-floating-decor__badge--soft">
          <span>100%</span>
          <strong>Chính hãng</strong>
        </div>
      </div>

      <div className="home-floating-decor home-floating-decor--right" aria-hidden="true">
        <div className="home-floating-decor__badge home-floating-decor__badge--soft">
          <span>7d</span>
          <strong>Đổi trả</strong>
        </div>
        <div className="home-floating-decor__badge">
          <span>Hot</span>
          <strong>Ưu đãi</strong>
        </div>
      </div>

      <div className="container home-page-content" aria-hidden={!pageReady}>
        <Banner onReady={readyHandlers.banner} />
        <Voucher onReady={readyHandlers.voucher} />
        <FlashSale onReady={readyHandlers.flashSale} />
        <HotProduct onReady={readyHandlers.hotProduct} />
        <TopBrand onReady={readyHandlers.topBrand} />
        <AllProductsSection onReady={readyHandlers.allProducts} />
      </div>
    </div>
  );
};

export default memo(HomePage);
