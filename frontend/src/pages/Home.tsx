import { useNavigate } from 'react-router-dom';
import { Typography, Button, Stack, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Continue your DSA journey
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        DSA Sheet Application
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Master Data Structures and Algorithms with structured practice
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
        >
          Login to continue
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/register')}
        >
          Register
        </Button>
      </Stack>
    </Paper>
  );
};
