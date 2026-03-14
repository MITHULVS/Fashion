// admin.js — Admin Panel Logic
// Handles: product CRUD operations, table rendering, form management

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let allProducts    = [];      // All products from DB
let deleteTargetId = null;    // ID of product pending deletion

// ─────────────────────────────────────────────
// FETCH AND RENDER ALL PRODUCTS
// ─────────────────────────────────────────────

async function loadAllAdminProducts() {
  try {
    const res      = await fetch("/products");
    allProducts    = await res.json();
    renderProductsTable(allProducts);
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

// Render product rows in the admin table
function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:2rem;color:#999;">
          No products found. Add one using the form.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr data-id="${p._id}">
      <td>
        <img src="${p.image || ''}"
             alt="${p.name}"
             onerror="this.style.background='#eee';this.style.display='block'"/>
      </td>
      <td><strong>${p.name}</strong></td>
      <td style="text-transform:capitalize;">${p.category}</td>
      <td>₹${Number(p.price).toLocaleString()}</td>
      <td>${p.stock}</td>
      <td>
        <div class="table-actions">
          <button class="btn-sm" onclick="startEdit('${p._id}')">Edit</button>
          <button class="btn-sm btn-ghost" onclick="openDeleteModal('${p._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ─────────────────────────────────────────────
// ADD PRODUCT
// ─────────────────────────────────────────────

document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const editId = document.getElementById("editProductId").value;

  // If editing, call update instead
  if (editId) {
    updateProduct(editId);
    return;
  }

  // Gather form data
  const data = getFormData();
  if (!data) return; // Validation failed

  const msgEl = document.getElementById("formMessage");

  try {
    const res  = await fetch("/add-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (res.ok) {
      showMessage(msgEl, "Product added successfully!", "success");
      resetForm();
      loadAllAdminProducts(); // Refresh table
    } else {
      showMessage(msgEl, json.error || "Failed to add product.", "error");
    }
  } catch (err) {
    showMessage(msgEl, "Network error. Please try again.", "error");
  }
});

// ─────────────────────────────────────────────
// EDIT PRODUCT — populate form
// ─────────────────────────────────────────────

function startEdit(productId) {
  // Find product in local data
  const product = allProducts.find(p => p._id === productId);
  if (!product) return;

  // Fill form
  document.getElementById("editProductId").value   = product._id;
  document.getElementById("productName").value     = product.name;
  document.getElementById("productPrice").value    = product.price;
  document.getElementById("productDesc").value     = product.description;
  document.getElementById("productImage").value    = product.image;
  document.getElementById("productStock").value    = product.stock;
  document.getElementById("productCategory").value = product.category;

  // Update UI
  document.getElementById("formTitle").textContent    = "Edit Product";
  document.getElementById("saveProductBtn").textContent = "Update Product";
  document.getElementById("cancelEditBtn").style.display = "block";

  // Scroll to form
  document.querySelector(".admin-form-panel").scrollIntoView({ behavior: "smooth" });
}

// ─────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────

async function updateProduct(productId) {
  const data  = getFormData();
  if (!data) return;

  const msgEl = document.getElementById("formMessage");

  try {
    const res  = await fetch(`/update-product/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (res.ok) {
      showMessage(msgEl, "Product updated successfully!", "success");
      resetForm();
      loadAllAdminProducts();
    } else {
      showMessage(msgEl, json.error || "Update failed.", "error");
    }
  } catch (err) {
    showMessage(msgEl, "Network error. Please try again.", "error");
  }
}

// Cancel edit mode
document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

// ─────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────

// Open confirmation modal
function openDeleteModal(productId) {
  deleteTargetId = productId;
  document.getElementById("deleteOverlay").classList.add("active");
}

// Confirm delete
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  if (!deleteTargetId) return;

  try {
    const res  = await fetch(`/delete-product/${deleteTargetId}`, { method: "DELETE" });
    const json = await res.json();

    if (res.ok) {
      closeDeleteModal();
      loadAllAdminProducts();
    } else {
      alert(json.error || "Failed to delete product.");
    }
  } catch (err) {
    alert("Network error. Please try again.");
  }
});

// Close delete modal
document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById("deleteOverlay").classList.remove("active");
}

// Close delete modal on outside click
document.getElementById("deleteOverlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("deleteOverlay")) closeDeleteModal();
});

// ─────────────────────────────────────────────
// REFRESH BUTTON
// ─────────────────────────────────────────────

document.getElementById("refreshBtn").addEventListener("click", loadAllAdminProducts);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Collect and validate form data
function getFormData() {
  const name     = document.getElementById("productName").value.trim();
  const price    = document.getElementById("productPrice").value.trim();
  const desc     = document.getElementById("productDesc").value.trim();
  const image    = document.getElementById("productImage").value.trim();
  const stock    = document.getElementById("productStock").value.trim();
  const category = document.getElementById("productCategory").value;

  const msgEl = document.getElementById("formMessage");

  // Basic validation
  if (!name || !price || !desc || !image || !stock || !category) {
    showMessage(msgEl, "Please fill in all fields.", "error");
    return null;
  }

  return { name, price: parseFloat(price), description: desc, image, stock: parseInt(stock), category };
}

// Reset form to default state
function resetForm() {
  document.getElementById("editProductId").value       = "";
  document.getElementById("productName").value         = "";
  document.getElementById("productPrice").value        = "";
  document.getElementById("productDesc").value         = "";
  document.getElementById("productImage").value        = "";
  document.getElementById("productStock").value        = "";
  document.getElementById("productCategory").value     = "";
  document.getElementById("formTitle").textContent     = "Add New Product";
  document.getElementById("saveProductBtn").textContent = "Add Product";
  document.getElementById("cancelEditBtn").style.display = "none";
  document.getElementById("formMessage").textContent   = "";
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadAllAdminProducts();
});