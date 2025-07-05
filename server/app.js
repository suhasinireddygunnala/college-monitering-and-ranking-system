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

// Add a new college
app.post('/api/add-college', (req, res) => {
  const { name, location, year, type } = req.body;
  const sql = `
    INSERT INTO college (Name, Location, Established_Year, Type, AICTE_Approval_Status, AICTE_ID, AICTE_Approved_By) 
    VALUES (?, ?, ?, ?, "Approved", NULL, 1)
  `;
  db.query(sql, [name, location, year, type], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Insert failed' });
    res.json({ success: true, message: 'College added successfully', id: result.insertId });
  });
});

// Delete and update college
app.delete('/api/delete-college/:id', (req, res) => {
  const collegeId = req.params.id;
  db.query('DELETE FROM college WHERE College_ID = ?', [collegeId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    if (result.affectedRows === 0) return res.json({ success: false, message: 'College not found' });
    res.json({ success: true });
  });
});

app.put('/api/update-college/:id', (req, res) => {
  const collegeId = req.params.id;
  const { name, location, year, type } = req.body;
  const query = `UPDATE college SET Name = ?, Location = ?, Established_Year = ?, Type = ? WHERE College_ID = ?`;
  db.query(query, [name, location, year, type, collegeId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    if (result.affectedRows === 0) return res.json({ success: false, message: 'College not found' });
    res.json({ success: true });
  });
});

// Get all courses (optionally by college)
app.get('/api/courses', (req, res) => {
  const { college_id } = req.query;
  let sql = 'SELECT * FROM courses';
  const params = [];
  if (college_id) {
    sql += ' WHERE College_ID = ?';
    params.push(college_id);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});

// Add a course
app.post('/api/add-course', (req, res) => {
  const { name, credits, college_id } = req.body;
  if (!name || !credits || !college_id) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const sql = 'INSERT INTO courses (Course_Name, Duration, College_ID) VALUES (?, ?, ?)';
  db.query(sql, [name, credits, college_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Insert failed' });
    res.json({ success: true, message: 'Course added successfully', id: result.insertId });
  });
});

// Faculty APIs
app.get('/api/faculty', (req, res) => {
  const collegeId = req.query.college_id;
  let sql = 'SELECT * FROM faculty';
  const values = [];
  if (collegeId) {
    sql += ' WHERE College_ID = ?';
    values.push(collegeId);
  }
  db.query(sql, values, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json(results);
  });
});

app.post('/api/add-faculty', (req, res) => {
  const { name, department, college_id } = req.body;
  if (!name || !department || !college_id) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const sql = 'INSERT INTO faculty (Name, Department, College_ID) VALUES (?, ?, ?)';
  db.query(sql, [name, department, college_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Insert failed' });
    res.json({ success: true, message: 'Faculty added successfully', id: result.insertId });
  });
});

// Rankings based on formula
app.get('/api/rankings', (req, res) => {
  const query = `
    SELECT 
      c.College_ID, 
      c.Name AS College_Name,
      COUNT(DISTINCT cr.Course_ID) AS num_courses,
      COUNT(DISTINCT f.Faculty_ID) AS num_faculty,
      (COUNT(DISTINCT cr.Course_ID) * 0.6 + COUNT(DISTINCT f.Faculty_ID) * 0.4) AS score
    FROM 
      college c
      LEFT JOIN courses cr ON c.College_ID = cr.College_ID
      LEFT JOIN faculty f ON c.College_ID = f.College_ID
    GROUP BY 
      c.College_ID
    ORDER BY score DESC;
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    console.log(results); // Check the query results

    // Add position to each result
    const rankedResults = results.map((row, index) => ({ ...row, position: index + 1 }));

    res.json(rankedResults); // Send response
  });
});


// Update course
app.put('/api/update-course/:id', (req, res) => {
  const { name, duration } = req.body;
  db.query('UPDATE courses SET Course_Name = ?, Duration = ? WHERE Course_ID = ?', [name, duration, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true });
  });
});

// Delete course
app.delete('/api/delete-course/:id', (req, res) => {
  db.query('DELETE FROM courses WHERE Course_ID = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true });
  });
});

// Update faculty
app.put('/api/update-faculty/:id', (req, res) => {
  const { name, department } = req.body;
  db.query('UPDATE faculty SET Name = ?, Department = ? WHERE Faculty_ID = ?', [name, department, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Update failed' });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true });
  });
});

// Delete faculty
app.delete('/api/delete-faculty/:id', (req, res) => {
  db.query('DELETE FROM faculty WHERE Faculty_ID = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
