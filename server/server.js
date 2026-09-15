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
    description: "Useful AI prompts for creators."
  },
  {
    id: 2,
    name: "YouTube Shorts Template Pack",
    cat: "Video Templates",
    price: 299,
    icon: "🎬",
    description: "Creative templates for YouTube Shorts."
  },
  {
    id: 3,
    name: "Canva Social Media Bundle",
    cat: "Canva Templates",
    price: 249,
    icon: "🎨",
    description: "Reusable social media templates."
  },
  {
    id: 4,
    name: "Rajasthan Exam Notes",
    cat: "Study Materials",
    price: 149,
    icon: "📚",
    description: "Original study material."
  },
  {
    id: 5,
    name: "Creator E-book",
    cat: "E-books",
    price: 199,
    icon: "📖",
    description: "A practical guide for digital creators."
  },
  {
    id: 6,
    name: "Digital Marketing Course",
    cat: "Courses",
    price: 499,
    icon: "💻",
    description: "Digital marketing learning material."
  }
];

app.post("/api/admin/login", (req, res) => {

  const { password } = req.body || {};

  if (
    password &&
    ADMIN_PASSWORD &&
    password === ADMIN_PASSWORD
  ) {
    return res.json({
      success: true
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid password"
  });

});

app.get("/api/products", (req, res) => {

  res.json(products);

});

function checkAdmin(req, res, next) {

  const adminKey = req.headers["x-admin-key"];

  if (
    !adminKey ||
    !ADMIN_PASSWORD ||
    adminKey !== ADMIN_PASSWORD
  ) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  next();

}

app.post("/api/admin/products", checkAdmin, (req, res) => {

  const {
    name,
    cat,
    price,
    icon = "📦",
    description = ""
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

    icon,

    description

  };

  products.push(product);

  res.status(201).json(product);

});

app.put("/api/admin/products/:id", checkAdmin, (req, res) => {

  const id = Number(req.params.id);

  const product = products.find(
    p => p.id === id
  );

  if (!product) {

    return res.status(404).json({
      error: "Product not found"
    });

  }

  const {
    name,
    cat,
    price,
    icon,
    description
  } = req.body || {};

  if (name) product.name = name;
  if (cat) product.cat = cat;
  if (price) product.price = Number(price);
  if (icon) product.icon = icon;
  if (description !== undefined) {
    product.description = description;
  }

  res.json(product);

});

app.delete("/api/admin/products/:id", checkAdmin, (req, res) => {

  const id = Number(req.params.id);

  const oldLength = products.length;

  products = products.filter(
    p => p.id !== id
  );

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

  const {
    email,
    items,
    coupon
  } = req.body || {};

  if (
    !email ||
    !Array.isArray(items) ||
    !items.length
  ) {

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
      ? Math.round(subtotal * 0.10)
      : 0;

  const total =
    subtotal - discount;

  res.json({

    orderId:
      "DH-" + Date.now(),

    email,

    subtotal,

    discount,

    total,

    status:
      "PENDING_PAYMENT",

    message:
      "Payment gateway integration is required before accepting real payments."

  });

});

app.post("/api/payment/webhook", (req, res) => {

  res.json({
    received: true,
    message:
      "Payment webhook placeholder."
  });

});

app.get("/download/:token", (req, res) => {

  res.status(501).json({

    error:
      "Secure download is not active yet."

  });

});

app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../public/index.html"
    )
  );

});

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `DigitalHub running on port ${PORT}`
    );

  }
);
