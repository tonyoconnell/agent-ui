import fs from "fs/promises";
import path from "path";

interface OrgProfile {
  name: string;
  slug: string;
  domain: string;
  ownerName: string;
  ownerUsername: string;
}

export async function createOrgProfile(profile: OrgProfile) {
  const filePath = path.join(
    process.cwd(),
    `one/organisation/${profile.slug}.md`
  );

  // Create directory
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Generate content
  const content = `# ${profile.name}

**Slug:** \`${profile.slug}\`
**Domain:** ${profile.domain}
**Owner:** ${profile.ownerName} (100%)
**Status:** Active
**Plan:** Enterprise

---

## Identity

- **Name:** ${profile.name}
- **Slug:** \`${profile.slug}\`
- **Domain:** ${profile.domain}
- **Owner:** ${profile.ownerName}
- **Status:** Active
- **Plan:** Enterprise

---

## The Organization Entity

\`\`\`typescript
{
  type: "organization",
  name: "${profile.name}",
  properties: {
    // Identity
    slug: "${profile.slug}",
    domain: "${profile.domain}",
    description: "Organization created via ONE CLI",

    // Status & Plan
    status: "active",
    plan: "enterprise",

    // Limits & Usage
    limits: {
      users: 1000,
      storage: 100000,
      apiCalls: -1,        // Unlimited
      inferences: -1,      // Unlimited
    },
    usage: {
      users: 0,
      storage: 0,
      apiCalls: 0,
      inferences: 0,
    },

    // Settings
    settings: {
      allowSignups: true,
      requireEmailVerification: true,
      enableTwoFactor: true,
      inferenceEnabled: true,
    },

    // Public info
    website: "https://${profile.domain}",
    createdAt: Date.now(),
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
\`\`\`

---

## Ownership Connections

### ${profile.ownerName} Owns ${profile.name}
\`${profile.ownerUsername}\` → \`${profile.slug}\` via \`owns\`

\`\`\`typescript
{
  fromThingId: ${profile.ownerUsername}Id,
  toThingId: ${profile.slug}Id,
  relationshipType: "owns",
  metadata: {
    ownershipPercentage: 100,
    since: "${new Date().toISOString().split("T")[0]}",
  },
  createdAt: Date.now(),
}
\`\`\`

### ${profile.ownerName} is Member of ${profile.name}
\`${profile.ownerUsername}\` → \`${profile.slug}\` via \`member_of\`

\`\`\`typescript
{
  fromThingId: ${profile.ownerUsername}Id,
  toThingId: ${profile.slug}Id,
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

- **Multi-Tenant Isolation** - Organization partitions the data space
- **Owner Control** - ${profile.ownerName} has full control (100% ownership)
- **Enterprise Plan** - Unlimited resources for growth
- **Ontology Mapping** - Dimension 1 (Organizations) in the 6-dimension model

---

## See Also

- [Owner Profile](../people/${profile.ownerUsername}.md)
- [Organization Structure](./organisation.md)
- [Multi-Tenancy](../connections/multitenant.md)
`;

  // Write file
  await fs.writeFile(filePath, content, "utf-8");

  console.log(`✓ Created ${filePath}`);

  return filePath;
}
