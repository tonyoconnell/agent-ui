import { Target, Waves, Zap } from "lucide-react";
import { useState } from "react";

export function InteractionDemo() {
	const [focusDemo, setFocusDemo] = useState(false);
	const [hoverDemo, setHoverDemo] = useState(false);

	return (
		<div className="space-y-6">
			{/* Visible Focus Demo */}
			<div className="flex gap-4 rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
				<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Target className="h-5 w-5" />
				</div>
				<div className="flex-1 space-y-3">
					<div>
						<p className="text-base font-medium">Visible Focus</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Focus states use a 2px outline with primary color and 2px offset.
							Never remove focus for aesthetics.
						</p>
					</div>
					<button
						onFocus={() => setFocusDemo(true)}
						onBlur={() => setFocusDemo(false)}
						className={`rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ${
							focusDemo ? "ring-2 ring-primary ring-offset-2" : ""
						}`}
					>
						Click to Focus Me
					</button>
					{focusDemo && (
						<p className="text-xs text-primary animate-in fade-in duration-300">
							✓ Focus ring visible - accessible for keyboard navigation
						</p>
					)}
				</div>
			</div>

			{/* Purposeful Motion Demo */}
			<div className="flex gap-4 rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
				<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Waves className="h-5 w-5" />
				</div>
				<div className="flex-1 space-y-3">
					<div>
						<p className="text-base font-medium">Purposeful Motion</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Pair animations with motion tokens and respect
							`prefers-reduced-motion`. Motion should communicate spatial
							change.
						</p>
					</div>
					<div
						onMouseEnter={() => setHoverDemo(true)}
						onMouseLeave={() => setHoverDemo(false)}
						className="relative h-12 rounded-md bg-muted overflow-hidden cursor-pointer"
					>
						<div
							className={`absolute inset-y-0 left-0 w-12 bg-primary/20 transition-all duration-300 ease-in-out ${
								hoverDemo ? "w-full" : "w-12"
							}`}
						/>
						<div className="relative flex items-center justify-center h-full">
							<span className="text-sm font-medium">
								{hoverDemo ? "Motion communicates expansion" : "Hover over me"}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Immediate Feedback Demo */}
			<div className="flex gap-4 rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
				<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Zap className="h-5 w-5" />
				</div>
				<div className="flex-1 space-y-3">
					<div>
						<p className="text-base font-medium">Immediate Feedback</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Hover within 80ms, active within 40ms, and show result states or
							loaders within 200ms.
						</p>
					</div>
					<button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150">
						Instant Response
					</button>
					<p className="text-xs text-muted-foreground">
						Try hovering and clicking - feedback is instant (150ms transition)
					</p>
				</div>
			</div>
		</div>
	);
}
