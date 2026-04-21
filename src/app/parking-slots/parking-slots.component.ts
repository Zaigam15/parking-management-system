import {
  Component, signal, computed, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../shared/services/parking.service';
import { ParkingSlot } from '../shared/models/models';

@Component({
  selector: 'app-parking-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-slots.component.html',
  styleUrl: './parking-slots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingSlotsComponent {

  protected readonly ps = inject(ParkingService);

  // Local UI signals
  readonly filterStatus = signal<string>('all');
  readonly filterType = signal<string>('all');
  readonly viewMode = signal<'grid' | 'table'>('grid');
  readonly toast = signal('');

  // Computed — filtered slots (auto-recalculates)
  readonly filteredSlots = computed(() => {
    const status = this.filterStatus();
    const type = this.filterType();
    return this.ps.slots().filter(s => {
      const matchStatus = status === 'all' || s.status === status;
      const matchType = type === 'all' || s.type === type;
      return matchStatus && matchType;
    });
  });

  // Computed — grouped by floor (for grid view)
  readonly slotsByFloor = computed(() =>
    this.ps.getSlotsByFloor(this.filteredSlots())
  );

  setStatus(slotId: string, status: ParkingSlot['status']): void {
    this.ps.updateSlotStatus(slotId, status);
    this.toast.set(' Slot status updated');
    setTimeout(() => this.toast.set(''), 3000);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { Car: '🚗', Bike: '🏍', Truck: '🚛', Bus: '🚌' };
    return icons[type] || '🚗';
  }

  // trackBy for *ngFor
  trackBySlotId(_: number, slot: ParkingSlot): string { return slot.id; }
  trackByFloor(_: number, fd: any): string { return fd.floor; }
}
