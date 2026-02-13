import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { theme } from './theme/theme';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Component to handle auth initialization
const AuthInitializer = () => {
  const { initializeAuth, initializing } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show full-page loading spinner only during initialization
  if (initializing) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return <AppRoutes />;
};

// Component to show toast when session expires
const SessionHandler = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      enqueueSnackbar(customEvent.detail.message, { variant: 'warning' });
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, [enqueueSnackbar]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        style={{ zIndex: 9999 }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <ProgressProvider>
                <SessionHandler />
                <AuthInitializer />
              </ProgressProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </SnackbarProvider>
    </ErrorBoundary>
  );
}

export default App;
