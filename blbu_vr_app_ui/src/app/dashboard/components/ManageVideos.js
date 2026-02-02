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

            <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                Manage Videos
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                Edit, update, or delete your uploaded videos.
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress sx={{ color: "#00d4ff" }} />
                </Box>
            ) : (
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
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Title</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Filename</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Date Created</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Last Updated</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Date Assigned</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {videos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Typography sx={{ color: "rgba(255,255,255,0.5)" }} py={3}>
                                                No videos uploaded yet
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    videos.map((video) => (
                                        <TableRow key={video.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}>
                                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>{video.title || "Untitled"}</TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: "0.8rem" }}>{video.filename}</TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{formatDateToCST(video.createdAt)}</TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{formatDateToCST(video.updatedAt)}</TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{formatDateOnly(video.assignedDate)}</TableCell>
                                            <TableCell align="center" sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                                <Box display="flex" justifyContent="center" gap={0.5}>
                                                    <IconButton size="small" onClick={() => window.open(video.gcsUrl, "_blank")} sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#00d4ff" } }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>

                                                    <IconButton size="small" onClick={() => setEditDialog({ open: true, video })} sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#ffc107" } }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>

                                                    <IconButton size="small" onClick={() => setDeleteDialog({ open: true, video })} sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#ff6b6b" } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Edit Modal */}
            {editDialog.open && (
                <EditVideoModal
                    open={editDialog.open}
                    video={editDialog.video}
                    videos={videos}        // ✅ pass video list
                    onClose={() => setEditDialog({ open: false, video: null })}
                    onUpdated={fetchVideos}
                />
            )}
        </LocalizationProvider>
    );
}