import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { FormControl, MenuItem, Select, Tooltip } from "@mui/material";
import Router, { useRouter } from 'next/router';
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import jsCookie from "js-cookie";
import Stack from '@mui/material/Stack';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';



function searchBarHeader(props) {


    let initQuery = "";
    const router = useRouter();
    const obj = router.query;

    const [suggestions, setSuggestions] = useState([]);

    if ("query" in obj) {
        initQuery = obj["query"];
    }

    const [inputValue, setInputValue] = useState(initQuery);



    const handleSearch = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();

        //No submit on empty query
        if (inputValue.length == 0) {
            return
        } else {
            Router.push(
                "/search?query=" +
                encodeURIComponent(inputValue) +
                "&community=" +
                event.target.community.value +
                "&page=0"
            );
        }
    };

    

    const baseURL_client = process.env.NEXT_PUBLIC_FROM_CLIENT + "api/";
    const AUTOCOMPLETE_ENDPOINT = baseURL_client + "autocomplete"


    useEffect(() => {
        const fetchSuggestions = async () => {
            const res = await fetch(AUTOCOMPLETE_ENDPOINT + "?query=" + inputValue, {
                method: "GET",
                headers: new Headers({
                  Authorization: jsCookie.get("token"),
                }),
              });
              const response = await res.json();
              if (res.status == 200) {
                setSuggestions(response.suggestions);
              } else {
                console.log(response.message)
                setSuggestions([])
              }
        };

        if (inputValue !== '') {
            if (inputValue.slice(-1) == " ") {
                fetchSuggestions();
            }
        } else {
            setSuggestions([]); // Clear suggestions when inputValue is empty
        }
    }, [inputValue]);


    const handleVisualizeCommunity = (event) => {
        if (inputValue.length == 0) {
            return
        }
        if(router.asPath.includes("visualizemap"))
            window.location = "/visualizemap?query=" + encodeURIComponent(inputValue) + "&community=all&levelfilter=topics";
        Router.push(
            "/visualizemap?query=" +
            encodeURIComponent(inputValue) +
            "&community=all" +
            "&levelfilter=topics"
        );
    }

    return (
        <>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>

                <Stack spacing={2} 
                    style={{
                        width: props.isSmall ? '260px' : '60%', borderRadius: '5px',
                        position: "relative", paddingRight: "5px"
                    }}>
                    <Autocomplete
                        id="autocomplete"
                        // calling the freeSolo prop inside the Autocomplete component
                        freeSolo
                        filterOptions={(x) => x}
                        options={suggestions.map((option) => option.label)}
                        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                        value={inputValue}
                        renderInput={(params) => 
                            <TextField {...params}
                                required
                                variant="outlined"
                                sx={{ m:1 }}
                                style={{
                                    backgroundColor: 'white', borderRadius: '5px',
                                    position: "relative"
                                }}
                                size="small"
                                type="text"
                                placeholder="Search your communities"
                                id="query_input"
                                onSubmit={handleSearch}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                           <IconButton type="submit"
                                            variant="contained"
                                            sx={{
                                                border: "1px solid #efffff",
                                                bgcolor: '#eceff1',
                                                borderRadius: 1,
                                                transition: "transform 0.3s ease, width 0.3s ease",
                                                transform: "translateZ(0)",
                                                width: '40px',
                                                "&:hover": {
                                                    border: "1px solid #eceff1",
                                                    bgcolor: "#F5F5F5",
                                                    color: '#696969',
                                                    transform: "translateZ(30px)",
                                                    width: '60px'
                                                },
                                            }}
                                            >
                                                <Tooltip title={"Search"}>
                                                    <SearchIcon />
                                                </Tooltip>
                                            </IconButton>
                                            <IconButton
                                            variant="contained"
                                            onClick={handleVisualizeCommunity}
                                            sx={{
                                                border: "1px solid #efffff",
                                                bgcolor: '#eceff1',
                                                borderRadius: 1,
                                                transition: "transform 0.3s ease, width 0.3s ease",
                                                transform: "translateZ(0)",
                                                width: '40px',
                                                "&:hover": {
                                                    border: "1px solid #eceff1",
                                                    bgcolor: "#F5F5F5",
                                                    color: '#696969',
                                                    transform: "translateZ(30px)",
                                                    width: '60px'
                                                },
                                            }}
                                            >
                                                <Tooltip title={"Visualize"}>
                                                    <BubbleChartIcon
                                                    style={{marginLeft: "5px", marginRight: "5px"}}
                                                    size="medium"

                                                 />
                                                </Tooltip>
                                            </IconButton>
                                            
                                        </>
                                    ),
                                    style: {
                                        padding: 0,
                                        overflow: "hidden"
                                    },
                                }}
                            />
                        }
                        
                    />


                </Stack>


                <FormControl
                    sx={{ m: 1, maxWidth: '25%', backgroundColor: 'white', borderRadius: '5px', float: "left"}}
                    size="small">
                    <Select
                        style={{ backgroundColor: "white" }}
                        name="community"
                        defaultValue={"all"}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: "220px",
                                    overflowY: "scroll"
                                }
                            }
                        }}
                    >
                        <MenuItem value="all">All</MenuItem>
                        {props.dropdowndata && props.dropdowndata.map(function (d, idx) {
                            return (
                                <MenuItem key={idx} value={d.community_id}>
                                    {d.name.length > 50 ?
                                        d.name.substring(0, 40) + ".."
                                        :
                                        d.name
                                    }
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </form>
        </>
    )
}

export default searchBarHeader

