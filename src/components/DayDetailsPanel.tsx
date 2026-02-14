import React, { useState } from 'react';
import type { Reservation } from '../types/reservation';
import { ReservationForm } from './ReservationForm';

interface Props {
  equipmentName: string;
  date: string;
  reservations: Reservation[];
  onReservationSubmit: (data: {
    requesterName: string;
    requesterEmail?: string;
    purpose?: string;
    startTime?: string;
    endTime?: string;
  }) => void;
  onClose: () => void;
}

export const DayDetailsPanel: React.FC<Props> = ({
  equipmentName,
  date,
  reservations,
  onReservationSubmit,
  onClose,
}) => {
  const [showForm, setShowForm] = useState(false);

  const handleFormSubmit = (data: {
    requesterName: string;
    requesterEmail?: string;
    purpose?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    onReservationSubmit(data);
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full md:max-w-lg w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Detalhes do dia</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl md:text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-2 text-sm">
          <strong>Equipamento:</strong> {equipmentName}
        </p>
        <p className="text-gray-600 mb-4 text-sm">
          <strong>Data:</strong> {date}
        </p>

        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Reservas aprovadas:</h3>
        {reservations.length === 0 ? (
          <p className="text-gray-500 mb-4 text-sm">Nenhuma reserva aprovada para este dia.</p>
        ) : (
          <ul className="space-y-2 mb-4 md:mb-6">
            {reservations.map(res => (
              <li key={res.id} className="bg-green-50 border border-green-200 rounded p-2 md:p-3">
                <p className="font-medium text-green-800 text-sm">{res.requesterName}</p>
                {res.startTime && res.endTime && (
                  <p className="text-xs md:text-sm text-green-700">
                    {res.startTime} - {res.endTime}
                  </p>
                )}
                {res.purpose && <p className="text-xs md:text-sm text-gray-600">{res.purpose}</p>}
                {res.requesterEmail && (
                  <p className="text-xs md:text-sm text-gray-500">{res.requesterEmail}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {!showForm ? (
          <div className="mt-2">
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 md:px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>📅</span> Solicitar reserva
            </button>
          </div>
        ) : (
          <ReservationForm
            equipmentName={equipmentName}
            date={date}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
};
