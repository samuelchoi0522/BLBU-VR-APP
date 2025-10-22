import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Admin Dashboard",
  description: "Dashboard UI with Sidebar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
