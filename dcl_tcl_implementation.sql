-- ============================================================================
-- AIM: Implement DCL (Data Control Language) and TCL (Transaction Control Language)
--      commands using MySQL Server 8.0.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART A: DCL (DATA CONTROL LANGUAGE)
-- ----------------------------------------------------------------------------

-- Step 2: Create Database
CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

-- Step 3: Create Student Table
CREATE TABLE IF NOT EXISTS student (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    marks INT
);

-- Step 4: Insert Records
DELETE FROM student;
INSERT INTO student VALUES
(1, 'Arun', 'CSE', 85),
(2, 'Priya', 'AIDS', 90),
(3, 'Kumar', 'ECE', 78);

SELECT * FROM student;

-- Step 5: Create Rahul User
DROP USER IF EXISTS 'rahul'@'localhost';
CREATE USER 'rahul'@'localhost' IDENTIFIED BY 'Rahul@123';

-- Step 6: Check Rahul's Privileges
SHOW GRANTS FOR 'rahul'@'localhost';

-- Step 9: GRANT - Give Permission (Executed as Root)
GRANT ALL PRIVILEGES ON college_db.* TO 'rahul'@'localhost';
FLUSH PRIVILEGES;

-- Step 11: REVOKE - Remove Permission (Executed as Root)
REVOKE ALL PRIVILEGES ON college_db.* TO 'rahul'@'localhost';
FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- PART B: TCL (TRANSACTION CONTROL LANGUAGE)
-- ----------------------------------------------------------------------------

-- Verify Storage Engine is InnoDB
USE college_db;
SHOW TABLE STATUS WHERE Name = 'student';

-- Step 13: COMMIT
START TRANSACTION;
INSERT INTO student VALUES (4, 'Rahul', 'CSE', 88);
COMMIT;
SELECT * FROM student;

-- Step 14: ROLLBACK
START TRANSACTION;
INSERT INTO student VALUES (5, 'Vijay', 'ECE', 75);
SELECT * FROM student;
ROLLBACK;
SELECT * FROM student;

-- Step 15: SAVEPOINT
START TRANSACTION;
INSERT INTO student VALUES (5, 'Vijay', 'ECE', 75);
SAVEPOINT S1;

INSERT INTO student VALUES (6, 'Meena', 'CSE', 92);
SELECT * FROM student;

ROLLBACK TO S1;
SELECT * FROM student;

COMMIT;
SELECT * FROM student;
