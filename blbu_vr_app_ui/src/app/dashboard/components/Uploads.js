import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditVideoModal from "./EditVideoModal";

export default function Uploads() {
    const [file, setFile] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, video: null });
    const [editDialog, setEditDialog] = useState({ open: false, video: null });
    const [uploading, setUploading] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // Fetch videos on component mount
    useEffect(() => {
        fetchVideos();
    }, []);

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
                // Sort by updatedAt (most recent first)
                const sortedVideos = data.sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });
                setVideos(sortedVideos);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setLoading(false);
        }
    };

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
            return dateString;
        }
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return "N/A";
        return dayjs(dateString, "YYYY-MM-DD").format("MMMM D, YYYY");
    };


    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewURL(url);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setPreviewURL(null);
        setTitle("");
        setDate(null);
    };

    const handleUpload = async () => {
        if (!file || !title || !date) {
            setSnack({ open: true, msg: "Please provide file, title, and date", severity: "warning" });
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("date", dayjs(date).format('YYYY-MM-DD'));
        formData.append("compress", false);

        try {
            const res = await fetch(`${API_BASE_URL}/api/videos/assign`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (res.ok) {
                setSnack({ open: true, msg: "Upload successful!", severity: "success" });
                handleRemoveFile();
                fetchVideos();
            } else {
                setSnack({ open: true, msg: "Upload failed", severity: "error" });
            }
        } catch (err) {
            setSnack({ open: true, msg: "Error uploading file", severity: "error" });
        } finally {
            setUploading(false);
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
                    <Button
                        onClick={() => setDeleteDialog({ open: false, video: null })}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteVideo}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Box>
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
                        position: "relative",
                    }}
                >
                    {!file ? (
                        <>
                            <Typography variant="body1" fontWeight="bold" mb={1}>
                                Drag and drop files here
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Or click to select files from your computer
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                component="label"
                                sx={{ px: 4, py: 1.2, borderRadius: 2 }}
                            >
                                Select File
                                <input type="file" hidden accept="video/*" onChange={handleFileChange} />
                            </Button>
                        </>
                    ) : (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="body1" fontWeight="bold">{file.name}</Typography>
                                <IconButton onClick={handleRemoveFile} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" mb={2}>
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>

                            {previewURL && (
                                <Box sx={{ mb: 2 }}>
                                    <video
                                        src={previewURL}
                                        controls
                                        style={{
                                            width: '100%',
                                            maxHeight: '300px',
                                            borderRadius: '8px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Metadata Inputs */}
                            <TextField
                                fullWidth
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        sx: { mb: 2 }
                                    }
                                }}
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpload}
                                fullWidth
                                disabled={!file || !title || !date || uploading}
                                sx={{ py: 1.2, borderRadius: 2 }}
                            >
                                {uploading ? (
                                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                                ) : (
                                    "Upload Video"
                                )}
                            </Button>
                        </Box>
                    )}
                </Box>


                {/* Existing Videos Section */}
                <Typography variant="h6" gutterBottom>
                    Existing Videos ({videos.length})
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
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
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => window.open(video.gcsUrl, '_blank')}
                                                        title="View video"
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        title="Edit video"
                                                        onClick={() => setEditDialog({ open: true, video })}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>


                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        title="Delete video"
                                                        onClick={() => setDeleteDialog({ open: true, video })}
                                                    >
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
            </Box>
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