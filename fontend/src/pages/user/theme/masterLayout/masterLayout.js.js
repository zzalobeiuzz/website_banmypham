import { memo } from "react";
import Footer from "../footer/footer";
import Header from "../header/header";


const MasterLayout = ({ children, ...props }) => {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
};
export default memo (MasterLayout);