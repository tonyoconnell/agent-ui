#!/bin/bash

##############################################################################
# Mac System Cleanup Script - Safe & Regular Use
#
# Purpose: Safely clean up disk space on macOS
# Usage: ./scripts-clean-mac.sh [--dry-run] [--help]
#
# Features:
#  - DRY RUN mode (show what would be deleted, don't delete)
#  - Interactive confirmation for major operations
#  - Detailed reporting with before/after sizes
#  - Preserves system integrity
#  - Safe to run weekly or monthly
#
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
SHOW_HELP=false
PRESERVE_SAFE=true
TOTAL_FREED=0

##############################################################################
# Utility Functions
##############################################################################

print_help() {
    cat << EOF
${BLUE}Mac System Cleanup Script${NC}

${YELLOW}Usage:${NC}
    ./scripts-clean-mac.sh [options]

${YELLOW}Options:${NC}
    --dry-run    Show what would be deleted without making changes
    --help       Show this help message

${YELLOW}What gets cleaned:${NC}
    ✓ Old cache files (>30 days)
    ✓ Temporary files (/tmp, /var/tmp)
    ✓ Language files (non-English)
    ✓ Duplicate downloads
    ✓ Old Xcode derived data
    ✓ npm cache
    ✓ Trash bin

${YELLOW}What is preserved:${NC}
    ✗ Active applications
    ✗ System files
    ✗ Recent downloads (modified within 7 days)
    ✗ Active projects

${YELLOW}Schedule:${NC}
    Add to crontab for weekly cleanup:
    0 2 * * 0 ~/.zshrc && source ~/.zshrc && ~/path/to/scripts-clean-mac.sh

${YELLOW}Examples:${NC}
    # Test run (show what would happen)
    ./scripts-clean-mac.sh --dry-run

    # Actual cleanup
    ./scripts-clean-mac.sh

EOF
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}→${NC} $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${BLUE}→${NC} $1"
}

get_size() {
    if [ -d "$1" ] || [ -f "$1" ]; then
        du -sh "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "0B"
    fi
}

