import React, { useState } from 'react';

interface Props {
  equipmentName: string;
  date: string;
  onSubmit: (data: {
    requesterName: string;
    requesterEmail?: string;
    purpose?: string;
    startTime?: string;
    endTime?: string;
  }) => void;
  onCancel: () => void;
}

export const ReservationForm: React.FC<Props> = ({
  equipmentName,
  date,
  onSubmit,
  onCancel,
}) => {
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    onSubmit({
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim() || undefined,
      purpose: purpose.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl max-w-full md:max-w-md w-full p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">Solicitar horário</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600 mb-2 text-sm">
          Equipamento: <strong className="text-sm">{equipmentName}</strong>
        </p>
        <p className="text-gray-600 mb-4 text-sm">
          Data: <strong className="text-sm">{date}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700">Nome *</label>
            <input
              type="text"
              value={requesterName}
              onChange={e => setRequesterName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={requesterEmail}
              onChange={e => setRequesterEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm text-gray-700">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-gray-700">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700">Finalidade</label>
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
