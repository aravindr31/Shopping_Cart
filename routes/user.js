var express = require("express");
var productHelpers = require("../helpers/product-helpers");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");

/* GET home page. */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  productHelpers.getAllProducts().then((products) => {
    //console.log(products)
    res.render("user/view-products", { products, user });
  });
});
router.get("/login", (req, res) => {
  if(req.session.login){
    res.redirect('/')
  }else
  res.render("user/login",{Errmsg:req.session.loginErr});
  req.session.loginErr="";
});
router.post("/login", (req, res) => {
  userHelpers.login(req.body).then((data) => {
    if (data.loginStatus) {
      req.session.login = true;
      req.session.user = data.user;
      res.redirect("/");
    } else {
      req.session.loginErr="Invalid Username or Password"
      res.redirect("/login");
    }
  });
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.post("/signup", (req, res) => {
  userHelpers.signup(req.body).then((data) => {
    console.log(data);
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/cart",(req,res)=>{
  res.render("user/cart")
})
module.exports = router;
