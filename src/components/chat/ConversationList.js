import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Image, Paperclip, Clock, Zap } from "lucide-react";

const ConversationList = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  currentUserId,
}) => {
  return (
    <div className="divide-y divide-gray-100/50">
      {conversations.map((conversation, index) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedConversationId}
          onSelect={() => onConversationSelect(conversation)}
          currentUserId={currentUserId}
          index={index}
        />
      ))}
    </div>
  );
};

const ConversationItem = ({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
  index,
}) => {
  const otherUser = conversation.otherUser;
  const lastMessage = conversation.lastMessage;
  const hasUnread = conversation.unreadCount > 0;

  const getMessagePreview = () => {
    if (!lastMessage)
      return (
        <div className="flex items-center text-gray-500">
          <Zap className="w-3 h-3 mr-1" />
          <span>Start the conversation</span>
        </div>
      );

    const isCurrentUserSender = lastMessage.sender?.id === currentUserId;

    if (lastMessage.messageType === "image") {
      return (
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded mr-2 flex items-center justify-center">
            <Image className="w-2.5 h-2.5 text-white" />
          </div>
          <span>
            {isCurrentUserSender ? "You sent a photo" : "Sent a photo"}
          </span>
        </div>
      );
    } else if (lastMessage.messageType === "file") {
      return (
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded mr-2 flex items-center justify-center">
            <Paperclip className="w-2.5 h-2.5 text-white" />
          </div>
          <span>
            {isCurrentUserSender
              ? "You sent a file"
              : `Sent ${lastMessage.fileName}`}
          </span>
        </div>
      );
    } else {
      const content = lastMessage.content || "";
      const preview =
        content.length > 40 ? content.substring(0, 40) + "..." : content;
      return isCurrentUserSender ? `You: ${preview}` : preview;
    }
  };

  const getTimeAgo = () => {
    if (!conversation.lastMessageAt) return "";
    try {
      const timeAgo = formatDistanceToNow(
        new Date(conversation.lastMessageAt),
        { addSuffix: false }
      );
      return timeAgo.replace("about ", "").replace(" ago", "");
    } catch (error) {
      return "";
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        group relative p-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 cursor-pointer transition-all duration-300
        ${
          isSelected
            ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 border-r-4 border-blue-500 shadow-lg shadow-blue-100/50"
            : ""
        }
        ${hasUnread ? "bg-gradient-to-r from-blue-25 to-indigo-25" : ""}
        hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-100/30
      `}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeInUp 0.5s ease-out forwards",
      }}
    >
      <div className="flex items-start space-x-4">
        {/* Enhanced Profile Photo */}
        <div className="relative flex-shrink-0">
          <div
            className={`
            relative overflow-hidden transition-all duration-300 group-hover:scale-105
            ${
              isSelected ? "ring-4 ring-blue-200/50" : "ring-2 ring-gray-200/50"
            }
            rounded-2xl
          `}
          >
            {otherUser?.profilePhoto ? (
              <img
                src={`http://localhost:5000${otherUser.profilePhoto}`}
                alt={otherUser.firstName}
                className="w-14 h-14 object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {otherUser?.firstName?.[0]}
                  {otherUser?.lastName?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Online/Activity Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg">
              <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>

          {/* Unread Count Badge */}
          {hasUnread && (
            <div className="absolute -top-2 -right-2">
              <div className="relative">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200/50">
                  <span className="text-white text-xs font-bold">
                    {conversation.unreadCount > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-30"></div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`font-semibold truncate transition-colors duration-200 ${
                hasUnread ? "text-gray-900" : "text-gray-800"
              } ${isSelected ? "text-blue-900" : ""} group-hover:text-blue-800`}
            >
              {otherUser?.firstName} {otherUser?.lastName}
            </h3>
            <div className="flex items-center space-x-2 ml-2">
              {getTimeAgo() && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {getTimeAgo()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div
              className={`text-sm truncate pr-2 transition-colors duration-200 ${
                hasUnread ? "text-gray-900 font-semibold" : "text-gray-600"
              }`}
            >
              {getMessagePreview()}
            </div>

            {/* Enhanced Read Status */}
            {lastMessage && lastMessage.sender?.id === currentUserId && (
              <div className="flex-shrink-0 ml-2">
                {lastMessage.isRead ? (
                  <div className="flex items-center space-x-1">
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">
                      Read
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Check className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium">
                      Sent
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect Line */}
      <div
        className={`
        absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300
        ${isSelected ? "w-full" : "w-0 group-hover:w-full"}
      `}
      ></div>
    </div>
  );
};

export default ConversationList;
