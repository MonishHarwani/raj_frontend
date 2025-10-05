import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  Camera,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors and success message when user types
    if (errors[name] || errors.submit) {
      setErrors({});
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorDisplay = (errorData) => {
    // Handle different error scenarios
    if (!errorData) return null;

    let title = "Login Failed";
    let message = "Please try again";
    let icon = "❌";
    let action = null;

    // Parse error based on type or status code
    if (typeof errorData === "string") {
      message = errorData;
    } else if (errorData.type) {
      switch (errorData.type) {
        case "user_not_found":
          title = "Account Not Found";
          icon = "👤";
          message = "No account exists with this email address.";
          action = (
            <div className="mt-3">
              <Link
                to="/register"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Create a new account →
              </Link>
            </div>
          );
          break;

        case "invalid_password":
          title = "Incorrect Password";
          icon = "🔒";
          message = "The password you entered is incorrect.";
          action = (
            <div className="mt-3">
              <a
                href="#"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password? →
              </a>
            </div>
          );
          break;

        case "validation_error":
          title = "Invalid Input";
          icon = "⚠️";
          message = errorData.message;
          break;

        case "server_error":
        case "database_error":
        case "bcrypt_error":
        case "jwt_error":
        case "config_error":
          title = "Server Issue";
          icon = "🔧";
          message =
            "Something went wrong on our end. Please try again in a moment.";
          action = (
            <div className="mt-3">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Refresh page →
              </button>
            </div>
          );
          break;

        case "network_error":
          title = "Connection Problem";
          icon = "📡";
          message =
            "Unable to connect to our servers. Please check your internet connection.";
          action = (
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <WifiOff className="h-4 w-4 mr-1" />
              Check your internet connection
            </div>
          );
          break;

        default:
          message = errorData.message || "An unexpected error occurred";
      }
    } else if (errorData.status) {
      // Handle by status code
      switch (errorData.status) {
        case 400:
          title = "Invalid Request";
          icon = "⚠️";
          message = "Please check your email and password.";
          break;
        case 401:
          title = "Invalid Credentials";
          icon = "🔒";
          message = "Email or password is incorrect.";
          break;
        case 500:
          title = "Server Error";
          icon = "🔧";
          message =
            "Our servers are experiencing issues. Please try again in a few minutes.";
          action = (
            <div className="mt-3">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Refresh page →
              </button>
            </div>
          );
          break;
        default:
          message =
            errorData.message || `Error ${errorData.status}: Please try again`;
      }
    } else {
      message = errorData.message || errorData || "Something went wrong";
    }

    return { title, message, icon, action };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== LOGIN FORM SUBMIT ===");
    console.log("Email:", formData.email);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      console.log("Attempting login...");
      const result = await login(formData.email, formData.password);
      console.log("Login result:", result);

      if (result.success) {
        setSuccessMessage("✅ Login successful! Redirecting...");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        console.log("Login failed with result:", result);
        setErrors({
          submit: {
            message: result.error,
            type: result.type,
            status: result.status,
          },
        });
      }
    } catch (error) {
      console.error("Login exception:", error);
      setErrors({
        submit: {
          message: "An unexpected error occurred. Please try again.",
          type: "client_error",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const errorDisplay = getErrorDisplay(errors.submit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorDisplay && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-start">
                  <div className="text-2xl mr-3 flex-shrink-0">
                    {errorDisplay.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-800 font-medium mb-1">
                      {errorDisplay.title}
                    </h3>
                    <p className="text-red-700 text-sm mb-2">
                      {errorDisplay.message}
                    </p>
                    {errorDisplay.action}
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input pr-10 ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex justify-center items-center space-x-2 min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 mb-2">
                  Debug Info
                </summary>
                <div className="space-y-1 text-gray-500">
                  <div>API URL: http://localhost:5000/api</div>
                  <div>
                    Form Valid: {JSON.stringify(!Object.keys(errors).length)}
                  </div>
                  <div>Loading: {JSON.stringify(isLoading)}</div>
                  {errors.submit && (
                    <div>
                      Error Data: {JSON.stringify(errors.submit, null, 2)}
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
