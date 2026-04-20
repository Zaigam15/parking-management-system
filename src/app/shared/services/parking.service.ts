import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vehicle, ParkingSlot, ParkingRecord, DashboardStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private vehicles: Vehicle[] = [
    { id: 'v1', plateNumber: 'UP32AB1234', ownerName: 'Ramesh Kumar', vehicleType: 'Car', contactNumber: '9876543210', entryTime: new Date(Date.now() - 7200000), slotId: 's1', status: 'parked' },
    { id: 'v2', plateNumber: 'DL01CD5678', ownerName: 'Priya Singh', vehicleType: 'Bike', contactNumber: '8765432109', entryTime: new Date(Date.now() - 3600000), slotId: 's5', status: 'parked' },
    { id: 'v3', plateNumber: 'MH02EF9012', ownerName: 'Suresh Patel', vehicleType: 'Car', contactNumber: '7654321098', entryTime: new Date(Date.now() - 1800000), slotId: 's2', status: 'parked' },
    { id: 'v4', plateNumber: 'UP70GH3456', ownerName: 'Anita Sharma', vehicleType: 'Truck', contactNumber: '6543210987', entryTime: new Date(Date.now() - 5400000), slotId: 's9', status: 'parked' },
    { id: 'v5', plateNumber: 'RJ14IJ7890', ownerName: 'Vikram Gupta', vehicleType: 'Car', contactNumber: '9012345678', exitTime: new Date(Date.now() - 900000), status: 'exited' },
  ];

  private slots: ParkingSlot[] = [
    { id: 's1', slotNumber: 'A-01', floor: 'Ground', type: 'Car', status: 'occupied', vehicleId: 'v1' },
    { id: 's2', slotNumber: 'A-02', floor: 'Ground', type: 'Car', status: 'occupied', vehicleId: 'v3' },
    { id: 's3', slotNumber: 'A-03', floor: 'Ground', type: 'Car', status: 'available' },
    { id: 's4', slotNumber: 'A-04', floor: 'Ground', type: 'Car', status: 'reserved' },
    { id: 's5', slotNumber: 'B-01', floor: 'Ground', type: 'Bike', status: 'occupied', vehicleId: 'v2' },
    { id: 's6', slotNumber: 'B-02', floor: 'Ground', type: 'Bike', status: 'available' },
    { id: 's7', slotNumber: 'B-03', floor: 'Ground', type: 'Bike', status: 'maintenance' },
    { id: 's8', slotNumber: 'C-01', floor: '1st Floor', type: 'Car', status: 'available' },
    { id: 's9', slotNumber: 'D-01', floor: 'Ground', type: 'Truck', status: 'occupied', vehicleId: 'v4' },
    { id: 's10', slotNumber: 'D-02', floor: 'Ground', type: 'Truck', status: 'available' },
    { id: 's11', slotNumber: 'C-02', floor: '1st Floor', type: 'Car', status: 'available' },
    { id: 's12', slotNumber: 'C-03', floor: '1st Floor', type: 'Car', status: 'available' },
  ];

  private records: ParkingRecord[] = [
    { id: 'r1', vehicleId: 'v5', slotId: 's3', plateNumber: 'RJ14IJ7890', ownerName: 'Vikram Gupta', vehicleType: 'Car', slotNumber: 'A-03', entryTime: new Date(Date.now() - 10800000), exitTime: new Date(Date.now() - 900000), duration: 165, charge: 165 },
  ];

  private readonly RATE_PER_HOUR: Record<string, number> = { Car: 50, Bike: 20, Truck: 100, Bus: 80 };

  private vehiclesSubject = new BehaviorSubject<Vehicle[]>(this.vehicles);
  private slotsSubject = new BehaviorSubject<ParkingSlot[]>(this.slots);
  private recordsSubject = new BehaviorSubject<ParkingRecord[]>(this.records);

  getVehicles(): Observable<Vehicle[]> { return this.vehiclesSubject.asObservable(); }
  getSlots(): Observable<ParkingSlot[]> { return this.slotsSubject.asObservable(); }
  getRecords(): Observable<ParkingRecord[]> { return this.recordsSubject.asObservable(); }

  getStats(): DashboardStats {
    const total = this.slots.length;
    const available = this.slots.filter(s => s.status === 'available').length;
    const occupied = this.slots.filter(s => s.status === 'occupied').length;
    const todayRevenue = this.records.filter(r => r.exitTime && this.isToday(r.exitTime)).reduce((sum, r) => sum + (r.charge || 0), 0);
    return { totalSlots: total, availableSlots: available, occupiedSlots: occupied, todayRevenue, totalVehicles: this.vehicles.length, activeVehicles: this.vehicles.filter(v => v.status === 'parked').length };
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  addVehicle(vehicle: Omit<Vehicle, 'id' | 'entryTime' | 'status'>): string {
    const slot = this.slots.find(s => s.type === vehicle.vehicleType && s.status === 'available');
    if (!slot) return 'No slot available for this vehicle type';
    const id = 'v' + Date.now();
    const newVehicle: Vehicle = { ...vehicle, id, entryTime: new Date(), slotId: slot.id, status: 'parked' };
    this.vehicles.push(newVehicle);
    slot.status = 'occupied';
    slot.vehicleId = id;
    this.vehiclesSubject.next([...this.vehicles]);
    this.slotsSubject.next([...this.slots]);
    return 'success';
  }

  checkoutVehicle(vehicleId: string): number {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.entryTime) return 0;
    const exitTime = new Date();
    const durationMs = exitTime.getTime() - new Date(vehicle.entryTime).getTime();
    const durationMin = Math.ceil(durationMs / 60000);
    const rate = this.RATE_PER_HOUR[vehicle.vehicleType] || 50;
    const charge = Math.ceil(durationMin / 60) * rate;
    const record: ParkingRecord = { id: 'r' + Date.now(), vehicleId, slotId: vehicle.slotId!, plateNumber: vehicle.plateNumber, ownerName: vehicle.ownerName, vehicleType: vehicle.vehicleType, slotNumber: this.slots.find(s => s.id === vehicle.slotId)?.slotNumber || '', entryTime: vehicle.entryTime, exitTime, duration: durationMin, charge };
    this.records.push(record);
    vehicle.status = 'exited';
    vehicle.exitTime = exitTime;
    const slot = this.slots.find(s => s.id === vehicle.slotId);
    if (slot) { slot.status = 'available'; delete slot.vehicleId; }
    this.vehiclesSubject.next([...this.vehicles]);
    this.slotsSubject.next([...this.slots]);
    this.recordsSubject.next([...this.records]);
    return charge;
  }

  updateSlotStatus(slotId: string, status: ParkingSlot['status']): void {
    const slot = this.slots.find(s => s.id === slotId);
    if (slot && slot.status !== 'occupied') { slot.status = status; this.slotsSubject.next([...this.slots]); }
  }

  deleteVehicle(vehicleId: string): void {
    this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
    this.vehiclesSubject.next([...this.vehicles]);
  }
}
