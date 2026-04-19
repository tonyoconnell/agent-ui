---
title: Todo Mail
dimension: things
primary_dimension: things
category: todo-mail.md
tags: ai, architecture, artificial-intelligence, frontend, cycle
related_dimensions: connections, events, groups, knowledge, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-mail.md category.
  Location: one/things/todo-mail.md
  Purpose: Documents one platform: mail application v1.0.0
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo mail.
---

# ONE Platform: Mail Application v1.0.0

**Focus:** Full-featured email client application with inbox, compose, threads, and rich editor
**Type:** Complete frontend application (Astro + React 19 + Tailwind v4)
**UI Pattern:** Gmail-like interface with sidebar, email list, and detail view
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 12-16 cycles per specialist per day
**Target:** Fully functional mail app UI and state management

---

## PHASE 1: FOUNDATION & ARCHITECTURE (Cycle 1-10)

**Purpose:** Define mail app requirements, data model, UI patterns

### Cycle 1: Define Mail App Features

- [ ] **Core Features:**
  - [ ] Inbox with email list
  - [ ] Email detail view (threading)
  - [ ] Compose new email
  - [ ] Reply to email
  - [ ] Reply all
  - [ ] Forward email
  - [ ] Archive email
  - [ ] Delete email
  - [ ] Mark as spam
  - [ ] Star/flag email
- [ ] **Advanced Features:**
  - [ ] Folders/labels (custom)
  - [ ] Search emails
  - [ ] Filter by sender, date, subject
  - [ ] Draft autosave
  - [ ] Scheduled send
  - [ ] Email templates
  - [ ] Signature
  - [ ] Settings (dark mode, notifications, etc.)
- [ ] **UI Components:**
  - [ ] Sidebar with folders/labels
  - [ ] Email list with preview
  - [ ] Email detail view
  - [ ] Compose modal or panel
  - [ ] Search bar
  - [ ] Settings sidebar
  - [ ] Attachments preview

### Cycle 2: Map Mail App to 6-Dimension Ontology

- [ ] **Groups:** User's workspace/organization
- [ ] **People:**
  - [ ] User (email owner)
  - [ ] Contacts (senders, recipients)
  - [ ] Collaborators (shared access)
- [ ] **Things:**
  - [ ] email (from, to, subject, body, timestamp, attachments)
  - [ ] contact (name, email, avatar, notes)
  - [ ] label (color, name, email count)
  - [ ] draft (unsent email)
  - [ ] attachment (file, mime type, size)
- [ ] **Connections:**
  - [ ] user → email (owns, read/unread)
  - [ ] user → contact (knows)
  - [ ] user → label (uses)
  - [ ] email → email (reply_to, forward_of)
  - [ ] email → attachment (has)
- [ ] **Events:**
  - [ ] email_received, email_read, email_sent
  - [ ] email_archived, email_deleted, email_starred
  - [ ] draft_created, draft_saved, draft_discarded
  - [ ] contact_added, contact_updated
- [ ] **Knowledge:** Email search index, sender/recipient frequency

### Cycle 3: Design Data Model

- [ ] **Email Object:**
  ```
  {
    id: string (uuid)
    from: { name, email }
    to: [{ name, email }]
    cc: [{ name, email }]
    bcc: [{ name, email }]
    subject: string
    body: string (HTML)
    plainText: string
    timestamp: number (ms)
    read: boolean
    starred: boolean
    archived: boolean
    spam: boolean
    deleted: boolean
    draftId?: string
    threadId: string
    labels: string[]
    attachments: Attachment[]
    replyTo?: string (email id)
    forwardOf?: string (email id)
    metadata: {
      unsubscribeLink?: string
      importance?: 'high' | 'normal' | 'low'
      category?: 'primary' | 'social' | 'promotions' | 'updates'
    }
  }
  ```
- [ ] **Contact Object:**
  ```
  {
    id: string
    name: string
    email: string
    avatar?: string
    lastInteraction?: number
    frequency: number (how many emails)
    isFavorite?: boolean
    notes?: string
  }
  ```
- [ ] **Label Object:**
  ```
  {
    id: string
    name: string
    color: string
    count: number
    unreadCount: number
  }
  ```

### Cycle 4: Design UI Layout

