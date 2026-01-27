import { getAuth, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin-login.html";
  }
});

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

/* ================= CLOUDINARY ================= */
const CLOUD_NAME = "dc79ukf7s";
const UPLOAD_PRESET = "khulna-sign";

/* ================= DOM ELEMENTS ================= */
const editProductId = document.getElementById("editProductId");
const pName = document.getElementById("pName");
const pPrice = document.getElementById("pPrice");
const pUnit = document.getElementById("pUnit");
const pCategory = document.getElementById("pCategory");
const pDesc = document.getElementById("pDesc");
const pStock = document.getElementById("pStock");
const addProductBtn = document.getElementById("addProductBtn");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderOrders();
  loadKPIs();

  addProductBtn?.addEventListener("click", handleSubmit);
  document.getElementById("cancelEditBtn")
    ?.addEventListener("click", resetForm);
});

/* ================= TOAST ================= */
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

/* ===================================================== */
/* ================= PRODUCTS =========================== */
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

    const featured =
      p.images?.[p.featuredIndex || 0] || "";

    list.innerHTML += `
      <div class="cart-item">
        <img src="${featured}" class="cart-img">
        <div class="cart-info">
          <strong>${p.name}</strong>
          <small>${p.unit} • ৳ ${p.price}</small>
          <small>Stock: ${p.stock ?? 0}</small>
        </div>
        <div style="display:flex;gap:8px">
          <button class="edit-btn" data-id="${id}">✏️</button>
          <button class="remove-btn" data-id="${id}">✕</button>
        </div>
      </div>
    `;
  });
}

/* ================= EDIT + DELETE ================= */

document.addEventListener("click", async (e) => {

  // EDIT
  if (e.target.classList.contains("edit-btn")) {

    const id = e.target.dataset.id;
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;

    const product = snap.data();

    editProductId.value = id;
    pName.value = product.name;
    pPrice.value = product.price;
    pUnit.value = product.unit;
    pCategory.value = product.category || "";
    pDesc.value = product.desc || "";
    pStock.value = product.stock ?? 0;

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
});

/* ================= ADD / UPDATE ================= */

async function handleSubmit() {

  const id = editProductId.value;

  const imageFiles = [
    document.getElementById("pImageFile1")?.files[0],
    document.getElementById("pImageFile2")?.files[0],
    document.getElementById("pImageFile3")?.files[0]
  ];

  let imageUrls = [];

  for (let file of imageFiles) {
    if (file) {
      showToast("Uploading image...");
      const url = await uploadToCloudinary(file);
      imageUrls.push(url);
    }
  }

  if (!id && imageUrls.length === 0) {
    showToast("Upload at least 1 image");
    return;
  }

  const featuredIndex =
    Number(document.getElementById("featuredIndex")?.value || 0);

  const data = {
    name: pName.value.trim(),
    price: Number(pPrice.value),
    unit: pUnit.value.trim(),
    images: imageUrls,
    featuredIndex,
    category: pCategory.value.trim(),
    desc: pDesc.value.trim(),
    stock: Number(pStock.value) || 0
  };

  if (!data.name || !data.price || !data.unit) {
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

/* ================= RESET ================= */

function resetForm() {

  editProductId.value = "";
  pName.value = "";
  pPrice.value = "";
  pUnit.value = "";
  pCategory.value = "";
  pDesc.value = "";
  pStock.value = "";

  document.getElementById("pImageFile1").value = "";
  document.getElementById("pImageFile2").value = "";
  document.getElementById("pImageFile3").value = "";

  addProductBtn.textContent = "Add Product";
  document.getElementById("cancelEditBtn").style.display = "none";
}

/* ===================================================== */
/* ================= ORDERS ============================= */
/* ===================================================== */

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

  snapshot.forEach(docSnap => {

    const o = docSnap.data();
    const id = docSnap.id;

    list.innerHTML += `
      <div class="cart-item" style="flex-direction:column">
        <strong>Public ID:</strong> ${o.publicId || "-"}<br>
        <strong>Status:</strong> ${o.status || "Pending"}<br>
        <strong>Name:</strong> ${o.customer?.firstName || ""} ${o.customer?.lastName || ""}<br>
        <strong>Phone:</strong> ${o.customer?.phone || "-"}<br>
        <strong>Total:</strong> ৳ ${o.total || 0}
      </div>
    `;
  });
}

/* ================= KPI ================= */

async function loadKPIs() {

  const productSnap = await getDocs(collection(db, "products"));
  const orderSnap = await getDocs(collection(db, "orders"));

  const products = productSnap.docs.map(d => d.data());
  const orders = orderSnap.docs.map(d => d.data());

  document.getElementById("kpiProducts").textContent = products.length;
  document.getElementById("kpiOrders").textContent = orders.length;

  const revenue = orders.reduce((sum, o) =>
    sum + (o.total || 0), 0);

  document.getElementById("kpiRevenue").textContent = `৳ ${revenue}`;
}

/* ================= CLOUDINARY ================= */

async function uploadToCloudinary(file) {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
}
