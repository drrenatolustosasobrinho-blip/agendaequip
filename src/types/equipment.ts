export type EquipmentId = 'growth_chamber' | 'irga' | 'greenhouse';

export interface Equipment {
  id: EquipmentId;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}