- [ ] **Layout Structure:**
  - [ ] **Header (60px):**
    - [ ] Logo/title left
    - [ ] Search bar center
    - [ ] Settings, notifications, profile right
  - [ ] **Main Area:**
    - [ ] **Sidebar (25%, 250px min):**
      - [ ] Compose button (prominent)
      - [ ] Inbox (with count)
      - [ ] Starred (with count)
      - [ ] Sent
      - [ ] Drafts (with count)
      - [ ] Archive
      - [ ] Spam
      - [ ] Trash
      - [ ] Custom labels
      - [ ] Expand/collapse
    - [ ] **Email List (35%):**
      - [ ] Email rows (avatar, name, subject, preview, time)
      - [ ] Unread styling (bold, blue dot)
      - [ ] Hover state (highlight)
      - [ ] Selection checkboxes
      - [ ] Star button
      - [ ] Pagination/infinite scroll
    - [ ] **Email Detail (40%):**
      - [ ] Email header (from, to, cc, time)
      - [ ] Subject line
      - [ ] Email body (rendered HTML)
      - [ ] Attachments
      - [ ] Actions (reply, reply all, forward, archive, delete, spam)
      - [ ] Related emails in thread

### Cycle 5: Design Compose UI

- [ ] **Compose Modal/Panel:**
  - [ ] To field (autocomplete)
  - [ ] Cc/Bcc toggle
  - [ ] Subject field
  - [ ] Rich text editor
  - [ ] Attachments upload area
  - [ ] Signature toggle
  - [ ] Templates dropdown
  - [ ] Schedule send button
  - [ ] Send button
  - [ ] Save draft button
  - [ ] Discard button
  - [ ] Minimize/fullscreen toggle
- [ ] **Rich Text Editor Features:**
  - [ ] Bold, italic, underline
  - [ ] Heading levels
  - [ ] Bullet points, numbered lists
  - [ ] Links
  - [ ] Images (upload or paste)
  - [ ] Quote formatting
  - [ ] Undo/redo

### Cycle 6: Design Responsive Behavior

- [ ] **Desktop (1024px+):**
  - [ ] Three-column layout (sidebar, list, detail)
  - [ ] All features visible
- [ ] **Tablet (768px-1023px):**
  - [ ] Sidebar toggles (hamburger menu)
  - [ ] Two-column layout (list and detail)
- [ ] **Mobile (< 768px):**
  - [ ] Sidebar hidden (hamburger)
  - [ ] Single-column layout
  - [ ] Swipe between list and detail
  - [ ] Bottom bar with actions
  - [ ] Full-width compose

### Cycle 7: Design Search & Filtering

- [ ] **Search Bar:**
  - [ ] Search query input
  - [ ] Search in (all, subject, from, to, body)
  - [ ] Advanced search toggle
  - [ ] Search suggestions
- [ ] **Advanced Search:**
  - [ ] From: sender email
  - [ ] To: recipient email
  - [ ] Subject: subject keywords
  - [ ] Has: attachments, starred
  - [ ] Is: read, unread, starred
  - [ ] Date range
  - [ ] Size: larger than X
- [ ] **Quick Filters:**
  - [ ] Unread only
  - [ ] Has attachments
  - [ ] Starred
  - [ ] From specific contact
  - [ ] By date (today, week, month)

### Cycle 8: Design Settings & Preferences

- [ ] **Settings Panels:**
  - [ ] **General:**
    - [ ] Language
    - [ ] Time zone
    - [ ] Theme (light/dark)
    - [ ] Density (comfortable, compact, spacious)
  - [ ] **Display:**
    - [ ] Avatar size
    - [ ] Preview pane (hide/show)
    - [ ] Conversation view (threaded/flat)
  - [ ] **Notifications:**
    - [ ] Desktop notifications
    - [ ] Sound alerts
    - [ ] Unread count badge
  - [ ] **Signature:**
    - [ ] Default signature
    - [ ] Per-folder signatures
  - [ ] **Keyboard Shortcuts:**
    - [ ] Show/hide shortcuts
    - [ ] Search (/)
    - [ ] Compose (c)
    - [ ] Reply (r)
    - [ ] Archive (e)
    - [ ] Snooze (s)
    - [ ] Delete (d)

### Cycle 9: Design Empty States & Error States

- [ ] **Empty States:**
  - [ ] No emails in inbox
  - [ ] Search returns no results
  - [ ] No starred emails
  - [ ] No attachments
  - [ ] Folder is empty
- [ ] **Error States:**
  - [ ] Failed to load emails
  - [ ] Failed to send email
  - [ ] Network error
  - [ ] Quota exceeded
  - [ ] Invalid email address
- [ ] **Loading States:**
  - [ ] Skeleton loaders for email list
  - [ ] Loading spinner for detail view
  - [ ] Sending indicator during compose

### Cycle 10: Define Success Metrics

