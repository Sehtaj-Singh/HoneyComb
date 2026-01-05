const express = require("express");
const adminRouter = express.Router();

const adminController = require("../controllers/adminController");


adminRouter.get("/", adminController.getDashboard);

// Orders page
adminRouter.get("/orders", adminController.getOrders);



module.exports = adminRouter;