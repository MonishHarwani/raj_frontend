import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  Upload,
  Edit,
  Trash2,
  Download,
  Star,
  Plus,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, formatFileSize } from "../utils/helpers";

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { user, isPhotographer } = useAuth();

  useEffect(() => {
    if (isPhotographer) {
      loadResumes();
    }
  }, [isPhotographer]);

  const loadResumes = async () => {
    try {
      const response = await api.get("/resumes");
      setResumes(response.data.resumes);
    } catch (error) {
      console.error("Error loading resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      await api.put(`/resumes/${resumeId}`, { isDefault: true });
      setResumes((prev) =>
        prev.map((resume) => ({
          ...resume,
          isDefault: resume.id === resumeId,
        }))
      );
    } catch (error) {
      console.error("Error setting default resume:", error);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    try {
      await api.delete(`/resumes/${resumeId}`);
      setResumes((prev) => prev.filter((resume) => resume.id !== resumeId));
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  if (!isPhotographer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only photographers can manage resumes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading resumes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-gray-600 mt-1">
              Manage your resumes for job applications
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Resume
          </button>
        </div>

        {/* Resumes List */}
        {resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No resumes uploaded
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first resume to start applying for photography jobs
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              Upload Your First Resume
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadResumeModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadResumes();
          }}
        />
      )}
    </div>
  );
};

const ResumeCard = ({ resume, onSetDefault, onDelete }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-red-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {resume.title}
              </h3>
              {resume.isDefault && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  <Star className="h-3 w-3 inline mr-1" />
                  Default
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>Uploaded {formatDate(resume.createdAt)}</p>
              <p>Size: {formatFileSize(resume.size)}</p>
              <p>Original: {resume.originalName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={resume.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            View
          </a>

          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(resume.id)}
            className="btn btn-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">Used in job applications</div>

        {!resume.isDefault && (
          <button
            onClick={() => onSetDefault(resume.id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Set as Default
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditResumeModal
          resume={resume}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </div>
  );
};

const UploadResumeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    isDefault: false,
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        if (!formData.title) {
          setFormData((prev) => ({
            ...prev,
            title: selectedFile.name.replace(".pdf", ""),
          }));
        }
      }
    },
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles[0]?.errors[0]?.code === "file-too-large") {
        setErrors({ file: "File is too large. Maximum size is 5MB." });
      } else {
        setErrors({ file: "Only PDF files are allowed." });
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setErrors({ file: "Please select a PDF file" });
      return;
    }

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    try {
      setUploading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("resume", file);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("isDefault", formData.isDefault);

      await api.post("/resumes", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onSuccess();
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Resume
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume File (PDF) *
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {file ? (
                <div>
                  <p className="text-green-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              ) : isDragActive ? (
                <p className="text-blue-600">Drop the PDF here...</p>
              ) : (
                <div>
                  <p className="text-gray-600">Drag & drop your resume here</p>
                  <p className="text-sm text-gray-500">
                    or click to browse (PDF only, max 5MB)
                  </p>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-2 text-sm text-red-600">{errors.file}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`form-input ${errors.title ? "border-red-500" : ""}`}
              placeholder="e.g., Senior Photographer Resume 2025"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Default Resume */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isDefault"
              className="ml-2 block text-sm text-gray-900"
            >
              Set as default resume
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                "Upload Resume"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditResumeModal = ({ resume, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: resume.title,
    isDefault: resume.isDefault,
  });
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/resumes/${resume.id}`, formData);
      onSuccess();
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || "Update failed" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Edit Resume
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`form-input ${errors.title ? "border-red-500" : ""}`}
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsDefault"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="editIsDefault"
              className="ml-2 block text-sm text-gray-900"
            >
              Set as default resume
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                "Update Resume"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Resumes;
