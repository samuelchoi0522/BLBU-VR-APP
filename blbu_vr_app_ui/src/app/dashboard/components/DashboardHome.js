"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    CircularProgress,
    Chip,
} from "@mui/material";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import GroupIcon from "@mui/icons-material/Group";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";
import DailyCompletionOverview from "./DailyCompletionOverview";

export default function DashboardHome({ setActiveTab }) {
    const [loading, setLoading] = useState(true);
    const [videoCount, setVideoCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [videos, setVideos] = useState([]);

    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const formatDateToCST = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                timeZone: "America/Chicago",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return "N/A";
        return dayjs(dateString, "YYYY-MM-DD").format("MMM D, YYYY");
    };

    useEffect(() => {
        const verifySessionAndLoadData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    localStorage.removeItem("token");
                    router.push("/");
                    return;
                }

                await Promise.all([
                    fetchVideoCount(token),
                    fetchUserCount(token),
                    fetchAllVideos(token),
                ]);

                setLoading(false);
            } catch (err) {
                console.error("Session verification failed:", err);
                localStorage.removeItem("token");
                router.push("/");
            }
        };

        verifySessionAndLoadData();
    }, [router, API_BASE_URL]);

    const fetchVideoCount = async (token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/videos/count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const count = await res.json();
                setVideoCount(count);
            }
        } catch (error) {
            console.error("Error fetching video count:", error);
        }
    };

    const fetchUserCount = async (token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/get-total-users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const count = await res.json();
                setUserCount(count.totalUsers);
            }
        } catch (error) {
            console.error("Error fetching user count:", error);
        }
    };

    const fetchAllVideos = async (token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/videos/get-all-videos`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const sortedVideos = data.sort((a, b) => {
                    const dateA = new Date(a.updatedAt);
                    const dateB = new Date(b.updatedAt);
                    return dateB - dateA;
                });
                setVideos(sortedVideos);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    const statsCards = [
        {
            title: "Total Videos",
            value: videoCount,
            icon: VideoLibraryIcon,
            gradient: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
            shadowColor: "rgba(0, 212, 255, 0.3)",
        },
        {
            title: "Total Users",
            value: userCount,
            icon: GroupIcon,
            gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
            shadowColor: "rgba(108, 92, 231, 0.3)",
        },
        {
            title: "This Month",
            value: videos.filter(v => {
                const date = new Date(v.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length,
            icon: TrendingUpIcon,
            gradient: "linear-gradient(135deg, #00c851 0%, #007e33 100%)",
            shadowColor: "rgba(0, 200, 81, 0.3)",
        },
    ];

    return (
        <Box>
            {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                    Dashboard Overview
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Welcome back! Here&apos;s what&apos;s happening with your VR therapy platform.
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                    gap: 3,
                    mb: 4,
                }}
            >
                {statsCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                background: card.gradient,
                                boxShadow: `0 8px 32px ${card.shadowColor}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                transition: "transform 0.2s, box-shadow 0.2s",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: `0 12px 40px ${card.shadowColor}`,
                                },
                            }}
                        >
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
                                <Icon sx={{ fontSize: 32, color: "#fff" }} />
                            </Box>
                            <Box>
                                <Typography variant="h3" fontWeight="800" color="#fff">
                                    {card.value}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                    {card.title}
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            {/* Daily Completion Overview */}
            <Box mb={4}>
                <DailyCompletionOverview />
            </Box>

            {/* Quick Actions */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Typography variant="h6" fontWeight="600" color="#fff" mb={2}>
                    Quick Actions
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setActiveTab("upload")}
                        sx={{
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #00b4d8 0%, #0088b8 100%)",
                            },
                        }}
                    >
                        Upload New Video
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<GroupIcon />}
                        onClick={() => setActiveTab("users")}
                        sx={{
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            borderColor: "rgba(255,255,255,0.3)",
                            color: "#fff",
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": {
                                borderColor: "#00d4ff",
                                bgcolor: "rgba(0, 212, 255, 0.1)",
                            },
                        }}
                    >
                        View Users
                    </Button>
                </Box>
            </Paper>

            {/* Recent Videos Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        p: 3,
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h6" fontWeight="600" color="#fff">
                        Recent Videos
                    </Typography>
                    <Chip
                        label={`${videos.length} total`}
                        size="small"
                        sx={{
                            bgcolor: "rgba(0, 212, 255, 0.2)",
                            color: "#00d4ff",
                            fontWeight: 600,
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                    <Typography sx={{ color: "#fff !important", fontWeight: 600 }}>Video Title</Typography>
                                </TableCell>
                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                    <Typography sx={{ color: "#fff !important", fontWeight: 600 }}>Filename</Typography>
                                </TableCell>
                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                    <Typography sx={{ color: "#fff !important", fontWeight: 600 }}>Created</Typography>
                                </TableCell>
                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                    <Typography sx={{ color: "#fff !important", fontWeight: 600 }}>Assigned Date</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {videos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                        <Box py={4}>
                                            <VideoLibraryIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.3)", mb: 1 }} />
                                            <Typography sx={{ color: "#fff !important" }}>
                                                No videos uploaded yet
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                videos.slice(0, 10).map((video, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            "&:hover": {
                                                bgcolor: "rgba(255,255,255,0.03)",
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Typography sx={{ color: "#fff !important", fontWeight: 500 }}>{video.title}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    fontFamily: "monospace",
                                                    fontSize: "0.8rem",
                                                    color: "#fff !important",
                                                }}
                                            >
                                                {video.filename}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Typography sx={{ color: "#fff !important" }}>{formatDateToCST(video.createdAt)}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Chip
                                                icon={<CalendarTodayIcon sx={{ fontSize: 14, color: "#fff !important" }} />}
                                                label={formatDateOnly(video.assignedDate)}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(108, 92, 231, 0.2)",
                                                    color: "#fff !important",
                                                    fontWeight: 500,
                                                    "& .MuiChip-icon": {
                                                        color: "#fff !important",
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {videos.length > 10 && (
                    <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                        <Button
                            onClick={() => setActiveTab("manage")}
                            sx={{ color: "#00d4ff", textTransform: "none" }}
                        >
                            View all {videos.length} videos →
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
