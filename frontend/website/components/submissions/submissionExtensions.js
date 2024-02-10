import React, { useState } from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Typography, Grid, Button } from '@mui/material';
import Connections from './connections';
import SubmissionGraph from './submissionGraph';
import AddConnectionsButton from './addConnectionButton';

export default function SubmissionExtensions({ data, id, target }) {
    const [selectedOption, setSelectedOption] = useState('connections');

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

    return (
        <div style={{ width: "100%", display: 'flex', flexDirection: 'column' }}>

            <Grid container justifyContent={'space-between'}>

                <Grid item width={"80%"}>

                    {selectedOption === 'connections' &&
                        <AddConnectionsButton setSelectedOption={setSelectedOption} />}

                </Grid>
                <Grid item style={{ marginLeft: '16px', marginRight: '16px' }}>
                    <FormControl component="fieldset">
                        <Typography variant='subtitle2' gutterBottom style={{ fontSize: '0.9rem' }}>
                            Data Format
                        </Typography>
                        <RadioGroup
                            row
                            aria-label="submission-toggle"
                            name="submission-toggle"
                            value={selectedOption}
                            onChange={handleChange}
                        >

                            <FormControlLabel value="connections" control={<Radio />} label={<span style={{ fontSize: '0.8rem' }}>Mentions</span>} />
                            <FormControlLabel value="graph" control={<Radio />} label={<span style={{ fontSize: '0.8rem' }}>Graph</span>} />
                        </RadioGroup>
                    </FormControl>
                </Grid>

            </Grid>

            <div style={{ width: "100%", display: 'flex', justifyContent: 'center' }}>
                {selectedOption === 'graph' && <SubmissionGraph id={id} target={target} />}
                {selectedOption === 'connections' && <Connections submissionDataResponse={data} id={id} />}
            </div>
        </div>

    );
}
