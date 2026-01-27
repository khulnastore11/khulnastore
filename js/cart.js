// ================= LOAD CART =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ================= RENDER CART =================
function renderCart() {
  const container = document.getElementById("cartContainer");
  const footer = document.getElementById("cartFooter");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = `
      <div class="checkout-card">
        <p>Your cart is empty.</p>
        <a href="index.html" class="checkout-btn" style="margin-top:10px;">
          Go Shopping
        </a>
      </div>
    `;
    footer.style.display = "none";
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image || 'images/placeholder.png'}" class="cart-img">

      <div class="cart-info">
        <strong>${item.name}</strong>
        <small>${item.unit}</small>
        <small>৳ ${item.price}</small>

   <div class="qty-controls">
  <button onclick="decreaseQty(${index})">−</button>
  <span>${item.qty}</span>
  <button onclick="increaseQty(${index})">+</button>
</div>


      </div>

      <button class="remove-btn" onclick="removeItem(${index})">✕</button>
    </div>
  `).join("");

  footer.style.display = "flex";
  totalEl.textContent = "৳ " + getTotal(cart);
  
}

// ================= CART ACTIONS =================
function increaseQty(index) {
  const cart = getCart();
  cart[index].qty += 1;
  saveCart(cart);
  renderCart();
}

function decreaseQty(index) {
  const cart = getCart();
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }
  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

// ================= ADD TO CART (FROM INDEX) =================
window.handleAddToCart = function(btn, id, name, price, unit) {
  let cart = getCart();

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      unit,
      qty: 1
    });
  }

  saveCart(cart);

  // Visual feedback
  btn.textContent = "Added ✓";
  setTimeout(() => {
    btn.textContent = "Add to Cart";
  }, 1000);

  updateCartCount();
};

// ================= CART COUNT =================
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  const el = document.getElementById("cartCount");
  if (el) {
    el.textContent = count;
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount();
});
