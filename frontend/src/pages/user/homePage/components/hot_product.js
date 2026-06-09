import React from "react";
import Select from './selection';
const hot_product = ({ onReady }) => {
    const Title = "Sản phẩm hot";

    return (
        <Select title={Title} onReady={onReady} />
    );
};

export default hot_product;
