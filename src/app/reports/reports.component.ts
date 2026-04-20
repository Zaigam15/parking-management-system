import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ParkingService } from '../shared/services/parking.service';
import { ParkingRecord } from '../shared/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {
  records: ParkingRecord[] = [];
  filteredRecords: ParkingRecord[] = [];
  filterType = 'all';
  filterDate = '';
  searchTerm = '';
  private sub!: Subscription;

  totalRevenue = 0;
  totalVehicles = 0;
  avgDuration = 0;
  maxRevenue = 0;

  constructor(private parkingService: ParkingService) { }

  ngOnInit(): void {
    this.sub = this.parkingService.getRecords().subscribe(r => {
      this.records = r;
      this.applyFilters();
      this.calcStats();
    });
  }

  applyFilters(): void {
    let result = [...this.records];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(r => r.plateNumber.toLowerCase().includes(t) || r.ownerName.toLowerCase().includes(t));
    }
    if (this.filterType !== 'all') result = result.filter(r => r.vehicleType === this.filterType);
    if (this.filterDate) {
      const d = new Date(this.filterDate);
      result = result.filter(r => {
        const rd = new Date(r.entryTime);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      });
    }
    this.filteredRecords = result;
  }

  calcStats(): void {
    const completed = this.records.filter(r => r.exitTime);
    this.totalRevenue = completed.reduce((s, r) => s + (r.charge || 0), 0);
    this.totalVehicles = completed.length;
    this.avgDuration = completed.length ? Math.round(completed.reduce((s, r) => s + (r.duration || 0), 0) / completed.length) : 0;
    this.maxRevenue = completed.length ? Math.max(...completed.map(r => r.charge || 0)) : 0;
  }

  formatDuration(mins: number): string {
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getTypeRevenue(): { type: string; revenue: number; count: number }[] {
    const map: Record<string, { revenue: number; count: number }> = {};
    this.records.filter(r => r.exitTime).forEach(r => {
      if (!map[r.vehicleType]) map[r.vehicleType] = { revenue: 0, count: 0 };
      map[r.vehicleType].revenue += r.charge || 0;
      map[r.vehicleType].count++;
    });
    return Object.entries(map).map(([type, data]) => ({ type, ...data }));
  }

  clearFilters(): void {
    this.filterType = 'all'; this.filterDate = ''; this.searchTerm = '';
    this.applyFilters();
  }

  printReport(): void { window.print(); }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
