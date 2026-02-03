"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    IconButton,
    Avatar,
    Chip,
    Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import BlockIcon from "@mui/icons-material/Block";
import dayjs from "dayjs";

export default function UserDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState("");
    const [progress, setProgress] = useState({
        completedDates: [],
        streak: 0,
        totalCompleted: 0,
        todayCompleted: false,
    });
    const [todaysVideo, setTodaysVideo] = useState(null); // Now contains {id, title, url}
    const [videoError, setVideoError] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [vrSupported, setVrSupported] = useState(false);
    const [isVrDevice, setIsVrDevice] = useState(false);
    const [deviceType, setDeviceType] = useState("Unknown");

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // Check WebXR support and detect device type
    useEffect(() => {
        const detectDevice = async () => {
            const userAgent = navigator.userAgent.toLowerCase();
            
            // Check for VR headsets first
            if (userAgent.includes("quest") || userAgent.includes("oculusbrowser")) {
                setDeviceType("Meta Quest");
                setIsVrDevice(true);
            } else if (userAgent.includes("oculus")) {
                setDeviceType("Oculus");
                setIsVrDevice(true);
            } else if (userAgent.includes("pico")) {
                setDeviceType("Pico");
                setIsVrDevice(true);
            } else if (userAgent.includes("vive")) {
                setDeviceType("HTC Vive");
                setIsVrDevice(true);
            } else if (userAgent.includes("wolvic")) {
                setDeviceType("Wolvic VR");
                setIsVrDevice(true);
            } else if (userAgent.includes("firefox reality")) {
                setDeviceType("Firefox Reality");
                setIsVrDevice(true);
            } else if (/iphone|ipad|ipod/.test(userAgent)) {
                setDeviceType("iOS Mobile");
                setIsVrDevice(false);
            } else if (/android/.test(userAgent) && /mobile/.test(userAgent)) {
                setDeviceType("Android Mobile");
                setIsVrDevice(false);
            } else if (/android/.test(userAgent)) {
                setDeviceType("Android Tablet");
                setIsVrDevice(false);
            } else if (/macintosh|mac os x/.test(userAgent)) {
                setDeviceType("Mac Desktop");
                setIsVrDevice(false);
            } else if (/windows/.test(userAgent)) {
                setDeviceType("Windows Desktop");
                setIsVrDevice(false);
            } else if (/linux/.test(userAgent)) {
                setDeviceType("Linux Desktop");
                setIsVrDevice(false);
            } else {
                setDeviceType("Unknown Device");
                setIsVrDevice(false);
            }
            
            // Also check WebXR support
            if (navigator.xr) {
                const supported = await navigator.xr.isSessionSupported("immersive-vr");
                setVrSupported(supported);
            }
        };
        
        detectDevice();
    }, []);

    const fetchProgress = useCallback(async (email, token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/progress?email=${encodeURIComponent(email)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setProgress(data);
            }
        } catch (err) {
            console.error("Failed to fetch progress:", err);
        }
    }, [API_BASE_URL]);

    const fetchTodaysVideo = useCallback(async (token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/videos/today/metadata`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTodaysVideo(data); // {id, title, url, assignedDate}
            } else {
                setVideoError("No video scheduled for today");
            }
        } catch (err) {
            setVideoError("Failed to load today's video");
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("userRole");
            const email = localStorage.getItem("userEmail");

            if (!token) {
                router.push("/");
                return;
            }

            // Redirect admins to admin dashboard
            if (role === "admin") {
                router.push("/dashboard");
                return;
            }

            setUserEmail(email || "");

            try {
                const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    localStorage.clear();
                    router.push("/");
                    return;
                }

                const data = await response.json();
                if (data.role === "admin") {
                    router.push("/dashboard");
                    return;
                }

                setUserEmail(data.email);
                await Promise.all([
                    fetchProgress(data.email, token),
                    fetchTodaysVideo(token),
                ]);
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, API_BASE_URL, fetchProgress, fetchTodaysVideo]);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/");
    };

    const handleMarkComplete = async () => {
        const token = localStorage.getItem("token");
        const today = dayjs().format("YYYY-MM-DD");

        try {
            const params = new URLSearchParams({
                email: userEmail,
                date: today,
            });

            const res = await fetch(`${API_BASE_URL}/api/videos/save-video-completion?${params}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                // Refresh progress
                await fetchProgress(userEmail, token);
            }
        } catch (err) {
            console.error("Failed to mark complete:", err);
        }
    };

    const generateCalendarDays = () => {
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");
        const startDay = startOfMonth.day();
        const daysInMonth = endOfMonth.date();

        const days = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            days.push({ day: null, isCompleted: false });
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = currentMonth.date(i).format("YYYY-MM-DD");
            const isCompleted = progress.completedDates.includes(dateStr);
            const isToday = dayjs().format("YYYY-MM-DD") === dateStr;
            const isFuture = dayjs(dateStr).isAfter(dayjs(), "day");
            days.push({ day: i, isCompleted, isToday, isFuture, dateStr });
        }

        return days;
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                sx={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                }}
            >
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                color: "#fff",
                pb: 4,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 3,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                        sx={{
                            bgcolor: "#00d4ff",
                            width: 48,
                            height: 48,
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                        }}
                    >
                        {userEmail?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="600" color="#fff">
                            Welcome back!
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            {userEmail}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    {/* Device Type Indicator */}
                    <Chip
                        icon={
                            isVrDevice ? (
                                <ViewInArIcon sx={{ color: "#fff !important" }} />
                            ) : deviceType.includes("Mobile") || deviceType.includes("iOS") || deviceType.includes("Android") ? (
                                <PhoneIphoneIcon sx={{ color: "#fff !important" }} />
                            ) : (
                                <DesktopWindowsIcon sx={{ color: "#fff !important" }} />
                            )
                        }
                        label={deviceType}
                        sx={{
                            bgcolor: isVrDevice ? "rgba(0, 200, 83, 0.3)" : "rgba(244, 67, 54, 0.3)",
                            color: "#fff",
                            fontWeight: 600,
                            border: isVrDevice ? "1px solid #00c853" : "1px solid #f44336",
                            "& .MuiChip-icon": {
                                color: "#fff",
                            },
                        }}
                    />
                    <Tooltip title="Logout">
                        <IconButton onClick={handleLogout} sx={{ color: "#fff" }}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, mt: 4 }}>
                {/* Stats Row */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
                        gap: 3,
                        mb: 4,
                    }}
                >
                    {/* Streak Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <LocalFireDepartmentIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h3" fontWeight="800">
                                {progress.streak}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Day Streak
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Total Completed Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <EmojiEventsIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h3" fontWeight="800">
                                {progress.totalCompleted}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Sessions Complete
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Today's Status Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            background: progress.todayCompleted
                                ? "linear-gradient(135deg, #00c851 0%, #007e33 100%)"
                                : "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            gridColumn: { xs: "span 2", md: "span 1" },
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 48 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="700">
                                {progress.todayCompleted ? "Complete!" : "Not Yet"}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Today&apos;s Session
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Main Content Grid */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
                        gap: 4,
                    }}
                >
                    {/* Video Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                        }}
                    >
                        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <Typography variant="h5" fontWeight="700" display="flex" alignItems="center" gap={1} color="#fff">
                                <PlayArrowIcon sx={{ color: "#00d4ff" }} />
                                Today&apos;s Therapy Session
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                                {dayjs().format("MMMM D, YYYY")}
                            </Typography>
                        </Box>

                        {videoError ? (
                            <Box sx={{ p: 6, textAlign: "center" }}>
                                <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                                    {videoError}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                    Check back later for your daily session
                                </Typography>
                            </Box>
                        ) : !isVrDevice ? (
                            /* Block non-VR devices */
                            <Box
                                sx={{
                                    position: "relative",
                                    paddingTop: "56.25%",
                                    background: "linear-gradient(135deg, #2d1f1f 0%, #1a1a2e 100%)",
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 2,
                                        p: 3,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            boxShadow: "0 0 40px rgba(244, 67, 54, 0.4)",
                                        }}
                                    >
                                        <BlockIcon sx={{ fontSize: 50, color: "#fff" }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="600" color="#fff" textAlign="center">
                                        VR Headset Required
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 400 }}>
                                        This therapy session must be viewed on a VR headset for the full immersive experience. Please access this page from your Meta Quest, Pico, or other VR device.
                                    </Typography>
                                    <Chip
                                        icon={<ViewInArIcon />}
                                        label={`Current device: ${deviceType}`}
                                        sx={{
                                            mt: 1,
                                            bgcolor: "rgba(244, 67, 54, 0.2)",
                                            color: "#f44336",
                                            border: "1px solid #f44336",
                                            "& .MuiChip-icon": { color: "#f44336" },
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : progress.todayCompleted ? (
                            /* Video already completed - show message */
                            <Box
                                sx={{
                                    position: "relative",
                                    paddingTop: "56.25%",
                                    background: "linear-gradient(135deg, #2d1f1f 0%, #1a1a2e 100%)",
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 2,
                                        p: 3,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            boxShadow: "0 0 40px rgba(76, 175, 80, 0.4)",
                                        }}
                                    >
                                        <CheckCircleIcon sx={{ fontSize: 50, color: "#fff" }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="600" color="#fff" textAlign="center">
                                        Session Already Completed
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 400 }}>
                                        You have already completed today&apos;s therapy session. Please check back tomorrow for your next session.
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            /* VR Device - Show button to launch immersive VR player */
                            <Box
                                sx={{
                                    position: "relative",
                                    paddingTop: "56.25%",
                                    background: "linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    // Navigate to the VR player page with video URL
                                    router.push(`/user/vr?url=${encodeURIComponent(todaysVideo.url)}&videoId=${todaysVideo.id}&title=${encodeURIComponent(todaysVideo.title)}`);
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            boxShadow: "0 0 40px rgba(0, 212, 255, 0.4)",
                                            transition: "transform 0.3s, box-shadow 0.3s",
                                            "&:hover": {
                                                transform: "scale(1.1)",
                                                boxShadow: "0 0 60px rgba(0, 212, 255, 0.6)",
                                            },
                                        }}
                                    >
                                        <ViewInArIcon sx={{ fontSize: 50, color: "#fff" }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="600" color="#fff">
                                        Enter Immersive VR Mode
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", px: 2 }}>
                                        Click to launch full VR experience
                                    </Typography>
                                    <Chip
                                        icon={<ViewInArIcon />}
                                        label="WebXR Ready"
                                        size="small"
                                        sx={{
                                            bgcolor: "rgba(0, 200, 83, 0.2)",
                                            color: "#00c853",
                                            border: "1px solid #00c853",
                                            "& .MuiChip-icon": { color: "#00c853" },
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    {/* Calendar Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            overflow: "hidden",
                            color: "#fff",
                        }}
                    >
                        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <Typography variant="h5" fontWeight="700" display="flex" alignItems="center" gap={1} color="#fff">
                                <CalendarMonthIcon sx={{ color: "#00d4ff" }} />
                                Your Progress
                            </Typography>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {/* Month Navigation */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <IconButton
                                    onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
                                    sx={{ color: "#fff" }}
                                >
                                    ←
                                </IconButton>
                                <Typography variant="h6" fontWeight="600" color="#fff">
                                    {currentMonth.format("MMMM YYYY")}
                                </Typography>
                                <IconButton
                                    onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                                    sx={{ color: "#fff" }}
                                    disabled={currentMonth.isSame(dayjs(), "month")}
                                >
                                    →
                                </IconButton>
                            </Box>

                            {/* Day Headers */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    gap: 0.5,
                                    mb: 1,
                                }}
                            >
                                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                    <Typography
                                        key={i}
                                        variant="caption"
                                        textAlign="center"
                                        sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}
                                    >
                                        {day}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Calendar Grid */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(7, 1fr)",
                                    gap: 0.5,
                                }}
                            >
                                {generateCalendarDays().map((item, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            aspectRatio: "1",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderRadius: 2,
                                            fontSize: "0.875rem",
                                            fontWeight: item.isToday ? 700 : 500,
                                            bgcolor: item.isCompleted
                                                ? "rgba(0, 200, 81, 0.3)"
                                                : item.isToday
                                                ? "rgba(0, 212, 255, 0.2)"
                                                : "transparent",
                                            border: item.isToday ? "2px solid #00d4ff" : "none",
                                            color: item.isFuture ? "rgba(255,255,255,0.3)" : "#fff",
                                            position: "relative",
                                        }}
                                    >
                                        {item.day}
                                        {item.isCompleted && (
                                            <CheckCircleIcon
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 2,
                                                    right: 2,
                                                    fontSize: 12,
                                                    color: "#00c851",
                                                }}
                                            />
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {/* Legend */}
                            <Box display="flex" gap={3} mt={3} justifyContent="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: 1,
                                            bgcolor: "rgba(0, 200, 81, 0.3)",
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        Completed
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: 1,
                                            border: "2px solid #00d4ff",
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        Today
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Motivational Footer */}
                {progress.streak >= 3 && (
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 4,
                            p: 3,
                            borderRadius: 4,
                            background: "linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(247, 147, 30, 0.2) 100%)",
                            border: "1px solid rgba(255, 107, 53, 0.3)",
                            textAlign: "center",
                            color: "#fff",
                        }}
                    >
                        <LocalFireDepartmentIcon sx={{ fontSize: 40, color: "#ff6b35", mb: 1 }} />
                        <Typography variant="h6" fontWeight="700" sx={{ color: "#ff6b35" }}>
                            🎉 You&apos;re on fire! {progress.streak} day streak!
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}>
                            Keep up the amazing work on your wellness journey!
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
}

