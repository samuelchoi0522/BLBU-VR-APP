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
    Box,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,

} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import dayjs from "dayjs";
import EditVideoModal from "./EditVideoModal";

export default function ManageVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, video: null });
    const [editDialog, setEditDialog] = useState({ open: false, video: null });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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

    const handleDeleteVideo = async () => {
        const { video } = deleteDialog;
        if (!video) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/videos/file/${encodeURIComponent(video.filename)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setSnack({ open: true, msg: "Video deleted successfully", severity: "success" });
                fetchVideos();
            } else {
                setSnack({ open: true, msg: "Failed to delete video", severity: "error" });
            }
        } catch (err) {
            setSnack({ open: true, msg: "Error deleting video", severity: "error" });
        } finally {
            setDeleteDialog({ open: false, video: null });
        }
    };

    

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, video: null })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete Video</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteDialog.video?.title || deleteDialog.video?.filename}</strong>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, video: null })}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDeleteVideo}>Delete</Button>
                </DialogActions>
            </Dialog>

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
                                <TableCell>Date Created</TableCell>
                                <TableCell>Last Updated</TableCell>
                                <TableCell>Date Assigned</TableCell>
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
                                        <TableCell>{formatDateToCST(video.createdAt)}</TableCell>
                                        <TableCell>{formatDateToCST(video.updatedAt)}</TableCell>
                                        <TableCell>{formatDateOnly(video.assignedDate)}</TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" justifyContent="center" gap={1}>
                                                <IconButton size="small" onClick={() => window.open(video.gcsUrl, "_blank")}>
                                                    <VisibilityIcon />
                                                </IconButton>

                                                <IconButton size="small" onClick={() => setEditDialog({ open: true, video })}>
                                                    <EditIcon />
                                                </IconButton>

                                                <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, video })}>
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

            {/* Edit Modal */}
            {editDialog.open && (
                <EditVideoModal
                    open={editDialog.open}
                    video={editDialog.video}
                    onClose={() => setEditDialog({ open: false, video: null })}
                    onUpdated={fetchVideos}
                />
            )}
        </LocalizationProvider>
    );
}