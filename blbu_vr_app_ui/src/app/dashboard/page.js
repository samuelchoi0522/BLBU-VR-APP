"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import Uploads from "./components/Uploads";
import ManageVideos from "./components/ManageVideos";
import UserData from "./components/UserData";

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
                bgcolor="#f5f6fa"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box display="flex" height="100vh" bgcolor="#f5f6fa" color="black">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <Box flex={1} p={4} overflow="auto">
                {activeTab === "dashboard" && <DashboardHome setActiveTab={setActiveTab} />}
                {activeTab === "upload" && <Uploads />}
                {activeTab === "manage" && <ManageVideos />}
                {activeTab === "users" && <UserData />}
            </Box>
        </Box>
    );
}
