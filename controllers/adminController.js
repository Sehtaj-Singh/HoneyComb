const OrderDB = require("../models/orderDB");

exports.getDashboard = (req, res) => {
  res.render("admin/dashboard", {
    pageTitle: "Admin Panel",
  });
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await OrderDB.find()
      .sort({ "items.createdAt": -1 })
      .lean();

    res.render("admin/orders", {
      pageTitle: "Admin | Orders",
      orders,
      hasOrders: orders.length > 0,
    });
  } catch (err) {
    console.error("Admin Orders Error:", err);
    next(err); // 🔥 Correct handling
  }
};
