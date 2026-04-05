#!/bin/bash

# End-to-end test: Browser → Pages → Worker → TypeDB → KV → Response
# Tests full stack latency and component health

PAGES_URL="${PAGES_URL:-http://localhost:4321}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8787}"
TYPEDB_URL="${TYPEDB_URL:-https://flsiu1-0.cluster.typedb.com:1729}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

declare -a test_names
declare -a test_latencies
declare -a test_statuses
declare -a test_results

passed=0
failed=0
idx=0

# ============================================================================
# Test function
# ============================================================================

run_test() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="${4:-}"

  echo -n "Testing $name... "

  local t0=$(date +%s%N)
  local response
  local status
  local curl_output

  if [ "$method" = "GET" ]; then
    curl_output=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
  else
    curl_output=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "$url" 2>&1)
  fi

  local t1=$(date +%s%N)
  local latency=$(( (t1 - t0) / 1000000 ))

  # Extract status code (last line)
  status=$(echo "$curl_output" | tail -1)

  # Check if it looks like an HTTP status code
  if ! [[ "$status" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}✗${NC} Connection error: $status"
    test_names[$idx]="$name"
    test_latencies[$idx]="0"
    test_statuses[$idx]="ERR"
    test_results[$idx]="FAIL"
    failed=$((failed + 1))
    idx=$((idx + 1))
    return 1
  fi

  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    echo -e "${GREEN}✓${NC} (${latency}ms)"
    test_names[$idx]="$name"
    test_latencies[$idx]="$latency"
    test_statuses[$idx]="$status"
    test_results[$idx]="PASS"
    passed=$((passed + 1))
    idx=$((idx + 1))
    return 0
  else
    echo -e "${RED}✗${NC} (status: $status, ${latency}ms)"
    test_names[$idx]="$name"
    test_latencies[$idx]="$latency"
    test_statuses[$idx]="$status"
    test_results[$idx]="FAIL"
    failed=$((failed + 1))
    idx=$((idx + 1))
    return 1
  fi
}

# ============================================================================
# Health checks
# ============================================================================

echo "==================================================================="
echo "E2E TEST: Browser → Pages → Worker → TypeDB"
echo "==================================================================="
echo ""
echo "Configuration:"
echo "  Pages:   $PAGES_URL"
echo "  Gateway: $GATEWAY_URL"
echo "  TypeDB:  $TYPEDB_URL"
echo ""
echo "Running tests..."
echo ""

# Test 1: Pages health endpoint (includes TypeDB latency)
run_test "Pages /api/health" "$PAGES_URL/api/health" "GET"

# Test 2: Gateway health endpoint
run_test "Gateway /health" "$GATEWAY_URL/health" "GET"

# Test 3: Query via Pages (browser → pages → gateway → typedb)
query_body='{"query":"match $u isa unit; limit 1; select $u;"}'
run_test "Pages /api/query" "$PAGES_URL/api/query" "POST" "$query_body"

# Test 4: Full state query (complex)
run_test "Pages /api/state" "$PAGES_URL/api/state" "GET"

# Test 5: Signal endpoint (test message routing)
# Note: signal endpoint requires both sender and receiver as unit UIDs
signal_body='{"sender":"e2e-test","receiver":"e2e-target","data":"test signal"}'
run_test "Pages /api/signal" "$PAGES_URL/api/signal" "POST" "$signal_body"

# Test 6: Stats endpoint
run_test "Pages /api/stats" "$PAGES_URL/api/stats" "GET"

# ============================================================================
# Report
# ============================================================================

total=$((passed + failed))

echo ""
echo "==================================================================="
echo "RESULTS"
echo "==================================================================="
echo ""
echo "Passed: $passed"
echo "Failed: $failed"
echo "Total:  $total"
echo ""

if [ $total -gt 0 ]; then
  echo "-------------------------------------------------------------------"
  echo "Latency Breakdown"
  echo "-------------------------------------------------------------------"
  printf "%-40s | %-8s | %-8s | %-6s\n" "Test" "Latency" "Status" "Result"
  printf "%-40s | %-8s | %-8s | %-6s\n" "---" "---" "---" "---"

  total_latency=0
  count=0

  for ((i=0; i<$idx; i++)); do
    name="${test_names[$i]}"
    latency="${test_latencies[$i]}"
    status="${test_statuses[$i]}"
    result="${test_results[$i]}"

    if [ "$result" = "PASS" ]; then
      result_color="${GREEN}${result}${NC}"
      total_latency=$((total_latency + latency))
      count=$((count + 1))
    else
      result_color="${RED}${result}${NC}"
    fi

    printf "%-40s | %8s | %8s | ${result_color}\n" "$name" "${latency}ms" "$status"
  done

  if [ $count -gt 0 ]; then
    avg_latency=$((total_latency / count))
    echo ""
    echo "-------------------------------------------------------------------"
    echo "Statistics (passing tests only)"
    echo "-------------------------------------------------------------------"
    echo "Average latency: ${avg_latency}ms"
    echo "Total latency:   ${total_latency}ms"
    echo "Passing tests:   $count"
  fi
fi

echo ""
echo "==================================================================="

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed.${NC}"
  exit 1
fi
