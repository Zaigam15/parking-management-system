import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParkingService } from '../shared/services/parking.service';
import { ParkingSlot } from '../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {

  protected readonly ps = inject(ParkingService);


  readonly recentParked = computed(() =>
    this.ps.parkedVehicles().slice(-5).reverse()
  );

  readonly slotsByFloor = computed(() =>
    this.ps.getSlotsByFloor()
  );

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      Car: '🚗', Bike: '🏍', Truck: '🚛', Bus: '🚌'
    };
    return icons[type] || '🚗';
  }

  trackBySlotId(_: number, slot: ParkingSlot): string {
    return slot.id;
  }

  trackByVehicleId(_: number, v: any): string {
    return v.id;
  }
}
