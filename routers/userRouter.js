// routers/userRouter.js

const express = require("express");
const userRouter = express.Router();

const userController = require("../controllers/userController");

// GET register page
userRouter.get("/register", userController.getRegister);
userRouter.post("/register", userController.postRegister);

module.exports = userRouter;
