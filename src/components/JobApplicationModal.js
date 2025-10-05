import React, { useState } from "react";
import {
  X,
  Upload,
  Briefcase,
  DollarSign,
  Clock,
  Link as LinkIcon,
} from "lucide-react";
import api from "../utils/api";

const JobApplicationModal = ({
  isOpen,
  onClose,
  post,
  onApplicationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedRate: "",
    availability: "",
    portfolioLinks: [""],
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePortfolioLinkChange = (index, value) => {
    const newLinks = [...formData.portfolioLinks];
    newLinks[index] = value;
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: newLinks,
    }));
  };

  const addPortfolioLink = () => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""],
    }));
  };

  const removePortfolioLink = (index) => {
    if (formData.portfolioLinks.length > 1) {
      const newLinks = formData.portfolioLinks.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        portfolioLinks: newLinks,
      }));
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          resume: "Only PDF, DOC, and DOCX files are allowed",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          resume: "File size must be less than 5MB",
        }));
        return;
      }

      setResumeFile(file);
      if (errors.resume) {
        setErrors((prev) => ({ ...prev, resume: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = "Cover letter is required";
    }

    if (
      formData.proposedRate &&
      (isNaN(formData.proposedRate) || parseFloat(formData.proposedRate) <= 0)
    ) {
      newErrors.proposedRate = "Please enter a valid rate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const applicationData = new FormData();

      applicationData.append("coverLetter", formData.coverLetter.trim());

      if (formData.proposedRate) {
        applicationData.append("proposedRate", formData.proposedRate);
      }

      if (formData.availability) {
        applicationData.append("availability", formData.availability.trim());
      }

      // Filter out empty portfolio links
      const validLinks = formData.portfolioLinks.filter((link) => link.trim());
      if (validLinks.length > 0) {
        applicationData.append("portfolioLinks", JSON.stringify(validLinks));
      }

      if (resumeFile) {
        applicationData.append("resume", resumeFile);
      }
      console.log(formData);
      const response = await api.post(
        `/job-applications/apply/${post.id}`,
        applicationData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onApplicationSubmitted(response.data.application);
      onClose();
    } catch (error) {
      console.error("Application submission error:", error);

      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({
          submit: "Failed to submit application. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Apply for Job
            </h2>
            <p className="text-sm text-gray-600 mt-1">{post.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              rows={6}
              className={`form-textarea ${
                errors.coverLetter
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              placeholder="Tell them why you're perfect for this job..."
              disabled={isSubmitting}
            />
            {errors.coverLetter && (
              <p className="mt-2 text-sm text-red-600">{errors.coverLetter}</p>
            )}
          </div>

          {/* Proposed Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Proposed Rate ($
              {post.budget ? `Budget: $${post.budget}` : "No budget specified"})
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                name="proposedRate"
                value={formData.proposedRate}
                onChange={handleChange}
                className={`form-input pl-10 ${
                  errors.proposedRate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Enter your rate"
                disabled={isSubmitting}
                min="0"
                step="0.01"
              />
            </div>
            {errors.proposedRate && (
              <p className="mt-2 text-sm text-red-600">{errors.proposedRate}</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="e.g., Available immediately, Weekends only, etc."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Portfolio Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Links
            </label>
            {formData.portfolioLinks.map((link, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={link}
                    onChange={(e) =>
                      handlePortfolioLinkChange(index, e.target.value)
                    }
                    className="form-input pl-10"
                    placeholder="https://your-portfolio.com"
                    disabled={isSubmitting}
                  />
                </div>
                {formData.portfolioLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPortfolioLink}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              disabled={isSubmitting}
            >
              + Add another link
            </button>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-2">
                Upload your resume (PDF, DOC, DOCX - Max 5MB)
              </div>
              <input
                type="file"
                onChange={handleResumeChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-upload"
                disabled={isSubmitting}
              />
              <label
                htmlFor="resume-upload"
                className="btn btn-secondary cursor-pointer"
              >
                Choose File
              </label>
              {resumeFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {resumeFile.name}
                </p>
              )}
            </div>
            {errors.resume && (
              <p className="mt-2 text-sm text-red-600">{errors.resume}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="spinner w-4 h-4" />
                  <span>Submitting...</span>
                </div>
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

export default JobApplicationModal;
