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
	parts: { type: "text"; text: string }[];
};

type ChatPanelProps = {
	shellClassName?: string;
	subtitle: string;
	badgeLabel?: string;
};

const initialMessages: MockMessage[] = [
	{
		id: "welcome",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Сайн байна уу? СиСи системтэй холбоотой асуух зүйл байна уу? Би танд туслахад бэлэн байна.",
			},
		],
	},
];

const mockReplies = [
	"Одоогоор системд түр хугацааны саатал гарсан байна. Та дараа дахин оролдоно уу.",
	"Таны асуусан мэдээллийг СиСи системээс шүүж байна... Олдсонгүй.",
	"Би зөвхөн загвар (mock) хувилбар тул бодит өгөгдөлтэй холбогдоогүй байна. Та 'Technical Minimalist' дизайныг шалгана уу.",
	"Системийн өгөгдлийн сантай холбогдох боломжгүй байна (Mock Mode).",
];

export function ChatPanel({
	shellClassName = "",
	subtitle,
	badgeLabel = "Live",
}: ChatPanelProps) {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<MockMessage[]>(initialMessages);
	const [isResponding, setIsResponding] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const stop = () => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
			setIsResponding(false);
		}
	};

	const onPromptSubmit = ({ text }: { text: string }) => {
		if (!text.trim() || isResponding) return;

		const userMsg: MockMessage = {
			id: Date.now().toString(),
			role: "user",
			parts: [{ type: "text", text }],
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsResponding(true);

		timerRef.current = setTimeout(
			() => {
				const replyText =
					mockReplies[Math.floor(Math.random() * mockReplies.length)];
				const assistantMsg: MockMessage = {
					id: (Date.now() + 1).toString(),
					role: "assistant",
					parts: [{ type: "text", text: replyText }],
				};
				setMessages((prev) => [...prev, assistantMsg]);
				setIsResponding(false);
			},
			1500 + Math.random() * 1000,
		); // 1.5 - 2.5 second simulated delay
	};

	return (
		<div
			className={`relative flex h-full flex-col bg-[#FAFAFA] dark:bg-[#09090b] ${shellClassName}`}
		>
			{/* Structural Dot Grid Background */}
			<div
				className="pointer-events-none absolute inset-0 z-0 opacity-[0.35] dark:opacity-[0.15]"
				style={{
					backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
					backgroundSize: "14px 14px",
				}}
			/>

			{/* Flat, Sharp Header */}
			<header className="relative z-10 flex items-center justify-between border-border/60 border-b bg-background/95 px-5 py-3 backdrop-blur-sm">
				<div className="flex items-center gap-3">
					<div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-primary text-primary-foreground shadow-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
							aria-hidden="true"
						>
							<path d="M2 12h4l2-9 5 18 2-9h5" />
						</svg>
					</div>
					<div className="flex flex-col justify-center">
						<h1 className="font-bold text-[13px] text-foreground tracking-tight">
							SiSi System
						</h1>
						<p className="font-medium text-[11px] text-muted-foreground">
							{subtitle}
						</p>
					</div>
				</div>
				<div className="flex h-5 items-center rounded-[4px] border border-border/80 bg-muted/40 px-2 font-bold font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					{badgeLabel}
				</div>
			</header>

			<main className="relative z-10 flex min-h-0 flex-1 flex-col">
				<Conversation className="min-h-0 flex-1">
					<ConversationContent className="gap-5 px-5 py-6">
						{messages.map((message) => (
							<Message
								from={message.role as "assistant" | "user"}
								key={message.id}
								className="max-w-[88%]"
							>
								{message.role === "assistant" && (
									<div className="mb-1.5 flex items-center gap-2">
										<span className="flex size-4 items-center justify-center rounded-[3px] bg-primary/10 font-bold text-[9px] text-primary">
											S
										</span>
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											СиСи
										</span>
									</div>
								)}
								{message.role === "user" && (
									<div className="mb-1.5 flex items-center justify-end gap-2">
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Оюутан
										</span>
									</div>
								)}
								<MessageContent
									className={
										message.role === "assistant"
											? "whitespace-pre-wrap break-words rounded-md rounded-tl-sm border border-border/60 bg-background px-4 py-3 text-[13px] text-foreground leading-relaxed shadow-sm"
											: "whitespace-pre-wrap break-words rounded-md rounded-tr-sm bg-foreground px-4 py-3 text-[13px] text-background leading-relaxed group-[.is-user]:border-none group-[.is-user]:shadow-sm"
									}
								>
									{message.parts?.map((part, i) => {
										if (part.type === "text") {
											return (
												<span key={`${message.id}-part-${i}`}>{part.text}</span>
											);
										}
										return null;
									})}
								</MessageContent>
							</Message>
						))}

						{isResponding && messages[messages.length - 1]?.role === "user" ? (
							<Message from="assistant" className="max-w-[88%]">
								<div className="mb-1.5 flex items-center gap-2">
									<span className="flex size-4 items-center justify-center rounded-[3px] bg-primary/10 font-bold text-[9px] text-primary">
										S
									</span>
									<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
										СиСи
									</span>
								</div>
								<MessageContent className="flex h-[46px] w-14 items-center justify-center rounded-md rounded-tl-sm border border-border/60 bg-background shadow-sm">
									<span className="flex gap-1">
										<span className="size-[5px] animate-pulse rounded-[1px] bg-primary" />
										<span className="size-[5px] animate-pulse rounded-[1px] bg-primary [animation-delay:150ms]" />
										<span className="size-[5px] animate-pulse rounded-[1px] bg-primary [animation-delay:300ms]" />
									</span>
								</MessageContent>
							</Message>
						) : null}
					</ConversationContent>
					<ConversationScrollButton className="right-4 bottom-4 rounded-md border border-border/60 bg-background shadow-sm" />
				</Conversation>

				{/* Technical CLI Input */}
				<div className="border-border/60 border-t bg-background/95 p-4 backdrop-blur-sm">
					<PromptInput
						className="group w-full overflow-hidden rounded-[4px] border-2 border-border/60 bg-background shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all focus-within:border-foreground focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
						onSubmit={onPromptSubmit}
					>
						<PromptInputBody className="relative">
							{/* CLI Chevron */}
							<div className="pointer-events-none absolute top-[14px] left-3 flex items-center text-muted-foreground/50 transition-colors group-focus-within:text-primary">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="square"
									strokeLinejoin="miter"
									className="size-4"
									aria-hidden="true"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</div>
							<PromptInputTextarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								className="min-h-[52px] w-full resize-none border-none bg-transparent pt-[14px] pr-3 pl-9 font-mono text-[13px] leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
								disabled={isResponding}
								placeholder="sisi_query --ask"
							/>
						</PromptInputBody>
						<PromptInputFooter className="flex items-center justify-between border-border/40 border-t bg-muted/30 px-3 py-2">
							<PromptInputTools>
								<div className="flex gap-4 opacity-60 transition-opacity group-focus-within:opacity-100">
									<span className="flex items-center gap-1.5 font-bold font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
										<span className="inline-flex size-4 items-center justify-center rounded-[2px] border border-border/80 bg-background text-foreground shadow-sm">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="9"
												height="9"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.5"
												strokeLinecap="square"
												strokeLinejoin="miter"
											>
												<title>Execute icon</title>
												<path d="M9 10L4 15L9 20" />
												<path d="M20 4v7a4 4 0 0 1-4 4H4" />
											</svg>
										</span>
										Exec
									</span>
									<span className="flex items-center gap-1.5 font-bold font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
										<span className="inline-flex size-4 items-center justify-center rounded-[2px] border border-border/80 bg-background text-foreground shadow-sm">
											<kbd className="font-bold font-sans text-[10px]">⇧</kbd>
										</span>
										Line
									</span>
								</div>
							</PromptInputTools>
							<PromptInputSubmit
								className="flex size-7 items-center justify-center rounded-[2px] bg-foreground text-background transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
								disabled={!input.trim() && !isResponding}
								status={isResponding ? "streaming" : "ready"}
								onStop={stop}
							/>
						</PromptInputFooter>
					</PromptInput>
				</div>
			</main>
		</div>
	);
}
