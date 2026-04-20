import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ParkingService } from '../shared/services/parking.service';
import { Vehicle } from '../shared/models/models';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss'
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  showModal = false;
  showCheckoutModal = false;
  selectedVehicle: Vehicle | null = null;
  checkoutCharge = 0;
  searchTerm = '';
  filterStatus = 'all';
  filterType = 'all';
  toast = '';
  private sub!: Subscription;

  newVehicle = { plateNumber: '', ownerName: '', vehicleType: 'Car' as Vehicle['vehicleType'], contactNumber: '' };

  constructor(private parkingService: ParkingService) { }

  ngOnInit(): void {
    this.sub = this.parkingService.getVehicles().subscribe(v => {
      this.vehicles = v;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = [...this.vehicles];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(v => v.plateNumber.toLowerCase().includes(term) || v.ownerName.toLowerCase().includes(term));
    }
    if (this.filterStatus !== 'all') result = result.filter(v => v.status === this.filterStatus);
    if (this.filterType !== 'all') result = result.filter(v => v.vehicleType === this.filterType);
    this.filteredVehicles = result;
  }

  openAddModal(): void {
    this.newVehicle = { plateNumber: '', ownerName: '', vehicleType: 'Car', contactNumber: '' };
    this.showModal = true;
  }

  addVehicle(): void {
    if (!this.newVehicle.plateNumber || !this.newVehicle.ownerName) return;
    const result = this.parkingService.addVehicle(this.newVehicle);
    if (result === 'success') {
      this.showModal = false;
      this.showToast(' Vehicle added successfully!');
    } else {
      this.showToast('❌ ' + result);
    }
  }

  openCheckout(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    const entry = new Date(vehicle.entryTime!);
    const durationMs = Date.now() - entry.getTime();
    const hours = Math.ceil(durationMs / 3600000);
    const rates: Record<string, number> = { Car: 50, Bike: 20, Truck: 100, Bus: 80 };
    this.checkoutCharge = hours * (rates[vehicle.vehicleType] || 50);
    this.showCheckoutModal = true;
  }

  confirmCheckout(): void {
    if (!this.selectedVehicle) return;
    this.parkingService.checkoutVehicle(this.selectedVehicle.id);
    this.showCheckoutModal = false;
    this.showToast(' Checkout successful! Charge: ₹' + this.checkoutCharge);
  }

  deleteVehicle(id: string): void {
    if (confirm('Delete this record?')) {
      this.parkingService.deleteVehicle(id);
      this.showToast(' Record deleted');
    }
  }

  getDuration(entry: Date): string {
    const mins = Math.floor((Date.now() - new Date(entry).getTime()) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  showToast(msg: string): void {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
