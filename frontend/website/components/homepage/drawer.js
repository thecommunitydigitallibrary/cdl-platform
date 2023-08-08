import React, { useState } from "react";
import {
  Drawer,
  IconButton,
  List,
  Button,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import Divider from '@mui/material/Divider';
import MenuIcon from "@mui/icons-material/Menu";

function DrawerComp(props) {
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <React.Fragment>
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <List sx={{ maxWidth: '300px', maxHeight: '50px', overflowWrap: 'break-word', textAlign: 'center' }}>
          
          
        {props.username? <>
        
        <h4 sx={{ marginBottom: '2%' }} >
        "Hello, "+{props.username }
          </h4>
          <Divider sx={{ borderColor: 'black', my: '5%', mx: '5%' }} />
        </>
        
        : <></>}
        

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
                    value={setting.value} variant="outline" onClick={(event) => {setOpenDrawer(false); props.handleUserClickMenu(event, setting.value)}}>
                    <ListItemIcon>
                    </ListItemIcon>
                    <ListItemText primary={"My " + setting.label} />
                  </ListItemButton>
                </ListItem>
              }

            </>
          ))}
          <Divider sx={{ borderColor: 'black', mx: '5%', my: '5%' }} />
          <ListItem>
            <ListItemIcon>
            </ListItemIcon>
            {props.username?
            <>
            <Button variant="contained" color="error" onClick={(event) => {setOpenDrawer(false); props.handleUserClickMenu(event, 'logout')}}>
              <ListItemText>
                Logout
              </ListItemText>
            </Button></>
          :
          <>
           <Button variant="contained" color="info" onClick={(event) => {setOpenDrawer(false); props.handleUserClickMenu(event, '/auth')}}>
              <ListItemText>
                Home
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
        onClick={() => setOpenDrawer(!openDrawer)}
      >
        <MenuIcon color="white" />
      </IconButton>
    </React.Fragment>
  );
};

export default DrawerComp;
