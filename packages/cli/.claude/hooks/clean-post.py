#!/usr/bin/env python3
"""
ONE Platform - Clean Agent Post-Cycle Hook
Validates cleanup and 6-dimension ontology alignment.

This hook runs after agent-clean operations to verify:
- Root directory contains ONLY approved files (README.md, LICENSE.md, SECURITY.md, CLAUDE.md, AGENTS.md)
- Documentation is organized by 6-dimension ontology (groups, people, things, connections, events, knowledge)
- No temporary artifacts or misplaced files remain
- Files have proper metadata frontmatter
- Directory structure aligns with ontology principles
"""
import json
import sys
import os
from pathlib import Path
from typing import Dict, Any, List
import subprocess
import shutil
from datetime import datetime

# Temporary file patterns to clean
TEMP_PATTERNS = [
    "*.tmp",
    "*.swp",
    "*~",
    "*.bak",
    ".DS_Store",
    "*.log",
]

# Directories to clean
CLEAN_DIRS = [
    ".astro",
    "dist",
    "node_modules/.cache",
    ".claude/state/temp",
]

# Archive directory for old versions
ARCHIVE_DIR = ".claude/archive"

# Approved root directory files (ONTOLOGY POLICY)
APPROVED_ROOT_FILES = [
    "README.md",
    "LICENSE.md",
    "SECURITY.md",
    "CLAUDE.md",
    "AGENTS.md",
    ".gitignore",
    ".env",
    ".env.local",
    ".env.example",
]

# 6-Dimension Ontology Directories
ONTOLOGY_DIMENSIONS = [
    "groups",      # Multi-tenant isolation with hierarchical nesting
    "people",      # Authorization & governance
    "things",      # Every "thing" - users, agents, content, tokens, courses
    "connections", # Every relationship - owns, follows, taught_by, powers
    "events",      # Every action - purchased, created, viewed, completed
    "knowledge",   # Labels + chunks + vectors powering RAG & search
]


