import * as React from "react";
import { cn } from "@/lib/utils";

const ButtonGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		orientation?: "horizontal" | "vertical";
	}
>(({ className, orientation = "horizontal", ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"inline-flex items-center",
			orientation === "vertical" ? "flex-col" : "flex-row",
			"[&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:rounded-l-none",
			"[&>button:not(:last-child)]:border-r-0",
			className,
		)}
		role="group"
		{...props}
	/>
));
ButtonGroup.displayName = "ButtonGroup";

const ButtonGroupItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("flex", className)} {...props} />
));
ButtonGroupItem.displayName = "ButtonGroupItem";

const ButtonGroupText = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("text-sm font-medium text-muted-foreground", className)}
		{...props}
	/>
));
ButtonGroupText.displayName = "ButtonGroupText";

export { ButtonGroup, ButtonGroupItem, ButtonGroupText };
