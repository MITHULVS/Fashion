// script.js — LUXE E-Commerce Frontend Logic
// Handles: modals, product loading, cart management

// ─────────────────────────────────────────────
// CART STATE
// Cart is stored in memory (and persisted to localStorage)
// Each cart item: { id, name, price, quantity }
// ─────────────────────────────────────────────

let cart = JSON.parse(localStorage.getItem("luxe_cart") || "[]");

// Save cart to localStorage AND sync to MongoDB
function saveCart() {
  localStorage.setItem("luxe_cart", JSON.stringify(cart));
  updateCartCount();
  syncCartToServer(); // persist to MongoDB
}

// Sync full cart state to server (MongoDB)
async function syncCartToServer() {
  try {
    await fetch("/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart })
    });
  } catch (err) {
    console.warn("Cart sync failed:", err);
  }
}

// Load cart from MongoDB on page load (restores cart across sessions)
async function loadCartFromServer() {
  try {
    const res  = await fetch("/cart");
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      // Server cart takes priority (works across devices/tabs)
      cart = data.items;
      localStorage.setItem("luxe_cart", JSON.stringify(cart));
      updateCartCount();
    }
  } catch (err) {
    console.warn("Could not load cart from server, using localStorage.", err);
  }
}

// Update the cart count badge in the navbar
function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = total;
}

// ─────────────────────────────────────────────
// LOGIN / REGISTER MODAL
// ─────────────────────────────────────────────

const loginBtn     = document.getElementById("loginBtn");
const loginOverlay = document.getElementById("loginOverlay");
const closeLogin   = document.getElementById("closeLogin");

// Open modal
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    // If already logged in, clicking shows logout option
    if (loginBtn.dataset.loggedIn === "true") {
      handleLogout();
      return;
    }
    loginOverlay.classList.add("active");
  });
}

// Close modal
if (closeLogin) {
  closeLogin.addEventListener("click", () => loginOverlay.classList.remove("active"));
}

// Close on outside click
if (loginOverlay) {
  loginOverlay.addEventListener("click", (e) => {
    if (e.target === loginOverlay) loginOverlay.classList.remove("active");
  });
}

// Switch between Login and Register tabs
function switchTab(tab) {
  const loginForm    = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin     = document.getElementById("tabLogin");
  const tabRegister  = document.getElementById("tabRegister");
  const msgEl        = document.getElementById("loginMessage");

  msgEl.textContent = "";

  if (tab === "login") {
    loginForm.style.display    = "block";
    registerForm.style.display = "none";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
  } else {
    loginForm.style.display    = "none";
    registerForm.style.display = "block";
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
  }
}

// ── SIGN IN ──
const submitLogin = document.getElementById("submitLogin");
if (submitLogin) {
  submitLogin.addEventListener("click", async () => {
    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const msgEl    = document.getElementById("loginMessage");

    if (!email || !password) {
      showMessage(msgEl, "Please fill in all fields.", "error");
      return;
    }

    try {
      const res  = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(msgEl, `Welcome back, ${data.name}!`, "success");
        setLoggedIn(data.name);
        setTimeout(() => loginOverlay.classList.remove("active"), 1200);
      } else {
        showMessage(msgEl, data.error || "Login failed.", "error");
      }
    } catch (err) {
      showMessage(msgEl, "Network error. Please try again.", "error");
    }
  });
}

// ── REGISTER ──
const submitRegister = document.getElementById("submitRegister");
if (submitRegister) {
  submitRegister.addEventListener("click", async () => {
    const name     = document.getElementById("regName").value.trim();
    const email    = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const msgEl    = document.getElementById("loginMessage");

    if (!name || !email || !password) {
      showMessage(msgEl, "Please fill in all fields.", "error");
      return;
    }

    try {
      const res  = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(msgEl, `Account created! Welcome, ${data.name}!`, "success");
        setLoggedIn(data.name);
        setTimeout(() => loginOverlay.classList.remove("active"), 1200);
      } else {
        showMessage(msgEl, data.error || "Registration failed.", "error");
      }
    } catch (err) {
      showMessage(msgEl, "Network error. Please try again.", "error");
    }
  });
}

// ── LOGOUT ──
async function handleLogout() {
  if (!confirm("Are you sure you want to sign out?")) return;
  await fetch("/logout", { method: "POST" });
  setLoggedOut();
}

