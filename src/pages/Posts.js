import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  Search,
  Plus,
  Briefcase,
  CheckCircle,
  Clock,
  X, // Add this import
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import JobApplicationModal from "../components/JobApplicationModal";
import { formatDate } from "../utils/helpers";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [availableTags, setAvailableTags] = useState([]);
  const [likeLoading, setLikeLoading] = useState(new Set()); // Add this missing state
  const [selectedJobPost, setSelectedJobPost] = useState(null); // Add this missing state
  const [showApplicationModal, setShowApplicationModal] = useState(false); // Add this missing state
  const [userApplications, setUserApplications] = useState(new Map());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadPosts();
    if (isAuthenticated) {
      loadUserApplications(); // Add this call
    }
  }, [isAuthenticated]); // Add isAuthenticated dependency

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts");
      setPosts(response.data.posts || []);
      console.log(response.data);

      // Extract unique tags
      const tags = new Set();
      response.data.posts?.forEach((post) => {
        post.tags?.forEach((tag) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add this missing function
  const loadUserApplications = async () => {
    try {
      const response = await api.get("/job-applications/my-applications");
      const applicationsMap = new Map();

      response.data.applications?.forEach((app) => {
        applicationsMap.set(app.post.id, app);
      });

      setUserApplications(applicationsMap);
    } catch (error) {
      console.error("Error loading user applications:", error);
    }
  };

  // Add this missing function
  const handleApplyClick = (post) => {
    setSelectedJobPost(post);
    setShowApplicationModal(true);
  };

  const handleApplicationSubmitted = (application) => {
    // Update user applications map
    setUserApplications(
      (prev) => new Map(prev.set(selectedJobPost.id, application))
    );

    // Show success message or update UI as needed
    alert("Application submitted successfully!");
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated || likeLoading.has(postId)) return;

    try {
      // Add to loading set
      setLikeLoading((prev) => new Set([...prev, postId]));

      const response = await api.post(`/posts/${postId}/like`);

      // Update post state based on server response
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: response.data.likesCount,
                isLikedByCurrentUser: response.data.isLiked,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);

      // Show error message to user
      if (error.response?.status === 409) {
        alert("You have already liked this post");
      } else {
        alert("Failed to like post. Please try again.");
      }
    } finally {
      // Remove from loading set
      setLikeLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // Helper function to get image URL
  const getImageUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `http://localhost:5000${url}`;
  };

  // Filter posts based on search and tag
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === "all" || post.tags?.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <LoadingSpinner text="Loading posts..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Photography
            </h1>
            <p className="text-gray-600">
              Explore portfolios from talented photographers worldwide
            </p>
          </div>

          {isAuthenticated && (
            <Link
              to="/dashboard/create-post"
              className="btn btn-primary mt-4 md:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Your Work
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="form-input pl-10 pr-8 min-w-40"
              >
                <option value="all">All Categories</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                isAuthenticated={isAuthenticated}
                getImageUrl={getImageUrl}
                isLikeLoading={likeLoading.has(post.id)}
                currentUserId={user?.id}
                onApplyClick={handleApplyClick}
                userApplication={userApplications.get(post.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || filterTag !== "all"
                ? "No posts found"
                : "No posts yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterTag !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Be the first to share amazing photography!"}
            </p>
            {isAuthenticated && (
              <Link to="/dashboard/create-post" className="btn btn-primary">
                Create Your First Post
              </Link>
            )}
          </div>
        )}

        {/* Job Application Modal */}
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          post={selectedJobPost}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      </div>
    </div>
  );
};

const PostCard = ({
  post,
  onLike,
  isAuthenticated,
  getImageUrl,
  isLikeLoading,
  currentUserId,
  onApplyClick,
  userApplication,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const cardRef = useRef(null);

  const minSwipeDistance = 50;
  const hasMultiplePhotos = post.photos && post.photos.length > 1;

  // Check if current user has liked this post
  const isLikedByCurrentUser =
    post.isLikedByCurrentUser ||
    (post.likes && post.likes.some((like) => like.userId === currentUserId));
  console.log(isLikedByCurrentUser);
  console.log("first");
  // Reset loading state when photo changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentPhotoIndex]);

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPhotoIndex < post.photos.length - 1) {
      setCurrentPhotoIndex((prev) => prev + 1);
    }
    if (isRightSwipe && currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1);
    }
  };

  const goToPrevPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1);
    }
  };

  const goToNextPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPhotoIndex < post.photos.length - 1) {
      setCurrentPhotoIndex((prev) => prev + 1);
    }
  };

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onLike(post.id);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    setImageLoading(false);
    e.target.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMjUwTDE2MCAyMDBIMjQwTDIwMCAyNTBaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjE4MCIgcj0iMTAiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==";
  };

  const getApplicationStatus = () => {
    if (!userApplication) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        text: "Application Pending",
      },
      reviewed: {
        icon: CheckCircle,
        color: "text-blue-600",
        bg: "bg-blue-100",
        text: "Under Review",
      },
      accepted: {
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-100",
        text: "Application Accepted",
      },
      rejected: {
        icon: X,
        color: "text-red-600",
        bg: "bg-red-100",
        text: "Application Rejected",
      },
      withdrawn: {
        icon: X,
        color: "text-gray-600",
        bg: "bg-gray-100",
        text: "Application Withdrawn",
      },
    };

    return statusConfig[userApplication.status] || statusConfig.pending;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {/* User Info Header - Fixed Height */}
      <div className="p-4 pb-2 h-20 flex items-center">
        <Link
          to={`/profile/${post.user?.id}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity w-full"
        >
          {post.user?.profilePhoto ? (
            <img
              src={getImageUrl(post.user.profilePhoto)}
              alt={post.user.firstName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {post.user?.firstName?.[0] || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {post.user?.firstName} {post.user?.lastName}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </Link>
      </div>

      {/* Photo Gallery - Fixed Aspect Ratio Container */}
      <Link to={`/posts/${post.id}`} className="block">
        <div
          className="relative w-full bg-gray-100 overflow-hidden"
          style={{
            aspectRatio: "1/1",
            minHeight: "250px",
          }}
          ref={cardRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Loading State */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 mx-auto"></div>
                <div className="text-xs text-gray-500">Loading...</div>
              </div>
            </div>
          )}

          {post.photos && post.photos.length > 0 ? (
            <>
              {/* Image Container - Maintains dimensions */}
              <div className="absolute inset-0">
                <img
                  src={getImageUrl(post.photos[currentPhotoIndex].url)}
                  alt={post.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  style={{
                    opacity: imageLoading ? 0 : 1,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>

              {/* Navigation arrows */}
              {hasMultiplePhotos && (
                <>
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={goToPrevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 sm:opacity-70 transition-opacity duration-200 hover:bg-opacity-70 z-20"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  {currentPhotoIndex < post.photos.length - 1 && (
                    <button
                      onClick={goToNextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 sm:opacity-70 transition-opacity duration-200 hover:bg-opacity-70 z-20"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}

                  {/* Photo indicator dots */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-20">
                    {post.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentPhotoIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentPhotoIndex
                            ? "bg-white"
                            : "bg-white bg-opacity-50 hover:bg-opacity-75"
                        }`}
                        aria-label={`Go to photo ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Photo counter */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium z-20">
                    {currentPhotoIndex + 1}/{post.photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-500 text-sm">No image</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Post Content - Fixed Height Container */}
      <div className="p-4 min-h-32">
        {/* Actions Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLikeClick}
              disabled={!isAuthenticated || isLikeLoading}
              className={`flex items-center space-x-1 transition-colors disabled:cursor-not-allowed ${
                isLikedByCurrentUser
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500"
              } ${isLikeLoading ? "opacity-50" : ""}`}
              title={
                isLikedByCurrentUser ? "Unlike this post" : "Like this post"
              }
            >
              <Heart
                className={`h-5 w-5 ${
                  isLikedByCurrentUser ? "fill-current" : ""
                }`}
              />
              <span className="text-sm font-medium">
                {post.likesCount || 0}
              </span>
              {isLikeLoading && (
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-red-500 ml-1"></div>
              )}
            </button>

            <Link
              to={`/posts/${post.id}`}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {post.commentsCount || 0}
              </span>
            </Link>
          </div>

          <button className="text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Post Title - Fixed Height */}
        <Link to={`/posts/${post.id}`}>
          <h2 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2 min-h-12">
            {post.title}
          </h2>
        </Link>

        {/* Post Description - Fixed Height */}
        {post.description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2 min-h-10">
            {post.description}
          </p>
        )}

        {/* Job Post Special Section */}
        {post.isJobPost && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Job Opportunity
                </span>
              </div>
              {post.budget && (
                <span className="text-sm font-semibold text-green-700">
                  ${post.budget}
                </span>
              )}
            </div>

            {post.jobType && (
              <p className="text-xs text-green-700 mb-2">
                Type: {post.jobType}
              </p>
            )}

            {post.eventDate && (
              <p className="text-xs text-green-700 mb-2">
                Date: {formatDate(post.eventDate)}
              </p>
            )}

            {/* Application Status or Apply Button */}
            {isAuthenticated && currentUserId !== post.user?.id && (
              <div className="mt-3">
                {userApplication ? (
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const status = getApplicationStatus();
                      const Icon = status.icon;
                      return (
                        <div
                          className={`flex items-center space-x-2 px-3 py-2 rounded-full ${status.bg}`}
                        >
                          <Icon className={`h-4 w-4 ${status.color}`} />
                          <span
                            className={`text-sm font-medium ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onApplyClick(post);
                    }}
                    className="w-full btn btn-primary text-sm py-2"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Apply Now
                  </button>
                )}
              </div>
            )}

            {/* Show for job poster */}
            {isAuthenticated && currentUserId === post.user?.id && (
              <div className="mt-3">
                <Link
                  to={`/dashboard/job-applications/${post.id}`}
                  className="w-full btn btn-secondary text-sm py-2 text-center block"
                >
                  View Applications ({post.applicationsCount || 0})
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tags - Fixed Height Container */}
        <div className="min-h-6">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-gray-500 py-1">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;
