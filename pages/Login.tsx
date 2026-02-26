import React, { useState } from "react";
import { Card, Button, Input } from "../components/Shared";
import { useLogin } from "../hooks/useLogin";

export const Login: React.FC = () => {
  const { login, loading } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const quickLogin = (role: "admin" | "manager" | "staff") => {
    const credentials = {
      admin:   { email: "admin@volttrack.com",   password: "admin123" },
      manager: { email: "manager@volttrack.com", password: "manager123" },
      staff:   { email: "staff@volttrack.com",   password: "staff123" },
    };
    login(credentials[role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-600">VoltTrack Pro</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your charging station</p>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full py-3 text-lg font-bold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-4">
              Quick Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "manager", "staff"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLogin(role)}
                  disabled={loading}
                  className="text-[10px] font-bold py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded uppercase transition-colors disabled:opacity-50"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; 2024 VoltTrack Pro Systems
        </p>
      </div>
    </div>
  );
};