function addToCart(prodId) {
  if(prodId)
  $.ajax({
    url: "/addtocart/" + prodId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      }
    },
  });
  else{
    alert("Login to Continue")
  }
}
function deleteFromCart(userId, prodId, cartId) {
  $.ajax({
    url: "/delete_from_cart/",
    data: {
      user: userId,
      cart: cartId,
      product: prodId,
    },
    method: "post",
    success: (response) => {
      if (response.status) {
        location.reload();
      }
    },
  });
}
function changeQuantity(cartId, proId, userId, count) {
  console.log(proId, cartId, count);
  let quantity = parseInt(document.getElementById(proId).innerHTML);
  //console.log(quantity)
  count = parseInt(count);
  $.ajax({
    url: "/change_product_quantity",
    data: {
      user: userId,
      cart: cartId,
      product: proId,
      count: count,
      quantity: quantity,
    },
    method: "post",
    success: (response) => {
      console.log(response.totalAmount);
      if (response.removeProduct) {
        alert("Product removed from cart");
        location.reload();
      } else {
        document.getElementById(proId).innerHTML = quantity + count;
        document.getElementById("total").innerHTML = response.totalAmount;
      }
    },
  });
}

$("#checkout_form").submit((e) => {
  e.preventDefault();
  $.ajax({
    url: "/place_order",
    method: "post",
    data: $("#checkout_form").serialize(),
    success: (response) => {
      if (response.cod_success) {
        location.href = "/order_success";
      } else {
        console.log(response);
        razorpayPayment(response);
      }
    },
  });
});
function razorpayPayment(order) {
  var options = {
    key: "rzp_test_Jt7dPp8jwV1KsB", // Enter the Key ID generated from the Dashboard
    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Amazon-clone",
    description: "Test Transaction",
    image: "https://example.com/your_logo",
    order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      verifyPayment(response, order);
    },
    prefill: {
      name: "Gaurav Kumar",
      email: "gaurav.kumar@example.com",
      contact: "9999999999",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#F37254",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}
function verifyPayment(payment, order) {
  $.ajax({
    url: "/verify_payment",
    data: {
      payment,
      order,
    },
    method: "post",
    success: (response) => {
      if (response.status) {
        location.href = "/order_success";
      } else {
        alert("Payment failed");
      }
    },
  });
}
function cancelFunction(orderId){
// alert(orderId)
$.ajax({
  url :"/cancel_order/"+orderId,
  method:"get",
  success :(response)=>{
    if(response){
      location.reload()
    }
  }

})
}
//ADMIN PANEL
function changeAction(orderId,state) {
 // alert('orderId,state')
  $.ajax({
    url : '/admin/change_action',
    data : {
      orderId :orderId,
      state : state
    },
    method : 'post',
    success :(response) =>{
      if (response.status){
        location.reload()
      }
    }
  })
}
