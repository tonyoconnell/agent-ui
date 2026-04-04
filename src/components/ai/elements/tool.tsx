"use client";

import type { ToolUIPart } from "ai";
import {
	CheckCircleIcon,
	ChevronDownIcon,
	CircleIcon,
	ClockIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
	<Collapsible
		className={cn("not-prose mb-4 w-full rounded-md border", className)}
		{...props}
	/>
);

export type ToolHeaderProps = {
	title?: string;
	type: ToolUIPart["type"];
	state: ToolUIPart["state"];
	className?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
	const labels: Record<ToolUIPart["state"], string> = {
		"input-streaming": "Pending",
		"input-available": "Running",
		"approval-requested": "Awaiting Approval",
		"approval-responded": "Responded",
		"output-available": "Completed",
		"output-error": "Error",
		"output-denied": "Denied",
	};

	const icons: Record<ToolUIPart["state"], ReactNode> = {
		"input-streaming": <CircleIcon className="size-4" />,
		"input-available": <ClockIcon className="size-4 animate-pulse" />,
		"approval-requested": <ClockIcon className="size-4 text-yellow-600" />,
		"approval-responded": <CheckCircleIcon className="size-4 text-blue-600" />,
		"output-available": <CheckCircleIcon className="size-4 text-green-600" />,
		"output-error": <XCircleIcon className="size-4 text-red-600" />,
		"output-denied": <XCircleIcon className="size-4 text-orange-600" />,
	};

	return (
		<Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
			{icons[status]}
			{labels[status]}
		</Badge>
	);
};

export const ToolHeader = ({
	className,
	title,
	type,
	state,
	...props
}: ToolHeaderProps) => (
	<CollapsibleTrigger
		className={cn(
			"flex w-full items-center justify-between gap-4 p-3",
			className,
		)}
		{...props}
	>
		<div className="flex items-center gap-2">
			<WrenchIcon className="size-4 text-muted-foreground" />
			<span className="font-medium text-sm">
				{title ?? type.split("-").slice(1).join("-")}
			</span>
			{getStatusBadge(state)}
		</div>
		<ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
	</CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
	<CollapsibleContent
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
);

export type ToolInputProps = ComponentProps<"div"> & {
	input: ToolUIPart["input"];
	toolName?: string;
};

// Helper to shorten file paths for display
const shortenPath = (path: string, maxLength: number = 50): string => {
	if (!path || path.length <= maxLength) return path;

	// Extract filename from path
	const parts = path.split("/");
	const filename = parts[parts.length - 1];

	// If filename alone is too long, truncate it
	if (filename.length > maxLength) {
		return "..." + filename.slice(-maxLength);
	}

	// Show ...path/to/filename
	const remaining = maxLength - filename.length - 4; // 4 for ".../"
	if (remaining > 0) {
		const parentPath = parts.slice(0, -1).join("/");
		if (parentPath.length > remaining) {
			return ".../" + parentPath.slice(-remaining) + "/" + filename;
		}
		return parentPath + "/" + filename;
	}

	return ".../" + filename;
};

