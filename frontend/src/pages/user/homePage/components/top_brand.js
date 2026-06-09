import React from 'react';
import Select from './selection';

const top_brand = ({ onReady }) => {
    const Title = "Thương hiệu nổi bật";

    return (
        <Select title={Title} onReady={onReady} />
    );
};

export default top_brand;
