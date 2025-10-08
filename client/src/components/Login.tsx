import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      // simple front-end validation
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail) {
        setEmailError('Email is required');
      }
      if (!trimmedPassword) {
        setPasswordError('Password is required');
      }
      if (!trimmedEmail || !trimmedPassword) {
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedEmail)) {
        setEmailError('Enter a valid email address');
        return;
      }

      await login(trimmedEmail, trimmedPassword);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user || !user.role) {
        setError('Login succeeded but user role missing. Please try again.');
        return;
      }
      navigate(`/${user.role}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            padding: 4, 
            width: '100%',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15) !important'
          }}
        >
          <Typography 
            component="h1" 
            variant="h4" 
            align="center" 
            gutterBottom
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #3f51b5, #f50057)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Payroll Management System
          </Typography>
          <Typography 
            component="h2" 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            gutterBottom
            sx={{ mb: 3 }}
          >
            Sign In to Your Account
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              error={Boolean(emailError)}
              helperText={emailError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={Boolean(passwordError)}
              helperText={passwordError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(63, 81, 181, 0.4)',
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ 
            mt: 3, 
            p: 2.5, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
              Demo Credentials:
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 0.5 }}>
              Admin: admin@payroll.com / password
            </Typography>
            <Typography variant="body2" align="center">
              Employee: john.doe@company.com / password
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;