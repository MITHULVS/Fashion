# app.py - Flask backend for the e-commerce shopping cart system

from flask import Flask, request, jsonify, render_template, session
from mongodb import (
    get_products_by_category,
    add_product,
    update_product,
    delete_product,
    get_all_products,
    save_cart,
    get_cart,
    clear_cart,
    register_user,
    find_user_by_email
)
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Required for session management

# ─────────────────────────────────────────────
# PAGE ROUTES
# ─────────────────────────────────────────────

@app.route("/")
def index():
    """Render the main homepage."""
    return render_template("index.html")


@app.route("/admin")
def admin():
    """Render the admin panel."""
    return render_template("admin.html")


# ─────────────────────────────────────────────
# PRODUCT API ROUTES
# ─────────────────────────────────────────────

@app.route("/products/<category>", methods=["GET"])
def get_products(category):
    """Return all products of a given category."""
    products = get_products_by_category(category)
    return jsonify(products), 200


@app.route("/products", methods=["GET"])
def get_all():
    """Return all products (used by admin panel)."""
    products = get_all_products()
    return jsonify(products), 200


@app.route("/add-product", methods=["POST"])
def add():
    """Add a new product to MongoDB."""
    data = request.get_json()

    # Validate required fields
    required = ["name", "price", "description", "image", "stock", "category"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    # Convert price and stock to correct types
    data["price"] = float(data["price"])
    data["stock"] = int(data["stock"])

    product_id = add_product(data)
    return jsonify({"message": "Product added successfully", "id": product_id}), 201


@app.route("/update-product/<product_id>", methods=["PUT"])
def update(product_id):
    """Update an existing product by ID."""
    data = request.get_json()

    # Convert types if present
    if "price" in data:
        data["price"] = float(data["price"])
    if "stock" in data:
        data["stock"] = int(data["stock"])

    modified = update_product(product_id, data)
    if modified:
        return jsonify({"message": "Product updated successfully"}), 200
    else:
        return jsonify({"error": "Product not found or no changes made"}), 404


@app.route("/delete-product/<product_id>", methods=["DELETE"])
def delete(product_id):
    """Delete a product by ID."""
    deleted = delete_product(product_id)
    if deleted:
        return jsonify({"message": "Product deleted successfully"}), 200
    else:
        return jsonify({"error": "Product not found"}), 404


# ─────────────────────────────────────────────
# AUTH ROUTES — real register + login via MongoDB
# ─────────────────────────────────────────────

@app.route("/register", methods=["POST"])
def register():
    """Register a new user with hashed password stored in MongoDB."""
    data     = request.get_json()
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Basic validation
    if not name or not email or not password:
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    # Hash the password before storing
    password_hash = generate_password_hash(password)

    user_id = register_user(name, email, password_hash)
    if user_id is None:
        return jsonify({"error": "An account with this email already exists."}), 409

    # Log the user in immediately after registration
    session["user"]  = email
    session["name"]  = name
    return jsonify({"message": "Account created successfully!", "name": name, "email": email}), 201


@app.route("/login", methods=["POST"])
def login():
    """Authenticate a user against MongoDB."""
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = find_user_by_email(email)
    if not user:
        return jsonify({"error": "No account found with this email."}), 404

    # Verify hashed password
    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password."}), 401

    session["user"] = email
    session["name"] = user.get("name", "")
    return jsonify({"message": "Login successful", "name": user["name"], "email": email}), 200


@app.route("/logout", methods=["POST"])
def logout():
    """Clear the user session."""
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


# ─────────────────────────────────────────────
# CART ROUTES — stored in MongoDB
# ─────────────────────────────────────────────

def get_session_id():
    """Get or create a unique session ID for the visitor."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


@app.route("/cart", methods=["POST"])
def save_cart_route():
    """Save the full cart (array of items) to MongoDB."""
    data = request.get_json()
    cart_items = data.get("items", [])
    session_id = get_session_id()
    save_cart(session_id, cart_items)
    return jsonify({"message": "Cart saved", "session_id": session_id}), 200


@app.route("/cart", methods=["GET"])
def get_cart_route():
    """Return the saved cart for the current session."""
    session_id = get_session_id()
    cart = get_cart(session_id)
    if cart:
        return jsonify({"items": cart.get("items", [])}), 200
    return jsonify({"items": []}), 200


@app.route("/cart", methods=["DELETE"])
def clear_cart_route():
    """Clear the cart for the current session."""
    session_id = get_session_id()
    clear_cart(session_id)
    return jsonify({"message": "Cart cleared"}), 200


# ─────────────────────────────────────────────
# RUN THE APP
# ─────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)