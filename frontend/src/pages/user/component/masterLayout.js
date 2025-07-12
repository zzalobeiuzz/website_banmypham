import { memo } from "react";

import "../../../../styles/pages/_all.scss";
import Footer from "../theme/footer";
import Header from "../theme/header";

const MasterLayout = ({ children, showHeaderFooter }) => {
  return (
    <>
    {/* Nếu showHeaderFooter là true thì render header và footer */}
    {showHeaderFooter && <Header />} {/* Phần header */}
    
    <main>{children}</main> {/* Nội dung chính nằm giữa */}
    
    {showHeaderFooter && <Footer />} {/* Phần footer */}
  </>
  );
};
export default memo (MasterLayout);