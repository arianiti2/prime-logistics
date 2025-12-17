const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");

// Get all customers
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

// Get customer by ID
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json(customer);
});

// Create customer
const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  const customer = await Customer.create({ name, email, phone, address });
  res.status(201).json(customer);
});

// Update customer
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json(customer);
});

// Delete customer
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json({ message: "Customer deleted" });
});

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
