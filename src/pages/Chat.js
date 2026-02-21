import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Plus,
  Users,
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
    conversationId || null,
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

  /* -------------------------------------------------- */
  /* RESPONSIVE CHECK */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* -------------------------------------------------- */
  /* OPEN CONVERSATION FROM URL */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => String(conv.id) === String(conversationId),
      );

      if (conversation) {
        selectConversation(conversation);
        setSelectedConversationId(conversationId);
      }
    }
  }, [conversationId, conversations]);

  /* -------------------------------------------------- */
  /* SELECT CONVERSATION */
  /* -------------------------------------------------- */

  const handleConversationSelect = (conversation) => {
    selectConversation(conversation);
    setSelectedConversationId(conversation.id);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  /* -------------------------------------------------- */
  /* SEARCH FILTER */
  /* -------------------------------------------------- */

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
        .includes(searchTerm.toLowerCase()),
  );

  /* -------------------------------------------------- */
  /* LOADING */
  /* -------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ maxHeight: "90vh" }}
    >
      {/* Sidebar */}
      <div
        className={`
          ${isMobileView ? (selectedConversationId ? "hidden" : "flex") : "flex"}
          ${isMobileView ? "w-full" : "w-80"}
          flex-col bg-white border-r shadow-lg
        `}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-sm opacity-80">
                {conversations.length} active chats
              </p>
            </div>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 opacity-70" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 placeholder-white/70 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            currentUserId={user?.id}
          />
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={`
          ${isMobileView ? (selectedConversationId ? "flex" : "hidden") : "flex"}
          flex-1 flex-col
        `}
      >
        {currentConversation ? (
          <ChatWindow
            conversation={currentConversation}
            onBack={handleBackToList}
            isMobile={isMobileView}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start chatting
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
