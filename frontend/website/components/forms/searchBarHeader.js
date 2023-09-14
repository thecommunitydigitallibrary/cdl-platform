import React, {useState} from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { FormControl, MenuItem, Select, Tooltip } from "@mui/material";
import Router, {useRouter} from 'next/router';
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";

function searchBarHeader(props) {
    let initQuery = "";
    const router = useRouter();
    const obj = router.query;

    if (obj != undefined || obj != null || obj != "") {
        initQuery = obj["query"];
    }
    const [query, setQuery] = useState(initQuery)

    const handleSearch = async (event) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();
        Router.push(
            "/search?query=" +
            encodeURIComponent(event.target.query.value) +
            "&community=" +
            event.target.community.value +
            "&page=0"

        );
    };

    return (
        <>
            <form onSubmit={handleSearch}>
                <TextField
                    sx={{ m: 1 }}
                    style={{ width: props.isSmall ? '260px' : '60%', backgroundColor: 'white', borderRadius: '5px', 
                    position: "relative", }}
                    variant="outlined"
                    size="small"
                    type="text"
                    id="query_input"
                    name="query"
                    onChange={ e => { setQuery(e.currentTarget.value); } }
                    value={query}
                    placeholder="Search your communities"
                    required
                    InputProps={{
                        endAdornment: (
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
                                <SearchIcon />
                            </IconButton>),
                        style: {
                            paddingRight: 0, // remove right padding
                        },
                    }}
                />
                <FormControl
                    sx={{ m: 1, maxWidth: '25%', backgroundColor: 'white', borderRadius: '5px' }}
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

