#!/bin/bash
# Test script for validate-ontology-structure.py hook

echo "======================================================================="
echo "Testing Ontology Structure Validation Hook"
echo "======================================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Function to run a test
run_test() {
    local test_name="$1"
    local file_path="$2"
    local expected_result="$3"  # "pass" or "fail"

    test_count=$((test_count + 1))
    echo "Test $test_count: $test_name"

    # Run the hook
    output=$(python3 .claude/hooks/validate-ontology-structure.py <<EOF 2>&1
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "$file_path",
    "content": "# Test File"
  }
}
EOF
)

    exit_code=$?

    # Check if test passed
    if [ "$expected_result" = "pass" ]; then
        # For files in /one, expect ✅ validation message
        # For files outside /one, expect exit 0 with no output (ignored)
        if [ $exit_code -eq 0 ]; then
            if echo "$file_path" | grep -q "/one/"; then
                # Files in /one should have validation output
                if echo "$output" | grep -q "✅"; then
                    echo -e "${GREEN}✅ PASS${NC}"
                    pass_count=$((pass_count + 1))
                else
                    echo -e "${RED}❌ FAIL${NC}"
                    echo "Expected: validation pass with ✅"
                    echo "Got exit code: $exit_code"
                    echo "Output: $output"
                    fail_count=$((fail_count + 1))
                fi
            else
                # Files outside /one should be silently ignored
                echo -e "${GREEN}✅ PASS (correctly ignored)${NC}"
                pass_count=$((pass_count + 1))
            fi
        else
            echo -e "${RED}❌ FAIL${NC}"
            echo "Expected: exit code 0"
            echo "Got exit code: $exit_code"
            echo "Output: $output"
            fail_count=$((fail_count + 1))
        fi
    else
        if echo "$output" | grep -q "⚠️"; then
            echo -e "${GREEN}✅ PASS (correctly failed validation)${NC}"
            pass_count=$((pass_count + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            echo "Expected: validation failure"
            echo "Got exit code: $exit_code"
            echo "Output: $output"
            fail_count=$((fail_count + 1))
        fi
    fi

    echo ""
}

echo "Testing valid files in each dimension..."
echo ""

run_test "Valid file in /one/groups/" \
    "/Users/toc/Server/ONE/one/groups/test-group.md" \
    "pass"

run_test "Valid file in /one/people/" \
    "/Users/toc/Server/ONE/one/people/test-person.md" \
    "pass"

run_test "Valid file in /one/things/" \
    "/Users/toc/Server/ONE/one/things/test-thing.md" \
    "pass"

run_test "Valid file in /one/connections/" \
    "/Users/toc/Server/ONE/one/connections/test-connection.md" \
    "pass"

run_test "Valid file in /one/events/" \
    "/Users/toc/Server/ONE/one/events/test-event.md" \
    "pass"

run_test "Valid file in /one/knowledge/" \
    "/Users/toc/Server/ONE/one/knowledge/test-knowledge.md" \
    "pass"

echo "Testing invalid dimensions..."
echo ""

run_test "Invalid dimension /one/invalid/" \
    "/Users/toc/Server/ONE/one/invalid/test.md" \
    "fail"

run_test "File directly in /one/ (not a dimension)" \
    "/Users/toc/Server/ONE/one/test.md" \
    "fail"

echo "Testing invalid filenames..."
echo ""

run_test "Uppercase filename" \
    "/Users/toc/Server/ONE/one/knowledge/Test_File.md" \
    "fail"

run_test "Spaces in filename" \
    "/Users/toc/Server/ONE/one/knowledge/test file.md" \
    "fail"

run_test "CamelCase filename" \
    "/Users/toc/Server/ONE/one/knowledge/TestFile.md" \
    "fail"

echo "Testing files outside /one (should be ignored)..."
echo ""

run_test "File in /web (should be ignored)" \
    "/Users/toc/Server/ONE/web/src/pages/test.astro" \
    "pass"

run_test "File in /backend (should be ignored)" \
    "/Users/toc/Server/ONE/backend/convex/schema.ts" \
    "pass"

run_test "File in root (should be ignored)" \
    "/Users/toc/Server/ONE/README.md" \
    "pass"

echo "======================================================================="
echo "Test Summary"
echo "======================================================================="
echo -e "Total tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
