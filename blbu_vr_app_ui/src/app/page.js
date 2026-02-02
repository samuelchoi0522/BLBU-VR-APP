"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
} from "@mui/material";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    const redirectBasedOnRole = (role) => {
        if (role === "admin") {
            router.push("/dashboard");
        } else {
            router.push("/user");
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setCheckingSession(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("userRole", data.role || "user");
                    localStorage.setItem("userEmail", data.email);
                    redirectBasedOnRole(data.role);
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("userEmail");
                    setCheckingSession(false);
                }
            } catch (err) {
                console.error("Session check failed:", err);
                setCheckingSession(false);
            }
        };

        checkSession();
    }, [router, API_BASE_URL]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role || "user");
                localStorage.setItem("userEmail", data.email);
            }

            setSuccess(data.message || "Login successful!");
            setTimeout(() => redirectBasedOnRole(data.role), 800);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                sx={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                }}
            >
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            sx={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background: "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 50%)",
                    animation: "pulse 8s ease-in-out infinite",
                },
                "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.1)" },
                },
            }}
        >
            <Paper
                elevation={24}
                sx={{
                    p: 5,
                    width: "100%",
                    maxWidth: 420,
                    borderRadius: 4,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <Box textAlign="center" mb={4}>
                    <Typography
                        variant="h4"
                        fontWeight="800"
                        sx={{
                            background: "linear-gradient(135deg, #0f3460 0%, #00d4ff 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            mb: 1,
                        }}
                    >
                        BLBU VR Therapy
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sign in to continue your wellness journey
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="normal"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                "&:hover fieldset": {
                                    borderColor: "#00d4ff",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#0f3460",
                                },
                            },
                        }}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                "&:hover fieldset": {
                                    borderColor: "#00d4ff",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#0f3460",
                                },
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                            mt: 3,
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: "1rem",
                            fontWeight: 600,
                            background: "linear-gradient(135deg, #0f3460 0%, #00d4ff 100%)",
                            boxShadow: "0 4px 15px rgba(0, 212, 255, 0.3)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #16213e 0%, #00b4d8 100%)",
                                boxShadow: "0 6px 20px rgba(0, 212, 255, 0.4)",
                            },
                        }}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}
