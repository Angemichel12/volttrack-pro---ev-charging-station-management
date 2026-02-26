
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  stationId?: string;
}

export interface Station {
  id: string;
  name: string;
  pricePerWatt: number;
  startingReading: number;
  endingReading: number;
  managerId?: string;
}

export interface Charger {
  id: string;
  name: string;
  stationId: string;
  assignedStaffId?: string;
  status: 'idle' | 'charging';
}

export interface Car {
  id: string;
  plateNumber: string;
  model?: string;
  ownerName?: string;
}

export interface Session {
  id: string;
  stationId: string;
  chargerId: string;
  staffId: string;
  carId: string;
  plateNumber: string;
  wattConsumed: number;
  totalPrice: number;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed';
}

export interface AppState {
  users: User[];
  stations: Station[];
  chargers: Charger[];
  cars: Car[];
  sessions: Session[];
  currentUser: User | null;
}
