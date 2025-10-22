"use client";
import Layout from "@/components/Layout";
import { useState } from "react";
import { Button, TextField, Chip } from "@mui/material";
import { SaveAlt } from "@mui/icons-material";

export default function Users() {
  // Demo user data
  const [users] = useState([
    { id: 1, name: "Emma Wilson", email: "emma.wilson@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Liam Johnson", email: "liam.j@example.com", role: "User", status: "Pending" },
    { id: 3, name: "Olivia Brown", email: "olivia.brown@example.com", role: "Editor", status: "Active" },
    { id: 4, name: "Noah Davis", email: "noah.d@example.com", role: "User", status: "Inactive" },
  ]);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csv = [
      ["Name", "Email", "Role", "Status"],
      ...filtered.map((u) => [u.name, u.email, u.role, u.status]),
    ]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <TextField
          label="Search users"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/3 bg-white"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveAlt />}
          onClick={exportCSV}
        >
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-gray-700">{u.role}</td>
                  <td className="px-6 py-4">
                    <Chip
                      label={u.status}
                      color={
                        u.status === "Active"
                          ? "success"
                          : u.status === "Pending"
                          ? "warning"
                          : "default"
                      }
                      size="small"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
