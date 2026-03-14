# Fashion Store (Flask + MongoDB)

A simple e-commerce demo built with Flask (Python) that supports:

- Serving a homepage and admin dashboard.
- CRUD operations for products via a REST API.
- Basic login flow with hard-coded credentials.
- Cart item logging (client-side cart stored in browser).

---

## 🔥 Getting Started

### 1) Prerequisites

- Python 3.10+ (recommended)
- MongoDB (local or remote)

### 2) Install dependencies

From the project root (where `app.py` lives):

```bash
python -m pip install -r requirements.txt
```

> If the project does not include a `requirements.txt`, install Flask and PyMongo (or whatever driver you use) manually:
>
> ```bash
> python -m pip install flask pymongo
> ```

### 3) Configure MongoDB (optional)

This project uses `mongodb.py` to connect to MongoDB. Update it to point at your MongoDB connection string.

### 4) Run the app

```bash
python app.py
```

Then open:

- `http://localhost:5000/` → customer storefront UI
- `http://localhost:5000/admin` → admin dashboard

---

## 📦 Project Structure

- `app.py` — Flask HTTP server and API routes
- `mongodb.py` — MongoDB helper functions (CRUD operations)
- `templates/` — HTML templates for the frontend
- `static/` — JS/CSS assets for the frontend

---

## 🛒 API Endpoints

### Product APIs

- `GET /products/<category>` — returns products in a category
- `GET /products` — returns all products (admin use)
- `POST /add-product` — add a product
- `PUT /update-product/<product_id>` — update a product by ID
- `DELETE /delete-product/<product_id>` — delete a product by ID

> `POST /add-product` expects JSON with: `name`, `price`, `description`, `image`, `stock`, `category`.

### Auth (demo)

- `POST /login` — log in with hard-coded credentials (demo only)

Example request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Cart (optional logging)

- `POST /cart` — receives cart item data (cart state is managed client-side)

---

## ✅ Notes / Next Improvements

- Replace hard-coded login with a real user database.
- Add input validation and authentication.
- Persist cart server-side for logged-in users.
- Add error handling for DB issues.

---

## 🎯 Quick Tips

- Keep `app.secret_key` secret in production (use env vars).
- Run Flask in development mode by setting:

```bash
set FLASK_ENV=development
```

---

Happy hacking! 👕