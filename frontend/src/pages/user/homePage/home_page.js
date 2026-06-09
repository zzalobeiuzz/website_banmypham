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
