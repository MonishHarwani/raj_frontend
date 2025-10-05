import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./layout/Layout";
import LoadingSpinner from "./common/LoadingSpinner";

// Lazy load components for better performance
const Home = React.lazy(() => import("../pages/Home"));
const Login = React.lazy(() => import("../pages/Login"));
const Register = React.lazy(() => import("../pages/Register"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const Profile = React.lazy(() => import("../pages/Profile"));
const Posts = React.lazy(() => import("../pages/Posts"));
const PostDetail = React.lazy(() => import("../pages/PostDetail"));
const CreatePost = React.lazy(() => import("../pages/CreatePost"));
const Jobs = React.lazy(() => import("../pages/Jobs"));
const JobDetail = React.lazy(() => import("../pages/JobDetail"));
const CreateJob = React.lazy(() => import("../pages/CreateJob"));
const Applications = React.lazy(() => import("../pages/Applications"));
const Chat = React.lazy(() => import("../pages/Chat"));
const Resumes = React.lazy(() => import("../pages/Resumes"));

// Add job application related components
// const JobApplications = React.lazy(() => import("../pages/JobApplications")); // Job applications management
const MyApplications = React.lazy(() => import("../pages/MyApplications")); // User's submitted applications

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="profile/:id" element={<Profile />} />
        </Route>

        {/* Auth routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
          <Route path="create-job" element={<CreateJob />} />
          <Route path="applications" element={<Applications />} />
          <Route path="resumes" element={<Resumes />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:chatId" element={<Chat />} />

          {/* Job Application Routes */}
          <Route path="job-applications" element={<Applications />} />
          <Route path="job-applications/:postId" element={<Applications />} />
          <Route path="my-applications" element={<MyApplications />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
