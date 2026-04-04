import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ToolCallProps {
	name: string;
	args: Record<string, any>;
	result?: any;
	status?: "pending" | "running" | "completed" | "failed";
}

export function ToolCall({
	name,
	args,
	result,
	status = "completed",
}: ToolCallProps) {
	const [showDetails, setShowDetails] = useState(false);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Function: {name}</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowDetails(!showDetails)}
					>
						{showDetails ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</Button>
				</div>
			</CardHeader>
			{showDetails && (
				<CardContent>
					<div className="space-y-3">
						<div>
							<p className="mb-2 text-xs font-medium text-muted-foreground">
								Arguments:
							</p>
							<pre className="rounded bg-muted p-2 text-xs">
								{JSON.stringify(args, null, 2)}
							</pre>
						</div>
						{result && (
							<div>
								<p className="mb-2 text-xs font-medium text-muted-foreground">
									Result:
								</p>
								<pre className="rounded bg-muted p-2 text-xs">
									{JSON.stringify(result, null, 2)}
								</pre>
							</div>
						)}
					</div>
				</CardContent>
			)}
		</Card>
	);
}
