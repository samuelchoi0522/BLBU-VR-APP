"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

function VRVideoPlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState(null);
    const [vrSession, setVrSession] = useState(null);
    const [vrSupported, setVrSupported] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        // Check WebXR support
        if (navigator.xr) {
            navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
                setVrSupported(supported);
            });
        }

        const fetchVideo = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/");
                return;
            }

            try {
                // Check for video URL in params or fetch today's
                const urlParam = searchParams.get("url");
                if (urlParam) {
                    setVideoUrl(decodeURIComponent(urlParam));
                } else {
                    const res = await fetch(`${API_BASE_URL}/api/videos/today`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const url = await res.text();
                        setVideoUrl(url);
                    } else {
                        setError("No video available for today");
                    }
                }
            } catch (err) {
                setError("Failed to load video");
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [router, searchParams, API_BASE_URL]);

    const enterVR = async () => {
        if (!navigator.xr || !vrSupported) {
            alert("WebXR is not supported on this device");
            return;
        }

        try {
            const session = await navigator.xr.requestSession("immersive-vr", {
                requiredFeatures: ["local-floor"],
            });
            setVrSession(session);

            session.addEventListener("end", () => {
                setVrSession(null);
            });

            // Basic WebXR setup for 360 video
            // In a full implementation, you would set up WebGL rendering here
            console.log("VR session started");
        } catch (err) {
            console.error("Failed to enter VR:", err);
            alert("Failed to enter VR mode. Please try again.");
        }
    };

    const enterFullscreen = () => {
        if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            }
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                sx={{
                    background: "#000",
                }}
            >
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                sx={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    color: "#fff",
                }}
            >
                <Typography variant="h5" mb={2}>
                    {error}
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push("/user")}
                    sx={{
                        background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                    }}
                >
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                height: "100vh",
                width: "100vw",
                background: "#000",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Header Controls */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
                    zIndex: 10,
                }}
            >
                <IconButton
                    onClick={() => router.push("/user")}
                    sx={{ color: "#fff" }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                    VR Therapy Session
                </Typography>

                <Box display="flex" gap={1}>
                    <IconButton onClick={enterFullscreen} sx={{ color: "#fff" }}>
                        <FullscreenIcon />
                    </IconButton>
                    {vrSupported && (
                        <IconButton
                            onClick={enterVR}
                            sx={{
                                color: vrSession ? "#00d4ff" : "#fff",
                                bgcolor: vrSession ? "rgba(0, 212, 255, 0.2)" : "transparent",
                            }}
                        >
                            <ViewInArIcon />
                        </IconButton>
                    )}
                </Box>
            </Box>

            {/* Video Player */}
            <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                }}
            />

            {/* VR Button Overlay */}
            {vrSupported && !vrSession && (
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 100,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                    }}
                >
                    <Button
                        variant="contained"
                        size="large"
                        onClick={enterVR}
                        startIcon={<ViewInArIcon />}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                            boxShadow: "0 4px 20px rgba(0, 212, 255, 0.4)",
                            fontWeight: 600,
                            "&:hover": {
                                background: "linear-gradient(135deg, #00b4d8 0%, #0088b8 100%)",
                            },
                        }}
                    >
                        Enter VR Mode
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default function VRVideoPlayer() {
    return (
        <Suspense
            fallback={
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="100vh"
                    sx={{ background: "#000" }}
                >
                    <CircularProgress sx={{ color: "#00d4ff" }} />
                </Box>
            }
        >
            <VRVideoPlayerContent />
        </Suspense>
    );
}

