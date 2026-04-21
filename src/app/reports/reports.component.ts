import {
  Component, signal, computed, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService } from '../shared/services/parking.service';

// ============================================================
// REPORTS COMPONENT — Signals with filter state
// ============================================================

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {

  protected readonly ps = inject(ParkingService);

  // Filter signals
  readonly searchTerm = signal('');
  readonly filterType = signal('all');
  readonly filterDate = signal('');

  // Computed — filtered records
  readonly filteredRecords = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    const date = this.filterDate();

    return this.ps.records().filter(r => {
      const matchSearch = !term ||
        r.plateNumber.toLowerCase().includes(term) ||
        r.ownerName.toLowerCase().includes(term);
      const matchType = type === 'all' || r.vehicleType === type;
      const matchDate = !date || this.sameDay(new Date(r.entryTime), new Date(date));
      return matchSearch && matchType && matchDate;
    });
  });

  // Computed — revenue stats from filtered records
  readonly totalRevenue = computed(() =>
    this.filteredRecords()
      .filter(r => r.exitTime)
      .reduce((s, r) => s + (r.charge || 0), 0)
  );

  readonly avgDuration = computed(() => {
    const done = this.filteredRecords().filter(r => r.exitTime && r.duration);
    return done.length
      ? Math.round(done.reduce((s, r) => s + (r.duration || 0), 0) / done.length)
      : 0;
  });

  readonly maxCharge = computed(() => {
    const charges = this.filteredRecords().map(r => r.charge || 0);
    return charges.length ? Math.max(...charges) : 0;
  });

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterType.set('all');
    this.filterDate.set('');
  }

  formatDuration(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  printReport(): void { window.print(); }

  trackByRecordId(_: number, r: any): string { return r.id; }
}
