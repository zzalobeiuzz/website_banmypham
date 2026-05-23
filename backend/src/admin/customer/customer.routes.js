const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");

const {
	handleGetCustomers,
	handleCreateCustomer,
	handleGetCustomerDetail,
	handleUpdateCustomer,
	handleDeleteCustomer,
	handleResetCustomerPassword,
} = require("./customer.controller");
const authMiddleware = require("../middlewares/verifyToken.middleware");

router.use(authMiddleware.verifyToken, authMiddleware.verifyAdmin);

router.get("/", handleGetCustomers);
router.post("/", upload.single("avatarFile"), handleCreateCustomer);
router.get("/:customerId", handleGetCustomerDetail);
router.put("/:customerId", handleUpdateCustomer);
router.delete("/:customerId", handleDeleteCustomer);
router.put("/:customerId/reset-password", handleResetCustomerPassword);

module.exports = router;
