import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import jsCookie from "js-cookie";
import Router from "next/router";
import { Alert, createTheme, IconButton, ListItem, Snackbar, ThemeProvider, Tooltip } from "@mui/material";
import { AddCircle } from "@mui/icons-material";

import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import Notelistitem from './notelistitem.js';

const theme = createTheme({
    components: {
        MuiListItem: {
            styleOverrides: {
                root: {
                    minWidth: 0
                }
            }
        }
    }
});

const baseURL_server = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
const notesEndpoint = "notes/"

function Notesidebar(props) {

    const [title, setTitle] = useState("Untitled");
    const [newPageCreated, setNewPageCreated] = useState(false);

    //adding new page to backend
    const createNewPage = async (event, notePath) => {
    
        const res = await fetch(baseURL_server + notesEndpoint, {
            method: "POST",
            body: JSON.stringify({
                title: title
            }),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        const response = await res.json();
        if (res.status === 200) {
            // Below code updates the URL but does not get redirected (why?)
            Router.push("/notes/" + response.id).then(() => { console.log('Created new page') })
            // triggers useEffect() each time newPageCreated var changes
            setNewPageCreated("/notes/" + response.id)
        } else {
            try{
                alert(response.message)
            } catch(error) {
                alert("Something went wrong. Please try again later")
            }
        }
    };

    useEffect(() => {
        // if there is new page created, opening new page url
        if (newPageCreated != false) window.open(newPageCreated, "_self")
    }, [newPageCreated]);

    const createNewPageChild = async (event) => {
        // event.preventDefault()

        const res = await fetch(baseURL_server + notesEndpoint + event.currentTarget.id, {
            method: "POST",
            body: JSON.stringify({
                title: title
            }),
            headers: new Headers({
                Authorization: jsCookie.get("token"),
                "Content-Type": "application/json",
            }),
        });
        const response = await res.json();

        if (res.status === 200) {
            Router.push("/notes/" + (response.id))
            setNewPageCreated("/notes/" + response.id)
        } else {
            // add name of parent page here as param
            handleClickSnackbar();
        }
    };


    const [open, setOpen] = React.useState(false);
    const [parentPage, setParentPage] = React.useState("this page")

    const handleClickSnackbar = (pageName="this note") => {
        setOpen(true);
        setParentPage(pageName)
    };

    const handleCloseSnackbar = (event) => {
        setOpen(false);
    };


    return (
        <>
            <ThemeProvider theme={theme}>
                <List
                    sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            <form style={{ margin: '5px' }}>
                                <label>
                                    <h3>
                                        <a href={"/notes"}  >Notes</a>
                                    </h3>
                                </label>
                                <Tooltip title='Create'>
                                    <IconButton style={{ marginBottom: '5px' }} onClick={createNewPage}>
                                        <AddCircle />
                                    </IconButton>
                                </Tooltip>
                            </form>
                        </ListSubheader>
                    }
                >
                </List>
                <Notelistitem 
                    key={props.notesData.id} 
                    data={props.notesData.titles} 
                    indent={4}
                    createNewPageChild={createNewPageChild} 
                    currentNote={props.currentNote} 
                    cIG = {"-1"}
                    />

                <Snackbar open={open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                        <Alert onClose={handleCloseSnackbar} severity="warning" sx={{ width: '100%' }}>
                        Currently cannot add more notes under {parentPage}
                        </Alert>
                    </Snackbar>
            </ThemeProvider>
        </>
    )
}

export default Notesidebar