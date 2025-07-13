//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update,
    checkExisProduct
} = require("../controllers/product.controller")

router.put("/updateProducts",update )
router.get("/checkProductExistence", checkExisProduct )
router.post("/priview_upload" )

module.exports = router;
