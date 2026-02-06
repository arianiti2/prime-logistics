const asyncHandler = require("express-async-handler");
const Customer = require("../models/Customer");
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/customers/');
    console.log('Upload directory:', uploadDir);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory:', uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let customerName = 'customer';
    try {
      if (req.body.customerData) {
        const data = JSON.parse(req.body.customerData);
        if (data.name) {
        
          customerName = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        }
      }
    } catch (error) {
      console.log('Could not parse customer name for filename');
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${customerName}-${timestamp}${path.extname(file.originalname)}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

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

const createCustomer = asyncHandler(async (req, res) => {

  let payload;
  let attachmentPath = null;
  let fileName = null;

  if (req.file) {
    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    try {
      payload = JSON.parse(req.body.customerData);
      attachmentPath = req.file.path;
      fileName = req.file.originalname;
      console.log('Parsed customer data:', payload);
    } catch (error) {
      console.error('Error parsing customerData:', error);
      res.status(400);
      throw new Error('Invalid customer data format');
    }
  } else {
    payload = req.body;
    console.log('Regular JSON payload:', payload);
  }

  if (!payload || !payload.name) {
    res.status(400);
    throw new Error('Customer name is required');
  }

  if (attachmentPath) {
    payload.attachmentPath = attachmentPath;
    payload.fileName = fileName;
    console.log('Added file info to payload:', { attachmentPath, fileName });
  }


  const customer = await Customer.create(payload);
  console.log('Customer created successfully:', customer._id);
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

  if (customer.attachmentPath && fs.existsSync(customer.attachmentPath)) {
    try {
      fs.unlinkSync(customer.attachmentPath);
    } catch (error) {
      console.log('Error deleting file:', error);
    }
  }

  res.json({ message: "Customer deleted" });
});

const downloadAttachment = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  if (!customer.attachmentPath || !fs.existsSync(customer.attachmentPath)) {
    res.status(404);
    throw new Error("File not found");
  }

  res.download(customer.attachmentPath, customer.fileName);
});

module.exports = { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  downloadAttachment,
  upload 
};
