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

       <img src="${p.images?.[p.featuredIndex || 0]}" alt="${p.name}">


        <div class="card-body">
          <h4>${p.name}</h4>
          <p class="unit">${p.unit}</p>
          <div class="price">৳ ${p.price}</div>

         <div class="card-actions">
  <button class="add-btn" ${!isAvailable ? "disabled" : ""}>
    ${isAvailable ? "Add to Cart" : "Unavailable"}
  </button>

  <button class="buy-btn" ${!isAvailable ? "disabled" : ""}>
    Buy Now
  </button>
</div>

        </div>
      </div>
    `;
  }).join("");
}

container.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = card.dataset.id;
  const product = products.find(p => p.id === id);
  if (!product) return;

  // ADD TO CART
  if (e.target.classList.contains("add-btn")) {
    e.stopPropagation();

    if (product.stock <= 0) {
      showToast("Product is out of stock");
      return;
    }

    handleCardAdd(e.target, product);
  }

  // BUY NOW
  else if (e.target.classList.contains("buy-btn")) {
    e.stopPropagation();

    if (product.stock <= 0) {
      showToast("Product is out of stock");
      return;
    }

    handleBuyNow(product);
  }

  // OPEN MODAL
  else {
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
  image: product.images?.[product.featuredIndex || 0] || product.image,
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
function handleBuyNow(product) {

  // Clear cart first (optional but recommended)
  localStorage.removeItem("cart");

  addToCart(product);

  window.location.href = "checkout.html";
}

function openModal(product) {

  const images = product.images?.length
    ? product.images
    : [product.image]; // fallback for old products

  let currentIndex = product.featuredIndex || 0;

  modalContent.innerHTML = `
    <div class="modal-slider">

      <div class="slider-viewport">
        <div class="slider-track">
          ${images.map(img => `
            <img src="${img}" class="slide">
          `).join("")}
        </div>
      </div>

      ${images.length > 1 ? `
        <button class="slider-btn prev-btn">‹</button>
        <button class="slider-btn next-btn">›</button>
      ` : ""}

      <div class="slider-dots">
        ${images.map((_, i) => `
          <span class="dot ${i === currentIndex ? "active" : ""}" 
                data-index="${i}"></span>
        `).join("")}
      </div>
    </div>

    <h3>${product.name}</h3>
    <p>${product.desc || "No description available."}</p>
    <div class="modal-price">৳ ${product.price}</div>

    <div class="modal-actions">
      <button class="add-main-btn" id="modalAddBtn">
        Add to Cart
      </button>

      <button class="buy-now-btn" id="modalBuyBtn">
        Buy Now
      </button>
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";

  const track = document.querySelector(".slider-track");
  const dots = document.querySelectorAll(".dot");

  function updateSlider(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove("active"));
    dots[index]?.classList.add("active");
    currentIndex = index;
  }

  // Initial position
  updateSlider(currentIndex);

  // Arrow buttons
  document.querySelector(".next-btn")?.addEventListener("click", () => {
    const next = (currentIndex + 1) % images.length;
    updateSlider(next);
  });

  document.querySelector(".prev-btn")?.addEventListener("click", () => {
    const prev = (currentIndex - 1 + images.length) % images.length;
    updateSlider(prev);
  });

  // Dots
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      updateSlider(Number(dot.dataset.index));
    });
  });

  // Swipe Support (Smooth)
  const viewport = document.querySelector(".slider-viewport");
  let startX = 0;
  let isDragging = false;

  viewport.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  viewport.addEventListener("touchend", (e) => {
    if (!isDragging) return;

    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        updateSlider((currentIndex + 1) % images.length);
      } else {
        updateSlider((currentIndex - 1 + images.length) % images.length);
      }
    }

    isDragging = false;
  });

  // Add to cart
 const modalAddBtn = document.getElementById("modalAddBtn");

modalAddBtn.onclick = () => {

  addToCart(product);

  modalAddBtn.textContent = "✓ Added";
  modalAddBtn.classList.add("added-state");

  setTimeout(() => {
    modalAddBtn.textContent = "Go to Checkout";
    modalAddBtn.classList.remove("added-state");

    modalAddBtn.onclick = () => {
      window.location.href = "checkout.html";
    };

  }, 1000);
};


  // Buy now
  document.getElementById("modalBuyBtn").onclick = () => {
    addToCart(product);
    window.location.href = "checkout.html";
  };
}



function closeModal() {
  modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

closeModalBtn?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", closeModal);

// ================= SEARCH =================
searchInput?.addEventListener("keyup", (e) => {

  const value = searchInput.value.trim();

  // If user presses ENTER
  if (e.key === "Enter") {

    // Detect order ID pattern (customize if needed)
    const isOrderId =
      value.startsWith("KS-") ||
      /^[0-9]{4,10}$/.test(value);

    if (isOrderId) {
      window.location.href =
        `order-status.html?orderId=${value}`;
      return;
    }
  }

  // Otherwise normal product search
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value.toLowerCase())
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
