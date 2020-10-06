var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const e = require("express");
const { response } = require("express");
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
};
