const mysql = require('mysql2');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

console.log('Setting up database...');

// Create connection
const connection = mysql.createConnection(dbConfig);

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Try installing XAMPP which includes MySQL');
    process.exit(1);
  }
  
  console.log('Connected to MySQL successfully!');
  
  // Read and execute the SQL file
  fs.readFile('database.sql', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading database.sql:', err.message);
      process.exit(1);
    }
    
    // Execute the SQL
    connection.query(data, (err, results) => {
      if (err) {
        console.error('Error executing SQL:', err.message);
        process.exit(1);
      }
      
      console.log('Database setup completed successfully!');
      console.log('Created database: payroll_management');
      console.log('Created tables: employees, attendance, leaves, payroll');
      console.log('Inserted sample data');
      
      connection.end();
    });
  });
});
