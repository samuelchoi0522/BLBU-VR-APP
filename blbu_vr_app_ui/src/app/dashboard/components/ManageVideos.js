import React from "react";
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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ManageVideos() {
    const videos = [
        { title: "Exploring the Mountains", status: "Published", visibility: "Public", date: "2023-08-15" },
        { title: "Cooking Masterclass", status: "Draft", visibility: "Private", date: "2023-07-22" },
    ];

    return (
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
                        {videos.map((video, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{video.title}</TableCell>
                                <TableCell>
                                    <Chip label={video.status} color={video.status === "Published" ? "primary" : "default"} />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={video.visibility}
                                        variant="outlined"
                                        color={video.visibility === "Public" ? "primary" : "secondary"}
                                    />
                                </TableCell>
                                <TableCell>{video.date}</TableCell>
                                <TableCell align="center">
                                    <Box display="flex" justifyContent="center" gap={1}>
                                        <VisibilityIcon sx={{ cursor: "pointer" }} />
                                        <EditIcon sx={{ cursor: "pointer" }} />
                                        <DeleteIcon sx={{ cursor: "pointer", color: "error.main" }} />
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