- [ ] Mail app complete when:
  - [ ] [ ] Inbox loads and displays emails
  - [ ] [ ] Clicking email shows detail view
  - [ ] [ ] Compose form opens
  - [ ] [ ] Send email (mock)
  - [ ] [ ] Mark read/unread works
  - [ ] [ ] Star/unstar works
  - [ ] [ ] Archive works
  - [ ] [ ] Delete works
  - [ ] [ ] Search/filters work
  - [ ] [ ] Mobile responsive
  - [ ] [ ] Settings save
  - [ ] [ ] Dark mode works
  - [ ] [ ] Lighthouse > 80

---

## PHASE 2: REACT STATE & COMPONENTS (Cycle 11-30)

**Purpose:** Build React state management and interactive components

### Cycle 11: Create Email Store (Zustand)

- [ ] **Store structure:**
  - [ ] emails: Email[]
  - [ ] contacts: Contact[]
  - [ ] labels: Label[]
  - [ ] currentEmail: Email | null
  - [ ] selectedEmails: string[]
  - [ ] drafts: Email[]
  - [ ] filters: { folder, search, from, to, date, label }
- [ ] **Actions:**
  - [ ] loadEmails(folderId)
  - [ ] setCurrentEmail(emailId)
  - [ ] toggleEmailSelection(emailId)
  - [ ] markAsRead(emailId)
  - [ ] toggleStar(emailId)
  - [ ] archive(emailId)
  - [ ] delete(emailId)
  - [ ] addLabel(emailId, labelId)

### Cycle 12: Create UI Store (Zustand)

- [ ] **Store structure:**
  - [ ] theme: 'light' | 'dark'
  - [ ] sidebarOpen: boolean
  - [ ] composeOpen: boolean
  - [ ] viewMode: 'list' | 'detail' | 'split'
  - [ ] density: 'comfortable' | 'compact' | 'spacious'
  - [ ] unreadCounts: { [folderId]: number }
- [ ] **Actions:**
  - [ ] toggleTheme()
  - [ ] toggleSidebar()
  - [ ] openCompose()
  - [ ] closeCompose()
  - [ ] setViewMode(mode)
  - [ ] setDensity(density)
  - [ ] updateUnreadCount(folderId, count)

### Cycle 13: Create MailSidebar Component

- [ ] **Content:**
  - [ ] Compose button (prominent blue button)
  - [ ] Folder list (Inbox, Starred, Sent, Drafts, Archive, Spam, Trash)
  - [ ] Unread count badges
  - [ ] Custom labels section
  - [ ] Settings button at bottom
- [ ] **Interactions:**
  - [ ] Click folder → filter emails
  - [ ] Click compose → open compose modal
  - [ ] Highlight active folder
  - [ ] Show context menu on right-click

### Cycle 14: Create EmailListItem Component

- [ ] **Display:**
  - [ ] Avatar (initials or image)
  - [ ] Sender name
  - [ ] Subject (truncated)
  - [ ] Preview text (100 chars, gray)
  - [ ] Time (Today 3:45 PM, or Feb 15)
  - [ ] Unread indicator (blue dot)
  - [ ] Star icon (empty or filled)
- [ ] **Interactions:**
  - [ ] Click → select and show detail
  - [ ] Click star → toggle star
  - [ ] Hover → show actions menu
  - [ ] Hover state background highlight
  - [ ] Long press → select multiple

### Cycle 15: Create EmailList Component

- [ ] **Structure:**
  - [ ] List of EmailListItem components
  - [ ] Checkbox to select all
  - [ ] Pagination or infinite scroll
  - [ ] Empty state if no emails
  - [ ] Loading skeleton
- [ ] **Features:**
  - [ ] Sort by (date, sender, subject)
  - [ ] Filter applied (show active filters)
  - [ ] Bulk actions (if multiple selected)
    - [ ] Mark as read/unread
    - [ ] Star/unstar
    - [ ] Move to folder
    - [ ] Delete

### Cycle 16: Create EmailDetail Component

- [ ] **Header:**
  - [ ] Subject (H1)
  - [ ] From, To, Cc, Bcc (show only if present)
  - [ ] Date and time
  - [ ] Show details toggle (if many recipients)
- [ ] **Body:**
  - [ ] HTML rendered (sanitized)
  - [ ] Images displayed
  - [ ] Links clickable
  - [ ] Code blocks formatted
  - [ ] Line breaks preserved
- [ ] **Attachments:**
  - [ ] List of attachments
  - [ ] Download button for each
  - [ ] Preview for images
  - [ ] File icons based on type
- [ ] **Actions:**
  - [ ] Reply button
  - [ ] Reply all button
  - [ ] Forward button
  - [ ] Archive button
  - [ ] Delete button
  - [ ] Spam button
  - [ ] Star button
  - [ ] More menu (snooze, move to label, etc.)
