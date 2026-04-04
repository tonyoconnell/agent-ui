/**
 * MarkdownRenderer - Renders markdown with syntax-highlighted code blocks
 * Uses AI Elements CodeBlock for beautiful code display
 */

import { useMemo } from "react";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai/elements/code-block";
import type { BundledLanguage } from "shiki";

interface MarkdownRendererProps {
	content: string;
	className?: string;
}

interface ParsedBlock {
	type: "text" | "code";
	content: string;
	language?: string;
}

// Parse markdown content into text and code blocks
function parseMarkdown(content: string): ParsedBlock[] {
	const blocks: ParsedBlock[] = [];
	const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
	let lastIndex = 0;
	let match;

	while ((match = codeBlockRegex.exec(content)) !== null) {
		// Add text before code block
		if (match.index > lastIndex) {
			const textContent = content.slice(lastIndex, match.index).trim();
			if (textContent) {
				blocks.push({ type: "text", content: textContent });
			}
		}

		// Add code block
		blocks.push({
			type: "code",
			language: match[1] || "text",
			content: match[2].trim(),
		});

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < content.length) {
		const textContent = content.slice(lastIndex).trim();
		if (textContent) {
			blocks.push({ type: "text", content: textContent });
		}
	}

	// If no blocks were found, treat entire content as text
	if (blocks.length === 0 && content.trim()) {
		blocks.push({ type: "text", content: content.trim() });
	}

	return blocks;
}

// Map common language aliases to shiki-supported languages
function normalizeLanguage(lang: string): BundledLanguage {
	const languageMap: Record<string, BundledLanguage> = {
		js: "javascript",
		ts: "typescript",
		tsx: "tsx",
		jsx: "jsx",
		py: "python",
		rb: "ruby",
		sh: "bash",
		shell: "bash",
		zsh: "bash",
		yml: "yaml",
		md: "markdown",
		json: "json",
		html: "html",
		css: "css",
		sql: "sql",
		go: "go",
		rust: "rust",
		c: "c",
		cpp: "cpp",
		java: "java",
		kotlin: "kotlin",
		swift: "swift",
		php: "php",
		dockerfile: "dockerfile",
		docker: "dockerfile",
		text: "text",
		plaintext: "text",
		txt: "text",
	};

	const normalized = lang.toLowerCase();
	return languageMap[normalized] || (normalized as BundledLanguage);
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
	const blocks = useMemo(() => parseMarkdown(content), [content]);

	return (
		<div className={`space-y-4 ${className}`}>
			{blocks.map((block, index) => {
				if (block.type === "code") {
					return (
						<CodeBlock
							key={index}
							code={block.content}
							language={normalizeLanguage(block.language || "text")}
							className="my-4"
						>
							<CodeBlockCopyButton />
						</CodeBlock>
					);
				}

				// Render text with basic formatting
				return (
					<div key={index} className="whitespace-pre-wrap break-words">
						{renderInlineFormatting(block.content)}
					</div>
				);
			})}
		</div>
	);
}

// Render inline code and basic formatting
function renderInlineFormatting(text: string): React.ReactNode {
	// Split by inline code
	const parts = text.split(/(`[^`]+`)/g);

	return parts.map((part, i) => {
		if (part.startsWith("`") && part.endsWith("`")) {
			// Inline code
			return (
				<code
					key={i}
					className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm"
				>
					{part.slice(1, -1)}
				</code>
			);
		}

		// Regular text - handle bold and italic
		return renderBoldItalic(part, i);
	});
}

function renderBoldItalic(text: string, keyPrefix: number): React.ReactNode {
	// Handle **bold** and *italic*
	const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
		}
		if (part.startsWith("*") && part.endsWith("*")) {
			return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
		}
		return <span key={`${keyPrefix}-${i}`}>{part}</span>;
	});
}
