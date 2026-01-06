import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState(null);
    return (
        <>
            <Box display="flex" alignItems="center" gap={1}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search Items..."
                    variant="outlined"
                    value={searchTerm ?? ""}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (onSearch) {
                            onSearch(e.target.value);
                            if(e.target.value === ""){
                                onSearch(null);
                            }
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'transparent',
                            border: 'none',
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                        },
                    }}
                />
                
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: '#fe6564',
                        minWidth: '40px',
                        '&:hover': { backgroundColor: '#fe6564' },
                        padding: '6px',
                    }}
                >
                    <NotificationsIcon />
                </Button>
            </Box>
        </>
    );
}
