"use client";

import { UserStatusIndicator } from "@/components/Chat/UserStatusIndicator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import { Input } from "@/components/shadcnui/input";
import { ScrollArea } from "@/components/shadcnui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  LoaderIcon,
  MessageSquareIcon,
  PencilIcon,
  SearchIcon,
  SendHorizonalIcon,
  SmileIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// Types
interface ChatUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: "online" | "offline" | "idle" | "dnd";
  lastSeenAt: string;
  role?: string;
}

interface Conversation {
  id: string;
  otherUser: ChatUser;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; username: string };
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sender: ChatUser;
  reactions: Reaction[];
}

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "😢", "😮", "🔥", "👏"];

const ChatPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [profileSidebar, setProfileSidebar] = useState(false);
  const [myStatus, setMyStatus] = useState(user?.status || "offline");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string, cursor?: string | null) => {
      try {
        const params = new URLSearchParams({ conversationId });
        if (cursor) params.set("cursor", cursor);
        if (!cursor) setIsLoading(true);

        const res = await fetch(`/api/chat/messages?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (cursor) {
            setMessages((prev) => [...data.messages, ...prev]);
          } else {
            setMessages(data.messages);
          }
          setNextCursor(data.nextCursor);
        }
      } catch {
        //
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Get current user ID from session
  const getMyId = useCallback(() => {
    // The useAuth hook should provide the user
    return user?.id || "";
  }, [user]);

  // Load user data on mount
  useEffect(() => {
    if (!authLoading && user) {
      setMyStatus(String(user.status || "offline"));
      fetchConversations().finally(() => setIsLoading(false));
    }
  }, [authLoading, user, fetchConversations]);

  // Poll for new messages every 3 seconds when conversation is active
  useEffect(() => {
    if (!selectedConvId && !selectedUserId) return;

    const poll = async () => {
      if (selectedConvId) {
        // Only get latest messages (not full reload)
        await fetchMessages(selectedConvId);
      }
    };

    pollIntervalRef.current = setInterval(poll, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConvId, selectedUserId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select a conversation
  const selectConversation = (convId: string, otherUserId: string) => {
    setSelectedConvId(convId);
    setSelectedUserId(otherUserId);
    setMessages([]);
    setNextCursor(null);
    setShowEmojiPicker(null);
    setProfileSidebar(false);
    fetchMessages(convId);
  };

  // Start a new conversation with a user
  const startConversation = async (otherUserId: string) => {
    setShowUserSearch(false);
    setSelectedConvId(null);
    setSelectedUserId(otherUserId);
    setMessages([]);
    setNextCursor(null);

    // Check for existing conversation
    const existing = conversations.find((c) => c.otherUser.id === otherUserId);
    if (existing) {
      selectConversation(existing.id, otherUserId);
      return;
    }

    // No messages yet - just set the user
    setIsLoading(false);
  };

  // Send a message
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUserId || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: messageText.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageText("");
        // Reload conversations and messages
        await fetchConversations();
        if (data.message?.conversationId) {
          setSelectedConvId(data.message.conversationId);
          await fetchMessages(data.message.conversationId);
        }
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSending(false);
    }
  };

  // Search users
  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/chat/users?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users);
      }
    } catch {
      //
    }
  };

  // Edit a message
  const editMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch("/api/chat/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, content: editText.trim() }),
      });

      if (res.ok) {
        setEditingMessageId(null);
        setEditText("");
        if (selectedConvId) await fetchMessages(selectedConvId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to edit message");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/delete?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (selectedConvId) await fetchMessages(selectedConvId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // React to a message
  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch("/api/chat/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });

      if (res.ok) {
        if (selectedConvId) await fetchMessages(selectedConvId);
      }
    } catch {
      //
    }
  };

  // Update own status
  const updateMyStatus = async (newStatus: string) => {
    try {
      await fetch("/api/chat/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setMyStatus(newStatus as "online" | "offline" | "idle" | "dnd");
    } catch {
      //
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = () => {
    if (!nextCursor || isLoadingMore || !selectedConvId) return;
    setIsLoadingMore(true);
    fetchMessages(selectedConvId, nextCursor);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        editMessage(editingMessageId);
      } else {
        sendMessage();
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="mb-2 text-xl font-bold">Please Log In</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to use the chat.
          </p>
          <Button onClick={() => (window.location.href = "/auth")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const myId = getMyId();

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div
        className={cn(
          "flex w-full flex-col border-r md:w-80",
          selectedUserId && "hidden md:flex",
        )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Messages</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserSearch(!showUserSearch)}>
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Search */}
        {showUserSearch && (
          <div className="border-b p-3">
            <Input
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Search users by name or email..."
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u.id)}
                    className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(u.displayName || u.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {u.displayName || u.username}
                        </span>
                        <UserStatusIndicator
                          status={u.status}
                          size="sm"
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        @{u.username}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {isLoading ?
            <div className="flex items-center justify-center p-8">
              <LoaderIcon className="h-6 w-6 animate-spin" />
            </div>
          : conversations.length === 0 ?
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquareIcon className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No conversations yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Search for a user to start chatting
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowUserSearch(true)}>
                <SearchIcon className="mr-1 h-3 w-3" /> Find Users
              </Button>
            </div>
          : conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id, conv.otherUser.id)}
                className={cn(
                  "hover:bg-accent/50 flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors",
                  selectedConvId === conv.id && "bg-accent",
                )}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conv.otherUser.avatarUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(
                      conv.otherUser.displayName || conv.otherUser.username,
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {conv.otherUser.displayName || conv.otherUser.username}
                      </span>
                      <UserStatusIndicator
                        status={conv.otherUser.status}
                        size="sm"
                      />
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {conv.lastMessage ?
                        formatTime(conv.lastMessage.createdAt)
                      : ""}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {conv.lastMessage ?
                      conv.lastMessage.senderId === myId ?
                        `You: ${conv.lastMessage.content}`
                      : conv.lastMessage.content
                    : "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          }
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          !selectedUserId && "hidden md:flex",
        )}>
        {selectedUserId ?
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedConvId(null);
                  }}>
                  <ChevronLeftIcon className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      conversations.find((c) => c.id === selectedConvId)
                        ?.otherUser?.avatarUrl || undefined
                    }
                  />
                  <AvatarFallback className="text-xs">?</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {conversations.find((c) => c.id === selectedConvId)
                      ?.otherUser?.displayName || "User"}
                  </p>
                  {conversations.find((c) => c.id === selectedConvId)?.otherUser
                    ?.lastSeenAt && (
                    <p className="text-muted-foreground text-xs">
                      Last seen{" "}
                      {formatTime(
                        conversations.find((c) => c.id === selectedConvId)
                          ?.otherUser?.lastSeenAt || "",
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea
              className="flex-1 px-4 py-2"
              ref={messagesContainerRef}>
              <div className="flex flex-col gap-1">
                {/* Load more */}
                {nextCursor && (
                  <div className="flex justify-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreMessages}
                      disabled={isLoadingMore}>
                      {isLoadingMore ?
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      : "Load earlier messages"}
                    </Button>
                  </div>
                )}

                {/* Date separator */}
                {messages.length > 0 && (
                  <div className="flex justify-center py-2">
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-xs">
                      {new Date(messages[0].createdAt).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </Badge>
                  </div>
                )}

                {isLoading ?
                  <div className="flex items-center justify-center py-12">
                    <LoaderIcon className="h-8 w-8 animate-spin" />
                  </div>
                : messages.length === 0 ?
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquareIcon className="text-muted-foreground mb-2 h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      No messages yet. Send your first message!
                    </p>
                  </div>
                : messages.map((msg, idx) => {
                    const isMine = msg.senderId === myId;
                    const showSender =
                      idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "group relative flex max-w-[85%] flex-col gap-1",
                          isMine ? "ml-auto items-end" : "items-start",
                          showSender && "mt-3",
                        )}
                        onMouseLeave={() => setShowEmojiPicker(null)}>
                        {/* Sender name */}
                        {showSender && !isMine && (
                          <span className="text-muted-foreground ml-1 text-xs font-medium">
                            {msg.sender.displayName || msg.sender.username}
                          </span>
                        )}

                        <div
                          className={cn(
                            "relative rounded-2xl px-3 py-2",
                            isMine ?
                              "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md",
                            msg.isDeleted && "italic opacity-50",
                          )}>
                          {msg.isDeleted ?
                            <span className="text-xs">[Message deleted]</span>
                          : <>
                              <p className="text-sm break-words">
                                {msg.content}
                              </p>
                              <div
                                className={cn(
                                  "mt-1 flex items-center gap-2",
                                  isMine ? "justify-end" : "justify-start",
                                )}>
                                {msg.isEdited && (
                                  <span className="text-[10px] opacity-70">
                                    (edited)
                                  </span>
                                )}
                                <span className="text-[10px] opacity-70">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>

                              {/* Reactions */}
                              {msg.reactions.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(() => {
                                    const grouped = msg.reactions.reduce(
                                      (acc, r) => {
                                        if (!acc[r.emoji]) acc[r.emoji] = [];
                                        acc[r.emoji].push(r.user.username);
                                        return acc;
                                      },
                                      {} as Record<string, string[]>,
                                    );
                                    return Object.entries(grouped).map(
                                      ([emoji, users]) => (
                                        <button
                                          key={emoji}
                                          onClick={() =>
                                            reactToMessage(msg.id, emoji)
                                          }
                                          className={cn(
                                            "hover:bg-accent flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                                            (
                                              users.includes(
                                                user?.username || "",
                                              )
                                            ) ?
                                              "border-primary bg-primary/10"
                                            : "",
                                          )}>
                                          {emoji}{" "}
                                          <span className="text-muted-foreground">
                                            {users.length}
                                          </span>
                                        </button>
                                      ),
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          }
                        </div>

                        {/* Message actions (on hover) */}
                        {!msg.isDeleted && (
                          <div
                            className={cn(
                              "absolute top-0 hidden gap-1 group-hover:flex",
                              isMine ? "-left-12" : "-right-12",
                            )}>
                            {/* Emoji picker button */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  setShowEmojiPicker(
                                    showEmojiPicker === msg.id ? null : msg.id,
                                  )
                                }>
                                <SmileIcon className="h-3 w-3" />
                              </Button>
                              {showEmojiPicker === msg.id && (
                                <div
                                  className={cn(
                                    "bg-popover absolute top-0 z-50 flex gap-1 rounded-lg border p-1.5 shadow-md",
                                    isMine ? "right-full mr-1" : (
                                      "left-full ml-1"
                                    ),
                                  )}>
                                  {EMOJI_LIST.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        reactToMessage(msg.id, emoji);
                                        setShowEmojiPicker(null);
                                      }}
                                      className="hover:bg-accent rounded p-1 text-sm transition-colors">
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Edit button (own messages only) */}
                            {isMine && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditText(msg.content);
                                }}>
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Delete button (own messages only) */}
                            {isMine && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-600"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Delete this message for everyone?",
                                    )
                                  ) {
                                    deleteMessage(msg.id);
                                  }
                                }}>
                                <Trash2Icon className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                }

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Edit mode indicator */}
            {editingMessageId && (
              <div className="bg-accent/50 flex items-center justify-between border-t px-4 py-2">
                <span className="text-sm">
                  <PencilIcon className="mr-1 inline h-3 w-3" />
                  Editing message
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingMessageId(null);
                    setEditText("");
                  }}>
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Input
                  ref={messageInputRef}
                  value={editingMessageId ? editText : messageText}
                  onChange={(e) =>
                    editingMessageId ?
                      setEditText(e.target.value)
                    : setMessageText(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder={
                    editingMessageId ?
                      "Edit your message..."
                    : "Type a message..."
                  }
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (editingMessageId) {
                      editMessage(editingMessageId);
                    } else {
                      sendMessage();
                    }
                  }}
                  disabled={
                    editingMessageId ?
                      !editText.trim()
                    : !messageText.trim() || isSending
                  }
                  size="icon"
                  title="Send message">
                  {isSending ?
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  : <SendHorizonalIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        : /* No conversation selected */
          <div className="flex hidden h-full flex-col items-center justify-center md:flex">
            <MessageSquareIcon className="text-muted-foreground mb-4 h-16 w-16" />
            <h3 className="mb-1 text-lg font-semibold">Your Messages</h3>
            <p className="text-muted-foreground mb-6 max-w-xs text-center text-sm">
              Select a conversation from the sidebar or search for a user to
              start chatting.
            </p>
            <Button onClick={() => setShowUserSearch(true)}>
              <SearchIcon className="mr-2 h-4 w-4" /> New Conversation
            </Button>
          </div>
        }
      </div>
    </div>
  );
};

export default ChatPage;
