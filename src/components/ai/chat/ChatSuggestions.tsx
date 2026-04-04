/**
 * ChatSuggestions - Follow-up suggestion chips
 * Shows contextual suggestions after AI responses
 */

import { Button } from "@/components/ui/button";

interface ChatSuggestionsProps {
	suggestions: string[];
	onSelectSuggestion: (text: string) => void;
	className?: string;
}

export function ChatSuggestions({
	suggestions,
	onSelectSuggestion,
	className = "",
}: ChatSuggestionsProps) {
	if (suggestions.length === 0) return null;

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{suggestions.map((suggestion, idx) => (
				<Button
					key={idx}
					variant="outline"
					size="sm"
					onClick={() => onSelectSuggestion(suggestion)}
					className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
				>
					{suggestion}
				</Button>
			))}
		</div>
	);
}
