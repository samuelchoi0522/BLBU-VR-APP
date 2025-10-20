"use client";
import Layout from "@/components/Layout";
import { useVideos } from "@/context/VideoContext";
import { Button, Card, CardContent } from "@mui/material";

export default function Dashboard() {
  const { videos } = useVideos();

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm rounded-xl">
          <CardContent>
            <h2 className="text-gray-600 text-sm mb-1">Total Videos</h2>
            <p className="text-3xl font-bold">{videos.length}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardContent>
            <h2 className="text-gray-600 text-sm mb-1">Active Users</h2>
            <p className="text-3xl font-bold">875</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardContent>
            <h2 className="text-gray-600 text-sm mb-1">New Uploads Today</h2>
            <p className="text-3xl font-bold">15</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          <Button variant="contained" color="primary" href="/upload">
            Upload New Video
          </Button>
          <Button variant="outlined" color="primary" href="/users">
            View User Data
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Video Title</th>
                <th className="px-6 py-3 font-medium text-gray-500">Uploader</th>
                <th className="px-6 py-3 font-medium text-gray-500">Views</th>
                <th className="px-6 py-3 font-medium text-gray-500">Date Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {videos.length > 0 ? (
                videos.map((video) => (
                  <tr
                    key={video.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {video.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">Admin</td>
                    <td className="px-6 py-4 text-gray-600">{Math.floor(Math.random() * 5000)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(video.id).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                    No recent activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
