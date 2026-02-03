"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
    Button,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsIcon from "@mui/icons-material/Notifications";
import dayjs from "dayjs";

export default function DailyCompletionOverview() {
    const [loading, setLoading] = useState(true);
    const [completionData, setCompletionData] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const fetchCompletionStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/users/todays-completion-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCompletionData(data);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch completion status:", err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    // Check for scheduled notification times (11am, 4pm, 6pm)
    useEffect(() => {
        const checkNotificationTime = () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();

            // Check if it's exactly 11am, 4pm, or 6pm (within 1 minute window)
            if (
                (hour === 11 && minute === 0) ||
                (hour === 16 && minute === 0) ||
                (hour === 18 && minute === 0)
            ) {
                if (completionData && completionData.notCompletedCount > 0) {
                    setNotification({
                        time: `${hour}:${String(minute).padStart(2, '0')}`,
                        message: `${completionData.notCompletedCount} user(s) haven't finished today's video yet`,
                        users: completionData.notCompletedUsers,
                    });
                }
            }
        };

        // Check every minute
        const interval = setInterval(checkNotificationTime, 60000);
        checkNotificationTime(); // Check immediately

        return () => clearInterval(interval);
    }, [completionData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        fetchCompletionStatus();
        const interval = setInterval(fetchCompletionStatus, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [fetchCompletionStatus]);

    // Format time
    const formatTime = (date) => {
        if (!date) return "Never";
        return dayjs(date).format("h:mm A");
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    if (!completionData) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Typography color="#fff">No completion data available</Typography>
            </Paper>
        );
    }

    const completionRate = completionData.totalUsers > 0
        ? Math.round((completionData.completedCount / completionData.totalUsers) * 100)
        : 0;

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Box>
                        <Typography variant="h5" fontWeight="700" color="#fff" gutterBottom>
                            Today's Completion Overview
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                            {dayjs(completionData.date).format("MMMM D, YYYY")}
                            {lastUpdate && ` • Last updated: ${formatTime(lastUpdate)}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(0, 212, 255, 0.8)", mt: 0.5, display: "block" }}>
                            📊 Showing only active trial participants
                        </Typography>
                    </Box>
                </Box>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchCompletionStatus}
                    sx={{
                        color: "#00d4ff",
                        borderColor: "#00d4ff",
                        "&:hover": {
                            borderColor: "#00b4d8",
                            bgcolor: "rgba(0, 212, 255, 0.1)",
                        },
                    }}
                    variant="outlined"
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

            {/* Notification Alert */}
            {notification && (
                <Alert
                    severity="warning"
                    icon={<NotificationsIcon />}
                    onClose={() => setNotification(null)}
                    sx={{ mb: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => {
                                // Scroll to not completed section
                                document.getElementById("not-completed-section")?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            View
                        </Button>
                    }
                >
                    <Typography fontWeight={600}>
                        {notification.time} - {notification.message}
                    </Typography>
                </Alert>
            )}

            {/* Summary Cards */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        minWidth: 200,
                        p: 3,
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                        boxShadow: "0 8px 32px rgba(76, 175, 80, 0.3)",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                bgcolor: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 32, color: "#fff" }} />
                        </Box>
                        <Box>
                            <Typography variant="h3" fontWeight="800" color="#fff">
                                {completionData.completedCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                Completed
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        minWidth: 200,
                        p: 3,
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                        boxShadow: "0 8px 32px rgba(255, 152, 0, 0.3)",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                bgcolor: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CancelIcon sx={{ fontSize: 32, color: "#fff" }} />
                        </Box>
                        <Box>
                            <Typography variant="h3" fontWeight="800" color="#fff">
                                {completionData.notCompletedCount}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                Not Completed
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        flex: 1,
                        minWidth: 200,
                        p: 3,
                        borderRadius: 3,
                        background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                        boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                bgcolor: "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography variant="h4" fontWeight="800" color="#fff">
                                {completionRate}%
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h3" fontWeight="800" color="#fff">
                                {completionData.totalUsers}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                Total Users
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Completed Users */}
            {completionData.completedUsers.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(76, 175, 80, 0.3)",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CheckCircleIcon sx={{ color: "#4caf50" }} />
                        <Typography variant="h6" fontWeight="600" color="#fff">
                            Completed ({completionData.completedUsers.length})
                        </Typography>
                    </Box>
                    <List>
                        {completionData.completedUsers.map((user, index) => (
                            <React.Fragment key={user.email}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "#4caf50" }}>
                                            {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.displayName || user.email}
                                        secondary={user.email}
                                        primaryTypographyProps={{ color: "#fff" }}
                                        secondaryTypographyProps={{ color: "rgba(255,255,255,0.6)" }}
                                    />
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Completed"
                                        size="small"
                                        sx={{
                                            bgcolor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    />
                                </ListItem>
                                {index < completionData.completedUsers.length - 1 && <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Not Completed Users */}
            {completionData.notCompletedUsers.length > 0 && (
                <Paper
                    id="not-completed-section"
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 152, 0, 0.3)",
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CancelIcon sx={{ color: "#ff9800" }} />
                        <Typography variant="h6" fontWeight="600" color="#fff">
                            Not Completed ({completionData.notCompletedUsers.length})
                        </Typography>
                    </Box>
                    <List>
                        {completionData.notCompletedUsers.map((user, index) => (
                            <React.Fragment key={user.email}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "#ff9800" }}>
                                            {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.displayName || user.email}
                                        secondary={user.email}
                                        primaryTypographyProps={{ color: "#fff" }}
                                        secondaryTypographyProps={{ color: "rgba(255,255,255,0.6)" }}
                                    />
                                    <Chip
                                        icon={<CancelIcon />}
                                        label="Pending"
                                        size="small"
                                        sx={{
                                            bgcolor: "#ff9800",
                                            color: "#fff",
                                        }}
                                    />
                                </ListItem>
                                {index < completionData.notCompletedUsers.length - 1 && <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Empty State */}
            {completionData.completedUsers.length === 0 && completionData.notCompletedUsers.length === 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        textAlign: "center",
                    }}
                >
                    <Typography color="rgba(255,255,255,0.6)">
                        No users found. Make sure VR app users are registered.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}

