import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText,
  ArrowLeft,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, formatDateTime } from "../utils/helpers";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPhotographer, isHirer } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data.job);
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading job details..." />;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job not found
          </h2>
          <p className="text-gray-600 mb-4">
            The job you're looking for doesn't exist.
          </p>
          <button onClick={() => navigate("/jobs")} className="btn btn-primary">
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const canApply =
    isPhotographer && job.status === "open" && job.hirer.id !== user?.id;
  const isOwner = isHirer && job.hirer.id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      job.status === "open"
                        ? "bg-green-100 text-green-800"
                        : job.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                  <span className="text-sm text-gray-500">
                    Posted {formatDate(job.createdAt)}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="capitalize bg-gray-100 px-2 py-1 rounded text-sm">
                      {job.jobType}
                    </span>
                  </div>

                  {job.budget && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">${job.budget}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Timeline
                </h2>
                <div className="space-y-3">
                  {job.eventDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Event Date</p>
                        <p className="text-gray-600">
                          {formatDateTime(job.eventDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.deadline && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Application Deadline
                        </p>
                        <p className="text-gray-600">
                          {formatDateTime(job.deadline)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Applications (for job owner) */}
              {isOwner && job.applications && job.applications.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Applications ({job.applications.length})
                  </h2>
                  <div className="space-y-4">
                    {job.applications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onStatusUpdate={loadJob}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Client
              </h3>
              <div className="flex items-center space-x-3 mb-4">
                {job.hirer.profilePhoto ? (
                  <img
                    src={job.hirer.profilePhoto}
                    alt={job.hirer.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {job.hirer.firstName} {job.hirer.lastName}
                  </h4>
                  {job.hirer.location && (
                    <p className="text-sm text-gray-600">
                      {job.hirer.location}
                    </p>
                  )}
                </div>
              </div>

              {job.hirer.bio && (
                <p className="text-gray-600 text-sm mb-4">{job.hirer.bio}</p>
              )}

              <button className="btn btn-secondary w-full">View Profile</button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {canApply && (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="btn btn-primary w-full"
                >
                  Apply Now
                </button>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <button className="btn btn-secondary w-full">Edit Job</button>
                </div>
              )}

              <button className="btn btn-secondary w-full">Share Job</button>
            </div>

            {/* Job Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-medium">
                    {job.applicationsCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium">
                    {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          job={job}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={loadJob}
        />
      )}
    </div>
  );
};

const ApplicationCard = ({ application, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status) => {
    try {
      setUpdating(true);
      await api.put(
        `/jobs/${application.jobId}/applications/${application.id}`,
        {
          status,
        }
      );
      onStatusUpdate();
    } catch (error) {
      console.error("Error updating application:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {application.photographer.profilePhoto ? (
            <img
              src={application.photographer.profilePhoto}
              alt={application.photographer.firstName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900">
              {application.photographer.firstName}{" "}
              {application.photographer.lastName}
            </h4>
            <p className="text-sm text-gray-600">
              Applied {formatDate(application.createdAt)}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-1 text-xs rounded-full ${
            application.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : application.status === "accepted"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {application.status}
        </span>
      </div>

      {application.coverLetter && (
        <p className="text-gray-700 text-sm mb-3">{application.coverLetter}</p>
      )}

      {application.proposedRate && (
        <p className="text-sm text-gray-600 mb-3">
          Proposed rate:{" "}
          <span className="font-medium">${application.proposedRate}</span>
        </p>
      )}

      <div className="flex items-center justify-between">
        <a
          href={application.resume.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
        >
          <FileText className="h-4 w-4 mr-1" />
          View Resume
        </a>

        {application.status === "pending" && (
          <div className="flex space-x-2">
            <button
              onClick={() => updateStatus("rejected")}
              disabled={updating}
              className="btn btn-sm px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
            >
              Reject
            </button>
            <button
              onClick={() => updateStatus("accepted")}
              disabled={updating}
              className="btn btn-sm px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationModal = ({ job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    resumeId: "",
    coverLetter: "",
    proposedRate: "",
  });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await api.get("/resumes");
      setResumes(response.data.resumes);
      if (response.data.resumes.length > 0) {
        const defaultResume =
          response.data.resumes.find((r) => r.isDefault) ||
          response.data.resumes[0];
        setFormData((prev) => ({ ...prev, resumeId: defaultResume.id }));
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resumeId) {
      setErrors({ resumeId: "Please select a resume" });
      return;
    }

    try {
      setLoading(true);
      await api.post(`/jobs/${job.id}/apply`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to submit application",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Apply for: {job.title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume *
            </label>
            <select
              value={formData.resumeId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, resumeId: e.target.value }))
              }
              className={`form-input ${
                errors.resumeId ? "border-red-500" : ""
              }`}
            >
              <option value="">Choose a resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title} {resume.isDefault && "(Default)"}
                </option>
              ))}
            </select>
            {errors.resumeId && (
              <p className="mt-1 text-sm text-red-600">{errors.resumeId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter
            </label>
            <textarea
              rows={4}
              value={formData.coverLetter}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coverLetter: e.target.value,
                }))
              }
              className="form-input form-textarea"
              placeholder="Tell the client why you're perfect for this job..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposed Rate ($)
            </label>
            <input
              type="number"
              value={formData.proposedRate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  proposedRate: e.target.value,
                }))
              }
              className="form-input"
              placeholder="Your rate for this job"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobDetail;
