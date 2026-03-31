import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import ElectionDetail from "./pages/ElectionDetail";
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/election/:id" element={<ElectionDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<SignupPage />} />;
      </Routes>
    </HashRouter>
  );
}
