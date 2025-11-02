import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  X,
  Upload,
  MapPin,
  Tag,
  Plus,
  Images,
  Camera,
  Search,
  Filter,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [],
    location: "",
    isJobPost: false,
    jobType: "",
    budget: "",
    eventDate: "",
  });
  const [photos, setPhotos] = useState([]);
  const [selectedStockPhotos, setSelectedStockPhotos] = useState([]);
  const [stockPhotos, setStockPhotos] = useState([]);
  const [stockPhotoCategories, setStockPhotoCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showStockPhotos, setShowStockPhotos] = useState(false);
  const [stockPhotosLoading, setStockPhotosLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState("");

  const { user, isHirer } = useAuth();
  const navigate = useNavigate();

  // Load stock photos on component mount
  // useEffect(() => {
  //   loadStockPhotos();
  //   loadStockPhotoCategories();
  // }, []);

  // Load stock photos when category changes
  // useEffect(() => {
  //   if (showStockPhotos) {
  //     loadStockPhotos();
  //   }
  // }, [selectedCategory]);

  // const loadStockPhotos = async () => {
  //   try {
  //     setStockPhotosLoading(true);
  //     const params = new URLSearchParams();
  //     if (selectedCategory !== "all") {
  //       params.append("category", selectedCategory);
  //     }

  //     const response = await api.get(`/stock-photos?${params}`);
  //     setStockPhotos(response.data.stockPhotos || []);
  //   } catch (error) {
  //     console.error("Error loading stock photos:", error);
  //   } finally {
  //     setStockPhotosLoading(false);
  //   }
  // };

  // const loadStockPhotoCategories = async () => {
  //   try {
  //     const response = await api.get("/stock-photos/categories");
  //     setStockPhotoCategories(response.data.categories || []);
  //   } catch (error) {
  //     console.error("Error loading categories:", error);
  //   }
  // };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      const newPhotos = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        type: "upload",
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      if (errors.photos) {
        setErrors((prev) => ({ ...prev, photos: "" }));
      }
    },
  });

  const handleStockPhotoSelect = (stockPhoto) => {
    const isSelected = selectedStockPhotos.find((p) => p.id === stockPhoto.id);

    if (isSelected) {
      // Remove from selection
      setSelectedStockPhotos((prev) =>
        prev.filter((p) => p.id !== stockPhoto.id)
      );
      setPhotos((prev) => prev.filter((p) => p.stockPhotoId !== stockPhoto.id));
    } else {
      // Add to selection
      setSelectedStockPhotos((prev) => [...prev, stockPhoto]);
      setPhotos((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          stockPhotoId: stockPhoto.id,
          preview:
            stockPhoto.fullUrl || `http://localhost:5000${stockPhoto.url}`,
          type: "stock",
          stockPhotoData: stockPhoto,
        },
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const removePhoto = (photoId) => {
    setPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === photoId);
      if (photoToRemove && photoToRemove.type === "stock") {
        // Also remove from selected stock photos
        setSelectedStockPhotos((prevStock) =>
          prevStock.filter((p) => p.id !== photoToRemove.stockPhotoId)
        );
      }
      return prev.filter((photo) => photo.id !== photoId);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (photos.length === 0) {
      newErrors.photos = "At least one photo is required";
    }

    if (formData.isJobPost) {
      if (!formData.jobType) {
        newErrors.jobType = "Job type is required for job posts";
      }
      if (!formData.budget) {
        newErrors.budget = "Budget is required for job posts";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append("title", formData.title.trim());

      if (formData.description && formData.description.trim()) {
        formDataToSend.append("description", formData.description.trim());
      }

      if (formData.location && formData.location.trim()) {
        formDataToSend.append("location", formData.location.trim());
      }

      formDataToSend.append("tags", JSON.stringify(formData.tags));
      formDataToSend.append("isJobPost", formData.isJobPost.toString());

      if (formData.isJobPost) {
        if (formData.jobType) {
          formDataToSend.append("jobType", formData.jobType);
        }
        if (formData.budget) {
          formDataToSend.append("budget", formData.budget.toString());
        }
        if (formData.eventDate) {
          formDataToSend.append("eventDate", formData.eventDate);
        }
      }

      // Add uploaded photos
      const uploadedPhotos = photos.filter((p) => p.type === "upload");
      uploadedPhotos.forEach((photo) => {
        formDataToSend.append("photos", photo.file);
      });

      // Add selected stock photo IDs
      const stockPhotoIds = photos
        .filter((p) => p.type === "stock")
        .map((p) => p.stockPhotoId);

      if (stockPhotoIds.length > 0) {
        formDataToSend.append("stockPhotoIds", JSON.stringify(stockPhotoIds));
      }

      const response = await api.post("/posts", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate(`/posts/${response.data.post.id}`);
    } catch (error) {
      console.error("Error creating post:", error);

      if (error.response) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          errorData.errors.forEach((err) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ submit: errorData.message || "Failed to create post" });
        }
      } else {
        setErrors({ submit: "Network error. Please try again." });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Post
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Photo Selection Tabs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos * (At least 1 required)
              </label>

              <div className="flex space-x-4 mb-4">
                {/* <button
                  type="button"
                  onClick={() => setShowStockPhotos(false)}
                  className={`flex items-center px-4 py-2 rounded-lg border ${
                    !showStockPhotos
                      ? "bg-primary-100 border-primary-300 text-primary-700"
                      : "bg-gray-50 border-gray-300 text-gray-600"
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </button> */}
                {/* <button
                  type="button"
                  onClick={() => setShowStockPhotos(true)}
                  className={`flex items-center px-4 py-2 rounded-lg border ${
                    showStockPhotos
                      ? "bg-primary-100 border-primary-300 text-primary-700"
                      : "bg-gray-50 border-gray-300 text-gray-600"
                  }`}
                >
                  <Images className="h-4 w-4 mr-2" />
                  Choose Stock Photos
                </button> */}
              </div>

              {/* Upload Photos Tab */}
              {!showStockPhotos && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary-400 bg-primary-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${errors.photos ? "border-red-300" : ""}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-primary-600">Drop the photos here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag & drop photos here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Up to 10 images, max 10MB each (JPG, PNG, WEBP)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Photos Tab */}
              {showStockPhotos && (
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div className="flex items-center space-x-4">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="form-input"
                    >
                      <option value="all">All Categories</option>
                      <option value="hiring">Hiring & Jobs</option>
                      <option value="wedding">Wedding</option>
                      <option value="portrait">Portrait</option>
                      <option value="event">Event</option>
                      <option value="commercial">Commercial</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  {/* Stock Photos Grid */}
                  {stockPhotosLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading stock photos..." />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 border rounded-lg bg-gray-50">
                      {stockPhotos.map((stockPhoto) => {
                        const isSelected = selectedStockPhotos.find(
                          (p) => p.id === stockPhoto.id
                        );
                        return (
                          <div
                            key={stockPhoto.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden group ${
                              isSelected ? "ring-2 ring-primary-500" : ""
                            }`}
                            onClick={() => handleStockPhotoSelect(stockPhoto)}
                          >
                            <img
                              src={
                                stockPhoto.fullUrl ||
                                `http://localhost:5000${stockPhoto.url}`
                              }
                              alt={stockPhoto.title}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-white text-xs truncate">
                                {stockPhoto.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {errors.photos && (
                <p className="mt-2 text-sm text-red-600">{errors.photos}</p>
              )}

              {/* Selected Photos Preview */}
              {photos.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Photos ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.preview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-1 right-1">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded-full text-white ${
                              photo.type === "stock"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          >
                            {photo.type === "stock" ? "Stock" : "Upload"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rest of your existing form fields (Title, Description, etc.) */}
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`form-input ${
                  errors.title
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Give your post a compelling title..."
                required
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Tell the story behind your photos..."
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input pl-10"
                  placeholder="Where was this taken?"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag(e)}
                    className="form-input pl-10"
                    placeholder="Add tags (wedding, portrait, etc.)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job Post Toggle */}
            {isHirer && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isJobPost"
                  name="isJobPost"
                  checked={formData.isJobPost}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isJobPost"
                  className="text-sm font-medium text-gray-700"
                >
                  This is a job opportunity post
                </label>
              </div>
            )}

            {/* Job-specific fields */}
            {formData.isJobPost && (
              <div className="space-y-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <h3 className="text-lg font-medium text-primary-900">
                  Job Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className={`form-input ${
                        errors.jobType ? "border-red-300" : ""
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
                      <p className="mt-1 text-sm text-red-600">
                        {errors.jobType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget ($) *
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className={`form-input ${
                        errors.budget ? "border-red-300" : ""
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {errors.budget && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.budget}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || photos.length === 0}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner w-4 h-4" />
                    <span>Creating Post...</span>
                  </div>
                ) : (
                  "Create Post"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
