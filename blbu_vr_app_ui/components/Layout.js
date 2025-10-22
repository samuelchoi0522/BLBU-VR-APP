"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CloudUpload, People, BarChart } from "@mui/icons-material";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from "@mui/material";

const drawerWidth = 240;

export default function Layout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { text: "Dashboard", icon: <Home />, href: "/" },
    { text: "Uploads", icon: <CloudUpload />, href: "/upload" },
    { text: "Users", icon: <People />, href: "/users" },
    { text: "Analytics", icon: <BarChart />, href: "/analytics" },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#f9fafb",
          },
        }}
      >
        <Toolbar className="bg-white font-bold text-xl px-4 border-b">Streamline</Toolbar>
        <List className="pt-4">
          {navItems.map((item) => (
            <Link key={item.text} href={item.href} passHref>
              <ListItemButton
                selected={pathname === item.href}
                className={`mx-2 my-1 rounded-lg ${
                  pathname === item.href ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                }`}
              >
                <ListItemIcon
                  className={`${
                    pathname === item.href ? "text-purple-700" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <main
        className="flex-1 p-8 bg-gray-50 min-h-screen flex justify-center"
        style={{ marginLeft: drawerWidth }}
      >
        <div className="w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
