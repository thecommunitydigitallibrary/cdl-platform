import './App.css';
import BasicTabs from './BasicTabs';
import Login from './Login'
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom'


function App() {

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
