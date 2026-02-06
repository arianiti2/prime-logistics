export interface Customer {
  _id?: string;
  customerId?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  shippingAddresses?: Array<{
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }>;
  dateDite?: Date | string;
  paymentTerms?: string;
  taxNumber?: string;
  preferredCurrency?: string;
  creditLimit?: number;
  customerType?: string;
  priority?: string;
  specialInstructions?: string;
  status?: string;
  attachmentPath?: string;
  fileName?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
