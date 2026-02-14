# Sistema de Reserva de Equipamentos

Aplicação web para gerenciamento de reservas anuais de equipamentos laboratoriais.

## Funcionalidades

- **Menu de Equipamentos**: Escolha entre 3 equipamentos (Câmara de crescimento, IRGA, Casa de vegetação)
- **Calendário Interativo**: Visualize reservas aprovadas por dia
- **Solicitação de Reserva**: Formulário para solicitar horários (status PENDING)
- **Painel Admin**: Aprova/rejeita reservas e visualiza estatísticas de uso
- **Controle Anual**: Sistema opera por "ano ativo", com possibilidade de iniciar novo ano
- **Persistência**: Dados salvos no LocalStorage do navegador

## Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- React Router DOM

## Como rodar localmente

### Desenvolvimento

```bash
cd reserva-equipamentos
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173/`

### Produção (build)

```bash
npm run build
```

Os arquivos estáticos serão gerados na pasta `dist/`. Para servir:

```bash
npx serve dist
```

## Rotas

- `/` - Menu principal de equipamentos
- `/equipamento/:id` - Calendário do equipamento (IDs: growth_chamber, irga, greenhouse)
- `/admin` - Painel administrativo

## Fluxo de uso

1. **Usuário**:
   - Acessa a página inicial e escolhe um equipamento
   - No calendário, clica em uma data para ver detalhes
   - Preenche formulário para solicitar reserva
   - Recebe mensagem: "Agendamento realizado, aguarde aprovação do adm"

2. **Admin**:
   - Acessa `/admin`
   - Visualiza fila de pendências
   - Aprova ou rejeita reservas
   - Após aprovação, a reserva aparece automaticamente no calendário público
   - Pode iniciar novo ano (incrementa activeYear e "zera" o sistema para o novo ano)

## Estrutura de pastas

```
src/
├── components/
│   ├── DayCard.tsx
│   ├── DayDetailsPanel.tsx
│   ├── EquipmentCard.tsx
│   └── ReservationForm.tsx
├── data/
│   └── equipments.ts
├── pages/
│   ├── AdminDashboard.tsx
│   ├── EquipmentCalendarPage.tsx
│   └── HomeMenu.tsx
├── services/
│   └── storage.ts
├── types/
│   ├── equipment.ts
│   └── reservation.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Modelo de dados

### Equipment
- `id`: EquipmentId ('growth_chamber' | 'irga' | 'greenhouse')
- `name`: string
- `description`: string (opcional)

### Reservation
- `id`: string
- `year`: number (ano ativo)
- `equipmentId`: EquipmentId
- `date`: string (YYYY-MM-DD)
- `startTime?`: string (HH:mm)
- `endTime?`: string (HH:mm)
- `requesterName`: string
- `requesterEmail?`: string
- `purpose?`: string
- `status`: 'PENDING' | 'APPROVED' | 'REJECTED'
- `createdAt`: ISO string
- `decidedAt?`: ISO string
- `decidedBy?`: string
- `decisionNote?`: string

## Armazenamento

Dados persistidos no LocalStorage com chaves:

- `app_config`: `{ activeYear: number }`
- `reservations`: array de Reservation
- `equipments`: array de Equipment (opcional, default hardcoded)

## Próximos passos (sugestões)

- Autenticação de admin
- Backend real (substituir LocalStorage por API)
- Notificações por email
- Filtros avançados no admin
- Exportação de relatórios

---

Desenvolvido para Renato Homem ✨