class CleanupAgent:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
        self.actions_taken: List[str] = []
        self.violations: List[str] = []
        self.warnings: List[str] = []
        self.files_removed: int = 0
        self.files_organized: int = 0
        self.files_tagged: int = 0
        self.space_freed: int = 0  # in bytes
        self.ontology_aligned: bool = True

    def log_action(self, action: str):
        """Log a cleanup action"""
        self.actions_taken.append(action)

    def log_violation(self, violation: str):
        """Log an ontology violation"""
        self.violations.append(violation)
        self.ontology_aligned = False

    def log_warning(self, warning: str):
        """Log a warning (not critical but should be addressed)"""
        self.warnings.append(warning)

    def remove_temp_files(self):
        """Remove temporary and backup files"""
        removed = []

        for pattern in TEMP_PATTERNS:
            for temp_file in self.project_dir.rglob(pattern):
                # Skip node_modules and .git
                if "node_modules" in str(temp_file) or ".git" in str(temp_file):
                    continue

                try:
                    file_size = temp_file.stat().st_size
                    temp_file.unlink()
                    removed.append(str(temp_file.relative_to(self.project_dir)))
                    self.space_freed += file_size
                    self.files_removed += 1
                except Exception as e:
                    pass  # Skip files we can't remove

        if removed:
            self.log_action(f"Removed {len(removed)} temporary files")
            for file in removed[:5]:
                self.log_action(f"  • {file}")
            if len(removed) > 5:
                self.log_action(f"  ... and {len(removed) - 5} more")

    def clean_build_artifacts(self):
        """Clean build and cache directories"""
        for clean_dir in CLEAN_DIRS:
            dir_path = self.project_dir / clean_dir
            if dir_path.exists() and dir_path.is_dir():
                try:
                    # Calculate size before deletion
                    total_size = sum(
                        f.stat().st_size
                        for f in dir_path.rglob("*")
                        if f.is_file()
                    )

                    shutil.rmtree(dir_path)
                    self.space_freed += total_size
                    self.log_action(f"Cleaned: {clean_dir} ({self._format_size(total_size)})")
                except Exception:
                    pass  # Skip if we can't clean

    def validate_root_directory(self):
        """Validate root directory only contains approved files (ONTOLOGY POLICY)"""
        # Check for unapproved files in root
        root_files = [
            f for f in self.project_dir.glob("*")
            if f.is_file() and not f.name.startswith(".")
        ]

        violations = []
        for root_file in root_files:
            if root_file.name not in APPROVED_ROOT_FILES:
                violations.append(root_file.name)
                self.log_violation(
                    f"POLICY VIOLATION: {root_file.name} must be moved to /one/<dimension>/"
                )

        if violations:
            self.log_violation(
                f"Root directory contains {len(violations)} unapproved file(s). "
                f"Only README.md, LICENSE.md, SECURITY.md, CLAUDE.md, AGENTS.md are allowed."
            )

        return len(violations) == 0

    def validate_ontology_structure(self):
        """Validate /one directory follows 6-dimension ontology"""
        one_dir = self.project_dir / "one"
        if not one_dir.exists():
            self.log_violation("CRITICAL: /one directory missing - 6-dimension ontology not found")
            return False

        # Check each dimension exists
        missing_dimensions = []
        for dimension in ONTOLOGY_DIMENSIONS:
            dimension_path = one_dir / dimension
            if not dimension_path.exists():
                missing_dimensions.append(dimension)
                self.log_warning(f"Dimension directory missing: /one/{dimension}/")

        if missing_dimensions:
            self.log_warning(
                f"Missing {len(missing_dimensions)} dimension directories: {', '.join(missing_dimensions)}"
            )

        # Check for non-ontology directories in /one
        for item in one_dir.iterdir():
            if item.is_dir() and item.name not in ONTOLOGY_DIMENSIONS and not item.name.startswith("."):
                self.log_warning(
                    f"Non-ontology directory in /one: {item.name} (should be one of: {', '.join(ONTOLOGY_DIMENSIONS)})"
                )

        return len(missing_dimensions) == 0

    def organize_files(self):
        """Organize files into correct ontology directories"""
        # Check for misplaced markdown files in root
        root_md_files = [
            f for f in self.project_dir.glob("*.md")
            if f.name not in APPROVED_ROOT_FILES
        ]

        for md_file in root_md_files:
            # Suggest moving to one/knowledge/ (default dimension for documentation)
            target_dir = self.project_dir / "one" / "knowledge"
            if target_dir.exists():
                try:
                    target_path = target_dir / md_file.name
                    if not target_path.exists():
                        shutil.move(str(md_file), str(target_path))
                        self.files_organized += 1
                        self.log_action(f"Moved: {md_file.name} → one/knowledge/ (ontology-aligned)")
                except Exception:
                    self.log_warning(f"Could not move {md_file.name} to one/knowledge/")
                    pass

    def update_metadata_tags(self):
        """Update metadata tags on recently modified files"""
        # Find markdown files modified in last cycle
        recent_files = []
        cutoff_time = datetime.now().timestamp() - 3600  # Last hour

        for md_file in (self.project_dir / "one").rglob("*.md"):
            try:
                if md_file.stat().st_mtime > cutoff_time:
                    recent_files.append(md_file)
            except Exception:
                pass

        # Add/update metadata tags
        for md_file in recent_files:
            if self._add_metadata_if_missing(md_file):
                self.files_tagged += 1
                self.log_action(f"Tagged: {md_file.relative_to(self.project_dir)}")

    def _add_metadata_if_missing(self, file_path: Path) -> bool:
        """Add metadata frontmatter if missing (ontology-aware)"""
        try:
            content = file_path.read_text()

            # Check if already has frontmatter
            if content.startswith("---\n"):
                return False

            # Cycle metadata from file location
            relative_path = file_path.relative_to(self.project_dir)
            parts = relative_path.parts

            # Determine dimension and validate it's in ontology
            dimension = parts[1] if len(parts) > 1 and parts[0] == "one" else "knowledge"
            if dimension not in ONTOLOGY_DIMENSIONS:
                self.log_warning(
                    f"File in non-ontology location: {relative_path} (dimension: {dimension})"
                )
                dimension = "knowledge"  # Default fallback

            category = parts[2] if len(parts) > 2 else "general"

            # Ontology-specific context hints
            dimension_contexts = {
                "groups": "Multi-tenant isolation and hierarchical nesting",
                "people": "Authorization, governance, and roles",
                "things": "Entities - users, agents, content, tokens, courses",
                "connections": "Relationships and protocols between entities",
                "events": "Actions, state changes, and audit trails",
                "knowledge": "Documentation, patterns, rules, and guides",
            }

            # Generate ontology-aligned metadata
            metadata = f"""---
title: {file_path.stem.replace("-", " ").title()}
dimension: {dimension}
category: {category}
ontology: 6-dimension
tags: []
created: {datetime.now().strftime("%Y-%m-%d")}
updated: {datetime.now().strftime("%Y-%m-%d")}
version: 1.0.0
ai_context: |
  6-Dimension Ontology: {dimension}
  Context: {dimension_contexts.get(dimension, "General documentation")}
  Location: {relative_path}
  For AI agents: Read this to understand {file_path.stem.replace("-", " ")}.
---

"""
            # Prepend metadata
            new_content = metadata + content
            file_path.write_text(new_content)
            return True

        except Exception:
            return False

    def archive_old_versions(self):
        """Archive old versions of files (if backup exists)"""
        archive_dir = self.project_dir / ARCHIVE_DIR
        archive_dir.mkdir(parents=True, exist_ok=True)

        # Find .bak files and archive them
        for bak_file in self.project_dir.rglob("*.bak"):
            if "node_modules" in str(bak_file) or ".git" in str(bak_file):
                continue

            try:
                # Create date-stamped archive
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                archive_name = f"{bak_file.stem}_{timestamp}.bak"
                archive_path = archive_dir / archive_name

                shutil.move(str(bak_file), str(archive_path))
                self.log_action(f"Archived: {bak_file.name}")
            except Exception:
                pass

    def _format_size(self, bytes: int) -> str:
        """Format bytes as human-readable size"""
        for unit in ["B", "KB", "MB", "GB"]:
            if bytes < 1024:
                return f"{bytes:.1f} {unit}"
            bytes /= 1024
        return f"{bytes:.1f} TB"

    def run_cleanup(self):
        """Run all cleanup operations with ontology validation"""
        # Phase 1: Validate ontology structure
        self.log_action("Phase 1: Validating 6-dimension ontology structure...")
        self.validate_ontology_structure()
        self.validate_root_directory()

        # Phase 2: Clean temporary artifacts
        self.log_action("Phase 2: Removing temporary artifacts...")
        self.remove_temp_files()
        self.clean_build_artifacts()

        # Phase 3: Organize files into ontology dimensions
        self.log_action("Phase 3: Organizing files into ontology dimensions...")
        self.organize_files()

        # Phase 4: Update metadata with ontology context
        self.log_action("Phase 4: Updating metadata with ontology context...")
        self.update_metadata_tags()

        # Phase 5: Archive old versions
        self.log_action("Phase 5: Archiving old versions...")
        self.archive_old_versions()


