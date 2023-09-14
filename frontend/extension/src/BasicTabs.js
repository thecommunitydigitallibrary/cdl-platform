import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SubmitTab from './SubmitTab';
import SearchTab from './SearchTab';
import SettingsTab from './SettingsTab';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import Login from './Login'
import { useNavigate } from 'react-router-dom'
import FindInPageIcon from '@mui/icons-material/FindInPage';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  const [value, setValue] = React.useState(localStorage.getItem('defaultTab') === "submit" ? 1 : 0);
  const [url, setUrl]=React.useState();
  const [highlightedText, setHighlightedText]=React.useState();


  let setUrlState=(url, highlight)=>{
     console.log(url, highlight)
     setUrl(url);
     setHighlightedText(highlight);
  }

  let navigate = useNavigate()

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const logout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  return (
    <div>
      {localStorage.getItem('authToken') === null ? <Login /> : (
      
      <Box sx={{ width: '100%' }}>
        <Box style={{ float: "center", marginTop: "12px" }}>
            <a href={localStorage.getItem('backendSource')} style={{ fontSize: 20 }} target="_blank" rel="noopener noreferrer">
              The Community Digital Library
            </a>
            <Button onClick={logout}><LogoutIcon/></Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', float: "center" }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" style={{ textAlign: "center" }}>
            <Tab style = {{width: "40%", float:"left"}} label={<div><FindInPageIcon style={{ verticalAlign: 'middle' }} /> Search </div>} {...a11yProps(2)} />
            <Tab style = {{width: "40%", float:"center"}} label={<div><UploadFileOutlinedIcon style={{ verticalAlign: 'middle' }} /> Submit </div>} {...a11yProps(1)} />
            <Tab style = {{width: "20%", float:"left"}} label={<div><SettingsIcon style={{ verticalAlign: 'middle' }} /></div>} {...a11yProps(3)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <SearchTab setUrlState={setUrlState}/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <SubmitTab setUrlState={setUrlState}/>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <SettingsTab setUrlState={setUrlState}/>
        </TabPanel>
      </Box>)}
    </div>
  );
}
