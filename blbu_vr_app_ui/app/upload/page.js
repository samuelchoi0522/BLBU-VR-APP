"use client";
import Layout from "@/components/Layout";
import { useVideos } from "@/context/VideoContext";
import { useState } from "react";
import {
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import { Visibility, Edit, Delete } from "@mui/icons-material";

export default function Upload() {
  const { videos, addVideo, updateVideo, removeVideo } = useVideos();
  const [dragActive, setDragActive] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const openEdit = (video) => {
    setEditingId(video.id);
    setEditingTitle(video.title || video.name);
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateVideo(editingId, { title: editingTitle });
    setEditOpen(false);
  };

  const handleDelete = (video) => {
    const ok = window.confirm(`Delete "${video.title || video.name}"?`);
    if (ok) removeVideo(video.id);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) addVideo(file);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) addVideo(file);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Uploads</h1>

      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
          dragActive ? "border-purple-400 bg-purple-50" : "border-gray-300 bg-white"
        }`}
      >
        <p className="text-gray-600 mb-2 font-medium">Drag and drop video files here</p>
        <p className="text-gray-400 text-sm mb-4">or click below to select</p>
        <Button variant="contained" component="label">
          Select Files
          <input type="file" hidden accept="video/*" onChange={handleUpload} />
        </Button>
      </div>

      {/* Existing Videos */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Existing Videos</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Title</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500">Visibility</th>
              <th className="px-6 py-3 font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length > 0 ? (
              videos.map((video) => (
                <tr key={video.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {video.title || video.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {video.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{video.visibility}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(video.createdAt || video.id).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <IconButton onClick={() => window.open(video.url, "_blank")} title="View">
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => openEdit(video)} title="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(video)} color="error" title="Delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No videos uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Video</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
