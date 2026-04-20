import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ParkingService } from '../shared/services/parking.service';
import { ParkingSlot } from '../shared/models/models';

@Component({
  selector: 'app-parking-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-slots.component.html',
  styleUrl: './parking-slots.component.scss'
})
export class ParkingSlotsComponent implements OnInit, OnDestroy {
  slots: ParkingSlot[] = [];
  filteredSlots: ParkingSlot[] = [];
  filterStatus = 'all';
  filterType = 'all';
  viewMode: 'grid' | 'table' = 'grid';
  toast = '';
  private sub!: Subscription;

  constructor(private parkingService: ParkingService) { }

  ngOnInit(): void {
    this.sub = this.parkingService.getSlots().subscribe(s => {
      this.slots = s;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = [...this.slots];
    if (this.filterStatus !== 'all') result = result.filter(s => s.status === this.filterStatus);
    if (this.filterType !== 'all') result = result.filter(s => s.type === this.filterType);
    this.filteredSlots = result;
  }

  getByFloor(): { floor: string; slots: ParkingSlot[] }[] {
    const map: Record<string, ParkingSlot[]> = {};
    this.filteredSlots.forEach(s => {
      if (!map[s.floor]) map[s.floor] = [];
      map[s.floor].push(s);
    });
    return Object.entries(map).map(([floor, slots]) => ({ floor, slots }));
  }

  getCount(status: string): number { return this.slots.filter(s => s.status === status).length; }

  setStatus(slotId: string, status: ParkingSlot['status']): void {
    this.parkingService.updateSlotStatus(slotId, status);
    this.showToast(' Slot status updated');
  }

  getTypeIcon(type: string): string {
    return type === 'Car' ? '🚗' : type === 'Bike' ? '🏍' : type === 'Truck' ? '🚛' : '🚌';
  }

  showToast(msg: string): void { this.toast = msg; setTimeout(() => this.toast = '', 3000); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
