import React from 'react';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import Box from '@mui/material/Box';
import { Tooltip, Typography } from '@mui/material';
import useSubmissionStore from '../../store/submissionStore';

export default function SubmissionStatistics() {
    const { submissionStats } = useSubmissionStore();
    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: 1,
                    borderRadius: '30px',
                    overflow: 'hidden',
                    paddingX: '4px',
                    borderColor: 'gray',
                }}
            >
                <Tooltip title="Views">
                    <IconButton size="small" aria-label="view">
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Typography sx={{ borderRight: '1px solid #ccc', paddingX: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {submissionStats.views}
                </Typography>
                <Tooltip title="Shares">
                    <IconButton size="small" aria-label="go">
                        <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Typography sx={{ borderRight: '1px solid #ccc', paddingX: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {submissionStats.shares}
                </Typography>
                <Tooltip title="Clicks">
                    <IconButton size="small" aria-label="touch">
                        <TouchAppIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Typography sx={{ paddingX: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {submissionStats.clicks}
                </Typography>
            </Box>
        </>
    )
}
