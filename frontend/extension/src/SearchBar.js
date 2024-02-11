import React from "react";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { FormControl, MenuItem, Select } from "@mui/material";


export default function SearchBar({ allCommunities, onSearch }) {

    const [text, setText] = React.useState("");

    const onChange = (e) => setText(e.target.value);

    const search = (e) => {
        e.preventDefault();
        onSearch({
            searchText: text,
            selectedCommunity: e.target.community.value
        })
    };
    return (
        <form onSubmit={search} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
                <TextField
                    sx={{ ml: 1, flex: 1 }}
                    value={text}
                    onChange={onChange}
                    placeholder="Search your communities"
                    id="margin-none"
                    required
                    InputProps={{
                        endAdornment:
                            <IconButton type="submit" variant="contained" >
                                <SearchIcon />
                            </IconButton>
                    }}
                />
                <FormControl style={{ maxWidth: 100 }}>
                    <Select
                        style={{ backgroundColor: "white" }}
                        name="community"
                        defaultValue={"all"}
                    >
                        <MenuItem value="all">All</MenuItem>
                        {allCommunities.length > 0 &&
                            allCommunities.map(function (community, idx) {
                                return (
                                    <MenuItem
                                        key={community.community_id}
                                        value={community.community_id}
                                    >
                                        {community.name}
                                    </MenuItem>);
                            })}
                    </Select>
                </FormControl>

            </Stack>
        </form>
    );
}