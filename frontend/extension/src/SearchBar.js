import React from "react";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";


export default function SearchBar({ onSearch, searchBarTextChanged }) {

    const [text, setText] = React.useState("");

    const onChange = (e) => {
        searchBarTextChanged(e.target.value);
        setText(e.target.value);
    }

    const search = (e) => {
        e.preventDefault();
        onSearch({
            searchText: text,
        })
    };
    return (
        <form onSubmit={search} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
                <TextField
                    sx={{ ml: 1, flex: 1 }}
                    value={text}
                    onChange={onChange}
                    placeholder="Type a word, phrase, or question"
                    id="margin-none"
                    required
                    autoFocus
                    InputProps={{
                        endAdornment:
                            <IconButton type="submit" variant="contained" >
                                <SearchIcon />
                            </IconButton>
                    }}
                />

            </Stack>
        </form>
    );
}