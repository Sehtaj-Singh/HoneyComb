// Core Modules
const crypto = require("crypto");

// DB
const UserDB = require("../models/userDB");
const OrderDB = require("../models/orderDB");
const ProductDB = require("../models/productDB");

// Utils
const razorpay = require("../utils/razorPay");
const { encrypt } = require("../utils/cryptoUtil");
const { decrypt } = require("../utils/cryptoUtil");

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

    // 📦 Fetch user's order document(s)
    const orderDocs = await OrderDB.find({ firebaseUid }).lean();

    if (!orderDocs.length) {
      return res.render("pages/order", {
        active: "orders",
        orders: [],
        hasOrders: false,
        isDetailPage: null,
      });
    }

    // 🧩 Collect all unique productIds from orders
    const productIds = new Set();

    orderDocs.forEach(doc => {
      doc.items.forEach(item => {
        if (item.productId) {
          productIds.add(item.productId.toString());
        }
      });
    });

    // 📦 Fetch products
    const products = await ProductDB.find({
      _id: { $in: Array.from(productIds) }
    }).lean();

    // 🔁 Create product lookup map
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    // 🔗 Attach product data to each order item (UI-only)
    const orders = orderDocs.map(doc => ({
      ...doc,
      items: doc.items.map(item => ({
        ...item,
        product: productMap[item.productId?.toString()] || null
      }))
    }));

    return res.render("pages/order", {
      active: "orders",
      orders,
      hasOrders: orders.length > 0,
      isDetailPage: null,
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
exports.getCart = async (req, res) => {
  const cart = req.session.cart || [];

  let totalMrp = 0;
  let totalPrice = 0;

  cart.forEach((item) => {
    const mrp = item.mrp || item.price;
    totalMrp += mrp * item.quantity;
    totalPrice += item.price * item.quantity;
  });

  const discount = totalMrp - totalPrice;

  let address = null;
  let hasAddress = false;

  // ✅ FETCH USER FROM DB (THIS WAS MISSING)
  if (res.locals.isLoggedIn) {
    const firebaseUid = res.locals.user.uid;
    const userData = await UserDB.findOne({ uid: firebaseUid });

    address = userData?.address || null;
    hasAddress = !!address;
  }

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
    address,
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

// =========Payment=====
exports.createCheckoutOrder = async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) {
      return res.json({ success: false, message: "Cart empty" });
    }

    let amount = 0;
    const items = [];

    for (const cartItem of cart) {
      const product = await ProductDB.findById(cartItem.productId);
      if (!product) continue;

      const total = product.price * cartItem.quantity;
      amount += total;

      items.push({
        productId: product._id,
        quantity: cartItem.quantity,
        total
      });
    }

    if (!items.length) {
      return res.json({ success: false, message: "Invalid cart" });
    }

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    // Store minimal checkout info in session
    req.session.checkout = {
      items,
      amount,
      razorpayOrderId: razorpayOrder.id
    };

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error("Create checkout error:", err);
    return res.json({ success: false });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // 🔐 Razorpay signature verification (MANDATORY)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Invalid signature" });
    }

    const checkout = req.session.checkout;
    if (!checkout) {
      return res.json({ success: false, message: "Checkout session missing" });
    }

    // Build order items (ONLY required fields)
    const orderItems = checkout.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      total: item.total,

      razorpay_payment_id: encrypt(razorpay_payment_id),
      razorpay_order_id: encrypt(razorpay_order_id),

      status: "pending",        // ✅ as requested
      cancelledBy: null,
      trackingUrl: "",
      createdAt: new Date()
    }));

    // Save order (append to same user document)
    await OrderDB.updateOne(
      { firebaseUid: res.locals.user.uid },
      {
        $push: {
          items: { $each: orderItems }
        }
      },
      { upsert: true }
    );

    // Clear cart + checkout session
    req.session.cart = [];
    delete req.session.checkout;

    return res.json({ success: true });

  } catch (err) {
    console.error("Verify payment error:", err);
    return res.json({ success: false });
  }
};
