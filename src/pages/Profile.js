import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Camera,
  MapPin,
  Globe,
  Phone,
  Edit,
  MessageCircle,
  Star,
  Calendar,
  Trash2,
  Heart,
  MessageSquare,
  Eye,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";
import { useChat } from "../context/ChatContext";

const Profile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");

  const { startConversation } = useChat();
  const navigate = useNavigate();

  const isOwnProfile = user && parseInt(id || user.id) === user.id;

  useEffect(() => {
    const userId = id || user?.id;
    if (userId) {
      loadProfile(userId);
    }
    // eslint-disable-next-line
  }, [id, user]);

  const loadProfile = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setProfileUser(response.data.user);
      setPosts(response.data.user.posts || []);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const conversation = await startConversation(profileUser.id);
      navigate(`/dashboard/chat/${conversation.id}`);
    } catch (error) {
      alert("Failed to start conversation");
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    )
      return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      alert("Failed to delete post.");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600">
            The user profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0 mb-6 md:mb-0">
              {profileUser.profilePhoto ? (
                <img
                  src={"http://localhost:5000" + profileUser.profilePhoto}
                  alt={profileUser.firstName}
                  className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mx-auto md:mx-0">
                  <span className="text-4xl font-bold text-white">
                    {profileUser.firstName[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                <p className="text-lg text-gray-600 capitalize">
                  {profileUser.role}
                </p>
              </div>

              {profileUser.bio && (
                <p className="text-gray-700 mb-4 max-w-2xl">
                  {profileUser.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-gray-600 mb-6">
                {profileUser.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profileUser.location}</span>
                  </div>
                )}

                {profileUser.website && (
                  <a
                    href={profileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}

                {profileUser.phone && isOwnProfile && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{profileUser.phone}</span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profileUser.createdAt)}</span>
                </div>
              </div>

              {/* Specialties */}
              {profileUser.specialties &&
                profileUser.specialties.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Specialties
                    </h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {profileUser.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3">
                {isOwnProfile ? (
                  <Link
                    to="/dashboard/profile/edit"
                    className="btn btn-primary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                ) : (
                  isAuthenticated &&
                  user &&
                  user.id !== profileUser.id && (
                    <button
                      onClick={handleStartChat}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "portfolio"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Portfolio ({posts.length})
              </button>

              {profileUser.role === "photographer" && (
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "reviews"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Reviews
                </button>
              )}

              <button
                onClick={() => setActiveTab("about")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "about"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                About
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "portfolio" && (
          <PortfolioTab
            posts={posts}
            isOwnProfile={isOwnProfile}
            onDeletePost={handleDeletePost}
          />
        )}

        {activeTab === "reviews" && <ReviewsTab profileUser={profileUser} />}

        {activeTab === "about" && <AboutTab profileUser={profileUser} />}
      </div>
    </div>
  );
};

const PortfolioTab = ({ posts, isOwnProfile, onDeletePost }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {isOwnProfile ? "No posts yet" : "No portfolio items"}
        </h3>
        <p className="text-gray-600 mb-4">
          {isOwnProfile
            ? "Share your first photo to start building your portfolio!"
            : "This user hasn't shared any work yet."}
        </p>
        {isOwnProfile && (
          <Link to="/dashboard/create-post" className="btn btn-primary">
            Create First Post
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative rounded-lg overflow-hidden shadow group bg-white transition hover:shadow-lg"
        >
          {/* Delete Post (only for own profile) */}
          {isOwnProfile && (
            <button
              onClick={() => onDeletePost(post.id)}
              className="absolute top-3 right-3 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-md transition"
              title="Delete Post"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <Link to={`/posts/${post.id}`}>
            {post.photos && post.photos[0] && (
              <img
                src={"http://localhost:5000" + post.photos[0].url}
                alt={post.title}
                className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold mb-1 truncate">{post.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {post.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {post.likesCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {post.commentsCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.viewsCount || 0}
                </span>
              </div>
              <span className="block mt-2 text-xs text-gray-400">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

const ReviewsTab = ({ profileUser }) => (
  <div className="text-center py-12">
    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-medium text-gray-900 mb-2">No reviews yet</h3>
    <p className="text-gray-600">
      Reviews will appear here once clients start rating this photographer's
      work.
    </p>
  </div>
);

const AboutTab = ({ profileUser }) => (
  <div className="max-w-3xl">
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
      {profileUser.bio ? (
        <div>
          <p className="text-gray-700 whitespace-pre-wrap">{profileUser.bio}</p>
        </div>
      ) : (
        <p className="text-gray-500 italic">No bio available.</p>
      )}

      <div className="mt-6 space-y-4">
        {profileUser.location && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Location</h4>
            <p className="text-gray-700">{profileUser.location}</p>
          </div>
        )}

        {profileUser.specialties && profileUser.specialties.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {profileUser.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900 mb-1">Member since</h4>
          <p className="text-gray-700">{formatDate(profileUser.createdAt)}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Profile;
