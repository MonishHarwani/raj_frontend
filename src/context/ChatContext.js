import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import api from "../utils/api";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const { socket, joinChat } = useSocket();

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Calculate total unread count
    const total = conversations.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
    setTotalUnreadCount(total);
  }, [conversations]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on("newMessage", (message) => {
        console.log(
          "🔥 Received newMessage:",
          message.id,
          "for conversation:",
          message.conversationId
        );

        // CRITICAL FIX: Check if message is from current user to prevent duplicates
        const isMyMessage = message.sender?.id === user?.id;

        if (
          currentConversation &&
          message.conversationId === currentConversation.id
        ) {
          console.log("👍 Adding to current conversation");

          // Only add if it's not my own message (since we already added it optimistically)
          // OR if we didn't add it yet (safety check)
          setMessages((prev) => {
            // Check if message already exists
            const exists = prev.some((msg) => msg.id === message.id);
            if (exists) {
              console.log("⚠️ Message already exists, skipping duplicate");
              return prev;
            }
            return [...prev, message];
          });

          // Only mark as read if it's not my message
          if (!isMyMessage) {
            markAsRead(currentConversation.id);
          }
        } else {
          console.log("📝 Updating sidebar conversation");

          setConversations((prev) => {
            // 1. Update the right conversation
            const updated = prev.map((conv) =>
              conv.id === message.conversationId
                ? {
                    ...conv,
                    unreadCount: isMyMessage
                      ? conv.unreadCount
                      : (conv.unreadCount || 0) + 1,
                    lastMessage: message,
                    lastMessageAt: message.createdAt,
                  }
                : conv
            );
            // 2. Sort with latest at top
            updated.sort(
              (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
            );
            return updated;
          });

          // 3. Only play sound and show notification for received messages, not sent
          if (!isMyMessage) {
            playNotificationSound();

            // 4. Show browser notification (if allowed)
            if (Notification.permission === "granted") {
              new Notification("New Message", {
                body: `${
                  message?.sender?.firstName || "Someone"
                }: ${message.content?.slice(0, 50)}`,
              });
            }
          }
        }
      });

      // Listen for message read receipts
      socket.on("messageRead", ({ conversationId, messageId }) => {
        if (currentConversation && conversationId === currentConversation.id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            )
          );
        }
      });

      return () => {
        socket.off("newMessage");
        socket.off("messageRead");
      };
    }
  }, [socket, currentConversation, user]);

  const playNotificationSound = () => {
    const audio = new window.Audio("/notification.mp3");
    audio.play().catch((err) => {
      console.log("Audio play blocked!", err);
    });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/messages/conversations");
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, page = 1) => {
    try {
      const response = await api.get(
        `/messages/conversations/${conversationId}?page=${page}`
      );
      if (page === 1) {
        setMessages(response.data.messages || []);
      } else {
        setMessages((prev) => [...response.data.messages, ...prev]);
      }
      return response.data;
    } catch (error) {
      console.error("Error loading messages:", error);
      return { messages: [], hasMore: false };
    }
  };

  const sendMessage = async (
    receiverId,
    content,
    file = null,
    replyToId = null
  ) => {
    try {
      const formData = new FormData();
      formData.append("receiverId", receiverId);
      if (content) formData.append("content", content);
      if (file) formData.append("file", file);
      if (replyToId) formData.append("replyToId", replyToId);

      const response = await api.post("/messages/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newMessage = response.data.data;

      // IMPORTANT: Add message immediately for better UX (optimistic update)
      // This message will be deduplicated in the socket listener if it comes back
      if (currentConversation) {
        setMessages((prev) => {
          // Check if already exists (shouldn't, but safety check)
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }

      // Update conversations list - move this conversation to top
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === newMessage.conversationId
            ? {
                ...conv,
                lastMessage: newMessage,
                lastMessageAt: newMessage.createdAt,
              }
            : conv
        );
        updated.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
        return updated;
      });

      // Socket emission is handled by backend, no need to emit here
      // The backend will broadcast to other users, and we'll receive it via 'newMessage' event
      // But we use the duplicate check to prevent adding it twice

      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await api.patch(`/messages/conversations/${conversationId}/read`);

      // Update conversations list to reflect read status
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Mark messages as read in current conversation
      if (currentConversation?.id === conversationId) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }

      // Emit read receipt via socket
      if (socket) {
        socket.emit("messageRead", { conversationId });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const startConversation = async (userId) => {
    try {
      const response = await api.post("/messages/conversations/start", {
        userId,
      });
      const conversation = response.data.conversation;

      // Add to conversations if not exists
      setConversations((prev) => {
        const exists = prev.find((conv) => conv.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      return conversation;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  };

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);

    // Join socket room for this conversation
    if (socket) {
      joinChat(conversation.id);
    }

    await loadMessages(conversation.id);
    await markAsRead(conversation.id);
  };

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    totalUnreadCount,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    startConversation,
    selectConversation,
    setCurrentConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
