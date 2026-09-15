const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.static(path.join(__dirname, "../public")));

let products = [
  {
    id: 1,
    name: "AI Prompt Pack — 1000 Prompts",
    cat: "AI Prompts",
    price: 199,
    icon: "🤖",
    description: "A starter collection of useful AI prompts for creators."
  },
  {
    id: 2,
    name: "YouTube Shorts Template Pack",
    cat: "Video Templates",
    price: 299,
    icon: "🎬",
    description: "Editable short-video template ideas for creators."
  },
  {
    id: 3,
    name: "Canva Social Media Bundle",
    cat: "Canva Templates",
    price: 249,
    icon: "🎨",
    description: "Social media design templates for posts and reels."
  }
];

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};

  if (password && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.status(401).json({
    success: false,
    message: "Invalid password"
  });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/admin/products", (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const {
    name,
    cat,
    price,
    description,
    icon = "📦"
  } = req.body || {};

  if (!name || !cat || !price) {
    return res.status(400).json({
      error: "name, category and price are required"
    });
  }

  const product = {
    id: Date.now(),
    name,
    cat,
    price: Number(price),
    description: description || "",
    icon
  };

  products.push(product);

  res.status(201).json(product);
});

app.delete("/api/admin/products/:id", (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const id = Number(req.params.id);

  const oldLength = products.length;

  products = products.filter(product => product.id !== id);

  if (products.length === oldLength) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  res.json({
    success: true,
    message: "Product deleted"
  });
});

app.post("/api/orders", (req, res) => {
  const { email, items, coupon } = req.body || {};

  if (!email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({
      error: "Email and cart items are required."
    });
  }

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
      (Number(item.qty) || 1),
    0
  );

  const discount =
    coupon === "SAVE10"
      ? Math.round(subtotal * 0.1)
      : 0;

  const total = subtotal - discount;

  res.json({
    orderId: "DH-" + Date.now(),
    email,
    subtotal,
    discount,
    total,
    status: "PENDING_PAYMENT",
    message: "Payment gateway will be connected next."
  });
});

app.post("/api/payment/webhook", (req, res) => {
  res.json({
    received: true
  });
});

app.get("/download/:token", (req, res) => {
  res.status(501).json({
    error: "Secure download is not active yet."
  });
});

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/index.html")
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `DigitalHub running on port ${PORT}`
  );
});
