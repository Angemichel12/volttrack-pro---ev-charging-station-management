import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routers/AppRoute";

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRouter />
      <ToastContainer aria-label="Notification container"/>
    </AuthProvider>
  </BrowserRouter>
);

export default App;