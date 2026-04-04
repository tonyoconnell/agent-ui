import { Pause, Play } from "lucide-react";
import { useState } from "react";

export function MotionDemo() {
	const [isAnimating, setIsAnimating] = useState(false);

	const startAnimation = () => {
		setIsAnimating(true);
		setTimeout(() => setIsAnimating(false), 3000);
	};

	return (
		<div className="space-y-4">
			{/* Control Button */}
			<div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
				<div>
					<p className="text-xs font-semibold text-primary">✨ Motion Demo</p>
					<p className="text-xs text-muted-foreground mt-1">
						Watch all timing speeds animate simultaneously
					</p>
				</div>
				<button
					onClick={startAnimation}
					disabled={isAnimating}
					className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
				>
					{isAnimating ? (
						<>
							<Pause className="h-3 w-3" />
							Playing...
						</>
					) : (
						<>
							<Play className="h-3 w-3" />
							Play Demo
						</>
					)}
				</button>
			</div>

			{/* Animated Boxes */}
			<div className="space-y-2">
				{/* instant (0ms) */}
				<div className="flex items-center gap-2">
					<span className="w-20 text-xs font-medium">instant</span>
					<div className="flex-1 rounded-md bg-muted p-2">
						<div
							className={`h-2 rounded-full bg-primary transition-none ${
								isAnimating ? "translate-x-full" : "translate-x-0"
							}`}
							style={{ width: "40px" }}
						/>
					</div>
					<span className="w-12 text-xs text-muted-foreground">0ms</span>
				</div>

				{/* fast (150ms) */}
				<div className="flex items-center gap-2">
					<span className="w-20 text-xs font-medium">fast</span>
					<div className="flex-1 rounded-md bg-muted p-2">
						<div
							className={`h-2 rounded-full bg-primary transition-all duration-150 ease-in-out ${
								isAnimating ? "translate-x-full" : "translate-x-0"
							}`}
							style={{ width: "40px" }}
						/>
					</div>
					<span className="w-12 text-xs text-muted-foreground">150ms</span>
				</div>

				{/* normal (300ms) */}
				<div className="flex items-center gap-2">
					<span className="w-20 text-xs font-medium">normal</span>
					<div className="flex-1 rounded-md bg-muted p-2">
						<div
							className={`h-2 rounded-full bg-primary transition-all duration-300 ease-in-out ${
								isAnimating ? "translate-x-full" : "translate-x-0"
							}`}
							style={{ width: "40px" }}
						/>
					</div>
					<span className="w-12 text-xs text-muted-foreground">300ms</span>
				</div>

				{/* slow (500ms) */}
				<div className="flex items-center gap-2">
					<span className="w-20 text-xs font-medium">slow</span>
					<div className="flex-1 rounded-md bg-muted p-2">
						<div
							className={`h-2 rounded-full bg-primary transition-all duration-500 ease-in-out ${
								isAnimating ? "translate-x-full" : "translate-x-0"
							}`}
							style={{ width: "40px" }}
						/>
					</div>
					<span className="w-12 text-xs text-muted-foreground">500ms</span>
				</div>
			</div>

			<p className="text-xs text-muted-foreground text-center">
				All animations use ease-in-out easing for natural feel
			</p>
		</div>
	);
}
