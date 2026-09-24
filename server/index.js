const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const companies = [
  'TCS',
  'Infosys',
  'Wipro',
  'Accenture',
  'Cognizant',
  'Capgemini',
  'Tech Mahindra',
  'Amazon',
  'Microsoft',
  'Google',
];

const students = [
  {
    id: 1,
    name: 'Aarav Nair',
    studentId: '21CS101',
    department: 'Computer Science',
    bloodGroup: 'O+',
    standingArrear: 0,
    companies: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
  },
  {
    id: 2,
    name: 'Meera Iyer',
    studentId: '21IT204',
    department: 'Information Technology',
    bloodGroup: 'A+',
    standingArrear: 0,
    companies: ['Cognizant', 'Capgemini', 'Tech Mahindra', 'Amazon'],
  },
  {
    id: 3,
    name: 'Rohit Kumar',
    studentId: '21EC310',
    department: 'Electronics',
    bloodGroup: 'B+',
    standingArrear: 1,
    companies: [],
  },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Placement server is running' });
});

app.get('/api/companies', (req, res) => {
  res.json(companies);
});

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.post('/api/register', (req, res) => {
  const { name, studentId, department, bloodGroup, standingArrear, companies } = req.body;

  if (!name || !studentId || !department || !bloodGroup) {
    return res.status(400).json({ message: 'Missing required student fields.' });
  }

  if (Number(standingArrear) > 0) {
    return res.status(400).json({
      message: 'Student is not eligible because standing arrear is greater than zero.',
    });
  }

  if (!Array.isArray(companies) || companies.length !== 4) {
    return res.status(400).json({ message: 'Please select exactly 4 companies.' });
  }

  const newStudent = {
    id: Date.now(),
    name,
    studentId,
    department,
    bloodGroup,
    standingArrear: Number(standingArrear) || 0,
    companies,
  };

  students.push(newStudent);

  res.status(201).json({ message: 'Registration successful', student: newStudent });
});

app.listen(PORT, () => {
  console.log(`Placement server running on http://localhost:${PORT}`);
});