- [ ] **Thread:**
  - [ ] Show related emails
  - [ ] Collapse/expand previous emails
  - [ ] Scroll through thread

### Cycle 17: Create ComposeForm Component

- [ ] **Fields:**
  - [ ] To (autocomplete from contacts)
  - [ ] Cc (hidden by default)
  - [ ] Bcc (hidden by default)
  - [ ] Subject
  - [ ] Body (rich text editor)
- [ ] **Features:**
  - [ ] Autosave draft every 10 seconds
  - [ ] Show "Saving..." indicator
  - [ ] Restore draft if unsaved
  - [ ] Keyboard shortcut (Tab key to next field)
  - [ ] Spell check (browser native)
- [ ] **Buttons:**
  - [ ] Send
  - [ ] Schedule send (future)
  - [ ] Save draft
  - [ ] Discard
  - [ ] Fullscreen mode
- [ ] **Props:**
  - [ ] initialValues (for reply/forward)
  - [ ] onSend (callback)
  - [ ] onSave (callback)
  - [ ] onDiscard (callback)

### Cycle 18: Create RichTextEditor Component

- [ ] **Toolbar:**
  - [ ] Bold, italic, underline buttons
  - [ ] Font size dropdown
  - [ ] Heading dropdown (H1-H6, Normal)
  - [ ] Text color, background color
  - [ ] Bullet list, numbered list
  - [ ] Link button
  - [ ] Image upload
  - [ ] Quote button
  - [ ] Undo, redo
  - [ ] Clear formatting
- [ ] **Content:**
  - [ ] Editable area
  - [ ] Placeholder text "Compose email..."
  - [ ] Tab indent support
  - [ ] Paste rich text
- [ ] **Props:**
  - [ ] value (HTML string)
  - [ ] onChange (callback)
  - [ ] placeholder (text)
  - [ ] disabled (boolean)

### Cycle 19: Create SearchBar Component

- [ ] **Input:**
  - [ ] Searchable input
  - [ ] Clear button (when typing)
  - [ ] Search icon
- [ ] **Autocomplete:**
  - [ ] Suggest recent searches
  - [ ] Suggest contacts
  - [ ] Suggest filters (from:, subject:, etc.)
- [ ] **Props:**
  - [ ] onSearch (callback with query)
  - [ ] onFilter (callback with filter params)
  - [ ] placeholder "Search emails..."

### Cycle 20: Create AdvancedSearch Component

- [ ] **Modal or Panel:**
  - [ ] From field (email input)
  - [ ] To field (email input)
  - [ ] Subject field (text)
  - [ ] Body field (text)
  - [ ] Date range (from/to pickers)
  - [ ] Has attachments checkbox
  - [ ] Size range slider
  - [ ] Search button
  - [ ] Reset button
- [ ] **Props:**
  - [ ] onSearch (callback with filters)
  - [ ] onClose (callback)

### Cycle 21: Create ContactAutoComplete Component

- [ ] **Input field:**
  - [ ] Type to search contacts
  - [ ] Show suggestions below
  - [ ] Handle multiple values (for To field)
  - [ ] Show avatar + name + email
- [ ] **Props:**
  - [ ] value (Contact[])
  - [ ] onChange (callback)
  - [ ] placeholder
  - [ ] allowMultiple (boolean)

### Cycle 22: Create AttachmentUpload Component

- [ ] **Area:**
  - [ ] Drag and drop zone
  - [ ] Click to upload button
  - [ ] List of files being uploaded
  - [ ] Progress bars
  - [ ] Remove button for each file
- [ ] **Props:**
  - [ ] onFilesSelected (callback)
  - [ ] maxSize (bytes)
  - [ ] accept (file types)

### Cycle 23: Create EmailThread Component

- [ ] **Display:**
  - [ ] Latest email at top (expanded)
  - [ ] Previous emails below (collapsed)
  - [ ] Show: "[N more messages]" for collapsed
  - [ ] Click to expand/collapse
- [ ] **Props:**
  - [ ] threadId (to load related emails)
  - [ ] currentEmailId (highlight current)

### Cycle 24: Create ContextMenu Component

- [ ] **Menu items:**
  - [ ] Archive
  - [ ] Delete
  - [ ] Mark as spam
  - [ ] Move to label (submenu)
  - [ ] Mark as read/unread
  - [ ] Star/unstar
  - [ ] Create label
- [ ] **Behavior:**
  - [ ] Right-click to open
  - [ ] Click outside closes
  - [ ] Keyboard navigation
  - [ ] Disabled items grayed out

### Cycle 25: Create SettingsPanel Component

