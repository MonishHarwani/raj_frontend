import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Set token in api headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Load user error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("=== AUTH CONTEXT: Login attempt ===");
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        throw new Error("Invalid response from server");
      }

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      return { success: true };
    } catch (error) {
      console.error("=== AUTH CONTEXT: Login error ===", error);

      let message = "Login failed";
      let type = "unknown_error";

      if (error.response) {
        const errorData = error.response.data;
        message =
          errorData?.message || `Server error: ${error.response.status}`;
        type = errorData?.type || "server_error";
      } else if (error.request) {
        message =
          "Unable to connect to server. Please check your internet connection.";
        type = "network_error";
      } else {
        message = error.message || "An unexpected error occurred";
        type = "client_error";
      }

      return { success: false, error: message, type };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/register", userData);
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      return { success: false, error: message };
    }
  };

  const uploadProfilePhoto = async (file) => {
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await api.post("/users/profile-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUser((prev) => ({
        ...prev,
        profilePhoto: response.data.profilePhoto,
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Photo upload failed";
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePhoto,
    isAuthenticated: !!token && !!user,
    isPhotographer: user?.role === "photographer",
    isHirer: user?.role === "hirer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
