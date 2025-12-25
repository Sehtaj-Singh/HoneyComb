//external modules
const express = require(`express`);
const storeRouter = express.Router();

// 🔐 auth middlewares
const detectSession = require("../middlewares/detectSession");
const verifySession = require("../middlewares/verifySession");
const refreshSession = require("../middlewares/refreshSession");

//controller module
const storeController = require(`../controllers/storeController`);

// public pages
storeRouter.get(`/` ,  storeController.getIndex);
storeRouter.get('/store', storeController.getStore);
storeRouter.get("/product/:id", storeController.getProductDetail);


// 🔑 Private Pages
storeRouter.use(detectSession);
storeRouter.use(verifySession);
storeRouter.use(refreshSession);

storeRouter.get('/orders', storeController.getOrders);
storeRouter.get('/profile', storeController.getProfile);

module.exports = storeRouter;