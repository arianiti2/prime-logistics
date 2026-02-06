import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule,
    MatDatepickerModule, MatNativeDateModule, MatTooltipModule
  ],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
   encapsulation: ViewEncapsulation.None,
   providers: [
  { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, // Uses DD/MM/YYYY format which often avoids US timezone flipping
]
})
export class Customers implements OnInit{
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private customersService = inject(CustomersService);
  private sanitizer = inject(DomSanitizer);
   dialogRef!: MatDialogRef<any>; 
  
  customers = signal<any[]>([]);
imagePreviewUrl = signal<string | SafeUrl | null>(null);

// If you are doing multiple photos:
previews = signal<{file: File, url: SafeUrl, rawUrl: string}[]>([]);
  selectedFile = signal<File | null>(null);

  ngOnInit(): void {
    this.loadCustomers();
  }

  // ngOnDestroy(): void {
  //   this.clearPreview();
  // }

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
     // ... existing fields
   attachment: this.fb.control<File | null>(null), 
  fileName: [''],
    dateDite: [new Date()],
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
 onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (!file) return;

  // 1. Logic for image preview
  if (file.type.startsWith('image/')) {
    const rawUrl = URL.createObjectURL(file);
    
    // Now this will work because the signal accepts SafeUrl
    const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(rawUrl);
    this.imagePreviewUrl.set(safeUrl);
  }

  // 2. Update Form
  this.customerForm.patchValue({
    attachment: file,
    fileName: file.name
  });
}


  // clearFile() {
  //   this.customerForm.patchValue({ attachment: null, fileName: '' });
  //   this.selectedFile.set(null);
  //   this.clearPreview();
  // }

  // private clearPreview() {
  //   const currentUrl = this.imagePreviewUrl();
  //   if (currentUrl?.startsWith('blob:')) {
  //     URL.revokeObjectURL(currentUrl); // Memory management
  //   }
  //   this.imagePreviewUrl.set(null);
  // }
  downloadAttachment(customer: any) {
    if (!customer._id || !customer.fileName) {
      this.snackBar.open('No attachment available for download', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.customersService.downloadAttachment(customer._id).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = customer.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open(`Downloaded ${customer.fileName}`, 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        this.snackBar.open('Failed to download file', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
  deleteCustomer(item: any) {

  if (confirm(`Are you sure you want to delete ${item.name}?`)) {

    this.customersService.delete(item?._id).subscribe({
      next: () => {
      
        this.customers.update((current) => current.filter(c => c._id !== item._id));
        this._changeDetectorRef.markForCheck();
      this.snackBar.open(`${item.name} deleted successfully!`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
        console.log(`${item.name} deleted successfully.`);
      },
      error: (err: any) => {
        console.error('Error deleting customer:', err);
        this.snackBar.open('Failed to delete customer', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}

  removeShippingAddress(index: number) {
    this.shippingAddresses.removeAt(index);
  }
onSubmit() {
  if (this.customerForm.valid) {
    const rawValue = this.customerForm.value;
    const attachment = this.customerForm.get('attachment')?.value;

    if (attachment) {
      // Handle file upload with FormData
      const formData = new FormData();
      
      // Add the file
      formData.append('attachment', attachment);
      
      // Add other customer data
      const customerData = {
        ...rawValue,
        dateDite: this.formatDateOnly(rawValue.dateDite)
      };
      
      // Remove attachment and fileName from customerData to avoid duplication
      delete customerData.attachment;
      
      // Append customer data as JSON
      formData.append('customerData', JSON.stringify(customerData));
      
      this.customersService.createWithFile(formData).subscribe({
        next: created => {
          console.log("Customer created with file:", created);
          this.customers.update(list => [created, ...list]);
          this.resetForm();
          this.snackBar.open('Customer created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-success']
          });
        },
        error: err => {
          console.error('Failed to create customer with file', err);
          this.snackBar.open('Failed to create customer', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      // Handle regular submission without file
      const payload = {
        ...rawValue,
        dateDite: this.formatDateOnly(rawValue.dateDite)
      };
      
      delete payload.attachment; // Remove attachment field if no file
      
      this.customersService.create(payload as any).subscribe({
        next: created => {
          console.log("Customer created:", created);
          this.customers.update(list => [created, ...list]);
          this.resetForm();
          this.snackBar.open('Customer created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-success']
          });
        },
        error: err => {
          console.error('Failed to create customer', err);
          this.snackBar.open('Failed to create customer', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }
}

private resetForm() {
  this.customerForm.reset({ 
    status: 'Active', 
    preferredCurrency: 'USD', 
    paymentTerms: 'Net 30',
    dateDite: new Date(),
    attachment: null,
    fileName: ''
  });
  this.shippingAddresses.clear();
  // this.clearPreview();
  this.selectedFile.set(null);
} // Removed the extra brace that was here

/**
 * Timezone-safe date formatter that returns YYYY-MM-DD format.
 * This prevents the -1 day issue by avoiding timezone conversions.
 */
formatDateOnly(value: any): string | null {
  if (!value) return null;
  
  try {
    // Handle Material datepicker output and various input types
    const date = value instanceof Date ? value : new Date(value);
    
    if (isNaN(date.getTime())) return null;
    
    // Get local date components (no timezone conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Invalid date value:', value);
    return null;
  }
}

// Helper methods for image viewing in table
isImageFile(filename: string): boolean {
  if (!filename) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

getImageUrl(attachmentPath: string): string {
  // Extract relative path from full system path
  // Convert C:/Users/niti_/prime-logistics/backend/uploads/customers/file.jpg 
  // to uploads/customers/file.jpg
  const uploadsIndex = attachmentPath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    const relativePath = attachmentPath.substring(uploadsIndex).replace(/\\/g, '/');
    return `http://localhost:5000/${relativePath}`;
  }
  // Fallback: assume it's already a relative path
  return `http://localhost:5000/${attachmentPath.replace(/\\/g, '/')}`;
}

getFileIcon(filename: string): string {
  if (!filename) return 'description';
  
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'picture_as_pdf';
    case 'doc':
    case 'docx':
      return 'description';
    case 'txt':
      return 'text_snippet';
    case 'xls':
    case 'xlsx':
      return 'grid_on';
    default:
      return 'attach_file';
  }
}

viewImage(customer: any): void {
  if (!customer.attachmentPath || !this.isImageFile(customer.fileName)) {
    return;
  }

  // Open image in a modal
  const imageUrl = this.getImageUrl(customer.attachmentPath);
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 cursor-pointer';
  
  const img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'max-w-full max-h-full object-contain';
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'absolute top-4 right-4 text-white text-2xl w-8 h-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75';
  
  const closeModal = () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };
  
  modal.onclick = closeModal;
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeModal();
  };
  
  // Handle image load error
  img.onerror = () => {
    console.error('Failed to load image:', imageUrl);
    this.snackBar.open('Failed to load image', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
    closeModal();
  };
  
  modal.appendChild(img);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}


}