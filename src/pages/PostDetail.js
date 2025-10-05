import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Send,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const photoContainerRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    loadPost();
  }, [id]);

  // Reset image states when photo changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [currentPhotoIndex]);

  const loadPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      console.log("Post data:", response.data.post);
      console.log("Photos:", response.data.post.photos);
      setPost(response.data.post);
      setComments(response.data.post.comments || []);
      setCurrentPhotoIndex(0); // Reset to first photo
    } catch (error) {
      console.error("Error loading post:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (url) => {
    if (!url) {
      console.log("No URL provided");
      return "";
    }

    const fullUrl = url.startsWith("http")
      ? url
      : `http://localhost:5000${url}`;
    console.log("Image URL:", fullUrl);
    return fullUrl;
  };

  // Photo navigation functions
  const goToPrevPhoto = () => {
    console.log("Going to previous photo, current index:", currentPhotoIndex);
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => {
        console.log("New index:", prev - 1);
        return prev - 1;
      });
    }
  };

  const goToNextPhoto = () => {
    console.log(
      "Going to next photo, current index:",
      currentPhotoIndex,
      "total photos:",
      post?.photos?.length
    );
    if (post?.photos && currentPhotoIndex < post.photos.length - 1) {
      setCurrentPhotoIndex((prev) => {
        console.log("New index:", prev + 1);
        return prev + 1;
      });
    }
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    console.log("Touch start:", e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    console.log(
      "Swipe distance:",
      distance,
      "Left swipe:",
      isLeftSwipe,
      "Right swipe:",
      isRightSwipe
    );

    if (
      isLeftSwipe &&
      post?.photos &&
      currentPhotoIndex < post.photos.length - 1
    ) {
      console.log("Swiping to next photo");
      goToNextPhoto();
    }
    if (isRightSwipe && currentPhotoIndex > 0) {
      console.log("Swiping to previous photo");
      goToPrevPhoto();
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    console.log("Image loaded successfully");
    setImageLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = (e) => {
    console.error("Image failed to load:", e.target.src);
    setImageLoading(false);
    setImageError(true);
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      const likeRes = await api.post(`/posts/${post.id}/like`);
      setPost((prev) => ({
        ...prev,
        isLikedByCurrentUser: likeRes.data.liked,
        likesCount:
          likeRes.data.liked === true
            ? prev.likesCount + 1
            : prev.likesCount - 1,
      }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || submittingComment) return;

    try {
      setSubmittingComment(true);
      const response = await api.post(`/posts/${post.id}/comments`, {
        content: newComment.trim(),
      });

      setComments((prev) => [response.data.comment, ...prev]);
      setPost((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1,
      }));
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Post not found
          </h2>
          <p className="text-gray-600 mb-4">
            The post you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/posts")}
            className="btn btn-primary"
          >
            Browse Posts
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = post.photos?.[currentPhotoIndex];
  const hasPhotos = post.photos && post.photos.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Photo Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Debug Info */}
              {/* <div className="p-2 bg-gray-100 text-xs text-gray-600">
                Photos: {post.photos?.length || 0} | Current:{" "}
                {currentPhotoIndex + 1}
                {currentPhoto && <div>Current URL: {currentPhoto.url}</div>}
              </div> */}

              {/* Main Photo */}
              {hasPhotos ? (
                <div
                  className="relative bg-gray-100"
                  style={{ minHeight: "400px" }}
                  ref={photoContainerRef}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  {/* Loading State */}
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <LoadingSpinner text="Loading image..." />
                    </div>
                  )}

                  {/* Error State */}
                  {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-gray-500">Failed to load image</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getImageUrl(currentPhoto?.url)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Image */}
                  {currentPhoto && (
                    <img
                      src={getImageUrl(currentPhoto.url)}
                      alt={`${post.title} - Photo ${currentPhotoIndex + 1}`}
                      className={`w-full h-96 lg:h-[600px] object-contain transition-opacity duration-300 ${
                        imageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: imageError ? "none" : "block" }}
                    />
                  )}

                  {post.photos.length > 1 && (
                    <>
                      {/* Navigation Arrows */}
                      <button
                        onClick={goToPrevPhoto}
                        disabled={currentPhotoIndex === 0}
                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10 ${
                          currentPhotoIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>

                      <button
                        onClick={goToNextPhoto}
                        disabled={currentPhotoIndex >= post.photos.length - 1}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10 ${
                          currentPhotoIndex >= post.photos.length - 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Photo Counter */}
                      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                        {currentPhotoIndex + 1} / {post.photos.length}
                      </div>

                      {/* Photo Indicators (dots) */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {post.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              console.log("Clicking dot for index:", index);
                              setCurrentPhotoIndex(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              index === currentPhotoIndex
                                ? "bg-white"
                                : "bg-white bg-opacity-50 hover:bg-opacity-75"
                            }`}
                            aria-label={`Go to photo ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* Swipe instruction for mobile */}
                      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded md:hidden z-10">
                        Swipe to see more photos
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500">No photos available</p>
                  </div>
                </div>
              )}

              {/* Photo Thumbnails */}
              {post.photos && post.photos.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                    {post.photos.map((photo, index) => (
                      <button
                        key={photo.id || index}
                        onClick={() => {
                          console.log("Clicking thumbnail for index:", index);
                          setCurrentPhotoIndex(index);
                        }}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentPhotoIndex
                            ? "border-primary-500 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={getImageUrl(photo.url)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA1MEwyOCA0MEg1Mkw0MCA1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iMzUiIGN5PSIzMCIgcj0iMyIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post Details - Keep the rest of your existing code */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                <Link
                  to={`/profile/${post.user.id}`}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  {post.user.profilePhoto ? (
                    <img
                      src={getImageUrl(post.user.profilePhoto)}
                      alt={post.user.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {post.user.firstName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {post.user.firstName} {post.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </Link>

                <div className="ml-auto">
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h1>

                {post.description && (
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                    {post.description}
                  </p>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium hover:bg-primary-200 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Location */}
                {post.location && (
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <span className="mr-1">📍</span>
                    {post.location}
                  </p>
                )}

                {/* Job Post Badge */}
                {post.isJobPost && (
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                      💼 Job Opportunity
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    disabled={!isAuthenticated}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-full hover:bg-gray-100"
                  >
                    {post.isLikedByCurrentUser ? (
                      <Heart fill="red" strokeWidth={0} className="h-5 w-5" />
                    ) : (
                      <Heart className="h-5 w-5" />
                    )}{" "}
                    <span className="text-sm font-medium">
                      {post.likesCount || 0}
                    </span>
                  </button>

                  <div className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {post.commentsCount || 0}
                    </span>
                  </div>

                  <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors p-1 rounded-full hover:bg-gray-100">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section - Keep your existing comments code */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comments ({post.commentsCount || 0})
              </h3>

              {/* Add Comment */}
              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="form-textarea resize-none border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="btn btn-primary btn-sm"
                    >
                      {submittingComment ? (
                        <div className="flex items-center space-x-2">
                          <div className="spinner w-4 h-4" />
                          <span>Posting...</span>
                        </div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Comment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 mb-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-600 mb-2">
                    Sign in to leave a comment
                  </p>
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Sign In
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Link to={`/profile/${comment.user.id}`}>
                        {comment.user.profilePhoto ? (
                          <img
                            src={getImageUrl(comment.user.profilePhoto)}
                            alt={comment.user.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white text-sm">
                              {comment.user.firstName[0]}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                          <Link
                            to={`/profile/${comment.user.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            {comment.user.firstName} {comment.user.lastName}
                          </Link>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-3">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No comments yet</p>
                    <p className="text-sm text-gray-400">
                      Be the first to comment on this post
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
