import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { CustomersService } from '../../services/customers.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Customereditdialog } from './dialogs/customereditdialog/customereditdialog';
import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule
  ],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
   encapsulation: ViewEncapsulation.None 
})
export class Customers implements OnInit{
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private customersService = inject(CustomersService);
   dialogRef!: MatDialogRef<any>; 
  
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
    openEditDialog(customer: any) {
    const dialogRef = this.dialog.open(Customereditdialog, {
      data: customer,
        width: '90%',       
       maxWidth: '1000px'
    });

    dialogRef.afterClosed().subscribe(updatedCustomer => {
      console.log('Dialog closed with data:', updatedCustomer);
      if (updatedCustomer) {
        // update the local signal array
        this.customers.update(list => list.map(c => c.customerId === updatedCustomer.customerId ? updatedCustomer : c));
        this._changeDetectorRef.markForCheck();
         this.snackBar.open('Customer updated successfully!', 'Close', {
  duration: 3000,
  horizontalPosition: 'end',
  verticalPosition: 'top',
  panelClass: ['snackbar-success']
});

      }
    });
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