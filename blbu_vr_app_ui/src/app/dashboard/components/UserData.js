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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Alert,
    CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useRouter } from "next/navigation";

export default function UserData() {
    const [users, setUsers] = useState([]);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "" });
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [addUserError, setAddUserError] = useState("");
    const [addUserSuccess, setAddUserSuccess] = useState("");
    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const fetchUsers = () => {
        fetch(`${API_BASE_URL}/api/users/all`)
            .then((res) => res.json())
            .then((data) => {
                const adminUsers = data.adminUsers.map((u) => ({
                    id: u.id,
                    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
                    email: u.email,
                    role: (u.role || "ADMIN").toLowerCase(),
                }));

                const vrAppUsers = data.vrAppUsers.map((u) => ({
                    id: u.id,
                    name: `${u.firstName} ${u.lastName}`,
                    email: u.email,
                    role: "user",
                }));

                setUsers([...adminUsers, ...vrAppUsers]);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async () => {
        setAddUserError("");
        setAddUserSuccess("");
        setAddUserLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register-user-from-vrapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user");
            }

            setAddUserSuccess("User created successfully!");
            setNewUser({ firstName: "", lastName: "", email: "", password: "" });
            fetchUsers(); // Refresh the user list
            
            // Close dialog after a short delay
            setTimeout(() => {
                setAddUserOpen(false);
                setAddUserSuccess("");
            }, 1500);
        } catch (err) {
            setAddUserError(err.message);
        } finally {
            setAddUserLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setAddUserOpen(false);
        setAddUserError("");
        setAddUserSuccess("");
        setNewUser({ firstName: "", lastName: "", email: "", password: "" });
    };

    const handleUserClick = (user) => {
        if (user.role === "admin") return; // 🔒 safety guard

        const emailEncoded = encodeURIComponent(user.email);
        router.push(`/dashboard/view/user/${emailEncoded}`);
    };

    return (
        <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h4" fontWeight="700" color="#fff">
                    User Data
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddUserOpen(true)}
                    sx={{
                        background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        "&:hover": {
                            background: "linear-gradient(135deg, #5b4cdb 0%, #8c7ae6 100%)",
                        },
                    }}
                >
                    Add User
                </Button>
            </Box>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                Click a user to view their video completion calendar.
            </Typography>

            {/* Add User Dialog */}
            <Dialog 
                open={addUserOpen} 
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: "#1a1a2e",
                        color: "#fff",
                        minWidth: 400,
                    },
                }}
            >
                <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    Add New User
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {addUserError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {addUserError}
                        </Alert>
                    )}
                    {addUserSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {addUserSuccess}
                        </Alert>
                    )}
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "#fff",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                "&:hover fieldset": { borderColor: "#00d4ff" },
                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                            },
                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                        }}
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "#fff",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                "&:hover fieldset": { borderColor: "#00d4ff" },
                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                            },
                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                        }}
                    />
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="dense"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "#fff",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                "&:hover fieldset": { borderColor: "#00d4ff" },
                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                            },
                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                        }}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="dense"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "#fff",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                "&:hover fieldset": { borderColor: "#00d4ff" },
                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                            },
                            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <Button 
                        onClick={handleCloseDialog}
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={addUserLoading || !newUser.email || !newUser.password}
                        sx={{
                            background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #5b4cdb 0%, #8c7ae6 100%)",
                            },
                        }}
                    >
                        {addUserLoading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Create User"}
                    </Button>
                </DialogActions>
            </Dialog>

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
                                const isAdmin = user.role === "admin";

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
                                                    bgcolor: user.role === "admin" 
                                                        ? "rgba(0, 212, 255, 0.2)" 
                                                        : "rgba(108, 92, 231, 0.2)",
                                                    color: user.role === "admin" 
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
