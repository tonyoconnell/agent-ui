# AI Elements Integration Plan

**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-01-12
**Owner:** builder

## Overview

Plan to integrate AI SDK Elements into the chat interface (`/pages/chat/index`), replacing custom components with production-ready AI SDK components for enhanced functionality and better developer experience.

## Current State

### Existing Components

**Chat Page:** `/web/src/pages/chat/index.astro`
- Uses `ChatClient` component with `client:only="react"`
- Full-screen layout with fixed header and input

**Current Custom Components:**
1. **PromptInput** (`/web/src/components/ai/PromptInput.tsx`)
   - Simple textarea + button
   - Enter to submit, Shift+Enter for new line
   - Basic loading state
   - Props: `value`, `onChange`, `onSubmit`, `isLoading`, `placeholder`

2. **ChatClient** (`/web/src/components/ai/ChatClient.tsx`)
   - Full chat interface with messages, input, settings
   - Model selection (Gemini Flash Lite, GPT-4, Claude, etc.)
   - API key management (localStorage)
   - Premium features: reasoning, tool calls, generative UI
   - Demo mode for showcasing features

**AI SDK Elements Available:**
- **PromptInput** (`/web/src/components/ai/elements/prompt-input.tsx`)
  - Advanced textarea with attachments
  - File upload (drag & drop, paste, click)
  - Speech-to-text button
  - Model selector integration
  - Action menu with extensibility
  - Provider pattern for global state
  - Validation (maxFiles, maxFileSize, accept)

## Integration Goals

### Phase 1: Replace PromptInput (Immediate Win)

**Goal:** Replace custom `PromptInput` with AI SDK `PromptInput` element

**Benefits:**
- File attachments (images, PDFs, docs)
- Drag & drop support
- Paste images from clipboard
- Speech-to-text (browser API)
- Better keyboard shortcuts
- Professional UX out-of-the-box

**Implementation Steps:**

1. **Update ChatClient to use AI SDK PromptInput**
   - Import AI SDK components
   - Replace custom `<PromptInput>` with AI SDK version
   - Adapt state management for attachments
   - Handle file conversion (blob → data URL)

2. **Add File Preview**
   - Use `<PromptInputAttachments>` to show uploaded files
   - Use `<PromptInputAttachment>` for individual file cards
   - Implement remove functionality

3. **Enable Speech-to-Text**
   - Add `<PromptInputSpeechButton>` to footer
   - Connect to textarea ref
   - Handle transcription updates

4. **Add Action Menu (Optional Features)**
   - Add `<PromptInputActionMenu>` with dropdown
   - Include `<PromptInputActionAddAttachments>` for file upload
   - Add future actions (code blocks, templates, etc.)

### Phase 2: Advanced Features (Enhanced UX)

**Goal:** Leverage full AI SDK Elements ecosystem

**Features to Add:**

1. **Model Selector Integration**
   - Use `<PromptInputSelect>` in footer or header
   - Replace custom dropdown with SDK component
   - Sync with OpenRouter model selection

2. **Attachment Validation**
   - Set `accept="image/*"` for image-only mode
   - Set `maxFiles={5}` to limit attachments
   - Set `maxFileSize={10 * 1024 * 1024}` (10MB limit)
   - Handle `onError` with toast notifications

3. **Global Drop Zone**
   - Enable `globalDrop={true}` for document-level drop
   - Add visual feedback for drag-over state

4. **Provider Pattern (Multi-Component State)**
   - Wrap chat in `<PromptInputProvider>`
   - Share input state across header/footer/sidebar
   - Enable external components to control input

### Phase 3: Premium Elements (Future Work)

**Goal:** Integrate advanced AI SDK Elements for rich experiences

**Components to Explore:**

1. **Message Components**
   - `<Message>` - Advanced message rendering
   - `<Reasoning>` - Chain-of-thought visualization
   - `<Tool>` - Tool call display with collapsible details
   - `<CodeBlock>` - Syntax-highlighted code with copy

2. **Conversation Components**
   - `<Conversation>` - Thread management
   - `<Controls>` - Message actions (edit, regenerate, branch)
   - `<Canvas>` - Visual workspace for generative UI

3. **Specialized Elements**
   - `<Artifact>` - Isolated code execution preview
   - `<WebPreview>` - Live iframe rendering
   - `<Sources>` - Citation and reference display
   - `<Checkpoint>` - Save/restore conversation state

## Implementation Example

### Before (Custom PromptInput)

```tsx
// ChatClient.tsx - Current Implementation
<PromptInput
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  placeholder="Type your message..."
/>
```

### After (AI SDK PromptInput)

