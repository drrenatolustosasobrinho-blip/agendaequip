import React, { useState, useEffect } from 'react';
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
import {
  getAppConfig,
  setActiveYear,
  listPendingReservations,
  listApprovedReservations,
  decideReservation,
  signOut,
} from '../services/api';
import { supabase } from '../services/supabaseClient';
import { getEquipmentById } from '../data/equipments';
import { EquipmentOccupancyCard } from '../components/EquipmentOccupancyCard';

const equipmentNames: Record<string, string> = {
  growth_chamber: 'Câmara de crescimento',
  irga: 'IRGA',
  greenhouse: 'Casa de vegetação',
};

export const AdminDashboard: React.FC = () => {
  const [config, setConfig] = useState<{ activeYear: number; setupDone: boolean } | null>(null);
  const [pendingReservations, setPendingReservations] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  // Estados para bootstrap e login
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');
  const [bootstrapMessage, setBootstrapMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal novo ano
  const [showNewYearConfirm, setShowNewYearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Carregar config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await getAppConfig();
        setConfig(cfg);
        setSelectedYear(cfg.activeYear);
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Carregar pendentes quando logged e ano muda
  useEffect(() => {
    if (!session) return;
    const loadPending = async () => {
      try {
        const pending = await listPendingReservations(selectedYear);
        setPendingReservations(pending);
      } catch (err) {
        console.error(err);
      }
    };
    loadPending();
  }, [session, selectedYear]);

  // Carregar estatísticas (gráfico)
  useEffect(() => {
    if (!session) return;
    const loadStats = async () => {
      try {
        const equipmentIds = ['growth_chamber', 'irga', 'greenhouse'] as const;
        const stats = await Promise.all(
          equipmentIds.map(async (eqId) => {
            const reservations = await listApprovedReservations(eqId, selectedYear);
            const uniqueDates = new Set(reservations.map(r => r.date));
            return {
              name: equipmentNames[eqId] || eqId,
              'Dias com reservas': uniqueDates.size,
            };
          })
        );
        setChartData(stats);
      } catch (err) {
        console.error(err);
      }
    };
    loadStats();
  }, [session, selectedYear]);

  if (loading) {
    return (
      <div className="equip-admin-wrap min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="equip-admin-wrap min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-red-600">Erro ao carregar configuração.</div>
      </div>
    );
  }

  // SETUP INICIAL (bootstrap)
  if (!config.setupDone) {
    return (
      <div className="equip-admin-wrap min-h-screen bg-gray-100 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Configuração Inicial</h1>
          <p className="text-sm text-gray-600 mb-4">Crie o primeiro administrador.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email do admin</label>
              <input
                type="email"
                value={bootstrapEmail}
                onChange={e => setBootstrapEmail(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="admin@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha do admin</label>
              <input
                type="password"
                value={bootstrapPassword}
                onChange={e => setBootstrapPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="Senha forte"
              />
            </div>
            <button
              onClick={async () => {
                try {
                  setBootstrapMessage(null);
                  const res = await fetch('/api/bootstrap-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bootstrapPassword: bootstrapPassword, // deve corresponder ao env
                      adminEmail: bootstrapEmail,
                      adminPassword: bootstrapPassword,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Erro no bootstrap');
                  setBootstrapMessage({ type: 'success', text: 'Admin criado! Faça login.' });
                  // Recarregar config
                  const newCfg = await getAppConfig();
                  setConfig(newCfg);
                } catch (err: any) {
                  setBootstrapMessage({ type: 'error', text: err.message });
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Criar admin
            </button>
            {bootstrapMessage && (
              <div className={`p-3 rounded ${bootstrapMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {bootstrapMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGIN
  if (!session) {
    return (
      <div className="equip-admin-wrap min-h-screen bg-gray-100 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Login Admin</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password: loginPassword,
                  });
                  if (error) throw error;
                  setLoginError(null);
                } catch (err: any) {
                  setLoginError(err.message);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Entrar
            </button>
            {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  const handleLogout = async () => {
    await signOut();
    setSession(null);
  };

  const handleStartNewYear = () => setShowNewYearConfirm(true);
  const handleCloseModal = () => { setShowNewYearConfirm(false); setConfirmText(''); };

  const handleConfirmNewYear = async () => {
    if (confirmText.trim() !== 'INICIAR') {
      alert('Digite EXATAMENTE "INICIAR" para confirmar.');
      return;
    }
    try {
      await setActiveYear(config.activeYear + 1);
      const newCfg = await getAppConfig();
      setConfig(newCfg);
      setSelectedYear(newCfg.activeYear);
      setPendingReservations([]);
      setChartData([]);
      alert(`Ano ${newCfg.activeYear} iniciado!`);
      handleCloseModal();
    } catch (err) {
      alert('Erro ao iniciar novo ano');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await decideReservation(id, 'APPROVE');
      setPendingReservations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Erro ao aprovar');
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt('Motivo da rejeição (opcional):');
    try {
      await decideReservation(id, 'REJECT', note || undefined);
      setPendingReservations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Erro ao rejeitar');
    }
  };

  return (
    <div className="equip-admin-wrap min-h-screen bg-gray-100 py-4 px-2 md:py-8 md:px-4">
      {/* Barra de alerta */}
      <div className="dangerBar">
        <div className="dangerText">
          <strong>ATENÇÃO:</strong> Só clique em <strong>“Iniciar novo ano”</strong> depois de coletar estatísticas do ano anterior.
        </div>
        <button className="dangerBtn" onClick={handleStartNewYear}>🆕 Iniciar novo ano</button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Painel Admin</h1>

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
              {[config.activeYear, selectedYear].filter((v, i, a) => a.indexOf(v) === i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button onClick={handleLogout} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm">
            Sair
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
        {/* Gráfico */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Uso por Equipamento</h2>
          <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">Dias com reservas aprovadas em {selectedYear}</p>
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

        {/* Resumo */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Resumo</h2>
          <div className="space-y-2 md:space-y-4">
            <div className="flex justify-between items-center p-2 md:p-4 bg-blue-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Aprovadas (dias únicos):</span>
              <span className="text-xl md:text-2xl font-bold text-blue-600">{chartData.reduce((sum, item) => sum + item['Dias com reservas'], 0)}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-4 bg-yellow-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Pendentes:</span>
              <span className="text-xl md:text-2xl font-bold text-yellow-600">{pendingReservations.length}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-4 bg-gray-50 rounded flex-col sm:flex-row gap-2">
              <span className="font-medium text-gray-700 text-sm">Ano ativo:</span>
              <span className="text-xl md:text-2xl font-bold text-gray-600">{config.activeYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de pendências */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6 mb-4">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Fila de Pendências ({selectedYear})</h2>
        {pendingReservations.length === 0 ? (
          <p className="text-gray-500 text-sm md:text-base">Nenhuma reserva pendente.</p>
        ) : (
          <div className="table-scroll -mx-2">
            <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Data</th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equip.</th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Finalidade</th>
                  <th className="px-2 md:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Horário</th>
                  <th className="px-2 md:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingReservations.map(res => {
                  const eq = getEquipmentById(res.equipment_id as any);
                  const [y, m, d] = res.date.split('-');
                  const formattedDate = `${d}/${m}/${y}`;
                  return (
                    <tr key={res.id}>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">{formattedDate}</td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">{eq?.name?.substring(0, 12) || res.equipment_id}</td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 truncate">{res.requester_name}</td>
                      <td className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-500 truncate hidden md:table-cell">{res.purpose || '-'}</td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden sm:table-cell">{res.start_time && res.end_time ? `${res.start_time} - ${res.end_time}` : '-'}</td>
                      <td className="px-2 md:px-4 py-2 whitespace-nowrap text-right text-xs md:text-sm font-medium flex-shrink-0">
                        <button onClick={() => handleApprove(res.id)} className="text-green-600 hover:text-green-900 mr-2" title="Aprovar">✅</button>
                        <button onClick={() => handleReject(res.id)} className="text-red-600 hover:text-red-900" title="Reprovar">❌</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Taxa de ocupação */}
      <div className="mt-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Taxa de Ocupação no Ano</h2>
        <div className="occ-grid">
          {chartData.map(stat => (
            <EquipmentOccupancyCard
              key={stat.name}
              name={stat.name}
              occupiedDays={stat['Dias com reservas']}
              year={selectedYear}
            />
          ))}
        </div>
      </div>

      {/* Modal confirmação novo ano */}
      {showNewYearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '90%', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 700 }}>Confirmação necessária</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#374151' }}>Esta ação inicia um novo ano. Confirme apenas se já coletou estatísticas do ano anterior.</p>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>Digite <strong>INICIAR</strong> para confirmar:</p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Digite INICIAR"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', marginBottom: '16px', boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button
                onClick={handleConfirmNewYear}
                disabled={confirmText.trim() !== 'INICIAR'}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #b02a37', background: confirmText.trim() === 'INICIAR' ? '#dc3545' : '#fca5a5', color: '#fff', fontWeight: 700, cursor: confirmText.trim() === 'INICIAR' ? 'pointer' : 'not-allowed' }}
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
