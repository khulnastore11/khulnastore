import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

// 🔒 ADMIN PAGE PROTECTION
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin-login.html";
  }
});
;

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= CLOUDINARY CONFIG ================= */
const CLOUD_NAME = "dc79ukf7s";
const UPLOAD_PRESET = "khulna-sign";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

  renderProducts();
  renderOrders();
  loadKPIs();

  document.getElementById("addProductBtn")
    ?.addEventListener("click", handleSubmit);

  document.getElementById("cancelEditBtn")
    ?.addEventListener("click", resetForm);

});

/* ================= SECTION TABS ================= */
window.showSection = function(type) {

  const ordersSection = document.getElementById("ordersSection");
  const productsSection = document.getElementById("productsSection");
  const tabs = document.querySelectorAll(".admin-tabs button");

  tabs.forEach(btn => btn.classList.remove("active-tab"));

  if (type === "orders") {
    ordersSection.style.display = "block";
    productsSection.style.display = "none";
    tabs[0].classList.add("active-tab");
  } else {
    ordersSection.style.display = "none";
    productsSection.style.display = "block";
    tabs[1].classList.add("active-tab");
  }
};

/* ================= TOAST ================= */
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

/* ===================================================== */
/* ================= PRODUCTS SECTION ================== */
/* ===================================================== */

async function renderProducts() {

  const list = document.getElementById("productList");
  if (!list) return;

  list.innerHTML = "Loading...";

  const snapshot = await getDocs(collection(db, "products"));

  if (snapshot.empty) {
    list.innerHTML = "<p>No products yet.</p>";
    return;
  }

  list.innerHTML = "";

  snapshot.forEach(docSnap => {

    const p = docSnap.data();
    const id = docSnap.id;
    const stock = p.stock ?? 0;

    list.innerHTML += `
      <div class="cart-item">
        <img src="${p.image}" class="cart-img">
        <div class="cart-info">
          <strong>${p.name}</strong>
          <small>${p.unit} • ৳ ${p.price}</small>
          <small>Stock: ${stock}</small>
        </div>

        <div style="display:flex;gap:8px">
          <button class="edit-btn" data-id="${id}">✏️</button>
          <button class="remove-btn" data-id="${id}">✕</button>
        </div>
      </div>
    `;
  });
}

/* ===== Edit & Delete (Delegation) ===== */
document.addEventListener("click", async (e) => {

  // EDIT
  if (e.target.classList.contains("edit-btn")) {

    const id = e.target.dataset.id;
    const docSnap = await getDoc(doc(db, "products", id));
    if (!docSnap.exists()) return;

    const product = docSnap.data();

    editProductId.value = id;
    pName.value = product.name;
    pPrice.value = product.price;
    pUnit.value = product.unit;
    pCategory.value = product.category || "";
    pDesc.value = product.desc || "";
    pStock.value = product.stock ?? 0;

    document.getElementById("pImage").value = product.image;

    const preview = document.getElementById("imagePreview");
    preview.src = product.image;
    preview.style.display = "block";

    addProductBtn.textContent = "Update Product";
    document.getElementById("cancelEditBtn").style.display = "inline-block";
  }

  // DELETE
  if (e.target.classList.contains("remove-btn")) {

    const id = e.target.dataset.id;
    if (!confirm("Delete product?")) return;

    await deleteDoc(doc(db, "products", id));
    showToast("Product removed");
    renderProducts();
    loadKPIs();
  }

  // SAVE ADMIN NOTE
  if (e.target.classList.contains("save-note-btn")) {

    const id = e.target.dataset.id;
    const textarea = document.querySelector(
      `.admin-note[data-id="${id}"]`
    );

    const note = textarea.value.trim();

    await updateDoc(doc(db, "orders", id), {
      adminNote: note
    });

    showToast("Note saved");
  }

});

/* ===== ADD / UPDATE PRODUCT ===== */
async function handleSubmit() {

  const id = editProductId.value;

  const fileInput = document.getElementById("pImageFile");
  let imageUrl = document.getElementById("pImage").value;

  if (fileInput.files.length > 0) {
    showToast("Uploading image...");
    imageUrl = await uploadToCloudinary(fileInput.files[0]);
  }

  const data = {
    name: pName.value.trim(),
    price: Number(pPrice.value),
    unit: pUnit.value.trim(),
    image: imageUrl,
    category: pCategory.value.trim(),
    desc: pDesc.value.trim(),
    stock: Number(pStock.value) || 0
  };

  if (!data.name || !data.price || !data.unit || !data.image) {
    showToast("Fill required fields");
    return;
  }

  if (id) {
    await updateDoc(doc(db, "products", id), data);
    showToast("Product updated");
  } else {
    await addDoc(collection(db, "products"), data);
    showToast("Product added");
  }

  resetForm();
  renderProducts();
  loadKPIs();
}

/* ===== RESET FORM ===== */
function resetForm() {

  editProductId.value = "";
  pName.value = "";
  pPrice.value = "";
  pUnit.value = "";
  pCategory.value = "";
  pDesc.value = "";
  pStock.value = "";

  document.getElementById("pImageFile").value = "";
  document.getElementById("pImage").value = "";
  document.getElementById("imagePreview").style.display = "none";

  addProductBtn.textContent = "Add Product";
  document.getElementById("cancelEditBtn").style.display = "none";
}

/* ===================================================== */
/* ================= ORDERS SECTION ==================== */
/* ===================================================== */

