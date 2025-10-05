import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Briefcase,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    loadMyApplications();
  }, []);

  const loadMyApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/job-applications/my-applications");
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
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

  const filteredApplications = applications.filter(
    (app) => statusFilter === "all" || app.status === statusFilter
  );

  if (loading) {
    return <LoadingSpinner text="Loading your applications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            My Applications
          </h1>
          <p className="text-gray-600">
            Track the status of your job applications
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Filter by status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input py-2 px-3 text-sm"
            >
              <option value="all">
                All Applications ({applications.length})
              </option>
              <option value="pending">
                Pending (
                {applications.filter((a) => a.status === "pending").length})
              </option>
              <option value="reviewed">
                Reviewed (
                {applications.filter((a) => a.status === "reviewed").length})
              </option>
              <option value="accepted">
                Accepted (
                {applications.filter((a) => a.status === "accepted").length})
              </option>
              <option value="rejected">
                Rejected (
                {applications.filter((a) => a.status === "rejected").length})
              </option>
              <option value="withdrawn">
                Withdrawn (
                {applications.filter((a) => a.status === "withdrawn").length})
              </option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {statusFilter === "all"
                ? "No applications yet"
                : `No ${statusFilter} applications`}
            </h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === "all"
                ? "Start applying for photography jobs to see them here."
                : `No applications with ${statusFilter} status.`}
            </p>
            <Link to="/posts" className="btn btn-primary">
              Browse Job Posts
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, getStatusBadge }) => {
  const [showDetails, setShowDetails] = useState(false);
  const post = application.post;
  const jobPoster = post?.user;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
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
                <h3 className="font-semibold text-gray-900">{post?.title}</h3>
                <p className="text-sm text-gray-600">
                  by {jobPoster?.firstName} {jobPoster?.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(application.status)}
            <span className="text-xs text-gray-500">
              Applied {formatDate(application.appliedAt)}
            </span>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
          {post?.budget && (
            <div className="flex items-center space-x-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Budget: ${post.budget}</span>
            </div>
          )}

          {post?.jobType && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase className="h-4 w-4" />
              <span>Type: {post.jobType}</span>
            </div>
          )}

          {post?.eventDate && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Date: {formatDate(post.eventDate)}</span>
            </div>
          )}
        </div>

        {/* My Application Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {application.proposedRate && (
              <div>
                <span className="font-medium text-gray-700">My Rate:</span>
                <span className="ml-2 text-gray-900">
                  ${application.proposedRate}
                </span>
              </div>
            )}

            {application.availability && (
              <div>
                <span className="font-medium text-gray-700">Availability:</span>
                <span className="ml-2 text-gray-900">
                  {application.availability}
                </span>
              </div>
            )}
          </div>

          {application.coverLetter && (
            <div className="mt-3">
              <span className="font-medium text-gray-700">Cover Letter:</span>
              <p className="mt-1 text-gray-900 text-sm line-clamp-2">
                {application.coverLetter}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {showDetails ? "Hide Details" : "View Details"}
          </button>

          <Link to={`/posts/${post?.id}`} className="btn btn-secondary text-sm">
            View Job Post
          </Link>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              {application.portfolioLinks &&
                application.portfolioLinks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Portfolio Links
                    </h4>
                    <div className="space-y-1">
                      {application.portfolioLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {application.resumeUrl && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Resume</h4>
                  <a
                    href={`http://localhost:5000${application.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-600 hover:text-primary-700 text-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Resume
                  </a>
                </div>
              )}

              {application.notes && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Recruiter Notes
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

export default MyApplications;
