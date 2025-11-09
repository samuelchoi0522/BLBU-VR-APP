"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Grid,
    Card,
    CardContent,
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
} from "@mui/material";
import dayjs from "dayjs";

export default function DashboardHome({ setActiveTab }) {
    const [loading, setLoading] = useState(true);
    const [videoCount, setVideoCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [videos, setVideos] = useState([]);

    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // ✅ Format date to CST timezone (Month DD, YYYY HH:MM AM/PM)
    const formatDateToCST = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                timeZone: "America/Chicago",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString;
        }
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return "N/A";
        return dayjs(dateString, "YYYY-MM-DD").format("MMMM D, YYYY");
    };

    // ✅ Session check + load counts
    useEffect(() => {
        const verifySessionAndLoadData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    localStorage.removeItem("token");
                    router.push("/");
                    return;
                }

                // ✅ Call API functions
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

    // ✅ Load total videos count
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

    // ✅ Load total users count
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

                // ✅ Sort videos by updatedAt (most recent first)
                const sortedVideos = data.sort((a, b) => {
                    const dateA = new Date(a.updatedAt);
                    const dateB = new Date(b.updatedAt);
                    return dateB - dateA; // Descending order
                });

                setVideos(sortedVideos);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const summaryData = [
        { title: "Total Videos", value: videoCount },
        { title: "Total Users", value: userCount }
    ];

    return (
        <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                {summaryData.map((item, idx) => (
                    <Grid item xs={12} sm={4} key={idx}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography color="text.secondary">{item.title}</Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {item.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Quick Actions */}
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    Quick Actions
                </Typography>
                <Button variant="contained" sx={{ mr: 2 }} onClick={() => setActiveTab("upload")}>
                    Upload New Video
                </Button>
            </Box>

            {/* Recent Activity */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Recent Videos
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Video Title</TableCell>
                                <TableCell>Video Filename</TableCell>
                                <TableCell>Date Created</TableCell>
                                <TableCell>Last Updated</TableCell>
                                <TableCell>Date Assigned</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {videos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary" py={3}>
                                            No videos uploaded yet
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                videos.map((video, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{video.title}</TableCell>
                                        <TableCell>{video.filename}</TableCell>
                                        <TableCell>{formatDateToCST(video.createdAt)}</TableCell>
                                        <TableCell>{formatDateToCST(video.updatedAt)}</TableCell>
                                        <TableCell>{formatDateOnly(video.assignedDate)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
}