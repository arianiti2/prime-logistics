const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// Get all products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get single product
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// Create product
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, price, quantity } = req.body;
  const product = await Product.create({ name, sku, price, quantity });
  res.status(201).json(product);
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ message: "Product deleted" });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
