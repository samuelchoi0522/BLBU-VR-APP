"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, LinearProgress, Alert, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/**
 * Controlled Video Player that:
 * - Prevents skipping ahead
 * - Tracks all user interactions
 * - Detects tab visibility changes
 * - Only marks complete when fully watched
 */
export default function ControlledVideoPlayer({
    videoUrl,
    videoId,
    videoTitle,
    email,
    onComplete,
    apiBaseUrl,
}) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [maxWatchedTime, setMaxWatchedTime] = useState(0);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [warnings, setWarnings] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const [videoError, setVideoError] = useState(null);
    const [videoReady, setVideoReady] = useState(false);
    const lastReportedTime = useRef(0);
    const progressInterval = useRef(null);

    // Send event to backend
    const sendEvent = useCallback(async (eventType, details = null, videoTime = null) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${apiBaseUrl}/api/video-watch/event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email,
                    sessionId,
                    videoId,
                    eventType,
                    videoTime: videoTime ?? videoRef.current?.currentTime,
                    videoDuration: duration || videoRef.current?.duration,
                    details,
                }),
            });
        } catch (err) {
            console.error("Failed to send event:", err);
        }
    }, [apiBaseUrl, email, sessionId, videoId, duration]);

    // Add warning message
    const addWarning = useCallback((message) => {
        setWarnings((prev) => [...prev, { message, time: Date.now() }]);
        setTimeout(() => {
            setWarnings((prev) => prev.filter((w) => Date.now() - w.time < 5000));
        }, 5000);
    }, []);

    // Session start
    useEffect(() => {
        console.log("[Video] Component mounted with URL:", videoUrl);
        console.log("[Video] Video ID:", videoId, "Title:", videoTitle);
        sendEvent("SESSION_START", `Started watching: ${videoTitle}`);
        
        return () => {
            sendEvent("SESSION_END", "Left the page");
        };
    }, [sendEvent, videoTitle, videoUrl, videoId]);

    // Tab visibility detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden;
            setIsTabVisible(visible);
            
            if (!visible) {
                sendEvent("TAB_HIDDEN", "User switched to another tab");
                addWarning("Please stay on this tab while watching");
                // Pause video when tab is hidden
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
            } else {
                sendEvent("TAB_VISIBLE", "User returned to tab");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [sendEvent, addWarning]);

    // Progress reporting (every 10 seconds)
    useEffect(() => {
        progressInterval.current = setInterval(() => {
            if (videoRef.current && isPlaying && currentTime - lastReportedTime.current >= 10) {
                sendEvent("PROGRESS_UPDATE", `Progress: ${Math.round((currentTime / duration) * 100)}%`);
                lastReportedTime.current = currentTime;
            }
        }, 10000);

        return () => clearInterval(progressInterval.current);
    }, [isPlaying, currentTime, duration, sendEvent]);

    // Handle video metadata loaded
    const handleLoadedMetadata = () => {
        console.log("[Video] Metadata loaded, duration:", videoRef.current.duration);
        setDuration(videoRef.current.duration);
    };

    // Handle video can play
    const handleCanPlay = () => {
        console.log("[Video] Can play - video is ready");
        setVideoReady(true);
    };

    // Handle video error
    const handleVideoError = (e) => {
        const video = videoRef.current;
        let errorMessage = "Unknown video error";
        
        if (video?.error) {
            switch (video.error.code) {
                case 1:
                    errorMessage = "Video loading aborted";
                    break;
                case 2:
                    errorMessage = "Network error while loading video";
                    break;
                case 3:
                    errorMessage = "Video decoding error - format may not be supported";
                    break;
                case 4:
                    errorMessage = "Video not supported or source not found";
                    break;
                default:
                    errorMessage = `Video error code: ${video.error.code}`;
            }
            console.error("[Video] Error:", video.error.code, video.error.message);
        }
        
        console.error("[Video] Error event:", e);
        setVideoError(errorMessage);
    };

    // Handle video stall/waiting
    const handleWaiting = () => {
        console.log("[Video] Waiting/buffering...");
    };

    // Handle video loaded data
    const handleLoadedData = () => {
        console.log("[Video] Data loaded - first frame available");
        console.log("[Video] Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
    };

    // Handle time update
    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = video.currentTime;
        setCurrentTime(newTime);

        // Update max watched time (only if moving forward naturally)
        if (newTime > maxWatchedTime && newTime - maxWatchedTime < 2) {
            setMaxWatchedTime(newTime);
        }
    };

    // Handle seek attempts
    const handleSeeking = () => {
        const video = videoRef.current;
        if (!video) return;

        const seekTime = video.currentTime;
        
        // Allow seeking backwards or to already-watched positions
        if (seekTime > maxWatchedTime + 1) {
            // Block the seek - return to max watched position
            video.currentTime = maxWatchedTime;
            addWarning("You cannot skip ahead. Please watch the entire video.");
            sendEvent("SEEK_ATTEMPT", `Attempted to skip from ${maxWatchedTime.toFixed(1)}s to ${seekTime.toFixed(1)}s`, maxWatchedTime);
        }
    };

    // Handle play
    const handlePlay = () => {
        setIsPlaying(true);
        sendEvent("PLAY", "Video started playing");
    };

    // Handle pause
    const handlePause = () => {
        if (!isComplete) {
            setIsPlaying(false);
            sendEvent("PAUSE", `Paused at ${currentTime.toFixed(1)}s`);
        }
    };

    // Handle video end
    const handleEnded = () => {
        // Check if truly watched (at least 95% of max possible)
        const watchedPercent = (maxWatchedTime / duration) * 100;
        
        if (watchedPercent >= 95) {
            setIsComplete(true);
            sendEvent("VIDEO_COMPLETE", `Completed! Watched ${watchedPercent.toFixed(1)}% of video`);
            if (onComplete) {
                onComplete();
            }
        } else {
            addWarning(`You've only watched ${watchedPercent.toFixed(1)}% of the video. Please watch the entire video.`);
            sendEvent("VIOLATION", `Attempted completion with only ${watchedPercent.toFixed(1)}% watched`);
        }
    };

    // Toggle play/pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    // Toggle mute
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const maxProgress = duration > 0 ? (maxWatchedTime / duration) * 100 : 0;

    return (
        <Box
            sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "#000",
            }}
        >
            {/* Warnings */}
            {warnings.length > 0 && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        right: 16,
                        zIndex: 20,
                    }}
                >
                    {warnings.map((w, i) => (
                        <Alert
                            key={i}
                            severity="warning"
                            icon={<WarningIcon />}
                            sx={{ mb: 1, bgcolor: "rgba(255, 152, 0, 0.95)" }}
                        >
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
                        top: 16,
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
                    <Typography fontWeight={600}>Complete!</Typography>
                </Box>
            )}

            {/* Tab warning overlay */}
            {!isTabVisible && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(0,0,0,0.9)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 30,
                        color: "#fff",
                    }}
                >
                    <WarningIcon sx={{ fontSize: 64, color: "#ff9800", mb: 2 }} />
                    <Typography variant="h5" fontWeight={600}>
                        Please return to this tab
                    </Typography>
                    <Typography sx={{ opacity: 0.7 }}>
                        Video paused - stay focused on your therapy session
                    </Typography>
                </Box>
            )}

            {/* Video error display */}
            {videoError && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 25,
                        bgcolor: "rgba(244, 67, 54, 0.95)",
                        color: "#fff",
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        textAlign: "center",
                    }}
                >
                    <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Video Error</Typography>
                    <Typography variant="body2">{videoError}</Typography>
                </Box>
            )}

            {/* Loading indicator */}
            {!videoReady && !videoError && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 25,
                        color: "#fff",
                        textAlign: "center",
                    }}
                >
                    <Typography variant="body1">Loading video...</Typography>
                </Box>
            )}

            {/* Video element */}
            <video
                ref={videoRef}
                src={videoUrl}
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
                onLoadedData={handleLoadedData}
                onCanPlay={handleCanPlay}
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleVideoError}
                onWaiting={handleWaiting}
                style={{
                    width: "100%",
                    display: "block",
                    maxHeight: "70vh",
                }}
                playsInline
            />

            {/* Custom controls */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    p: 2,
                }}
            >
                {/* Progress bar - shows max watched position */}
                <Box sx={{ position: "relative", mb: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={maxProgress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.2)",
                            "& .MuiLinearProgress-bar": {
                                bgcolor: "rgba(0, 212, 255, 0.5)",
                                borderRadius: 3,
                            },
                        }}
                    />
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bgcolor: "transparent",
                            "& .MuiLinearProgress-bar": {
                                bgcolor: "#00d4ff",
                                borderRadius: 3,
                            },
                        }}
                    />
                </Box>

                {/* Controls row */}
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton onClick={togglePlay} sx={{ color: "#fff" }}>
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <IconButton onClick={toggleMute} sx={{ color: "#fff" }}>
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                        <Typography variant="body2" sx={{ color: "#fff", ml: 1 }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                    </Box>

                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {Math.round(maxProgress)}% watched
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
