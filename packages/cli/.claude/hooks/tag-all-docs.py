#!/usr/bin/env python3
"""
ONE Platform - Metadata Tagging Script
Applies metadata tags to all documentation files.

Usage:
    python3 .claude/hooks/tag-all-docs.py [--dry-run] [--verbose]

This script:
- Scans all markdown files in one/ directory and installation folders
- Adds metadata frontmatter if missing
- Infers dimension, category, and tags from file location and content
- Updates existing metadata if incomplete
- Supports installation-specific and group-specific documentation
- Generates a comprehensive report
"""
import argparse
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import sys
import os

# 6-Dimension Ontology (Universal Reality Model)
DIMENSION_MAP = {
    "groups": "groups",
    "people": "people",
    "things": "things",
    "connections": "connections",
    "events": "events",
    "knowledge": "knowledge",
}

# Category cycle from subdirectories (ontology-aligned)
CATEGORY_MAP = {
    "agents": "agents",
    "plans": "plans",
    "products": "products",
    "features": "features",
    "components": "components",
    "examples": "examples",
    "claude": "agents",
    "protocols": "protocols",
    "workflows": "workflows",
    "patterns": "patterns",
    "architecture": "architecture",
    "specifications": "specifications",
    "guides": "guides",
    "rules": "governance",
}

# Tag suggestions based on keywords in content (ontology-aligned)
TAG_KEYWORDS = {
    "ai": ["ai", "artificial-intelligence", "machine-learning"],
    "agent": ["agent", "ai-agent", "automation"],
    "ontology": ["ontology", "6-dimensions", "reality-model"],
    "protocol": ["protocol", "specification", "interoperability"],
    "architecture": ["architecture", "system-design", "patterns"],
    "frontend": ["frontend", "ui", "astro", "react"],
    "backend": ["backend", "convex", "database", "effect"],
    "blockchain": ["blockchain", "crypto", "web3", "sui", "solana"],
    "authentication": ["auth", "better-auth", "authorization"],
    "testing": ["testing", "quality", "validation"],
    "groups": ["groups", "multi-tenant", "hierarchical"],
    "people": ["people", "roles", "authorization", "governance"],
    "things": ["things", "entities", "types"],
    "connections": ["connections", "relationships", "graph"],
    "events": ["events", "actions", "audit-trail"],
    "knowledge": ["knowledge", "rag", "embeddings", "semantic-search"],
    "cycle": ["cycle", "claude", "planning"],
    "installation": ["installation", "customization", "organization"],
}


