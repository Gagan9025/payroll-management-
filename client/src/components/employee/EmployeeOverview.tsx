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
  AccessTime as AttendanceIcon,
  EventNote as LeaveIcon,
  AccountBalance as PayrollIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { formatINR } from '../../utils/currency';

interface EmployeeStats {
  presentDays: number;
  absentDays: number;
  pendingLeaves: number;
  currentSalary: number;
  lastPayroll: number;
}

const EmployeeOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchEmployeeStats();
    }
  }, [user]);

  const fetchEmployeeStats = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const [attendanceRes, leavesRes, payrollRes] = await Promise.all([
        axios.get('/api/attendance', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/leaves'),
        axios.get('/api/payroll', {
          params: { month: currentMonth, year: currentYear },
        }),
      ]);

      const presentDays = attendanceRes.data.filter(
        (att: any) => att.status === 'present'
      ).length;
      const absentDays = attendanceRes.data.filter(
        (att: any) => att.status === 'absent'
      ).length;
      const pendingLeaves = leavesRes.data.filter(
        (leave: any) => leave.status === 'pending'
      ).length;
      const lastPayroll = payrollRes.data.length > 0 ? payrollRes.data[0].net_salary : 0;

      setStats({
        presentDays,
        absentDays,
        pendingLeaves,
        currentSalary: user?.salary || 0,
        lastPayroll,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch employee data');
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
      title: 'Present Days (This Month)',
      value: stats?.presentDays || 0,
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
    },
    {
      title: 'Absent Days (This Month)',
      value: stats?.absentDays || 0,
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      color: '#f44336',
    },
    {
      title: 'Pending Leave Requests',
      value: stats?.pendingLeaves || 0,
      icon: <LeaveIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
    },
    {
      title: 'Last Payroll Amount',
      value: formatINR(stats?.lastPayroll || 0),
      icon: <PayrollIcon sx={{ fontSize: 40 }} />,
      color: '#3f51b5',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
        Welcome to Your Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Hello {user?.name}! Here's an overview of your recent activity and important information.
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }} key={index}>
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
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
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
              <ProfileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>View Attendance</Typography>
              <Typography variant="body2" color="text.secondary">
                Check your attendance records
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
              <LeaveIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Request Leave</Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a new leave request
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
              <PayrollIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>View Payroll</Typography>
              <Typography variant="body2" color="text.secondary">
                Check your salary details
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
              <ProfileIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Update Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your personal information
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box mt={4}>
        <Card 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
              Employee Information
            </Typography>
            <Grid container spacing={2}>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {user?.name}
                </Typography>
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user?.email}
                </Typography>
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1">
                  {user?.department}
                </Typography>
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="text.secondary">
                  Position
                </Typography>
                <Typography variant="body1">
                  {user?.position}
                </Typography>
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                <Typography variant="body2" color="text.secondary">
                  Monthly Salary
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatINR(user?.salary || 0)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployeeOverview;