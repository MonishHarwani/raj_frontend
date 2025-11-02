import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api"; // Adjust the path if your API helper is elsewhere

const EditProfile = () => {
  const { user, setUser } = useAuth();
  //   console.log("checking SetUser");
  //   console.log(user);
  //   console.log(setUser);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    phone: "",
    website: "",
    specialties: "",
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
        website: user.website || "",
        specialties:
          (Array.isArray(user.specialties)
            ? user.specialties.join(", ")
            : user.specialties) || "",
      });
      setProfilePhotoPreview(
        user.profilePhoto
          ? user.profilePhoto.startsWith("/uploads")
            ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${
                user.profilePhoto
              }`
            : user.profilePhoto
          : ""
      );
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name])
      setFieldErrors((errors) => ({ ...errors, [name]: "" }));
  };

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
      setProfilePhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMsg("");
    setLoading(true);
    try {
      // Convert specialties string to array (if comma separated)
      const fullForm = { ...formData };
      if (fullForm.specialties && typeof fullForm.specialties === "string")
        fullForm.specialties = fullForm.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      const res = await api.put("/users/profile", fullForm);
      setUser(res.data.user);
      setSuccessMsg("Profile updated!");
    } catch (err) {
      if (err.response && err.response.data.errors) {
        const errorsObj = {};
        for (const error of err.response.data.errors) {
          errorsObj[error.param || error.field] = error.msg || error.message;
        }
        console.log("This is edit profile log");
        console.log(errorsObj);
        setFieldErrors(errorsObj);
      } else {
        console.log("This is edit profile log else side");
        console.log(err);
        setFieldErrors({ general: "Profile update failed." });
      }
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedPhoto) return;
    setPhotoLoading(true);
    setFieldErrors({});
    setSuccessMsg("");
    try {
      const fd = new FormData();
      fd.append("photo", selectedPhoto);
      const res = await api.post("/users/profile-photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePhotoPreview(
        res.data.profilePhoto.startsWith("/uploads")
          ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${
              res.data.profilePhoto
            }`
          : res.data.profilePhoto
      );
      setUser((prev) => ({ ...prev, profilePhoto: res.data.profilePhoto }));
      setSuccessMsg("Profile photo updated!");
      setSelectedPhoto(null);
    } catch (err) {
      setFieldErrors({ photo: "Profile photo upload failed." });
    }
    setPhotoLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-6">Edit Your Profile</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Profile Photo */}
        <div className="flex items-center mb-6">
          <img
            src={profilePhotoPreview || "/default-avatar.png"}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover mr-4 border"
          />
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              className="block"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-secondary mb-2"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              disabled={photoLoading}
            >
              {photoLoading ? "Uploading..." : "Change Photo"}
            </button>
            {selectedPhoto && (
              <button
                className="btn btn-primary ml-2"
                type="button"
                onClick={handlePhotoUpload}
                disabled={photoLoading}
              >
                Save Photo
              </button>
            )}
            {fieldErrors.photo && (
              <div className="text-red-600 text-sm">{fieldErrors.photo}</div>
            )}
          </div>
        </div>

        <div>
          <label>First Name</label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`form-input w-full ${
              fieldErrors.firstName ? "border-red-500" : ""
            }`}
            minLength={2}
            required
          />
          {fieldErrors.firstName && (
            <div className="text-red-600 text-sm">{fieldErrors.firstName}</div>
          )}
        </div>

        <div>
          <label>Last Name</label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`form-input w-full ${
              fieldErrors.lastName ? "border-red-500" : ""
            }`}
            minLength={2}
            required
          />
          {fieldErrors.lastName && (
            <div className="text-red-600 text-sm">{fieldErrors.lastName}</div>
          )}
        </div>

        <div>
          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className={`form-textarea w-full ${
              fieldErrors.bio ? "border-red-500" : ""
            }`}
            rows={3}
            maxLength={500}
          />
          {fieldErrors.bio && (
            <div className="text-red-600 text-sm">{fieldErrors.bio}</div>
          )}
        </div>

        <div>
          <label>Location</label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`form-input w-full ${
              fieldErrors.location ? "border-red-500" : ""
            }`}
            maxLength={100}
          />
          {fieldErrors.location && (
            <div className="text-red-600 text-sm">{fieldErrors.location}</div>
          )}
        </div>

        <div>
          <label>Phone</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`form-input w-full ${
              fieldErrors.phone ? "border-red-500" : ""
            }`}
            maxLength={15}
            placeholder="e.g. +919999999999"
          />
          {fieldErrors.phone && (
            <div className="text-red-600 text-sm">{fieldErrors.phone}</div>
          )}
        </div>

        <div>
          <label>Website</label>
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={`form-input w-full ${
              fieldErrors.website ? "border-red-500" : ""
            }`}
            placeholder="e.g. https://yoursite.com"
          />
          {fieldErrors.website && (
            <div className="text-red-600 text-sm">{fieldErrors.website}</div>
          )}
        </div>

        <div>
          <label>
            Specialties{" "}
            <span className="text-xs text-gray-400">(comma separated)</span>
          </label>
          <input
            name="specialties"
            value={formData.specialties}
            onChange={handleChange}
            className="form-input w-full"
            placeholder="Wedding, Nature, Portrait, ..."
          />
        </div>

        {fieldErrors.general && (
          <div className="text-red-600">{fieldErrors.general}</div>
        )}
        {successMsg && <div className="text-green-600">{successMsg}</div>}

        <button
          type="submit"
          className="btn btn-primary min-w-[120px]"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
