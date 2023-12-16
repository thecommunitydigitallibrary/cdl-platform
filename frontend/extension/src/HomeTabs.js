import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LoginTab from './LoginTab';
import SettingsTab from './SettingsTab';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SettingsIcon from '@mui/icons-material/Settings';

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

export default function HomeTabs() {
  const [value, setValue] = React.useState(1);

  let setUrlState = (url, highlight) => {
    console.log(url, highlight)
  }

  const handleChange = (event, newValue) => {
    if (newValue === 0) {
      setValue(1);
      window.open(localStorage.getItem('backendSource'), "_blank", "noopener noreferrer");
    }
    setValue(newValue);
  };


  return (
    <div>
      <Box sx={{width: '100%'}}>
        <Box sx={{borderBottom: 1, borderColor: 'divider', float: "center"}}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example"
                style={{textAlign: "center"}}>
            <Tab style={{width: "25%", float: "left"}}
                 label={<div style={{padding: 0, margin: 0}}><h3 style={{margin: 0}}>TextData</h3>
                 </div>} {...a11yProps(0)} />
            <Tab style={{width: "62.5%", float: "left"}}
                 label={<div><UploadFileOutlinedIcon style={{verticalAlign: 'middle'}}/>Login
                 </div>} {...a11yProps(1)} />
            <Tab style={{width: "12.5%", float: "left", minWidth: "0px"}}
                 label={<div><SettingsIcon style={{verticalAlign: 'middle'}}/></div>} {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>

        </TabPanel>
        <TabPanel value={value} index={1}>
          <LoginTab setUrlState={setUrlState}/>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <SettingsTab setUrlState={setUrlState}/>
        </TabPanel>
      </Box>
    </div>
  );
}
