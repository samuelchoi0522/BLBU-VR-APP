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
    Switch,
    IconButton,
    Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";

export default function UserData() {
    const [users, setUsers] = useState([]);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "" });
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [addUserError, setAddUserError] = useState("");
    const [addUserSuccess, setAddUserSuccess] = useState("");
    const [updatingActive, setUpdatingActive] = useState(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [dayValue, setDayValue] = useState("");
    const [updatingDay, setUpdatingDay] = useState(new Set());
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
                    active: u.active !== undefined ? u.active : true, // Default to true if not set
                    currentDay: u.currentDay || 1, // Default to 1 if not set
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
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUser.email)) {
            setAddUserError("Please enter a valid email address");
            return;
        }

        // Check if email already exists in the current user list
        const emailExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
        if (emailExists) {
            setAddUserError("This email is already registered. Please use a different email.");
            return;
        }

        setAddUserLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register-user-from-vrapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (!response.ok) {
                // Check for duplicate email error specifically
                if (data.error && (data.error.toLowerCase().includes("already in use") || 
                    data.error.toLowerCase().includes("duplicate") ||
                    data.error.toLowerCase().includes("unique"))) {
                    throw new Error("This email is already registered. Please use a different email.");
                }
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

    const handleDeleteClick = (user, event) => {
        event.stopPropagation(); // Prevent row click
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/users/delete?email=${encodeURIComponent(userToDelete.email)}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete user");
            }

            // Refresh the user list
            fetchUsers();
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (err) {
            console.error("Failed to delete user:", err);
            alert(`Failed to delete user: ${err.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleUserClick = (user) => {
        if (user.role === "admin") return; // 🔒 safety guard

        const emailEncoded = encodeURIComponent(user.email);
        router.push(`/dashboard/view/user/${emailEncoded}`);
    };

    const handleToggleActive = async (user, event) => {
        event.stopPropagation(); // Prevent row click
        if (user.role === "admin") return; // Don't allow toggling admin active status

        const newActiveStatus = !user.active;
        setUpdatingActive(prev => new Set(prev).add(user.email));

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/users/toggle-active?email=${encodeURIComponent(user.email)}&active=${newActiveStatus}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to update active status");
            }

            const result = await response.json();

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.email === user.email ? { ...u, active: result.active } : u
                )
            );
        } catch (err) {
            console.error("Failed to toggle active status:", err);
            alert(`Failed to update active status: ${err.message}`);
        } finally {
            setUpdatingActive(prev => {
                const newSet = new Set(prev);
                newSet.delete(user.email);
                return newSet;
            });
        }
    };

    const handleSaveDay = async (user) => {
        const newDay = parseInt(dayValue);
        if (isNaN(newDay) || newDay < 1) {
            alert("Day must be a positive number");
            return;
        }

        setUpdatingDay(prev => new Set(prev).add(user.email));

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/users/update-current-day?email=${encodeURIComponent(user.email)}&currentDay=${newDay}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to update current day");
            }

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.email === user.email ? { ...u, currentDay: newDay } : u
                )
            );

            setEditingDay(null);
            setDayValue("");
        } catch (err) {
            console.error("Failed to update current day:", err);
            alert(`Failed to update current day: ${err.message}`);
        } finally {
            setUpdatingDay(prev => {
                const newSet = new Set(prev);
                newSet.delete(user.email);
                return newSet;
            });
        }
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
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Current Day</TableCell>
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Active Status</TableCell>
                                <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>Actions</TableCell>
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
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            {isAdmin ? (
                                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                                                    N/A
                                                </Typography>
                                            ) : editingDay === user.email ? (
                                                <Box display="flex" alignItems="center" gap={0.5} onClick={(e) => e.stopPropagation()}>
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={dayValue}
                                                        onChange={(e) => setDayValue(e.target.value)}
                                                        inputProps={{ min: 1, style: { color: "#fff", textAlign: "center", width: 60 } }}
                                                        sx={{
                                                            "& .MuiOutlinedInput-root": {
                                                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                                                "&:hover fieldset": { borderColor: "#00d4ff" },
                                                                "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                                                            },
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSaveDay(user);
                                                        }}
                                                        disabled={updatingDay.has(user.email)}
                                                        sx={{ color: "#4caf50" }}
                                                    >
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingDay(null);
                                                            setDayValue("");
                                                        }}
                                                        sx={{ color: "#ff1744" }}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Box display="flex" alignItems="center" gap={1} onClick={(e) => e.stopPropagation()}>
                                                    <Typography sx={{ color: "#fff", minWidth: 30 }}>
                                                        {user.currentDay || 1}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingDay(user.email);
                                                            setDayValue(user.currentDay || 1);
                                                        }}
                                                        sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#00d4ff" } }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            {user.role === "admin" ? (
                                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                                                    N/A
                                                </Typography>
                                            ) : (
                                                <Box 
                                                    display="flex" 
                                                    alignItems="center" 
                                                    gap={1}
                                                    onClick={(e) => e.stopPropagation()} // Prevent row click
                                                >
                                                    <Switch
                                                        checked={user.active !== false}
                                                        onChange={(e) => handleToggleActive(user, e)}
                                                        disabled={updatingActive.has(user.email)}
                                                        size="small"
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click
                                                        sx={{
                                                            "& .MuiSwitch-switchBase.Mui-checked": {
                                                                color: "#4caf50",
                                                            },
                                                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                                                backgroundColor: "#4caf50",
                                                            },
                                                        }}
                                                    />
                                                    <Chip
                                                        icon={user.active ? <CheckCircleIcon /> : <CancelIcon />}
                                                        label={user.active ? "Active" : "Inactive"}
                                                        size="small"
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click
                                                        sx={{
                                                            bgcolor: user.active 
                                                                ? "rgba(76, 175, 80, 0.2)" 
                                                                : "rgba(158, 158, 158, 0.2)",
                                                            color: user.active ? "#4caf50" : "#9e9e9e",
                                                            fontWeight: 600,
                                                            minWidth: 80,
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                            {!isAdmin && (
                                                <Tooltip title="Delete User">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleDeleteClick(user, e)}
                                                        sx={{
                                                            color: "#ff1744",
                                                            "&:hover": {
                                                                bgcolor: "rgba(255, 23, 68, 0.1)",
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                PaperProps={{
                    sx: {
                        bgcolor: "rgba(30, 30, 30, 0.95)",
                        color: "#fff",
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                }}
            >
                <DialogTitle sx={{ color: "#fff", fontWeight: 600 }}>
                    Confirm Delete User
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}>
                        Are you sure you want to delete <strong>{userToDelete?.name || userToDelete?.email}</strong>?
                    </Typography>
                    <Typography sx={{ color: "#ff1744", fontSize: "0.875rem" }}>
                        ⚠️ This action cannot be undone. This will permanently delete:
                    </Typography>
                    <Box component="ul" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", pl: 3, mt: 1 }}>
                        <li>User account</li>
                        <li>All video completion records</li>
                        <li>All video watch events</li>
                        <li>All user progress data</li>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <Button
                        onClick={handleDeleteCancel}
                        disabled={deleting}
                        sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        disabled={deleting}
                        variant="contained"
                        sx={{
                            bgcolor: "#ff1744",
                            "&:hover": {
                                bgcolor: "#d50000",
                            },
                        }}
                    >
                        {deleting ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
