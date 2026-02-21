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

  const { isAuthenticated, user } = useAuth();
  const { socket, joinChat } = useSocket();

  /* -------------------------------------------------- */
  /* LOAD CONVERSATIONS */
  /* -------------------------------------------------- */
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio("/notification.mp3");
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);
  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.7;

    audio.play().catch((err) => {
      console.log("Sound blocked by browser:", err);
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

  /* -------------------------------------------------- */
  /* DERIVED TOTAL UNREAD COUNT (NO STATE NEEDED) */
  /* -------------------------------------------------- */

  const totalUnreadCount = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0,
  );

  /* -------------------------------------------------- */
  /* SOCKET LISTENER (STABLE VERSION) */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const isMyMessage = message.sender?.id === user?.id;

      setConversations((prev) => {
        return prev
          .map((conv) => {
            if (String(conv.id) !== String(message.conversationId)) {
              return conv;
            }

            return {
              ...conv,
              unreadCount: isMyMessage
                ? conv.unreadCount
                : (conv.unreadCount || 0) + 1,
              lastMessage: message,
              lastMessageAt: message.createdAt,
            };
          })
          .sort(
            (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
          );
      });

      // 🔔 PLAY SOUND ONLY IF:
      // - Not my message
      // - Not currently open chat
      const isCurrentOpen =
        currentConversation &&
        String(currentConversation.id) === String(message.conversationId);

      if (!isMyMessage && !isCurrentOpen) {
        playNotificationSound();
      }

      if (isCurrentOpen) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, user?.id, currentConversation?.id]);

  /* -------------------------------------------------- */
  /* LOAD MESSAGES */
  /* -------------------------------------------------- */

  const loadMessages = async (conversationId, page = 1) => {
    try {
      const response = await api.get(
        `/messages/conversations/${conversationId}?page=${page}`,
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

  /* -------------------------------------------------- */
  /* SEND MESSAGE */
  /* -------------------------------------------------- */

  const sendMessage = async (
    receiverId,
    content,
    file = null,
    replyToId = null,
  ) => {
    try {
      const formData = new FormData();
      formData.append("receiverId", receiverId);
      if (content) formData.append("content", content);
      if (file) formData.append("file", file);
      if (replyToId) formData.append("replyToId", replyToId);

      const response = await api.post("/messages/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newMessage = response.data.data;

      // Optimistic UI update
      if (currentConversation) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }

      setConversations((prev) =>
        prev
          .map((conv) =>
            String(conv.id) === String(newMessage.conversationId)
              ? {
                  ...conv,
                  lastMessage: newMessage,
                  lastMessageAt: newMessage.createdAt,
                }
              : conv,
          )
          .sort(
            (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
          ),
      );

      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  /* -------------------------------------------------- */
  /* MARK AS READ */
  /* -------------------------------------------------- */

  const markAsRead = async (conversationId) => {
    try {
      await api.patch(`/messages/conversations/${conversationId}/read`);

      setConversations((prev) =>
        prev.map((conv) =>
          String(conv.id) === String(conversationId)
            ? { ...conv, unreadCount: 0 }
            : conv,
        ),
      );

      if (
        currentConversation &&
        String(currentConversation.id) === String(conversationId)
      ) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            isRead: true,
          })),
        );
      }

      if (socket) {
        socket.emit("messageRead", { conversationId });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  /* -------------------------------------------------- */
  /* START CONVERSATION */
  /* -------------------------------------------------- */

  const startConversation = async (userId) => {
    try {
      const response = await api.post("/messages/conversations/start", {
        userId,
      });

      const conversation = response.data.conversation;

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      return conversation;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  };

  /* -------------------------------------------------- */
  /* SELECT CONVERSATION */
  /* -------------------------------------------------- */

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);

    if (socket) {
      joinChat(conversation.id);
    }

    await loadMessages(conversation.id);
    await markAsRead(conversation.id);
  };

  /* -------------------------------------------------- */
  /* CONTEXT VALUE */
  /* -------------------------------------------------- */

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
