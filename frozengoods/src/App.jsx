import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Reservations from './pages/Reservations';
import Reorder from './pages/Reorder';
import Distributor from './pages/Distributor';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          closeButton 
          theme="light"
          toastOptions={{
            style: {
              background: 'white',
              color: 'black',
              border: '1px solid #e0e0e0',
            },
            success: {
              icon: '✓',
              iconTheme: {
                primary: 'black',
                secondary: 'white',
              },
            },
            error: {
              icon: '✕',
              iconTheme: {
                primary: 'black',
                secondary: 'white',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Private routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/reorder" element={<Reorder />} />
              <Route path="/distributor" element={<Distributor />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          
          {/* Redirect to dashboard by default if logged in, otherwise to login */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
