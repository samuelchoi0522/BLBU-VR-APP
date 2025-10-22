"use client";
import React, { useState } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    TextField,
    Chip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");

    const summaryData = [
        { title: "Total Videos", value: "1,250" },
        { title: "Active Users", value: "875" },
        { title: "New Uploads Today", value: "15" },
    ];

    const recentActivity = [
        {
            title: "Exploring the Cosmos",
            uploader: "Dr. Anya Sharma",
            views: "5,234",
            date: "2024-07-26",
        },
        {
            title: "Culinary Delights: Italian Cuisine",
            uploader: "Chef Marco Rossi",
            views: "3,876",
            date: "2024-07-25",
        },
        {
            title: "The Art of Photography",
            uploader: "Isabella Rodriguez",
            views: "2,987",
            date: "2024-07-24",
        },
        {
            title: "Sustainable Living Practices",
            uploader: "Ethan Green",
            views: "1,543",
            date: "2024-07-23",
        },
        {
            title: "History of Ancient Civilizations",
            uploader: "Professor David Lee",
            views: "876",
            date: "2024-07-22",
        },
    ];

    return (
        <Box display="flex" height="100vh" bgcolor="#f5f6fa">
            {/* Sidebar */}
            <Box
                width="240px"
                bgcolor="#fff"
                p={2}
                boxShadow={2}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                        Admin Panel
                    </Typography>
                    <List>
                        <ListItemButton
                            selected={activeTab === "dashboard"}
                            onClick={() => setActiveTab("dashboard")}
                        >
                            <ListItemIcon>
                                <DashboardIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>

                        <ListItemButton
                            selected={activeTab === "upload"}
                            onClick={() => setActiveTab("upload")}
                        >
                            <ListItemIcon>
                                <VideoLibraryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Upload Video" />
                        </ListItemButton>

                        <ListItemButton
                            selected={activeTab === "manage"}
                            onClick={() => setActiveTab("manage")}
                        >
                            <ListItemIcon>
                                <ManageAccountsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Manage Videos" />
                        </ListItemButton>

                        <ListItemButton
                            selected={activeTab === "users"}
                            onClick={() => setActiveTab("users")}
                        >
                            <ListItemIcon>
                                <GroupIcon />
                            </ListItemIcon>
                            <ListItemText primary="User Data" />
                        </ListItemButton>
                    </List>
                </Box>
                <Divider />
            </Box>

            {/* Main Content */}
            <Box flex={1} p={4} overflow="auto">
                {activeTab === "dashboard" && (
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
                                            <Typography color="text.secondary">
                                                {item.title}
                                            </Typography>
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
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{ mr: 2 }}
                                onClick={() => setActiveTab("upload")}
                            >
                                Upload New Video
                            </Button>
                            <Button variant="outlined" color="primary"
                                onClick={() => setActiveTab("users")}
                            >
                                View User Data
                            </Button>
                        </Box>

                        {/* Recent Activity Table */}
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
                )}

                {activeTab === "upload" && (
                    <>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Uploads
                        </Typography>
                        <Typography color="text.secondary" mb={3}>
                            Manage your video content
                        </Typography>

                        {/* Upload Box */}
                        <Box
                            sx={{
                                border: "2px dashed #90caf9",
                                borderRadius: 3,
                                p: 4,
                                textAlign: "center",
                                mb: 4,
                                bgcolor: "#f9fbff",
                            }}
                        >
                            <Typography variant="body1" fontWeight="bold" mb={1}>
                                Drag and drop files here
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Or click to select files from your computer
                            </Typography>
                            <Button variant="contained" color="primary">
                                Select Files
                            </Button>
                        </Box>

                        {/* Existing Videos Section */}
                        <Typography variant="h6" gutterBottom>
                            Existing Videos
                        </Typography>

                        {/* Search Input */}
                        <Box display="flex" justifyContent="flex-end" mb={2}>
                            <TextField
                                size="small"
                                placeholder="Search videos..."
                                variant="outlined"
                                sx={{ width: "300px" }}
                            />
                        </Box>

                        {/* Videos Table */}
                        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Visibility</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {[
                                        {
                                            title: "Exploring the Mountains",
                                            status: "Published",
                                            visibility: "Public",
                                            date: "2023-08-15",
                                        },
                                        {
                                            title: "Cooking Masterclass",
                                            status: "Draft",
                                            visibility: "Private",
                                            date: "2023-07-22",
                                        },
                                    ].map((video, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{video.title}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color={
                                                        video.status === "Published" ? "primary" : "info"
                                                    }
                                                    sx={{ borderRadius: 5, textTransform: "none" }}
                                                >
                                                    {video.status}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color={
                                                        video.visibility === "Public"
                                                            ? "primary"
                                                            : "secondary"
                                                    }
                                                    sx={{ borderRadius: 5, textTransform: "none" }}
                                                >
                                                    {video.visibility}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    defaultValue={video.date}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" justifyContent="center" gap={1}>
                                                    <VisibilityIcon sx={{ cursor: "pointer" }} />
                                                    <EditIcon sx={{ cursor: "pointer" }} />
                                                    <DeleteIcon
                                                        sx={{ cursor: "pointer", color: "error.main" }}
                                                    />
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {/* === MANAGE VIDEOS SECTION === */}
                {activeTab === "manage" && (
                    <>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Manage Videos
                        </Typography>
                        <Typography color="text.secondary" mb={3}>
                            Edit, update, or delete your uploaded videos.
                        </Typography>

                        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Visibility</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        {
                                            title: "Exploring the Mountains",
                                            status: "Published",
                                            visibility: "Public",
                                            date: "2023-08-15",
                                        },
                                        {
                                            title: "Cooking Masterclass",
                                            status: "Draft",
                                            visibility: "Private",
                                            date: "2023-07-22",
                                        },
                                    ].map((video, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{video.title}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={video.status}
                                                    color={
                                                        video.status === "Published" ? "primary" : "default"
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={video.visibility}
                                                    color={
                                                        video.visibility === "Public"
                                                            ? "primary"
                                                            : "secondary"
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{video.date}</TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" justifyContent="center" gap={1}>
                                                    <VisibilityIcon sx={{ cursor: "pointer" }} />
                                                    <EditIcon sx={{ cursor: "pointer" }} />
                                                    <DeleteIcon
                                                        sx={{ cursor: "pointer", color: "error.main" }}
                                                    />
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {/* === USER DATA SECTION === */}
                {activeTab === "users" && (
                    <>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            User Data
                        </Typography>
                        <Typography color="text.secondary" mb={3}>
                            View and manage user information.
                        </Typography>

                        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Videos Uploaded</TableCell>
                                        <TableCell>Last Active</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        {
                                            name: "Dr. Anya Sharma",
                                            email: "anya@example.com",
                                            role: "Creator",
                                            uploads: 24,
                                            lastActive: "2025-10-21",
                                        },
                                        {
                                            name: "Chef Marco Rossi",
                                            email: "marco@example.com",
                                            role: "Contributor",
                                            uploads: 10,
                                            lastActive: "2025-10-20",
                                        },
                                        {
                                            name: "Isabella Rodriguez",
                                            email: "isabella@example.com",
                                            role: "Viewer",
                                            uploads: 0,
                                            lastActive: "2025-10-18",
                                        },
                                    ].map((user, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.role}
                                                    color={
                                                        user.role === "Creator"
                                                            ? "primary"
                                                            : user.role === "Contributor"
                                                                ? "info"
                                                                : "default"
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{user.uploads}</TableCell>
                                            <TableCell>{user.lastActive}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Box>
        </Box>
    );
}
