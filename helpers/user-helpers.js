require('dotenv').config()
const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.razorpay_key,
  key_secret: process.env.razorpay_secret,
});
module.exports = {
  signup: (signUpData) => {
    return new Promise(async (resolve, reject) => {
      signUpData.Password = await bcrypt.hash(signUpData.Password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(signUpData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  login: (signInData) => {
    console.log(process.env.razorpay_key,process.env.razorpay_secret)
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: signInData.Email });
      if (user) {
        bcrypt.compare(signInData.Password, user.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.user = user;
            response.loginStatus = true;
            console.log(response);
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ loginStatus: false });
          }
        });
      } else {
        console.log("User Not Found");
        resolve({ loginStatus: false });
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      console.log(proId);
      console.log(userId);
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });

      //let cartProducts=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(id)}).then((data)=>{
      if (userCart) {
        // console.log("user found")
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { "products.item": ObjectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
    // resolve(cartProducts)
  },
  viewCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      //console.log(cartItems[0].product);
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    // console.log(userId);
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      // console.log(cart);
      if (cart) {
        count = cart.products.length;
        //console.log(cart)
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    //console.log(details)
    quantity = parseInt(details.quantity);
    count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": count },
            }
          )
          .then((response) => {
            console.log(response);
            resolve({ status: true });
          });
      }
    });
  },
  deleteFromCart: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(details.cart) },
          {
            $pull: { products: { item: ObjectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ status: true });
        });
    });
  },
  getTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      console.log(total[0].total);
      resolve(total[0].total);
    });
  },
  getFromCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      resolve(cart.products);
    });
  },
  placeOrder: (order, product, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, product, total);
      let status = order["payment-method"] === "COD" ? "Placed" : "Pending";
        let orderObj = {
          deliveryDetails: {
            firstName: order.firstName,
            lastName: order.lastName,
            address: order.address,
            locality: order.locality,
            landmark: order.landmark,
            city: order.place,
            state: order.state,
            pincode: order.pincode,
            mobile: order.mobile,
          },
        userId: ObjectId(order.userId),
        paymentMethod: order["payment-method"],
        products: product,
        Total: total,
        date: new Date(),
        status: status,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .removeOne({ user: ObjectId(order.userId) });
          resolve(response.ops[0]._id);
        });
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) })
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  changeAction: (orderId) => {
    console.log(orderId);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "Cancelled"
            },
          }
        )
        .then(() => {
          resolve({status:true});
        });
    });
  },
  getOrderProducts: (orderId) => {
    console.log(orderId);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray()
        .then((orderItems) => {
          console.log(orderItems);
          resolve(orderItems);
        });
    });
  },
  getOrderStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderStatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: ObjectId(orderId) }, { projection: { status: 1, _id: 0 } })
        .toArray();
        console.log(orderStatus)
      resolve(orderStatus[0]);
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log(order);
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "j3G9STm9IILKgchw9VrGRAQ1");
            console.log(hmac)
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );

      hmac = hmac.digest("hex");
      if (hmac === details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "Placed",   
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
};
