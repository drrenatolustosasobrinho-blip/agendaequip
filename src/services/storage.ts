import type { Reservation } from '../types/reservation';
import type { Equipment, EquipmentId } from '../types/equipment';

const CONFIG_KEY = 'app_config';
const RESERVATIONS_KEY = 'reservations';
const EQUIPMENTS_KEY = 'equipments';

// Configuração global
export interface AppConfig {
  activeYear: number;
}

// Inicialização padrão
const defaultConfig: AppConfig = {
  activeYear: new Date().getFullYear(),
};

const defaultEquipments: Equipment[] = [
  {
    id: 'growth_chamber',
    name: 'Câmara de crescimento',
    description: 'Câmara para cultivo controlado',
  },
  {
    id: 'irga',
    name: 'IRGA',
    description: 'Equipamento de análise de gases',
  },
  {
    id: 'greenhouse',
    name: 'Casa de vegetação',
    description: 'Estufa para plantas',
  },
];

// --- Config ---
export const loadConfig = (): AppConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultConfig;
    }
  }
  // Se não existe, salvar o padrão
  saveConfig(defaultConfig);
  return defaultConfig;
};

export const saveConfig = (config: AppConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const updateActiveYear = (year: number): void => {
  const config = loadConfig();
  config.activeYear = year;
  saveConfig(config);
};

// --- Reservas ---
export const loadReservations = (): Reservation[] => {
  const stored = localStorage.getItem(RESERVATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveReservations = (reservations: Reservation[]): void => {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
};

export const createReservation = (data: {
  equipmentId: EquipmentId;
  date: string;
  startTime?: string;
  endTime?: string;
  requesterName: string;
  requesterEmail?: string;
  purpose?: string;
}): Reservation => {
  const reservations = loadReservations();
  const config = loadConfig();

  const newReservation: Reservation = {
    id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    year: config.activeYear,
    equipmentId: data.equipmentId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    requesterName: data.requesterName,
    requesterEmail: data.requesterEmail,
    purpose: data.purpose,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  reservations.push(newReservation);
  saveReservations(reservations);
  return newReservation;
};

export const approveReservation = (id: string, adminName: string = 'Admin'): void => {
  const reservations = loadReservations();
  const index = reservations.findIndex(r => r.id === id);
  if (index !== -1) {
    reservations[index].status = 'APPROVED';
    reservations[index].decidedAt = new Date().toISOString();
    reservations[index].decidedBy = adminName;
    saveReservations(reservations);
  }
};

export const rejectReservation = (id: string, adminName: string = 'Admin', note?: string): void => {
  const reservations = loadReservations();
  const index = reservations.findIndex(r => r.id === id);
  if (index !== -1) {
    reservations[index].status = 'REJECTED';
    reservations[index].decidedAt = new Date().toISOString();
    reservations[index].decidedBy = adminName;
    reservations[index].decisionNote = note;
    saveReservations(reservations);
  }
};

// --- Equipamentos (opcional, pode ser hardcoded) ---
export const loadEquipments = (): Equipment[] => {
  const stored = localStorage.getItem(EQUIPMENTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultEquipments;
    }
  }
  // Salvar padrão na primeira vez
  localStorage.setItem(EQUIPMENTS_KEY, JSON.stringify(defaultEquipments));
  return defaultEquipments;
};

export const saveEquipments = (equipments: Equipment[]): void => {
  localStorage.setItem(EQUIPMENTS_KEY, JSON.stringify(equipments));
};

// --- Utilitários de consulta ---
export const getApprovedReservationsForYear = (year: number): Reservation[] => {
  const all = loadReservations();
  return all.filter(r => r.year === year && r.status === 'APPROVED');
};

export const getPendingReservationsForYear = (year: number): Reservation[] => {
  const all = loadReservations();
  return all.filter(r => r.year === year && r.status === 'PENDING');
};

export const getReservationsForEquipmentOnDate = (
  equipmentId: EquipmentId,
  date: string,
  year: number
): Reservation[] => {
  const all = loadReservations();
  return all.filter(
    r => r.equipmentId === equipmentId && r.date === date && r.year === year && r.status === 'APPROVED'
  );
};

export const getReservationsForEquipmentYear = (
  equipmentId: EquipmentId,
  year: number
): Reservation[] => {
  const all = loadReservations();
  return all.filter(r => r.equipmentId === equipmentId && r.year === year && r.status === 'APPROVED');
};

// --- Estatísticas para gráfico ---
export const getEquipmentUsageStats = (year: number): { equipmentId: EquipmentId; usageCount: number }[] => {
  const stats: Map<EquipmentId, number> = new Map();

  // Contar dias únicos com reservas aprovadas por equipamento
  const all = loadReservations().filter(r => r.year === year && r.status === 'APPROVED');
  const daysByEquipment = new Map<EquipmentId, Set<string>>();

  all.forEach(r => {
    if (!daysByEquipment.has(r.equipmentId)) {
      daysByEquipment.set(r.equipmentId, new Set());
    }
    daysByEquipment.get(r.equipmentId)!.add(r.date);
  });

  daysByEquipment.forEach((days, equipmentId) => {
    stats.set(equipmentId, days.size);
  });

  // Garantir que todos os equipamentos apareçam (mesmo sem uso)
  const equipments = loadEquipments();
  equipments.forEach(eq => {
    if (!stats.has(eq.id as EquipmentId)) {
      stats.set(eq.id as EquipmentId, 0);
    }
  });

  return Array.from(stats.entries()).map(([equipmentId, usageCount]) => ({
    equipmentId,
    usageCount,
  }));
};
