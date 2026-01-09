import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule, MatDividerModule
  ],
  templateUrl: './customers.html'
})
export class Customers {
  private fb = inject(FormBuilder);
  
  
  customers = signal<any[]>([]);


  customerForm = this.fb.group({
    customerId: [''],
    name: ['', Validators.required],
    contactPerson: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    alternatePhone: [''],
    billingAddress: this.fb.group({
      street: [''],
      city: [''],
      state: [''],
      zip: [''],
      country: ['']
    }),
    shippingAddresses: this.fb.array([]), 
    paymentTerms: ['Net 30'],
    taxNumber: [''],
    preferredCurrency: ['USD'],
    creditLimit: [0],
    customerType: ['Company'],
    priority: ['Medium'],
    specialInstructions: [''],
    status: ['Active']
  });

  get shippingAddresses() {
    return this.customerForm.controls['shippingAddresses'] as FormArray;
  }

  addShippingAddress() {
    const addressGroup = this.fb.group({
      label: ['', Validators.required],
      street: [''],
      city: [''],
      state: [''],
      zip: [''],
      country: ['']
    });
    this.shippingAddresses.push(addressGroup);
  }

  removeShippingAddress(index: number) {
    this.shippingAddresses.removeAt(index);
  }

  onSubmit() {
    if (this.customerForm.valid) {
      const payload = {
        ...this.customerForm.getRawValue(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'currentUserId'
      };
      
      this.customers.update(list => [payload, ...list]);
      this.customerForm.reset({ status: 'Active', preferredCurrency: 'USD', paymentTerms: 'Net 30' });
      this.shippingAddresses.clear();
    }
  }
}