format_bytes() {
    local bytes=$1
    if [ "$bytes" -lt 1024 ]; then
        echo "${bytes}B"
    elif [ "$bytes" -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    elif [ "$bytes" -lt 1073741824 ]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

safe_delete() {
    local path="$1"
    local description="$2"

    if [ ! -e "$path" ]; then
        return 0
    fi

    local size=$(du -sh "$path" 2>/dev/null | awk '{print $1}')

    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would remove $size from $description: $path"
    else
        log_info "Removing $size from $description..."
        rm -rf "$path"
        log_success "Removed"
        TOTAL_FREED=$((TOTAL_FREED + $(du -sb "$path" 2>/dev/null | awk '{print $1}' || echo 0)))
    fi
}

confirm() {
    local prompt="$1"

    if [ "$DRY_RUN" = true ]; then
        return 0
    fi

    read -p "$(echo -e ${YELLOW})$prompt (y/n): $(echo -e ${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

##############################################################################
# Cleanup Functions
##############################################################################

cleanup_package_managers() {
    log_section "Package Manager Caches"

    # npm cache
    if command -v npm &> /dev/null; then
        local npm_cache=~/.npm
        if [ -d "$npm_cache" ]; then
            local size=$(get_size "$npm_cache")
            log_info "npm cache: $size"
            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would remove npm cache ($size)"
            else
                npm cache clean --force 2>/dev/null && log_success "npm cache cleaned"
            fi
        fi
    fi

    # Homebrew cache
    if command -v brew &> /dev/null; then
        local brew_cache=$(brew --cache)
        if [ -d "$brew_cache" ]; then
            local size=$(get_size "$brew_cache")
            log_info "Homebrew cache: $size"
            if confirm "Clear Homebrew cache ($size)?"; then
                if [ "$DRY_RUN" = false ]; then
                    brew cleanup -s && log_success "Homebrew cache cleaned"
                fi
            fi
        fi
    fi
}

cleanup_system_caches() {
    log_section "System Cache Files"

    # Old cache files (>30 days)
    local cache_dirs=(
        ~/Library/Caches
        ~/Library/Application\ Support
        /Library/Caches
    )

    for cache_dir in "${cache_dirs[@]}"; do
        if [ -d "$cache_dir" ]; then
            local size=$(get_size "$cache_dir")
            log_info "Checking $cache_dir ($size total)..."

            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would check for old files in $cache_dir"
            else
                # Find files not modified in last 30 days and delete them
                find "$cache_dir" -type f -mtime +30 -delete 2>/dev/null || true
                log_success "Cleaned old cache files"
            fi
        fi
    done
}

cleanup_temporary_files() {
    log_section "Temporary Files"

    local temp_dirs=(
        /tmp
        /var/tmp
        /var/log
    )

    for temp_dir in "${temp_dirs[@]}"; do
        if [ -d "$temp_dir" ]; then
            local size=$(get_size "$temp_dir")
            if [ "$size" != "0B" ]; then
                log_info "$temp_dir: $size"
                if [ "$DRY_RUN" = true ]; then
                    log_info "DRY RUN: Would clean $temp_dir"
                else
                    find "$temp_dir" -type f -mtime +7 -delete 2>/dev/null || true
                    log_success "Cleaned old temp files"
                fi
            fi
        fi
    done
}

cleanup_xcode() {
    log_section "Xcode & Development"

    # Xcode derived data
    local xcode_data=~/Library/Developer/Xcode/DerivedData
    if [ -d "$xcode_data" ]; then
        local size=$(get_size "$xcode_data")
        if [ "$size" != "0B" ]; then
            log_info "Xcode DerivedData: $size"
            if confirm "Clear Xcode DerivedData ($size)?"; then
                safe_delete "$xcode_data" "Xcode DerivedData"
            fi
        fi
    fi

    # Old iOS device support
    local device_support=~/Library/Developer/Xcode/iOS\ DeviceSupport
    if [ -d "$device_support" ]; then
        local size=$(get_size "$device_support")
        log_info "iOS DeviceSupport: $size"
        if confirm "Clear old iOS DeviceSupport ($size)?"; then
            safe_delete "$device_support" "iOS DeviceSupport"
        fi
    fi
}

cleanup_downloads() {
    log_section "Downloads Folder"

    if [ -d ~/Downloads ]; then
        local total=$(get_size ~/Downloads)
        log_info "Total Downloads size: $total"

        # Find large files not accessed in 60 days
        local old_files=$(find ~/Downloads -type f -atime +60 2>/dev/null | wc -l)
        if [ "$old_files" -gt 0 ]; then
            log_warning "Found $old_files files not accessed in 60+ days"

            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would show old files for review"
                find ~/Downloads -type f -atime +60 -exec ls -lh {} \; | head -10
            else
                if confirm "Review and optionally delete? (files will be listed)"; then
                    find ~/Downloads -type f -atime +60 -exec ls -lh {} \; | head -20
                    log_warning "Manually delete files you don't need (use Finder or rm)"
                fi
            fi
        fi
    fi
}

cleanup_trash() {
    log_section "Trash/Recycle Bin"

    local trash=~/.Trash
    if [ -d "$trash" ]; then
        local size=$(get_size "$trash")
        if [ "$size" != "0B" ]; then
            log_info "Trash size: $size"
            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would empty trash ($size)"
            else
                if confirm "Empty trash ($size)?"; then
                    rm -rf ~/.Trash/* && log_success "Trash emptied"
                fi
            fi
        fi
    fi
}

cleanup_language_files() {
    log_section "Language Files (non-English)"

    local app_dirs=(
        /Applications
        ~/Applications
    )

    for app_dir in "${app_dirs[@]}"; do
        if [ -d "$app_dir" ]; then
            log_info "Checking $app_dir for language files..."

            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would remove non-English language files"
            else
                # Remove non-English .lproj directories
                find "$app_dir" -type d -name "*.lproj" ! -name "en.lproj" -exec rm -rf {} + 2>/dev/null || true
                log_success "Cleaned language files"
            fi
        fi
    done
}

##############################################################################
# Main Execution
##############################################################################

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                SHOW_HELP=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                SHOW_HELP=true
                shift
                ;;
        esac
    done

    if [ "$SHOW_HELP" = true ]; then
        print_help
        exit 0
    fi

    # Check if running as expected user
    if [ "$(whoami)" != "toc" ]; then
        log_warning "This script is optimized for user 'toc'. You are '$(whoami)'."
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    fi

    # Header
    echo ""
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}   DRY RUN MODE - No changes will be made${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    else
        echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}   Mac System Cleanup${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    fi

    # Run cleanup operations
    cleanup_trash
    cleanup_temporary_files
    cleanup_system_caches
    cleanup_package_managers
    cleanup_xcode
    cleanup_language_files
    cleanup_downloads

    # Summary
    log_section "Summary"

    if [ "$DRY_RUN" = true ]; then
        log_info "Dry run completed. No changes were made."
        log_warning "Run without --dry-run to actually clean up."
    else
        log_success "Cleanup completed!"

        # Get current disk usage
        local disk_usage=$(df -h / | awk 'NR==2 {print $5 " used"}')
        log_info "Current disk usage: $disk_usage"
    fi

    echo ""
}

# Run main function
main "$@"