- [ ] **Sections:**
  - [ ] General (language, timezone, theme)
  - [ ] Display (density, avatar size)
  - [ ] Notifications (sound, desktop alerts)
  - [ ] Signature (default, per-folder)
  - [ ] Keyboard shortcuts
- [ ] **Layout:**
  - [ ] Tabs or sidebar nav
  - [ ] Save button
  - [ ] Reset to defaults button

### Cycle 26: Create EmptyState Component

- [ ] **Display:**
  - [ ] Icon (inbox empty, search no results, etc.)
  - [ ] Title ("No emails" / "No results")
  - [ ] Message (helpful text)
  - [ ] CTA button (compose, clear search, etc.)
- [ ] **Props:**
  - [ ] type (inbox-empty, search-empty, folder-empty, etc.)
  - [ ] onAction (callback for button)

### Cycle 27: Create LoadingState Component

- [ ] **Display:**
  - [ ] Skeleton loaders for email list
  - [ ] Skeleton for email detail
  - [ ] Animated loading (pulsing)
- [ ] **Props:**
  - [ ] count (how many skeletons)
  - [ ] variant (list, detail, header)

### Cycle 28: Create HeaderNav Component

- [ ] **Content:**
  - [ ] Mail logo
  - [ ] SearchBar component
  - [ ] Settings icon (click → settings)
  - [ ] Notifications icon (with unread count)
  - [ ] Profile menu (avatar → settings, logout, etc.)
- [ ] **Mobile:**
  - [ ] Hamburger menu button
  - [ ] Hide profile menu

### Cycle 29: Create FloatingComposeButton Component

- [ ] **Display (Mobile):**
  - [ ] Large floating action button (FAB)
  - [ ] "+" icon or "Compose" text
  - [ ] Positioned bottom-right
- [ ] **Interactions:**
  - [ ] Click → open compose modal
  - [ ] Show on scroll down
  - [ ] Hide on scroll up

### Cycle 30: Create EmailCard Component

- [ ] **For detail view:**
  - [ ] Card layout with shadow
  - [ ] Email header
  - [ ] Email body
  - [ ] Attachments
  - [ ] Actions bar at bottom
- [ ] **Props:**
  - [ ] email (Email object)
  - [ ] onReply (callback)
  - [ ] onForward (callback)
  - [ ] onArchive (callback)

---

## PHASE 3: ASTRO PAGES (Cycle 31-40)

**Purpose:** Create main Astro page structure

### Cycle 31: Create Main Layout (MailLayout.astro)

- [ ] **Structure:**
  - [ ] Header (HeaderNav)
  - [ ] Sidebar + Main area grid layout
  - [ ] Theme provider (dark/light)
- [ ] **Responsive:**
  - [ ] Desktop: Sidebar always visible
  - [ ] Mobile: Sidebar hidden (hamburger)
  - [ ] Tablet: Toggle sidebar
- [ ] **Meta:**
  - [ ] Set page title
  - [ ] Set favicon
  - [ ] Theme color tag

### Cycle 32: Create Mail Index Page (mail/index.astro)

- [ ] **Layout:**
  - [ ] Use MailLayout
  - [ ] Three-column or responsive layout
- [ ] **Content:**
  - [ ] Sidebar component (Astro or React)
  - [ ] EmailList component (React)
  - [ ] EmailDetail component (React)
- [ ] **State:**
  - [ ] Load emails from mock data
  - [ ] Pass to React components via props

### Cycle 33: Create Mail Thread Page (mail/[threadId].astro)

- [ ] **Purpose:**
  - [ ] Single thread view (for deep linking)
  - [ ] Shows full thread
  - [ ] Can reply from this page
- [ ] **Content:**
  - [ ] EmailThread component
  - [ ] ComposeForm for reply
- [ ] **Props:**
  - [ ] threadId from URL

---

## PHASE 4: MOCK DATA & INTEGRATION (Cycle 41-50)

**Purpose:** Create realistic mock data and wire up components

### Cycle 41: Create Mock Email Data

- [ ] **Generate sample emails:**
  - [ ] 20-30 sample emails
  - [ ] Varied subjects (work, personal, newsletters)
  - [ ] Different senders
  - [ ] Different timestamps (past few days)
  - [ ] Mix of read/unread
  - [ ] Some with attachments
  - [ ] Some threaded
- [ ] **File:** `src/lib/mockData.ts`

### Cycle 42: Create Mock Contact Data

- [ ] **Sample contacts:**
  - [ ] 10-15 frequently contacted people
  - [ ] Full names
  - [ ] Email addresses
  - [ ] Avatar initials
- [ ] **File:** `src/lib/mockData.ts`

### Cycle 43: Create Mock Label Data

