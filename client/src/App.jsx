import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = ' https://sravan-207.onrender.com'

const defaultCompanyList = [
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
]

const defaultStudent = {
  name: '',
  studentId: '',
  department: '',
  bloodGroup: 'A+',
  standingArrear: 0,
}

function App() {
  const [view, setView] = useState('home')
  const [student, setStudent] = useState(defaultStudent)
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [message, setMessage] = useState('')
  const [companyList, setCompanyList] = useState(defaultCompanyList)
  const [registrations, setRegistrations] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companyResponse, studentResponse] = await Promise.all([
          fetch(`${API_BASE}/api/companies`),
          fetch(`${API_BASE}/api/students`),
        ])

        if (!companyResponse.ok || !studentResponse.ok) {
          throw new Error('Failed to load data from the server.')
        }

        const companies = await companyResponse.json()
        const students = await studentResponse.json()

        setCompanyList(companies.length ? companies : defaultCompanyList)
        setRegistrations(students)
      } catch (error) {
        console.error('Error loading placement data:', error)
        setMessage('Unable to connect to the backend server. Please start the server first.')
        setCompanyList(defaultCompanyList)
        setRegistrations([])
      }
    }

    loadData()
  }, [])

  const companyCounts = useMemo(() => {
    return companyList.map((company) => ({
      company,
      count: registrations.filter((studentEntry) =>
        Array.isArray(studentEntry.companies) && studentEntry.companies.includes(company),
      ).length,
    }))
  }, [companyList, registrations])

  const maxCompanyCount = Math.max(...companyCounts.map((entry) => entry.count), 1)

  const handleStudentChange = (event) => {
    const { name, value } = event.target
    setStudent((previous) => ({
      ...previous,
      [name]: name === 'standingArrear' ? Number(value) : value,
    }))
  }

  const handleNextStep = () => {
    const requiredFields = ['name', 'studentId', 'department', 'bloodGroup']

    if (requiredFields.some((field) => !student[field])) {
      setMessage('Please complete all student details before continuing.')
      return
    }

    if (Number(student.standingArrear) > 0) {
      setMessage('This student is not eligible for placement registration because the standing arrear count is greater than zero.')
      return
    }

    setMessage('')
    setView('company-selection')
  }

  const toggleCompany = (company) => {
    setSelectedCompanies((current) => {
      if (current.includes(company)) {
        return current.filter((item) => item !== company)
      }

      if (current.length >= 4) {
        setMessage('You can select only 4 companies.')
        return current
      }

      setMessage('')
      return [...current, company]
    })
  }

  const handleRegister = async () => {
    if (selectedCompanies.length !== 4) {
      setMessage('Please select exactly 4 companies for registration.')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student,
          standingArrear: Number(student.standingArrear) || 0,
          companies: selectedCompanies,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      setRegistrations((current) => [data.student, ...current])
      setMessage('Registration submitted successfully.')
      setSelectedCompanies([])
      setStudent(defaultStudent)
      setView('home')
    } catch (error) {
      setMessage(error.message || 'Something went wrong while registering.')
    }
  }

  const resetStudentFlow = () => {
    setMessage('')
    setStudent(defaultStudent)
    setSelectedCompanies([])
    setView('home')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Placement Board</p>
          <h1>Campus Placement Registration</h1>
        </div>
        <nav className="nav-actions">
          <button className="nav-button" onClick={() => setView('home')}>
            Home
          </button>
          <button className="nav-button" onClick={() => setView('student')}>
            Student
          </button>
          <button className="nav-button" onClick={() => setView('admin')}>
            Admin
          </button>
        </nav>
      </header>

      {view === 'home' && (
        <main className="hero-panel">
          <div className="hero-copy">
            <p className="subheading">Student placement portal</p>
            <h2>Register and track placement opportunities</h2>
            <p>
              Students can register with academic details, verify eligibility, and choose
              four preferred companies. The admin dashboard shows company-wise registration
              counts for quick analysis.
            </p>
            <div className="cta-row">
              <button className="primary-btn" onClick={() => setView('student')}>
                Student Registration
              </button>
              <button className="secondary-btn" onClick={() => setView('admin')}>
                Admin Dashboard
              </button>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Students</span>
              <strong>{registrations.length}</strong>
            </div>
            <div className="stat-card">
              <span>Eligible</span>
              <strong>
                {registrations.filter((entry) => Number(entry.standingArrear) === 0).length}
              </strong>
            </div>
            <div className="stat-card">
              <span>Company Slots</span>
              <strong>{companyList.length}</strong>
            </div>
          </div>
        </main>
      )}

      {view === 'student' && (
        <main className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Student</p>
              <h2>Placement eligibility form</h2>
            </div>
            <button className="ghost-btn" onClick={resetStudentFlow}>
              Back to home
            </button>
          </div>

          <div className="form-grid">
            <label>
              Name
              <input
                type="text"
                name="name"
                value={student.name}
                onChange={handleStudentChange}
                placeholder="Enter student name"
              />
            </label>
            <label>
              Student ID
              <input
                type="text"
                name="studentId"
                value={student.studentId}
                onChange={handleStudentChange}
                placeholder="Enter student ID"
              />
            </label>
            <label>
              Department
              <input
                type="text"
                name="department"
                value={student.department}
                onChange={handleStudentChange}
                placeholder="Enter department"
              />
            </label>
            <label>
              Blood Group
              <select name="bloodGroup" value={student.bloodGroup} onChange={handleStudentChange}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>
            <label className="span-full">
              Standing Arrear
              <input
                type="number"
                name="standingArrear"
                min="0"
                max="12"
                value={student.standingArrear}
                onChange={handleStudentChange}
              />
            </label>
          </div>

          {message && <p className="status-message">{message}</p>}

          <div className="form-actions">
            <button className="primary-btn" onClick={handleNextStep}>
              Proceed to company selection
            </button>
          </div>
        </main>
      )}

      {view === 'company-selection' && (
        <main className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Student</p>
              <h2>Select 4 companies</h2>
            </div>
            <span className="selection-count">{selectedCompanies.length}/4 selected</span>
          </div>

          <div className="company-grid">
            {companyList.map((company) => (
              <button
                key={company}
                className={`company-card ${selectedCompanies.includes(company) ? 'selected' : ''}`}
                onClick={() => toggleCompany(company)}
                type="button"
              >
                {company}
              </button>
            ))}
          </div>

          {message && <p className="status-message">{message}</p>}

          <div className="form-actions">
            <button className="secondary-btn" onClick={() => setView('student')}>
              Back
            </button>
            <button className="primary-btn" onClick={handleRegister}>
              Register
            </button>
          </div>
        </main>
      )}

      {view === 'admin' && (
        <main className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h2>Registration dashboard</h2>
            </div>
          </div>

          <div className="admin-stats">
            <div className="stat-card">
              <span>Total Registered</span>
              <strong>{registrations.length}</strong>
            </div>
            <div className="stat-card">
              <span>Eligible Students</span>
              <strong>
                {registrations.filter((entry) => Number(entry.standingArrear) === 0).length}
              </strong>
            </div>
            <div className="stat-card">
              <span>Selected Companies</span>
              <strong>{companyList.length}</strong>
            </div>
          </div>

          <div className="chart-section">
            {companyCounts.map(({ company, count }) => (
              <div key={company} className="company-row">
                <div className="company-label-row">
                  <span>{company}</span>
                  <strong>{count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / maxCompanyCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Blood Group</th>
                  <th>Arrears</th>
                  <th>Preferred Companies</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((entry) => (
                  <tr key={entry.id || entry.studentId}>
                    <td>{entry.name}</td>
                    <td>{entry.studentId}</td>
                    <td>{entry.department}</td>
                    <td>{entry.bloodGroup}</td>
                    <td>{entry.standingArrear}</td>
                    <td>{entry.companies?.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </div>
  )
}

export default App
