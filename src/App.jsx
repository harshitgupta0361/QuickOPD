import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import VoiceTriage from './pages/VoiceTriage';
import NerveAI from './pages/NerveAI';
import Department from './pages/Department';
import Payment from './pages/Payment';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import Appointments from './pages/Appointments';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />

              {/* Protected Routes (Guests allowed) */}
              <Route element={<ProtectedRoute allowGuest={true} />}>
                <Route path="questionnaire" element={<NerveAI />} />
              </Route>

              {/* Protected Routes (No Guests) */}
              <Route element={<ProtectedRoute />}>
                <Route path="triage" element={<VoiceTriage />} />
                <Route path="department/:name" element={<Department />} />
                <Route path="payment" element={<Payment />} />
                <Route path="account" element={<Account />} />
                <Route path="appointments" element={<Appointments />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
