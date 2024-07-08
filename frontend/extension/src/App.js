import './App.css';
import BasicTabs from './BasicTabs';
import {MemoryRouter as Router, Route, Routes} from 'react-router-dom'
import HomeTabs from "./HomeTabs";


function App() {
  const TEXTDATA_URL = "https://textdata.org/";

  if (localStorage.getItem('backendSource') === null) {
    localStorage.setItem('backendSource', TEXTDATA_URL)
  }

  if (localStorage.getItem('defaultTab') === null) {
    localStorage.setItem('defaultTab', "find")
  }

  if (localStorage.getItem('extCachedData') === null) {
    localStorage.setItem('extCachedData', '[]')
  }

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<BasicTabs/>}/>
          <Route path='/login' element={<HomeTabs/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
