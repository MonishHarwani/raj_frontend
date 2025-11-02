import React, { useState, useEffect } from "react";
import { X, Search, MessageCircle, User } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import api from "../../utils/api";
import LoadingSpinner from "../common/LoadingSpinner";

const NewChatModal = ({ isOpen, onClose, onConversationCreated }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { startConversation } = useChat();

  useEffect(() => {
    if (isOpen) {
      if (searchTerm.trim().length >= 2) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }
  }, [isOpen, searchTerm]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      setCreating(true);
      const conversation = await startConversation(user.id);
      onConversationCreated(conversation);
      onClose();
      setSearchTerm("");
      setUsers([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setUsers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Start New Chat
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Searching users..." />
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  onSelect={handleStartChat}
                  disabled={creating}
                />
              ))}
            </div>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No users found matching "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Search for users to start a conversation
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can search by name or email
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserItem = ({ user, onSelect, disabled }) => {
  return (
    <div
      onClick={() => !disabled && onSelect(user)}
      className={`p-4 hover:bg-gray-50 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="flex items-center space-x-3">
        {user.profilePhoto ? (
          <img
            src={`http://localhost:5000${user.profilePhoto}`}
            alt={user.firstName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </span>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          {user.bio && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
              {user.bio}
            </p>
          )}
        </div>

        {disabled && <div className="text-sm text-gray-500">Starting...</div>}
      </div>
    </div>
  );
};

export default NewChatModal;