- [ ] **Sample labels:**
  - [ ] Work (red)
  - [ ] Personal (blue)
  - [ ] Bills (orange)
  - [ ] Invoices (purple)
  - [ ] Unread count
- [ ] **File:** `src/lib/mockData.ts`

### Cycle 44: Wire Up Email Store to Mock Data

- [ ] **Initial state:**
  - [ ] Load mock emails on app init
  - [ ] Load mock contacts
  - [ ] Load mock labels
- [ ] **Persistence:**
  - [ ] Save state to localStorage
  - [ ] Load on page refresh

### Cycle 45: Wire Up UI Store to Settings

- [ ] **Default theme:**
  - [ ] Check system preference
  - [ ] Check localStorage
  - [ ] Apply theme class to document
- [ ] **Save preferences:**
  - [ ] Save theme to localStorage
  - [ ] Save density to localStorage
  - [ ] Save sidebar state to localStorage

### Cycle 46: Implement Email Actions

- [ ] **Mark as read:**
  - [ ] Click email → mark as read
  - [ ] Update UI immediately
  - [ ] Update store
  - [ ] Update unread count
- [ ] **Similar for:**
  - [ ] Mark as unread
  - [ ] Star/unstar
  - [ ] Archive
  - [ ] Delete
  - [ ] Mark as spam

### Cycle 47: Implement Compose Draft System

- [ ] **Create draft:**
  - [ ] On compose form open
  - [ ] Autosave every 10 seconds
  - [ ] Save to localStorage
- [ ] **Restore draft:**
  - [ ] If page refreshed with unsaved draft
  - [ ] Show notification "Draft restored"
- [ ] **Discard draft:**
  - [ ] On discard button
  - [ ] Clear from localStorage
  - [ ] Close compose

### Cycle 48: Implement Search & Filters

- [ ] **Search:**
  - [ ] Type in SearchBar
  - [ ] Filter emails by subject/body
  - [ ] Show results in list
- [ ] **Filters:**
  - [ ] Click folder in sidebar → filter by folder
  - [ ] Filter unread → only unread emails
  - [ ] Filter starred → only starred emails
  - [ ] Show "X results" text

### Cycle 49: Implement Responsive Behavior

- [ ] **Mobile < 768px:**
  - [ ] Hide sidebar by default
  - [ ] Show hamburger button
  - [ ] Hamburger click → toggle sidebar
  - [ ] List view only (no detail visible)
  - [ ] Click email → show detail modal
- [ ] **Tablet 768-1024px:**
  - [ ] Hide sidebar by default
  - [ ] Split view when sidebar open
- [ ] **Desktop > 1024px:**
  - [ ] Always show sidebar
  - [ ] Three-column layout

### Cycle 50: Implement Keyboard Shortcuts

- [ ] **Shortcuts:**
  - [ ] `/` → focus search
  - [ ] `c` → compose
  - [ ] `r` → reply
  - [ ] `a` → reply all
  - [ ] `f` → forward
  - [ ] `e` → archive
  - [ ] `d` → delete
  - [ ] `s` → star
  - [ ] `?` → show shortcuts
  - [ ] `j` / `k` → next/prev email

---

## PHASE 5: POLISH & OPTIMIZATION (Cycle 51-70)

**Purpose:** Refine UX, accessibility, performance

### Cycle 51: Add Animations

- [ ] **Transitions:**
  - [ ] Email fade-in when selected
  - [ ] Compose modal slide in
  - [ ] Email delete with slide-out
  - [ ] Archive with bounce
  - [ ] Sidebar toggle slide
- [ ] **Hover effects:**
  - [ ] Email list item highlight
  - [ ] Button scale on hover
  - [ ] Icon color change

### Cycle 52: Implement Accessibility

- [ ] **Keyboard navigation:**
  - [ ] Tab through sidebar items
  - [ ] Tab through email list
  - [ ] Enter to select email
  - [ ] Escape to close modals
- [ ] **Screen reader:**
  - [ ] Semantic HTML (nav, main, article)
  - [ ] Alt text for avatars
  - [ ] ARIA labels for buttons
  - [ ] ARIA live regions for notifications
- [ ] **Color contrast:**
  - [ ] 4.5:1 for text
  - [ ] 3:1 for UI components
  - [ ] No color-only indicators

### Cycle 53: Optimize Performance

- [ ] **Bundle size:**
  - [ ] Code split by route
  - [ ] Lazy load rich text editor
  - [ ] Tree shake unused components
- [ ] **Rendering:**
  - [ ] Use `memo()` on expensive components
  - [ ] Debounce search input
  - [ ] Virtualize long lists (optional)
