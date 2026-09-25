require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const defaultCompanies = [
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

const inMemoryStudents = [
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

let mongoClient = null;
let mongoDb = null;

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Using in-memory data store.');
    return;
  }

  try {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(process.env.MONGO_DB_NAME || 'Sarvan');
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.warn('MongoDB connection failed. Using in-memory data store instead.');
    mongoClient = null;
    mongoDb = null;
  }
}

async function getStudentsFromStore() {
  if (mongoDb) {
    const collection = mongoDb.collection(process.env.MONGO_COLLECTION_NAME || 'placement');
    const docs = await collection.find({}).toArray();
    return docs.map(({ _id, ...student }) => ({ ...student, id: student.id || _id.toString() }));
  }

  return [...inMemoryStudents];
}

async function saveStudentToStore(student) {
  if (mongoDb) {
    const collection = mongoDb.collection(process.env.MONGO_COLLECTION_NAME || 'placement');
    const result = await collection.insertOne(student);
    return { ...student, _id: result.insertedId };
  }

  inMemoryStudents.push(student);
  return student;
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Placement API is running',
    endpoints: {
      health: '/api/health',
      companies: '/api/companies',
      students: '/api/students',
      register: '/api/register',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Placement server is running', mongo: !!mongoDb });
});

app.get('/api/companies', (req, res) => {
  res.json(defaultCompanies);
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await getStudentsFromStore();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students.', error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
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

  try {
    const savedStudent = await saveStudentToStore(newStudent);
    res.status(201).json({ message: 'Registration successful', student: savedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

async function startServer() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`Placement server running on http://localhost:${PORT}`);
  });
}

startServer();
