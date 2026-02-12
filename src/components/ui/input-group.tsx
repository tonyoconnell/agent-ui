import * as React from "react";
import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"inline-flex items-center rounded-md border border-input bg-background",
			"[&>:not(:last-child)]:border-r",
			"[&>:not(:last-child)]:rounded-r-none",
			"[&>:not(:first-child)]:rounded-l-none",
			className,
		)}
		{...props}
	/>
));
InputGroup.displayName = "InputGroup";

const InputGroupItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center px-3 py-2", className)}
		{...props}
	/>
));
InputGroupItem.displayName = "InputGroupItem";

const InputGroupAddon = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-sm font-medium text-muted-foreground", className)}
		{...props}
	/>
));
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
	<button
		ref={ref}
		className={cn(
			"inline-flex items-center justify-center rounded-none bg-transparent px-3 py-2 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
InputGroupButton.displayName = "InputGroupButton";

const InputGroupTextarea = React.forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<textarea
		ref={ref}
		className={cn(
			"flex min-h-[2.5rem] w-full resize-none rounded-none border-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
InputGroupTextarea.displayName = "InputGroupTextarea";

export {
	InputGroup,
	InputGroupItem,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
};
