import { Injectable, computed } from '@angular/core';
import { BaseStore } from './base-store';
import { Vehicle } from '../models/models';

// ============================================================
// VEHICLE STORE — BaseStore ko extend karta hai
//
// Yeh dikhaata hai ki BaseStore se apna custom store
// kaise banate hain. Sirf domain-specific computed signals
// add karo — baaki sab BaseStore se inherit hota hai.
// ============================================================

@Injectable({ providedIn: 'root' })
export class VehicleStore extends BaseStore<Vehicle> {

  // ── Domain-specific Computed Signals ────────────────────

  readonly parked = computed(() =>
    this.items().filter(v => v.status === 'parked')
  );

  readonly exited = computed(() =>
    this.items().filter(v => v.status === 'exited')
  );

  readonly parkedCount = computed(() => this.parked().length);
  readonly exitedCount = computed(() => this.exited().length);

  // Vehicle type se group karo
  readonly byType = computed(() => {
    const map: Record<string, Vehicle[]> = {};
    this.items().forEach(v => {
      if (!map[v.vehicleType]) map[v.vehicleType] = [];
      map[v.vehicleType].push(v);
    });
    return map;
  });

  // ── Vehicle-specific Actions ─────────────────────────────

  checkout(vehicleId: string, exitTime: Date): void {
    this.update(vehicleId, { status: 'exited', exitTime });
  }

  park(vehicle: Vehicle): void {
    this.add(vehicle);
  }
}