/* ===================================================== */
/* ================= ORDERS SECTION ==================== */
/* ===================================================== */

let currentStatusFilter = "All";

async function renderOrders() {

  const list = document.getElementById("ordersList");
  if (!list) return;

  list.innerHTML = "Loading...";

  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    list.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  list.innerHTML = "";

  // Convert to array + sort newest first
  const orders = snapshot.docs
    .map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }))
    .sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

  orders.forEach(o => {

    // FILTER BY STATUS
    if (currentStatusFilter !== "All" && o.status !== currentStatusFilter) {
      return;
    }

    const id = o.id;

    const itemsHtml = (o.items || []).map(item => `
      <div style="display:flex;gap:10px;margin-bottom:8px">
        <img src="${item.image}" 
             style="width:60px;height:60px;object-fit:contain;border-radius:8px;background:#f3f3f3">
        <div>
          <strong>${item.name}</strong><br>
          <small>৳ ${item.price} × ${item.qty}</small>
        </div>
      </div>
    `).join("");

    const noteHighlight = o.adminNote
      ? `
        <div style="
          background:#fff3cd;
          padding:10px;
          border-left:4px solid #ff9800;
          border-radius:6px;
          margin-bottom:10px;
          font-weight:600;
        ">
          Current Note: ${o.adminNote}
        </div>
      `
      : "";

    list.innerHTML += `
      <div class="cart-item" style="flex-direction:column;align-items:flex-start">

        <div style="width:100%">
          <strong>Firestore ID:</strong> ${id}<br>
          <strong>Public ID:</strong> ${o.publicId || "—"}<br>

          <strong>Status:</strong> 
          <span style="
            padding:4px 8px;
            border-radius:6px;
            font-weight:600;
            background:${getStatusColor(o.status)};
            color:#fff;
          ">
            ${o.status || "Pending"}
          </span>
          <br><br>

          <strong>Customer:</strong> 
          ${o.customer?.firstName || ""} ${o.customer?.lastName || ""}<br>
          <strong>Phone:</strong> ${o.customer?.phone || "-"}<br>
          <strong>Address:</strong> ${o.customer?.address || "-"}<br><br>

          <strong>Payment:</strong> ${o.payment?.method || "-"}<br>
          ${o.payment?.transactionId ? `<strong>TRX ID:</strong> ${o.payment.transactionId}<br>` : ""}
          ${o.payment?.payerNumber ? `<strong>Payer:</strong> ${o.payment.payerNumber}<br>` : ""}
        </div>

        <hr style="width:100%;margin:12px 0">

        ${itemsHtml}

        <hr style="width:100%;margin:12px 0">

        <div style="width:100%">
          <strong>Subtotal:</strong> ৳ ${o.subtotal || 0}<br>
          <strong>Delivery:</strong> ৳ ${o.deliveryFee || 0}<br>
          <strong>Total:</strong> ৳ ${o.total || 0}
        </div>

        <hr style="width:100%;margin:12px 0">

        ${noteHighlight}

        <textarea data-id="${id}" 
                  class="admin-note"
                  placeholder="Add internal note..."
                  style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd">
          ${o.adminNote || ""}
        </textarea>

        <button class="save-note-btn primary-btn" 
                data-id="${id}" 
                style="margin-top:8px">
          Save Note
        </button>

        <div style="margin-top:12px">
          <select data-id="${id}" class="status-select">
            ${["Pending","Confirmed","Delivered","Cancelled"].map(s =>
              `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </div>

      </div>
    `;
  });
}

function getStatusColor(status) {
  switch (status) {
    case "Pending": return "#ff9800";
    case "Confirmed": return "#2196f3";
    case "Delivered": return "#2e7d32";
    case "Cancelled": return "#d32f2f";
    default: return "#777";
  }
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("order-tab")) {

    document.querySelectorAll(".order-tab")
      .forEach(btn => btn.classList.remove("active"));

    e.target.classList.add("active");

    currentStatusFilter = e.target.dataset.status;
    renderOrders();
  }
});


/* ===== STATUS UPDATE ===== */
/* ===== STATUS UPDATE ===== */
document.addEventListener("change", async (e) => {

  if (e.target.classList.contains("status-select")) {

    const id = e.target.dataset.id;
    const status = e.target.value;

    await updateDoc(doc(db, "orders", id), { status });

    showToast("Status updated");

    loadKPIs();
    renderOrders(); // ✅ THIS WAS MISSING
  }

});

/* ================= KPI ================= */
async function loadKPIs() {

  const productSnap = await getDocs(collection(db, "products"));
  const products = productSnap.docs.map(d => d.data());

  document.getElementById("kpiProducts").textContent = products.length;
  document.getElementById("kpiLowStock").textContent =
    products.filter(p => (p.stock ?? 0) < 5).length;

  const orderSnap = await getDocs(collection(db, "orders"));
  const orders = orderSnap.docs.map(d => d.data());

  document.getElementById("kpiOrders").textContent = orders.length;
  document.getElementById("kpiPending").textContent =
    orders.filter(o => o.status === "Pending").length;

  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById("kpiRevenue").textContent = `৳ ${revenue}`;
}

/* ================= CLOUDINARY ================= */
async function uploadToCloudinary(file) {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();
  if (!data.secure_url) throw new Error("Cloudinary upload failed");

  return data.secure_url;
}

/* ================= IMAGE PREVIEW ================= */
document.getElementById("pImageFile")
  ?.addEventListener("change", function () {

  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById("imagePreview");
    preview.src = e.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
});





