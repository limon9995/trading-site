import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trading = lazy(() => import('./pages/Trading'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Admin = lazy(() => import('./pages/Admin'));
const Landing = lazy(() => import('./pages/Landing'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Plans = lazy(() => import('./pages/Plans'));
const Settings = lazy(() => import('./pages/Settings'));
const Deposit = lazy(() => import('./pages/Deposit'));
const Profile = lazy(() => import('./pages/Profile'));
const CustomerService = lazy(() => import('./pages/CustomerService'));
const BinaryTrade = lazy(() => import('./pages/BinaryTrade'));
const TradePage = lazy(() => import('./pages/TradePage'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Recovery = lazy(() => import('./pages/Recovery'));
const NewCoins = lazy(() => import('./pages/NewCoins'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Layout = lazy(() => import('./components/Layout'));
const AdminShell = lazy(() => import('./components/AdminShell'));
const AgentShell = lazy(() => import('./components/AgentShell'));
const Agent = lazy(() => import('./pages/Agent'));

// Error Boundary — catches render crashes and shows the error on screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-light-bg flex items-center justify-center p-6">
          <div className="cex-surface w-full max-w-lg rounded-[30px] p-8">
            <h2 className="mb-3 text-xl font-semibold text-red-trade">Something went wrong</h2>
            <pre className="overflow-auto whitespace-pre-wrap rounded-[20px] bg-light-input p-4 text-xs text-text-secondary">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route guards
const FullScreenLoader = ({ label = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center px-6"
    style={{ background: 'radial-gradient(circle at top left, rgba(24,91,100,0.12), transparent 22%), linear-gradient(180deg, #fbfcfd 0%, #f2f3f5 100%)' }}>
    <div className="cex-surface rounded-[28px] px-8 py-7 text-center min-w-[240px]">
      <div className="w-11 h-11 mx-auto border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary mt-4">{label}</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader label="Checking your account..." />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader label="Loading admin access..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const AgentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader label="Loading agent access..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'agent') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader label="Preparing authentication..." />;
  if (!user) return children;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'agent') return <Navigate to="/agent" replace />;
  return <Navigate to="/dashboard" replace />;
};

const RouteContent = ({ children, label = 'Loading page...' }) => (
  <Suspense fallback={<FullScreenLoader label={label} />}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </Suspense>
);

const AppRoutes = () => (
  <Routes>
    {/* Public landing page */}
    <Route path="/" element={<RouteContent label="Loading homepage..."><Landing /></RouteContent>} />
    <Route path="/login" element={<PublicRoute><RouteContent label="Loading sign in..."><Login /></RouteContent></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RouteContent label="Loading sign up..."><Register /></RouteContent></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><RouteContent label="Loading recovery..."><ForgotPassword /></RouteContent></PublicRoute>} />
    {/* Protected routes inside Layout */}
    <Route element={<ProtectedRoute><RouteContent label="Loading workspace..."><Layout /></RouteContent></ProtectedRoute>}>
      <Route path="/dashboard" element={<RouteContent label="Loading dashboard..."><Dashboard /></RouteContent>} />
      <Route path="/trading" element={<RouteContent label="Loading markets..."><Trading /></RouteContent>} />
      <Route path="/trading/:symbol" element={<RouteContent label="Loading market..."><Trading /></RouteContent>} />
      <Route path="/wallet" element={<RouteContent label="Loading wallet..."><Wallet /></RouteContent>} />
      <Route path="/plans" element={<RouteContent label="Loading plans..."><Plans /></RouteContent>} />
      <Route path="/settings" element={<RouteContent label="Loading settings..."><Settings /></RouteContent>} />
      <Route path="/deposit" element={<RouteContent label="Loading deposits..."><Deposit /></RouteContent>} />
      <Route path="/binary" element={<RouteContent label="Loading binary trading..."><BinaryTrade /></RouteContent>} />
      <Route path="/trade"  element={<RouteContent label="Loading trading desk..."><TradePage /></RouteContent>} />
      <Route path="/profile" element={<RouteContent label="Loading profile..."><Profile /></RouteContent>} />
      <Route path="/support" element={<RouteContent label="Loading support..."><CustomerService /></RouteContent>} />
      <Route path="/transactions" element={<RouteContent label="Loading transactions..."><Transactions /></RouteContent>} />
      <Route path="/transfer" element={<RouteContent label="Loading transfers..."><Transfer /></RouteContent>} />
      <Route path="/recovery" element={<RouteContent label="Loading recovery..."><Recovery /></RouteContent>} />
      <Route path="/new-coins" element={<RouteContent label="Loading new coins..."><NewCoins /></RouteContent>} />
      <Route path="/withdraw" element={<RouteContent label="Loading withdrawals..."><Withdraw /></RouteContent>} />
    </Route>
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <RouteContent label="Loading admin panel...">
            <AdminShell>
              <Admin />
            </AdminShell>
          </RouteContent>
        </AdminRoute>
      }
    />
    <Route
      path="/agent"
      element={
        <AgentRoute>
          <RouteContent label="Loading agent panel...">
            <AgentShell>
              <Agent />
            </AgentShell>
          </RouteContent>
        </AgentRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
