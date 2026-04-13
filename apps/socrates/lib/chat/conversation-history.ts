export type ConversationMessage = {
  role: string;
  content: string;
};

declare global {
  var socratesConversationHistory:
    | Map<string, ConversationMessage[]>
    | undefined;
}

export function getConversationHistoryStore(): Map<string, ConversationMessage[]> {
  if (!globalThis.socratesConversationHistory) {
    globalThis.socratesConversationHistory = new Map();
  }

  return globalThis.socratesConversationHistory;
}