```tsx
// ChatClient.tsx - AI SDK Implementation
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputSpeechButton,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
} from '@/components/ai/elements/prompt-input';

// In ChatClient component
<PromptInput
  accept="image/*"
  multiple
  maxFiles={5}
  maxFileSize={10 * 1024 * 1024}
  onError={(err) => toast.error(err.message)}
  onSubmit={(message, event) => {
    // message.text - user input text
    // message.files - FileUIPart[] with images/attachments
    handleSubmit(message.text, message.files);
  }}
>
  <PromptInputBody>
    {/* File attachments preview */}
    <PromptInputAttachments>
      {(attachment) => (
        <PromptInputAttachment data={attachment} />
      )}
    </PromptInputAttachments>

    {/* Main textarea */}
    <PromptInputTextarea
      placeholder="Ask me anything with premium features..."
    />

    {/* Footer with tools and submit */}
    <PromptInputFooter>
      <PromptInputTools>
        {/* Action menu for additional features */}
        <PromptInputActionMenu>
          <PromptInputActionMenuTrigger />
          <PromptInputActionMenuContent>
            <PromptInputActionAddAttachments />
          </PromptInputActionMenuContent>
        </PromptInputActionMenu>

        {/* Speech-to-text */}
        <PromptInputSpeechButton />
      </PromptInputTools>

      {/* Submit button with loading state */}
      <PromptInputSubmit
        status={isLoading ? 'submitted' : 'idle'}
      />
    </PromptInputFooter>
  </PromptInputBody>
</PromptInput>
```

## Technical Specifications

### File Handling

**Current:** No file upload support

**New Capabilities:**
- **Drag & Drop:** Drop files anywhere in form
- **Paste:** Paste images from clipboard (Ctrl+V)
- **Click:** Click to open file picker
- **Validation:** Accept filter, max files, max size
- **Preview:** Thumbnail for images, filename for others
- **Removal:** Click X on attachment to remove

**Data Flow:**
```
User uploads file
  ↓
Browser creates blob URL
  ↓
PromptInput stores as FileUIPart[] with id
  ↓
On submit: Convert blob → data URL
  ↓
Pass to onSubmit({ text, files })
  ↓
ChatClient sends to API with base64 data
```

### State Management

**Current:** Component-level state (`useState`)

**Provider Pattern (Optional):**
```tsx
// Wrap entire chat in provider
<PromptInputProvider initialInput="">
  <ChatHeader />
  <MessageList />
  <PromptInput onSubmit={handleSubmit}>
    {/* Components auto-sync via provider */}
  </PromptInput>
</PromptInputProvider>

// External components can access/control input
import { usePromptInputController } from '@/components/ai/elements/prompt-input';

function ChatHeader() {
  const { textInput, attachments } = usePromptInputController();

  return (
    <div>
      Current input: {textInput.value}
      Attachments: {attachments.files.length}
    </div>
  );
}
```

### API Integration

**Current API Endpoint:** `/api/chat` (POST)

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "apiKey": "sk-or-v1-...",
  "model": "google/gemini-2.5-flash-lite",
  "premium": true
}
```

**Enhanced with Files:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What's in this image?" },
        {
          "type": "image",
          "url": "data:image/png;base64,iVBORw0KG..."
        }
      ]
    }
  ],
  "apiKey": "sk-or-v1-...",
  "model": "google/gemini-2.5-flash-lite",
  "premium": true
}
```

**Server-Side Changes:**
- Parse multimodal content (text + images)
- Pass to OpenRouter with vision-capable models
- Handle file type validation server-side

## Migration Checklist

### Phase 1: PromptInput Replacement

- [ ] Install AI SDK Elements dependencies (if not installed)
- [ ] Import AI SDK PromptInput components
- [ ] Replace custom PromptInput in ChatClient
- [ ] Add file attachment preview UI
- [ ] Implement file-to-data-URL conversion
- [ ] Update API endpoint to handle multimodal content
- [ ] Test file upload (drag & drop, paste, click)
- [ ] Test speech-to-text (browser support)
- [ ] Add error handling for file validation
- [ ] Update placeholder text and UX copy

### Phase 2: Advanced Features

- [ ] Add PromptInputProvider wrapper
- [ ] Integrate model selector into footer
- [ ] Enable global drop zone
- [ ] Add toast notifications for errors
- [ ] Implement file size/type validation UI
- [ ] Add keyboard shortcuts documentation
- [ ] Test across browsers (Chrome, Firefox, Safari)
- [ ] Test mobile experience (touch, camera upload)

### Phase 3: Premium Elements

