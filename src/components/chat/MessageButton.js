import React, { useState } from "react";
import { MessageCircle, Loader2, Check, X, User } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MessageButton = ({
  userId,
  userName,
  userPhoto,
  size = "md",
  variant = "primary",
  className = "",
  showIcon = true,
  showUserInfo = false,
  disabled = false,
  fullWidth = false,
  rounded = "md",
  children,
  onClick,
  style = {},
  tooltip = true,
  loadingText = "Starting chat...",
  successText = "Chat started!",
  errorText = "Failed to start chat",
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const { startConversation } = useChat();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || loading) return;

    // Custom onClick handler
    if (onClick) {
      onClick(e);
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.id === userId) {
      return; // Can't message yourself
    }

    try {
      setLoading(true);
      setError(false);

      const conversation = await startConversation(userId);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/chat/${conversation.id}`);
      }, 500);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  // Don't render if user is trying to message themselves
  if (isAuthenticated && user?.id === userId) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    xs: {
      padding: "px-2 py-1",
      text: "text-xs",
      icon: "h-3 w-3",
      height: "h-6",
    },
    sm: {
      padding: "px-3 py-1.5",
      text: "text-sm",
      icon: "h-4 w-4",
      height: "h-8",
    },
    md: {
      padding: "px-4 py-2",
      text: "text-sm",
      icon: "h-4 w-4",
      height: "h-10",
    },
    lg: {
      padding: "px-6 py-3",
      text: "text-base",
      icon: "h-5 w-5",
      height: "h-12",
    },
    xl: {
      padding: "px-8 py-4",
      text: "text-lg",
      icon: "h-6 w-6",
      height: "h-14",
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      base: "bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700 focus:ring-primary-500",
      loading: "bg-primary-400 border-primary-400",
      success: "bg-green-600 border-green-600",
      error: "bg-red-600 border-red-600",
    },
    secondary: {
      base: "bg-gray-600 text-white border-gray-600 hover:bg-gray-700 hover:border-gray-700 focus:ring-gray-500",
      loading: "bg-gray-400 border-gray-400",
      success: "bg-green-600 border-green-600",
      error: "bg-red-600 border-red-600",
    },
    outline: {
      base: "bg-transparent text-primary-600 border-primary-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500",
      loading: "bg-primary-50 text-primary-400 border-primary-400",
      success: "bg-green-50 text-green-700 border-green-600",
      error: "bg-red-50 text-red-700 border-red-600",
    },
    ghost: {
      base: "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
      loading: "bg-gray-100 text-gray-400",
      success: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
    },
    success: {
      base: "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 focus:ring-green-500",
      loading: "bg-green-400 border-green-400",
      success: "bg-green-600 border-green-600",
      error: "bg-red-600 border-red-600",
    },
    danger: {
      base: "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-500",
      loading: "bg-red-400 border-red-400",
      success: "bg-green-600 border-green-600",
      error: "bg-red-600 border-red-600",
    },
    warning: {
      base: "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600 focus:ring-yellow-500",
      loading: "bg-yellow-400 border-yellow-400",
      success: "bg-green-600 border-green-600",
      error: "bg-red-600 border-red-600",
    },
  };

  // Rounded configurations
  const roundedConfig = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  const currentRounded = roundedConfig[rounded];

  // Determine button state
  let buttonState = "base";
  let displayText = children || "Message";
  let displayIcon = MessageCircle;

  if (loading) {
    buttonState = "loading";
    displayText = loadingText;
    displayIcon = Loader2;
  } else if (success) {
    buttonState = "success";
    displayText = successText;
    displayIcon = Check;
  } else if (error) {
    buttonState = "error";
    displayText = errorText;
    displayIcon = X;
  }

  const Icon = displayIcon;

  const buttonClasses = `
    ${currentSize.padding}
    ${currentSize.text}
    ${currentSize.height}
    ${currentRounded}
    ${currentVariant[buttonState]}
    ${fullWidth ? "w-full" : ""}
    inline-flex items-center justify-center
    font-medium
    border
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transform hover:scale-105 active:scale-95
    ${loading ? "cursor-wait" : "cursor-pointer"}
    ${className}
  `;

  const buttonContent = (
    <>
      {showUserInfo && userPhoto && (
        <img
          src={`http://localhost:5000${userPhoto}`}
          alt={userName}
          className={`${currentSize.icon} rounded-full object-cover mr-2`}
        />
      )}
      {showUserInfo && !userPhoto && (
        <div
          className={`${currentSize.icon} rounded-full bg-gray-300 flex items-center justify-center mr-2`}
        >
          <User
            className={`${currentSize.icon
              .replace("h-", "h-")
              .replace("w-", "w-")} text-gray-600`}
            style={{ width: "60%", height: "60%" }}
          />
        </div>
      )}
      {showIcon && !showUserInfo && (
        <Icon
          className={`${currentSize.icon} ${loading ? "animate-spin" : ""} ${
            displayText ? "mr-2" : ""
          }`}
        />
      )}
      {displayText && <span>{displayText}</span>}
    </>
  );

  const button = (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClasses}
      style={style}
    >
      {buttonContent}
    </button>
  );

  // Add tooltip if enabled
  if (tooltip && userName && !children) {
    return (
      <div className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          Message {userName}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return button;
};

export default MessageButton;
