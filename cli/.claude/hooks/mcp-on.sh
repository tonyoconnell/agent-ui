#!/bin/bash

# MCP Server Toggle Script
# Enables/disables MCP (Model Context Protocol) servers for Claude Code
# Usage: ./mcp-on.sh [on|off|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MCP_CONFIG="$SCRIPT_DIR/.mcp.json"
MCP_CONFIG_OFF="$SCRIPT_DIR/.mcp.json.off"
MCP_CONFIG_ON="$SCRIPT_DIR/.mcp.json.on"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show status
show_status() {
  if [ -f "$MCP_CONFIG" ]; then
    echo -e "${GREEN}✓ MCPs are ON${NC}"
    echo ""
    echo "Active MCP Servers:"
    grep '"[a-z-]*":\s*{' "$MCP_CONFIG" | grep -v "env\|args\|command\|notes\|disabled" | sed 's/.*"\([^"]*\)".*/\1/' | sort -u | sed 's/^/  • /'
    echo ""
    echo "Token usage: ~15k (full MCPs enabled)"
  elif [ -f "$MCP_CONFIG_OFF" ]; then
    echo -e "${YELLOW}⊘ MCPs are OFF${NC}"
    echo ""
    echo "Available MCP Servers (disabled):"
    grep '"[a-z-]*":\s*{' "$MCP_CONFIG_OFF" | grep -v "env\|args\|command\|notes\|disabled" | sed 's/.*"\([^"]*\)".*/\1/' | sort -u | sed 's/^/  • /'
    echo ""
    echo "Token savings: ~10k (MCPs disabled)"
    echo "Use './mcp-on.sh on' to enable"
  else
    echo -e "${RED}✗ No MCP configuration found${NC}"
  fi
}

# Function to turn on MCPs
turn_on() {
  if [ -f "$MCP_CONFIG" ]; then
    echo -e "${YELLOW}MCPs are already ON${NC}"
    return 0
  fi

  if [ ! -f "$MCP_CONFIG_OFF" ]; then
    echo -e "${RED}Error: .mcp.json.off not found${NC}"
    exit 1
  fi

  # Backup current state if .mcp.json exists
  if [ -f "$MCP_CONFIG" ]; then
    cp "$MCP_CONFIG" "$MCP_CONFIG_ON"
    echo -e "${BLUE}Backed up current config to .mcp.json.on${NC}"
  fi

  # Enable MCPs by renaming .mcp.json.off to .mcp.json
  cp "$MCP_CONFIG_OFF" "$MCP_CONFIG"

  # Enable all MCPs by removing "disabled": true
  sed -i '' 's/"disabled": true,/"disabled": false,/g' "$MCP_CONFIG"

  echo -e "${GREEN}✓ MCPs turned ON${NC}"
  echo ""
  echo "Changes:"
  echo "  • Enabled: shadcn, cloudflare-builds, cloudflare-observability"
  echo "  • Enabled: cloudflare-docs, chrome-devtools, figma, astro-docs, stripe"
  echo ""
  echo -e "${YELLOW}Action Required:${NC} Restart Claude Code to activate"
  echo ""
  echo "MCP Servers now available:"
  show_status | tail -n +3
}

# Function to turn off MCPs
turn_off() {
  if [ -f "$MCP_CONFIG_OFF" ] && [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${YELLOW}MCPs are already OFF${NC}"
    return 0
  fi

  if [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${RED}Error: .mcp.json not found${NC}"
    exit 1
  fi

  # Backup current state
  cp "$MCP_CONFIG" "$MCP_CONFIG_ON"

  # Remove .mcp.json to disable MCPs
  rm "$MCP_CONFIG"

  echo -e "${GREEN}✓ MCPs turned OFF${NC}"
  echo ""
  echo "Changes:"
  echo "  • Disabled all MCP servers"
  echo "  • Freed ~10k context tokens"
  echo ""
  echo -e "${YELLOW}Action Required:${NC} Restart Claude Code to apply"
  echo ""
  echo "Previous config saved to: .mcp.json.on"
  echo "To restore: ./mcp-on.sh on"
}

# Main logic
case "${1:-status}" in
  on)
    turn_on
    ;;
  off)
    turn_off
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 {on|off|status}"
    echo ""
    echo "Commands:"
    echo "  on     - Enable all MCP servers"
    echo "  off    - Disable all MCP servers (saves ~10k tokens)"
    echo "  status - Show current MCP status"
    echo ""
    echo "Examples:"
    echo "  $0 on       # Turn MCPs on"
    echo "  $0 off      # Turn MCPs off (token saver)"
    echo "  $0 status   # Check current status"
    exit 1
    ;;
esac