// Convert tool parameters to human-friendly description
const getToolDescription = (toolName: string, input: any): string => {
	const name = toolName?.toLowerCase() || "";

	// Safety check for undefined or null input
	if (!input || typeof input !== "object") {
		return `Using ${name || "tool"}...`;
	}

	if (name.includes("read") || name === "read") {
		const filePath = input.file_path || input.path || "unknown file";
		return `Reading: ${shortenPath(filePath)}`;
	}
	if (name.includes("write") || name === "write") {
		const filePath = input.file_path || input.path || "unknown file";
		const preview = input.content ? ` (${input.content.length} chars)` : "";
		return `Writing: ${shortenPath(filePath)}${preview}`;
	}
	if (name.includes("edit") || name === "edit") {
		const filePath = input.file_path || input.path || "unknown file";
		return `Editing: ${shortenPath(filePath)}`;
	}
	if (name.includes("grep") || name === "grep") {
		const pattern = input.pattern || input.query || "text";
		const pathInfo = input.path ? ` in ${shortenPath(input.path)}` : "";
		return `Searching for "${pattern}"${pathInfo}`;
	}
	if (name.includes("glob") || name === "glob") {
		const pattern = input.pattern || input.glob || "pattern";
		return `Finding files: ${pattern}`;
	}
	if (name.includes("bash") || name === "bash") {
		const command = input.command || "command";
		// Truncate long commands
		const shortCommand =
			command.length > 60 ? command.slice(0, 60) + "..." : command;
		return `Running: ${shortCommand}`;
	}
	if (name.includes("web") || name.includes("fetch")) {
		const url = input.url || "web";
		// Show domain for URLs
		try {
			const urlObj = new URL(url);
			return `Fetching: ${urlObj.hostname}${urlObj.pathname}`;
		} catch {
			return `Fetching: ${url}`;
		}
	}
	if (name.includes("search")) {
		return `Searching: "${input.query || input.q || "query"}"`;
	}

	// Generic fallback
	const keys = Object.keys(input || {});
	if (keys.length === 0) return "Running tool...";
	if (keys.length === 1) {
		const value = input[keys[0]];
		// Only show value if it's a string or number
		if (typeof value === "string" || typeof value === "number") {
			const shortValue =
				typeof value === "string" && value.length > 50
					? value.slice(0, 50) + "..."
					: value;
			return `${name}: ${shortValue}`;
		}
	}
	return `Running ${name || "tool"}...`;
};

export const ToolInput = ({
	className,
	input,
	toolName,
	...props
}: ToolInputProps) => {
	const description = getToolDescription(toolName || "", input);

	return (
		<div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
			<div className="text-sm text-foreground">{description}</div>
		</div>
	);
};

export type ToolOutputProps = ComponentProps<"div"> & {
	output: ToolUIPart["output"];
	errorText: ToolUIPart["errorText"];
	toolName?: string;
};

// Convert tool output to human-friendly summary
const getOutputSummary = (
	toolName: string,
	output: any,
	errorText?: string,
): string => {
	const name = toolName?.toLowerCase() || "";

	if (errorText) {
		return `Failed: ${errorText}`;
	}

	// Safety check for undefined output
	if (output === undefined || output === null) {
		return "Completed";
	}

	if (name.includes("read")) {
		if (typeof output === "string") {
			const lines = output.split("\n").length;
			return `Successfully read ${lines} line${lines !== 1 ? "s" : ""} from file`;
		}
		return "Successfully read file";
	}

	if (name.includes("write")) {
		return "Successfully wrote to file";
	}

	if (name.includes("edit")) {
		return "Successfully edited file";
	}

	if (name.includes("grep") || name.includes("search")) {
		if (typeof output === "string") {
			const matches = output.split("\n").filter((l) => l.trim()).length;
			return `Found ${matches} match${matches !== 1 ? "es" : ""}`;
		}
		if (Array.isArray(output)) {
			return `Found ${output.length} match${output.length !== 1 ? "es" : ""}`;
		}
		return "Search completed";
	}

	if (name.includes("glob")) {
		if (Array.isArray(output)) {
			return `Found ${output.length} file${output.length !== 1 ? "s" : ""}`;
		}
		if (typeof output === "string") {
			const files = output.split("\n").filter((l) => l.trim()).length;
			return `Found ${files} file${files !== 1 ? "s" : ""}`;
		}
		return "File search completed";
	}

	if (name.includes("bash")) {
		return "Command executed successfully";
	}

	if (name.includes("web") || name.includes("fetch")) {
		return "Successfully fetched data";
	}

	// Generic success message
	return "Tool completed successfully";
};

export const ToolOutput = ({
	className,
	output,
	errorText,
	toolName,
	...props
}: ToolOutputProps) => {
	if (!(output || errorText)) {
		return null;
	}

	const summary = getOutputSummary(toolName || "", output, errorText);

	return (
		<div className={cn("space-y-2 p-4", className)} {...props}>
			<div
				className={cn(
					"text-sm",
					errorText ? "text-destructive" : "text-foreground",
				)}
			>
				{summary}
			</div>
		</div>
	);
};
