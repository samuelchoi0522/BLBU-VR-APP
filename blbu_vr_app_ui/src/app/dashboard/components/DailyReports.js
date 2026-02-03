"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Chip,
    CircularProgress,
    Button,
    Alert,
    Divider,
    IconButton,
    Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";

export default function DailyReports() {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savedReports, setSavedReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const fetchDailyReport = async (date) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const dateStr = dayjs(date).format("YYYY-MM-DD");
            const res = await fetch(`${API_BASE_URL}/api/reports/daily?date=${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            } else {
                setReportData(null);
            }
        } catch (err) {
            console.error("Failed to fetch daily report:", err);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedReports = async () => {
        setLoadingReports(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/reports/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSavedReports(data);
            }
        } catch (err) {
            console.error("Failed to fetch saved reports:", err);
        } finally {
            setLoadingReports(false);
        }
    };

    useEffect(() => {
        fetchDailyReport(selectedDate);
        fetchSavedReports();
    }, []);

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        fetchDailyReport(newDate);
    };

    const handleDownloadPDF = async (filename) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/reports/download?filename=${encodeURIComponent(filename)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Failed to download PDF:", err);
            alert("Failed to download PDF report");
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "N/A";
        return dayjs(timestamp).format("h:mm A");
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "N/A";
        return dayjs(timestamp).format("MMM D, YYYY h:mm A");
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h4" fontWeight="700" color="#fff" gutterBottom>
                    Daily Reports
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }} mb={3}>
                    Comprehensive view of daily video completions and user activity
                </Typography>

                {/* Date Selector */}
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
                    <Box display="flex" alignItems="center" gap={2}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            maxDate={dayjs()}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: {
                                        minWidth: 200,
                                        "& .MuiOutlinedInput-root": {
                                            color: "#fff",
                                            "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                                            "&.Mui-focused fieldset": { borderColor: "#00d4ff" },
                                        },
                                        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#00d4ff" },
                                        "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.5)" },
                                    },
                                },
                            }}
                        />
                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={() => fetchDailyReport(selectedDate)}
                                sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#00d4ff" } }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>

                {/* Report Data */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                        <CircularProgress sx={{ color: "#00d4ff" }} />
                    </Box>
                ) : reportData ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <Typography variant="h6" fontWeight="600" color="#fff" mb={2}>
                            Report for {dayjs(selectedDate).format("MMMM D, YYYY")}
                        </Typography>

                        {/* Summary Stats */}
                        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "rgba(76, 175, 80, 0.1)",
                                    border: "1px solid rgba(76, 175, 80, 0.3)",
                                    flex: 1,
                                    minWidth: 150,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                                    Total Completions
                                </Typography>
                                <Typography variant="h5" fontWeight="700" color="#4caf50">
                                    {reportData.totalCompletions || 0}
                                </Typography>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "rgba(244, 67, 54, 0.1)",
                                    border: "1px solid rgba(244, 67, 54, 0.3)",
                                    flex: 1,
                                    minWidth: 150,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                                    Flagged Completions
                                </Typography>
                                <Typography variant="h5" fontWeight="700" color="#f44336">
                                    {reportData.flaggedCount || 0}
                                </Typography>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "rgba(0, 212, 255, 0.1)",
                                    border: "1px solid rgba(0, 212, 255, 0.3)",
                                    flex: 1,
                                    minWidth: 150,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}>
                                    Active Users
                                </Typography>
                                <Typography variant="h5" fontWeight="700" color="#00d4ff">
                                    {reportData.totalUsers || 0}
                                </Typography>
                            </Paper>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 3 }} />

                        {/* Completions Table */}
                        <Typography variant="h6" fontWeight="600" color="#fff" mb={2}>
                            Video Completions
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            User
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Video Title
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Completion Time
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Flags
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.completions && reportData.completions.length > 0 ? (
                                        reportData.completions.map((completion, idx) => (
                                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                                <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>
                                                    {completion.userName || completion.email}
                                                </TableCell>
                                                <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>
                                                    {completion.videoTitle || "N/A"}
                                                </TableCell>
                                                <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>
                                                    {formatTime(completion.completedAt)}
                                                </TableCell>
                                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                                    <Chip
                                                        icon={<CheckCircleIcon />}
                                                        label="Completed"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "rgba(76, 175, 80, 0.2)",
                                                            color: "#4caf50",
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                                    {completion.flagged && completion.violations && completion.violations.length > 0 ? (
                                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                                            <Chip
                                                                icon={<WarningIcon />}
                                                                label={`${completion.violations.length} Flag(s)`}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: "rgba(244, 67, 54, 0.2)",
                                                                    color: "#f44336",
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>
                                                                {completion.violations.map(v => v.type).join(", ")}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                                            None
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ borderColor: "rgba(255,255,255,0.1)", py: 4 }}>
                                                <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                                                    No completions found for this date
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : (
                    <Alert severity="info" sx={{ bgcolor: "rgba(0, 212, 255, 0.1)", color: "#00d4ff", border: "1px solid rgba(0, 212, 255, 0.3)" }}>
                        No report data available for this date
                    </Alert>
                )}

                {/* Saved PDF Reports */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <Typography variant="h6" fontWeight="600" color="#fff" mb={2}>
                        Saved PDF Reports
                    </Typography>
                    {loadingReports ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress sx={{ color: "#00d4ff" }} size={24} />
                        </Box>
                    ) : savedReports.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Date
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Filename
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }}>
                                            Created
                                        </TableCell>
                                        <TableCell sx={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)", fontWeight: 600 }} align="right">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {savedReports.map((report, idx) => (
                                        <TableRow key={idx} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                            <TableCell sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>
                                                {report.date || "N/A"}
                                            </TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: "0.85rem" }}>
                                                {report.filename}
                                            </TableCell>
                                            <TableCell sx={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }}>
                                                {formatDateTime(report.createdAt)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                                                <Tooltip title="Download PDF">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadPDF(report.filename)}
                                                        sx={{
                                                            color: "#00d4ff",
                                                            "&:hover": {
                                                                bgcolor: "rgba(0, 212, 255, 0.1)",
                                                            },
                                                        }}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.6)", py: 2 }}>
                            No saved PDF reports yet. Reports are automatically generated at 11:59 PM daily.
                        </Typography>
                    )}
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}

