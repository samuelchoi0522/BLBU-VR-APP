"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, IconButton, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function VRVideoPlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoId, setVideoId] = useState(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [vrSession, setVrSession] = useState(null);
    const [vrSupported, setVrSupported] = useState(false);
    const [error, setError] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    
    // Video tracking state
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [maxWatchedTime, setMaxWatchedTime] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [sessionId] = useState(() => `vr_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const lastReportedTime = useRef(0);
    const progressInterval = useRef(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // Send event to backend
    const sendEvent = useCallback(async (eventType, details = null, videoTime = null) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/api/video-watch/event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: userEmail,
                    sessionId,
                    videoId: videoId ? parseInt(videoId) : null,
                    eventType,
                    videoTime: videoTime ?? videoRef.current?.currentTime ?? 0,
                    videoDuration: duration || videoRef.current?.duration || 0,
                    details,
                }),
            });
        } catch (err) {
            console.error("Failed to send event:", err);
        }
    }, [API_BASE_URL, userEmail, sessionId, videoId, duration]);

    // Add warning message
    const addWarning = useCallback((message) => {
        setWarnings((prev) => [...prev, { message, time: Date.now() }]);
        setTimeout(() => {
            setWarnings((prev) => prev.filter((w) => Date.now() - w.time < 5000));
        }, 5000);
    }, []);

    useEffect(() => {
        // Check WebXR support
        if (navigator.xr) {
            navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
                setVrSupported(supported);
            });
        }

        const fetchVideo = async () => {
            const token = localStorage.getItem("token");
            const email = localStorage.getItem("userEmail");
            
            if (!token) {
                router.push("/");
                return;
            }
            
            setUserEmail(email || "");

            try {
                // Check for video URL in params or fetch today's
                const urlParam = searchParams.get("url");
                const idParam = searchParams.get("videoId");
                const titleParam = searchParams.get("title");
                
                if (urlParam) {
                    setVideoUrl(decodeURIComponent(urlParam));
                    if (idParam) setVideoId(idParam);
                    if (titleParam) setVideoTitle(decodeURIComponent(titleParam));
                } else {
                    // Fetch today's video metadata
                    const res = await fetch(`${API_BASE_URL}/api/videos/today/metadata`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setVideoUrl(data.url);
                        setVideoId(data.id);
                        setVideoTitle(data.title || "Today's Session");
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

    // Session start event
    useEffect(() => {
        if (userEmail && videoUrl) {
            sendEvent("SESSION_START", `VR Session started: ${videoTitle}`);
        }
        
        return () => {
            if (userEmail) {
                sendEvent("SESSION_END", "Left VR player page");
            }
        };
    }, [userEmail, videoUrl, videoTitle, sendEvent]);

    // Tab visibility detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                sendEvent("TAB_HIDDEN", "User switched away from VR player");
                addWarning("Please stay focused on your therapy session");
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
            } else {
                sendEvent("TAB_VISIBLE", "User returned to VR player");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [sendEvent, addWarning]);

    // Progress reporting (every 10 seconds)
    useEffect(() => {
        progressInterval.current = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused && currentTime - lastReportedTime.current >= 10) {
                sendEvent("PROGRESS_UPDATE", `VR Progress: ${Math.round((currentTime / duration) * 100)}%`);
                lastReportedTime.current = currentTime;
            }
        }, 10000);

        return () => clearInterval(progressInterval.current);
    }, [currentTime, duration, sendEvent]);

    // Video event handlers
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const newTime = videoRef.current.currentTime;
        setCurrentTime(newTime);

        // Update max watched time (only if moving forward naturally)
        if (newTime > maxWatchedTime && newTime - maxWatchedTime < 2) {
            setMaxWatchedTime(newTime);
        }
    };

    const handleSeeking = () => {
        if (!videoRef.current) return;
        const seekTime = videoRef.current.currentTime;

        // Block seeking ahead
        if (seekTime > maxWatchedTime + 1) {
            videoRef.current.currentTime = maxWatchedTime;
            addWarning("You cannot skip ahead. Please watch the entire video.");
            sendEvent("SEEK_ATTEMPT", `Attempted to skip from ${maxWatchedTime.toFixed(1)}s to ${seekTime.toFixed(1)}s`, maxWatchedTime);
        }
    };

    const handlePlay = () => {
        sendEvent("PLAY", "Video started playing in VR");
    };

    const handlePause = () => {
        if (!isComplete) {
            sendEvent("PAUSE", `Paused at ${currentTime.toFixed(1)}s`);
        }
    };

    const handleEnded = async () => {
        const watchedPercent = (maxWatchedTime / duration) * 100;

        if (watchedPercent >= 95) {
            setIsComplete(true);
            sendEvent("VIDEO_COMPLETE", `Completed in VR! Watched ${watchedPercent.toFixed(1)}%`);
            
            // Mark video as complete
            const token = localStorage.getItem("token");
            const today = new Date().toISOString().split('T')[0];
            try {
                await fetch(`${API_BASE_URL}/api/videos/save-video-completion?email=${encodeURIComponent(userEmail)}&date=${today}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (err) {
                console.error("Failed to save completion:", err);
            }
        } else {
            addWarning(`You've only watched ${watchedPercent.toFixed(1)}% of the video. Please watch completely.`);
            sendEvent("VIOLATION", `Attempted completion with only ${watchedPercent.toFixed(1)}% watched`);
        }
    };

    const enterVR = async () => {
        if (!navigator.xr || !vrSupported) {
            alert("WebXR is not supported on this device");
            return;
        }

        try {
            const session = await navigator.xr.requestSession("immersive-vr", {
                requiredFeatures: ["local-floor"],
                optionalFeatures: ["layers"],
            });
            setVrSession(session);
            sendEvent("PLAY", "Entered VR immersive mode");

            if (containerRef.current && containerRef.current.requestFullscreen) {
                try {
                    await containerRef.current.requestFullscreen();
                } catch (e) {
                    console.log("Fullscreen not available");
                }
            }

            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
            }

            session.addEventListener("end", () => {
                setVrSession(null);
                sendEvent("PAUSE", "Exited VR immersive mode");
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log("Exit fullscreen error:", e));
                }
            });

            const xrReferenceSpace = await session.requestReferenceSpace("local-floor");
            
            const onXRFrame = (time, frame) => {
                if (session.ended) return;
                session.requestAnimationFrame(onXRFrame);
            };
            
            session.requestAnimationFrame(onXRFrame);
            
            console.log("VR session started - immersive video mode active");
        } catch (err) {
            console.error("Failed to enter VR:", err);
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
                sx={{ background: "#000" }}
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
                <Typography variant="h5" mb={2}>{error}</Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push("/user")}
                    sx={{ background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)" }}
                >
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
            {/* Warnings */}
            {warnings.length > 0 && (
                <Box sx={{ position: "absolute", top: 70, left: 16, right: 16, zIndex: 20 }}>
                    {warnings.map((w, i) => (
                        <Alert key={i} severity="warning" icon={<WarningIcon />} sx={{ mb: 1, bgcolor: "rgba(255, 152, 0, 0.95)" }}>
                            {w.message}
                        </Alert>
                    ))}
                </Box>
            )}

            {/* Completion badge */}
            {isComplete && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 70,
                        right: 16,
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        bgcolor: "rgba(0, 200, 83, 0.95)",
                        color: "#fff",
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                    }}
                >
                    <CheckCircleIcon />
                    <Typography fontWeight={600}>Session Complete!</Typography>
                </Box>
            )}

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
                <IconButton onClick={() => router.push("/user")} sx={{ color: "#fff" }}>
                    <ArrowBackIcon />
                </IconButton>

                <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                        VR Therapy Session
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {Math.round(progress)}% watched
                    </Typography>
                </Box>

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
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                }}
            />

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
                        sx={{ background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)" }}
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
