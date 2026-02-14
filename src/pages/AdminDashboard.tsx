import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EquipmentOccupancyCard } from '../components/EquipmentOccupancyCard';
import {
  loadConfig,
  updateActiveYear,
  loadReservations,
  approveReservation,
  rejectReservation,
  getPendingReservationsForYear,
  getApprovedReservationsForYear,
  getEquipmentUsageStats,
} from '../services/storage';
import { getEquipmentById } from '../data/equipments';

const equipmentNames: Record<string, string> = {
  growth_chamber: 'Câmara de crescimento',
  irga: 'IRGA',
  greenhouse: 'Casa de vegetação',
};

// Senha do admin (altere aqui se necessário)
const ADMIN_PASSWORD = 'admin123';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [config, setConfig] = useState(loadConfig());
  const [selectedYear, setSelectedYear] = useState(config.activeYear);
  const [pendingReservations, setPendingReservations] = useState(getPendingReservationsForYear(selectedYear));
  const [approvedReservations, setApprovedReservations] = useState(getApprovedReservationsForYear(selectedYear));

  // Modal de confirmação de novo ano
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Recarregar pendentes quando o ano muda
  useEffect(() => {
    setPendingReservations(getPendingReservationsForYear(selectedYear));
    setApprovedReservations(getApprovedReservationsForYear(selectedYear));
  }, [selectedYear]);

  // Se não autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 text-center">Acesso Admin</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
              if (passwordInput.value === ADMIN_PASSWORD) {
                localStorage.setItem('admin_authenticated', 'true');
                setIsAuthenticated(true);
              } else {
                alert('Senha incorreta');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                name="password"
                type="password"
                autoFocus
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Entrar
            </button>
          </form>
          <p className="mt-4 text-center text-gray-600 text-sm">
            <a href="/" className="text-blue-600 hover:underline">← Voltar ao site</a>
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleStartNewYear = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmNewYear = () => {
    if (confirmText.trim() !== 'INICIAR') {
      alert('Digite EXATAMENTE "INICIAR" para confirmar.');
      return;
    }
    const newYear = config.activeYear + 1;
    updateActiveYear(newYear);
    setConfig({ ...config, activeYear: newYear });
    setSelectedYear(newYear);
    setPendingReservations([]);
    alert(`Ano ${newYear} iniciado com sucesso! Lembre-se de coletar as estatísticas do ano anterior antes de proseguir.`);
    setShowConfirmModal(false);
    setConfirmText('');
  };

  const handleApprove = (id: string) => {
    approveReservation(id, 'Admin');
    setPendingReservations(prev => prev.filter(r => r.id !== id));
    alert('Reserva aprovada!');
  };

  const handleReject = (id: string) => {
    const note = prompt('Motivo da rejeição (opcional):');
    rejectReservation(id, 'Admin', note === null ? undefined : note);
    setPendingReservations(prev => prev.filter(r => r.id !== id));
    alert('Reserva rejeitada!');
  };

  const handleCancelApproved = (id: string) => {
    if (window.confirm('Cancelar esta reserva aprovada?')) {
      rejectReservation(id, 'Admin', 'Cancelada pelo admin');
      setApprovedReservations(prev => prev.filter(r => r.id !== id));
      alert('Reserva cancelada!');
    }
  };

  // Gráfico de uso (dias com reservas aprovadas por equipamento)
  const chartData = useMemo(() => {
    const stats = getEquipmentUsageStats(selectedYear);
    const data = stats.map(stat => ({
      name: equipmentNames[stat.equipmentId] || stat.equipmentId,
      'Dias com reservas': stat.usageCount,
    }));
    console.log('chartData:', data);
    console.log('stats raw:', stats);
    console.log('selectedYear:', selectedYear);
    return data;
  }, [selectedYear]);

  // Lista de anos possíveis (ano atual e anteriores)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const allReservations = loadReservations();
    allReservations.forEach(r => years.add(r.year));
    years.add(config.activeYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [config.activeYear]);

  // debug: mostrar quantidade total de reservas
  const allReservations = loadReservations();
  console.log('Total reservas salvas:', allReservations.length);
  console.log('Pendentes no ano selecionado:', pendingReservations.length);

  return (
    <div className="equip-admin-wrap min-h-screen bg-gray-100 py-4 px-2 md:py-8 md:px-4">
      {/* Cabeçalho */}
      <div className="equip-admin-toolbar flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-6 gap-2 md:gap-3">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Painel Admin</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 md:px-4 rounded text-sm"
          >
            Sair
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 md:px-6 rounded text-sm"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Controles de ano */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6 mb-3 md:mb-6">
        <div className="equip-admin-toolbar flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700 text-sm">Ano ativo:</label>
            <span className="text-base font-bold text-blue-600">{config.activeYear}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700 text-sm">Visualizar ano:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 text-sm min-w-[100px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barra de alerta - Ação perigosa */}
      <div className="dangerBar">
        <div className="dangerText">
          <strong>ATENÇÃO:</strong> Só clique em <strong>“Iniciar novo ano”</strong> depois de coletar/salvar as estatísticas do ano anterior e após a virada do ano.
        </div>
        <button className="dangerBtn" onClick={handleStartNewYear}>
          🆕 Iniciar novo ano
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Painel Admin</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
        {/* Gráfico */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Uso por Equipamento</h2>
          <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
            Número de dias com reservas aprovadas em {selectedYear}
          </p>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Dias com reservas" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Resumo</h2>
          <div className="space-y-2 md:space-y-4">
            <div className="flex justify-between items-center p-2 md:p-4 bg-blue-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Aprovadas no ano:</span>
              <span className="text-xl md:text-2xl font-bold text-blue-600">
                {allReservations.filter(r => r.year === selectedYear && r.status === 'APPROVED').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-4 bg-yellow-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Pendentes:</span>
              <span className="text-xl md:text-2xl font-bold text-yellow-600">
                {pendingReservations.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-4 bg-gray-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Total no sistema:</span>
              <span className="text-xl md:text-2xl font-bold text-gray-600">
                {allReservations.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Taxa de Ocupação por Equipamento */}
      <div className="mt-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Taxa de Ocupação no Ano</h2>
        <div className="occ-grid">
          {(() => {
            const stats = getEquipmentUsageStats(selectedYear);
            return stats.map(stat => (
              <EquipmentOccupancyCard
                key={stat.equipmentId}
                name={equipmentNames[stat.equipmentId] || stat.equipmentId}
                occupiedDays={stat.usageCount}
                year={selectedYear}
              />
            ));
          })()}
        </div>
      </div>

      {/* Fila de aprovação */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6 mb-4">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">
          Fila de Pendências ({selectedYear})
        </h2>
        {pendingReservations.length === 0 ? (
          <p className="text-gray-500 text-sm md:text-base">Nenhuma reserva pendente para este ano.</p>
        ) : (
          <div className="table-scroll -mx-2">
            <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 md:w-auto">
                    Data
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equip.
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Finalidade
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Horário
                  </th>
                  <th className="px-2 md:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingReservations.map(res => {
                  const eq = getEquipmentById(res.equipmentId);
                  const [y, m, d] = res.date.split('-');
                  const formattedDate = `${d}/${m}/${y}`;

                  return (
                    <tr key={res.id}>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {formattedDate}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {eq?.name ? eq.name.substring(0, 12) + (eq.name.length > 12 ? '...' : '') : res.equipmentId}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {res.requesterName}
                      </td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-500 truncate hidden md:table-cell">
                        {res.purpose || '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                        {res.startTime && res.endTime ? `${res.startTime} - ${res.endTime}` : '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-right text-xs md:text-sm font-medium flex-shrink-0">
                        <button
                          onClick={() => handleApprove(res.id)}
                          className="text-green-600 hover:text-green-900 mr-2 md:mr-4"
                          title="Aprovar"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => handleReject(res.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Reprovar"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reservas Aprovadas */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6 mt-3">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">
          Reservas Aprovadas ({selectedYear})
        </h2>
        {approvedReservations.length === 0 ? (
          <p className="text-gray-500 text-sm md:text-base">Nenhuma reserva aprovada neste ano.</p>
        ) : (
          <div className="table-scroll -mx-2">
            <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 md:w-auto">
                    Data
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equip.
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Finalidade
                  </th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Horário
                  </th>
                  <th className="px-2 md:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedReservations.map(res => {
                  const eq = getEquipmentById(res.equipmentId);
                  const [y, m, d] = res.date.split('-');
                  const formattedDate = `${d}/${m}/${y}`;
                  return (
                    <tr key={res.id}>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {formattedDate}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {eq?.name ? eq.name.substring(0, 12) + (eq.name.length > 12 ? '...' : '') : res.equipmentId}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">
                        {res.requesterName}
                      </td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-500 truncate hidden md:table-cell">
                        {res.purpose || '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                        {res.startTime && res.endTime ? `${res.startTime} - ${res.endTime}` : '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-right text-xs md:text-sm font-medium flex-shrink-0">
                        <button
                          onClick={() => handleCancelApproved(res.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cancelar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmação de novo ano */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '90%',
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>
              Confirmação necessária
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#374151' }}>
              Esta ação inicia um novo ano e pode zerar/arquivar dados do ano atual. Confirme apenas se você já coletou as estatísticas do ano anterior e o ano já virou.
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
              Digite <strong>INICIAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Digite INICIAR"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmText('');
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmNewYear}
                disabled={confirmText.trim() !== 'INICIAR'}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #b02a37',
                  background: confirmText.trim() === 'INICIAR' ? '#dc3545' : '#fca5a5',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: confirmText.trim() === 'INICIAR' ? 'pointer' : 'not-allowed',
                  fontSize: '0.95rem',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
