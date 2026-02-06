const express = require("express");
const router = express.Router();
const { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, downloadAttachment, upload } = require("../controllers/customerController");

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.get("/:id/download", downloadAttachment);
router.post("/", upload.single('attachment'), createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
