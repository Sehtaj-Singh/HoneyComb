const express = require("express");
const loginRouter = express.Router();

const loginController = require("../controllers/loginController");


loginRouter.get("/login", loginController.getLogin);
loginRouter.post("/login", loginController.postLogin);

module.exports = loginRouter;
