import React from 'react';
import type { Equipment } from '../types/equipment';

interface Props {
  equipment: Equipment;
  onOpen: (id: string) => void;
}

export const EquipmentCard: React.FC<Props> = ({ equipment, onOpen }) => {
  const cardColor = equipment.color || 'bg-gray-100';
  const icon = equipment.icon || '🔧';

  return (
    <div className={`${cardColor} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 md:p-8 border border-gray-200 hover:border-blue-300 h-full flex flex-col justify-between transform hover:-translate-y-1`}>
      <div className="text-center">
        <div className="text-5xl md:text-6xl mb-4">{icon}</div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{equipment.name}</h3>
        {equipment.description && (
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">{equipment.description}</p>
        )}
      </div>
      <button
        onClick={() => onOpen(equipment.id)}
        className="w-full mt-4 md:mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
      >
        <span>📅</span>
        <span>Abrir calendário</span>
      </button>
    </div>
  );
};
