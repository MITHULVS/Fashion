# mongodb.py - MongoDB connection and helper functions

from pymongo import MongoClient
from bson.objectid import ObjectId

# Connect to local MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Select the database
db = client["ecommerceDB"]

# Select the products collection
products_collection = db["products"]


def get_products_by_category(category):
    """Fetch all products from a specific category."""
    products = list(products_collection.find({"category": category}))
    # Convert ObjectId to string so it can be serialized to JSON
    for product in products:
        product["_id"] = str(product["_id"])
    return products


def add_product(data):
    """Insert a new product into the products collection."""
    result = products_collection.insert_one(data)
    return str(result.inserted_id)


def update_product(product_id, data):
    """Update an existing product by its ID."""
    result = products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": data}
    )
    return result.modified_count


def delete_product(product_id):
    """Delete a product by its ID."""
    result = products_collection.delete_one({"_id": ObjectId(product_id)})
    return result.deleted_count


def get_all_products():
    """Fetch all products from the collection."""
    products = list(products_collection.find())
    for product in products:
        product["_id"] = str(product["_id"])
    return products


# ── CART COLLECTION ──
cart_collection = db["carts"]


def save_cart(session_id, cart_items):
    """Save or update the cart for a session/user in MongoDB."""
    cart_collection.update_one(
        {"session_id": session_id},
        {"$set": {"session_id": session_id, "items": cart_items}},
        upsert=True  # Create if doesn't exist, update if it does
    )


def get_cart(session_id):
    """Fetch the saved cart for a session/user."""
    cart = cart_collection.find_one({"session_id": session_id})
    if cart:
        cart["_id"] = str(cart["_id"])
    return cart


def clear_cart(session_id):
    """Delete the cart for a session/user."""
    cart_collection.delete_one({"session_id": session_id})


# ── USERS COLLECTION ──
users_collection = db["users"]


def register_user(name, email, password_hash):
    """Insert a new user. Returns None if email already exists."""
    if users_collection.find_one({"email": email}):
        return None  # Email already registered
    result = users_collection.insert_one({
        "name": name,
        "email": email,
        "password": password_hash
    })
    return str(result.inserted_id)


def find_user_by_email(email):
    """Find a user document by email."""
    user = users_collection.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    return user