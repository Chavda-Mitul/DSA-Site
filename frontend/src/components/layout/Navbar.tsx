import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    logout();
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleTopicsClick = () => {
    navigate('/topics');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const renderAuthenticatedContent = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        color="inherit"
        onClick={handleTopicsClick}
        sx={{ color: 'text.primary' }}
      >
        Topics
      </Button>
      <Button
        color="inherit"
        onClick={handleDashboardClick}
        sx={{ color: 'text.primary' }}
      >
        Dashboard
      </Button>
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            edge="start"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { handleTopicsClick(); handleMenuClose(); }}>Topics</MenuItem>
            <MenuItem onClick={() => { handleDashboardClick(); handleMenuClose(); }}>Dashboard</MenuItem>
            <MenuItem disabled>{user?.name}</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          onClick={handleLogout}
          variant="contained"
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          Logout
        </Button>
      )}
    </Box>
  );

  const renderUnauthenticatedContent = () => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        color="inherit"
        onClick={handleLoginClick}
        variant="text"
        sx={{ color: 'white' }}
      >
        Login
      </Button>
      <Button
        color="inherit"
        onClick={handleRegisterClick}
        variant="contained"
        sx={{
          backgroundColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
      >
        Register
      </Button>
    </Box>
  );

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          py: 1,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          onClick={() => navigate('/topics')}
          sx={{
            fontWeight: 700,
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          DSA Sheet
        </Typography>

        {isAuthenticated
          ? renderAuthenticatedContent()
          : renderUnauthenticatedContent()}
      </Toolbar>
    </AppBar>
  );
};
