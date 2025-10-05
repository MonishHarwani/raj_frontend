import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Send, ArrowLeft, User, Search, MoreVertical } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDateTime, generateChatId } from "../utils/helpers";

const Chat = () => {
  const { chatId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const {
    socket,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    isUserTyping,
  } = useSocket();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadChatMessages(chatId);
      setSelectedChat(chatId);
      joinChat(chatId);
    }
  }, [chatId, joinChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on("newMessage", (message) => {
        if (message.chatId === selectedChat) {
          setMessages((prev) => [...prev, message]);
        }
        // Update conversation list
        loadConversations();
      });

      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get("/messages/conversations");
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    try {
      // Find the other user in the chat
      const otherUserId = selectedChat
        .split("_")
        .find((id) => parseInt(id) !== user.id);

      const messageData = {
        receiverId: parseInt(otherUserId),
        content: messageContent,
        chatId: selectedChat,
      };

      // Send via socket for real-time delivery
      sendMessage(messageData);

      // Also send via API for persistence
      await api.post("/messages", messageData);

      stopTyping(selectedChat);
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = () => {
    if (selectedChat) {
      startTyping(selectedChat);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.partner &&
      `${conv.partner.firstName} ${conv.partner.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading && conversations.length === 0) {
    return <LoadingSpinner text="Loading conversations..." />;
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div
        className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.chatId}
                conversation={conversation}
                isSelected={selectedChat === conversation.chatId}
                onClick={() => {
                  setSelectedChat(conversation.chatId);
                  loadChatMessages(conversation.chatId);
                  joinChat(conversation.chatId);
                }}
                isOnline={isUserOnline(conversation.partner?.id)}
              />
            ))
          ) : (
            <div className="text-center p-8">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-600">
                Start a conversation by applying to a job or contacting a
                photographer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          selectedChat ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={conversations.find(
                (c) => c.chatId === selectedChat
              )}
              onBack={() => setSelectedChat(null)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center">
                  <LoadingSpinner size="sm" text="Loading messages..." />
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={message.id || index}
                    message={message}
                    isOwn={message.senderId === user.id}
                    showAvatar={
                      index === 0 ||
                      messages[index - 1].senderId !== message.senderId
                    }
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput
              value={newMessage}
              onChange={(value) => {
                setNewMessage(value);
                handleTyping();
              }}
              onSend={handleSendMessage}
              disabled={sendingMessage}
              placeholder="Type a message..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationItem = ({ conversation, isSelected, onClick, isOnline }) => {
  if (!conversation.partner) return null;

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {conversation.partner.profilePhoto ? (
            <img
              src={conversation.partner.profilePhoto}
              alt={conversation.partner.firstName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {conversation.partner.firstName} {conversation.partner.lastName}
            </h3>
            <span className="text-xs text-gray-500">
              {formatDateTime(conversation.lastMessage.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage.sender.id === conversation.partner.id
                ? ""
                : "You: "}
              {conversation.lastMessage.content}
            </p>
            {conversation.unreadCount > 0 && (
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {conversation.unreadCount > 9
                    ? "9+"
                    : conversation.unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatHeader = ({ conversation, onBack }) => {
  if (!conversation?.partner) return null;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Link
            to={`/profile/${conversation.partner.id}`}
            className="flex items-center space-x-3"
          >
            {conversation.partner.profilePhoto ? (
              <img
                src={conversation.partner.profilePhoto}
                alt={conversation.partner.firstName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}

            <div>
              <h2 className="font-medium text-gray-900">
                {conversation.partner.firstName} {conversation.partner.lastName}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.partner.role === "photographer"
                  ? "Photographer"
                  : "Client"}
              </p>
            </div>
          </Link>
        </div>

        <button className="text-gray-500 hover:text-gray-700">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwn, showAvatar }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
          isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"
        }`}
      >
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0">
            {message.sender?.profilePhoto ? (
              <img
                src={message.sender.profilePhoto}
                alt={message.sender.firstName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        )}

        {!isOwn && !showAvatar && <div className="w-8 h-8 flex-shrink-0"></div>}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-200 text-gray-900 rounded-bl-md"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          <p
            className={`text-xs mt-1 ${
              isOwn ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageInput = ({ value, onChange, onSend, disabled, placeholder }) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSend={onSend} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="form-input resize-none"
            rows={1}
            style={{
              minHeight: "44px",
              maxHeight: "120px",
              overflowY: value.split("\n").length > 3 ? "scroll" : "hidden",
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(e);
              }
            }}
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="btn btn-primary p-3"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
