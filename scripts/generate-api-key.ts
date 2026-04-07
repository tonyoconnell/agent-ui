/**
 * Generate API key for a user
 * Usage: npx tsx scripts/generate-api-key.ts --user david --permissions read,write,add,edit
 */

import { generateApiKey, hashKey } from '../src/lib/api-key'
import { write } from '../src/lib/typedb'

async function main() {
  const args = process.argv.slice(2)
  const userIdx = args.indexOf('--user')
  const permIdx = args.indexOf('--permissions')

  const user = userIdx !== -1 ? args[userIdx + 1] : 'david'
  const permissions = permIdx !== -1 ? args[permIdx + 1].split(',') : ['read', 'write', 'add', 'edit']

  console.log(`\n🔑 Generating API key for: ${user}`)
  console.log(`📋 Permissions: ${permissions.join(', ')}\n`)

  const plainKey = generateApiKey()
  const keyHash = await hashKey(plainKey)
  const keyId = `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date().toISOString()

  console.log(`📝 Inserting into TypeDB...`)

  await write(`
    insert $k isa api-key,
      has api-key-id "${keyId}",
      has key-hash "${keyHash}",
      has user-id "${user}",
      has permissions "${permissions.join(',')}",
      has key-status "active",
      has created ${now};
  `)

  console.log(`✅ API Key created!\n`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🔐 API Key (save this securely!):`)
  console.log(`\n${plainKey}\n`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`\nKey ID: ${keyId}`)
  console.log(`User: ${user}`)
  console.log(`Permissions: ${permissions.join(', ')}`)
  console.log(`Created: ${now}`)
  console.log(`Status: active\n`)
  console.log(`📌 Usage:\n`)
  console.log(`curl -H "Authorization: Bearer ${plainKey}" \\`)
  console.log(`  -X POST https://your-api.com/api/agents/sync \\`)
  console.log(`  -H "Content-Type: application/json" \\`)
  console.log(`  -d '{"markdown": "..."}'\n`)
}

main().catch(console.error)
