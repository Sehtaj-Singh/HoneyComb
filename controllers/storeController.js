// DB
const UserDB = require("../models/userDB");
const OrderDB = require("../models/orderDB");
const ProductDB = require("../models/productDB");

exports.getIndex = async (req, res) => {
  try {
    const products = await ProductDB.find({ isActive: true }).limit(3);

    return res.render("pages/index", {
      active: "home",
      products,
      isDetailPage: null,
    });
  } catch (error) {
    console.error("Index page error:", error);

    // IMPORTANT: render page safely, not crash
    return res.render("pages/index", {
      active: "home",
      products: [],
    });
  }
};

exports.getStore = async (req, res) => {
  try {
    const products = await ProductDB.find({ isActive: true });

    return res.render("pages/store", {
      active: "store",
      products,
      isDetailPage: null,
    });
  } catch (error) {
    console.error("Store page error:", error);

    // IMPORTANT: never crash EJS
    return res.render("pages/store", {
      active: "store",
      products: [],
      isDetailPage: null,
    });
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const product = await ProductDB.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).render("pages/404");
    }

    return res.render("pages/productDetail", {
      active: "store",
      product,
      isDetailPage: null,
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
        hasOrders: false,
        isDetailPage: null,
      });
    }

    // 🔑 Firebase UID from middleware
    const firebaseUid = res.locals.user.uid;

    // 📦 Fetch orders for this user
    const orders = await OrderDB.find({ firebaseUid });

    return res.render("pages/order", {
      active: "orders",
      orders,
      hasOrders: orders.length > 0,
    });
  } catch (err) {
    console.error("Orders error:", err);

    return res.render("pages/order", {
      active: "orders",
      orders: [],
      hasOrders: false,
      isDetailPage: null,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (!res.locals.isLoggedIn) {
      return res.render("pages/profile", {
        active: "profile",
        isLoggedIn: false,
        userData: null,
        address: null,
        isDetailPage: null,
      });
    }

    const firebaseUid = res.locals.user.uid;

    const userData = await UserDB.findOne({ uid: firebaseUid });

    return res.render("pages/profile", {
      active: "profile",
      isLoggedIn: true,
      userData,
      address: userData?.address || null,
    });
  } catch (err) {
    console.error("Profile error:", err);

    return res.render("pages/profile", {
      active: "profile",
      isLoggedIn: false,
      userData: null,
      address: null,
      isDetailPage: null,
    });
  }
};

// --------------------
// VIEW CART
// --------------------
exports.getCart = (req, res) => {
  const cart = req.session.cart || [];

  let totalMrp = 0;
  let totalPrice = 0;

  cart.forEach((item) => {
    const mrp = item.mrp || item.price;
    totalMrp += mrp * item.quantity;
    totalPrice += item.price * item.quantity;
  });

  const discount = totalMrp - totalPrice;

  // 👇 address existence
  const hasAddress = !!res.locals.user?.address;

  res.render("pages/cart", {
    active: "cart",
    cart,
    isLoggedIn: res.locals.isLoggedIn,
    hasItems: cart.length > 0,
    summary: {
      totalMrp,
      discount,
      totalPrice,
    },
    hasAddress,
    address: res.locals.user?.address || null,
  });
};

// --------------------
// ADD TO CART
// --------------------
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await ProductDB.findById(productId);
    if (!product) return res.redirect("/");

    // init cart
    if (!req.session.cart) {
      req.session.cart = [];
    }

    const cart = req.session.cart;

    // check existing item
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product._id.toString(),
        name: product.name,
        weight: product.weight,
        price: product.price,
        quantity: 1,
      });
    }

    req.session.flash = {
      type: "success",
      message: "Item added to cart",
    };

    const redirectTo = req.get("referer") || "/cart";
    res.redirect(redirectTo);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.redirect("/");
  }
};

// --------------------
// REMOVE FROM CART
// --------------------
exports.removeFromCart = (req, res) => {
  const { productId } = req.body;

  if (!req.session.cart) {
    return res.redirect("/cart");
  }

  req.session.cart = req.session.cart.filter(
    (item) => item.productId !== productId
  );

  req.session.flash = {
    type: "success",
    message: "Item removed from cart",
  };

  const redirectTo = req.get("referer") || "/cart";
  res.redirect(redirectTo);
};

exports.increaseQty = (req, res) => {
  const { productId } = req.body;

  const cart = req.session.cart || [];
  const item = cart.find((i) => i.productId === productId);

  if (item) {
    item.quantity += 1;
  }

  req.session.flash = {
    type: "success",
    message: "Quantity updated",
  };

  res.redirect(req.get("referer") || "/cart");
};

exports.decreaseQty = (req, res) => {
  const { productId } = req.body;

  let cart = req.session.cart || [];
  const item = cart.find((i) => i.productId === productId);

  if (item) {
    item.quantity -= 1;

    if (item.quantity <= 0) {
      cart = cart.filter((i) => i.productId !== productId);
      req.session.cart = cart;
    }
  }

  req.session.flash = {
    type: "success",
    message: "Quantity updated",
  };

  res.redirect(req.get("referer") || "/cart");
};

exports.saveAddress = async (req, res) => {
  try {
    if (!res.locals.isLoggedIn) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const uid = res.locals.user.uid;
    const address = req.body;

    await UserDB.updateOne(
      { uid },
      {
        address,
        lastProfileEditAt: new Date(),
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Save address error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to save address",
    });
  }
};
