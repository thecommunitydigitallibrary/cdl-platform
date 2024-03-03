import React from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';


export default function SideNav() {
    return (
        <IconButton
            variant="extended"
            onClick={() => {
                console.log('open sesame');
            }}
            sx={{
                width: '10px',
                height: '10px',
                position: 'fixed', // Use 'fixed' to keep it in the same place on the screen
                top: '50%', // Start at the top 50% of the screen
                left: '0', // Align to the left side of the screen
                transform: 'translateY(-50%) rotate(-90deg)', // Rotate the button by 90 degrees
                border: 'solid',
                color: '#1976d2',
                "&:hover": {
                    backgroundColor: "#1976d2",
                    color: 'white'
                }
            }}
        >

            <ExpandCircleDownIcon color="inherit" /> {/* Use "inherit" to ensure the icon color inherits from the parent */}
        </IconButton>
    );
}
