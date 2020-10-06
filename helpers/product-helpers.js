    var db=require('../config/connection')
    var collection=require('../config/collections');
const collections = require('../../url_shortner/config/collections');
const { ObjectId } = require('mongodb');
    module.exports={

        addProduct:(product,callback)=>{
        console.log(product);

        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })

        },
        getAllProducts:()=>{
            return new Promise(async(resolve,reject)=>{
                let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            })
        },
        deleteProduct:(id)=>{
            return new Promise ((resolve,reject)=>{
                 db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(id)}).then((res)=>{
                    resolve(res)
                })
            });
        },
        getProduct:(id)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(id)}).then((productDetails)=>{
                    resolve(productDetails)
                })
            })
        },
        updateProduct:(id,details)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(id)},{
                    $set:{
                        name:details.name,
                        category:details.category,
                        price:details.price,
                    }
                }).then((response)=>{
                    resolve()
                })
            })
        }

    }
