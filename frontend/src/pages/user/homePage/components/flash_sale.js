import React from 'react';
import Select from './selection';

const FlashSale = ({ onReady }) => {
    const Title = "Flash Sale";

    return (
        <Select title={Title} onReady={onReady} />
    );
};

export default FlashSale;
