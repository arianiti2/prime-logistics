import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { CustomersService } from '../../services/customers.service';
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
export class Customers implements OnInit{
  private fb = inject(FormBuilder);
  private customersService = inject(CustomersService);
  
  
  customers = signal<any[]>([]);

  ngOnInit(): void {
    this.loadCustomers();
  }

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
  loadCustomers() {
    this.customersService.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
      }
    });
  }
  removeShippingAddress(index: number) {
    this.shippingAddresses.removeAt(index);
  }

  onSubmit() {
    if (this.customerForm.valid) {
      const payload = {
      ...this.customerForm.getRawValue(),
    };;
      
     
      this.customersService.create(payload as any).subscribe({
        next: created => {
          this.customers.update(list => [created, ...list]);
          this.customerForm.reset({ status: 'Active', preferredCurrency: 'USD', paymentTerms: 'Net 30' });
          this.shippingAddresses.clear();
        },
        error: err => {
          console.error('Failed to create customer', err);
        }
      });
    }
  }
}