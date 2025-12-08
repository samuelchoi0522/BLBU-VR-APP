"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import { Typography, Box, Paper, IconButton, Container, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function UserCalendarPage({ params }) {
    const resolvedParams = use(params);
    const email = decodeURIComponent(resolvedParams.id);
    const [completedDates, setCompletedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ first: "", last: "" });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/users/${email}/video-completions`)
            .then((res) => res.json())
            .then((data) => {
                setCompletedDates(data.completedDates || data);
                setUser(data.user);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [email]);

    const isCompleted = (date) =>
        completedDates.includes(dayjs(date).format("YYYY-MM-DD"));

    const handleBackClick = () => {
        window.history.back();
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                    onClick={handleBackClick}
                    sx={{
                        backgroundColor: "background.paper",
                        boxShadow: 1,
                        "&:hover": { backgroundColor: "action.hover" }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight="600" color="text.primary">
                        Video Completion Calendar
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {user.firstName || user.lastName
                            ? `for ${user.firstName} ${user.lastName}`.trim()
                            : `for ${email}`}
                    </Typography>
                </Box>
            </Box>

            <Paper
                elevation={2}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}
            >
                {loading ? (
                    <Typography>Loading calendar...</Typography>
                ) : (
                    <>
                        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 20,
                                        height: 20,
                                        backgroundColor: "#4caf50",
                                        borderRadius: 1
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Completed
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 20,
                                        height: 20,
                                        backgroundColor: "#f5f5f5",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 1
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Not Completed
                                </Typography>
                            </Box>
                        </Box>

                        <Chip
                            label={`${completedDates.length} ${completedDates.length === 1 ? 'day' : 'days'} completed`}
                            color="success"
                            sx={{ mb: 2 }}
                        />

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateCalendar
                                readOnly
                                slots={{
                                    day: (props) => {
                                        const completed = isCompleted(props.day);
                                        return (
                                            <PickersDay
                                                {...props}
                                                sx={{
                                                    backgroundColor: completed ? "#4caf50" : "transparent",
                                                    color: completed ? "white" : "text.primary",
                                                    fontWeight: completed ? 600 : 400,
                                                    "&:hover": {
                                                        backgroundColor: completed
                                                            ? "#45a049"
                                                            : "action.hover",
                                                    },
                                                    "&.Mui-selected": {
                                                        backgroundColor: completed ? "#4caf50" : "primary.main",
                                                    }
                                                }}
                                            />
                                        );
                                    },
                                }}
                                sx={{
                                    maxWidth: "100%",
                                    "& .MuiPickersCalendarHeader-root": {
                                        paddingLeft: 2,
                                        paddingRight: 2,
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </>
                )}
            </Paper>
        </Container>
    );
}