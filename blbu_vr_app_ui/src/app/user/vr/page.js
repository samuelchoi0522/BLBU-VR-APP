"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Button, CircularProgress, IconButton, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

function VRVideoPlayerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoId, setVideoId] = useState(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [error, setError] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    const [isQuestBrowser, setIsQuestBrowser] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Video tracking state
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [maxWatchedTime, setMaxWatchedTime] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [redirectCountdown, setRedirectCountdown] = useState(null); // Countdown timer (null = not counting)
    const [sessionId] = useState(() => `vr_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const lastReportedTime = useRef(0);
    const leftEarlyRef = useRef(false); // Track if user left session/tab before completion
    const pausedByTabHiddenRef = useRef(false); // Track if video was paused due to tab being hidden
    const maxWatchedTimeRef = useRef(0); // Ref to track max watched time for cleanup
    const durationRef = useRef(0); // Ref to track duration for cleanup
    const isCompleteRef = useRef(false); // Ref to track completion status for cleanup
    const sessionStartSentRef = useRef(false); // Track if SESSION_START has been sent

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    // Detect Quest browser
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isQuest = ua.includes("oculus") || ua.includes("quest") || ua.includes("oculusbrowser");
        setIsQuestBrowser(isQuest);
        console.log("[VR] User Agent:", navigator.userAgent);
        console.log("[VR] Is Quest Browser:", isQuest);
    }, []);

    // Send event to backend
    const sendEvent = useCallback(async (eventType, details = null, videoTime = null) => {
        try {
            const token = localStorage.getItem("token");
            const video = videoRef.current;
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
                    videoTime: videoTime ?? video?.currentTime ?? 0,
                    videoDuration: duration || video?.duration || 0,
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

    // Fetch video data
    useEffect(() => {
        const fetchVideo = async () => {
            const token = localStorage.getItem("token");
            const email = localStorage.getItem("userEmail");
            
            if (!token) {
                router.push("/");
                return;
            }
            
            setUserEmail(email || "");

            try {
                // First, check if today's video is already completed
                const today = new Date().toISOString().split('T')[0];
                const checkCompletionRes = await fetch(`${API_BASE_URL}/api/videos/check-completion?email=${encodeURIComponent(email)}&date=${today}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (checkCompletionRes.ok) {
                    const completionData = await checkCompletionRes.json();
                    if (completionData.completed) {
                        // Video already completed, redirect back to user page
                        setError("You have already completed today's session. Redirecting...");
                        setTimeout(() => {
                            router.push("/user");
                        }, 2000);
                        setLoading(false);
                        return;
                    }
                }

                const urlParam = searchParams.get("url");
                const idParam = searchParams.get("videoId");
                const titleParam = searchParams.get("title");
                
                if (urlParam) {
                    setVideoUrl(decodeURIComponent(urlParam));
                    if (idParam) setVideoId(idParam);
                    if (titleParam) setVideoTitle(decodeURIComponent(titleParam));
                } else {
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

    // Track fullscreen changes (Meta's VR mode activates automatically on fullscreen)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isFs);
            
            if (isFs) {
                sendEvent("ENTER_VR_MODE", "Entered fullscreen - Meta VR cinema mode active");
                console.log("[VR] Entered fullscreen - Meta's native VR player with hand tracking is now active");
            } else {
                // User exited fullscreen/VR mode - only mark as left early if video hasn't reached high completion
                const watchedPercent = duration > 0 ? (maxWatchedTime / duration) * 100 : 0;
                if (!isComplete && watchedPercent < 95) {
                    leftEarlyRef.current = true;
                    console.log("[VR] User exited VR mode before video completion");
                }
                sendEvent("EXIT_VR_MODE", "Exited fullscreen/VR mode");
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);
        
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, [sendEvent]);

    // Video event handlers
    const handleLoadedMetadata = () => {
        const newDuration = videoRef.current?.duration || 0;
        setDuration(newDuration);
        durationRef.current = newDuration;
        setVideoReady(true);
        console.log("[VR] Video ready, duration:", videoRef.current?.duration);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const newTime = videoRef.current.currentTime;
        setCurrentTime(newTime);
        
        if (newTime > maxWatchedTime && newTime - maxWatchedTime < 2) {
            setMaxWatchedTime(prev => {
                const newMax = Math.max(prev, newTime);
                maxWatchedTimeRef.current = newMax;
                return newMax;
            });
        }

        if (newTime - lastReportedTime.current >= 10) {
            sendEvent("PROGRESS_UPDATE", `Progress: ${Math.round((newTime / videoRef.current.duration) * 100)}%`);
            lastReportedTime.current = newTime;
        }
    };

    const handleSeeking = () => {
        if (!videoRef.current) return;
        const seekTime = videoRef.current.currentTime;
        if (seekTime > maxWatchedTime + 1) {
            videoRef.current.currentTime = maxWatchedTime;
            addWarning("You cannot skip ahead. Please watch the entire video.");
            sendEvent("SEEK_ATTEMPT", `Blocked skip to ${seekTime.toFixed(1)}s`);
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        sendEvent("PLAY", "Video playing");
    };

    const handlePause = () => {
        if (!isComplete) {
            setIsPlaying(false);
            sendEvent("PAUSE", `Paused at ${videoRef.current?.currentTime?.toFixed(1)}s`);
        }
    };

    const handleEnded = async () => {
        const watchedPercent = (maxWatchedTime / duration) * 100;
        
        // Check if video was actually completed (watched >= 95%)
        if (watchedPercent >= 95) {
            // Video was completed - mark as complete regardless of leftEarlyRef
            setIsComplete(true);
            isCompleteRef.current = true;
            leftEarlyRef.current = false; // Reset flag since video was completed
            sendEvent("VIDEO_COMPLETE", `Completed! ${watchedPercent.toFixed(1)}%`);
            const token = localStorage.getItem("token");
            const today = new Date().toISOString().split('T')[0];
            try {
                await fetch(`${API_BASE_URL}/api/videos/save-video-completion?email=${encodeURIComponent(userEmail)}&date=${today}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Start countdown before redirecting
                setRedirectCountdown(10);
            } catch (err) {
                console.error("Failed to save completion:", err);
            }
        } else {
            // Video was not completed - check if user left early
            if (leftEarlyRef.current) {
                console.log("[VR] Video ended but user left early - not marking as complete");
                sendEvent("VIOLATION", "Video ended but user left session/tab before completion");
            } else {
                addWarning(`Only watched ${watchedPercent.toFixed(1)}%. Please watch the complete video.`);
            }
        }
    };

    // Enter fullscreen - Meta Quest automatically shows VR cinema mode with hand tracking
    const enterFullscreen = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            // Start playing first (required before fullscreen on mobile/VR)
            if (video.paused) {
                await video.play();
            }

            // Request fullscreen on the video element
            // Quest browser automatically presents this in immersive VR cinema mode
            // with native hand tracking controls (pinch to play/pause, etc.)
            if (video.requestFullscreen) {
                await video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                await video.webkitRequestFullscreen();
            } else if (video.webkitEnterFullscreen) {
                // iOS Safari / older WebKit
                video.webkitEnterFullscreen();
            } else if (video.mozRequestFullScreen) {
                await video.mozRequestFullScreen();
            } else if (video.msRequestFullscreen) {
                await video.msRequestFullscreen();
            }

            console.log("[VR] Entered fullscreen - Meta's native VR player with hand tracking is now active");
        } catch (err) {
            console.error("[VR] Fullscreen error:", err);
            addWarning("Could not enter fullscreen: " + err.message);
        }
    }, [addWarning]);

    // Removed auto-fullscreen - user must manually click fullscreen button

    // Session logging - send SESSION_START once when userEmail and videoUrl are available
    useEffect(() => {
        if (userEmail && videoUrl && !sessionStartSentRef.current) {
            sessionStartSentRef.current = true;
            sendEvent("SESSION_START", `VR Session: ${videoTitle}`);
        }
    }, [userEmail, videoUrl, videoTitle, sendEvent]);

    // Session end logging - only on unmount
    useEffect(() => {
        return () => {
            if (userEmail && sessionStartSentRef.current) {
                // Mark that user left before completion - only if video hasn't reached high completion
                // Use refs to get current values without adding them as dependencies
                const currentDuration = durationRef.current || videoRef.current?.duration || 0;
                const currentMaxWatched = maxWatchedTimeRef.current;
                const watchedPercent = currentDuration > 0 ? (currentMaxWatched / currentDuration) * 100 : 0;
                if (!isCompleteRef.current && watchedPercent < 95) {
                    leftEarlyRef.current = true;
                    console.log("[VR] User left session before video completion");
                }
                sendEvent("SESSION_END", "Left VR player");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run cleanup on unmount - use refs for current values

    // Tab visibility
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                // Mark that user left tab before completion - only if video hasn't reached high completion
                const watchedPercent = duration > 0 ? (maxWatchedTime / duration) * 100 : 0;
                if (!isComplete && watchedPercent < 95) {
                    leftEarlyRef.current = true;
                    console.log("[VR] User left tab before video completion");
                }
                sendEvent("TAB_HIDDEN", "User switched tabs");
                if (videoRef.current && !videoRef.current.paused) {
                    pausedByTabHiddenRef.current = true; // Mark that we paused due to tab hidden
                    videoRef.current.pause();
                }
            } else {
                // Tab became visible - don't auto-resume, user must manually play
                pausedByTabHiddenRef.current = false; // Reset flag when tab becomes visible
                sendEvent("TAB_VISIBLE", "User returned");
                // Ensure video stays paused - user must manually resume
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [sendEvent, isComplete, duration, maxWatchedTime]);

    // Monitor video paused state (needed for Meta's fullscreen VR mode where onPause might not fire)
    useEffect(() => {
        if (!videoRef.current) return;

        let lastPausedState = videoRef.current.paused;
        const checkInterval = setInterval(() => {
            const video = videoRef.current;
            if (!video) return;

            const currentlyPaused = video.paused;
            
            // If paused state changed, send appropriate event
            if (currentlyPaused !== lastPausedState) {
                if (currentlyPaused && isPlaying) {
                    // Video was paused (either by user or system)
                    setIsPlaying(false);
                    // Only send pause event if it wasn't paused due to tab being hidden
                    if (!pausedByTabHiddenRef.current) {
                        sendEvent("PAUSE", `Paused at ${video.currentTime?.toFixed(1)}s`);
                    }
                } else if (!currentlyPaused && !isPlaying && !isComplete) {
                    // Video was resumed - but only if tab is visible and wasn't paused by tab hidden
                    if (!document.hidden && !pausedByTabHiddenRef.current) {
                        setIsPlaying(true);
                        sendEvent("PLAY", "Video resumed");
                    } else {
                        // Prevent auto-resume if tab was hidden or we paused due to tab hidden
                        video.pause();
                    }
                }
                lastPausedState = currentlyPaused;
            }
        }, 500); // Check every 500ms

        return () => clearInterval(checkInterval);
    }, [isPlaying, isComplete, sendEvent]);

    // Handle page unload (user navigates away, closes tab, etc.)
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Mark that user left before completion - only if video hasn't reached high completion
            const watchedPercent = duration > 0 ? (maxWatchedTime / duration) * 100 : 0;
            if (!isComplete && watchedPercent < 95) {
                leftEarlyRef.current = true;
                // Try to send event before page unloads (may not always work)
                if (userEmail) {
                    sendEvent("SESSION_END", "Page unloaded before video completion");
                }
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isComplete, userEmail, sendEvent, duration, maxWatchedTime]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    // Handle countdown timer
    useEffect(() => {
        if (redirectCountdown === null || redirectCountdown <= 0) {
            if (redirectCountdown === 0) {
                // Countdown reached 0, redirect
                router.push("/user");
            }
            return;
        }

        const timer = setTimeout(() => {
            setRedirectCountdown(redirectCountdown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [redirectCountdown, router]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ background: "#000" }}>
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh"
                sx={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", color: "#fff" }}>
                <Typography variant="h5" mb={2}>{error}</Typography>
                <Button variant="contained" onClick={() => router.push("/user")}
                    sx={{ background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)" }}>
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box ref={containerRef} sx={{ height: "100vh", width: "100vw", background: "#000", position: "relative", overflow: "hidden" }}>
            {/* Video element - Meta Quest handles VR presentation and hand tracking when fullscreen */}
            <video
                ref={videoRef}
                src={videoUrl}
                controls
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

            {/* Warnings overlay */}
            {warnings.length > 0 && (
                <Box sx={{ position: "absolute", top: 70, left: 16, right: 16, zIndex: 30 }}>
                    {warnings.map((w, i) => (
                        <Alert key={i} severity="warning" icon={<WarningIcon />} sx={{ mb: 1 }}>{w.message}</Alert>
                    ))}
                </Box>
            )}

            {/* Complete badge */}
            {isComplete && (
                <Box sx={{ 
                    position: "absolute", top: 70, right: 16, zIndex: 30, 
                    display: "flex", alignItems: "center", gap: 1, 
                    bgcolor: "rgba(0, 200, 83, 0.95)", color: "#fff", 
                    px: 2, py: 1, borderRadius: 2 
                }}>
                    <CheckCircleIcon /><Typography fontWeight={600}>Session Complete!</Typography>
                </Box>
            )}

            {/* Redirect countdown overlay */}
            {redirectCountdown !== null && redirectCountdown > 0 && (
                <Box sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "rgba(0, 0, 0, 0.9)",
                    zIndex: 1000,
                    gap: 2,
                }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: "#4caf50" }} />
                    <Typography variant="h4" sx={{ color: "#fff", fontWeight: 600 }}>
                        Session Complete!
                    </Typography>
                    <Typography variant="h5" sx={{ color: "#00d4ff", fontWeight: 700 }}>
                        Redirecting back in {redirectCountdown}...
                    </Typography>
                </Box>
            )}

            {/* Header */}
            <Box sx={{ 
                position: "absolute", top: 0, left: 0, right: 0, p: 2, 
                display: "flex", justifyContent: "space-between", alignItems: "center", 
                background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)", 
                zIndex: 20,
                pointerEvents: isFullscreen ? "none" : "auto"
            }}>
                <IconButton onClick={() => router.push("/user")} sx={{ color: "#fff" }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                        {videoTitle || "VR Session"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {Math.round(progress)}% watched {isQuestBrowser && "• Quest Browser"}
                        {isFullscreen && " • 🥽 VR Mode"}
                    </Typography>
                </Box>
                <Box width={48} />
            </Box>

            {/* VR Launch Button - shown when video is ready but not playing */}
            {videoReady && !isPlaying && !isFullscreen && (
                <Box sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 25,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={enterFullscreen}
                        startIcon={isQuestBrowser ? <FullscreenIcon /> : <PlayArrowIcon />}
                        sx={{
                            px: 5,
                            py: 2,
                            borderRadius: 4,
                            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
                            boxShadow: "0 8px 32px rgba(0, 212, 255, 0.5)",
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            textTransform: "none",
                            "&:hover": {
                                background: "linear-gradient(135deg, #00b4d8 0%, #0088b8 100%)",
                                transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        {isQuestBrowser ? "🥽 Start VR Experience" : "▶ Play Video"}
                    </Button>
                    
                    {isQuestBrowser && (
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", textAlign: "center", maxWidth: 300 }}>
                            Video will open in Meta&apos;s immersive VR cinema mode.
                            <br />
                            <strong>Use Quest hand gestures</strong> to control playback:
                            <br />
                            👆 Pinch to play/pause • Point to seek • Look at exit button to leave
                        </Typography>
                    )}
                </Box>
            )}

            {/* Bottom controls - only show when not fullscreen */}
            {!isFullscreen && (
                <Box sx={{ 
                    position: "absolute", bottom: 0, left: 0, right: 0, p: 2,
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                    zIndex: 20,
                }}>
                    {/* Progress bar */}
                    <Box sx={{ mb: 1 }}>
                        <Box sx={{ 
                            height: 4, 
                            bgcolor: "rgba(255,255,255,0.2)", 
                            borderRadius: 2, 
                            overflow: "hidden" 
                        }}>
                            <Box sx={{ 
                                height: "100%", 
                                width: `${progress}%`, 
                                bgcolor: "#00d4ff", 
                                borderRadius: 2,
                                transition: "width 0.3s ease"
                            }} />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={0.5}>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                {formatTime(currentTime)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                {formatTime(duration)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Fullscreen button */}
                    {isPlaying && (
                        <Box display="flex" justifyContent="center">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={enterFullscreen}
                                startIcon={<FullscreenIcon />}
                                sx={{
                                    borderColor: "rgba(255,255,255,0.5)",
                                    color: "#fff",
                                    "&:hover": {
                                        borderColor: "#00d4ff",
                                        bgcolor: "rgba(0, 212, 255, 0.1)",
                                    },
                                }}
                            >
                                {isQuestBrowser ? "Enter VR Mode" : "Fullscreen"}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default function VRVideoPlayer() {
    return (
        <Suspense fallback={
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ background: "#000" }}>
                <CircularProgress sx={{ color: "#00d4ff" }} />
            </Box>
        }>
            <VRVideoPlayerContent />
        </Suspense>
    );
}
