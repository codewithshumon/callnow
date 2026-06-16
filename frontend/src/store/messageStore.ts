"use client";

import { create } from "zustand";
import type { Conversation, Message, MessageStatus } from "@/lib/types";

interface MessageState {
  // ── State ──────────────────────────────────────────────
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId → messages
  unreadCounts: Record<string, number>; // conversationId → count
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // ── Actions ─────────────────────────────────────────────
  setConversations: (list: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addInboundMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  markRead: (conversationId: string) => void;
  incrementUnread: (conversationId: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setLoadingConversations: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
}

export const useMessageStore = create<MessageState>()((set) => ({
  // ── Initial state ──────────────────────────────────────
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCounts: {},
  isLoadingConversations: false,
  isLoadingMessages: false,

  // ── Actions ─────────────────────────────────────────────

  setConversations: (list) => set({ conversations: list }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, msgs) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: msgs },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Avoid duplicates (same providerSid)
      if (
        message.providerSid &&
        existing.some((m) => m.providerSid === message.providerSid)
      ) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),

  /** Add an inbound message AND increment unread count. Convenience action. */
  addInboundMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      if (
        message.providerSid &&
        existing.some((m) => m.providerSid === message.providerSid)
      ) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
        unreadCounts: {
          ...state.unreadCounts,
          // Only bump if NOT the active conversation
          [conversationId]:
            conversationId === state.activeConversationId
              ? state.unreadCounts[conversationId] || 0
              : (state.unreadCounts[conversationId] || 0) + 1,
        },
      };
    }),

  updateMessageStatus: (messageId, status) =>
    set((state) => {
      const updated: Record<string, Message[]> = {};
      for (const [convId, msgs] of Object.entries(state.messages)) {
        updated[convId] = msgs.map((m) =>
          m.id === messageId ? { ...m, status } : m
        );
      }
      return { messages: updated };
    }),

  markRead: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),

  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
}));
