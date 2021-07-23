var express = require("express");
var productHelpers = require("../helpers/product-helpers");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.userLogin) {
    next();
  } else {
    res.redirect("/login");
  }
};
/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user, cartCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else res.render("user/login", { Errmsg: req.session.userLoginErr });
  req.session.userLoginErr = "";
});
router.post("/login", (req, res) => {
  userHelpers.login(req.body).then((data) => {
    if (data.loginStatus) {
      req.session.userLogin = true;
      req.session.user = data.user;
      res.redirect("/");
    } else {
      req.session.userLoginErr = "Invalid Username or Password";
      res.redirect("/login");
    }
  });
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.post("/signup", (req, res) => {
  userHelpers.signup(req.body).then((response) => {
    req.session.user = response.user;
    req.session.userLogin = true;
    res.redirect("/");
  });
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  let products = await userHelpers.viewCart(req.session.user._id);
  let totalAmount = 0;
  if (products.length > 0) {
    totalAmount = await userHelpers.getTotal(req.session.user._id);
  }
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render("user/cart", {
    products,
    user: user,
    userId: req.session.user._id,
    totalAmount,
    cartCount,
  });
});
router.get("/addtocart/:id", verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
router.get("/buynow/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  await userHelpers.addToCart(req.params.id, req.session.user._id);
  let total = await userHelpers.getTotal(req.session.user._id);
  res.render("user/checkout", { total, user: user });
});
router.post("/change_product_quantity", (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.totalAmount = await userHelpers.getTotal(req.body.user);
    res.json(response);
  });
});
router.post("/delete_from_cart", (req, res) => {
  userHelpers.deleteFromCart(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/place_order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total = await userHelpers.getTotal(req.session.user._id);
  res.render("user/checkout", { total, user: user });
});
router.post("/place_order", verifyLogin, async (req, res) => {
  let product = await userHelpers.getFromCart(req.body.userId);
  let totalPrice = await userHelpers.getTotal(req.body.userId);
  userHelpers.placeOrder(req.body, product, totalPrice).then((orderId) => {
    if (req.body["payment-method"] == "COD") {
      res.json({ cod_success: true });
    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response);
      });
    }
  });
});
router.get("/order_success", verifyLogin, (req, res) => {
  res.render("user/order-success", { user: req.session.user });
});
router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/orders", { user: req.session.user, orders });
});
router.get("/cancel_order/:id",verifyLogin,(req,res)=>{
  userHelpers.changeAction(req.params.id).then((response)=>{
    res.json({response})
  })
})
router.get("/view_order_products/:id", verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  let orderStatus = await userHelpers.getOrderStatus(req.params.id);

  res.render("user/view-order-products", {
    user: req.session.user,
    products,
    orderStatus,
    // progressBarValue,
  });
});

router.post("/verify_payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});
module.exports = router;
