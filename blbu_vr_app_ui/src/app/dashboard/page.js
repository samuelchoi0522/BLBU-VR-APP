"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import Uploads from "./components/Uploads";
import ManageVideos from "./components/ManageVideos";
import UserData from "./components/UserData";
import ActivityLog from "./components/ActivityLog";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            
            if (!token) {
                router.push("/");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    localStorage.clear();
                    router.push("/");
                    return;
                }

                const data = await response.json();
                
                // Redirect non-admins to user dashboard
                if (data.role !== "admin") {
                    router.push("/user");
                    return;
                }

                localStorage.setItem("userRole", data.role);
                localStorage.setItem("userEmail", data.email);
                setLoading(false);
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push("/");
            }
        };

        checkAuth();
    }, [router, API_BASE_URL]);

    if (loading) {
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
            height="100vh"
            sx={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                color: "#fff",
            }}
        >
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <Box
                flex={1}
                p={4}
                overflow="auto"
                sx={{
                    "&::-webkit-scrollbar": {
                        width: 8,
                    },
                    "&::-webkit-scrollbar-track": {
                        bgcolor: "rgba(255,255,255,0.05)",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: "rgba(255,255,255,0.2)",
                        borderRadius: 4,
                    },
                }}
            >
                {activeTab === "dashboard" && <DashboardHome setActiveTab={setActiveTab} />}
                {activeTab === "upload" && <Uploads />}
                {activeTab === "manage" && <ManageVideos />}
                {activeTab === "users" && <UserData />}
                {activeTab === "activity" && <ActivityLog />}
            </Box>
        </Box>
    );
}
