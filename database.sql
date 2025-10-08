-- Payroll Management System Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS payroll_management;
USE payroll_management;

-- Employees table
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'employee',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'absent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date)
);

-- Leave requests table
CREATE TABLE leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    type ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity', 'other') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Payroll table
CREATE TABLE payroll (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payroll (employee_id, month, year)
);

-- Insert default admin user
INSERT INTO employees (name, email, password, department, position, salary, hire_date, role) 
VALUES ('Admin User', 'admin@payroll.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'System Administrator', 100000.00, '2024-01-01', 'admin');

-- Insert sample employees
INSERT INTO employees (name, email, password, department, position, salary, hire_date) VALUES
('John Doe', 'john.doe@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Engineering', 'Software Developer', 75000.00, '2024-01-15'),
('Jane Smith', 'jane.smith@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marketing', 'Marketing Manager', 65000.00, '2024-02-01'),
('Mike Johnson', 'mike.johnson@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HR', 'HR Specialist', 55000.00, '2024-02-15'),
('Sarah Wilson', 'sarah.wilson@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Finance', 'Accountant', 60000.00, '2024-03-01');

-- Insert sample attendance data
INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
(2, '2024-12-01', '09:00:00', '17:00:00', 'present'),
(2, '2024-12-02', '09:15:00', '17:30:00', 'late'),
(2, '2024-12-03', '09:00:00', '17:00:00', 'present'),
(3, '2024-12-01', '09:00:00', '17:00:00', 'present'),
(3, '2024-12-02', '09:00:00', '17:00:00', 'present'),
(3, '2024-12-03', NULL, NULL, 'absent'),
(4, '2024-12-01', '09:00:00', '17:00:00', 'present'),
(4, '2024-12-02', '09:00:00', '17:00:00', 'present'),
(4, '2024-12-03', '09:00:00', '17:00:00', 'present'),
(5, '2024-12-01', '09:00:00', '17:00:00', 'present'),
(5, '2024-12-02', '09:00:00', '17:00:00', 'present'),
(5, '2024-12-03', '09:00:00', '17:00:00', 'present');

-- Insert sample leave requests
INSERT INTO leaves (employee_id, start_date, end_date, reason, type, status) VALUES
(2, '2024-12-10', '2024-12-12', 'Family vacation', 'vacation', 'pending'),
(3, '2024-12-15', '2024-12-15', 'Doctor appointment', 'personal', 'approved'),
(4, '2024-12-20', '2024-12-22', 'Sick leave', 'sick', 'pending');

-- Insert sample payroll data
INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status) VALUES
(2, 12, 2024, 75000.00, 2500.00, 0.00, 77500.00, 'pending'),
(3, 12, 2024, 65000.00, 2166.67, 2166.67, 65000.00, 'pending'),
(4, 12, 2024, 55000.00, 1833.33, 0.00, 56833.33, 'pending'),
(5, 12, 2024, 60000.00, 2000.00, 0.00, 62000.00, 'pending');
