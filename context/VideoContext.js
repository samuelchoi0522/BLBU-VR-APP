"use client";
import { createContext, useState, useContext, useEffect } from "react";

const VideoContext = createContext();

export function VideoProvider({ children }) {
  const [videos, setVideos] = useState(() => {
    // optional: persist between refreshes
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("videos");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("videos", JSON.stringify(videos));
  }, [videos]);

  const addVideo = (file) => {
    const newVideo = {
      id: Date.now(),
      name: file.name,
      title: file.name.replace(/\.[^/.]+$/, ""), // default title
      url: URL.createObjectURL(file),            // local preview
      status: "Published",
      visibility: "Public",
      createdAt: new Date().toISOString(),
    };
    setVideos((prev) => [newVideo, ...prev]);
  };

  const updateVideo = (id, patch) => {
    setVideos((prev) => prev.map(v => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVideo = (id) => {
    setVideos((prev) => {
      const target = prev.find(v => v.id === id);
      if (target?.url) URL.revokeObjectURL(target.url); // free memory
      return prev.filter(v => v.id !== id);
    });
  };

  return (
    <VideoContext.Provider value={{ videos, addVideo, updateVideo, removeVideo }}>
      {children}
    </VideoContext.Provider>
  );
}

export const useVideos = () => useContext(VideoContext);
