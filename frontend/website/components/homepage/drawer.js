import React, { useState } from "react";
import jsCookie from "js-cookie";
import {
  Drawer,
  IconButton,
  List,
  Button,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography
} from "@mui/material";
import Divider from '@mui/material/Divider';
import MenuIcon from "@mui/icons-material/Menu";
import { BASE_URL_CLIENT, SUBMISSION_ENDPOINT, WEBSITE_URL } from "../../static/constants";
import Image from "next/image";
import useQuickAccessStore from "../../store/quickAccessStore";

function DrawerComp(props) {
  const [openDrawer, setOpenDrawer] = useState(false);

  const { ownSubmissionToggle, setQuickAccessStoreProps } = useQuickAccessStore();
  const handleNewSubmissionRequest = async (event) => {
    var DATA = {
      community: "",
      source_url: "",
      title: "",
      description: "",
      anonymous: false,
    }

    var URL = BASE_URL_CLIENT + SUBMISSION_ENDPOINT

    const res = await fetch(URL, {
      method: 'POST',
      body: JSON.stringify(DATA),
      headers: new Headers({
        Authorization: jsCookie.get("token"),
        "Content-Type": "application/json",
      }),
    });
    const response = await res.json();
    if (res.status == 200) {
      if (submissionMode == "edit" || submissionMode == "reply") {
        console.log(response)
        // Open a new tab
        window.open(WEBSITE_URL + GET + 'id_here', '_blank');
      } else {
        props.handle_close()
      }
    }
  };


  return (
    <React.Fragment>
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <List sx={{ maxWidth: '300px', maxHeight: '50px', overflowWrap: 'break-word', textAlign: 'center' }}>
          <>
            <div className="flex items-center justify-center">
              <a href="/" className="inline-block">
                <Image
                  src="/images/tree48.png"
                  alt="TextData"
                  width="40"
                  height="40"
                  className="w-8"
                />
              </a>
              <h4 className="ml-2 mb-0">Hello {props.username ? ',' + props.username : ''}</h4>
            </div>
            <Divider sx={{ borderColor: 'black', my: '2%' }} />
            <h6>Search Settings
            </h6>
            <FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ownSubmissionToggle}
                    onChange={
                      (event) => {
                        setQuickAccessStoreProps({ ownSubmissionToggle: event.target.checked })
                      }}
                  />
                }
                label={<Typography fontSize={'0.8rem'}>Show only my submissions</Typography>} />
            </FormControl>

            <Divider sx={{ borderColor: 'black' }} />
          </>

          {props.settings.map((setting, index) => (

            <>
              {setting.value == "indexSubmission" ?
                <>
                  <Divider sx={{ borderColor: 'black', my: '5%', mx: '5%' }} />
                  <ListItem key={index} disablePadding>
                    <ListItemButton key={index}
                      value={setting.value} variant="outline" onClick={props.handleClickSubmission}>
                      <ListItemIcon>
                      </ListItemIcon>
                      <ListItemText primary={setting.label} />
                    </ListItemButton>
                  </ListItem>
                </>
                :
                <ListItem key={index} disablePadding>
                  <ListItemButton key={index}
                    value={setting.value} variant="outline" onClick={(event) => { setOpenDrawer(false); props.handleUserClickMenu(event, setting.value) }}>
                    <ListItemIcon>
                    </ListItemIcon>
                    <ListItemText primary={"My " + setting.label} />
                  </ListItemButton>
                </ListItem>
              }
            </>
          ))}

          <Divider sx={{ borderColor: 'black', mx: '5%', my: '5%' }} />
          <ListItem disablePadding>
            <ListItemButton
              value={'documentation'} variant="outline" onClick={(event) => { setOpenDrawer(false); props.handleUserClickMenu(event, 'documentation') }}>
              <ListItemIcon>
              </ListItemIcon>
              <ListItemText primary={"Documentation"} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              value={'about'} variant="outline" onClick={(event) => { setOpenDrawer(false); props.handleUserClickMenu(event, 'about') }}>
              <ListItemIcon>
              </ListItemIcon>
              <ListItemText primary={"About"} />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ borderColor: 'black', mx: '5%', my: '5%' }} />
          <ListItem>
            <ListItemIcon>
            </ListItemIcon>
            {props.username ?
              <>
                <Button
                  className="text-white bg-red-500 rounded-md no-underline"

                  variant="contained" color="error" onClick={(event) => { setOpenDrawer(false); props.handleUserClickMenu(event, 'logout') }}>
                  <ListItemText>
                    Logout
                  </ListItemText>
                </Button>
              </>
              :
              <>
                <Button
                  className="text-white bg-red-500 rounded-md no-underline"
                  variant="contained" color="info" onClick={(event) => { setOpenDrawer(false); props.handleUserClickMenu(event, '/auth') }}>
                  <ListItemText>
                    Logout
                  </ListItemText>
                </Button>
              </>}
            <ListItemIcon>

            </ListItemIcon>
          </ListItem>
        </List>
      </Drawer>
      <IconButton
        sx={{ color: "white", marginLeft: "auto" }}
        onClick={() => { setOpenDrawer(!openDrawer) }}
      >
        <MenuIcon color="white" />
      </IconButton>
    </React.Fragment>
  );
};

export default DrawerComp;
