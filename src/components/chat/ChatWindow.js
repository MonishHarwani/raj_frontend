import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Download,
  Reply,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  Mic,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

const ChatWindow = ({ conversation, onBack, isMobile }) => {
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { messages, sendMessage } = useChat();
  const { startTyping, stopTyping, isUserOnline, isUserTyping } = useSocket();
  const { user } = useAuth();

  const otherUser = conversation.otherUser;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    // Start typing indicator
    startTyping(conversation.id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation.id);
    }, 3000);
  };

  const handleSend = async () => {
    if ((!messageInput.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      stopTyping(conversation.id);

      await sendMessage(
        otherUser.id,
        messageInput.trim(),
        selectedFile,
        replyTo?.id
      );

      setMessageInput("");
      setSelectedFile(null);
      setReplyTo(null);

      // Reset textarea height
      const textarea = document.querySelector("#message-input");
      if (textarea) {
        textarea.style.height = "auto";
      }

      // scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const getDateSeparator = (date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <Link
              to={`/profile/${otherUser.id}`}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                {otherUser.profilePhoto ? (
                  <img
                    src={`http://localhost:5000${otherUser.profilePhoto}`}
                    alt={otherUser.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {otherUser.firstName?.[0]}
                      {otherUser.lastName?.[0]}
                    </span>
                  </div>
                )}

                {isUserOnline(otherUser.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  {otherUser.firstName} {otherUser.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  {isUserTyping(otherUser.id, conversation.id)
                    ? "typing..."
                    : isUserOnline(otherUser.id)
                    ? "Online"
                    : "Click to view profile"}
                </p>
              </div>
            </Link>
          </div>

          {/* <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Video className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div> */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date} className="space-y-4">
            {/* Date separator */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {getDateSeparator(new Date(date))}
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.sender.id === user?.id}
                onReply={handleReply}
                showAvatar={
                  index === 0 ||
                  dayMessages[index - 1].sender.id !== message.sender.id
                }
              />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {isUserTyping(otherUser.id, conversation.id) && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {otherUser.firstName?.[0]}
                </span>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 message-text-input-area">
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-700">
                Replying to {replyTo.sender.firstName}
              </span>
              <button
                onClick={cancelReply}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-blue-600 line-clamp-2">
              {replyTo.messageType === "image"
                ? "📷 Image"
                : replyTo.messageType === "file"
                ? `📎 ${replyTo.fileName}`
                : replyTo.content}
            </p>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile.type.startsWith("image/") ? (
                  <ImageIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <Paperclip className="h-5 w-5 text-green-600" />
                )}
                <span className="text-sm text-green-800 truncate max-w-xs">
                  {selectedFile.name}
                </span>
              </div>
              <button
                onClick={removeSelectedFile}
                className="text-green-400 hover:text-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              id="message-input"
              value={messageInput}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-32 bg-gray-50"
              style={{ minHeight: "48px" }}
              disabled={sending}
            />

            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              disabled={sending}
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={(!messageInput.trim() && !selectedFile) || sending}
              className={`p-3 rounded-full transition-all duration-200 ${
                (messageInput.trim() || selectedFile) && !sending
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isCurrentUser, onReply, showAvatar }) => {
  console.log("monish this is the message ");
  console.log(message);
  const getTimeAgo = () => {
    try {
      return format(new Date(message.createdAt), "HH:mm");
    } catch (error) {
      return "";
    }
  };

  const renderMessageContent = () => {
    if (message.messageType === "images") {
      return (
        <div className="max-w-sm">
          <img
            src={`http://localhost:5000${message.fileUrl}`}
            alt="Shared image"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() =>
              window.open(`http://localhost:5000${message.fileUrl}`, "_blank")
            }
          />
          {message.content && <p className="mt-2 text-sm">{message.content}</p>}
        </div>
      );
    } else if (message.messageType === "files") {
      return (
        <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-10 rounded-lg min-w-[200px]">
          <Paperclip className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{message.fileName}</p>
            <a
              href={`http://localhost:5000${message.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs opacity-75 hover:opacity-100 flex items-center mt-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
      );
    }
  };

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      } group`}
    >
      <div
        className={`flex ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        } items-end space-x-2 max-w-xs lg:max-w-md`}
      >
        {/* Avatar */}
        {!isCurrentUser && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-1">
            <span className="text-white text-xs font-medium">
              {message.sender.firstName?.[0]}
            </span>
          </div>
        )}
        {!isCurrentUser && !showAvatar && <div className="w-8"></div>}

        <div className="flex flex-col">
          {/* Reply Preview */}
          {message.replyTo && (
            <div
              className={`mb-2 p-2 bg-gray-100 rounded-lg text-xs max-w-xs ${
                isCurrentUser ? "ml-4" : "mr-4"
              }`}
            >
              <p className="font-medium text-gray-600">
                {message.replyTo.sender.firstName}
              </p>
              <p className="text-gray-500 line-clamp-1">
                {message.replyTo.messageType === "image"
                  ? "📷 Image"
                  : message.replyTo.messageType === "file"
                  ? `📎 ${message.replyTo.fileName}`
                  : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message */}
          <div
            className={`px-4 py-3 rounded-2xl relative shadow-sm ${
              isCurrentUser
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : "bg-white text-gray-900 border border-gray-200"
            } ${isCurrentUser ? "rounded-br-md" : "rounded-bl-md"}`}
          >
            {renderMessageContent()}

            <div
              className={`text-xs mt-2 flex items-center ${
                isCurrentUser
                  ? "justify-end text-blue-100"
                  : "justify-start text-gray-500"
              }`}
            >
              <span>{getTimeAgo()}</span>
              {isCurrentUser && (
                <span className="ml-2">{message.isRead ? "✓✓" : "✓"}</span>
              )}
            </div>

            {/* Reply button */}
            <button
              onClick={() => onReply(message)}
              className={`absolute -top-2 ${
                isCurrentUser ? "-left-8" : "-right-8"
              } 
                opacity-0 group-hover:opacity-100 transition-opacity
                p-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-lg border`}
            >
              <Reply className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
