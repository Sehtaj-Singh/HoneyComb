// DB
const UserDB = require("../models/userDB");
const OrderDB = require("../models/orderDB");
const ProductDB = require("../models/productDB");

exports.getIndex = async (req, res) => {
  try {
    const products = await ProductDB
      .find({ isActive: true })
      .limit(3);

    return res.render("pages/index", {
      active: "home",
      products
    });

  } catch (error) {
    console.error("Index page error:", error);

    // IMPORTANT: render page safely, not crash
    return res.render("pages/index", {
      active: "home",
      products: []
    });
  }
};


exports.getStore = (req, res) => {
  res.render('pages/store', { active: 'store' });
};



exports.getProductDetail = async (req, res) => {
  try {
    const product = await ProductDB.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).render("pages/404");
    }

    return res.render("pages/productDetail", {
      active: "store",
      product
    });

  } catch (error) {
    console.error("Product detail error:", error);
    return res.status(404).render("pages/404");
  }
};





exports.getOrders = async (req, res) => {
  try {
    // 🔒 login state already decided by middleware
    if (!res.locals.isLoggedIn) {
      return res.render("pages/order", {
        active: "orders",
        orders: [],
        hasOrders: false
      });
    }

    // 🔑 Firebase UID from middleware
    const firebaseUid = res.locals.user.uid;

    // 📦 Fetch orders for this user
    const orders = await OrderDB.find({ firebaseUid });

    return res.render("pages/order", {
      active: "orders",
      orders,
      hasOrders: orders.length > 0
    });

  } catch (err) {
    console.error("Orders error:", err);

    return res.render("pages/order", {
      active: "orders",
      orders: [],
      hasOrders: false
    });
  }
};



exports.getProfile = async (req, res) => {
  try {
    // 🔒 login state already decided by middleware
    if (!res.locals.isLoggedIn) {
      return res.render("pages/profile", {
        active: "profile",
        userData: null
      });
    }

    // 🔑 user identity from middleware
    const firebaseUid = res.locals.user.uid;

    // 📦 fetch user profile from DB
    const userData = await UserDB.findOne({ uid: firebaseUid });

    return res.render("pages/profile", {
      active: "profile",
      userData
    });

  } catch (err) {
    console.error("Profile error:", err);

    return res.render("pages/profile", {
      active: "profile",
      userData: null
    });
  }
};
