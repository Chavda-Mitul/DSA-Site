import { useState, type FormEvent } from 'react';
import { Box, Button, Link, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { AuthLayout } from '../components/AuthLayout';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';

export const Login = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous error
    setError('');
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      const msg = 'Please fill in all fields';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      
      navigate('/topics', { replace: true });
    } catch (err: any) {
      // Extract and display error
      const message = extractErrorMessage(err, 'Login failed. Please try again.');
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
      
      // Clear password field on error for security
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue to your account
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
          autoFocus
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={submitting}
          sx={{ mt: 1 }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Login'
          )}
        </Button>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            Register
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
};
