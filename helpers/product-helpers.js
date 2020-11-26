var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
module.exports = {
  login: (signInData) => {
    console.log(signInData);
    return new Promise(async (resolve, reject) => {
      let auth = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .aggregate([
          {
            $match: { username: signInData.Username },
          },
          {
            $project: {
              username: 1,
              password: 1,
              status: { $eq: ["$password", signInData.Password] },
            },
          },
        ])
        .toArray();
      console.log(auth[0]);
      resolve(auth[0]);
    });
  },
  addProduct: (product, callback) => {
    console.log(product);

    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((res) => {
          resolve(res);
        });
    });
  },
  getProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((productDetails) => {
          resolve(productDetails);
        });
    });
  },
  updateProduct: (id, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              name: details.name,
              category: details.category,
              price: details.price,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      console.log(users);
      resolve(users);
    });
  },
  deleteUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .remove({ _id: ObjectId(userId) })
        .then(() => {
          console.log();
          resolve();
        });
    });
  },
  changeAction: (stateChange) => {
    console.log(stateChange);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(stateChange.orderId) },
          {
            $set: {
              status: stateChange.state,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  orderDetails: (orderId) => {
    console.log(orderId);
    return new Promise(async (resolve, reject) => {
      let orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "userId",
              foreignField: "_id",
              as: "userdetails",
            },
          },
          {
            $unwind: "$userdetails",
          },
          {
            $project: {
              _id: 1,
              deliveryDetails: 1,
              userdetails: 1,
              paymentMethod: 1,
              Total: 1,
              date: 1,
              status: 1,
            },
          },
        ])
        .toArray();
      console.log(orderDetails);
      resolve(orderDetails);
    });
  },
  orderProductDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let productDetails = await db
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
         // console.log(productDetails);
          resolve(productDetails);
    });
  },
};
