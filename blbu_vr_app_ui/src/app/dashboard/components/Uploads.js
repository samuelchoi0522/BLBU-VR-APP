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
    LinearProgress,
    Chip,
    Grid,
    Card,
    CardContent,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditVideoModal from "./EditVideoModal";

const REQUIRED_VIDEOS = 7;

export default function Uploads() {
    const [files, setFiles] = useState([]); // Array of {file, title, previewURL, uploadedFilename, uploadProgress, uploadStatus}
    const [uploadStep, setUploadStep] = useState("select"); // "select", "uploading", "assigning", "complete"
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, video: null });
    const [editDialog, setEditDialog] = useState({ open: false, video: null });
    const [uploading, setUploading] = useState(false);
    const xhrRefs = useRef({});

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
                const sortedVideos = data.sort((a, b) => {
                    // Sort by displayOrder first (1-7), then by updatedAt for videos without order
                    const orderA = a.displayOrder || 999;
                    const orderB = b.displayOrder || 999;
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    // If same order or both null, sort by updatedAt (newest first)
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

    const handleFileChange = (e) => {
        // Check if we already have 7 videos with orders
        const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
        const remainingVideos = REQUIRED_VIDEOS - videosWithOrders.length;
        
        if (videosWithOrders.length >= REQUIRED_VIDEOS) {
            setSnack({ 
                open: true, 
                msg: `You already have ${REQUIRED_VIDEOS} videos. Please delete some videos before uploading new ones.`, 
                severity: "warning" 
            });
            e.target.value = ""; // Reset file input
            return;
        }

        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length !== remainingVideos) {
            setSnack({ 
                open: true, 
                msg: `Please select exactly ${remainingVideos} video${remainingVideos !== 1 ? 's' : ''} (${videosWithOrders.length} already uploaded)`, 
                severity: "warning" 
            });
            return;
        }

        const newFiles = selectedFiles.map((file, index) => ({
            file,
            title: file.name.replace(/\.[^/.]+$/, ""), // Default title from filename
            previewURL: URL.createObjectURL(file),
            uploadedFilename: null,
            uploadProgress: 0,
            uploadStatus: "pending",
            displayOrder: null,
        }));

        setFiles(newFiles);
    };

    const handleRemoveFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    const handleTitleChange = (index, title) => {
        const newFiles = [...files];
        newFiles[index].title = title;
        setFiles(newFiles);
    };

    const handleCancelUpload = () => {
        // Cancel all ongoing uploads
        Object.values(xhrRefs.current).forEach(xhr => {
            if (xhr) xhr.abort();
        });
        xhrRefs.current = {};
        setUploading(false);
        setUploadStep("select");
        setSnack({ open: true, msg: "Upload cancelled", severity: "info" });
    };

    const uploadFileToGCS = async (fileItem, index) => {
        const { file, title } = fileItem;
        const token = localStorage.getItem("token");

        // Step 1: Get signed URL
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

        // Step 2: Upload to GCS with progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRefs.current[index] = xhr;

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setFiles(prev => {
                        const updated = [...prev];
                        updated[index].uploadProgress = percentComplete;
                        const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
                        const totalMB = (event.total / (1024 * 1024)).toFixed(1);
                        updated[index].uploadStatus = `Uploading: ${uploadedMB} MB / ${totalMB} MB`;
                        return updated;
                    });
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    delete xhrRefs.current[index];
                    setFiles(prev => {
                        const updated = [...prev];
                        updated[index].uploadedFilename = filename;
                        updated[index].uploadStatus = "uploaded";
                        return updated;
                    });
                    resolve(filename);
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                }
            });

            xhr.addEventListener("error", () => {
                delete xhrRefs.current[index];
                reject(new Error("Upload failed"));
            });

            xhr.addEventListener("abort", () => {
                delete xhrRefs.current[index];
                reject(new Error("Upload cancelled"));
            });

            xhr.open("PUT", signedUrl);
            xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
            xhr.send(file);
        });
    };

    const handleUploadAll = async () => {
        // Check if we already have 7 videos with orders
        const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
        if (videosWithOrders.length >= REQUIRED_VIDEOS) {
            setSnack({ 
                open: true, 
                msg: `You already have ${REQUIRED_VIDEOS} videos. Please delete some videos before uploading new ones.`, 
                severity: "warning" 
            });
            return;
        }

        // Validate all files have titles
        if (files.some(f => !f.title || f.title.trim() === "")) {
            setSnack({ open: true, msg: "Please provide titles for all videos", severity: "warning" });
            return;
        }

        setUploading(true);
        setUploadStep("uploading");

        try {
            // Upload all files in parallel
            await Promise.all(files.map((fileItem, index) => uploadFileToGCS(fileItem, index)));

            // All uploads complete, move to assignment step
            setUploadStep("assigning");
        } catch (err) {
            if (err.message !== "Upload cancelled") {
                setSnack({ open: true, msg: err.message || "Error uploading files", severity: "error" });
                setUploadStep("select");
            }
        } finally {
            setUploading(false);
        }
    };

    const handleOrderChange = (index, order) => {
        const newFiles = [...files];
        newFiles[index].displayOrder = order ? parseInt(order) : null;
        setFiles(newFiles);
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", index);
        e.dataTransfer.setData("index", index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("index"));
        
        if (dragIndex === dropIndex) return;

        const newFiles = [...files];
        const draggedItem = newFiles[dragIndex];
        
        // Remove dragged item
        newFiles.splice(dragIndex, 1);
        // Insert at new position
        newFiles.splice(dropIndex, 0, draggedItem);
        
        setFiles(newFiles);
    };

    const handleDragEnd = () => {
        // Auto-assign orders to fill remaining slots based on position after reordering
        const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
        const existingOrders = new Set(videosWithOrders.map(v => v.displayOrder));
        const allOrders = [1, 2, 3, 4, 5, 6, 7];
        const availableOrders = allOrders.filter(o => !existingOrders.has(o));
        
        const newFiles = files.map((fileItem, index) => ({
            ...fileItem,
            displayOrder: availableOrders[index] || fileItem.displayOrder
        }));
        setFiles(newFiles);
    };

    const handleFinalize = async () => {
        // Check if we already have 7 videos with orders
        const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
        const existingOrders = new Set(videosWithOrders.map(v => v.displayOrder));
        const remainingVideos = REQUIRED_VIDEOS - videosWithOrders.length;
        
        if (videosWithOrders.length >= REQUIRED_VIDEOS) {
            setSnack({ 
                open: true, 
                msg: `You already have ${REQUIRED_VIDEOS} videos. Please delete some videos before uploading new ones.`, 
                severity: "warning" 
            });
            return;
        }

        // Find available orders (1-7 that aren't already taken)
        const allOrders = [1, 2, 3, 4, 5, 6, 7];
        const availableOrders = allOrders.filter(o => !existingOrders.has(o));

        // Auto-assign orders to fill remaining slots based on position
        const filesWithOrders = files.map((fileItem, index) => ({
            ...fileItem,
            displayOrder: fileItem.displayOrder || availableOrders[index]
        }));
        setFiles(filesWithOrders);

        // Validate all videos have orders
        const orders = filesWithOrders.map(f => f.displayOrder).filter(o => o !== null);
        const uniqueOrders = new Set(orders);

        if (orders.length !== remainingVideos) {
            setSnack({ open: true, msg: `Please assign an order to all ${remainingVideos} videos`, severity: "warning" });
            return;
        }

        if (uniqueOrders.size !== remainingVideos) {
            setSnack({ open: true, msg: `Each video must have a unique order`, severity: "warning" });
            return;
        }

        // Validate orders are within available slots
        const invalidOrders = orders.filter(o => existingOrders.has(o));
        if (invalidOrders.length > 0) {
            setSnack({ open: true, msg: `Orders ${invalidOrders.join(", ")} are already taken`, severity: "warning" });
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // Confirm all uploads with their orders
            await Promise.all(filesWithOrders.map(async (fileItem) => {
                const confirmParams = new URLSearchParams({
                    filename: fileItem.uploadedFilename,
                    title: fileItem.title,
                    displayOrder: fileItem.displayOrder.toString(),
                });

                const confirmRes = await fetch(`${API_BASE_URL}/api/videos/confirm-upload?${confirmParams}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!confirmRes.ok) {
                    throw new Error(`Failed to confirm upload for ${fileItem.title}`);
                }
            }));

            setSnack({ open: true, msg: "All videos uploaded and assigned successfully!", severity: "success" });
            setUploadStep("complete");
            setFiles([]);
            fetchVideos();
            
            // Reset after 2 seconds
            setTimeout(() => {
                setUploadStep("select");
            }, 2000);
        } catch (err) {
            setSnack({ open: true, msg: err.message || "Error finalizing uploads", severity: "error" });
        }
    };

    const handleReset = () => {
        // Cancel any ongoing uploads
        Object.values(xhrRefs.current).forEach(xhr => {
            if (xhr) xhr.abort();
        });
        xhrRefs.current = {};
        setFiles([]);
        setUploadStep("select");
        setUploading(false);
    };

    // Count videos with displayOrder 1-7
    const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
    const hasMaxVideos = videosWithOrders.length >= REQUIRED_VIDEOS;
    const remainingVideos = REQUIRED_VIDEOS - videosWithOrders.length;

    const allUploaded = files.every(f => f.uploadStatus === "uploaded");
    // Orders are auto-assigned based on position, so we just need to check we have the remaining videos
    const allOrdersAssigned = files.length === remainingVideos;
    const orders = files.map((f, index) => f.displayOrder || index + 1);
    const hasUniqueOrders = new Set(orders).size === remainingVideos;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>

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

            <Box>
                <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                    Upload Videos
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                    {hasMaxVideos 
                        ? `You have all ${REQUIRED_VIDEOS} videos uploaded.`
                        : `Upload ${remainingVideos} more video${remainingVideos !== 1 ? 's' : ''} to complete the set (${videosWithOrders.length} / ${REQUIRED_VIDEOS} uploaded)`
                    }
                </Typography>

                {/* Message when 7 videos already exist */}
                {hasMaxVideos && uploadStep === "select" && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mb: 4,
                            bgcolor: "rgba(76, 175, 80, 0.1)",
                            border: "1px solid rgba(76, 175, 80, 0.3)",
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h6" fontWeight="600" color="#4caf50" mb={2}>
                            ✓ Maximum Videos Reached
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                            You already have {REQUIRED_VIDEOS} videos uploaded. To upload new videos, please delete existing ones first.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                            Current videos: {videosWithOrders.length} / {REQUIRED_VIDEOS}
                        </Typography>
                    </Paper>
                )}

                {/* Upload Section */}
                {uploadStep === "select" && !hasMaxVideos && (
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
                        }}
                    >
                        {files.length === 0 ? (
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
                                    Select {remainingVideos} Video{remainingVideos !== 1 ? 's' : ''}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }} mb={3}>
                                    Choose exactly {remainingVideos} video file{remainingVideos !== 1 ? 's' : ''} (up to 10GB each)
                                    {videosWithOrders.length > 0 && (
                                        <span> - {videosWithOrders.length} already uploaded</span>
                                    )}
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
                                    }}
                                >
                                    Select {remainingVideos} File{remainingVideos !== 1 ? 's' : ''}
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="video/*" 
                                        multiple 
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            </>
                        ) : (
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6" fontWeight="600" color="#fff">
                                        {files.length} / {remainingVideos} Video{remainingVideos !== 1 ? 's' : ''} Selected
                                    </Typography>
                                    <Button onClick={handleReset} size="small" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        Reset
                                    </Button>
                                </Box>

                                <Grid container spacing={2}>
                                    {files.map((fileItem, index) => (
                                        <Grid item xs={12} md={6} key={index}>
                                            <Card sx={{ bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                <CardContent>
                                                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                                        <Typography variant="subtitle2" color="#fff" fontWeight="600">
                                                            Video {index + 1}
                                                        </Typography>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleRemoveFile(index)}
                                                            sx={{ color: "rgba(255,255,255,0.6)" }}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 1 }}>
                                                        {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Title"
                                                        value={fileItem.title}
                                                        onChange={(e) => handleTitleChange(index, e.target.value)}
                                                        sx={{
                                                            mb: 2,
                                                            "& .MuiOutlinedInput-root": {
                                                                color: "#fff",
                                                                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                                            },
                                                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                                                        }}
                                                    />
                                                    {fileItem.previewURL && (
                                                        <Box sx={{ borderRadius: 1, overflow: "hidden", mb: 1 }}>
                                                            <video
                                                                src={fileItem.previewURL}
                                                                controls
                                                                style={{
                                                                    width: '100%',
                                                                    maxHeight: '150px',
                                                                    backgroundColor: '#000',
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Button
                                    variant="contained"
                                    onClick={handleUploadAll}
                                    fullWidth
                                    disabled={files.length !== remainingVideos || files.some(f => !f.title || f.title.trim() === "")}
                                    sx={{
                                        mt: 3,
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                                        fontWeight: 600,
                                    }}
                                >
                                    Upload All {remainingVideos} Video{remainingVideos !== 1 ? 's' : ''}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Uploading Step */}
                {uploadStep === "uploading" && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mb: 4,
                            bgcolor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <Typography variant="h6" fontWeight="600" color="#fff" mb={3}>
                            Uploading Videos...
                        </Typography>
                        {files.map((fileItem, index) => (
                            <Box key={index} sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" color="#fff">
                                        {fileItem.title}
                                    </Typography>
                                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                        {fileItem.uploadProgress}%
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={fileItem.uploadProgress} 
                                    sx={{ 
                                        height: 8, 
                                        borderRadius: 4,
                                        bgcolor: "rgba(255,255,255,0.1)",
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            background: "linear-gradient(90deg, #00d4ff 0%, #00ff88 100%)",
                                        }
                                    }}
                                />
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5, display: "block" }}>
                                    {fileItem.uploadStatus}
                                </Typography>
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={handleCancelUpload}
                            fullWidth
                            sx={{
                                mt: 2,
                                borderColor: "#ff6b6b",
                                color: "#ff6b6b",
                            }}
                        >
                            Cancel Upload
                        </Button>
                    </Paper>
                )}

                {/* Assign Order Step */}
                {uploadStep === "assigning" && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mb: 4,
                            bgcolor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <Typography variant="h6" fontWeight="600" color="#fff" mb={2}>
                            Assign Video Order
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 3 }}>
                            Assign each video to an order (1-7). Each order corresponds to specific days:
                        </Typography>
                        <Box sx={{ mb: 3, p: 2, bgcolor: "rgba(0,212,255,0.1)", borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                Order 1 = Days 1-2 | Order 2 = Days 3-4 | Order 3 = Days 5-6 | Order 4 = Days 7-8 | 
                                Order 5 = Days 9-10 | Order 6 = Days 11-12 | Order 7 = Days 13-14
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2, p: 2, bgcolor: "rgba(0,212,255,0.1)", borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 1 }}>
                                <DragIndicatorIcon sx={{ fontSize: 20 }} />
                                Drag videos to reorder them. Order will be automatically assigned based on position (1-7).
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            {files.map((fileItem, index) => {
                                // Calculate available orders
                                const videosWithOrders = videos.filter(v => v.displayOrder && v.displayOrder >= 1 && v.displayOrder <= 7);
                                const existingOrders = new Set(videosWithOrders.map(v => v.displayOrder));
                                const allOrders = [1, 2, 3, 4, 5, 6, 7];
                                const availableOrders = allOrders.filter(o => !existingOrders.has(o));
                                const assignedOrder = fileItem.displayOrder || availableOrders[index];
                                
                                return (
                                    <Grid item xs={12} md={6} key={index}>
                                        <Card 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                            sx={{ 
                                                bgcolor: "rgba(255,255,255,0.05)", 
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                cursor: "move",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    borderColor: "#00d4ff",
                                                    transform: "translateY(-2px)",
                                                    boxShadow: "0 4px 12px rgba(0, 212, 255, 0.2)",
                                                },
                                                "&:active": {
                                                    cursor: "grabbing",
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <DragIndicatorIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }} />
                                                    <Typography variant="subtitle2" color="#fff" fontWeight="600">
                                                        {fileItem.title}
                                                    </Typography>
                                                </Box>
                                                <Chip 
                                                    label={`Position ${index + 1} → Order ${assignedOrder} (Days ${assignedOrder * 2 - 1}-${assignedOrder * 2})`}
                                                    size="small"
                                                    sx={{
                                                        mb: 2,
                                                        bgcolor: "rgba(0, 212, 255, 0.2)",
                                                        color: "#00d4ff",
                                                        fontWeight: 600,
                                                    }}
                                                />
                                                <FormControl fullWidth>
                                                    <InputLabel sx={{ color: "rgba(255,255,255,0.5)" }}>Order (Auto-assigned)</InputLabel>
                                                    <Select
                                                        value={fileItem.displayOrder || assignedOrder}
                                                        onChange={(e) => handleOrderChange(index, e.target.value)}
                                                        label="Order (Auto-assigned)"
                                                        sx={{
                                                            color: "#fff",
                                                            "& .MuiOutlinedInput-notchedOutline": {
                                                                borderColor: "rgba(255,255,255,0.2)",
                                                            },
                                                            "& .MuiSvgIcon-root": {
                                                                color: "rgba(255,255,255,0.5)",
                                                            },
                                                        }}
                                                    >
                                                        {availableOrders.map((order) => (
                                                            <MenuItem key={order} value={order}>
                                                                {order} (Days {order * 2 - 1}-{order * 2})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                        <Box display="flex" gap={2} mt={3}>
                            <Button
                                variant="outlined"
                                onClick={handleReset}
                                sx={{ flex: 1, borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleFinalize}
                                disabled={!allOrdersAssigned || !hasUniqueOrders}
                                sx={{
                                    flex: 1,
                                    background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                                    fontWeight: 600,
                                }}
                            >
                                Finalize & Save All Videos
                            </Button>
                        </Box>
                        {!allOrdersAssigned && (
                            <Typography variant="caption" sx={{ color: "#ff6b6b", mt: 1, display: "block" }}>
                                Please assign an order to all {remainingVideos} videos
                            </Typography>
                        )}
                        {allOrdersAssigned && !hasUniqueOrders && (
                            <Typography variant="caption" sx={{ color: "#ff6b6b", mt: 1, display: "block" }}>
                                Each video must have a unique order
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Complete Step */}
                {uploadStep === "complete" && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mb: 4,
                            bgcolor: "rgba(76, 175, 80, 0.1)",
                            border: "1px solid rgba(76, 175, 80, 0.3)",
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h6" fontWeight="600" color="#4caf50" mb={2}>
                            ✓ All Videos Uploaded Successfully!
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            All {REQUIRED_VIDEOS} videos have been uploaded and assigned their orders.
                        </Typography>
                    </Paper>
                )}

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
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Order</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Title</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Filename</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Created</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Updated</TableCell>
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
                                                <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>
                                                    {video.displayOrder ? `${video.displayOrder} (Days ${video.displayOrder * 2 - 1}-${video.displayOrder * 2})` : "Not set"}
                                                </TableCell>
                                                <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>{video.title || "Untitled"}</TableCell>
                                                <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: "0.8rem" }}>{video.filename}</TableCell>
                                                <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{formatDateToCST(video.createdAt)}</TableCell>
                                                <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{formatDateToCST(video.updatedAt)}</TableCell>
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
                    videos={videos}
                    onClose={() => setEditDialog({ open: false, video: null })}
                    onUpdated={fetchVideos}
                />
            )}
        </LocalizationProvider>
    );
}
