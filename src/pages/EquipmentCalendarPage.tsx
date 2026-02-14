import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayCard } from '../components/DayCard';
import { getEquipmentById } from '../data/equipments';
import {
  getAppConfig,
  listApprovedReservations,
  createReservation as createReservationApi,
} from '../services/api';
import {
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const EquipmentCalendarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<{ activeYear: number }>({ activeYear: new Date().getFullYear() });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservedDatesSet, setReservedDatesSet] = useState<Set<string>>(new Set());
  const [approvedReservations, setApprovedReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const equipment = getEquipmentById(id || '');

  // Carregar config e reservas
  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await getAppConfig();
        setConfig(cfg);
        if (!id) return;
        const reservations = await listApprovedReservations(id as any, cfg.activeYear);
        setApprovedReservations(reservations);
        setReservedDatesSet(new Set(reservations.map(r => r.date)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Aplicar estilos
  useEffect(() => {
    document.querySelectorAll('.calendar-day-cell[data-date]').forEach(cell => {
      const dateStr = (cell as HTMLElement).dataset.date;
      if (!dateStr) return;

      const d = new Date(dateStr + 'T00:00:00');
      cell.classList.remove('past', 'reserved-future', 'reserved-past');

      const isPast = d < today;
      const isReserved = reservedDatesSet.has(dateStr);

      if (isPast) {
        if (isReserved) {
          cell.classList.add('reserved-past');
        } else {
          cell.classList.add('past');
        }
      } else {
        if (isReserved) {
          cell.classList.add('reserved-future');
        }
      }
    });
  }, [reservedDatesSet, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDayOfWeek = getDay(monthStart);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    return days;
  }, [currentMonth, startDayOfWeek, daysInMonth]);

  const formatDateBR = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  const formatMonthYear = (date: Date): string => {
    return `${format(date, 'MMMM', { locale: ptBR })} de ${format(date, 'yyyy')}`;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleReservationSubmit = async (data: {
    requesterName: string;
    requesterEmail?: string;
    purpose?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    if (!id || !selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      await createReservationApi({
        equipmentId: id as any,
        date: dateStr,
        startTime: data.startTime,
        endTime: data.endTime,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        purpose: data.purpose,
        year: config.activeYear,
      });
      alert('Agendamento realizado, aguarde aprovação do adm.');
      setSelectedDate(null);
      // Recarregar reservas
      const reservations = await listApprovedReservations(id as any, config.activeYear);
      setReservedDatesSet(new Set(reservations.map(r => r.date)));
    } catch (err) {
      alert('Erro ao criar reserva');
      console.error(err);
    }
  };

  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return [];
    const dateISO = format(selectedDate, 'yyyy-MM-dd');
    return approvedReservations.filter(r => r.date === dateISO);
  }, [selectedDate, approvedReservations]);

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="page">
        <div className="container">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Equipamento não encontrado</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
            >
              Voltar ao menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Cabeçalho */}
        <div className="header mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Agendar Equipamento</h1>
              <p className="text-sm md:text-base text-gray-600">
                Equipamento: <strong>{equipment.name}</strong>
              </p>
            </div>
            <div className="w-full md:w-auto">
              <button
                onClick={() => navigate('/')}
                className="w-full md:w-auto bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded text-sm"
              >
                ← Voltar ao menu
              </button>
            </div>
          </div>

          {/* Controles de mês */}
          <div className="month-controls flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded text-sm"
            >
              ◀ Anterior
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 text-center">
              {formatMonthYear(currentMonth)}
            </h2>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded text-sm"
            >
              Próximo ▶
            </button>
          </div>
        </div>

        {/* Layout principal: calendário + painéis */}
        <div className="layout">
          {/* Calendário */}
          <div className="calendarArea bg-white rounded-lg shadow-md p-2 md:p-4">
            <div className="calendarScroll">
              <table className="calendarTable">
                <thead>
                  <tr>
                    {weekDays.map(day => (
                      <th key={day} className="text-center text-xs md:text-sm font-semibold text-gray-700 py-1 md:py-2">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {calendarDays.slice(rowIndex * 7, rowIndex * 7 + 7).map((date, colIndex) => {
                        if (!date) {
                          return <td key={`empty-${rowIndex}-${colIndex}`} className="p-1 md:p-2"></td>;
                        }
                        const dateStr = formatDateBR(date);
                        const dateISO = format(date, 'yyyy-MM-dd');
                        const hasReservations = reservedDatesSet.has(dateISO);
                        const isSelected = selectedDate !== null && formatDateBR(selectedDate) === dateStr;

                        return (
                          <td key={dateISO} className="p-1 md:p-2 align-top">
                            <DayCard
                              dayName={weekDays[date.getDay()]}
                              date={dateStr}
                              dateISO={dateISO}
                              hasApprovedReservations={hasReservations}
                              isSelected={isSelected}
                              onClick={() => handleDayClick(date)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-800 flex items-center gap-2 justify-center">
                <span>⚠️</span>
                <span>Clique em uma data para ver reservas e solicitar um horário.</span>
              </p>
            </div>
          </div>

          {/* Painéis laterais */}
          <div className="sideArea space-y-4">
            {/* Detalhes do dia */}
            <div className="card bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-gray-800 mb-2">Detalhes do dia</h3>
              {selectedDate ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Data: <strong>{formatDateBR(selectedDate)}</strong>
                  </p>
                  {selectedDateReservations.length > 0 ? (
                    <ul className="text-xs md:text-sm text-gray-700 space-y-1">
                      {selectedDateReservations.map(res => (
                        <li key={res.id}>
                          {res.start_time && res.end_time ? `${res.start_time}-${res.end_time}` : 'Horário indefinido'} - {res.requester_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs md:text-sm text-gray-500">Nenhuma reserva aprovada para este dia.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecione uma data no calendário.</p>
              )}
            </div>

            {/* Formulário de solicitação */}
            <div className="card bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-gray-800 mb-2">Solicitar horário</h3>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  await handleReservationSubmit({
                    requesterName: formData.get('requesterName') as string,
                    requesterEmail: formData.get('requesterEmail') as string,
                    purpose: formData.get('purpose') as string,
                    startTime: formData.get('startTime') as string,
                    endTime: formData.get('endTime') as string,
                  });
                  e.currentTarget.reset();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    name="requesterName"
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="requesterEmail"
                    type="email"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Finalidade</label>
                  <textarea
                    name="purpose"
                    rows={2}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Para que vai usar?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Início</label>
                    <input
                      name="startTime"
                      type="time"
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fim</label>
                    <input
                      name="endTime"
                      type="time"
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded text-sm"
                >
                  Enviar solicitação
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
