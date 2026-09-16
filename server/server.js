const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.static(path.join(__dirname, "../public")));

/* =========================
   PDF UPLOAD SETUP
========================= */

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" +
      file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 20 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }

    cb(null, true);
  }
});

/* =========================
   PRODUCTS
========================= */

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

/* =========================
   ADMIN LOGIN
========================= */

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

/* =========================
   GET PRODUCTS
========================= */

app.get("/api/products", (req, res) => {
  res.json(products);
});

/* =========================
   ADMIN CHECK
========================= */

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

/* =========================
   PDF UPLOAD
========================= */

app.post(
  "/api/admin/upload-pdf",
  checkAdmin,
  upload.single("pdf"),
  (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        error: "PDF file is required."
      });

    }

    res.json({
      success: true,
      filename: req.file.filename,
      message: "PDF uploaded successfully."
    });

  }
);

/* =========================
   ADD PRODUCT
========================= */

app.post("/api/admin/products", checkAdmin, (req, res) => {

  const {
    name,
    cat,
    price,
    icon = "📦",
    description = "",
    pdf = ""
  } = req.body || {};

  if (!name || !cat || price === undefined) {

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

    description,

    pdf

  };

  products.push(product);

  res.status(201).json(product);

});

/* =========================
   EDIT PRODUCT
========================= */

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
    description,
    pdf
  } = req.body || {};

  if (name) product.name = name;
  if (cat) product.cat = cat;

  if (price !== undefined && price !== "") {
    product.price = Number(price);
  }

  if (icon) product.icon = icon;

  if (description !== undefined) {
    product.description = description;
  }

  if (pdf !== undefined) {
    product.pdf = pdf;
  }

  res.json(product);

});

/* =========================
   DELETE PRODUCT
========================= */

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

/* =========================
   ORDERS
========================= */

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

/* =========================
   PAYMENT WEBHOOK
========================= */

app.post("/api/payment/webhook", (req, res) => {

  res.json({
    received: true,
    message:
      "Payment webhook placeholder."
  });

});

/* =========================
   SECURE DOWNLOAD
========================= */

app.get("/download/:token", (req, res) => {

  res.status(501).json({

    error:
      "Secure download is not active yet."

  });

});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {

  if (err) {

    return res.status(400).json({
      error: err.message || "Upload error"
    });

  }

  next();

});

/* =========================
   FRONTEND
========================= */

app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../public/index.html"
    )
  );

});

/* =========================
   SERVER
========================= */

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
