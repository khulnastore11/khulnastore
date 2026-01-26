import { db } from "./firebase.js";
import { doc, getDoc }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const orderInput = document.getElementById("orderIdInput");
const resultBox = document.getElementById("orderResult");

// ================= MAIN LOADER =================
async function loadOrder(orderId) {

  if (!orderId) return;

  resultBox.innerHTML = "Loading...";
  resultBox.style.display = "block";

  const docRef = doc(db, "orders", orderId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    resultBox.innerHTML = `
      <div class="status-error">
        ❌ Order not found
      </div>
    `;
    return;
  }

  const order = snapshot.data();

  const itemsHtml = (order.items || []).map(item => `
    <div class="status-item">
      <img src="${item.image}" class="status-item-img">
      <div class="status-item-info">
        <strong>${item.name}</strong>
        <small>৳ ${item.price} × ${item.qty}</small>
      </div>
      <div class="status-item-total">
        ৳ ${item.price * item.qty}
      </div>
    </div>
  `).join("");

  const noteHtml = order.adminNote
    ? `
      <div class="status-note-box">
        <strong>📢 Admin Note</strong>
        <p>${order.adminNote}</p>
      </div>
    `
    : "";

  resultBox.innerHTML = `
    <div class="status-card">

      <div class="status-header">
        <h3>Order ID: ${orderId}</h3>
    <div class="order-status-badge ${order.status}">
  ${order.status}
</div>

      </div>

      <div class="order-info-card">
  <div class="info-group">
    <h4>Customer</h4>
    <p><strong>Name:</strong> ${order.customer?.firstName || ""} ${order.customer?.lastName || ""}</p>
    <p><strong>Phone:</strong> ${order.customer?.phone || "-"}</p>
    <p><strong>Address:</strong> ${order.customer?.address || "-"}</p>
  </div>

  <div class="info-group">
    <h4>Payment</h4>
    <p><strong>Method:</strong> ${order.payment?.method || "-"}</p>
    ${order.payment?.trxId ? `<p><strong>TRX ID:</strong> ${order.payment.trxId}</p>` : ""}
  </div>
</div>


      <div class="status-section">
        <strong>Items</strong>
        ${itemsHtml}
      </div>

     <div class="summary-box">
  <div class="summary-row">
    <span>Subtotal</span>
    <span>৳ ${order.subtotal}</span>
  </div>
  <div class="summary-row">
    <span>Delivery</span>
    <span>৳ ${order.deliveryFee}</span>
  </div>
  <div class="summary-row total">
    <span>Total</span>
    <span>৳ ${order.total}</span>
  </div>
</div>


      ${noteHtml}

    </div>
  `;
}

// ================= GLOBAL FUNCTION (FOR HTML BUTTON) =================
document.getElementById("checkOrderBtn")
  ?.addEventListener("click", () => {
    const orderId = orderInput.value.trim();
    loadOrder(orderId);
  });


// ================= AUTO LOAD FROM URL =================
const params = new URLSearchParams(window.location.search);
const orderIdFromUrl = params.get("orderId");

if (orderIdFromUrl) {
  loadOrder(orderIdFromUrl);
}
