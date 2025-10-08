const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5004;

// If behind a proxy (e.g., CRA dev server), trust it so rate-limiter can read client IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'payroll_management',
  multipleStatements: true
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const query = 'SELECT * FROM employees WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = results[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee routes
app.get('/api/employees', authenticateToken, requireAdmin, (req, res) => {
  const query = 'SELECT id, name, email, department, position, salary, hire_date, status FROM employees WHERE role != "admin"';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, department, position, salary, hire_date } = req.body;

    if (!name || !email || !password || !department || !position || !salary) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO employees (name, email, password, department, position, salary, hire_date, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, department, position, salary, hire_date, 'employee'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already exists' });
        }
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({ 
        message: 'Employee created successfully',
        employeeId: result.insertId 
      });
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, position, salary, status } = req.body;

    const query = 'UPDATE employees SET name = ?, email = ?, department = ?, position = ?, salary = ?, status = ? WHERE id = ?';
    db.query(query, [name, email, department, position, salary, status, id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({ message: 'Employee updated successfully' });
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM employees WHERE id = ? AND role != "admin"';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  });
});

// Attendance routes
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { employee_id, date, check_in, check_out, status } = req.body;

  const query = 'INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), check_out = VALUES(check_out), status = VALUES(status)';
  db.query(query, [employee_id, date, check_in, check_out, status], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Attendance recorded successfully' });
  });
});

app.get('/api/attendance', authenticateToken, (req, res) => {
  const { employee_id, start_date, end_date } = req.query;
  let query, params;

  if (req.user.role === 'admin') {
    if (employee_id) {
      query = 'SELECT a.*, e.name as employee_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.employee_id = ? AND a.date BETWEEN ? AND ? ORDER BY a.date DESC';
      params = [employee_id, start_date, end_date];
    } else {
      query = 'SELECT a.*, e.name as employee_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.date BETWEEN ? AND ? ORDER BY a.date DESC';
      params = [start_date, end_date];
    }
  } else {
    query = 'SELECT * FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC';
    params = [req.user.id, start_date, end_date];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Leave routes
app.post('/api/leaves', authenticateToken, (req, res) => {
  const { employee_id, start_date, end_date, reason, type } = req.body;

  const query = 'INSERT INTO leaves (employee_id, start_date, end_date, reason, type, status) VALUES (?, ?, ?, ?, ?, "pending")';
  db.query(query, [employee_id, start_date, end_date, reason, type], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({ message: 'Leave request submitted successfully' });
  });
});

app.get('/api/leaves', authenticateToken, (req, res) => {
  let query, params;

  if (req.user.role === 'admin') {
    query = 'SELECT l.*, e.name as employee_name FROM leaves l JOIN employees e ON l.employee_id = e.id ORDER BY l.created_at DESC';
    params = [];
  } else {
    query = 'SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC';
    params = [req.user.id];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.put('/api/leaves/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = 'UPDATE leaves SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Leave status updated successfully' });
  });
});

// Payroll routes
app.get('/api/payroll', authenticateToken, (req, res) => {
  const { month, year } = req.query;
  let query, params;

  if (req.user.role === 'admin') {
    query = `
      SELECT p.*, e.name as employee_name, e.department, e.position
      FROM payroll p 
      JOIN employees e ON p.employee_id = e.id 
      WHERE p.month = ? AND p.year = ?
      ORDER BY e.name
    `;
    params = [month, year];
  } else {
    query = 'SELECT * FROM payroll WHERE employee_id = ? AND month = ? AND year = ?';
    params = [req.user.id, month, year];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/payroll/generate', authenticateToken, requireAdmin, (req, res) => {
  const { month, year } = req.body;

  // Generate payroll for all employees for the specified month/year
  const query = `
    INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status)
    SELECT 
      e.id,
      ?,
      ?,
      e.salary,
      COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * (e.salary / 30), 0) as allowances,
      COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) * (e.salary / 30), 0) as deductions,
      e.salary + COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * (e.salary / 30), 0) - COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) * (e.salary / 30), 0) as net_salary,
      'pending'
    FROM employees e
    LEFT JOIN attendance a ON e.id = a.employee_id AND MONTH(a.date) = ? AND YEAR(a.date) = ?
    WHERE e.role = 'employee' AND e.status = 'active'
    GROUP BY e.id
    ON DUPLICATE KEY UPDATE
      basic_salary = VALUES(basic_salary),
      allowances = VALUES(allowances),
      deductions = VALUES(deductions),
      net_salary = VALUES(net_salary)
  `;

  db.query(query, [month, year, month, year], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Payroll generated successfully' });
  });
});

// Reports route
app.get('/api/reports', authenticateToken, requireAdmin, (req, res) => {
  const { type, start_date, end_date } = req.query;

  let query, params;

  switch (type) {
    case 'attendance':
      query = `
        SELECT e.name, e.department, 
               COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
               COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
               COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id AND a.date BETWEEN ? AND ?
        WHERE e.role = 'employee'
        GROUP BY e.id, e.name, e.department
      `;
      params = [start_date, end_date];
      break;
    case 'payroll':
      query = `
        SELECT e.name, e.department, p.month, p.year, p.basic_salary, p.allowances, p.deductions, p.net_salary
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        WHERE p.month = ? AND p.year = ?
        ORDER BY e.name
      `;
      params = [req.query.month, req.query.year];
      break;
    default:
      return res.status(400).json({ message: 'Invalid report type' });
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
