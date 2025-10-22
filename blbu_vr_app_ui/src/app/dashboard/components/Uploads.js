import React, { useState } from "react";
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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

export default function Uploads() {
    const [file, setFile] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);

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
    };

    return (
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
                            <input
                                type="file"
                                hidden
                                accept="video/*"
                                onChange={handleFileChange}
                            />
                        </Button>
                    </>
                ) : (
                    <Box>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography variant="body1" fontWeight="bold">
                                {file.name}
                            </Typography>
                            <IconButton onClick={handleRemoveFile} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" mb={2}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>

                        {/* Video Preview */}
                        <Box
                            sx={{
                                position: "relative",
                                borderRadius: 2,
                                overflow: "hidden",
                                boxShadow: 2,
                                maxWidth: "500px",
                                mx: "auto",
                            }}
                        >
                            <video
                                src={previewURL}
                                controls
                                style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    outline: "none",
                                }}
                            />
                        </Box>

                        <Box mt={3}>
                            <Button variant="contained" color="primary">
                                Upload
                            </Button>
                            <Button
                                variant="text"
                                color="secondary"
                                onClick={handleRemoveFile}
                                sx={{ ml: 2 }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Existing Videos Section */}
            <Typography variant="h6" gutterBottom>
                Existing Videos
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
    );
}
