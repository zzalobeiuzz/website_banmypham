//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update 
} = require("../controllers/product.controller")

router.put("/updateProducts",update )
router.get("/ucheck-barcodepdateProducts",update )
module.exports = router;
