/**
 * Stream Parsing Utilities
 *
 * Parse and handle streaming responses from AI APIs (OpenRouter, OpenAI format)
 *
 * Ontology Mapping:
 * - Stream chunk = Event (type: 'stream_chunk_received')
 * - Stream completed = Event (type: 'stream_completed')
 * - Stream error = Event (type: 'stream_error')
 */

/**
 * Stream event types
 */
export type StreamEventType = "text" | "tool_call" | "tool_result" | "ui" | "done" | "error";

/**
 * Stream event
 */
export interface StreamEvent {
	type: StreamEventType;
	payload: unknown;
}

/**
 * Stream callbacks
 */
export interface StreamCallbacks {
	onText?: (text: string) => void;
	onToolCall?: (toolCall: { name: string; args: unknown }) => void;
	onToolResult?: (result: { tool: string; result: unknown }) => void;
	onUI?: (ui: { component: string; data: unknown }) => void;
	onDone?: () => void;
	onError?: (error: string) => void;
}

/**
 * Parse Server-Sent Events (SSE) stream
 *
 * Handles OpenRouter/OpenAI streaming format:
 * - Text chunks: { choices: [{ delta: { content: "..." } }] }
 * - Tool calls: { choices: [{ delta: { tool_calls: [...] } }] }
 * - Done signal: "data: [DONE]"
 *
 * Custom events:
 * - Tool results: { type: 'tool_result', payload: { tool, result } }
 * - UI components: { type: 'ui', payload: { component, data } }
 */
export async function parseSSEStream(
	response: Response,
	callbacks: StreamCallbacks,
): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Response body is not readable");
	}

	const decoder = new TextDecoder();
	let fullText = "";
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				console.log("[STREAM] Stream ended naturally");
				callbacks.onDone?.();
				break;
			}

			// Decode chunk
			const chunk = decoder.decode(value, { stream: true });
			buffer += chunk;

			// Process complete lines
			const lines = buffer.split("\n");
			buffer = lines.pop() || ""; // Keep incomplete line in buffer

			for (const line of lines) {
				if (!line.trim() || !line.startsWith("data: ")) {
					continue;
				}

				const data = line.slice(6); // Remove "data: " prefix

				// Check for done signal
				if (data === "[DONE]") {
					console.log("[STREAM] Received [DONE] signal");
					callbacks.onDone?.();
					return fullText;
				}

				try {
					const parsed = JSON.parse(data);

					// Handle custom events (tool_result, ui)
					if (parsed.type) {
						if (parsed.type === "tool_result" && callbacks.onToolResult) {
							callbacks.onToolResult(parsed.payload);
						} else if (parsed.type === "ui" && callbacks.onUI) {
							callbacks.onUI(parsed.payload);
						} else if (parsed.type === "tool_call" && callbacks.onToolCall) {
							callbacks.onToolCall(parsed.payload);
						}
						continue;
					}

					// Handle OpenAI/OpenRouter format
					const delta = parsed.choices?.[0]?.delta;
					if (!delta) continue;

					// Text content
					if (delta.content) {
						fullText += delta.content;
						callbacks.onText?.(delta.content);
					}

					// Tool calls (OpenRouter native function calling)
					if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
						for (const toolCall of delta.tool_calls) {
							if (toolCall.function?.name && toolCall.function?.arguments) {
								try {
									const args = JSON.parse(toolCall.function.arguments);
									callbacks.onToolCall?.({
										name: toolCall.function.name,
										args,
									});
								} catch (e) {
									console.error("[STREAM] Failed to parse tool call args:", e);
								}
							}
						}
					}
				} catch (e) {
					// Ignore JSON parse errors (partial chunks)
				}
			}
		}
	} catch (error) {
		console.error("[STREAM] Error:", error);
		callbacks.onError?.(error instanceof Error ? error.message : "Stream error");
		throw error;
	} finally {
		reader.releaseLock();
	}

	return fullText;
}

/**
 * Parse streaming response with simple text callback
 */
export async function parseTextStream(
	response: Response,
	onText: (text: string) => void,
): Promise<string> {
	return parseSSEStream(response, { onText });
}

/**
 * Parse streaming response with all callbacks
 */
export async function parseFullStream(
	response: Response,
	callbacks: StreamCallbacks,
): Promise<string> {
	return parseSSEStream(response, callbacks);
}

/**
 * Stream event accumulator
 *
 * Accumulates tool calls and text content during streaming
 */
export class StreamAccumulator {
	private textContent = "";
	private toolCalls = new Map<
		number,
		{
			name: string;
			args: string;
		}
	>();

	addText(text: string): void {
		this.textContent += text;
	}

	addToolCall(index: number, name?: string, argsChunk?: string): void {
		if (!this.toolCalls.has(index)) {
			this.toolCalls.set(index, { name: "", args: "" });
		}

		const call = this.toolCalls.get(index)!;
		if (name) call.name = name;
		if (argsChunk) call.args += argsChunk;
	}

	getText(): string {
		return this.textContent;
	}

	getToolCalls(): Array<{ name: string; args: unknown }> {
		return Array.from(this.toolCalls.values())
			.filter((call) => call.name && call.args)
			.map((call) => ({
				name: call.name,
				args: JSON.parse(call.args),
			}));
	}

	clear(): void {
		this.textContent = "";
		this.toolCalls.clear();
	}
}

/**
 * Create a readable stream from SSE response
 *
 * Useful for piping streams or custom processing
 */
export function createStreamReader(
	response: Response,
): ReadableStreamDefaultReader<Uint8Array> | undefined {
	return response.body?.getReader();
}

/**
 * Check if response is a stream
 */
export function isStreamResponse(response: Response): boolean {
	const contentType = response.headers.get("content-type");
	return contentType?.includes("text/event-stream") || contentType?.includes("stream") || false;
}

/**
 * Handle non-stream response (fallback)
 */
export async function parseNonStreamResponse(response: Response): Promise<string> {
	const data = await response.json();

	// OpenAI format
	if (data.choices?.[0]?.message?.content) {
		return data.choices[0].message.content;
	}

	// Generic format
	if (data.content) {
		return data.content;
	}

	// Raw text
	if (typeof data === "string") {
		return data;
	}

	throw new Error("Unable to parse response content");
}
