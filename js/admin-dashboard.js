import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

// 🔒 ADMIN PAGE PROTECTION
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

    const featuredImage =
      p.images?.[p.featuredIndex || 0] || "";

    list.innerHTML += `
      <div class="cart-item">
        <img src="${featuredImage}" class="cart-img">
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

/* ===== ADD / UPDATE PRODUCT ===== */
async function handleSubmit() {

  const id = editProductId.value;

  // 🔥 3 IMAGE FILE INPUTS
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

  if (imageUrls.length === 0) {
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
    featuredIndex: featuredIndex,
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

/* ===== RESET FORM ===== */
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

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
}
