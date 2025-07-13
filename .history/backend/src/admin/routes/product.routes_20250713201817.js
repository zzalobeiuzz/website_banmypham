//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update,
    checkExisProduct
} = require("../controllers/product.controller")

router.put("/updateProducts",update )
router.get("/checkProductExistence", checkExisProduct )
router.get("/priview_upload", checkExisProduct )
priview_upload
module.exports = router;
