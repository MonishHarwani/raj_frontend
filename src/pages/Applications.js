import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Briefcase,
  MapPin,
  Calendar,
  Eye,
  Filter,
  Users,
  SendHorizonal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received"); // 'received' or 'submitted'
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadApplicationsData();
  }, []);

  const loadApplicationsData = async () => {
    try {
      setLoading(true);

      // Load user's submitted applications (photographer view)
      const myApplicationsResponse = await api.get(
        "/job-applications/my-applications"
      );
      const submittedApplications =
        myApplicationsResponse.data.applications || [];

      // Load user's job posts and applications received (hirer view)
      const userPostsResponse = await api.get(
        `/posts?userId=${user.id}&isJobPost=true`
      );
      const userJobPosts = userPostsResponse.data.posts || [];
      setJobPosts(userJobPosts);

      // Load applications for each job post
      const receivedApplications = [];
      for (const post of userJobPosts) {
        try {
          const appResponse = await api.get(`/job-applications/job/${post.id}`);
          const postApplications = (appResponse.data.applications || []).map(
            (app) => ({
              ...app,
              jobPost: post,
            })
          );
          receivedApplications.push(...postApplications);
        } catch (error) {
          console.error(
            `Error loading applications for post ${post.id}:`,
            error
          );
        }
      }

      setApplications({
        submitted: submittedApplications,
        received: receivedApplications,
      });

      // Set default tab based on what user has
      if (receivedApplications.length > 0) {
        setActiveTab("received");
      } else if (submittedApplications.length > 0) {
        setActiveTab("submitted");
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = "") => {
    try {
      setUpdatingStatus((prev) => new Set([...prev, applicationId]));

      await api.patch(`/job-applications/${applicationId}/status`, {
        status,
        notes,
      });

      // Update local state
      setApplications((prev) => ({
        ...prev,
        received: prev.received.map((app) =>
          app.id === applicationId
            ? { ...app, status, notes, reviewedAt: new Date() }
            : app
        ),
      }));
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update application status");
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const withdrawApplication = async (applicationId) => {
    if (
      !window.confirm("Are you sure you want to withdraw this application?")
    ) {
      return;
    }

    try {
      setUpdatingStatus((prev) => new Set([...prev, applicationId]));

      await api.patch(`/job-applications/${applicationId}/withdraw`);

      // Update local state
      setApplications((prev) => ({
        ...prev,
        submitted: prev.submitted.map((app) =>
          app.id === applicationId ? { ...app, status: "withdrawn" } : app
        ),
      }));
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert("Failed to withdraw application");
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      reviewed: { bg: "bg-blue-100", text: "text-blue-800", label: "Reviewed" },
      accepted: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Accepted",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      withdrawn: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Withdrawn",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const currentApplications = applications[activeTab] || [];
  const filteredApplications = currentApplications.filter(
    (app) => statusFilter === "all" || app.status === statusFilter
  );

  if (loading) {
    return <LoadingSpinner text="Loading applications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Applications
          </h1>
          <p className="text-gray-600">
            Manage your job applications and track their status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(applications.submitted || []).length}
                </div>
                <div className="text-sm text-gray-600">Applied Jobs</div>
              </div>
              <SendHorizonal className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(applications.received || []).length}
                </div>
                <div className="text-sm text-gray-600">
                  Applications Received
                </div>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {
                    currentApplications.filter((a) => a.status === "accepted")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    currentApplications.filter((a) => a.status === "pending")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("received")}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === "received"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>
                  Applications Received ({(applications.received || []).length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab("submitted")}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === "submitted"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <SendHorizonal className="h-4 w-4" />
                <span>
                  My Applications ({(applications.submitted || []).length})
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input py-2 px-3 text-sm"
            >
              <option value="all">
                All Applications ({currentApplications.length})
              </option>
              <option value="pending">
                Pending (
                {
                  currentApplications.filter((a) => a.status === "pending")
                    .length
                }
                )
              </option>
              <option value="reviewed">
                Reviewed (
                {
                  currentApplications.filter((a) => a.status === "reviewed")
                    .length
                }
                )
              </option>
              <option value="accepted">
                Accepted (
                {
                  currentApplications.filter((a) => a.status === "accepted")
                    .length
                }
                )
              </option>
              <option value="rejected">
                Rejected (
                {
                  currentApplications.filter((a) => a.status === "rejected")
                    .length
                }
                )
              </option>
              {activeTab === "submitted" && (
                <option value="withdrawn">
                  Withdrawn (
                  {
                    currentApplications.filter((a) => a.status === "withdrawn")
                      .length
                  }
                  )
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">
              {activeTab === "received" ? "📥" : "📤"}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {activeTab === "received"
                ? "No applications received"
                : "No applications submitted"}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === "received"
                ? "Applications for your job posts will appear here."
                : "Start applying for photography jobs to see them here."}
            </p>
            {activeTab === "submitted" && (
              <Link to="/posts" className="btn btn-primary">
                Browse Job Posts
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                isHirer={activeTab === "received"}
                onUpdateStatus={updateApplicationStatus}
                onWithdraw={withdrawApplication}
                isUpdating={updatingStatus.has(application.id)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationCard = ({
  application,
  isHirer,
  onUpdateStatus,
  onWithdraw,
  isUpdating,
  getStatusBadge,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState(application.notes || "");

  // For hirer view (received applications)
  const applicant = application.applicant;
  const jobPost = application.jobPost;

  // For photographer view (submitted applications)
  const post = application.post;
  const jobPoster = post?.user;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isHirer ? (
              // Hirer view - show applicant info and job post
              <>
                <div className="flex items-center space-x-4 mb-3">
                  {applicant?.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${applicant.profilePhoto}`}
                      alt={applicant.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {applicant?.firstName?.[0]}
                        {applicant?.lastName?.[0]}
                      </span>
                    </div>
                  )}

                  <div>
                    <Link
                      to={`/profile/${applicant?.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {applicant?.firstName} {applicant?.lastName}
                    </Link>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {applicant?.email}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <Link
                    to={`/posts/${jobPost?.id}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    Applied for: {jobPost?.title}
                  </Link>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    {jobPost?.budget && (
                      <span className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />${jobPost.budget}
                      </span>
                    )}
                    {jobPost?.eventDate && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(jobPost.eventDate)}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Photographer view - show job post and poster info
              <>
                <div className="flex items-center space-x-3 mb-3">
                  {jobPoster?.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${jobPoster.profilePhoto}`}
                      alt={jobPoster.firstName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {jobPoster?.firstName?.[0]}
                        {jobPoster?.lastName?.[0]}
                      </span>
                    </div>
                  )}

                  <div>
                    <Link
                      to={`/posts/${post?.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {post?.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      by {jobPoster?.firstName} {jobPoster?.lastName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                  {post?.budget && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Budget: ${post.budget}</span>
                    </div>
                  )}
                  {post?.eventDate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Date: {formatDate(post.eventDate)}</span>
                    </div>
                  )}
                  {post?.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{post.location}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Application details */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Applied {formatDate(application.appliedAt)}</span>
                </div>

                {application.proposedRate && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Rate: ${application.proposedRate}</span>
                  </div>
                )}

                {application.availability && (
                  <div className="col-span-full">
                    <span className="font-medium text-gray-700">
                      Availability:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {application.availability}
                    </span>
                  </div>
                )}
              </div>

              {application.coverLetter && (
                <div className="mt-3">
                  <span className="font-medium text-gray-700">
                    Cover Letter:
                  </span>
                  <p className="mt-1 text-gray-900 text-sm line-clamp-2">
                    {application.coverLetter}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(application.status)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>

            {application.resumeUrl && (
              <a
                href={`http://localhost:5000${application.resumeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
              >
                <FileText className="h-4 w-4 mr-1" />
                Resume
              </a>
            )}

            <Link
              to={`/posts/${isHirer ? jobPost?.id : post?.id}`}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Post
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {isHirer && application.status === "pending" && (
              <>
                <button
                  onClick={() => onUpdateStatus(application.id, "rejected")}
                  disabled={isUpdating}
                  className="btn btn-danger text-sm"
                >
                  {isUpdating ? "Updating..." : "Reject"}
                </button>
                <button
                  onClick={() => onUpdateStatus(application.id, "accepted")}
                  disabled={isUpdating}
                  className="btn btn-success text-sm"
                >
                  {isUpdating ? "Updating..." : "Accept"}
                </button>
              </>
            )}

            {isHirer && application.status !== "pending" && (
              <button
                onClick={() => onUpdateStatus(application.id, "pending")}
                disabled={isUpdating}
                className="btn btn-secondary text-sm"
              >
                {isUpdating ? "Updating..." : "Reset to Pending"}
              </button>
            )}

            {!isHirer && application.status === "pending" && (
              <button
                onClick={() => onWithdraw(application.id)}
                disabled={isUpdating}
                className="btn btn-danger text-sm"
              >
                {isUpdating ? "Withdrawing..." : "Withdraw"}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {application.portfolioLinks &&
                application.portfolioLinks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Portfolio Links
                    </h4>
                    <div className="space-y-2">
                      {application.portfolioLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {isHirer && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Internal Notes
                  </h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this applicant..."
                    className="form-textarea w-full"
                    rows={3}
                  />
                  <button
                    onClick={() =>
                      onUpdateStatus(application.id, application.status, notes)
                    }
                    className="btn btn-secondary text-sm mt-2"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              )}

              {!isHirer && application.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Recruiter Feedback
                  </h4>
                  <p className="text-gray-900 text-sm bg-blue-50 p-3 rounded">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
