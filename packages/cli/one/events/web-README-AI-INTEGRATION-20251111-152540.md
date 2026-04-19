# ONE Platform - AI Integration

**Freemium Open Source** - Maximum freedom + optional premium backend services.

## License: ONE License v1.0

**All code is free and open source** under the [ONE License](packages/cli/one/license.md):
- ✅ Unlimited commercial use
- ✅ Modify, sell, resell at any price
- ✅ No usage limits, no royalty fees
- ✅ Create derivative works and SaaS
- ✅ Only requirement: Keep ONE brand/logo/link

## 🆓 Free Tier (No Backend Required)

**What's included:**
- ✅ Client-side AI chat (bring your own OpenAI API key)
- ✅ All 7 Generative UI components (charts, tables, forms, etc.)
- ✅ Basic AI components (Message, MessageList, PromptInput, etc.)
- ✅ Works entirely in browser - no backend required
- ✅ 100% open source under ONE License

**How it works:**
```
Browser → OpenAI API (direct)
```

**Limitations:**
- ❌ Messages lost on page refresh (no persistence)
- ❌ No analytics or usage tracking
- ❌ No human-in-the-loop support
- ❌ No team collaboration
- ❌ You pay OpenAI directly for API usage

**Quick Start:**
```bash
npm install oneie
```

```typescript
import { useAIChat } from 'oneie/hooks/ai';

function MyChat() {
  const { messages, sendMessage } = useAIChat({
    apiKey: 'your-openai-api-key',  // You provide your own key
  });
  
  // Messages are ephemeral (lost on refresh)
}
```

## 🚀 Premium Tier (Optional Backend Services)

Same open source code, but with our hosted backend for persistence and advanced features.

**What you get:**
- ✅ **Persistent chat threads** saved to our Convex database
- ✅ **Human-in-the-loop** - human agents can join AI chats
- ✅ **Token usage analytics** - track costs and usage
- ✅ **RAG integration** - search your organization's knowledge base
- ✅ **Multi-tenancy** - team collaboration
- ✅ **We manage API keys** - no need to provide your own
- ✅ **We pay for AI API calls** - included in subscription

**How it works:**
```
Browser → ONE Backend → Convex DB → OpenAI API
```

**Pricing:**
- **Free** - $0 - Self-host everything (client-side only)
- **Starter** - $29/month - 10K messages, persistence, analytics
- **Pro** - $99/month - 100K messages, HITL, RAG, teams
- **Enterprise** - Custom - Unlimited, SLA, on-premise, white-label

**Upgrade:**
```bash
# Set environment variable to use ONE backend
PUBLIC_BACKEND=on
PUBLIC_BACKEND_URL=https://api.one.ie
```

```typescript
// Same hook, now with premium backend features
const { messages, sendMessage, inviteHuman } = useAIChat({
  threadId: 'thread_123',  // Load from our database
  groupId: 'org_456',      // Multi-tenant scoping
});

// Messages are persistent forever ✅
// Can invite human agents ✅
// Analytics tracked ✅
```

## 📁 File Structure

```
web/src/
├── components/ai/
│   ├── basic/          🆓 Client-side only (works without backend)
│   │   ├── Message.tsx
│   │   ├── MessageList.tsx
│   │   ├── PromptInput.tsx
│   │   └── ...
│   └── premium/        🚀 Requires backend (use with ONE services)
│       ├── Chatbot.tsx
│       ├── AgentMessage.tsx
│       └── ...
├── generative-ui/      🆓 All work without backend
├── hooks/ai/
│   ├── basic/          🆓 Client-side only
│   └── premium/        🚀 Requires backend
└── services/           🚀 Requires backend
```

**Important:** ALL code is open source under ONE License. The distinction is:
- **basic/** = Works in browser without any backend
- **premium/** = Requires database/backend (use ONE's or self-host)

## 🏗️ Architecture

### Free Tier (Self-Hosted, No Backend)
```
Browser → AI Provider API
- No database needed
- No persistence
- You pay AI provider directly
```

### Premium Tier (ONE Backend Services)
```
Browser → ONE Backend → Database → AI Provider
- Convex database for persistence
- Analytics and tracking
- Human-in-the-loop
- RAG integration
- We pay AI provider
```

### Enterprise Tier (Self-Hosted Everything)
```
Your Browser → Your Backend → Your Database → AI Provider
- White-label (remove ONE branding with license)
- On-premise deployment
- Custom models
- Your infrastructure
```

## 🛠️ Self-Hosting Premium Features

You can self-host the backend! All code is open source:

1. Clone the ONE Platform repo
2. Set up Convex database
3. Deploy backend services
4. Point `PUBLIC_BACKEND_URL` to your backend

Or just pay us $29/month and skip the infrastructure hassle.

## 📄 License Summary

**ONE License v1.0** - Maximum freedom:
- ✅ Use commercially without restrictions
- ✅ Modify and sell derivative works
- ✅ No usage limits or royalty fees
- ✅ Self-host or use our services
- ⚠️ Only requirement: Keep ONE brand/logo/link (unless white-label agreement)

See [LICENSE.md](packages/cli/one/license.md) for full details.

## 🤝 Contributing

We welcome contributions! Submit PRs for:
- New AI components
- Bug fixes
- Documentation improvements
- Integration examples

## 📞 Support

- **Free Tier (Self-Hosted):** Community support via GitHub Discussions
- **Premium Tier:** Priority email support (support@one.ie)
- **Enterprise:** Dedicated support + SLA

## 🔗 Links

- **Upgrade to Premium:** https://one.ie/upgrade
- **Documentation:** https://docs.one.ie  
- **Learn AI Agents:** https://one.ie/learn
- **Website:** https://one.ie

---

**Built with the 6-dimension ontology** - A reality model for AI-native platforms.

Maximum freedom. Zero restrictions. Just keep the ONE brand.
