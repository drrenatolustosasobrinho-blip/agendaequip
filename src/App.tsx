import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomeMenu } from './pages/HomeMenu';
import { EquipmentCalendarPage } from './pages/EquipmentCalendarPage';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeMenu />} />
        <Route path="/equipamento/:id" element={<EquipmentCalendarPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
