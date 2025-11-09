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
    Alert
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function EditVideoModal({ open, onClose, video, onUpdated, videos }) {
    const originalTitle = video?.title || "";
    const originalDate = video?.assignedDate ? dayjs(video.assignedDate) : null;
    const takenDates = videos
        .filter(v => v.id !== video.id)
        .map(v => dayjs(v.assignedDate).format("YYYY-MM-DD"));
    const [title, setTitle] = useState(originalTitle);
    const [date, setDate] = useState(originalDate);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

    useEffect(() => {
        setTitle(originalTitle);
        setDate(originalDate);
    }, [video]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const handleSubmit = async () => {
        if (!title || !date) {
            setSnack({ open: true, msg: "Title and date are required", severity: "warning" });
            return;
        }

        const formData = new FormData();
        formData.append("filename", video.filename);
        formData.append("file", new Blob([]), "empty");
        formData.append("title", title);
        formData.append("date", dayjs(date).format("YYYY-MM-DD"));
        formData.append("compress", false);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/videos/assign`, {
                method: "PUT",
                body: formData,
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
        dayjs(date).format("YYYY-MM-DD") === dayjs(originalDate).format("YYYY-MM-DD");

    const isDisabled = !title || !date || isUnchanged;

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

                        <DatePicker
                            label="Assigned Date"
                            value={date}
                            onChange={(v) => setDate(v)}
                            shouldDisableDate={(day) => {
                                const formatted = day.format("YYYY-MM-DD");

                                if (day.isBefore(dayjs(), "day")) return true; // past dates block
                                return takenDates.includes(formatted); // prevent duplicate
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />


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
