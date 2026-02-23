import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";

export default function EditVideoModal({ open, onClose, video, onUpdated, videos }) {
    const originalTitle = video?.title || "";
    const originalDisplayOrder = video?.displayOrder || "";
    const [title, setTitle] = useState(originalTitle);
    const [displayOrder, setDisplayOrder] = useState(originalDisplayOrder);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

    useEffect(() => {
        setTitle(originalTitle);
        setDisplayOrder(originalDisplayOrder);
    }, [video]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const handleSubmit = async () => {
        if (!title) {
            setSnack({ open: true, msg: "Title is required", severity: "warning" });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                filename: video.filename,
                title: title,
            });
            if (displayOrder) {
                params.append("displayOrder", displayOrder);
            }

            const res = await fetch(`${API_BASE_URL}/api/videos/assign?${params}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setSnack({ open: true, msg: "Video updated successfully", severity: "success" });
                setTimeout(() => {
                    onUpdated();
                    onClose();
                }, 800);
            } else {
                setSnack({ open: true, msg: "Update failed", severity: "error" });
            }
        } catch (err) {
            setSnack({ open: true, msg: "Error updating video", severity: "error" });
        }
    };

    // ✅ Disable button if no change or empty input
    const isUnchanged =
        title === originalTitle &&
        (displayOrder || "") === (originalDisplayOrder || "");

    const isDisabled = !title || isUnchanged;

    return (
        <>
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>

            <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Video Metadata</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Video Order (Optional)</InputLabel>
                            <Select
                                value={displayOrder || ""}
                                onChange={(e) => setDisplayOrder(e.target.value)}
                                label="Video Order (Optional)"
                            >
                                <MenuItem value="">None</MenuItem>
                                {[1, 2, 3, 4, 5, 6, 7].map((order) => (
                                    <MenuItem key={order} value={order}>
                                        {order} (Days {order * 2 - 1}-{order * 2})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>


                        <TextField
                            label="Filename"
                            fullWidth
                            value={video?.filename || ""}
                            disabled
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isDisabled}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
