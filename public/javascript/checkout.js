document.addEventListener("DOMContentLoaded", function () {

  window.startCheckout = async function () {
    try {
      const res = await fetch("/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (!data.success) {
        alert("Unable to start checkout");
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount * 100,
        currency: "INR",
        order_id: data.orderId,
        name: "HoneyComb",
        description: "Order Payment",

        handler: async function (response) {
          try {
            const verifyRes = await fetch("/checkout/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response)
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              window.location.href = "/orders";
            } else {
              alert("Payment verification failed");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification error");
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Checkout closed");
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed");
    }
  };

});
