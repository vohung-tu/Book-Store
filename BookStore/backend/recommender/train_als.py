import numpy as np
from pymongo import MongoClient
from scipy.sparse import coo_matrix
import implicit
import json
from collections import defaultdict

# ===============================
# 1. MONGO ATLAS CONFIG
# ===============================
MONGO_URI = "mongodb+srv://hungtu:123456%40@bookstorepam.lzrno.mongodb.net/book_store_pam?retryWrites=true&w=majority&appName=BookstorePam"
DB_NAME = "book_store_pam"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

orders_col = db["orders"]
books_col = db["books"]

print("🔍 Đang load dữ liệu từ MongoDB Atlas...")

# ===============================
# 2. Load dữ liệu từ Orders
# ===============================
user_ids = set()
book_ids = set()
interactions = defaultdict(float)

print("📦 Load interactions từ Orders...")

for order in orders_col.find():
    user = order.get("userId")
    if not user:
        continue

    uid = str(user)
    products = order.get("products", [])

    for p in products:
        book = p.get("book")
        qty = p.get("quantity", 1)

        if not book:
            continue

        bid = str(book)

        user_ids.add(uid)
        book_ids.add(bid)

        # Trọng số mạnh cho hành vi mua → w = 5 + log(qty)
        interactions[(uid, bid)] += 5 + np.log(1 + qty)

print(f"📌 Users từ Orders: {len(user_ids)}, Books từ Orders: {len(book_ids)}, Interactions: {len(interactions)}")

# ===============================
# 3. Implicit theo CATEGORY
# ===============================
print("📚 Thêm implicit interactions theo CATEGORY...")

book_docs = list(books_col.find({}, {"_id": 1, "categoryName": 1}))
cat_groups = {}

for b in book_docs:
    bid = str(b["_id"])
    cat_raw = b.get("categoryName", {})

    # --- CASE 1: categoryName là string ---
    if isinstance(cat_raw, str):
        cat_slug = cat_raw.strip()

    # --- CASE 2: categoryName là object { slug, name } ---
    elif isinstance(cat_raw, dict):
        cat_slug = cat_raw.get("slug") or cat_raw.get("name") or "unknown"

    else:
        cat_slug = "unknown"

    # đảm bảo có dữ liệu
    if not cat_slug or cat_slug == "":
        cat_slug = "unknown"

    book_ids.add(bid)
    cat_groups.setdefault(cat_slug, []).append(bid)

# Tạo implicit interaction nhẹ theo category
for cat, bids in cat_groups.items():
    for uid in user_ids:
        for bid in bids:
            interactions[(uid, bid)] += 1.0  # implicit similarity

# ===============================
# 4. Chuẩn hóa dữ liệu train
# ===============================
if not interactions:
    raise RuntimeError("❌ Không có interaction nào! Có thể Orders rỗng.")

user_list = sorted(list(user_ids))
book_list = sorted(list(book_ids))

user2idx = {u: i for i, u in enumerate(user_list)}
book2idx = {b: i for i, b in enumerate(book_list)}

rows, cols, data = [], [], []

for (u, b), w in interactions.items():
    rows.append(user2idx[u])
    cols.append(book2idx[b])
    data.append(w)

matrix = coo_matrix(
    (data, (rows, cols)),
    shape=(len(user_list), len(book_list)),
    dtype=np.float32
).tocsr()

print("📊 Matrix shape:", matrix.shape)

# ===============================
# 5. Train ALS
# ===============================
print("🚀 Đang train ALS...")

model = implicit.als.AlternatingLeastSquares(
    factors=64,
    regularization=0.1,
    iterations=25,
    use_gpu=False
)

model.fit(matrix)

print("✨ Train xong!")

item_factors = model.item_factors

# ===============================
# 6. Export embeddings
# ===============================
export = {
    "embedding_dim": item_factors.shape[1],
    "embeddings": {}
}

for b in book_list:
    idx = book2idx[b]
    export["embeddings"][b] = item_factors[idx].tolist()

with open("als_item_embeddings.json", "w", encoding="utf8") as f:
    json.dump(export, f)

print("🎉 DONE! Đã export als_item_embeddings.json")