- [ ] **Images:**
  - [ ] Avatar images cached
  - [ ] Lazy load avatars

### Cycle 54: Add Error Handling

- [ ] **Network errors:**
  - [ ] Show toast on failed load
  - [ ] Retry button
  - [ ] Show cached data if available
- [ ] **Validation:**
  - [ ] Email input validation
  - [ ] Phone number validation
  - [ ] Show error messages
- [ ] **Edge cases:**
  - [ ] Very long subject lines (truncate)
  - [ ] Very long email bodies (lazy load)
  - [ ] No emails (empty state)
  - [ ] No search results (empty state)

### Cycle 55: Add Toast Notifications

- [ ] **Types:**
  - [ ] Success ("Email archived")
  - [ ] Error ("Failed to send")
  - [ ] Info ("Loading...")
  - [ ] Action ("Undo delete")
- [ ] **Behavior:**
  - [ ] Auto-dismiss after 5 seconds
  - [ ] Stack multiple toasts
  - [ ] Undo button for destructive actions

### Cycle 56: Implement Dark Mode

- [ ] **Theme colors:**
  - [ ] Dark backgrounds
  - [ ] Light text
  - [ ] Adjust shadows
  - [ ] Adjust border colors
- [ ] **Media query:**
  - [ ] `prefers-color-scheme: dark`
  - [ ] Toggle button to override
  - [ ] Save preference to localStorage

### Cycle 57: Add Print Styles

- [ ] **Print layout:**
  - [ ] Hide sidebar
  - [ ] Hide actions
  - [ ] Full-width content
  - [ ] Black text on white
  - [ ] Show all email details
  - [ ] Hide signatures

### Cycle 58: Test All Interactions

- [ ] **Compose:**
  - [ ] Open form
  - [ ] Type email
  - [ ] Add to field with autocomplete
  - [ ] Add cc/bcc
  - [ ] Upload attachment
  - [ ] Format text (bold, etc.)
  - [ ] Send button works
  - [ ] Save draft works
- [ ] **Email view:**
  - [ ] Click to open
  - [ ] Scroll through body
  - [ ] Download attachments
  - [ ] Click links
  - [ ] Reply/forward work
- [ ] **Search:**
  - [ ] Type to search
  - [ ] Results update
  - [ ] Clear search
  - [ ] Advanced search works

### Cycle 59: Test Mobile Experience

- [ ] **Devices:**
  - [ ] iPhone SE (375px)
  - [ ] iPhone 12 (390px)
  - [ ] iPad (768px)
  - [ ] Android phone (360px)
- [ ] **Interactions:**
  - [ ] Sidebar toggle works
  - [ ] Compose button accessible
  - [ ] Swipe gestures (optional)
  - [ ] Touch targets large enough
  - [ ] No horizontal scroll

### Cycle 60: Lighthouse Audit

- [ ] **Targets:**
  - [ ] Performance > 85
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
  - [ ] SEO > 90
- [ ] **Fixes:**
  - [ ] Minify CSS/JS
  - [ ] Optimize images
  - [ ] Remove unused code
  - [ ] Add meta descriptions

### Cycle 61: Add Loading Skeletons

- [ ] **For:**
  - [ ] Email list
  - [ ] Email detail
  - [ ] Contacts autocomplete
- [ ] **Appearance:**
  - [ ] Match content layout
  - [ ] Animated pulse
  - [ ] Smooth transition to content

### Cycle 62: Add Drag & Drop

- [ ] **For:**
  - [ ] Drag email to folder/label
  - [ ] Drag attachment to compose
  - [ ] Reorder labels (optional)
- [ ] **Feedback:**
  - [ ] Visual drop zone highlight
  - [ ] Show success toast

### Cycle 63: Add Undo/Redo

- [ ] **For:**
  - [ ] Delete email (3 sec undo window)
  - [ ] Archive email
  - [ ] Label changes
- [ ] **UI:**
  - [ ] Toast with undo button
  - [ ] Also undo via Ctrl+Z (in compose)

### Cycle 64: Create Help Documentation

- [ ] **Pages:**
  - [ ] Getting started
  - [ ] Keyboard shortcuts
  - [ ] Search operators
  - [ ] Settings explained
  - [ ] FAQ
- [ ] **Inline help:**
  - [ ] Tooltips on buttons
  - [ ] Placeholder text in inputs
  - [ ] Help icons with popovers

### Cycle 65: Add Analytics Events

- [ ] **Track:**
  - [ ] View email
  - [ ] Compose email
  - [ ] Send email
  - [ ] Archive/delete
  - [ ] Search query
  - [ ] Settings change
  - [ ] Feature usage

### Cycle 66: Create Settings Page

