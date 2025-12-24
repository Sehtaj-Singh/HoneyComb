//external modules
const express = require(`express`);
const storeRouter = express.Router();

//controller module
const storeController = require(`../controllers/storeController`);

storeRouter.get(`/` ,  storeController.getIndex);
storeRouter.get('/store', storeController.getStore);
storeRouter.get('/orders', storeController.getOrders);
storeRouter.get('/profile', storeController.getProfile);

module.exports = storeRouter;