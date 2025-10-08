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
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import { formatINR } from '../../utils/currency';

interface PayrollRecord {
  id: number;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
}

const MyPayroll: React.FC = () => {
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
      const response = await axios.get('/api/payroll', {
        params: { month: selectedMonth, year: selectedYear },
      });
      setPayroll(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    // Generate payslip content
    const payslipContent = `
PAYSLIP
Employee: ${record.id}
Month: ${record.month}/${record.year}
Basic Salary: ${formatINR(record.basic_salary, true)}
Allowances: ${formatINR(record.allowances, true)}
Deductions: ${formatINR(record.deductions, true)}
Net Salary: ${formatINR(record.net_salary, true)}
Status: ${record.status}
    `.trim();

    const blob = new Blob([payslipContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${record.year}_${record.month}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'month', headerName: 'Month', width: 80 },
    { field: 'year', headerName: 'Year', width: 80 },
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
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownloadPayslip(params.row)}
        >
          Download
        </Button>
      ),
    },
  ];

  const totalSalary = payroll.reduce((sum, record) => sum + record.net_salary, 0);
  const paidRecords = payroll.filter(record => record.status === 'paid').length;
  const pendingRecords = payroll.filter(record => record.status === 'pending').length;

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
        My Payroll
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="h6">
                Total Salary (Selected Period)
              </Typography>
              <Typography variant="h4" color="primary.main">
                {formatINR(totalSalary)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="h6">
                Paid Records
              </Typography>
              <Typography variant="h4" color="success.main">
                {paidRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="h6">
                Pending Records
              </Typography>
              <Typography variant="h4" color="warning.main">
                {pendingRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
          <FormControl fullWidth>
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
        </Grid>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
          <FormControl fullWidth>
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
        </Grid>
      </Grid>

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

export default MyPayroll;
