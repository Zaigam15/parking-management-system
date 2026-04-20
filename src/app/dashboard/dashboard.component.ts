import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ParkingService } from '../shared/services/parking.service';
import { Vehicle, ParkingSlot, DashboardStats } from '../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats!: DashboardStats;
  recentVehicles: Vehicle[] = [];
  slots: ParkingSlot[] = [];
  private subs: Subscription[] = [];

  constructor(private parkingService: ParkingService) { }

  ngOnInit(): void {
    this.stats = this.parkingService.getStats();
    this.subs.push(
      this.parkingService.getVehicles().subscribe(v => {
        this.recentVehicles = v.filter(x => x.status === 'parked').slice(-5).reverse();
        this.stats = this.parkingService.getStats();
      }),
      this.parkingService.getSlots().subscribe(s => {
        this.slots = s;
        this.stats = this.parkingService.getStats();
      })
    );
  }

  getOccupancyPercent(): number {
    return this.stats.totalSlots ? Math.round((this.stats.occupiedSlots / this.stats.totalSlots) * 100) : 0;
  }

  getDuration(entry: Date): string {
    const mins = Math.floor((Date.now() - new Date(entry).getTime()) / 60000);
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getSlotsByFloor() {
    const floors: Record<string, ParkingSlot[]> = {};
    this.slots.forEach(s => {
      if (!floors[s.floor]) floors[s.floor] = [];
      floors[s.floor].push(s);
    });
    return Object.entries(floors).map(([floor, slots]) => ({ floor, slots }));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
