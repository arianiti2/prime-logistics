const mongoose = require("mongoose");

const customerSchema = mongoose.Schema(
  {
    customerId: { type: String },
    name: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String },
    alternatePhone: { type: String },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String }
    },
    shippingAddresses: [
      {
        label: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
        country: { type: String }
      }
    ],
    
    paymentTerms: { type: String, default: 'Net 30' },
    taxNumber: { type: String },
    preferredCurrency: { type: String, default: 'USD' },
    creditLimit: { type: Number, default: 0 },
    customerType: { type: String, default: 'Company' },
    priority: { type: String, default: 'Medium' },
    specialInstructions: { type: String },
    status: { type: String, default: 'Active' },
    registrationDate: { type: Date, default: Date.now },
    attachmentPath: { type: String },
    fileName: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
