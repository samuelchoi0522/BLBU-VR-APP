"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users straight to the dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleMetaLogin = () => {
    signIn("facebook", { callbackUrl: "/" });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Sign in using your Meta (Facebook) account
        </p>

        <Button
          fullWidth
          variant="contained"
          startIcon={<FacebookIcon />}
          onClick={handleMetaLogin}
          sx={{
            backgroundColor: "#1877F2",
            "&:hover": { backgroundColor: "#145dbf" },
            paddingY: "0.8rem",
            fontSize: "1rem",
            textTransform: "none",
          }}
        >
          Continue with Facebook
        </Button>
      </div>
    </div>
  );
}
