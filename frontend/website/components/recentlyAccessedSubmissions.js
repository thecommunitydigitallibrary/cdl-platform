import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Tooltip } from "@mui/material";

export default function RecentlyAccessedSubmissions({ rec_acc_sub_data }) {
    return (
        <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
            maxWidth={'100ch'}
        >
            {rec_acc_sub_data.map((item, index) => (
                <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                    <Tooltip title={item.explanation}>
                        <Paper
                            elevation={2}
                            sx={{
                                padding: "10px",
                                borderRadius: "8px",
                                backgroundColor: "#f5f5f5",
                                transition: "background-color 0.3s",
                                cursor: 'pointer', // Add pointer cursor to indicate clickable
                                "&:hover": {
                                    backgroundColor: "#e0e0e0",
                                },
                            }}
                            onClick={() => window.open(item.submission_url, "_blank")}
                        >
                            <div style={{ display: "flex", alignItems: 'center' }}>
                                <img
                                    style={{ width: "24px", height: "24px", marginRight: "8px" }}
                                    src={'/images/tree48.png'}
                                    alt="Tree Icon"
                                />
                                <Typography variant="body1" noWrap>
                                    {item.explanation}
                                </Typography>
                            </div>
                        </Paper>
                    </Tooltip>
                </Grid>
            ))}
        </Grid>
    );
}
