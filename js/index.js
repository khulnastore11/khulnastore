import { db } from "./firebase.js";
import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const orderSearchBtn = document.getElementById("orderSearchBtn");
const orderSearchInput = document.getElementById("orderSearchInput");
const modal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModal");
const modalOverlay = document.getElementById("modalOverlay");
const toast = document.getElementById("toast");
const cartCountEl = document.getElementById("cartCount");

let products = [];

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));

    products = snapshot.docs.map(doc => ({
      id: doc.id,
      stock: 0, // fallback if missing
      ...doc.data()
    }));

    renderProducts(products);

  } catch (err) {
    container.innerHTML = "<p>Failed to load products.</p>";
  }
}

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  if (!list.length) {
    container.innerHTML = "<p>No products available.</p>";
    return;
  }

  container.innerHTML = list.map(p => {

    const isAvailable = p.stock > 0;

    return `
      <div class="product-card ${!isAvailable ? "out-stock" : ""}" data-id="${p.id}">
        
        <div class="stock-badge ${isAvailable ? "in" : "out"}">
          ${isAvailable ? "In Stock" : "Out of Stock"}
        </div>

        const featuredImage =
  p.images?.[p.featuredIndex || 0] || "images/placeholder.png";
<img src="${featuredImage}">


        <div class="card-body">
          <h4>${p.name}</h4>
          <p class="unit">${p.unit}</p>
          <div class="price">৳ ${p.price}</div>

          <button class="add-btn" ${!isAvailable ? "disabled" : ""}>
            ${isAvailable ? "Add to Cart" : "Unavailable"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ================= PRODUCT CLICK =================
container.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = card.dataset.id;
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (e.target.classList.contains("add-btn")) {
    e.stopPropagation();

    if (product.stock <= 0) {
      showToast("Product is out of stock");
      return;
    }

    handleCardAdd(e.target, product);
  } else {
    openModal(product);
  }
});

// ================= ADD TO CART =================
function handleCardAdd(button, product) {

  if (product.stock <= 0) {
    showToast("Product is out of stock");
    return;
  }

  addToCart(product);

  button.textContent = "✓ Added";
  button.classList.add("added-state");

  setTimeout(() => {
    button.textContent = "Go to Checkout";
    button.onclick = () => window.location.href = "checkout.html";
  }, 1000);
}

function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: product.image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast("Added to cart");
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = count;
}

// ================= MODAL =================
function openModal(product) {

  const isAvailable = product.stock > 0;

  modalContent.innerHTML = `
    <img src="${product.image}">
    <h3>${product.name}</h3>

    <div class="modal-stock ${isAvailable ? "in" : "out"}">
      ${isAvailable ? "In Stock" : "Out of Stock"}
    </div>

    <p>${product.desc || "No description available."}</p>
    <div class="modal-price">৳ ${product.price}</div>

    <div class="modal-actions">
      <button 
        class="add-main-btn" 
        id="modalAddBtn"
        ${!isAvailable ? "disabled" : ""}
      >
        ${isAvailable ? "Add to Cart" : "Unavailable"}
      </button>

      <a href="checkout.html"
         class="go-checkout-btn"
         id="modalCheckoutBtn"
         style="display:none;">
         Go to Checkout →
      </a>
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  const addBtn = document.getElementById("modalAddBtn");
  const checkoutBtn = document.getElementById("modalCheckoutBtn");

  if (isAvailable) {
    addBtn.addEventListener("click", () => {
      addToCart(product);

      addBtn.textContent = "✓ Added";
      addBtn.classList.add("added-state");

      checkoutBtn.style.display = "block";
    });
  }
}

function closeModal() {
  modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

closeModalBtn?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", closeModal);

// ================= SEARCH =================
searchInput?.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value)
  );
  renderProducts(filtered);
});

// ================= ORDER SEARCH =================
orderSearchBtn?.addEventListener("click", () => {
  const orderId = orderSearchInput?.value.trim();
  if (!orderId) return;

  window.location.href =
    `order-status.html?orderId=${orderId}`;
});

// ================= TOAST =================
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ================= NAV =================
const menuToggle = document.getElementById("menuToggle");
const navWrapper = document.getElementById("navWrapper");
const navBackdrop = document.getElementById("navBackdrop");

if (menuToggle && navWrapper) {

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menuToggle.classList.toggle("active");
    navWrapper.classList.toggle("open");
  });

  navBackdrop?.addEventListener("click", closeNav);

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#navDropdown") &&
        !e.target.closest("#menuToggle")) {
      closeNav();
    }
  });

  function closeNav() {
    menuToggle.classList.remove("active");
    navWrapper.classList.remove("open");
  }
}

// ================= INIT =================
updateCartCount();
loadProducts();