// Update nav button to show user name
function setLoggedIn(name) {
  if (!loginBtn) return;
  loginBtn.textContent        = `${name} (Sign Out)`;
  loginBtn.dataset.loggedIn   = "true";
  localStorage.setItem("luxe_user", name);
}

// Reset nav button
function setLoggedOut() {
  if (!loginBtn) return;
  loginBtn.textContent        = "Login";
  loginBtn.dataset.loggedIn   = "false";
  localStorage.removeItem("luxe_user");
}

// ─────────────────────────────────────────────
// CART MODAL
// ─────────────────────────────────────────────

const cartBtn     = document.getElementById("cartBtn");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart   = document.getElementById("closeCart");

// Open cart popup
if (cartBtn) {
  cartBtn.addEventListener("click", () => {
    renderCartModal();
    cartOverlay.classList.add("active");
  });
}

// Close cart popup
if (closeCart) {
  closeCart.addEventListener("click", () => {
    cartOverlay.classList.remove("active");
  });
}

// Close cart on outside click
if (cartOverlay) {
  cartOverlay.addEventListener("click", (e) => {
    if (e.target === cartOverlay) cartOverlay.classList.remove("active");
  });
}

// Checkout button (placeholder)
const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    alert("Proceeding to checkout! (Integrate payment gateway here)");
  });
}

// Render cart items inside the modal
function renderCartModal() {
  const container = document.getElementById("cartItems");
  const totalEl   = document.getElementById("cartTotal");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  let html  = "";
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">Qty: ${item.quantity} × ₹${item.price.toLocaleString()}</div>
        </div>
        <div class="cart-item-price">₹${subtotal.toLocaleString()}</div>
        <button class="btn-remove" onclick="removeFromCart(${index})" title="Remove">✕</button>
      </div>
    `;
  });

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = total.toLocaleString();
}

// Add item to cart
function addToCart(productId, name, price) {
  // Check if product already exists in cart
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    // Increase quantity
    existing.quantity += 1;
  } else {
    // Add new item
    cart.push({ id: productId, name, price, quantity: 1 });
  }

  saveCart();

  // Visual feedback
  showToast(`"${name}" added to cart`);
}

// Remove item from cart by index
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartModal(); // Re-render modal
}

// ─────────────────────────────────────────────
// PRODUCT LOADING (Homepage only)
// ─────────────────────────────────────────────

// Categories to load
const categories = ["men", "women", "shoes", "accessories"];

// Load products for each category on page load
async function loadAllProducts() {
  for (const category of categories) {
    await loadCategory(category);
  }
}

// Fetch and render products for one category
async function loadCategory(category) {
  const container = document.getElementById(`${category}-products`);
  if (!container) return; // Only runs on pages with these containers

  try {
    const res      = await fetch(`/products/${category}`);
    const products = await res.json();

    if (!res.ok || products.length === 0) {
      container.innerHTML = '<p class="no-products">No products in this category yet.</p>';
      return;
    }

    // Render each product as a card
    container.innerHTML = products.map(product => createProductCard(product)).join("");

  } catch (err) {
    console.error(`Failed to load ${category} products:`, err);
    container.innerHTML = '<p class="no-products">Failed to load products.</p>';
  }
}

// Create HTML for a single product card
function createProductCard(product) {
  // Fallback image if URL is empty
  const imgSrc = product.image || "https://via.placeholder.com/400x500?text=No+Image";

  return `
    <div class="product-card">
      <div class="product-image-wrap">
        <img src="${imgSrc}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'"/>
      </div>
      <div class="product-name">${product.name}</div>
      <div class="product-desc">${product.description}</div>
      <div class="product-price">₹${Number(product.price).toLocaleString()}</div>
      <button class="btn-cart"
        onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
        Add to Cart
      </button>
    </div>
  `;
}

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

// Show a status message inside a container element
function showMessage(el, text, type = "") {
  if (!el) return;
  el.textContent = text;
  el.className   = `form-message ${type}`;
}

// Show a brief toast notification
function showToast(message) {
  // Remove existing toast if present
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast   = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  // Inline toast styles (so no extra CSS is needed)
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "2rem",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#000",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    zIndex: "999",
    opacity: "0",
    transition: "opacity 0.3s ease"
  });

  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = "1"; });

  // Fade out and remove after 2.5s
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

// Run on page load
document.addEventListener("DOMContentLoaded", async () => {
  updateCartCount();

  // Load products only if we're on the homepage (sections exist)
  if (document.getElementById("men-products")) {
    loadAllProducts();
  }
});