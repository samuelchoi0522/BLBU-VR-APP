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
                    router.push("/dashboard");
                } else {
                    localStorage.removeItem("token");
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
            }

            setSuccess(data.message || "Login successful!");
            setTimeout(() => router.push("/dashboard"), 800);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Show spinner while checking session
    if (checkingSession) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            bgcolor="#f5f6fa"
        >
            <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
                    Login
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        margin="normal"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}
