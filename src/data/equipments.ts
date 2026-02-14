import type { Equipment } from '../types/equipment';

export const equipments: Equipment[] = [
  {
    id: 'growth_chamber',
    name: 'Câmara de crescimento',
    description: 'Câmara para cultivo controlado',
    icon: '🌱',
    color: 'bg-green-100',
  },
  {
    id: 'irga',
    name: 'IRGA',
    description: 'Equipamento de análise de gases',
    icon: '🔬',
    color: 'bg-blue-100',
  },
  {
    id: 'greenhouse',
    name: 'Casa de vegetação',
    description: 'Estufa para plantas',
    icon: '🌿',
    color: 'bg-emerald-100',
  },
];

export const getEquipmentById = (id: string): Equipment | undefined => {
  return equipments.find(eq => eq.id === id);
};
