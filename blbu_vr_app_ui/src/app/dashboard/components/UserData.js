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
            <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                User Data
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                Click a user to view their video completion calendar.
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    overflow: "hidden",
                    mb: 4,
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>User</TableCell>
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Role</TableCell>
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
                                                    : "rgba(255,255,255,0.05)",
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>{user.name || "N/A"}</TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>{user.email}</TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            <Chip
                                                label={user.role}
                                                size="small"
                                                sx={{
                                                    bgcolor: user.role === "ADMIN" 
                                                        ? "rgba(0, 212, 255, 0.2)" 
                                                        : "rgba(108, 92, 231, 0.2)",
                                                    color: user.role === "ADMIN" 
                                                        ? "#00d4ff" 
                                                        : "#a29bfe",
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
}
