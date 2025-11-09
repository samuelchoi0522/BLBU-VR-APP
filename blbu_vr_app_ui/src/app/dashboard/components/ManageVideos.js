import React, { useEffect, useState } from "react";
import {
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    Chip,
    Box,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ManageVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/videos/get-all-videos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                const sortedVideos = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setVideos(sortedVideos);
            } else {
                setSnack({ open: true, msg: "Failed to load videos", severity: "error" });
            }
        } catch (err) {
            setSnack({ open: true, msg: "Error fetching videos", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Manage Videos
            </Typography>
            <Typography color="text.secondary" mb={3}>
                Edit, update, or delete your uploaded videos.
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Filename</TableCell>
                                <TableCell>Assigned Date</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Updated At</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {videos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography color="text.secondary" py={3}>
                                            No videos uploaded yet
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                videos.map((video) => (
                                    <TableRow key={video.id}>
                                        <TableCell>{video.title || "Untitled"}</TableCell>
                                        <TableCell>{video.filename}</TableCell>
                                        <TableCell>{video.assignedDate}</TableCell>
                                        <TableCell>{new Date(video.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(video.updatedAt).toLocaleString()}</TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" justifyContent="center" gap={1}>
                                                <IconButton size="small" onClick={() => window.open(video.gcsUrl, '_blank')}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton size="small">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small" color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
}