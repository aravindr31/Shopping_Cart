var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.adminLogin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};
router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin");
  } else {
    res.render("admin/login", {
      admin: true,
      Errmsg: req.session.adminLoginErr,
    });
  }
  req.session.adminLoginErr = "";
});
router.post("/login", (req, res) => {
  console.log(req.body);
  productHelpers.login(req.body).then((data) => {
    if (data.status) {
      req.session.adminLogin = true;
      req.session.admin = data.username;
      // console.log(data.admin)
      res.redirect("/admin");
    } else {
      req.session.adminLoginErr = "Invalid Username or Password";
      res.redirect("/admin/login");
    }
  });
});
/* GET users listing. */
router.get("/", verifyLogin, function (req, res, next) {
  let adminLog = req.session.admin;
  productHelpers.getAllProducts().then((products) => {
    console.log(products);
    if(adminLog){
      res.render("admin/view-products", {
        admin: true,
        adminLog: adminLog,
        products,
      });
    }else{
      res.redirect('/admin/login')
    }
    ``;
  });
});
router.get("/addproduct", verifyLogin, (req, res) => {
  let adminLog = req.session.admin;
  res.render("admin/addproduct", { admin: true, adminLog: adminLog });
});

router.post("/addproduct", (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image;
    image.mv("./public/product_images/" + id + ".jpg", (err) => {
      if (!err) {
        res.render("admin/addproduct", { admin: true });
      } else {
        console.log(err);
      }
    });
  });
});
router.get("/delete/:id", (req, res) => {
  productHelpers.deleteProduct(req.params.id).then((response) => {
    res.redirect("/admin");
  });
});
router.get("/edit/:id", async (req, res) => {
  let productDetails = await productHelpers.getProduct(req.params.id);
  console.log(productDetails);
  res.render("admin/editproduct", { productDetails });
});
router.post("/editproduct/:id", (req, res) => {
  let id = req.params.id;
  let details = req.body;

  productHelpers.updateProduct(id, details).then(() => {
    let image = req.files.image;
    image.mv("./public/product_images/" + id + ".jpg");
    res.redirect("/admin");
  });
});
router.get("/all_orders", verifyLogin, (req, res) => {
  let adminLog = req.session.admin;
  productHelpers.getAllOrders().then((orders) => {
    res.render("admin/all-orders", {
      admin: true,
      adminLog: adminLog,
      orders: orders,
    });
  });
});
router.get("/orderdetails/:id",verifyLogin, async (req, res) => {
  let orderId = req.params.id;
  let adminLog = req.session.admin;
  let orderDetails = await productHelpers.orderDetails(orderId);
  let product = await productHelpers.orderProductDetails(orderId);

  res.render("admin/order-details", {
    admin: true,
    adminLog: adminLog,
    product:product,
    orderDetails:orderDetails
  });
});
router.post("/change_action", (req, res) => {
  console.log(req.body);
  productHelpers.changeAction(req.body).then(() => {
    console.log("Status Changed");
    res.json({ status: true });
  });
});
router.get("/all_users", verifyLogin, (req, res) => {
  let adminLog = req.session.admin;
  productHelpers.getAllUsers().then((users) => {
    res.render("admin/all-users", {
      admin: true,
      adminLog: adminLog,
      users: users,
    });
  });
});
router.get("/delete_user/:id", async (req, res) => {
  console.log(req.params.id);
  await productHelpers.deleteUser(req.params.id).then(() => {
    res.redirect("/admin/all_users");
  });
});
router.get("/logout", (req, res) => {
  req.session.admin=null
  res.redirect("/admin/login"); 
});
module.exports = router;
