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
    Chip,
} from "@mui/material";
import { useRouter } from "next/navigation";

export default function UserData() {
    const [users, setUsers] = useState([]);
    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/users/all`)
            .then((res) => res.json())
            .then((data) => {
                const adminUsers = data.adminUsers.map((u) => ({
                    id: u.id,
                    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
                    email: u.email,
                    role: u.role || "ADMIN",
                }));

                const vrAppUsers = data.vrAppUsers.map((u) => ({
                    id: u.id,
                    name: `${u.firstName} ${u.lastName}`,
                    email: u.email,
                    role: "VR_USER",
                }));

                setUsers([...adminUsers, ...vrAppUsers]);
            });
    }, []);

    const handleUserClick = (user) => {
        if (user.role === "ADMIN") return; // 🔒 safety guard

        const emailEncoded = encodeURIComponent(user.email);
        router.push(`/dashboard/view/user/${emailEncoded}`);
    };

    return (
        <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                User Data
            </Typography>
            <Typography color="text.secondary" mb={3}>
                Click a user to view their video completion calendar.
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user, idx) => {
                            const isAdmin = user.role === "ADMIN";

                            return (
                                <TableRow
                                    key={idx}
                                    hover={!isAdmin}
                                    onClick={!isAdmin ? () => handleUserClick(user) : undefined}
                                    sx={{
                                        cursor: isAdmin ? "default" : "pointer",
                                        opacity: isAdmin ? 0.6 : 1,
                                        "&:hover": {
                                            backgroundColor: isAdmin
                                                ? "inherit"
                                                : "action.hover",
                                        },
                                    }}
                                >
                                    <TableCell>{user.name || "N/A"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={
                                                user.role === "ADMIN"
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}
