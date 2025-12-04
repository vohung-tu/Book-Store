import numpy as np
from pymongo import MongoClient
from scipy.sparse import coo_matrix
import implicit
import json
from collections import defaultdict

# ===============================
# 1. MONGO CONFIG
# ===============================
MONGO_URI = "mongodb+srv://hungtu:123456%40@bookstorepam.lzrno.mongodb.net/book_store_pam?retryWrites=true&w=majority&appName=BookstorePam"
DB_NAME = "book_store_pam"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

orders_col = db["orders"]
books_col = db["books"]

print("🔍 Loading MongoDB...")

# ===============================
# Load all valid books from DB
# ===============================
valid_books = set(str(b["_id"]) for b in books_col.find({}, {"_id": 1}))
print(f"✔ Valid books in DB: {len(valid_books)}")

# ===============================
# 2. Load interactions from Orders
# ===============================
user_ids = set()
book_ids = set()   # only books that appear in interactions
interactions = defaultdict(float)

print("📦 Loading interactions from Orders...")

for order in orders_col.find():
    uid = str(order.get("userId"))
    if not uid:
        continue

    for p in order.get("products", []):
        bid = str(p.get("book"))
        qty = p.get("quantity", 1)

        # ignore invalid books
        if bid not in valid_books:
            print(f"⚠️ Skip invalid bookId: {bid}")
            continue

        user_ids.add(uid)
        book_ids.add(bid)

        interactions[(uid, bid)] += 5 + np.log(1 + qty)

print(f"📌 Users: {len(user_ids)}, Books in interactions: {len(book_ids)}")

# ===============================
# 3. Category boost SAFE MODE
# ===============================
print("📚 Applying category implicit boost...")

cat_groups = {}  # {category: [bookIds]}

for b in books_col.find({}, {"_id": 1, "categoryName": 1}):
    bid = str(b["_id"])

    cat_raw = b.get("categoryName", "unknown")
    if isinstance(cat_raw, dict):
        cat_slug = cat_raw.get("slug") or cat_raw.get("name") or "unknown"
    else:
        cat_slug = cat_raw or "unknown"

    cat_groups.setdefault(cat_slug, []).append(bid)

# SAFE BOOST only for books already in interactions
for cat, bids in cat_groups.items():
    for uid in user_ids:
        for bid in bids:
            if bid in book_ids:  # only boost valid & interacted books
                interactions[(uid, bid)] += 0.5


# ===============================
# 4. Build matrix
# ===============================
print("🔧 Building matrix...")

user_list = sorted(list(user_ids))
book_list = sorted(list(book_ids))

user2idx = {u: i for i, u in enumerate(user_list)}
book2idx = {b: i for i, b in enumerate(book_list)}

rows, cols, values = [], [], []

for (u, b), w in interactions.items():
    rows.append(user2idx[u])
    cols.append(book2idx[b])
    values.append(w)

matrix = coo_matrix((values, (rows, cols)), shape=(len(user_list), len(book_list))).tocsr()

print("📊 Matrix shape:", matrix.shape)

# ===============================
# 5. Train ALS model
# ===============================
print("🚀 Training ALS User→Item...")

model = implicit.als.AlternatingLeastSquares(
    factors=64,
    regularization=0.1,
    iterations=25,
    use_gpu=False
)

model.fit(matrix)

# ===============================
# 6. Export full model
# ===============================
export = {
    "embedding_dim": model.item_factors.shape[1],
    "users": user_list,
    "books": book_list,
    "user_factors": model.user_factors.tolist(),
    "item_factors": model.item_factors.tolist()
}

with open("als_user_item_model.json", "w", encoding="utf8") as f:
    json.dump(export, f)

print("🎉 DONE! Saved als_user_item_model.json")
