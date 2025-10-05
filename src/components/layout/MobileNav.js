import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/posts", icon: Search, label: "Browse" },
    { path: "/dashboard/create-post", icon: Plus, label: "Create" },
    { path: "/dashboard/chat", icon: MessageCircle, label: "Chat" },
    { path: "/dashboard/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center p-2 min-w-0 flex-1 ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : ""}`} />
              <span
                className={`text-xs mt-1 ${
                  isActive ? "text-blue-600 font-medium" : ""
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
