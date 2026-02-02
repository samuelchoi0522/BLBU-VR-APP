"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import { Typography, Box, Paper, IconButton, Container, Chip, CircularProgress } from "@mui/material";
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
        const encodedEmail = encodeURIComponent(email);

        fetch(`${API_BASE_URL}/api/users/video-completions?email=${encodedEmail}`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setCompletedDates(data.completedDates || []);
                setUser(data.user || {});
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch video completions:", err);
                setLoading(false);
            });
    }, [email]);


    const isCompleted = (date) =>
        completedDates.includes(dayjs(date).format("YYYY-MM-DD"));

    const handleBackClick = () => {
        window.history.back();
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                py: 4,
            }}
        >
            <Container maxWidth="md">
                <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton
                        onClick={handleBackClick}
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#fff",
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="700" color="#fff">
                            Video Completion Calendar
                        </Typography>
                        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                            {user.firstName || user.lastName
                                ? `for ${user.firstName} ${user.lastName}`.trim()
                                : `for ${email}`}
                        </Typography>
                    </Box>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}
                >
                    {loading ? (
                        <Box display="flex" alignItems="center" gap={2} py={4}>
                            <CircularProgress sx={{ color: "#00d4ff" }} size={24} />
                            <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Loading calendar...</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 3, display: "flex", gap: 3, alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            background: "linear-gradient(135deg, #00c851 0%, #007e33 100%)",
                                            borderRadius: 1,
                                            boxShadow: "0 2px 8px rgba(0, 200, 81, 0.3)",
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        Completed
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            backgroundColor: "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            borderRadius: 1
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        Not Completed
                                    </Typography>
                                </Box>
                            </Box>

                            <Chip
                                label={`${completedDates.length} ${completedDates.length === 1 ? 'day' : 'days'} completed`}
                                sx={{
                                    mb: 3,
                                    bgcolor: "rgba(0, 200, 81, 0.2)",
                                    color: "#00c851",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    px: 1,
                                }}
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
                                                        backgroundColor: completed 
                                                            ? "#00c851" 
                                                            : "transparent",
                                                        color: completed 
                                                            ? "#fff" 
                                                            : "rgba(255,255,255,0.8)",
                                                        fontWeight: completed ? 600 : 400,
                                                        "&:hover": {
                                                            backgroundColor: completed
                                                                ? "#00a844"
                                                                : "rgba(255,255,255,0.1)",
                                                        },
                                                        "&.Mui-selected": {
                                                            backgroundColor: completed ? "#00c851" : "#00d4ff",
                                                        },
                                                        "&.MuiPickersDay-today": {
                                                            border: "2px solid #00d4ff",
                                                        },
                                                    }}
                                                />
                                            );
                                        },
                                    }}
                                    sx={{
                                        maxWidth: "100%",
                                        color: "#fff",
                                        "& .MuiPickersCalendarHeader-root": {
                                            color: "#fff",
                                            paddingLeft: 2,
                                            paddingRight: 2,
                                        },
                                        "& .MuiPickersCalendarHeader-label": {
                                            color: "#fff",
                                            fontWeight: 600,
                                        },
                                        "& .MuiPickersArrowSwitcher-button": {
                                            color: "rgba(255,255,255,0.7)",
                                            "&:hover": {
                                                backgroundColor: "rgba(255,255,255,0.1)",
                                            },
                                        },
                                        "& .MuiDayCalendar-weekDayLabel": {
                                            color: "rgba(255,255,255,0.5)",
                                            fontWeight: 600,
                                        },
                                        "& .MuiPickersDay-root": {
                                            color: "rgba(255,255,255,0.8)",
                                        },
                                        "& .MuiPickersDay-root.Mui-disabled": {
                                            color: "rgba(255,255,255,0.3)",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
