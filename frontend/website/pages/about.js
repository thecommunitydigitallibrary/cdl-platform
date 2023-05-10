import * as React from "react";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import PropTypes from "prop-types";
// Import pages within each tab
import Summary from "./summary";
import Setup from "./setup";
import FrequentlyAskedQuestions from "./faq";
import ReleaseLog from "./releaselog";
import Usage from "./usage";
import Header from "../components/header";
import Head from "next/head";
import Footer from "../components/footer";

// Taken from: https://mui.com/material-ui/react-tabs/
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
      <Head>
        <title>About - The CDL</title>
        <link rel="icon" href="/images/tree32.png" />
      </Head>
      {value === index && (
        <Box sx={{}}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}
// Taken from: https://mui.com/material-ui/react-tabs/
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
// Taken from: https://mui.com/material-ui/react-tabs/
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function About() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <>
      <Header />
      <div
        className="allResults"
        style={{
          width: "1200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="About" {...a11yProps(0)} />
              <Tab label="Setup" {...a11yProps(1)} />
              <Tab label="Usage" {...a11yProps(2)} />
              <Tab label="FAQ" {...a11yProps(3)} />
              <Tab label="Release Log" {...a11yProps(4)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <Summary />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Setup />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Usage />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <FrequentlyAskedQuestions />
          </TabPanel>
          <TabPanel value={value} index={4}>
            <ReleaseLog />
          </TabPanel>
        </Box>
      </div>
      <Footer alt={true} />
    </>
  );
}
