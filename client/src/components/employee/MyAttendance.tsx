import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

interface AttendanceRecord {
  id: number;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
}

const MyAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(dayjs());

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('/api/attendance', {
        params: {
          start_date: startDate.format('YYYY-MM-DD'),
          end_date: endDate.format('YYYY-MM-DD'),
        },
      });
      setAttendance(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'check_in', headerName: 'Check In', width: 100 },
    { field: 'check_out', headerName: 'Check Out', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'present' ? 'success' :
            params.value === 'absent' ? 'error' :
            params.value === 'late' ? 'warning' : 'default'
          }
          size="small"
        />
      ),
    },
  ];

  const presentDays = attendance.filter(record => record.status === 'present').length;
  const absentDays = attendance.filter(record => record.status === 'absent').length;
  const lateDays = attendance.filter(record => record.status === 'late').length;
  const totalDays = attendance.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" gutterBottom>
          My Attendance
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Present Days
                </Typography>
                <Typography variant="h4" color="success.main">
                  {presentDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Absent Days
                </Typography>
                <Typography variant="h4" color="error.main">
                  {absentDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Late Days
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {lateDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="h6">
                  Total Days
                </Typography>
                <Typography variant="h4">
                  {totalDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue || dayjs())}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue || dayjs())}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={attendance}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default MyAttendance;
