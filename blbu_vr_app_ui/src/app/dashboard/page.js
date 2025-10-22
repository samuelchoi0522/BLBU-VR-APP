"use client";
import React, { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import Uploads from "./components/Uploads";
import ManageVideos from "./components/ManageVideos";
import UserData from "./components/UserData";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

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
