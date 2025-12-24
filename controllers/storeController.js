
exports.getIndex = (req, res) => {
  res.render('pages/index', { active: 'home' });
};

exports.getStore = (req, res) => {
  res.render('pages/store', { active: 'store' });
};

exports.getOrders = (req, res) => {
  res.render('pages/order', { active: 'orders' });
};


exports.getProfile = (req, res) => {
  res.render('pages/profile', { active: 'profile' });
};