class MetadataTagger:
    def __init__(self, project_dir: str, dry_run: bool = False, verbose: bool = False):
        self.project_dir = Path(project_dir)
        self.dry_run = dry_run
        self.verbose = verbose
        self.files_processed = 0
        self.files_tagged = 0
        self.files_updated = 0
        self.files_skipped = 0

    def scan_and_tag_all(self):
        """Scan all markdown files in /one/ and installation folders"""
        markdown_files = []

        # Scan global /one/ directory
        one_dir = self.project_dir / "one"
        if one_dir.exists():
            global_files = list(one_dir.rglob("*.md"))
            markdown_files.extend(global_files)
            print(f"Found {len(global_files)} files in /one/ (global)")
        else:
            print(f"Warning: {one_dir} does not exist")

        # Scan installation folders (any top-level dir except known dirs)
        excluded_dirs = {
            "one", "web", "backend", "apps", ".claude", ".git",
            "node_modules", "dist", "build", "cli", "import", "docs",
            "scripts", "one-inc", "nine-padel", "onei-ie", "one.ie"
        }
        for item in self.project_dir.iterdir():
            if item.is_dir() and item.name not in excluded_dirs and not item.name.startswith("."):
                # This might be an installation folder
                installation_files = list(item.rglob("*.md"))
                if installation_files:
                    markdown_files.extend(installation_files)
                    print(f"Found {len(installation_files)} files in /{item.name}/ (installation)")

        if not markdown_files:
            print("No markdown files found to process")
            return

        print(f"\nTotal: {len(markdown_files)} markdown files to process\n")

        for md_file in markdown_files:
            self.files_processed += 1
            self.process_file(md_file)

    def process_file(self, file_path: Path):
        """Process a single markdown file"""
        try:
            content = file_path.read_text()
            relative_path = file_path.relative_to(self.project_dir)

            # Check if file has metadata
            has_metadata, existing_metadata = self.parse_existing_metadata(content)

            if has_metadata and self.is_metadata_complete(existing_metadata):
                if self.verbose:
                    print(f"✓ {relative_path} - Already has complete metadata")
                self.files_skipped += 1
                return

            # Generate metadata
            metadata = self.generate_metadata(file_path, content, existing_metadata)

            # Apply metadata
            if has_metadata:
                new_content = self.update_metadata(content, metadata)
                action = "Updated"
                self.files_updated += 1
            else:
                new_content = self.add_metadata(content, metadata)
                action = "Tagged"
                self.files_tagged += 1

            if self.dry_run:
                print(f"[DRY RUN] Would {action.lower()}: {relative_path}")
                if self.verbose:
                    print(f"  Metadata: {metadata}")
            else:
                file_path.write_text(new_content)
                print(f"{action}: {relative_path}")
                if self.verbose:
                    print(f"  Metadata: {metadata}")

        except Exception as e:
            print(f"✗ Error processing {file_path.name}: {e}")

    def parse_existing_metadata(self, content: str) -> Tuple[bool, Dict]:
        """Parse existing YAML frontmatter"""
        if not content.startswith("---\n"):
            return False, {}

        # Find end of frontmatter
        end_match = re.search(r"\n---\n", content[4:])
        if not end_match:
            return False, {}

        frontmatter = content[4:4 + end_match.start()]

        # Parse YAML-like metadata (simple parsing)
        metadata = {}
        for line in frontmatter.split("\n"):
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip()

        return True, metadata

    def is_metadata_complete(self, metadata: Dict) -> bool:
        """Check if metadata has all required fields"""
        required_fields = [
            "title",
            "dimension",
            "category",
            "tags",
            "created",
            "updated",
            "version",
            "ai_context"
        ]

        return all(field in metadata for field in required_fields)

    def generate_metadata(
        self,
        file_path: Path,
        content: str,
        existing: Dict
    ) -> Dict:
        """Generate metadata for a file"""
        relative_path = file_path.relative_to(self.project_dir)
        parts = relative_path.parts

        # Detect if this is an installation-specific file
        is_installation = parts[0] not in {"one", "web", "backend", "apps", ".claude"}
        installation_name = parts[0] if is_installation else None

        # Detect if this is group-specific
        is_group = len(parts) > 2 and parts[1] == "groups" if is_installation else False
        group_slug = parts[2] if is_group else None

        # Cycle dimension from directory structure
        if is_installation:
            # Installation folders mirror /one/ structure
            dimension = parts[1] if len(parts) > 1 and parts[1] in DIMENSION_MAP else "knowledge"
        else:
            # Global /one/ structure
            dimension = parts[1] if len(parts) > 1 and parts[1] in DIMENSION_MAP else "knowledge"

        # Cycle category from subdirectories
        category = "general"
        if is_group:
            category = "group-specific"
        elif len(parts) > 2:
            subdir_idx = 3 if is_group else (2 if is_installation else 2)
            if len(parts) > subdir_idx:
                subdir = parts[subdir_idx]
                category = CATEGORY_MAP.get(subdir, subdir)

        # Generate title from filename
        title = existing.get("title") or file_path.stem.replace("-", " ").title()

        # Extract/infer tags
        tags = self.infer_tags(content, file_path, existing)

        # Cycle related dimensions by analyzing content
        related_dimensions = self.infer_related_dimensions(content, dimension)

        # Generate AI context
        ai_context = self.generate_ai_context(
            file_path, dimension, category, content,
            installation_name, group_slug, related_dimensions
        )

        metadata = {
            "title": title,
            "dimension": dimension,
            "category": category,
            "tags": ", ".join(tags),
            "related_dimensions": ", ".join(related_dimensions),
            "created": existing.get("created", datetime.now().strftime("%Y-%m-%d")),
            "updated": datetime.now().strftime("%Y-%m-%d"),
            "version": existing.get("version", "1.0.0"),
            "ai_context": ai_context,
        }

        # Add scope metadata
        if is_installation:
            metadata["scope"] = "installation"
            metadata["installation"] = installation_name
        else:
            metadata["scope"] = "global"

        if is_group:
            metadata["group"] = group_slug

        return metadata

    def infer_tags(self, content: str, file_path: Path, existing: Dict) -> List[str]:
        """Cycle tags from content and context"""
        tags = set()

        # Use existing tags if present
        if existing.get("tags"):
            existing_tags_str = existing["tags"].strip("[]")
            tags.update(tag.strip().strip('"').strip("'") for tag in existing_tags_str.split(","))

        # Add tags based on filename
        filename_lower = file_path.stem.lower()
        for keyword, keyword_tags in TAG_KEYWORDS.items():
            if keyword in filename_lower:
                tags.update(keyword_tags[:2])  # Add first 2 related tags

        # Add tags based on content (first 1000 chars)
        content_sample = content[:1000].lower()
        for keyword, keyword_tags in TAG_KEYWORDS.items():
            if keyword in content_sample:
                tags.add(keyword_tags[0])  # Add primary tag

        # Limit to 10 tags
        return sorted(list(tags))[:10]

    def infer_related_dimensions(self, content: str, primary_dimension: str) -> List[str]:
        """Cycle which other dimensions this document relates to"""
        related = set()
        content_lower = content[:2000].lower()  # Check first 2000 chars

        # Map dimension keywords to dimensions
        dimension_keywords = {
            "groups": ["group", "organization", "multi-tenant", "hierarchical", "parent", "child"],
            "people": ["people", "user", "role", "authorization", "governance", "actor", "creator"],
            "things": ["thing", "entity", "type", "properties", "status"],
            "connections": ["connection", "relationship", "link", "relate", "junction"],
            "events": ["event", "action", "timestamp", "audit", "log", "happened"],
            "knowledge": ["knowledge", "embedding", "vector", "rag", "search", "semantic", "learn"],
        }

        for dimension, keywords in dimension_keywords.items():
            if dimension != primary_dimension:  # Don't include self
                if any(keyword in content_lower for keyword in keywords):
                    related.add(dimension)

        return sorted(list(related))

    def generate_ai_context(
        self,
        file_path: Path,
        dimension: str,
        category: str,
        content: str,
        installation_name: Optional[str] = None,
        group_slug: Optional[str] = None,
        related_dimensions: Optional[List[str]] = None
    ) -> str:
        """Generate AI context description"""
        relative_path = file_path.relative_to(self.project_dir)

        # Extract first heading or first paragraph
        purpose = "Provides information"
        heading_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if heading_match:
            purpose = f"Documents {heading_match.group(1).lower()}"
        else:
            first_para = re.search(r"^[A-Z].+\.", content, re.MULTILINE)
            if first_para:
                purpose = first_para.group(0)[:100]

        # Build context string
        context_parts = [
            f"This document is part of the {dimension} dimension in the {category} category.",
            f"Location: {relative_path}",
            f"Purpose: {purpose}",
        ]

        if installation_name:
            context_parts.append(f"Installation: {installation_name}")

        if group_slug:
            context_parts.append(f"Group: {group_slug}")

        if related_dimensions:
            context_parts.append(f"Related dimensions: {', '.join(related_dimensions)}")

        context_parts.append(f"For AI agents: Read this to understand {file_path.stem.replace('-', ' ')}.")

        return "\n".join(context_parts)

    def add_metadata(self, content: str, metadata: Dict) -> str:
        """Add metadata frontmatter to content"""
        # Build frontmatter dynamically
        frontmatter_lines = ["---"]
        frontmatter_lines.append(f"title: {metadata['title']}")
        frontmatter_lines.append(f"dimension: {metadata['dimension']}")
        frontmatter_lines.append(f"category: {metadata['category']}")
        frontmatter_lines.append(f"tags: {metadata['tags']}")

        if metadata.get('related_dimensions'):
            frontmatter_lines.append(f"related_dimensions: {metadata['related_dimensions']}")

        frontmatter_lines.append(f"scope: {metadata['scope']}")

        if metadata.get('installation'):
            frontmatter_lines.append(f"installation: {metadata['installation']}")

        if metadata.get('group'):
            frontmatter_lines.append(f"group: {metadata['group']}")

        frontmatter_lines.append(f"created: {metadata['created']}")
        frontmatter_lines.append(f"updated: {metadata['updated']}")
        frontmatter_lines.append(f"version: {metadata['version']}")

        # Format ai_context as multiline
        ai_context_indented = "\n  ".join(metadata['ai_context'].split("\n"))
        frontmatter_lines.append(f"ai_context: |\n  {ai_context_indented}")
        frontmatter_lines.append("---\n")

        return "\n".join(frontmatter_lines) + "\n" + content

    def update_metadata(self, content: str, metadata: Dict) -> str:
        """Update existing metadata frontmatter"""
        # Find end of existing frontmatter
        end_match = re.search(r"\n---\n", content[4:])
        if not end_match:
            return self.add_metadata(content, metadata)

        # Replace with new metadata
        body = content[4 + end_match.end():]
        return self.add_metadata(body, metadata)

    def print_summary(self):
        """Print summary of tagging operation"""
        print("\n" + "=" * 70)
        print("METADATA TAGGING SUMMARY")
        print("=" * 70)
        print(f"Files Processed:     {self.files_processed}")
        print(f"Files Tagged:        {self.files_tagged}")
        print(f"Files Updated:       {self.files_updated}")
        print(f"Files Skipped:       {self.files_skipped}")
        print("=" * 70)

        if self.dry_run:
            print("\n[DRY RUN] No files were actually modified.")
            print("Run without --dry-run to apply changes.")
        else:
            print("\n✅ Tagging complete! All files now have metadata.")


def main():
    parser = argparse.ArgumentParser(
        description="Add metadata tags to all ONE Platform documentation files"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be tagged without modifying files"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed output for each file"
    )
    parser.add_argument(
        "--project-dir",
        default=".",
        help="Project root directory (default: current directory)"
    )

    args = parser.parse_args()

    tagger = MetadataTagger(
        project_dir=args.project_dir,
        dry_run=args.dry_run,
        verbose=args.verbose
    )

    print("=" * 70)
    print("ONE PLATFORM METADATA TAGGING")
    print("=" * 70)
    if args.dry_run:
        print("[DRY RUN MODE - No files will be modified]")
    print()

    tagger.scan_and_tag_all()
    tagger.print_summary()


if __name__ == "__main__":
    main()
