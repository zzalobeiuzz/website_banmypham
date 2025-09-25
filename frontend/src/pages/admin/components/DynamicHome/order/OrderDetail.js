import React from "react";
import { useParams } from "react-router-dom";

const OrderDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <h2>Chi tiết đơn hàng #{id}</h2>
      {/* Hiển thị chi tiết đơn hàng */}
    </div>
  );
};

export default OrderDetail;