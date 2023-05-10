import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import ActionButton from '../buttons/actionbutton';
import { Box, MenuItem, Select, FormControl, FormHelperText } from "@mui/material";


function reusableForm(props) {
    return (
            <Box>
                <Box>
                {/* <label htmlFor="community" style={{color: "grey"}}>Select community: </label> */}
                </Box>
            <form onSubmit={props.handleSearch}>
                <div className="search">
                    <div className="search__input">
                        <input type="text"
                            id="query_input"
                            name="query"
                            placeholder="Search your communities"
                            required
                        />
                    </div>
                    <div id="community_select">

                    <FormControl sx={{ m: 1, minWidth: 10, paddingBottom: 2 }} size="small">
                    <FormHelperText>Select community</FormHelperText>
                        <Select
                            name="community"
                            labelId="demo-select-small"
                            id="community-dropdown"
                          
                            defaultValue={"all"}>
                                <MenuItem id="community-dropdown" value="all">All</MenuItem>
                           
                            {props.dropdowndata && props.dropdowndata.map(function (d, idx) {
                                return (
                                    <MenuItem id="community-dropdown" key={idx} value={d.community_id}>
                                        {d.name}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    </div>
                </div>

                <div className="search__buttons">
                    <ActionButton variant="contained" type="submit">
                        Search
                    </ActionButton>
                </div>
                
            </form>

            

        </Box>
    )
}

export default reusableForm

