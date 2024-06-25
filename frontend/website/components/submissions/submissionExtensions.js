import React, { useState } from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, Typography, Grid } from '@mui/material';
import Connections from './connections';
import SubmissionRecommendations from "./submissionRecommendations";
import AddConnectionsButton from './addConnectionButton';

export default function SubmissionExtensions({ data, id, target }) {
    const [selectedOption, setSelectedOption] = useState('connections');

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

    return (
        <div style={{ width: "100%", display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: "100%", display: 'flex', justifyContent: 'center' }}>
                <Connections submissionDataResponse={data} id={id} />
            </div>
        </div>

    );
}
