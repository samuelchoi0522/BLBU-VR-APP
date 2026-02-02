import React, { useState, useEffect, useRef } from "react";
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
    DialogActions,
    LinearProgress
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const xhrRef = useRef(null);
    const takenDates = videos.map(v => dayjs(v.assignedDate).format("YYYY-MM-DD"));

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

    const handleCancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus("");
        setSnack({ open: true, msg: "Upload cancelled", severity: "info" });
    };

    const handleUpload = async () => {
        if (!file || !title || !date) {
            setSnack({ open: true, msg: "Please provide file, title, and date", severity: "warning" });
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus("Preparing upload...");

        try {
            const token = localStorage.getItem("token");

            // Step 1: Get signed URL from backend
            setUploadStatus("Getting upload URL...");
            const urlParams = new URLSearchParams({
                filename: file.name,
                contentType: file.type || "video/mp4"
            });

            const urlRes = await fetch(`${API_BASE_URL}/api/videos/generate-upload-url?${urlParams}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!urlRes.ok) {
                throw new Error("Failed to get upload URL");
            }

            const { signedUrl, filename } = await urlRes.json();

            // Step 2: Upload directly to GCS with progress tracking
            setUploadStatus("Uploading to cloud storage...");

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percentComplete);
                        const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
                        const totalMB = (event.total / (1024 * 1024)).toFixed(1);
                        setUploadStatus(`Uploading: ${uploadedMB} MB / ${totalMB} MB`);
                    }
                });

                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                });

                xhr.addEventListener("error", () => reject(new Error("Upload failed")));
                xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

                xhr.open("PUT", signedUrl);
                xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
                xhr.send(file);
            });

            xhrRef.current = null;

            // Step 3: Confirm upload with backend
            setUploadStatus("Finalizing...");
            const confirmParams = new URLSearchParams({
                filename: filename,
                title: title,
                date: dayjs(date).format('YYYY-MM-DD')
            });

            const confirmRes = await fetch(`${API_BASE_URL}/api/videos/confirm-upload?${confirmParams}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!confirmRes.ok) {
                throw new Error("Failed to confirm upload");
            }

            setSnack({ open: true, msg: "Upload successful!", severity: "success" });
            handleRemoveFile();
            fetchVideos();
        } catch (err) {
            if (err.message !== "Upload cancelled") {
                setSnack({ open: true, msg: err.message || "Error uploading file", severity: "error" });
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setUploadStatus("");
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
                <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                    Upload Videos
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                    Upload and manage your VR therapy content
                </Typography>

                {/* Upload Box */}
                <Paper
                    elevation={0}
                    sx={{
                        border: "2px dashed rgba(0, 212, 255, 0.4)",
                        borderRadius: 4,
                        p: 4,
                        textAlign: "center",
                        mb: 4,
                        bgcolor: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(10px)",
                        position: "relative",
                        transition: "border-color 0.2s",
                        "&:hover": {
                            borderColor: "rgba(0, 212, 255, 0.6)",
                        },
                    }}
                >
                    {!file ? (
                        <>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(0, 212, 255, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mx: "auto",
                                    mb: 2,
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 40, color: "#00d4ff" }} />
                            </Box>
                            <Typography variant="h6" fontWeight="600" color="#fff" mb={1}>
                                Drag and drop files here
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }} mb={3}>
                                Or click to select files from your computer (up to 10GB)
                            </Typography>
                            <Button
                                variant="contained"
                                component="label"
                                sx={{
                                    px: 4,
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
                                Select File
                                <input type="file" hidden accept="video/*" onChange={handleFileChange} />
                            </Button>
                        </>
                    ) : (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="body1" fontWeight="bold" color="#fff">{file.name}</Typography>
                                <IconButton onClick={handleRemoveFile} size="small" sx={{ color: "rgba(255,255,255,0.6)" }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }} mb={2}>
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </Typography>

                            {previewURL && (
                                <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
                                    <video
                                        src={previewURL}
                                        controls
                                        style={{
                                            width: '100%',
                                            maxHeight: '300px',
                                            borderRadius: '8px',
                                            objectFit: 'contain',
                                            backgroundColor: '#000',
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
                                sx={{
                                    mb: 2,
                                    "& .MuiOutlinedInput-root": {
                                        color: "#fff",
                                        "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                        "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                                    },
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                                    "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                                }}
                            />

                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                shouldDisableDate={(day) => {
                                    const formatted = day.format("YYYY-MM-DD");
                                    if (day.isBefore(dayjs(), "day")) return true;
                                    return takenDates.includes(formatted);
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        sx: {
                                            mb: 2,
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                                            },
                                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                                            "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                                            "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.5)" },
                                        },
                                    },
                                }}
                            />

                            {uploading ? (
                                <Box sx={{ width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={uploadProgress} 
                                                sx={{ 
                                                    height: 10, 
                                                    borderRadius: 5,
                                                    bgcolor: "rgba(255,255,255,0.1)",
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 5,
                                                        background: "linear-gradient(90deg, #00d4ff 0%, #00ff88 100%)",
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ minWidth: 45 }}>
                                            <Typography variant="body2" sx={{ color: "#00d4ff", fontWeight: 600 }}>
                                                {uploadProgress}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 2 }}>
                                        {uploadStatus}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCancelUpload}
                                        fullWidth
                                        sx={{
                                            py: 1.2,
                                            borderRadius: 2,
                                            borderColor: "#ff6b6b",
                                            color: "#ff6b6b",
                                            "&:hover": {
                                                borderColor: "#ff5252",
                                                bgcolor: "rgba(255, 107, 107, 0.1)",
                                            },
                                        }}
                                    >
                                        Cancel Upload
                                    </Button>
                                </Box>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleUpload}
                                    fullWidth
                                    disabled={!file || !title || !date}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                                        fontWeight: 600,
                                        textTransform: "none",
                                        boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #00b4d8 0%, #0088b8 100%)",
                                        },
                                        "&.Mui-disabled": {
                                            background: "rgba(255,255,255,0.1)",
                                            color: "rgba(255,255,255,0.3)",
                                        },
                                    }}
                                >
                                    Upload Video
                                </Button>
                            )}
                        </Box>
                    )}
                </Paper>


                {/* Existing Videos Section */}
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
                    <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <Typography variant="h6" fontWeight="600" color="#fff">
                            Existing Videos ({videos.length})
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress sx={{ color: "#00d4ff" }} />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Title</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Filename</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Created</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Updated</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Assigned</TableCell>
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
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => window.open(video.gcsUrl, '_blank')}
                                                            title="View video"
                                                            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#00d4ff" } }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            title="Edit video"
                                                            onClick={() => setEditDialog({ open: true, video })}
                                                            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#ffc107" } }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            title="Delete video"
                                                            onClick={() => setDeleteDialog({ open: true, video })}
                                                            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#ff6b6b" } }}
                                                        >
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
                    )}
                </Paper>
            </Box>
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