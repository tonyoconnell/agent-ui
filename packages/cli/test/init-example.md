# Example: Running `npx oneie init`

## User Experience

```bash
$ npx oneie init

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    ██████╗ ███╗   ██╗███████╗    Turn ideas into reality         ║
║   ██╔═══██╗████╗  ██║██╔════╝                                    ║
║   ██║   ██║██╔██╗ ██║█████╗      https://one.ie                  ║
║   ██║   ██║██║╚██╗██║██╔══╝                                      ║
║   ╚██████╔╝██║ ╚████║███████╗    npx oneie                       ║
║    ╚═════╝ ╚═╝  ╚═══╝╚══════╝                                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome! Let's build your platform.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What's your name? › Tom O'Connor
? Organization name? › ONE Platform
? What's your current website? › https://one.ie
? What email should we use? › tom@one.ie

✅ Information collected!

✔ Created installation folder: /one-platform
✔ Created ontology subdirectories
✔ Created .onboarding.json handoff file
✔ Updated .env.local with INSTALLATION_NAME=one-platform
✔ Updated .gitignore to exclude /one-platform/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: /one-platform

Next: Let's analyze your website and build your platform!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Launching Claude Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When Claude starts, run:
  /one

This will analyze your website and recommend features.

Launching Claude...
```

## Folder Structure Created

```
/one-platform/                    # Installation root
├── .onboarding.json             # Handoff data for Claude
├── groups/                      # Group-specific docs
├── people/                      # Role and governance docs
├── things/                      # Entity specifications
├── connections/                 # Workflow docs
├── events/                      # Event logs
└── knowledge/                   # AI training data
```

## Generated `.onboarding.json`

```json
{
  "version": "1.0.0",
  "status": "pending_analysis",
  "timestamp": 1729468800000,

  "user": {
    "name": "Tom O'Connor",
    "email": "tom@one.ie"
  },

  "organization": {
    "name": "ONE Platform",
    "slug": "one-platform"
  },

  "website": {
    "url": "https://one.ie",
    "analyzed": false,
    "brandExtracted": false,
    "ontologyGenerated": false
  },

  "features": {
    "selected": [],
    "recommended": []
  },

  "plan": {
    "inferences": [],
    "status": "not_started"
  }
}
```

## Updated `.env.local`

```bash
# Installation Configuration
INSTALLATION_NAME=one-platform
```

## Updated `.gitignore`

```
# Installation folder (private docs)
/one-platform/
```

## Next Steps

When Claude Code starts, run `/one` which will:

1. Read `.onboarding.json` and see status is `pending_analysis`
2. Invoke `agent-onboard` to analyze https://one.ie
3. Extract brand identity (colors, logo, fonts, tone)
4. Generate custom 6-dimension ontology for the business
5. Write results to `/one-platform/knowledge/ontology.md`
6. Update `.onboarding.json` with analysis results
7. Present recommended features based on website analysis
8. Let user select features to build
9. Generate 100-inference plan
10. Build platform iteratively with specialized agents
