//============= Khai báo biến và các hàm
const express = require("express");
const router = express.Router();
const{
    update 
} = require("../controllers/product.controller")

router.put("/updateProducts",update )
router.get("/checkProductExistence", checkExisProduct )
module.exports = router;
