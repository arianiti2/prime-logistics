import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Customers } from './customers.component';
import { CustomersService } from '../../services/customers.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Customers Component', () => {
  let component: Customers;
  let fixture: ComponentFixture<Customers>;
  
  // Mocks
  const mockCustomersService = {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  };

  const mockDialog = {
    open: jest.fn()
  };

  const mockSnackBar = {
    open: jest.fn()
  };

  const dummyCustomers = [
    { _id: '1', name: 'John Doe', email: 'john@test.com', customerId: 'C001' },
    { _id: '2', name: 'Jane Smith', email: 'jane@test.com', customerId: 'C002' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Customers, // Standalone component
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    // Default mock behavior
    mockCustomersService.getAll.mockReturnValue(of(dummyCustomers));
    
    fixture = TestBed.createComponent(Customers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load customers on init', () => {
    expect(mockCustomersService.getAll).toHaveBeenCalled();
    expect(component.customers()).toEqual(dummyCustomers);
  });

  describe('Form Handling', () => {
    it('should validate required fields', () => {
      const form = component.customerForm;
      form.controls.name.setValue('');
      expect(form.valid).toBeFalsy();
      
      form.patchValue({
        name: 'New Corp',
        contactPerson: 'Manager',
        email: 'test@corp.com'
      });
      expect(form.valid).toBeTruthy();
    });

    it('should add and remove shipping addresses', () => {
      component.addShippingAddress();
      expect(component.shippingAddresses.length).toBe(1);
      
      component.removeShippingAddress(0);
      expect(component.shippingAddresses.length).toBe(0);
    });

    it('should call service create on valid submit', () => {
      const newCustomer = { name: 'New Customer', email: 'a@b.com', contactPerson: 'X' };
      component.customerForm.patchValue(newCustomer);
      mockCustomersService.create.mockReturnValue(of({ ...newCustomer, _id: '3' }));

      component.onSubmit();

      expect(mockCustomersService.create).toHaveBeenCalled();
      // Check if signal updated
      expect(component.customers()[0].name).toBe('New Customer');
    });
  });

  describe('Dialog and Actions', () => {
    it('should open edit dialog and update list on close', () => {
      const updatedData = { customerId: 'C001', name: 'John Updated' };
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(updatedData)
      });

      component.openEditDialog(dummyCustomers[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      // Check signal update logic
      const updatedCustomer = component.customers().find(c => c.customerId === 'C001');
      expect(updatedCustomer.name).toBe('John Updated');
      expect(mockSnackBar.open).toHaveBeenCalledWith(expect.stringContaining('success'), 'Close', expect.any(Object));
    });

    it('should delete customer after confirmation', () => {
      // Mock window.confirm
      window.confirm = jest.fn().mockReturnValue(true);
      mockCustomersService.delete.mockReturnValue(of({}));
      
      const target = dummyCustomers[0];
      component.deleteCustomer(target);

      expect(mockCustomersService.delete).toHaveBeenCalledWith(target._id);
      expect(mockSnackBar.open).toHaveBeenCalled();
    });
  });
});