def generate_report(agent: CleanupAgent) -> str:
    """Generate cleanup report with ontology compliance status"""

    # Determine ontology status icon
    ontology_icon = "✅" if agent.ontology_aligned else "⚠️"
    ontology_status = "ALIGNED" if agent.ontology_aligned else "VIOLATIONS FOUND"

    report = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹 CLEANUP VALIDATION - Agent Clean Post-Cycle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{ontology_icon} ONTOLOGY STATUS: {ontology_status}
   6-Dimension Structure: groups | people | things | connections | events | knowledge

📊 CLEANUP METRICS:
  • Files Removed: {agent.files_removed}
  • Files Organized: {agent.files_organized}
  • Files Tagged: {agent.files_tagged}
  • Space Freed: {agent._format_size(agent.space_freed)}

"""

    # Show violations if any
    if agent.violations:
        report += "🚨 ONTOLOGY VIOLATIONS:\n"
        for violation in agent.violations[:5]:
            report += f"  • {violation}\n"
        if len(agent.violations) > 5:
            report += f"  ... and {len(agent.violations) - 5} more violations\n"
        report += "\n"

    # Show warnings if any
    if agent.warnings:
        report += "⚠️  WARNINGS:\n"
        for warning in agent.warnings[:5]:
            report += f"  • {warning}\n"
        if len(agent.warnings) > 5:
            report += f"  ... and {len(agent.warnings) - 5} more warnings\n"
        report += "\n"

    # Show actions taken
    if agent.actions_taken:
        report += "✅ ACTIONS TAKEN:\n"
        for action in agent.actions_taken[:10]:
            report += f"  {action}\n"
        if len(agent.actions_taken) > 10:
            report += f"  ... and {len(agent.actions_taken) - 10} more actions\n"
        report += "\n"
    else:
        report += "✨ Environment was already clean - no actions needed!\n\n"

    # Next steps based on ontology compliance
    if agent.ontology_aligned:
        report += """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 NEXT STEPS:
  ✅ Ontology structure validated (6 dimensions)
  ✅ Root directory contains only approved files
  ✅ Documentation organized by ontology dimensions
  ✅ Temporary artifacts removed
  ✅ Ready for next cycle

🔄 Run /done to advance to next cycle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    else:
        report += """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ACTION REQUIRED:
  • Fix ontology violations before proceeding
  • Move misplaced files to /one/<dimension>/
  • Ensure root directory contains only approved files
  • Run cleanup again after fixes

📖 Reference: /one/knowledge/ontology.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    return report


def main():
    try:
        # Load hook input from stdin
        input_data = json.load(sys.stdin)

        # Get project directory
        project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")

        # Run cleanup
        agent = CleanupAgent(project_dir)
        agent.run_cleanup()

        # Generate report
        report = generate_report(agent)

        # Save cleanup metrics
        state_file = Path(project_dir) / ".claude" / "state" / "cleanup_metrics.json"
        state_file.parent.mkdir(parents=True, exist_ok=True)

        metrics = {
            "last_cleanup": datetime.now().isoformat(),
            "ontology_aligned": agent.ontology_aligned,
            "violations": agent.violations,
            "warnings": agent.warnings,
            "files_removed": agent.files_removed,
            "files_organized": agent.files_organized,
            "files_tagged": agent.files_tagged,
            "space_freed": agent.space_freed,
            "actions": agent.actions_taken
        }

        state_file.write_text(json.dumps(metrics, indent=2))

        # Output report
        print(report)
        sys.exit(0)

    except Exception as e:
        # Don't block on hook errors
        print(f"Error in clean-post hook: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
