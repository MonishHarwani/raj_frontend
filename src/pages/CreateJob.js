import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapPin, DollarSign, Calendar, Clock, Plus, X } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CreateJob = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "",
    budget: "",
    location: "",
    eventDate: "",
    deadline: "",
    requirements: [],
  });
  const [requirementInput, setRequirementInput] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addRequirement = (e) => {
    e.preventDefault();
    if (
      requirementInput.trim() &&
      !formData.requirements.includes(requirementInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()],
      }));
      setRequirementInput("");
    }
  };

  const removeRequirement = (reqToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((req) => req !== reqToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required";
    }

    if (!formData.jobType) {
      newErrors.jobType = "Job type is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (formData.budget && isNaN(formData.budget)) {
      newErrors.budget = "Budget must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await api.post("/jobs", formData);
      navigate(`/jobs/${response.data.job.id}`);
    } catch (error) {
      console.error("Error creating job:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to create job",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Post a New Job
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            {/* Job Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`form-input ${errors.title ? "border-red-500" : ""}`}
                placeholder="e.g., Wedding Photographer Needed for Outdoor Ceremony"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Job Type and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jobType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Job Type *
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.jobType ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select job type</option>
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="commercial">Commercial</option>
                  <option value="other">Other</option>
                </select>
                {errors.jobType && (
                  <p className="mt-2 text-sm text-red-600">{errors.jobType}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Budget ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className={`form-input pl-10 ${
                      errors.budget ? "border-red-500" : ""
                    }`}
                    placeholder="0"
                    min="0"
                  />
                </div>
                {errors.budget && (
                  <p className="mt-2 text-sm text-red-600">{errors.budget}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`form-input pl-10 ${
                    errors.location ? "border-red-500" : ""
                  }`}
                  placeholder="City, State or specific venue"
                />
              </div>
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Event Date and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="eventDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="eventDate"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Application Deadline
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className={`form-input form-textarea ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder="Describe the job, what you're looking for, any specific requirements..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addRequirement(e)}
                  className="form-input flex-1"
                  placeholder="Add a requirement (e.g., 5+ years experience)"
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="btn btn-secondary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {formData.requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-gray-700">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(req)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                  <>
                    <LoadingSpinner size="sm" text="" />
                    Creating Job...
                  </>
                ) : (
                  "Post Job"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
