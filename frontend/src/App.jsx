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
const ForexTrade = lazy(() => import('./pages/ForexTrade'));
const TradePage = lazy(() => import('./pages/TradePage'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Recovery = lazy(() => import('./pages/Recovery'));
const NewCoins = lazy(() => import('./pages/NewCoins'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Layout = lazy(() => import('./components/Layout'));
const AdminShell = lazy(() => import('./components/AdminShell'));
const AgentShell = lazy(() => import('./components/AgentShell'));
const Agent = lazy(() => import('./pages/Agent'));

// Detect chunk-load errors caused by stale cache after a new deployment
function isChunkLoadError(error) {
  const msg = error?.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed')
  );
}

// Error Boundary — catches render crashes and shows the error on screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }
  componentDidCatch(error, info) {
    if (isChunkLoadError(error)) {
      // Auto-reload once to pick up the new chunks — user never sees the crash
      if (!sessionStorage.getItem('chunk_reload')) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
      return;
    }
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      // While reloading for a chunk error, show the normal loading screen
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center"
            style={{ background: 'linear-gradient(160deg, #071d23 0%, #0f3e45 55%, #071d23 100%)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#EE8267', borderTopColor: 'transparent' }} />
              <p className="text-xs text-white/40 tracking-widest uppercase">Updating…</p>
            </div>
          </div>
        );
      }
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
  <div className="min-h-screen flex flex-col items-center justify-center"
    style={{ background: 'linear-gradient(160deg, #071d23 0%, #0f3e45 55%, #071d23 100%)' }}>

    {/* Ambient glow */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 480, height: 480,
        background: 'radial-gradient(circle, rgba(238,130,103,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '20%',
        width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(10,224,208,0.08) 0%, transparent 70%)',
      }} />
    </div>

    {/* Logo */}
    <div className="relative flex flex-col items-center gap-6">
      {/* CEX.IO SVG logo with pulse ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full animate-ping"
          style={{ background: 'rgba(238,130,103,0.12)', animationDuration: '1.8s' }} />
        <div className="relative w-16 h-16 rounded-[22px] flex items-center justify-center shadow-[0_0_40px_rgba(238,130,103,0.25)]"
          style={{ background: 'linear-gradient(135deg, #0f3e45 0%, #185B64 100%)', border: '1.5px solid rgba(10,224,208,0.25)' }}>
          <svg viewBox="0 0 46 44" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="#0AE0D0" points="44.359,14.556 44.359,9.089 35.868,9.089 41.334,14.556"/>
            <polygon fill="#0AE0D0" points="35.551,34.119 44.359,34.119 44.359,28.652 41.018,28.652"/>
            <path fill="#0AE0D0" d="M34.198,28.652H22.625c-3.436,0-6.232-3.161-6.232-7.047c0-3.887,2.796-7.049,6.232-7.049h11.89l-5.467-5.467h-6.422c-6.451,0-11.699,5.615-11.699,12.516c0,6.9,5.248,12.514,11.699,12.514h6.181l-0.037-0.035L34.198,28.652z"/>
            <path fill="#0AE0D0" d="M38.689,18.73l-15.78,0.141c-1.509,0.014-2.722,1.248-2.709,2.758c0.014,1.501,1.234,2.709,2.733,2.709c0.008,0,0.017,0,0.025,0l15.695-0.141l2.751-2.751L38.689,18.73z"/>
            <path fill="#0AE0D0" d="M20.931,37.742c-8.029,0-14.561-7.24-14.561-16.137c0-8.898,6.531-16.138,14.561-16.138h23.884V0H20.931C9.888,0,0.903,9.692,0.903,21.605c0,11.913,8.984,21.604,20.028,21.604h23.884v-5.467H20.931z"/>
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-[28px] font-light tracking-tight text-white">CEX</span>
          <span className="text-[28px] font-light text-white/40">.IO</span>
        </div>
        <p className="text-xs tracking-[0.22em] uppercase text-white/30">Exchange Platform</p>
      </div>

      {/* Animated bar loader */}
      <div className="flex items-end gap-1.5 h-8 mt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}
            className="w-1.5 rounded-full"
            style={{
              background: i % 2 === 0 ? '#EE8267' : '#0AE0D0',
              height: '100%',
              animation: `barPulse 1.1s ease-in-out ${i * 0.15}s infinite`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs text-white/35 tracking-widest uppercase mt-1">{label}</p>
    </div>

    <style>{`
      @keyframes barPulse {
        0%, 100% { transform: scaleY(0.25); }
        50% { transform: scaleY(1); }
      }
    `}</style>
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
      <Route path="/forex"  element={<RouteContent label="Loading forex trading..."><ForexTrade /></RouteContent>} />
      <Route path="/trade"  element={<RouteContent label="Loading trading desk..."><TradePage /></RouteContent>} />
      <Route path="/profile" element={<RouteContent label="Loading profile..."><Profile /></RouteContent>} />
      <Route path="/support" element={<RouteContent label="Loading support..."><CustomerService /></RouteContent>} />
      <Route path="/transactions" element={<RouteContent label="Loading transactions..."><Transactions /></RouteContent>} />
      <Route path="/transfer" element={<RouteContent label="Loading transfers..."><Transfer /></RouteContent>} />
      <Route path="/recovery" element={<RouteContent label="Loading recovery..."><Recovery /></RouteContent>} />
      <Route path="/new-coins" element={<RouteContent label="Loading new coins..."><NewCoins /></RouteContent>} />
      <Route path="/withdraw" element={<RouteContent label="Loading withdrawals..."><Withdraw /></RouteContent>} />
      <Route path="/about" element={<RouteContent label="Loading about..."><AboutUs /></RouteContent>} />
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
