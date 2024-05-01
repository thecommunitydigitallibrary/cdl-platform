import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Tooltip } from "@mui/material";
import { PushPin } from "@mui/icons-material";

export default function QuickSubmissionBox({ submissionData, pinned }) {

    return (
        < div className={pinned ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center max-w-screen-lg mx-auto"}>
            {
                submissionData.map((item, index) => (
                    <div key={index}
                        onClick={() => window.open(item.submission_url, "_blank")}
                        className={pinned ? "bg-white shadow rounded-lg p-2 transition-all duration-150 ease-in-out hover:shadow-lg cursor-pointer" : "bg-gray shadow-md rounded-lg overflow-hidden hover:shadow-lg cursor-pointer relative"}>
                        <Tooltip title={item.explanation}>
                            <div className={pinned ? "p-2 flex items-center justify-between" : "p-2 flex items-center"}>
                                <img
                                    className="w-8 h-8 mr-3"
                                    src="/images/tree48.png"
                                    alt="Tree Icon"
                                />
                                <Typography className="text-sm text-gray-800 truncate mr-8">{item.explanation}</Typography>
                                {pinned && (
                                    <PushPin className="w-4 h-4 text-blue-500 m-2" />

                                )}
                            </div>
                        </Tooltip>
                    </div>
                ))
            }
        </div >


    )

    return (
        <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
            maxWidth={'100ch'}
        >
            {submissionData.map((item, index) => (
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
