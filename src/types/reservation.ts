import type { EquipmentId } from './equipment';

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Reservation {
  id: string;
  year: number;
  equipmentId: EquipmentId;
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  requesterName: string;
  requesterEmail?: string;
  purpose?: string;
  status: ReservationStatus;
  createdAt: string; // ISO
  decidedAt?: string; // ISO
  decidedBy?: string;
  decisionNote?: string;
}
