import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ================= CONSTANTS =================

const DELIVERY_FEE = 60;

const MERCHANT_NUMBERS = {
  bkash: "017XXXXXXXX",
  nagad: "018XXXXXXXX"
};


// ================= ELEMENTS =================

const orderItemsEl = document.getElementById("orderItems");
const subTotalEl = document.getElementById("subTotal");
const grandTotalEl = document.getElementById("grandTotal");
const deliveryFeeEl = document.getElementById("deliveryFee");

const paymentCards = document.querySelectorAll(".payment-card");
const manualBox = document.getElementById("manualPaymentBox");
const merchantNumberEl = document.getElementById("merchantNumber");

const confirmBtn = document.getElementById("confirmOrderBtn");
const agreeTerms = document.getElementById("agreeTerms");

let selectedPayment = "COD";
let cart = [];


// ================= LOAD CART =================

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}


// ================= RENDER ORDER SUMMARY =================

function renderOrder() {

  cart = getCart();

  if (!cart.length) {
    orderItemsEl.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let subtotal = calculateSubtotal(cart);

  orderItemsEl.innerHTML = cart.map(item => `
    <div class="order-item">

      <img src="${item.image || 'images/placeholder.png'}">

      <div class="order-info">
        <h4>${item.name}</h4>
        <small>${item.unit} × ${item.qty}</small>
      </div>

      <div class="order-price">
        ৳ ${item.price * item.qty}
      </div>

    </div>
  `).join("");

  subTotalEl.textContent = `৳ ${subtotal}`;
  deliveryFeeEl.textContent = `৳ ${DELIVERY_FEE}`;
  grandTotalEl.textContent = `৳ ${subtotal + DELIVERY_FEE}`;
}


// ================= PAYMENT SELECTION =================

paymentCards.forEach(card => {
  card.addEventListener("click", () => {

    paymentCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");

    selectedPayment = card.dataset.method;

    if (selectedPayment === "COD") {
      manualBox.style.display = "none";
    } else {
      manualBox.style.display = "block";
      merchantNumberEl.textContent =
        MERCHANT_NUMBERS[selectedPayment];
    }

  });
});


// ================= PLACE ORDER =================

confirmBtn.addEventListener("click", async () => {

  if (!agreeTerms.checked) {
    alert("Please agree to Terms & Conditions");
    return;
  }

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();
  const area = document.getElementById("area").value.trim();
  const district = document.getElementById("district").value;

  const payerNumber = document.getElementById("payerNumber")?.value.trim();
  const trxId = document.getElementById("trxId")?.value.trim();

  if (!firstName || !phone || !address || !area) {
    alert("Please fill required fields");
    return;
  }

  if (selectedPayment !== "COD") {
    if (!payerNumber || !trxId) {
      alert("Enter payment number and transaction ID");
      return;
    }
  }

  confirmBtn.textContent = "Processing...";
  confirmBtn.disabled = true;

  const subtotal = calculateSubtotal(cart);
  const total = subtotal + DELIVERY_FEE;

  try {

    // ================= SAVE ORDER =================

    const orderRef = await addDoc(collection(db, "orders"), {
      customer: {
        firstName,
        lastName,
        phone,
        email,
        address,
        area,
        district
      },
      items: cart,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      payment: {
        method: selectedPayment,
        merchantNumber:
          selectedPayment !== "COD"
            ? MERCHANT_NUMBERS[selectedPayment]
            : null,
        payerNumber:
          selectedPayment !== "COD"
            ? payerNumber
            : null,
        transactionId:
          selectedPayment !== "COD"
            ? trxId
            : null
      },
      status: "Pending",
      createdAt: new Date().toISOString()
    });

    // ================= REDUCE STOCK =================

    for (let item of cart) {

      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {

        const productData = productSnap.data();
        const newStock = (productData.stock || 0) - item.qty;

        await updateDoc(productRef, {
          stock: newStock < 0 ? 0 : newStock
        });
      }
    }

    // ================= CLEAR CART =================

    localStorage.removeItem("cart");

    // ================= REDIRECT =================

    window.location.href =
      `order-status.html?orderId=${orderRef.id}`;

  } catch (error) {

    console.error(error);
    alert("Something went wrong. Try again.");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Order";
  }

});


// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {
  renderOrder();
});
