import fs from "fs/promises";
import path from "path";

interface UserProfile {
  name: string;
  email: string;
  username: string;
  website?: string;
}

export async function createUserProfile(profile: UserProfile) {
  // Generate filename from name (lowercase, hyphenated)
  const filename = profile.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filePath = path.join(process.cwd(), `one/people/${filename}.md`);

  // Create directory
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Generate content
  const content = `# ${profile.name}

**Role:** Organization Owner (\`org_owner\`)
**Email:** ${profile.email}
**Username:** ${profile.username}
${profile.website ? `**Website:** ${profile.website}\n` : ""}
---

## Identity

- **Name:** ${profile.name}
- **Email:** ${profile.email}
- **Username:** ${profile.username}
- **Role:** \`org_owner\`
${profile.website ? `- **Website:** ${profile.website}\n` : ""}
---

## The Person Entity

\`\`\`typescript
{
  type: "creator",
  name: "${profile.name}",
  properties: {
    role: "org_owner",
    email: "${profile.email}",
    username: "${profile.username}",
    displayName: "${profile.name}",
    bio: "Organization owner",
    ${profile.website ? `website: "${profile.website}",` : ""}

    // Permissions
    permissions: ["*"],  // All permissions as org owner

    // Organization context
    organizationId: null,  // Set when linked to organization
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
\`\`\`

---

## Ownership Connections

### Owns Organization
\`${profile.username}\` → \`org\` via \`owns\`

\`\`\`typescript
{
  fromThingId: ${profile.username}Id,
  toThingId: orgId,
  relationshipType: "owns",
  metadata: {
    ownershipPercentage: 100,
    since: "${new Date().toISOString().split("T")[0]}",
  },
  createdAt: Date.now(),
}
\`\`\`

### Member of Organization
\`${profile.username}\` → \`org\` via \`member_of\`

\`\`\`typescript
{
  fromThingId: ${profile.username}Id,
  toThingId: orgId,
  relationshipType: "member_of",
  metadata: {
    role: "org_owner",
    permissions: ["*"],  // All permissions
    joinedAt: Date.now(),
  },
  createdAt: Date.now(),
}
\`\`\`

---

## Key Principles

- **Organization Owner** - Has full control over the organization
- **All Permissions** - \`permissions: ["*"]\` grants access to everything
- **Ontology Mapping** - Represented as a \`creator\` thing with role metadata
- **Connection-Based Access** - Access granted via \`member_of\` connection

---

## See Also

- [Organization Profile](../organisation/${filename}.md)
- [People Roles](./people.md)
- [Organizations](../organisation/organisation.md)
`;

  // Write file
  await fs.writeFile(filePath, content, "utf-8");

  console.log(`✓ Created ${filePath}`);

  return filePath;
}
