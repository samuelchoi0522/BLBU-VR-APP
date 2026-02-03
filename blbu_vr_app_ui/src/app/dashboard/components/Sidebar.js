"use client";

import React from "react";
import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    IconButton,
    Tooltip,
    Badge,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GroupIcon from "@mui/icons-material/Group";
import MonitorIcon from "@mui/icons-material/Monitor";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useRouter } from "next/navigation";

const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "upload", label: "Upload Video", icon: VideoLibraryIcon },
    { id: "manage", label: "Manage Videos", icon: EditNoteIcon },
    { id: "users", label: "User Data", icon: GroupIcon },
    { id: "activity", label: "Activity Log", icon: MonitorIcon, badge: true },
    { id: "reports", label: "Daily Reports", icon: AssessmentIcon },
];

export default function Sidebar({ activeTab, setActiveTab }) {
    const router = useRouter();
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : "";

    const handleLogout = () => {
        localStorage.clear();
        router.push("/");
    };

    return (
        <Box
            sx={{
                width: 280,
                background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            {/* Logo / Brand */}
            <Box
                sx={{
                    p: 3,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        sx={{
                            width: 45,
                            height: 45,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
                        }}
                    >
                        <AdminPanelSettingsIcon sx={{ color: "#fff", fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: "#fff",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            BLBU Admin
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            VR Therapy Platform
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, py: 2 }}>
                <Typography
                    variant="overline"
                    sx={{
                        px: 3,
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        letterSpacing: 1,
                    }}
                >
                    Main Menu
                </Typography>
                <List sx={{ px: 1.5, mt: 1 }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <ListItemButton
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    py: 1.5,
                                    bgcolor: isActive
                                        ? "rgba(0, 212, 255, 0.15)"
                                        : "transparent",
                                    border: isActive
                                        ? "1px solid rgba(0, 212, 255, 0.3)"
                                        : "1px solid transparent",
                                    "&:hover": {
                                        bgcolor: isActive
                                            ? "rgba(0, 212, 255, 0.2)"
                                            : "rgba(255,255,255,0.05)",
                                    },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.badge ? (
                                        <Badge
                                            color="error"
                                            variant="dot"
                                            sx={{
                                                "& .MuiBadge-badge": {
                                                    right: 3,
                                                    top: 3,
                                                },
                                            }}
                                        >
                                            <Icon
                                                sx={{
                                                    color: isActive ? "#00d4ff" : "rgba(255,255,255,0.6)",
                                                    fontSize: 22,
                                                }}
                                            />
                                        </Badge>
                                    ) : (
                                        <Icon
                                            sx={{
                                                color: isActive ? "#00d4ff" : "rgba(255,255,255,0.6)",
                                                fontSize: 22,
                                            }}
                                        />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: "0.9rem",
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                                    }}
                                />
                                {isActive && (
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 24,
                                            borderRadius: 2,
                                            bgcolor: "#00d4ff",
                                            boxShadow: "0 0 10px #00d4ff",
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            {/* User Profile */}
            <Box
                sx={{
                    p: 2,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.05)",
                    }}
                >
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "#00d4ff",
                            fontSize: "1rem",
                            fontWeight: 600,
                        }}
                    >
                        {userEmail?.charAt(0).toUpperCase() || "A"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: "#fff",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Administrator
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "rgba(255,255,255,0.5)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                            }}
                        >
                            {userEmail}
                        </Typography>
                    </Box>
                    <Tooltip title="Logout">
                        <IconButton
                            onClick={handleLogout}
                            size="small"
                            sx={{
                                color: "rgba(255,255,255,0.6)",
                                "&:hover": {
                                    color: "#ff6b6b",
                                    bgcolor: "rgba(255, 107, 107, 0.1)",
                                },
                            }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
}
