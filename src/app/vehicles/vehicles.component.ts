import {
  Component, signal, computed, effect, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../shared/services/parking.service';
import { Vehicle } from '../shared/models/models';

// RxJS se Signals mein kya badla:
//   BEFORE: vehicles$: Observable<Vehicle[]>  (subscription needed)
//   AFTER:  ps.vehicles()  (direct read, no subscription)
//
//   BEFORE: filterStatus = 'all'  (plain variable, no reactivity)
//   AFTER:  filterStatus = signal('all')  (reactive, triggers computed)
//
//   BEFORE: applyFilters() manually call karna padta tha
//   AFTER:  filteredVehicles computed() auto-updates jab bhi
//           filterStatus, filterType, searchTerm, ya vehicles change hoon
// ============================================================

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesComponent {

  protected readonly ps = inject(ParkingService);

  // Filter signals — har filter ek alag signal 
  readonly searchTerm = signal('');
  readonly filterStatus = signal<'all' | 'parked' | 'exited'>('all');
  readonly filterType = signal<'all' | 'Car' | 'Bike' | 'Truck' | 'Bus'>('all');

  // Modal states
  readonly showModal = signal(false);
  readonly showCheckoutModal = signal(false);
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly checkoutCharge = signal(0);
  readonly toast = signal('');

  // Form data signal
  readonly newVehicle = signal<{
    plateNumber: string;
    ownerName: string;
    vehicleType: Vehicle['vehicleType'];
    contactNumber: string;
  }>({
    plateNumber: '', ownerName: '',
    vehicleType: 'Car', contactNumber: ''
  });

  // ----------------------------------------------------------
  //  COMPUTED SIGNALS — Filtered results
  //
  // MAGIC: Yeh automatically recalculate hoga jab bhi
  // ps.vehicles(), searchTerm(), filterStatus(), ya filterType()
  // mein se koi bhi change ho
  //
  // Pehle (RxJS):
  //   - Manually applyFilters() call karna padta tha
  //   - Ya combineLatest([vehicles$, search$, status$]) use karte
  //   - Complex subscription management
  //
  // Ab (Signals):
  //   - Bas computed() mein logic likho
  //   - Angular khud track karta hai dependencies
  // ----------------------------------------------------------
  readonly filteredVehicles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.filterStatus();
    const type = this.filterType();

    return this.ps.vehicles().filter(v => {
      const matchSearch = !term ||
        v.plateNumber.toLowerCase().includes(term) ||
        v.ownerName.toLowerCase().includes(term);
      const matchStatus = status === 'all' || v.status === status;
      const matchType = type === 'all' || v.vehicleType === type;
      return matchSearch && matchStatus && matchType;
    });
  });

  readonly parkedCount = computed(() =>
    this.ps.vehicles().filter(v => v.status === 'parked').length
  );
  readonly exitedCount = computed(() =>
    this.ps.vehicles().filter(v => v.status === 'exited').length
  );

  //  EFFECT — Toast auto-hide
  // effect() mein toast signal track karo
  // Jab toast set ho, 3 sec baad clear karo
  constructor() {
    effect(() => {
      const msg = this.toast();
      if (msg) {
        setTimeout(() => this.toast.set(''), 3000);
      }
    });
  }


  openAddModal(): void {
    this.newVehicle.set({ plateNumber: '', ownerName: '', vehicleType: 'Car', contactNumber: '' });
    this.showModal.set(true);
  }

  // signal.update() se object field update karna
  updateField(field: string, value: string): void {
    this.newVehicle.update(v => ({ ...v, [field]: value }));
  }

  addVehicle(): void {
    const v = this.newVehicle();
    if (!v.plateNumber || !v.ownerName) return;
    const result = this.ps.addVehicle(v);
    if (result === 'success') {
      this.showModal.set(false);
      this.toast.set(' Vehicle added successfully!');
    } else {
      this.toast.set('❌ ' + result);
    }
  }

  openCheckout(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    const entry = new Date(vehicle.entryTime!);
    const durationMs = Date.now() - entry.getTime();
    const hours = Math.ceil(durationMs / 3600000);
    const rates: Record<string, number> = { Car: 50, Bike: 20, Truck: 100, Bus: 80 };
    this.checkoutCharge.set(hours * (rates[vehicle.vehicleType] || 50));
    this.showCheckoutModal.set(true);
  }

  confirmCheckout(): void {
    const v = this.selectedVehicle();
    if (!v) return;
    this.ps.checkoutVehicle(v.id);
    this.showCheckoutModal.set(false);
    this.toast.set(` Checkout successful! Charge: ₹${this.checkoutCharge()}`);
  }

  deleteVehicle(id: string): void {
    if (confirm('Delete this record?')) {
      this.ps.deleteVehicle(id);
      this.toast.set('🗑️ Record deleted');
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.filterType.set('all');
  }

  // trackBy for *ngFor performance
  trackByVehicleId(_: number, v: Vehicle): string { return v.id; }
}
