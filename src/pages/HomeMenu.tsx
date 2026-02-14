import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EquipmentCard } from '../components/EquipmentCard';
import { equipments } from '../data/equipments';

export const HomeMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleOpenEquipment = (id: string) => {
    navigate(`/equipamento/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Agendamentos de Equipamentos
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o equipamento para abrir o calendário:
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {equipments.map(equipment => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              onOpen={handleOpenEquipment}
            />
          ))}
        </div>

        <div className="mt-8 md:mt-10 p-4 md:p-5 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl shadow-md">
          <p className="text-sm md:text-base text-yellow-900 text-center font-medium">
            ⚠️ Reservas aparecem no calendário somente após aprovação.
          </p>
        </div>

        <div className="mt-6 md:mt-8 text-center">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-base md:text-lg transition-colors"
          >
            <span>🔐</span>
            <span>Acessar Painel Admin</span>
            <span>→</span>
          </a>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Sistema de Reserva de Equipamentos v1.0</p>
        </footer>
      </div>
    </div>
  );
};
