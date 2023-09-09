import './App.css';
import BasicTabs from './BasicTabs';
import Login from './Login'
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom'


function App() {
  const TEXTDATA_URL = "https://textdata.org/";

  if (localStorage.getItem('backendSource') === null) {
    localStorage.setItem('backendSource', TEXTDATA_URL)
  }

  if (localStorage.getItem('defaultTab') === null) {
    localStorage.setItem('defaultTab', "search")
  }

  return (
    <div className="App">
      <Router>
      <Routes>
            <Route path='/' element={<BasicTabs />} />
            <Route path='/login' element={<Login />}/>      
      </Routes>
      </Router>
    </div>
  );
}

export default App;
