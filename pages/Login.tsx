import React, { useState } from "react";
import { Button, Input } from "../components/Shared";
import { useLogin } from "../hooks/useLogin";

export const Login: React.FC = () => {
  const { login, loading } = useLogin();
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ phone_number, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="GreenSpark Charging Rwanda"
            className="h-20 sm:h-24 w-auto object-contain mx-auto"
          />
          <p className="text-gray-500 mt-4 text-sm">Sign in / Injira</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Phone Number / Numero ya Telephone"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone_number}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoFocus
              required
            />
            <Input
              label="Password / Ijambobanga"
              type="password"
              placeholder="Ijambobanga"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? "Tegereza..." : "Sign In / Injira"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} GreenSpark Charging Rwanda Ltd
        </p>
      </div>
    </div>
  );
};
