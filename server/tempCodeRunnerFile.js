const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Jyothi25',
  database: 'aicte_project'
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('MySQL connected');
});

// API to fetch colleges
app.get('/api/colleges', (req, res) => {
  db.query('SELECT * FROM college', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});

// ✅ Fixed: Return JSON on successful insert
app.post('/api/add-college', (req, res) => {
  const { name, location, year, type } = req.body;

  const sql = `
    INSERT INTO college (Name, Location, Established_Year, Type, AICTE_Approval_Status, AICTE_ID, AICTE_Approved_By) 
    VALUES (?, ?, ?, ?, "Approved", NULL, 1)
  `;
  
  db.query(sql, [name, location, year, type], (err, result) => {
    if (err) {
      console.error('Insert failed:', err);
      return res.status(500).json({ success: false, message: 'Insert failed' });
    }

    console.log('College added:', result.insertId);
    res.json({ success: true, message: 'College added successfully', id: result.insertId });
  });
});


// Get all courses
app.get('/api/courses', (req, res) => {
    db.query('SELECT * FROM courses', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json(results);
    });
  });
  
  // Add a new course
app.post('/api/add-course', (req, res) => {
    const { name, credits, college_id } = req.body;
  
    // Check for missing values
    if (!name || !credits || !college_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
  
    const sql = 'INSERT INTO courses (Course_Name, Duration, College_ID) VALUES (?, ?, ?)';
    db.query(sql, [name, credits, college_id], (err, result) => {
      if (err) {
        console.error('Insert failed:', err); // Shows MySQL error in terminal
        return res.status(500).json({ success: false, message: err.sqlMessage || 'Insert failed' });
      }
  
      console.log('✅ Course added with ID:', result.insertId);
      res.json({ success: true, message: 'Course added successfully', id: result.insertId });
    });
  });
  
// Get all rankings
app.get('/api/rankings', (req, res) => {
    db.query('SELECT * FROM college_rank', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json(results);
    });
  });
  
  // Add a new ranking
  app.post('/api/add-ranking', (req, res) => {
    const { college_id, rank_year, score, position } = req.body;
  
    if (!college_id || !rank_year || !score || !position) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
  
    const sql = 'INSERT INTO college_rank (College_ID, Rank_Year, Score, Position) VALUES (?, ?, ?, ?)';
    db.query(sql, [college_id, rank_year, score, position], (err, result) => {
      if (err) {
        console.error('Insert failed:', err);
        return res.status(500).json({ success: false, message: err.sqlMessage || 'Insert failed' });
      }
  
      res.json({ success: true, message: 'Ranking added successfully', id: result.insertId });
    });
  });
  
  

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
