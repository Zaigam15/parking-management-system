

export interface Vehicle {
  id: string;
  plateNumber: string;
  ownerName: string;
  vehicleType: 'Car' | 'Bike' | 'Truck' | 'Bus';
  contactNumber: string;
  entryTime?: Date;
  exitTime?: Date;
  slotId?: string;
  status: 'parked' | 'exited';
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  floor: string;
  type: 'Car' | 'Bike' | 'Truck' | 'Bus';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleId?: string;
}

export interface ParkingRecord {
  id: string;
  vehicleId: string;
  slotId: string;
  plateNumber: string;
  ownerName: string;
  vehicleType: string;
  slotNumber: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // minutes mein
  charge?: number;
}

export interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  todayRevenue: number;
  totalVehicles: number;
  activeVehicles: number;
}
