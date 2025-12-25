// controllers/loginController.js

exports.getLogin = (req, res) => {
  res.render("pages/login" , { active: null });
};
