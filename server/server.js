const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.static(path.join(__dirname, "../public")));

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
  },
  {
    id: 4,
    name: "Rajasthan Exam Notes — PDF",
    cat: "Study Materials",
    price: 149,
    icon: "📚",
    description: "Digital study material. Sell only content you own or have permission to distribute."
  },
  {
    id: 5,
    name: "Creator E-book: Grow on YouTube",
    cat: "E-books",
    price: 199,
    icon: "📖",
    description: "A practical creator-focused digital guide."
  },
  {
    id: 6,
    name: "Instagram Reels Templates",
    cat: "Social Media",
    price: 199,
    icon: "📱",
    description: "Reusable social-video templates."
  },
  {
    id: 7,
    name: "Digital Marketing Mini Course",
    cat: "Courses",
    price: 499,
    icon: "💻",
    description: "A compact digital marketing course."
  }
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/orders", (req, res) => {
  const { email, items, coupon } = req.body || {};

  if (!email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({
      error: "Email and cart items are required."
    });
  }

  const subtotal = items.reduce(
    (s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1),
    0
  );

  const discount =
    coupon === "SAVE10" ? Math.round(subtotal * 0.10) : 0;

  const total = subtotal - discount;

  res.json({
    orderId: "DH-" + Date.now(),
    email,
    subtotal,
    discount,
    total,
    status: "PENDING_PAYMENT",
    message:
      "Order created. Connect your payment gateway here; verify payment server-side before releasing downloads."
  });
});

app.post("/api/admin/products", (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const { name, cat, price, description, icon = "📦" } = req.body || {};

  if (!name || !cat || !price) {
    return res.status(400).json({
      error: "name, category and price are required"
    });
  }

  const p = {
    id: Date.now(),
    name,
    cat,
    price: Number(price),
    description: description || "",
    icon
  };

  products.push(p);

  res.status(201).json(p);
});

app.post("/api/payment/webhook", (req, res) => {
  res.json({
    received: true,
    note: "Payment signature verification must be implemented for your chosen provider."
  });
});

app.get("/download/:token", (req, res) => {
  res.status(501).json({
    error:
      "Secure download is not active in this starter. Add private storage + signed expiring links after verified payment."
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DigitalHub running on port ${PORT}`);
});
