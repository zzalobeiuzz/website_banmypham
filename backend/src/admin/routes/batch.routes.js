const express = require("express");
const router = express.Router();

const { getAllBatches } = require("../controllers/batch.controller");

router.get("/", getAllBatches);

module.exports = router;
