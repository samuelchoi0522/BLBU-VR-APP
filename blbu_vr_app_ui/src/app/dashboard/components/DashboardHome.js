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

export default function DashboardHome({ setActiveTab }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // ✅ Session check
    useEffect(() => {
        const verifySession = async () => {
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

                // Session is valid
                setLoading(false);
            } catch (err) {
                console.error("Session verification failed:", err);
                localStorage.removeItem("token");
                router.push("/");
            }
        };

        verifySession();
    }, [router, API_BASE_URL]);

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // ✅ Dashboard content (only rendered if session valid)
    const summaryData = [
        { title: "Total Videos", value: "1,250" },
        { title: "Active Users", value: "875" },
        { title: "New Uploads Today", value: "15" },
    ];

    const recentActivity = [
        { title: "Exploring the Cosmos", uploader: "Dr. Anya Sharma", views: "5,234", date: "2024-07-26" },
        { title: "Culinary Delights", uploader: "Chef Marco Rossi", views: "3,876", date: "2024-07-25" },
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
                <Button variant="outlined" onClick={() => setActiveTab("users")}>
                    View User Data
                </Button>
            </Box>

            {/* Recent Activity */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Recent Activity
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Video Title</TableCell>
                                <TableCell>Uploader</TableCell>
                                <TableCell>Views</TableCell>
                                <TableCell>Date Uploaded</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentActivity.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.title}</TableCell>
                                    <TableCell>{row.uploader}</TableCell>
                                    <TableCell>{row.views}</TableCell>
                                    <TableCell>{row.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
}
