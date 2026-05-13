import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import ElectionDetail from "./pages/ElectionDetail";
import SignupPage from "./pages/SignupPage";
import PricingPage from "./pages/PricingPage";
import ProfilePage from "./pages/ProfilePage";
import MyVotesPage from "./pages/MyVotesPage";
import AdminDashboard from "./pages/AdminDashboard";
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/election/:id" element={<ElectionDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-votes" element={<MyVotesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
