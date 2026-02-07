import {
  Component,
  signal,
  inject,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormBuilder
} from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { CustomersService } from '../../services/customers.service';
import { Customereditdialog } from './dialogs/customereditdialog/customereditdialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomDateAdapter, MY_DATE_FORMATS } from '../../helpers/custom-date-adapter';


@Component({
  selector: 'app-customers',
  standalone: true,
  templateUrl: './customers.html',
  styleUrl: './customers.css',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
   providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
})
export class Customers implements OnInit {

  /* ===================== DEPENDENCIES ===================== */
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private customersService = inject(CustomersService);
  private sanitizer = inject(DomSanitizer);

  dialogRef!: MatDialogRef<any>;

  /* ===================== SIGNALS ===================== */
  customers = signal<any[]>([]);
  imagePreviewUrl = signal<string | SafeUrl | null>(null);

  previews = signal<
    { file: File; url: SafeUrl; rawUrl: string }[]
  >([]);

  selectedFile = signal<File | null>(null);

  // Date constraints - set to start of today to prevent past dates
  readonly minDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  
  // Date filter to disable past dates
  dateFilter = (date: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!date) return false;
    return date >= today;
  };

  /* ===================== LIFECYCLE ===================== */
  ngOnInit(): void {
    this.loadCustomers();
  }

  /* ===================== FORM ===================== */
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

    attachment: this.fb.control<File | null>(null),
    fileName: [''],

    registrationDate: [new Date()],
    customerType: ['Company'],
    priority: ['Medium'],
    specialInstructions: [''],
    status: ['Active']
  });

  get shippingAddresses(): FormArray {
    return this.customerForm.controls['shippingAddresses'] as FormArray;
  }

  /* ===================== SHIPPING ADDRESSES ===================== */
  addShippingAddress(): void {
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

  removeShippingAddress(index: number): void {
    this.shippingAddresses.removeAt(index);
  }

  /* ===================== EDIT ===================== */
  openEditDialog(customer: any): void {
    const dialogRef = this.dialog.open(Customereditdialog, {
      data: customer,
      width: '90%',
      maxWidth: '1000px'
    });

    dialogRef.afterClosed().subscribe(updatedCustomer => {
      if (updatedCustomer) {
        this.customers.update(list =>
          list.map(c =>
            c.customerId === updatedCustomer.customerId
              ? updatedCustomer
              : c
          )
        );

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

  /* ===================== DATA ===================== */
  loadCustomers(): void {
    this.customersService.getAll().subscribe({
      next: data => this.customers.set(data),
      error: err => console.error('Error fetching customers:', err)
    });
  }

  /* ===================== FILE UPLOAD ===================== */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const rawUrl = URL.createObjectURL(file);
      const safeUrl: SafeUrl =
        this.sanitizer.bypassSecurityTrustUrl(rawUrl);

      this.imagePreviewUrl.set(safeUrl);
      

      this._changeDetectorRef.markForCheck();
    }

    this.customerForm.patchValue({
      attachment: file,
      fileName: file.name
    });
  }

  /* ===================== DOWNLOAD ===================== */
  downloadAttachment(customer: any): void {
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
      next: blob => {
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
      error: err => {
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

  /* ===================== DELETE ===================== */
  deleteCustomer(item: any): void {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      this.customersService.delete(item?._id).subscribe({
        next: () => {
          this.customers.update(current =>
            current.filter(c => c._id !== item._id)
          );

          this._changeDetectorRef.markForCheck();

          this.snackBar.open(
            `${item.name} deleted successfully!`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['snackbar-success']
            }
          );
        },
        error: err => {
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

  /* ===================== SUBMIT ===================== */
  onSubmit(): void {
    if (!this.customerForm.valid) return;

    const rawValue = this.customerForm.value;
    const attachment = this.customerForm.get('attachment')?.value;

    if (attachment) {
      const formData = new FormData();

      formData.append('attachment', attachment);

      const customerData = {
        ...rawValue,
        registrationDate: this.formatDateOnly(rawValue.registrationDate)
      };

      delete customerData.attachment;

      formData.append('customerData', JSON.stringify(customerData));

      this.customersService.createWithFile(formData).subscribe({
        next: created => {
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
      const payload = {
        ...rawValue,
        registrationDate: this.formatDateOnly(rawValue.registrationDate)
      };

      delete payload.attachment;

      this.customersService.create(payload as any).subscribe({
        next: created => {
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

  /* ===================== HELPERS ===================== */
  private resetForm(): void {
    this.customerForm.reset({
      status: 'Active',
      preferredCurrency: 'USD',
      paymentTerms: 'Net 30',
      registrationDate: new Date(),
      attachment: null,
      fileName: ''
    });

    this.shippingAddresses.clear();
    this.selectedFile.set(null);
  }

  formatDateOnly(value: any): string | null {
    if (!value) return null;

    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);
  }

  getImageUrl(attachmentPath: string): string {
    const uploadsIndex = attachmentPath.indexOf('uploads');
    const relativePath =
      uploadsIndex !== -1
        ? attachmentPath.substring(uploadsIndex)
        : attachmentPath;

    return `http://localhost:5000/${relativePath.replace(/\\/g, '/')}`;
  }

  getFileIcon(filename: string): string {
    const extension = filename?.toLowerCase().split('.').pop();

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
    if (
      !customer.attachmentPath ||
      !this.isImageFile(customer.fileName)
    ) {
      return;
    }

    const imageUrl = this.getImageUrl(customer.attachmentPath);

    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 cursor-pointer';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'max-w-full max-h-full object-contain';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.className =
      'absolute top-4 right-4 text-white text-2xl w-8 h-8 rounded-full bg-black bg-opacity-50';

    const closeModal = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    modal.onclick = closeModal;
    closeBtn.onclick = e => {
      e.stopPropagation();
      closeModal();
    };

    img.onerror = () => {
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
