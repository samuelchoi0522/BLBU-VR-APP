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
    const [autoStartVr, setAutoStartVr] = useState(false);
    const hasAttemptedAutoStart = useRef(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        // Check WebXR support
        if (navigator.xr) {
            navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
                setVrSupported(supported);
            });
        }
        
        // Check if auto-start VR is requested
        const autostart = searchParams.get("autostart");
        setAutoStartVr(autostart === "true");

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

    // Auto-enter VR mode when video is ready and autostart is enabled
    useEffect(() => {
        if (
            autoStartVr && 
            vrSupported && 
            videoUrl && 
            !loading && 
            !vrSession && 
            !hasAttemptedAutoStart.current
        ) {
            hasAttemptedAutoStart.current = true;
            // Small delay to ensure video element is ready
            const timer = setTimeout(() => {
                enterVR();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [autoStartVr, vrSupported, videoUrl, loading, vrSession]);

    const enterVR = async () => {
        if (!navigator.xr || !vrSupported) {
            alert("WebXR is not supported on this device");
            return;
        }

        try {
            // Request VR session with video layer support if available
            const session = await navigator.xr.requestSession("immersive-vr", {
                requiredFeatures: ["local-floor"],
                optionalFeatures: ["layers"],
            });
            setVrSession(session);

            // Enter fullscreen first
            if (containerRef.current && containerRef.current.requestFullscreen) {
                try {
                    await containerRef.current.requestFullscreen();
                } catch (e) {
                    console.log("Fullscreen not available");
                }
            }

            // Make sure video plays
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
            }

            session.addEventListener("end", () => {
                setVrSession(null);
                // Exit fullscreen when VR ends
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log("Exit fullscreen error:", e));
                }
            });

            // Set up render loop for VR
            const xrReferenceSpace = await session.requestReferenceSpace("local-floor");
            
            // Create a simple render loop to keep the session active
            const onXRFrame = (time, frame) => {
                if (session.ended) return;
                session.requestAnimationFrame(onXRFrame);
                
                // The video is rendered by the browser's compositor
                // This keeps the VR session alive while video plays
            };
            
            session.requestAnimationFrame(onXRFrame);
            
            console.log("VR session started - immersive video mode active");
        } catch (err) {
            console.error("Failed to enter VR:", err);
            // If VR fails, at least go fullscreen for an immersive experience
            if (containerRef.current) {
                try {
                    await containerRef.current.requestFullscreen();
                    if (videoRef.current) {
                        videoRef.current.play();
                    }
                } catch (e) {
                    console.log("Fullscreen fallback failed:", e);
                }
            }
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
                playsInline
                crossOrigin="anonymous"
                onLoadedData={() => {
                    // Auto-play when video is loaded
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                    }
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                }}
            />

            {/* Auto-starting VR indicator */}
            {autoStartVr && !vrSession && vrSupported && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 20,
                        textAlign: "center",
                        color: "#fff",
                    }}
                >
                    <CircularProgress sx={{ color: "#00d4ff", mb: 2 }} />
                    <Typography variant="h6" fontWeight={600}>
                        Entering Immersive VR Mode...
                    </Typography>
                </Box>
            )}

            {/* VR Active indicator */}
            {vrSession && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 80,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        bgcolor: "rgba(0, 200, 83, 0.9)",
                        color: "#fff",
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <ViewInArIcon />
                    <Typography fontWeight={600}>VR Mode Active</Typography>
                </Box>
            )}

            {/* VR Button Overlay */}
            {vrSupported && !vrSession && !autoStartVr && (
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

            {/* Non-VR device message */}
            {!vrSupported && (
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 100,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        textAlign: "center",
                    }}
                >
                    <Typography color="rgba(255,255,255,0.7)" mb={1}>
                        VR not supported on this device
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={enterFullscreen}
                        startIcon={<FullscreenIcon />}
                        sx={{
                            background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
                        }}
                    >
                        Watch in Fullscreen
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

