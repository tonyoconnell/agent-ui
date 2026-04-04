/**
 * useVoiceInput - Voice-to-text input hook
 * Uses Web Speech API for browser-based speech recognition
 */

import { useState, useEffect, useRef } from "react";

interface VoiceInputOptions {
	onTranscript?: (text: string) => void;
	onError?: (error: string) => void;
	continuous?: boolean;
	language?: string;
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
	const {
		onTranscript,
		onError,
		continuous = false,
		language = "en-US",
	} = options;

	const [isListening, setIsListening] = useState(false);
	const [isSupported, setIsSupported] = useState(false);
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		// Check if Web Speech API is supported
		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;

		if (SpeechRecognition) {
			setIsSupported(true);

			const recognition = new SpeechRecognition();
			recognition.continuous = continuous;
			recognition.interimResults = true;
			recognition.lang = language;

			recognition.onstart = () => {
				setIsListening(true);
			};

			recognition.onend = () => {
				setIsListening(false);
			};

			recognition.onresult = (event: any) => {
				const transcript = Array.from(event.results)
					.map((result: any) => result[0])
					.map((result) => result.transcript)
					.join("");

				if (onTranscript) {
					onTranscript(transcript);
				}
			};

			recognition.onerror = (event: any) => {
				console.error("Speech recognition error:", event.error);
				setIsListening(false);

				if (onError) {
					onError(event.error);
				}
			};

			recognitionRef.current = recognition;
		} else {
			setIsSupported(false);
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, [continuous, language, onTranscript, onError]);

	const startListening = () => {
		if (recognitionRef.current && !isListening) {
			recognitionRef.current.start();
		}
	};

	const stopListening = () => {
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop();
		}
	};

	const toggleListening = () => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	};

	return {
		isListening,
		isSupported,
		startListening,
		stopListening,
		toggleListening,
	};
}
