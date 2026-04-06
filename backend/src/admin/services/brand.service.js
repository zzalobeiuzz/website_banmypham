const brandModel = require("../models/brand.model");

exports.getAllBrands = async () => {
  const data = await brandModel.getAllBrands();
  return {
    success: true,
    data,
  };
};