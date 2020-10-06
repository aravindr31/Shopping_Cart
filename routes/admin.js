var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
productHelpers.getAllProducts().then((products)=>{
  console.log(products)
  res.render('admin/view-products',{admin:true,products});
})
 
});
router.get("/addproduct",(req,res)=>{
  res.render("admin/addproduct",{admin:true})
})

router.post("/addproduct",(req,res)=>{
  console.log(req.body);
  console.log(req.files.image);

  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv("./public/product_images/"+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/addproduct",{admin:true})
      }
      else{
        console.log(err);
      }
    })
    
  })

})
router.get("/delete/:id",(req,res)=>{
   productHelpers.deleteProduct(req.params.id).then((response)=>{
    res.redirect("/admin")
   })
})
module.exports = router;
