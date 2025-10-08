import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
import { AccountBalance as PayrollIcon } from '@mui/icons-material';
import axios from 'axios';
import { formatINR } from '../../utils/currency';

interface PayrollRecord {
  id: number;
  employee_name: string;
  department: string;
  position: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
}

const PayrollManagement: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, selectedYear]);

  const fetchPayroll = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/payroll', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setPayroll(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      await axios.post('http://localhost:5000/api/payroll/generate', {
        month: selectedMonth,
        year: selectedYear,
      });
      fetchPayroll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'employee_name', headerName: 'Employee', width: 150 },
    { field: 'department', headerName: 'Department', width: 120 },
    { field: 'position', headerName: 'Position', width: 120 },
    { field: 'basic_salary', headerName: 'Basic Salary', width: 150, type: 'number', valueFormatter: (params: any) => formatINR(Number(params.value)) },
    { field: 'allowances', headerName: 'Allowances', width: 150, type: 'number', valueFormatter: (params: any) => formatINR(Number(params.value)) },
    { field: 'deductions', headerName: 'Deductions', width: 150, type: 'number', valueFormatter: (params: any) => formatINR(Number(params.value)) },
    { field: 'net_salary', headerName: 'Net Salary', width: 150, type: 'number', valueFormatter: (params: any) => formatINR(Number(params.value)) },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'paid' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
  ];

  const totalPayroll = payroll.reduce((sum, record) => sum + record.net_salary, 0);
  const totalEmployees = payroll.length;
  const paidEmployees = payroll.filter(record => record.status === 'paid').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payroll Management
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
              <Box display="flex" alignItems="center">
                <PayrollIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Total Payroll
                  </Typography>
                  <Typography variant="h4">
                    {formatINR(totalPayroll)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PayrollIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {totalEmployees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PayrollIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Paid Employees
                  </Typography>
                  <Typography variant="h4">
                    {paidEmployees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PayrollIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {totalEmployees - paidEmployees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleGeneratePayroll}
          disabled={loading}
        >
          Generate Payroll
        </Button>
      </Box>

      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={payroll}
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
  );
};

export default PayrollManagement;
