import React from "react";
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
} from "@mui/material";

export default function DashboardHome({ setActiveTab }) {
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
