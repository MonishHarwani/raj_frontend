import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Filter,
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle,
  X,
  Eye,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import JobApplicationModal from "../components/JobApplicationModal";
import { formatDate } from "../utils/helpers";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userApplications, setUserApplications] = useState(new Map());
  const [selectedJobPost, setSelectedJobPost] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    jobType: "",
    location: "",
    minBudget: "",
    maxBudget: "",
    tags: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadJobs();
    if (isAuthenticated) {
      loadUserApplications();
    }
  }, [filters, isAuthenticated]);

  const loadJobs = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("isJobPost", "true");

      if (filters.search) queryParams.append("search", filters.search);
      if (filters.jobType) queryParams.append("jobType", filters.jobType);
      if (filters.location) queryParams.append("location", filters.location);
      if (filters.minBudget) queryParams.append("minBudget", filters.minBudget);
      if (filters.maxBudget) queryParams.append("maxBudget", filters.maxBudget);
      if (filters.tags) queryParams.append("tags", filters.tags);

      const response = await api.get(`/posts?${queryParams}`);
      console.log("Job posts loaded:", response.data);
      setJobs(response.data.posts || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleApplyClick = (job) => {
    setSelectedJobPost(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSubmitted = (application) => {
    // Update user applications map
    setUserApplications(
      (prev) => new Map(prev.set(selectedJobPost.id, application))
    );

    // Update jobs list to reflect new application count
    setJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJobPost.id
          ? { ...job, applicationsCount: (job.applicationsCount || 0) + 1 }
          : job
      )
    );

    alert("Application submitted successfully!");
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      jobType: "",
      location: "",
      minBudget: "",
      maxBudget: "",
      tags: "",
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading job opportunities..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Photography Jobs
            </h1>
            <p className="text-gray-600 mt-1">
              Find photography opportunities that match your skills
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters{" "}
              {Object.values(filters).some((v) => v) && (
                <span className="ml-1 bg-primary-600 text-white rounded-full px-2 py-0.5 text-xs">
                  ON
                </span>
              )}
            </button>
            {isAuthenticated && (
              <Link to="/dashboard/create-post" className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">
              {jobs.length}
            </div>
            <div className="text-sm text-gray-600">Available Jobs</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Jobs</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">
              {userApplications.size}
            </div>
            <div className="text-sm text-gray-600">My Applications</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">
              {
                Array.from(userApplications.values()).filter(
                  (app) => app.status === "accepted"
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filter Jobs</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="form-input pl-10"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  className="form-input"
                  value={filters.jobType}
                  onChange={(e) =>
                    handleFilterChange("jobType", e.target.value)
                  }
                >
                  <option value="">All Types</option>
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="commercial">Commercial</option>
                  <option value="product">Product</option>
                  <option value="fashion">Fashion</option>
                  <option value="real estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, State"
                  className="form-input"
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Budget ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="form-input"
                  value={filters.minBudget}
                  onChange={(e) =>
                    handleFilterChange("minBudget", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Budget ($)
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  className="form-input"
                  value={filters.maxBudget}
                  onChange={(e) =>
                    handleFilterChange("maxBudget", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. outdoor, studio"
                  className="form-input"
                  value={filters.tags}
                  onChange={(e) => handleFilterChange("tags", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length > 0 ? (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userApplication={userApplications.get(job.id)}
                onApplyClick={handleApplyClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some((v) => v)
                ? "Try adjusting your filters to find more opportunities."
                : "Check back later for new photography job opportunities."}
            </p>
            {Object.values(filters).some((v) => v) && (
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear Filters
              </button>
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

const JobCard = ({ job, userApplication, onApplyClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

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

  const isOwner = isAuthenticated && user?.id === job.user?.id;
  const canApply = isAuthenticated && !isOwner && job.isActive;
  const applicationsCount =
    job.applications?.length || job.applicationsCount || 0;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        {/* Header with Author Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                to={`/profile/${job.user?.id}`}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                {job.user?.profilePhoto ? (
                  <img
                    src={`http://localhost:5000${job.user.profilePhoto}`}
                    alt={job.user.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {job.user?.firstName?.[0]}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {job.user?.firstName} {job.user?.lastName}
                </span>
              </Link>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {formatDate(job.createdAt)}
              </span>
            </div>

            {/* Job Title */}
            <Link to={`/posts/${job.id}`}>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                {job.title}
              </h3>
            </Link>

            {/* Job Description */}
            <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

            {/* Job Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              {job.jobType && (
                <div className="flex items-center space-x-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="capitalize">{job.jobType}</span>
                </div>
              )}

              {job.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}

              {job.budget && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${job.budget}</span>
                </div>
              )}

              {job.eventDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(job.eventDate)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {job.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {job.tags.length > 3 && (
                  <span className="text-xs text-gray-500 py-1">
                    +{job.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status and Application Count */}
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                job.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {job.isActive ? "Open" : "Closed"}
            </span>

            {applicationsCount > 0 && (
              <span className="text-xs text-gray-500 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {applicationsCount} applications
              </span>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Link
              to={`/posts/${job.id}`}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Link>

            {isOwner && (
              <Link
                to={`/dashboard/job-applications/${job.id}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                <Users className="h-4 w-4 mr-1" />
                Manage Applications ({applicationsCount})
              </Link>
            )}
          </div>

          {/* Application Button */}
          {canApply && (
            <div className="flex items-center space-x-2">
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
                        <span className={`text-sm font-medium ${status.color}`}>
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
                    onApplyClick(job);
                  }}
                  className={`btn btn-primary text-sm py-2 px-4 transition-all duration-200 ${
                    isHovered ? "transform scale-105" : ""
                  }`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Apply Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