- [ ] Evaluate Message component for better rendering
- [ ] Consider Reasoning component for chain-of-thought
- [ ] Explore Tool component for tool call display
- [ ] Test CodeBlock for syntax highlighting
- [ ] Research Artifact/WebPreview for generative UI
- [ ] Consider Conversation for thread management

## Breaking Changes

**None - Backward Compatible**

The AI SDK PromptInput is designed to be a drop-in replacement. Existing API structure remains the same, with files as an optional addition.

**Migration Path:**
1. Replace component import
2. Update JSX structure
3. Add file handling logic
4. Test and iterate

## Performance Considerations

**Bundle Size:**
- AI SDK PromptInput: ~15KB gzipped
- Additional features (speech, attachments): +10KB
- Total impact: ~25KB (acceptable for chat feature)

**Runtime Performance:**
- File preview: Use blob URLs (no re-encoding)
- Convert to data URL only on submit (async)
- Cleanup blob URLs on unmount (memory management)

**Optimization:**
- Use `client:load` for PromptInput (critical interactivity)
- Lazy load speech recognition (only when button clicked)
- Optimize attachment preview rendering (virtual list for 10+ files)

## Success Metrics

**User Experience:**
- File upload success rate > 95%
- Speech-to-text accuracy > 80% (browser-dependent)
- Time to first input < 500ms
- Zero layout shifts during file upload

**Developer Experience:**
- Lines of code reduced by 40%
- Maintenance burden reduced (using SDK components)
- Feature parity with ChatGPT/Claude interfaces
- Easier to add new input features

## Future Enhancements

**Potential Add-Ons:**
1. **Template Messages** - Pre-filled prompts with variables
2. **Slash Commands** - `/image`, `/code`, `/summarize`
3. **Context Menu** - Right-click for additional actions
4. **Voice Output** - Text-to-speech for responses
5. **Collaborative Editing** - Real-time co-editing of prompts
6. **History Search** - Search and reuse previous prompts

## Resources

**Documentation:**
- AI SDK Elements: https://ai-sdk.dev/elements
- PromptInput Component: https://ai-sdk.dev/elements/components/prompt-input
- File Handling: https://ai-sdk.dev/elements/guides/file-handling
- Speech-to-Text: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

**Examples:**
- ChatGPT Clone: `/web/src/components/ai/examples/demo-chatgpt.tsx`
- Claude Clone: `/web/src/components/ai/examples/demo-claude.tsx`
- PromptInput Demo: `/web/src/components/ai/examples/prompt-input.tsx`

## Ontology Mapping

**Dimension:** Things (AI Chat Feature)

**Thing Type:** `ai_chat_interface`

**Properties:**
```json
{
  "name": "AI Chat with Elements",
  "type": "ai_chat_interface",
  "properties": {
    "supports_attachments": true,
    "supports_speech": true,
    "supports_multimodal": true,
    "max_files": 5,
    "max_file_size": 10485760,
    "accepted_file_types": ["image/*"],
    "models": [
      "google/gemini-2.5-flash-lite",
      "openai/gpt-4",
      "anthropic/claude-3-opus"
    ]
  }
}
```

**Events to Log:**
- `ai_chat_message_sent` - User sends message
- `ai_chat_file_uploaded` - User uploads file
- `ai_chat_speech_used` - User uses speech-to-text
- `ai_chat_model_changed` - User changes model
- `ai_chat_error_occurred` - Validation or API error

## Decision Log

**2025-01-12: Approved AI SDK PromptInput Integration**
- **Decision:** Replace custom PromptInput with AI SDK version
- **Rationale:** Better UX, more features, less maintenance
- **Trade-off:** Bundle size +25KB vs. custom 5KB (acceptable)

**2025-01-12: File Upload Enabled**
- **Decision:** Enable file attachments (images only initially)
- **Rationale:** Essential for modern AI chat (ChatGPT has it)
- **Trade-off:** Server-side vision model required (Gemini supports it)

**2025-01-12: Speech-to-Text Included**
- **Decision:** Add speech-to-text button (browser API)
- **Rationale:** Accessibility + mobile UX improvement
- **Trade-off:** Browser support varies (graceful degradation)

## Next Steps

1. **Create Feature Branch:** `feature/ai-elements-integration`
2. **Implement Phase 1:** Replace PromptInput with AI SDK version
3. **Test File Upload:** Verify drag & drop, paste, validation
4. **Update API Endpoint:** Handle multimodal content
5. **Deploy to Staging:** Test in production-like environment
6. **Gather Feedback:** User testing for UX improvements
7. **Document Changes:** Update `/one/events/` with deployment notes

---

**End of Plan**

This plan provides a clear roadmap for integrating AI SDK Elements into the chat interface, starting with PromptInput replacement and expanding to advanced features over time.
