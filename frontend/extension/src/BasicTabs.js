import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SubmitTab from './SubmitTab';
import FindTab from './FindTab';
import SettingsTab from './SettingsTab';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import {useNavigate} from 'react-router-dom'
import FindInPageIcon from '@mui/icons-material/FindInPage';
import HomeTabs from "./HomeTabs";

function TabPanel(props) {
  const {children, value, index, ...other} = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{p: 2}}>
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
  const [value, setValue] = React.useState(localStorage.getItem('defaultTab') === "submit" ? 1 : 2);
  const [url, setUrl] = React.useState();
  const [highlightedText, setHighlightedText] = React.useState();


  let setUrlState = (url, highlight) => {
    console.log(url, highlight)
    setUrl(url);
    setHighlightedText(highlight);
  }

  let navigate = useNavigate()

  const handleChange = (event, newValue) => {
    if (newValue === 0) {
      setValue(1);
      window.open(localStorage.getItem('backendSource'), "_blank", "noopener noreferrer");
    } else if (newValue === 4) {
      logout();
    }
    setValue(newValue);
  };

  const logout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  return (
    <div style={{margin: 0}}>
      {localStorage.getItem('authToken') === null ? <HomeTabs/> : (

        <Box sx={{width: '100%'}}>

          <Box sx={{borderBottom: 1, borderColor: 'divider', float: "center"}}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" style={{textAlign: "center"}}>
              <Tab style={{width: "25%", float: "left"}}
                   label={<div style={{padding: 0, margin: 0}}><h3 style={{margin: 0}}>TextData</h3>
                   </div>} {...a11yProps(0)} />
              <Tab style={{width: "25%", float: "left"}}
                   label={<div><UploadFileOutlinedIcon style={{verticalAlign: 'middle'}}/> Save </div>} {...a11yProps(1)} />
              <Tab style={{width: "25%", float: "left"}}
                   label={<div><FindInPageIcon style={{verticalAlign: 'middle'}}/> Find
                   </div>} {...a11yProps(2)} />
              <Tab style={{width: "12.5%", float: "left", minWidth: "0px"}}
                   label={<div><SettingsIcon style={{verticalAlign: 'middle'}}/></div>} {...a11yProps(3)} />
              <Tab style={{width: "12.5%", float: "left", minWidth: "0px"}}
                   label={<div><LogoutIcon style={{verticalAlign: 'middle'}}/></div>} {...a11yProps(4)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <SubmitTab setUrlState={setUrlState}/>
          </TabPanel>
          <TabPanel value={value} index={2}>
            <FindTab setUrlState={setUrlState}/>
          </TabPanel>
          <TabPanel value={value} index={3}>
            <SettingsTab setUrlState={setUrlState}/>
          </TabPanel>
        </Box>)}
    </div>
  );
}
