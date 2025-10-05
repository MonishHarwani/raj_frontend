import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Camera,
  Briefcase,
  MessageSquare,
  FileText,
  Plus,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Settings,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const Dashboard = () => {
  const [stats, setStats] = useState({
    posts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    jobApplications: 0,
    submittedApplications: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's posts
      const postsResponse = await api.get(`/posts?userId=${user.id}&limit=5`);
      const userPosts = postsResponse.data.posts || [];
      // console.log(userPosts);
      setRecentPosts(userPosts);

      // Calculate stats from posts
      const totalLikes = userPosts.reduce(
        (sum, post) => sum + (post.likesCount || 0),
        0
      );
      const totalComments = userPosts.reduce(
        (sum, post) => sum + (post.commentsCount || 0),
        0
      );
      const totalApplications = userPosts.reduce(
        (sum, post) => sum + (post.applicationsCount || 0),
        0
      );

      // Load user's submitted applications
      const applicationsResponse = await api.get(
        "/job-applications/my-applications"
      );
      const userApplications = applicationsResponse.data.applications || [];
      setRecentApplications(userApplications.slice(0, 3));

      setStats({
        posts: userPosts.length,
        totalLikes,
        totalComments,
        totalViews: userPosts.length * 15, // Estimated views
        jobApplications: totalApplications,
        submittedApplications: userApplications.length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your photography business
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Posts"
            value={stats.posts}
            icon={Camera}
            color="bg-blue-500"
            change="+12%"
          />
          <StatCard
            title="Total Likes"
            value={stats.totalLikes}
            icon={Heart}
            color="bg-red-500"
            change="+8%"
          />
          <StatCard
            title="Comments"
            value={stats.totalComments}
            icon={MessageCircle}
            color="bg-green-500"
            change="+15%"
          />
          {/* {user.role === "hirer" && (
            <StatCard
              title="Applications Received"
              value={stats.jobApplications}
              icon={Briefcase}
              color="bg-purple-500"
              change="+23%"
            />
          )} */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/dashboard/create-post"
                  className="flex items-center p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <span className="font-medium">Create New Post</span>
                </Link>

                {user.role === "photographer" && (
                  <Link
                    to="/dashboard/my-applications"
                    className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    <span className="font-medium">
                      My Applications ({stats.submittedApplications})
                    </span>
                  </Link>
                )}
                {user.role === "hirer" && (
                  <Link
                    to="/dashboard/job-applications"
                    className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    <span className="font-medium">
                      Applications Recieved ({stats.jobApplications})
                    </span>
                  </Link>
                )}

                <Link
                  to="/dashboard/profile"
                  className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <User className="h-5 w-5 mr-3" />
                  <span className="font-medium">Edit Profile</span>
                </Link>

                <Link
                  to="/posts"
                  className="flex items-center p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Eye className="h-5 w-5 mr-3" />
                  <span className="font-medium">Browse Job Posts</span>
                </Link>
              </div>
            </div>

            {/* Recent Applications */}
            {recentApplications.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Applications
                  </h3>
                  <Link
                    to="/dashboard/my-applications"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentApplications.map((application) => (
                    <ApplicationItem
                      key={application.id}
                      application={application}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Posts & Applications Received */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Posts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Posts
                </h3>
                <Link
                  to="/posts"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All
                </Link>
              </div>

              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No posts yet</p>
                  <Link to="/dashboard/create-post" className="btn btn-primary">
                    Create Your First Post
                  </Link>
                </div>
              )}
            </div>

            {/* Job Posts with Applications */}
            <JobPostsWithApplications userId={user?.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-1">
            {change} from last month
          </p>
        )}
      </div>
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const PostItem = ({ post }) => (
  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    {post.photos && post.photos.length > 0 ? (
      <img
        src={`http://localhost:5000${post.photos[0].url}`}
        alt={post.title}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />
    ) : (
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <Camera className="h-6 w-6 text-gray-400" />
      </div>
    )}

    <div className="flex-1 min-w-0">
      <Link to={`/posts/${post.id}`}>
        <h4 className="font-medium text-gray-900 truncate hover:text-primary-600">
          {post.title}
        </h4>
      </Link>
      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
        <span className="flex items-center">
          {post.isLikedByCurrentUser ? (
            <Heart fill="red" strokeWidth={0} className="h-5 w-5" />
          ) : (
            <Heart className="h-5 w-5" />
          )}{" "}
          {post.likesCount || 0}
        </span>
        <span className="flex items-center">
          <MessageCircle className="h-3 w-3 mr-1" />
          {post.commentsCount || 0}
        </span>
        {post.isJobPost && (
          <>
            <span className="flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              {post.applicationsCount || 0} applications
            </span>
            {post.applicationsCount > 0 && (
              <Link
                to={`/dashboard/job-applications/${post.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Manage →
              </Link>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {formatDate(post.createdAt)}
        {post.isJobPost && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Job Post
          </span>
        )}
      </p>
    </div>
  </div>
);

const ApplicationItem = ({ application }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      reviewed: "text-blue-600 bg-blue-100",
      accepted: "text-green-600 bg-green-100",
      rejected: "text-red-600 bg-red-100",
      withdrawn: "text-gray-600 bg-gray-100",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
      {application.post?.user?.profilePhoto ? (
        <img
          src={`http://localhost:5000${application.post.user.profilePhoto}`}
          alt="Job poster"
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {application.post?.title}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              application.status
            )}`}
          >
            {application.status}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(application.appliedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

const JobPostsWithApplications = ({ userId }) => {
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobPosts();
  }, [userId]);

  const loadJobPosts = async () => {
    try {
      const response = await api.get(
        `/posts?userId=${userId}&isJobPost=true&limit=5`
      );
      const posts =
        response.data.posts?.filter((post) => post.applicationsCount > 0) || [];
      setJobPosts(posts);
    } catch (error) {
      console.error("Error loading job posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (jobPosts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Job Posts with Applications
        </h3>
        <Link
          to="/posts"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All Jobs
        </Link>
      </div>

      <div className="space-y-4">
        {jobPosts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <Link to={`/posts/${post.id}`}>
                <h4 className="font-medium text-gray-900 hover:text-primary-600">
                  {post.title}
                </h4>
              </Link>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                {post.budget && <span>${post.budget}</span>}
                <span>{post.applicationsCount} applications</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            <Link
              to={`/dashboard/job-applications/${post.id}`}
              className="btn btn-primary text-sm"
            >
              Manage Applications
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
