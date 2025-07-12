import { memo } from "react";

import Footer from "../footer/footer";
import Header from "../header/header";
import "../../../../styles/pages/_all.scss"

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