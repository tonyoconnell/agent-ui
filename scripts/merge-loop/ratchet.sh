#!/usr/bin/env bash
# ratchet.sh — snapshot trunk metrics / score merge cycles
# snapshot [--after]   capture metrics → before.json or after.json
# score [--landed N]   compute scores from both files → ratchet.json
set -euo pipefail
DIR=".merge-loop/ratchet"; mkdir -p "$DIR"
cmd="${1:-}"; shift || true

if [[ "$cmd" == "snapshot" ]]; then
  out="$DIR/before.json"
  [[ "${1:-}" == "--after" ]] && out="$DIR/after.json"
  loc=$(find src agents scripts \( -name "*.ts" -o -name "*.tsx" -o -name "*.astro" -o -name "*.md" \) \
    2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1+0}')
  tests_pass=$(bun run test --run 2>/dev/null | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | tail -1 || true)
  bundle_bytes=$(find dist -name "*.js" 2>/dev/null | xargs wc -c 2>/dev/null | sort -n | tail -1 | awk '{print $1+0}' || true)
  tsc_errors=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{\n  "ts": "%s",\n  "loc": %s,\n  "tests_pass": %s,\n  "build_ms": 0,\n  "bundle_bytes": %s,\n  "tsc_errors": %s\n}\n' \
    "$ts" "${loc:-0}" "${tests_pass:-0}" "${bundle_bytes:-0}" "${tsc_errors:-0}" | tee "$out"
  echo "→ saved $out" >&2

elif [[ "$cmd" == "score" ]]; then
  landed_arg=0
  while [[ $# -gt 0 ]]; do
    [[ "${1:-}" == "--landed" ]] && { landed_arg="${2:-0}"; shift 2; } || shift
  done
  [[ -f "$DIR/before.json" ]] || { echo "missing $DIR/before.json" >&2; exit 1; }
  [[ -f "$DIR/after.json"  ]] || { echo "missing $DIR/after.json"  >&2; exit 1; }
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  awk -v larg="$landed_arg" -v ts="$ts" -v bf="$DIR/before.json" '
  function clip(x){ return x<0?0:(x>1?1:x) }
  function val(   v){ v=$0; sub(/.*: */,"",v); gsub(/[^0-9].*/,"",v); return v+0 }
  FILENAME==bf { f=1 } FILENAME!=bf { f=2 }
  /\"loc\"/          { if(f==1) bl=val(); else al=val() }
  /\"tests_pass\"/   { if(f==1) bt=val(); else at=val() }
  /\"build_ms\"/     { if(f==1) bb=val(); else ab=val() }
  /\"bundle_bytes\"/ { if(f==1) bn=val(); else an=val() }
  /\"tsc_errors\"/   { if(f==1) be=val(); else ae=val() }
  END {
    dl=al-bl; dt=at-bt; db=ab-bb; dn=an-bn; de=ae-be
    landed=(larg+0>0)?larg+0:(dl>0?dl:1)
    sl=clip(-dl/landed+0.5); st=clip(dt/10+0.5)
    sb=clip(-db/1000+0.5);   sn=clip(-dn/(1024*1024)+0.5)
    r=0.4*sl+0.2*st+0.2*sb+0.2*sn
    r=int(r*100+0.5)/100
    gate=(r>=0.40)?"PASS":(r>=0.30)?"WARN":"FAIL"
    printf "{\n  \"ts\": \"%s\",\n  \"delta_loc\": %d,\n  \"delta_tests\": %d,\n",ts,dl,dt
    printf "  \"delta_build_ms\": %d,\n  \"delta_bundle_bytes\": %d,\n  \"delta_tsc_errors\": %d,\n",db,dn,de
    printf "  \"landed_loc\": %d,\n  \"scores\": {\n",landed
    printf "    \"loc\": %.2f,\n    \"tests\": %.2f,\n    \"build\": %.2f,\n    \"bundle\": %.2f\n  },\n",sl,st,sb,sn
    printf "  \"ratchet\": %.2f,\n  \"gate\": \"%s\"\n}\n",r,gate
    printf "\nratchet score\n  loc %+d → %.2f  tests %+d → %.2f\n  build %+dms → %.2f  bundle %+d → %.2f\n  ratchet %.2f  [%s]\n",\
      dl,sl,dt,st,db,sb,dn,sn,r,gate > "/dev/stderr"
  }' "$DIR/before.json" "$DIR/after.json" | tee "$DIR/ratchet.json"

else
  echo "usage: ratchet.sh snapshot [--after] | score [--landed N]" >&2; exit 1
fi
