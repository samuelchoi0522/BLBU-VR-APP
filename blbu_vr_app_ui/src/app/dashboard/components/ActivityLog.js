"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Badge,
    Tooltip,
    Switch,
    FormControlLabel,
    Divider,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ClearIcon from "@mui/icons-material/Clear";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const EVENT_ICONS = {
    SESSION_START: <LoginIcon fontSize="small" />,
    PLAY: <PlayArrowIcon fontSize="small" />,
    PAUSE: <PauseIcon fontSize="small" />,
    SEEK_ATTEMPT: <SkipNextIcon fontSize="small" />,
    TAB_HIDDEN: <VisibilityOffIcon fontSize="small" />,
    TAB_VISIBLE: <VisibilityIcon fontSize="small" />,
    VIDEO_COMPLETE: <CheckCircleIcon fontSize="small" />,
    SESSION_END: <LogoutIcon fontSize="small" />,
    VIOLATION: <WarningIcon fontSize="small" />,
    PROGRESS_UPDATE: <FiberManualRecordIcon fontSize="small" />,
};

const EVENT_COLORS = {
    SESSION_START: "#2196f3",
    PLAY: "#4caf50",
    PAUSE: "#ff9800",
    SEEK_ATTEMPT: "#f44336",
    TAB_HIDDEN: "#f44336",
    TAB_VISIBLE: "#4caf50",
    VIDEO_COMPLETE: "#4caf50",
    SESSION_END: "#9e9e9e",
    VIOLATION: "#f44336",
    PROGRESS_UPDATE: "#9e9e9e",
};

