import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  Camera,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  UserPlus,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "photographer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear general submit errors
    if (errors.submit || errors.general) {
      setErrors((prev) => {
        const { submit, general, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = "First name can only contain letters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = "Last name can only contain letters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 255) {
      newErrors.email = "Email address is too long";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 128) {
      newErrors.password = "Password must be less than 128 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.focus();
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear all errors before submission

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);

      if (result.success) {
        navigate("/dashboard");
      } else {
        // Handle different types of backend errors
        handleBackendErrors(result.error, result.errors);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendErrors = (errorMessage, validationErrors) => {
    const newErrors = {};

    // Handle validation errors from backend
    if (validationErrors && Array.isArray(validationErrors)) {
      validationErrors.forEach((error) => {
        if (error.field) {
          newErrors[error.field] = error.message;
        }
      });
    }

    // Handle specific error messages
    if (typeof errorMessage === "string") {
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes("email") && lowerMessage.includes("already")) {
        newErrors.email = "This email address is already registered";
      } else if (
        lowerMessage.includes("user") &&
        lowerMessage.includes("exists")
      ) {
        newErrors.email = "An account with this email already exists";
      } else if (lowerMessage.includes("invalid email")) {
        newErrors.email = "Please enter a valid email address";
      } else if (lowerMessage.includes("password")) {
        if (
          lowerMessage.includes("weak") ||
          lowerMessage.includes("strength")
        ) {
          newErrors.password =
            "Password is too weak. Please use a stronger password";
        } else if (lowerMessage.includes("short")) {
          newErrors.password =
            "Password is too short. Minimum 6 characters required";
        } else {
          newErrors.password = errorMessage;
        }
      } else if (
        lowerMessage.includes("first name") ||
        lowerMessage.includes("firstname")
      ) {
        newErrors.firstName = errorMessage;
      } else if (
        lowerMessage.includes("last name") ||
        lowerMessage.includes("lastname")
      ) {
        newErrors.lastName = errorMessage;
      } else if (lowerMessage.includes("role")) {
        newErrors.role = errorMessage;
      } else if (
        lowerMessage.includes("network") ||
        lowerMessage.includes("connection")
      ) {
        newErrors.general =
          "Network error. Please check your connection and try again";
      } else if (
        lowerMessage.includes("server") ||
        lowerMessage.includes("500")
      ) {
        newErrors.general = "Server error. Please try again in a moment";
      } else {
        newErrors.general = errorMessage;
      }
    } else {
      newErrors.general = "Registration failed. Please try again";
    }

    setErrors(newErrors);

    // Focus on first error field
    setTimeout(() => {
      const firstErrorField = Object.keys(newErrors).find(
        (field) => field !== "general"
      );
      if (firstErrorField) {
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"]`
        );
        if (errorElement) {
          errorElement.focus();
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName];
  };

  const hasError = (fieldName) => {
    return Boolean(errors[fieldName]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-blue-100/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Registration Error
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message (if needed for other flows) */}
            {errors.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Success
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {errors.success}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "photographer" }))
                  }
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${
                    formData.role === "photographer"
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Camera className="h-6 w-6 mr-2" />
                  <span className="font-medium">Photographer</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "hirer" }))
                  }
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${
                    formData.role === "hirer"
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Briefcase className="h-6 w-6 mr-2" />
                  <span className="font-medium">Client</span>
                </button>
              </div>
              {hasError("role") && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError("role")}
                </p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`pl-10 form-input ${
                      hasError("firstName")
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : submitAttempted && formData.firstName.trim()
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                    placeholder="First name"
                    aria-describedby={
                      hasError("firstName") ? "firstName-error" : undefined
                    }
                  />
                  {submitAttempted &&
                    formData.firstName.trim() &&
                    !hasError("firstName") && (
                      <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                </div>
                {hasError("firstName") && (
                  <p
                    id="firstName-error"
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {getFieldError("firstName")}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`pl-10 form-input ${
                      hasError("lastName")
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : submitAttempted && formData.lastName.trim()
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                    placeholder="Last name"
                    aria-describedby={
                      hasError("lastName") ? "lastName-error" : undefined
                    }
                  />
                  {submitAttempted &&
                    formData.lastName.trim() &&
                    !hasError("lastName") && (
                      <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                </div>
                {hasError("lastName") && (
                  <p
                    id="lastName-error"
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {getFieldError("lastName")}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 form-input ${
                    hasError("email")
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : submitAttempted &&
                        formData.email.trim() &&
                        /\S+@\S+\.\S+/.test(formData.email)
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  placeholder="Enter your email"
                  aria-describedby={
                    hasError("email") ? "email-error" : undefined
                  }
                />
                {submitAttempted &&
                  formData.email.trim() &&
                  /\S+@\S+\.\S+/.test(formData.email) &&
                  !hasError("email") && (
                    <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
              </div>
              {hasError("email") && (
                <p
                  id="email-error"
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 pr-10 form-input ${
                    hasError("password")
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : submitAttempted && formData.password.length >= 6
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  placeholder="Create a password"
                  aria-describedby={
                    hasError("password") ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {hasError("password") && (
                <p
                  id="password-error"
                  className="mt-2 text-sm text-red-600 flex items-start"
                >
                  <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{getFieldError("password")}</span>
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && !hasError("password") && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">
                    Password strength:
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          formData.password.length > i * 2 + 2
                            ? formData.password.length >= 12
                              ? "bg-green-500"
                              : formData.password.length >= 8
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 form-input ${
                    hasError("confirmPassword")
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : submitAttempted &&
                        formData.confirmPassword &&
                        formData.password === formData.confirmPassword
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  placeholder="Confirm your password"
                  aria-describedby={
                    hasError("confirmPassword")
                      ? "confirmPassword-error"
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {submitAttempted &&
                  formData.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  !hasError("confirmPassword") && (
                    <CheckCircle className="absolute right-10 top-3 h-5 w-5 text-green-500" />
                  )}
              </div>
              {hasError("confirmPassword") && (
                <p
                  id="confirmPassword-error"
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError("confirmPassword")}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                required
              />
              <label
                htmlFor="agree-terms"
                className="ml-3 block text-sm text-gray-900"
              >
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" text="" />
                    <span className="ml-2">Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