- [ ] **Options:**
  - [ ] Theme (light/dark)
  - [ ] Density (compact/comfortable/spacious)
  - [ ] Language
  - [ ] Notifications
  - [ ] Signature
  - [ ] Keyboard shortcuts
  - [ ] Display name
- [ ] **Save:**
  - [ ] Save to localStorage
  - [ ] Show success toast
  - [ ] Apply immediately

### Cycle 67: Add Contact Management (Future)

- [ ] **Features:**
  - [ ] View contact details
  - [ ] Add/edit contact
  - [ ] Block sender
  - [ ] Star contact
  - [ ] Contact groups
- [ ] **UI:**
  - [ ] Contact sidebar
  - [ ] Contact card popup

### Cycle 68: Add Snooze Feature (Future)

- [ ] **Options:**
  - [ ] 1 hour, 3 hours, 8 hours
  - [ ] Tomorrow, next week, next month
  - [ ] Custom date/time
- [ ] **UI:**
  - [ ] Snooze button in actions
  - [ ] Show snoozed folder
  - [ ] Notification when snoozed email returns

### Cycle 69: Test Cross-Browser

- [ ] **Browsers:**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] **Issues to check:**
  - [ ] Layout problems
  - [ ] Missing styles
  - [ ] JavaScript errors
  - [ ] Animation smoothness

### Cycle 70: Final Polish

- [ ] **Details:**
  - [ ] Micro-interactions feel good
  - [ ] Animations are smooth
  - [ ] Typography is readable
  - [ ] Colors are appealing
  - [ ] Spacing is consistent
  - [ ] Shadows are subtle
  - [ ] No jarring transitions

---

## SUCCESS CRITERIA

Mail app is complete when:

- ✅ Inbox loads and displays mock emails
- ✅ Clicking email shows detail view with full content
- ✅ Compose form opens and accepts input
- ✅ Send email (mock) works
- ✅ Mark read/unread toggles
- ✅ Star/unstar toggles
- ✅ Archive removes from inbox
- ✅ Delete removes email (with undo)
- ✅ Search filters emails
- ✅ Reply/forward creates new email
- ✅ Attachments display
- ✅ Settings save and apply (theme, density)
- ✅ Mobile responsive (swipeable, full-width)
- ✅ Dark mode works
- ✅ Keyboard shortcuts functional
- ✅ Lighthouse > 80
- ✅ No console errors
- ✅ Accessible (WCAG 2.1 AA)

---

**Timeline:** 70-75 cycles for complete implementation
**Status:** Ready to build
**Next:** Use Claude Code to implement step by step following cycle sequence

---

## COPY THIS PROMPT TO CLAUDE CODE

```
Build a complete mail application (like Gmail) frontend with Astro 5 and React 19:

REQUIREMENTS:
1. Three-column layout: Sidebar (folders/labels), Email list, Email detail view
2. Inbox with 20+ mock emails (varied subjects, senders, timestamps)
3. Email detail view with full HTML body, attachments, metadata
4. Compose form with to/cc/bcc, subject, rich text editor
5. Reply, reply all, forward functionality
6. Actions: mark read/unread, star, archive, delete, spam
7. Search bar with autocomplete for contacts
8. Filters: by folder, unread only, starred only, date range
9. Sidebar with folders (Inbox, Starred, Sent, Drafts, Archive, Spam, Trash)
10. Custom labels with colors and counts

INTERACTIVE FEATURES:
- Zustand store for email state (list, current email, drafts, contacts)
- Zustand store for UI state (theme, sidebar open, view mode)
- Draft autosave (localStorage)
- Mock send action with success toast
- Bulk actions (select multiple emails)
- Keyboard shortcuts (c=compose, r=reply, a=archive, d=delete, etc.)
- Right-click context menu for actions
- Drag and drop emails to folders/labels

DESIGN:
- Mobile-first responsive (sidebar hidden on mobile, hamburger menu)
- Dark mode support with toggle in header
- Three density options: compact, comfortable, spacious
- Smooth animations for all interactions
- Empty states (no emails, search no results)
- Loading skeletons while loading
- Toast notifications for actions

TECHNICAL:
- Astro pages for static structure (mail/index.astro, mail/[threadId].astro)
- React components for interactive parts (Sidebar, EmailList, EmailDetail, Compose)
- Zustand for state management
- localStorage for persistence
- Tailwind v4 for styling
- Lucide icons for UI icons
- Keyboard event handlers for shortcuts
- Focus management for accessibility

DEPLOYMENT:
- Target: Cloudflare Pages
- Build: `bun run build`
- Deploy: `wrangler pages deploy dist`
- Lighthouse target: > 80 on all metrics
```
