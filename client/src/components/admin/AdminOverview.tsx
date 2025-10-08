import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  People as PeopleIcon,
  AccessTime as AttendanceIcon,
  EventNote as LeaveIcon,
  AccountBalance as PayrollIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  totalPayroll: number;
}

const AdminOverview: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Please log in to view dashboard data.');
      return;
    }
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      const [employeesRes, attendanceRes, leavesRes, payrollRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/attendance', {
          params: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          },
        }),
        axios.get('/api/leaves'),
        axios.get('/api/payroll', {
          params: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        }),
      ]);

      const presentToday = attendanceRes.data.filter(
        (att: any) => att.status === 'present'
      ).length;

      const pendingLeaves = leavesRes.data.filter(
        (leave: any) => leave.status === 'pending'
      ).length;

      const totalPayroll = payrollRes.data.reduce(
        (sum: number, payroll: any) => sum + payroll.net_salary,
        0
      );

      setStats({
        totalEmployees: employeesRes.data.length,
        presentToday,
        pendingLeaves,
        totalPayroll,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#3f51b5',
    },
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
    },
    {
      title: 'Pending Leaves',
      value: stats?.pendingLeaves || 0,
      icon: <LeaveIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
    },
    {
      title: 'Total Payroll (This Month)',
      value: formatINR(stats?.totalPayroll || 0),
      icon: <PayrollIcon sx={{ fontSize: 40 }} />,
      color: '#f50057',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid
            component="div"
            sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}
            key={index}
          >
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6" sx={{ fontWeight: 500 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Add Employee</Typography>
              <Typography variant="body2" color="text.secondary">
                Create new employee record
              </Typography>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'success.light',
                  color: 'white',
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Mark Attendance</Typography>
              <Typography variant="body2" color="text.secondary">
                Record daily attendance
              </Typography>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'warning.light',
                  color: 'white',
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Generate Payroll</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate monthly salaries
              </Typography>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'info.light',
                  color: 'white',
                  transform: 'scale(1.02)',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>View Reports</Typography>
              <Typography variant="body2" color="text.secondary">
                Generate analytics
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminOverview;