const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// SQLite Database connection
const db = new sqlite3.Database('./payroll.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      department TEXT NOT NULL,
      position TEXT NOT NULL,
      salary REAL NOT NULL,
      hire_date TEXT NOT NULL,
      role TEXT DEFAULT 'employee',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT DEFAULT 'absent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      basic_salary REAL NOT NULL,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, month, year)
    );
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('Database tables created successfully');
      insertSampleData();
    }
  });
}

// Insert sample data
function insertSampleData() {
  // Check if data already exists
  db.get("SELECT COUNT(*) as count FROM employees", (err, row) => {
    if (err) {
      console.error('Error checking data:', err.message);
      return;
    }

    if (row.count > 0) {
      console.log('Sample data already exists');
      return;
    }

    // Insert sample data
    const sampleData = `
      INSERT INTO employees (name, email, password, department, position, salary, hire_date, role) VALUES
      ('Admin User', 'admin@payroll.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'System Administrator', 100000.00, '2024-01-01', 'admin'),
      ('John Doe', 'john.doe@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Engineering', 'Software Developer', 75000.00, '2024-01-15', 'employee'),
      ('Jane Smith', 'jane.smith@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marketing', 'Marketing Manager', 65000.00, '2024-02-01', 'employee'),
      ('Mike Johnson', 'mike.johnson@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HR', 'HR Specialist', 55000.00, '2024-02-15', 'employee'),
      ('Sarah Wilson', 'sarah.wilson@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Finance', 'Accountant', 60000.00, '2024-03-01', 'employee');
    `;

    db.exec(sampleData, (err) => {
      if (err) {
        console.error('Error inserting sample data:', err.message);
      } else {
        console.log('Sample data inserted successfully');
        console.log('Server ready!');
        console.log('Frontend: http://localhost:3000');
        console.log('Backend: http://localhost:5000');
        console.log('Admin Login: admin@payroll.com / password');
        console.log('Employee Login: john.doe@company.com / password');
      }
    });
  });
}

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
    db.get(query, [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

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
          position: user.position,
          salary: user.salary
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
  db.all(query, (err, results) => {
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
    db.run(query, [name, email, hashedPassword, department, position, salary, hire_date, 'employee'], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ message: 'Email already exists' });
        }
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({ 
        message: 'Employee created successfully',
        employeeId: this.lastID 
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
    db.run(query, [name, email, department, position, salary, status, id], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
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
  db.run(query, [id], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  });
});

// Attendance routes
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { employee_id, date, check_in, check_out, status } = req.body;

  const query = 'INSERT OR REPLACE INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [employee_id, date, check_in, check_out, status], (err) => {
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

  db.all(query, params, (err, results) => {
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
  db.run(query, [employee_id, start_date, end_date, reason, type], (err) => {
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

  db.all(query, params, (err, results) => {
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
  db.run(query, [status, id], (err) => {
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

  db.all(query, params, (err, results) => {
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
    INSERT OR REPLACE INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status)
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
    LEFT JOIN attendance a ON e.id = a.employee_id AND CAST(SUBSTR(a.date, 6, 2) AS INTEGER) = ? AND CAST(SUBSTR(a.date, 1, 4) AS INTEGER) = ?
    WHERE e.role = 'employee' AND e.status = 'active'
    GROUP BY e.id
  `;

  db.run(query, [month, year, month, year], (err) => {
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

  db.all(query, params, (err, results) => {
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

// Start server with fallback ports if the desired one is taken
const startServer = (basePort, maxAttempts = 10) => {
  let attempt = 0;

  const tryListen = (port) => {
    const server = app.listen(port, () => {
      const actualPort = server.address().port;
      console.log(`Server running on port ${actualPort}`);
      console.log(`Using SQLite database: payroll.db`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        attempt += 1;
        const nextPort = basePort + attempt;
        console.warn(`Port ${port} in use, trying ${nextPort}...`);
        tryListen(nextPort);
      } else if (err && err.code === 'EADDRINUSE') {
        console.error(`Failed to bind to ports ${basePort}-${basePort + attempt}. All in use.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  };

  tryListen(Number(basePort));
};

startServer(PORT);
