import React, { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { FormControl, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { white } from '@mui/material/colors';

import Router, { useRouter } from 'next/router';
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import jsCookie from "js-cookie";
import Stack from '@mui/material/Stack';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import useUserDataStore from '../../store/userData';
import useQuickAccessStore from '../../store/quickAccessStore';

import { BASE_URL_CLIENT, AUTOCOMPLETE_ENDPOINT } from "../../static/constants";


function searchBarHeader(props) {


    let initQuery = "";
    const router = useRouter();
    const obj = router.query;

    const [suggestions, setSuggestions] = useState([]);

    if ("query" in obj) {
        initQuery = obj["query"];
    }

    const [inputValue, setInputValue] = useState(initQuery);
    const [selectedCommunity, setSelectedCommunity] = useState("all");
    const { ownSubmissionToggle, setQuickAccessStoreProps } = useQuickAccessStore();

    const updateOwnSubmissionToggle = async (event) => {
        const { value, checked } = event.target;
        setQuickAccessStoreProps({ ownSubmissionToggle: checked })
    }


    function handleSuggestionClick(option) {
        for (let i = 0; i < suggestions.length; i++) {
            if (suggestions[i].label == option) {
                window.open(suggestions[i].url)
            }
        }
    }



    const handleSearch = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();

        var q = "/search?query=" +
            encodeURIComponent(inputValue) +
            "&community=" +
            event.target.community.value +
            "&page=0"

        if (ownSubmissionToggle) {
            q = q + "&own_submissions=True"
        }

        //No submit on empty query with all community
        if (inputValue.length == 0 && event.target.community.value == "all") {
            return
        } else {
            Router.push(q);
        }
    };

    const { userCommunities, userFollowedCommunities } = useUserDataStore();

    useEffect(() => {
        const fetchSuggestions = async () => {
            const res = await fetch(BASE_URL_CLIENT + AUTOCOMPLETE_ENDPOINT + "?query=" + inputValue, {
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

    const captureCommunityChange = (e) => {
        e.preventDefault();
        setSelectedCommunity(e.target.value);
    };

    const handleVisualizeCommunity = (event) => {

        if (inputValue.length == 0) {
            return
        }

        let url = "/visualizemap?query=" +
            encodeURIComponent(inputValue) +
            "&community=" +
            selectedCommunity +
            "&visualize=True";

        if (ownSubmissionToggle)
            url += "&own_submissions=True"

        Router.push(url);
    }



    return (
        <>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>

                <Stack spacing={2}
                    style={{
                        width: props.isSmall ? '225px' : '60%', borderRadius: '5px',
                        position: "relative", paddingRight: "5px"
                    }}>
                    <Autocomplete
                        id="autocomplete"
                        // calling the freeSolo prop inside the Autocomplete component
                        freeSolo
                        filterOptions={(x) => x}
                        options={suggestions.map((option) => option.label)}
                        onChange={(event, option) => {
                            handleSuggestionClick(option);
                        }}
                        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                        value={inputValue}
                        renderInput={(params) =>
                            <TextField {...params}
                                variant="outlined"
                                // sx={{ m: 1 }}
                                style={{
                                    backgroundColor: 'white', borderRadius: '5px',
                                    position: "relative"
                                }}
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
                                                        style={{ marginLeft: "5px", marginRight: "5px" }}
                                                        size="medium"

                                                    />
                                                </Tooltip>
                                            </IconButton>

                                        </>
                                    ),
                                    style: {
                                        padding: 0,
                                        overflow: "hidden",
                                    },
                                }}>
                            </TextField>
                        }
                    />
                </Stack>

                <FormControl className="m-1 max-w-1/4 bg-white rounded-5 float-left" size="small">
                    <Select
                        className="bg-white text-md"
                        size='small'
                        name="community"
                        defaultValue={"all"}
                        onChange={captureCommunityChange}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: "220px",
                                    overflowY: "scroll",
                                }
                            }
                        }}
                    >
                        <MenuItem value="all">All</MenuItem>
                        {userCommunities && userFollowedCommunities &&
                            userFollowedCommunities.concat(userCommunities).map(function (d, idx) {
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
                {!props.isSmall && <FormControl
                    sx={{ m: 1, maxWidth: '15%', borderRadius: '5px', float: "left" }}
                >
                    <FormControlLabel sx={{ color: "white" }}
                        control={
                            <Checkbox
                                checked={ownSubmissionToggle}
                                size='small'
                                sx={{ color: "white", '&.Mui-checked': { color: "white", }, }}
                                onChange={updateOwnSubmissionToggle}
                            />
                        }

                        label={<Typography fontSize={'0.7rem'}>{!props.isSmall && 'Only My Submissions'}</Typography>} />
                </FormControl>}
            </form>
        </>
    )
}

export default searchBarHeader

