"use client";
import Layout from "@/components/Layout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@mui/material";

export default function Analytics() {
  // Example data — replace with API or DB later
  const videoData = [
    { month: "Jan", uploads: 5, views: 500 },
    { month: "Feb", uploads: 9, views: 750 },
    { month: "Mar", uploads: 7, views: 1000 },
    { month: "Apr", uploads: 10, views: 1250 },
    { month: "May", uploads: 13, views: 1750 },
    { month: "Jun", uploads: 11, views: 1600 },
  ];

  const userData = [
    { day: "Mon", users: 80 },
    { day: "Tue", users: 120 },
    { day: "Wed", users: 100 },
    { day: "Thu", users: 150 },
    { day: "Fri", users: 130 },
    { day: "Sat", users: 200 },
    { day: "Sun", users: 180 },
  ];

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Analytics Overview</h1>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploads + Views */}
        <Card className="shadow-sm rounded-xl">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Video Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={videoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="uploads" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="shadow-sm rounded-xl">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Weekly Active Users</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