export default function ActivityLog() {
    const [events, setEvents] = useState([]);
    const [connected, setConnected] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showProgressUpdates, setShowProgressUpdates] = useState(false);
    const [selectedUser, setSelectedUser] = useState(""); // Empty = all users
    const [vrUsers, setVrUsers] = useState([]); // List of VR app users (non-admins)
    const clientRef = useRef(null);
    const logContainerRef = useRef(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // Combine VR users from DB with unique users from events
    const allUsers = useMemo(() => {
        // Create a map of users by email (case-insensitive)
        const userMap = new Map();
        
        // Add VR users from database first (they have full name info)
        vrUsers.forEach((user) => {
            userMap.set(user.email.toLowerCase(), {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: `${user.firstName} ${user.lastName}`.trim(),
            });
        });
        
        // Add users from events that aren't in VR users list
        events.forEach((event) => {
            if (event.email) {
                const emailLower = event.email.toLowerCase();
                if (!userMap.has(emailLower)) {
                    userMap.set(emailLower, {
                        email: event.email,
                        firstName: null,
                        lastName: null,
                        displayName: event.email, // Use email as display name
                    });
                }
            }
        });
        
        // Convert to array and sort by display name
        return Array.from(userMap.values()).sort((a, b) => 
            a.displayName.localeCompare(b.displayName)
        );
    }, [vrUsers, events]);

    // Fetch VR app users (non-admins) for the filter dropdown
    const fetchVRUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/users/vr-users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setVrUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch VR users:", err);
        }
    };

    // Fetch initial events
    const fetchInitialEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/video-watch/latest-events`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data.reverse()); // Reverse to show oldest first
            }
        } catch (err) {
            console.error("Failed to fetch events:", err);
        }
    };

    // Connect to WebSocket and fetch users
    useEffect(() => {
        fetchInitialEvents();
        fetchVRUsers();

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log("WebSocket connected");
                setConnected(true);

                // Subscribe to video events
                client.subscribe("/topic/video-events", (message) => {
                    const event = JSON.parse(message.body);
                    setEvents((prev) => [...prev.slice(-99), event]); // Keep last 100
                });
            },
            onDisconnect: () => {
                console.log("WebSocket disconnected");
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [API_BASE_URL]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [events, autoScroll]);

    // Filter events based on settings
    const filteredEvents = useMemo(() => {
        let filtered = events;
        
        // Filter by progress updates
        if (!showProgressUpdates) {
            filtered = filtered.filter((e) => e.eventType !== "PROGRESS_UPDATE");
        }
        
        // Filter by selected user (case-insensitive)
        if (selectedUser) {
            const selectedLower = selectedUser.toLowerCase();
            filtered = filtered.filter((e) => e.email?.toLowerCase() === selectedLower);
        }
        
        return filtered;
    }, [events, showProgressUpdates, selectedUser]);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                Activity Log
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                Real-time monitoring of user video watching activity
            </Typography>

            {/* Status and Controls */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                            icon={
                                <FiberManualRecordIcon
                                    sx={{
                                        color: connected ? "#4caf50" : "#f44336",
                                        fontSize: 12,
                                    }}
                                />
                            }
                            label={connected ? "Live" : "Disconnected"}
                            variant="outlined"
                            color={connected ? "success" : "error"}
                        />
                        <Badge badgeContent={filteredEvents.length} color="primary">
                            <Typography variant="body2">Events</Typography>
                        </Badge>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        {/* User Filter */}
                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 250,
                                "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                    "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                                },
                                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                                "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                                "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.5)" },
                            }}
                        >
                            <InputLabel id="user-filter-label">Filter by User</InputLabel>
                            <Select
                                labelId="user-filter-label"
                                value={selectedUser}
                                label="Filter by User"
                                onChange={(e) => setSelectedUser(e.target.value)}
                                endAdornment={
                                    selectedUser && (
                                        <IconButton
                                            size="small"
                                            onClick={() => setSelectedUser("")}
                                            sx={{ mr: 2 }}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )
                                }
                            >
                                <MenuItem value="">
                                    <em>All Users ({allUsers.length})</em>
                                </MenuItem>
                                {allUsers.map((user) => (
                                    <MenuItem key={user.email} value={user.email}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Avatar sx={{ width: 20, height: 20, fontSize: "0.7rem", bgcolor: "#00d4ff" }}>
                                                {user.displayName?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2">
                                                    {user.displayName}
                                                </Typography>
                                                {user.firstName && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showProgressUpdates}
                                    onChange={(e) => setShowProgressUpdates(e.target.checked)}
                                    size="small"
                                    sx={{ "& .MuiSwitch-thumb": { bgcolor: "#00d4ff" } }}
                                />
                            }
                            label="Show progress updates"
                            sx={{ color: "rgba(255,255,255,0.7)", "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                    size="small"
                                    sx={{ "& .MuiSwitch-thumb": { bgcolor: "#00d4ff" } }}
                                />
                            }
                            label="Auto-scroll"
                            sx={{ color: "rgba(255,255,255,0.7)", "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
                        />
                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={fetchInitialEvents}
                                size="small"
                                sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#00d4ff" } }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* Events Log */}
            <Paper
                ref={logContainerRef}
                sx={{
                    height: "60vh",
                    overflow: "auto",
                    borderRadius: 2,
                    bgcolor: "#1e1e1e",
                    fontFamily: "monospace",
                }}
            >
                {filteredEvents.length === 0 ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        color="text.secondary"
                    >
                        <Typography>No events yet. Waiting for user activity...</Typography>
                    </Box>
                ) : (
                    filteredEvents.map((event, index) => (
                        <Box
                            key={event.id || index}
                            sx={{
                                p: 1.5,
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 2,
                                bgcolor:
                                    event.eventType === "VIOLATION" || event.eventType === "SEEK_ATTEMPT"
                                        ? "rgba(244, 67, 54, 0.1)"
                                        : event.eventType === "VIDEO_COMPLETE"
                                        ? "rgba(76, 175, 80, 0.1)"
                                        : "transparent",
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.05)",
                                },
                            }}
                        >
                            {/* Timestamp */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "rgba(255,255,255,0.5)",
                                    minWidth: 80,
                                    fontFamily: "monospace",
                                }}
                            >
                                {formatTime(event.timestamp)}
                            </Typography>

                            {/* Event Icon */}
                            <Box
                                sx={{
                                    color: EVENT_COLORS[event.eventType] || "#9e9e9e",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {EVENT_ICONS[event.eventType] || <FiberManualRecordIcon fontSize="small" />}
                            </Box>

                            {/* Event Type */}
                            <Chip
                                label={event.eventType}
                                size="small"
                                sx={{
                                    bgcolor: EVENT_COLORS[event.eventType] || "#9e9e9e",
                                    color: "#fff",
                                    fontSize: "0.7rem",
                                    height: 20,
                                    minWidth: 100,
                                }}
                            />

                            {/* User - clickable to filter */}
                            <Tooltip title={`Filter by ${event.email}`}>
                                <Box 
                                    display="flex" 
                                    alignItems="center" 
                                    gap={1} 
                                    minWidth={150}
                                    onClick={() => setSelectedUser(event.email)}
                                    sx={{ 
                                        cursor: "pointer",
                                        borderRadius: 1,
                                        px: 0.5,
                                        "&:hover": {
                                            bgcolor: "rgba(0, 212, 255, 0.1)",
                                        },
                                    }}
                                >
                                    <Avatar sx={{ width: 20, height: 20, fontSize: "0.7rem", bgcolor: "#00d4ff" }}>
                                        {event.email?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: "#00d4ff", fontFamily: "monospace" }}
                                    >
                                        {event.email}
                                    </Typography>
                                </Box>
                            </Tooltip>

                            {/* Video Title */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "rgba(255,255,255,0.7)",
                                    minWidth: 120,
                                    maxWidth: 150,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {event.videoTitle}
                            </Typography>

                            {/* Progress */}
                            {event.percentWatched != null && (
                                <Chip
                                    label={`${Math.round(event.percentWatched)}%`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        color: "rgba(255,255,255,0.7)",
                                        borderColor: "rgba(255,255,255,0.3)",
                                        fontSize: "0.7rem",
                                        height: 20,
                                    }}
                                />
                            )}

                            {/* Details */}
                            {event.details && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "rgba(255,255,255,0.5)",
                                        fontFamily: "monospace",
                                        flex: 1,
                                    }}
                                >
                                    {event.details}
                                </Typography>
                            )}
                        </Box>
                    ))
                )}
            </Paper>

            {/* Legend */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Typography variant="subtitle2" color="#fff" gutterBottom>
                    Event Legend
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(EVENT_COLORS).map(([type, color]) => (
                        <Chip
                            key={type}
                            icon={EVENT_ICONS[type]}
                            label={type.replace(/_/g, " ")}
                            size="small"
                            sx={{
                                bgcolor: color,
                                color: "#fff",
                                fontSize: "0.7rem",
                            }}
                        />
                    ))}
                </Box>
            </Paper>
        </Box>
    );
}

