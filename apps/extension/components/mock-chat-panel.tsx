import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@sisi-agent/ui";
import { useEffect, useRef, useState } from "react";

type MockMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type MockChatPanelProps = {
  shellClassName: string;
  subtitle: string;
  badgeLabel?: string;
};

type PromptSubmission = {
  text: string;
};

const initialMessages: MockMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "This is a local mock chat inside the extension. The interface is live, but it is not connected to the backend yet.",
  },
];

const mockReplies = [
  "Mock mode is active, so this response is generated entirely in the extension UI.",
  "The layout and interaction flow are ready. The next step later is replacing this canned responder with the real chat transport.",
  "This conversation is using the shared monorepo UI package, so the same primitives can be reused across surfaces.",
  "The sidebar is intentionally local-first for now so the extension shell can be validated before wiring any model calls.",
] as const;

export function MockChatPanel({
  shellClassName,
  subtitle,
  badgeLabel = "Mock",
}: MockChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [isResponding, setIsResponding] = useState(false);
  const replyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = ({ text }: PromptSubmission) => {
    const content = text.trim();

    if (!content || isResponding) {
      return;
    }

    const userMessage: MockMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content,
    };

    const assistantMessage: MockMessage = {
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: `${mockReplies[messages.length % mockReplies.length]} You said: "${content}".`,
    };

    setMessages((current) => [...current, userMessage]);
    setIsResponding(true);

    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, assistantMessage]);
      setIsResponding(false);
      replyTimerRef.current = null;
    }, 700);
  };

  return (
    <div className={shellClassName}>
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Sisi Agent
            </p>
            <div>
              <h1 className="text-sm font-medium text-foreground">Extension Chat</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span className="border border-border bg-secondary px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {badgeLabel}
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="gap-4 px-4 py-5">
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </div>
                <MessageContent>{message.content}</MessageContent>
              </Message>
            ))}

            {isResponding ? (
              <Message from="assistant">
                <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Assistant
                </div>
                <MessageContent>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span className="size-1.5 animate-pulse bg-current" />
                    <span className="size-1.5 animate-pulse bg-current [animation-delay:120ms]" />
                    <span className="size-1.5 animate-pulse bg-current [animation-delay:240ms]" />
                  </span>
                </MessageContent>
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border bg-background/90 p-3">
          <PromptInput className="w-full" onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                disabled={isResponding}
                placeholder="Ask the extension something..."
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <span className="text-[11px] text-muted-foreground">
                  Enter to send, Shift+Enter for a new line
                </span>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isResponding}
                status={isResponding ? "submitted" : "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>
    </div>
  );
}
