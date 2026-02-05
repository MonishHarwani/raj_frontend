import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const { user } = useAuth();

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [commentActionLoading, setCommentActionLoading] = useState(false);

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const submitEditComment = async (commentId) => {
    if (!editedContent.trim()) return;

    try {
      setCommentActionLoading(true);

      const res = await api.put(`/posts/comments/${commentId}`, {
        content: editedContent,
      });

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? res.data.comment : c))
      );

      setEditingCommentId(null);
      setEditedContent("");
    } catch (err) {
      console.error("Edit comment error:", err);
    } finally {
      setCommentActionLoading(false);
    }
  };
  const handleDeleteComment = async (commentId) => {
    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;

    try {
      setCommentActionLoading(true);

      await api.delete(`/posts/comments/${commentId}`);

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      setPost((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount - 1,
      }));
    } catch (err) {
      console.error("Delete comment error:", err);
    } finally {
      setCommentActionLoading(false);
    }
  };

  /* ---------- helpers ---------- */

  const getImageUrl = (url) =>
    url?.startsWith("http") ? url : `http://localhost:5000${url}`;

  const getInitials = (first = "", last = "") =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  /* ---------- load post ---------- */

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.post);
      setComments(res.data.post.comments || []);
    } catch (err) {
      console.error("Get post error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- like ---------- */

  const handleLike = async () => {
    if (!isAuthenticated || isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      const res = await api.post(`/posts/${post.id}/like`);

      setPost((prev) => ({
        ...prev,
        isLikedByCurrentUser: res.data.isLiked,
        likesCount: res.data.likesCount,
      }));
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  /* ---------- comment ---------- */

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);

      const res = await api.post(`/posts/${post.id}/comments`, {
        content: newComment.trim(),
      });

      setComments((prev) => [res.data.comment, ...prev]);
      setPost((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1,
      }));

      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  /* ---------- render ---------- */

  if (loading) return <LoadingSpinner text="Loading post..." />;
  if (!post) return <p className="text-center">Post not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Photos - col 9 */}
          <div className="lg:col-span-9">
            {post.photos && post.photos.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {post.photos.length === 1 ? (
                  <img
                    src={getImageUrl(post.photos[0].url)}
                    alt="Post"
                    className="w-full max-h-[600px] object-contain bg-black"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-1 bg-black">
                    {post.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={getImageUrl(photo.url)}
                        alt="Post"
                        className="w-full h-64 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Details - col 3 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              {/* User Info */}
              <Link
                to={`/profile/${post.user.id}`}
                className="flex items-center space-x-3 mb-4"
              >
                {post.user.profilePhoto ? (
                  <img
                    src={getImageUrl(post.user.profilePhoto)}
                    className="w-12 h-12 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                    {getInitials(post.user.firstName, post.user.lastName)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {post.user.firstName} {post.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </Link>

              {/* Title */}
              <h1 className="text-lg font-bold mb-2">{post.title}</h1>

              {/* Description */}
              {post.description && (
                <p className="text-gray-700 mb-4 text-sm">{post.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-3">
                <button
                  onClick={handleLike}
                  disabled={!isAuthenticated || isLikeLoading}
                  className={`flex items-center space-x-1 ${
                    post.isLikedByCurrentUser
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      post.isLikedByCurrentUser ? "fill-current" : ""
                    }`}
                  />
                  <span>{post.likesCount ?? 0}</span>
                </button>

                <div className="flex items-center space-x-1 text-gray-500">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.commentsCount ?? 0}</span>
                </div>

                <Share2 className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">
            Comments ({post.commentsCount ?? 0})
          </h3>

          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Write a comment..."
                className="w-full border rounded p-2"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="btn btn-primary mt-2"
              >
                <Send className="h-4 w-4 mr-1" /> Comment
              </button>
            </form>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex space-x-3">
                {/* Avatar */}
                {c.user.profilePhoto ? (
                  <img
                    src={getImageUrl(c.user.profilePhoto)}
                    className="w-8 h-8 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(c.user.firstName, c.user.lastName)}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">
                      {c.user.firstName} {c.user.lastName}
                    </p>

                    {/* Edit/Delete only for owner */}
                    {user?.id === c.user.id && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <button
                          onClick={() => handleEditComment(c)}
                          title="Edit comment"
                          className="hover:text-blue-500 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete comment"
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content / Edit mode */}
                  {editingCommentId === c.id ? (
                    <>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full border rounded p-2 text-sm mt-1"
                        rows={2}
                      />
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => submitEditComment(c.id)}
                          disabled={commentActionLoading}
                          className="text-blue-600 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="text-gray-500 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-700 text-sm mt-1">{c.content}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
