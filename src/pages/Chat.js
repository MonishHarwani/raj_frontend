import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Plus,
  Users,
  ArrowLeft,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import NewChatModal from "../components/chat/NewChatModal";

const Chat = () => {
  const { conversationId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(
    conversationId || null
  );
  const [isMobileView, setIsMobileView] = useState(false);

  const {
    conversations,
    currentConversation,
    loading,
    selectConversation,
    setCurrentConversation,
  } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv.id === conversationId
      );
      if (conversation) {
        selectConversation(conversation);
        setSelectedConversationId(conversationId);
      }
    }
  }, [conversationId, conversations]);

  const handleConversationSelect = (conversation) => {
    selectConversation(conversation);
    setSelectedConversationId(conversation.id);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.otherUser?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conversation.otherUser?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage?.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200/50">
              <MessageCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 flex overflow-hidden"
      style={{ maxHeight: "90vh" }}
    >
      {/* Sidebar - Ultra Modern Design */}
      <div
        className={`
        ${isMobileView ? (selectedConversationId ? "hidden" : "flex") : "flex"}
        ${isMobileView ? "w-full" : "w-80"}
        flex-col backdrop-blur-xl bg-white/80 border-r border-gray-200/50 shadow-xl
      `}
      >
        {/* Glassmorphism Header */}
        <div className="relative">
          {/* Background Blur Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-white/10"></div>

          <div className="relative p-6 text-white">
            {/* Top Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text">
                    Messages
                  </h1>
                  <p className="text-blue-100/80 text-sm font-medium">
                    {conversations.length} active chats
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="group p-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105 active:scale-95"
                  title="Start new chat"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <button className="p-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105 active:scale-95">
                  <Settings2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modern Search Bar */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              currentUserId={user?.id}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <Users className="w-12 h-12 text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No conversations found" : "Ready to connect?"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-sm leading-relaxed">
                {searchTerm
                  ? "Try searching with different keywords"
                  : "Start meaningful conversations with photographers and clients in your network"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-xl shadow-blue-200/50 hover:scale-105 active:scale-95 flex items-center space-x-2"
                >
                  <Zap className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Start Your First Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={`
        ${isMobileView ? (selectedConversationId ? "flex" : "hidden") : "flex"}
        flex-1 flex-col bg-gradient-to-br from-gray-50/50 to-white/80 backdrop-blur-xl
      `}
      >
        {currentConversation ? (
          <ChatWindow
            conversation={currentConversation}
            onBack={handleBackToList}
            isMobile={isMobileView}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200/30">
                  <MessageCircle className="w-16 h-16 text-blue-500" />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                Welcome to Messages
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                Select a conversation from the sidebar or create a new chat to
                start connecting with your network
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="group px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-500 font-semibold shadow-2xl shadow-indigo-200/50 hover:scale-105 active:scale-95 flex items-center space-x-3 mx-auto"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                  <Plus className="w-4 h-4" />
                </div>
                <span>Start New Conversation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConversationCreated={handleConversationSelect}
      />
    </div>
  );
};

export default Chat;
