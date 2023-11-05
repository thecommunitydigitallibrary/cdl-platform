import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect } from "react";
import { createTheme, Icon, IconButton, ListItem, ListItemButton, ThemeProvider, Tooltip } from "@mui/material";
import { Box } from "@mui/system";

import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


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

function Notelistitem(props) {

    const [newPageCreated, setNewPageCreated] = useState(false);

    const [expandedIndex, setExpandedIndex] = useState(props.currentNote);

    useEffect(() => {
        // if there is new page created, force opening new page url
        if (newPageCreated != false) window.open(newPageCreated, "_self")
    }, [newPageCreated]);

    function handleOpen(clickedIndex) {
        if (expandedIndex == clickedIndex) {
            setExpandedIndex(false)
        }
        else if (String(expandedIndex).includes(clickedIndex)) {
            setExpandedIndex(String(expandedIndex).replace(clickedIndex, ''))
            handleOpen(expandedIndex)
        }
        else {
            setExpandedIndex(clickedIndex)
        }
    };

    return (
        <>
            <ThemeProvider theme={theme}>
                <div >
                    {
                        props.data &&
                        props.data.map(function (d, idx) {
                            return (
                                <>
                                    <ListItemButton selected={props.currentNote == d.id} key={d.id} sx={{ pl: props.indent, width: 'inherit', overflowWrap: 'break-word', height: '2.5em' }}>
                                        <Tooltip>
                                            <ListItemText key={d.id} sx={{ width: 'inherit' }} >

                                                {props.currentNote == d.id ?
                                                    <b>
                                                        <a href={"/notes/" + d.id} style={{ textDecoration: 'none' }}>{d.title}</a>
                                                    </b>
                                                    :
                                                    <a href={"/notes/" + d.id} style={{ textDecoration: 'none' }}>{d.title}</a>
                                                }
                                            </ListItemText>
                                        </Tooltip>
                                        <Tooltip title="Create">
                                            <ListItemIcon id={d.id} onClick={props.createNewPageChild} style={{ minWidth: 0 }} >
                                                <IconButton>
                                                    <AddIcon />
                                                </IconButton>
                                            </ListItemIcon>
                                        </Tooltip>
                                        <Tooltip title={d.notes && d.notes.length > 0 ? d.id == expandedIndex ? "" : "" : ""}>
                                            <Box onClick={() => handleOpen(d.id)}>

                                                {
                                                    d.notes && d.notes.length > 0 ?
                                                        String(expandedIndex).includes(d.id) ?
                                                            <IconButton> <ExpandLess /></IconButton>
                                                            :
                                                            <IconButton> <ExpandMore /></IconButton>
                                                        :
                                                        <IconButton disabled='true'><Icon /></IconButton>
                                                }
                                            </Box>
                                        </Tooltip>

                                    </ListItemButton>

                                    {
                                        String(expandedIndex).includes(d.id) ?
                                            <Collapse in={true} timeout="auto">
                                                <List component="div" disablePadding>
                                                    <Notelistitem
                                                        key={d.id}
                                                        data={d.notes}
                                                        indent={props.indent + 4}
                                                        style={{ width: 'inherit' }}
                                                        createNewPageChild={props.createNewPageChild}
                                                        currentNote={props.currentNote} />
                                                </List>
                                            </Collapse>

                                            :

                                            <Collapse in={d.id == expandedIndex} timeout="auto">
                                                <List component="div" disablePadding>
                                                    <Notelistitem
                                                        key={d.id}
                                                        data={d.notes}
                                                        indent={props.indent + 4}
                                                        style={{ width: 'inherit' }}
                                                        createNewPageChild={props.createNewPageChild}
                                                        currentNote={props.currentNote} />
                                                </List>
                                            </Collapse>

                                    }
                                </>
                            );
                        })}
                </div>
            </ThemeProvider>
        </>
    )
}

export default Notelistitem