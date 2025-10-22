import React from "react";
import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import GroupIcon from "@mui/icons-material/Group";

export default function Sidebar({ activeTab, setActiveTab }) {
    return (
        <Box
            width="240px"
            bgcolor="#fff"
            p={2}
            boxShadow={2}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
        >
            <Box>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Admin Panel
                </Typography>
                <List>
                    <ListItemButton
                        selected={activeTab === "dashboard"}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        <ListItemIcon>
                            <DashboardIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton
                        selected={activeTab === "upload"}
                        onClick={() => setActiveTab("upload")}
                    >
                        <ListItemIcon>
                            <VideoLibraryIcon />
                        </ListItemIcon>
                        <ListItemText primary="Upload Video" />
                    </ListItemButton>
                    <ListItemButton
                        selected={activeTab === "manage"}
                        onClick={() => setActiveTab("manage")}
                    >
                        <ListItemIcon>
                            <ManageAccountsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Manage Videos" />
                    </ListItemButton>
                    <ListItemButton
                        selected={activeTab === "users"}
                        onClick={() => setActiveTab("users")}
                    >
                        <ListItemIcon>
                            <GroupIcon />
                        </ListItemIcon>
                        <ListItemText primary="User Data" />
                    </ListItemButton>
                </List>
            </Box>
            <Divider />
        </Box>
    );
}
