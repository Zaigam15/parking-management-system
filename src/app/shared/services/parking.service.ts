import { Injectable, signal, computed, effect } from '@angular/core';
import { Vehicle, ParkingSlot, ParkingRecord } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ParkingService {

  // ✅ STATE
  vehicles = signal<Vehicle[]>([]);
  slots = signal<ParkingSlot[]>([]);
  records = signal<ParkingRecord[]>([]);

  // ✅ STATS (MAIN DASHBOARD)
  stats = computed(() => {
    const slots = this.slots();
    const vehicles = this.vehicles();
    const records = this.records();

    const total = slots.length;
    const available = slots.filter(s => s.status === 'available').length;
    const occupied = slots.filter(s => s.status === 'occupied').length;

    const todayRevenue = records.reduce((sum, r) => sum + Number(r.charge || 0), 0);

    return {
      totalSlots: total,
      availableSlots: available,
      occupiedSlots: occupied,
      todayRevenue,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'parked').length
    };
  });

  // ✅ BACKWARD COMPATIBILITY
  dashboardStats = this.stats;

  // ✅ EXTRA COMPUTED
  todayRevenue = computed(() =>
    this.records().reduce((sum, r) => sum + Number(r.charge || 0), 0)
  );

  occupancyPercent = computed(() => {
    const s = this.stats();
    return s.totalSlots ? Math.round((s.occupiedSlots / s.totalSlots) * 100) : 0;
  });

  availableSlotsCount = computed(() =>
    this.slots().filter(s => s.status === 'available').length
  );

  occupiedSlotsCount = computed(() =>
    this.slots().filter(s => s.status === 'occupied').length
  );

  reservedSlotsCount = computed(() =>
    this.slots().filter(s => s.status === 'reserved').length
  );

  maintenanceSlotsCount = computed(() =>
    this.slots().filter(s => s.status === 'maintenance').length
  );

  parkedVehicles = computed(() =>
    this.vehicles().filter(v => v.status === 'parked')
  );

  // ✅ REPORTS FIXED (revenue + count)
  revenueByType = computed(() => {
    const map: Record<string, { type: string; revenue: number; count: number }> = {};

    this.records().forEach(r => {
      if (!map[r.vehicleType]) {
        map[r.vehicleType] = {
          type: r.vehicleType,
          revenue: 0,
          count: 0
        };
      }

      map[r.vehicleType].revenue += Number(r.charge || 0);
      map[r.vehicleType].count += 1;
    });

    return Object.values(map);
  });

  // ✅ EFFECT (debug / reactive side effect)
  constructor() {
    effect(() => {
      console.log('Vehicles:', this.vehicles());
      console.log('Slots:', this.slots());
    });
  }

  // ✅ ADD VEHICLE
  addVehicle(vehicle: Omit<Vehicle, 'id' | 'entryTime' | 'status'>): string {
    const slots = this.slots();
    const vehicles = this.vehicles();

    const slot = slots.find(s => s.type === vehicle.vehicleType && s.status === 'available');
    if (!slot) return 'No slot available';

    const id = 'v' + Date.now();

    const newVehicle: Vehicle = {
      ...vehicle,
      id,
      entryTime: new Date(),
      status: 'parked',
      slotId: slot.id
    };

    this.vehicles.set([...vehicles, newVehicle]);

    this.slots.set(
      slots.map(s =>
        s.id === slot.id ? { ...s, status: 'occupied', vehicleId: id } : s
      )
    );

    return 'success';
  }

  // ✅ CHECKOUT VEHICLE
  checkoutVehicle(vehicleId: string): number {
    const vehicles = this.vehicles();
    const slots = this.slots();

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.entryTime) return 0;

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - new Date(vehicle.entryTime).getTime();
    const durationMin = Math.ceil(durationMs / 60000);

    const rate = 50;
    const charge = Math.ceil(durationMin / 60) * rate;

    const record: ParkingRecord = {
      id: 'r' + Date.now(),
      vehicleId,
      slotId: vehicle.slotId!,
      plateNumber: vehicle.plateNumber,
      ownerName: vehicle.ownerName,
      vehicleType: vehicle.vehicleType,
      slotNumber: '',
      entryTime: vehicle.entryTime,
      exitTime,
      duration: durationMin,
      charge
    };

    this.records.set([...this.records(), record]);

    this.vehicles.set(
      vehicles.map(v =>
        v.id === vehicleId
          ? { ...v, status: 'exited' as 'exited', exitTime }
          : v
      )
    );

    this.slots.set(
      slots.map(s =>
        s.id === vehicle.slotId
          ? { ...s, status: 'available', vehicleId: undefined }
          : s
      )
    );

    return charge;
  }

  // ✅ UPDATE SLOT
  updateSlotStatus(slotId: string, status: any) {
    this.slots.set(
      this.slots().map(s =>
        s.id === slotId && s.status !== 'occupied'
          ? { ...s, status }
          : s
      )
    );
  }

  // ✅ DELETE VEHICLE
  deleteVehicle(id: string) {
    this.vehicles.set(this.vehicles().filter(v => v.id !== id));
  }

  // ✅ GROUP BY FLOOR
  getSlotsByFloor(slots = this.slots()) {
    const floors: Record<string, ParkingSlot[]> = {};
    slots.forEach(s => {
      if (!floors[s.floor]) floors[s.floor] = [];
      floors[s.floor].push(s);
    });
    return Object.entries(floors).map(([floor, slots]) => ({ floor, slots }));
  }

  // ✅ DURATION
  getDuration(entry: Date): string {
    const mins = Math.floor((Date.now() - new Date(entry).getTime()) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}