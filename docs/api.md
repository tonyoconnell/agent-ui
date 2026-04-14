# API Key Authentication

API keys enable programmatic access to the ONE substrate API with granular permissions.

## Generate Key for David

```bash
# Generate API key with read, write, add, edit permissions
bun tsx scripts/generate-api-key.ts --user david --permissions read,write,add,edit
```

Output will be:
```
🔑 Generating API key for: david
📋 Permissions: read, write, add, edit

✅ API Key created!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 API Key (save this securely!):

api_1712500000000_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p678

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key ID: key_1712500000000_abc123def
User: david
Permissions: read, write, add, edit
Created: 2024-04-07T12:00:00.000Z
Status: active
```

**⚠️ IMPORTANT:** Save this key securely. You cannot view it again. Share with David via secure channel only.

## Usage

### Authenticate Requests

Add the `Authorization` header with your API key:

```bash
curl -H "Authorization: Bearer sdsddsd" \
  -X POST https://one-substrate.pages.dev/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "---\nname: agent\n...\n---\n..."
  }'
```

### Response

```json
{
  "ok": true,
  "agent": "agent-name",
  "uid": "group:agent-name",
  "wallet": "0x...",
  "suiObjectId": "0x...",
  "skills": ["skill1", "skill2"]
}
```

## Permissions

Permissions control what David can do:

| Permission | Allows |
|-----------|--------|
| `read` | Query agents, skills, tasks, state |
| `write` | Create/update agent signals and paths |
| `add` | Create new agents and skills |
| `edit` | Modify existing agent definitions |
| `delete` | Remove agents or skills |

Default permissions: `read` only

David's permissions: `read,write,add,edit` (full access for agent management)

## API Key Management

### List Keys for a User

```bash
curl "https://one-substrate.pages.dev/api/keys?action=list&user=david"
```

Response:
```json
{
  "ok": true,
  "keys": [
    {
      "id": "key_1712500000000_abc123def",
      "permissions": "read,write,add,edit",
      "status": "active",
      "created": "2024-04-07T12:00:00.000Z",
      "lastUsed": "2024-04-07T12:15:30.000Z"
    }
  ]
}
```

### Revoke a Key

```bash
curl -X POST "https://one-substrate.pages.dev/api/keys" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "revoke",
    "keyId": "key_1712500000000_abc123def"
  }'
```

Response:
```json
{
  "ok": true,
  "message": "Key revoked"
}
```

## Security

1. **Never commit API keys** — store in `.env` or secrets manager
2. **Use narrow permissions** — only grant what's needed
3. **Rotate keys regularly** — revoke old keys when no longer needed
4. **Keep keys secure** — treat like passwords, use HTTPS only
5. **Monitor usage** — check `last-used` timestamp to detect abuse

## Schema

API keys are stored in TypeDB as:

```typeql
entity api-key,
  owns api-key-id @key,        # Unique identifier
  owns key-hash,               # PBKDF2 hash (never store plaintext)
  owns user-id,                # Who owns this key (e.g., "david")
  owns permissions,            # CSV: "read,write,add,edit"
  owns key-status,             # "active" | "revoked"
  owns created,                # Timestamp
  owns last-used;              # Last API call with this key
```

Keys are hashed with **PBKDF2-SHA256** (100k iterations) — never stored in plaintext.
