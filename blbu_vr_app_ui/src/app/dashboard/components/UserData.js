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
} from "@mui/material";

export default function UserData() {
    const users = [
        { name: "Dr. Anya Sharma", email: "anya@example.com", role: "Creator", uploads: 24, lastActive: "2025-10-21" },
        { name: "Chef Marco Rossi", email: "marco@example.com", role: "Contributor", uploads: 10, lastActive: "2025-10-20" },
        { name: "Isabella Rodriguez", email: "isabella@example.com", role: "Viewer", uploads: 0, lastActive: "2025-10-18" },
    ];

    return (
        <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                User Data
            </Typography>
            <Typography color="text.secondary" mb={3}>
                View and manage user information.
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Videos Uploaded</TableCell>
                            <TableCell>Last Active</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role}
                                        color={
                                            user.role === "Creator"
                                                ? "primary"
                                                : user.role === "Contributor"
                                                    ? "info"
                                                    : "default"
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{user.uploads}</TableCell>
                                <TableCell>{user.lastActive}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}
