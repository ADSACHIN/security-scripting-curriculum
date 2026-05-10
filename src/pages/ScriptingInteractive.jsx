import { useState, useRef } from "react";

const C = {
  amber: "#ffb000", amberD: "#cc8800", amberF: "#ffe066",
  bg: "#0a0700", bg2: "#0d0a00", bg3: "#110e00",
  border: "#2a1f00", dim: "#665500", bright: "#ffd060",
  green: "#44ff88", red: "#ff4444", cyan: "#44ccff", purple: "#cc88ff",
};

/* ── DATA ── */
const SECTIONS = {
  bash: {
    label:"BASH", icon:"$_", color:C.amber,
    lessons:[
      { title:"Script Anatomy & Strict Mode", tag:"FOUNDATION", tagColor:C.green, content:[
        {type:"h2",text:"The Anatomy of a Security Bash Script"},
        {type:"p",text:"Every professional security script must open with a hardened shebang block. Skipping strict mode is the #1 cause of silent failures and security bugs in bash automation."},
        {type:"code",lang:"bash",label:"TEMPLATE: Hardened Script Header",lines:[
          {c:"#!/usr/bin/env bash",n:"Shebang — /usr/bin/env bash finds bash in PATH for portability vs hardcoding /bin/bash."},
          {c:"set -e",n:"EXIT on any non-zero return. Prevents silent failures cascading through the script."},
          {c:"set -u",n:"UNBOUND variable = fatal error. Catches typos ($TARGE vs $TARGET). Without this, bash substitutes ''."},
          {c:"set -o pipefail",n:"Pipe failure propagates. Without: 'false | true' returns 0. With pipefail: returns 1 (correct)."},
          {c:"set -E",n:"ERR trap inherited by functions/subshells. Your error handler fires everywhere, not just top level."},
          {c:"IFS=$'\\n\\t'",n:"Safe word splitting. Default IFS includes spaces → breaks paths with spaces. Tabs+newlines only is safer."},
          {c:"",n:""},
          {c:"readonly RED='\\033[0;31m'",n:"readonly = cannot be reassigned. Good practice for all script-level constants."},
          {c:"readonly GREEN='\\033[0;32m'",n:""},
          {c:"readonly NC='\\033[0m'",n:"NC = No Color. Resets terminal colour after each coloured message."},
          {c:"",n:""},
          {c:"log_info() { echo -e \"${GREEN}[+]${NC} $*\"; }",n:"$* = all args as one string. Consistent prefix: [+] info, [!] warn, [-] error."},
          {c:"log_warn() { echo -e \"\\033[1;33m[!]${NC} $*\"; }",n:""},
          {c:"log_err()  { echo -e \"${RED}[-]${NC} $*\" >&2; }",n:">&2 routes to stderr — separable: ./script 2>errors.log"},
          {c:"",n:""},
          {c:"usage() { echo \"Usage: $0 <target>\"; exit 1; }",n:"$0 = script name. Always show usage on missing or bad args."},
          {c:"[[ $# -lt 1 ]] && usage",n:"$# = argument count. [[ ]] is bash extended test — safer than [ ]. -lt = less than."},
          {c:"readonly TARGET=\"${1:?'Target required'}\"",n:":? param substitution — if $1 empty/unset, print error and exit. Belt-and-suspenders with set -u."},
          {c:"",n:""},
          {c:"readonly TMPFILE=$(mktemp /tmp/tool_XXXXXX)",n:"mktemp creates unique temp file atomically. Avoids TOCTOU race vs /tmp/fixed_name.txt."},
          {c:"trap 'rm -f \"$TMPFILE\"' EXIT INT TERM",n:"trap guarantees cleanup on: normal exit (EXIT), Ctrl+C (INT), kill signal (TERM)."},
        ]},
        {type:"h3",text:"Variable Types & Operations"},
        {type:"code",lang:"bash",label:"Variable Patterns with C++ Analogies",lines:[
          {c:"declare -r CONSTANT='immutable'",n:"-r = readonly. C++ analogy: const string CONSTANT = 'immutable';"},
          {c:"declare -i counter=0",n:"-i = integer type. Arithmetic errors become real errors, not silent string ops."},
          {c:"declare -a arr=(alpha beta gamma)",n:"-a = indexed array. C++ analogy: vector<string> arr = {alpha, beta, gamma};"},
          {c:"declare -A map=([key]=val [k2]=v2)",n:"-A = associative array. C++: unordered_map<string,string>. Bash 4+ only."},
          {c:"declare -x EXPORTED='visible'",n:"-x = export to child processes. Like environment variables."},
          {c:"",n:""},
          {c:"arr+=(delta)",n:"Append to indexed array. C++: arr.push_back('delta');"},
          {c:"echo \"Len: ${#arr[@]}\"",n:"${#arr[@]} = element count. ${arr[@]} = all elements."},
          {c:"for item in \"${arr[@]}\"; do echo $item; done",n:"Always quote \"${arr[@]}\" — preserves elements containing spaces."},
          {c:"",n:""},
          {c:"path='/var/log/auth.log'",n:""},
          {c:"echo \"${path##*/}\"",n:"## strips longest prefix match. Result: auth.log  (equivalent to basename)"},
          {c:"echo \"${path%/*}\"",n:"% strips shortest suffix match. Result: /var/log  (equivalent to dirname)"},
          {c:"echo \"${path/log/LOG}\"",n:"/ = first-match replace. Like std::string::replace() for first occurrence."},
          {c:"echo \"${path//o/0}\"",n:"// = global replace. Replaces every 'o' → '0' throughout the string."},
          {c:"IFS='.' read -ra octets <<< \"192.168.1.100\"",n:"Split on delimiter into array. octets[0]=192, [1]=168, [2]=1, [3]=100"},
        ]},
        {type:"concept",title:"C++ → Bash Mental Map",rows:[
          ["C++ Concept","Bash Equivalent","Notes"],
          ["const string X","readonly X='val'","declare -r also works"],
          ["vector<string>","declare -a arr=()","arr+=() to append"],
          ["unordered_map<K,V>","declare -A map=()","Bash 4+ only"],
          ["if (x == y)","[[ \"$x\" == \"$y\" ]]","Always double-quote"],
          ["try/catch","command || handler","Or: trap ERR with set -e"],
          ["for (int i=0;...)","for ((i=0; i<n; i++))","Arithmetic for loop"],
          ["printf","printf / echo -e","printf is safer (no -n quirks)"],
          ["#include","source ./lib.sh","Dot-source shared functions"],
        ]},
      ]},
      { title:"System Monitoring Scripts", tag:"BLUE TEAM", tagColor:C.cyan, content:[
        {type:"h2",text:"Production-Grade System Monitoring"},
        {type:"p",text:"These scripts form the backbone of host-based intrusion detection. Each monitors a different attack surface and outputs structured JSON alerts for SIEM ingestion."},
        {type:"code",lang:"bash",label:"SCRIPT 1: File Integrity Monitor (FIM)",lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"set -euo pipefail",n:"Strict mode — mandatory for all security scripts that run as root or in cron."},
          {c:"",n:""},
          {c:"readonly WATCH_DIRS=('/etc' '/usr/bin' '/usr/sbin' '/bin' '/sbin')",n:"Critical system dirs. Changes here signal rootkit installation or supply-chain attack."},
          {c:"readonly DB_FILE='/var/lib/fim/baseline.db'",n:"SHA-256 hash database. Store OUTSIDE watched dirs so it can't be trivially overwritten."},
          {c:"readonly LOG_FILE='/var/log/fim/fim_alerts.log'",n:"Structured alert log for SIEM ingestion (Splunk, ELK, Graylog)."},
          {c:"readonly EXCLUDE='(\\.pyc$|\\.log$|\\.pid$|\\.lock$)'",n:"Skip volatile files that change legitimately — reduces false positives in production."},
          {c:"",n:""},
          {c:"mkdir -p \"$(dirname \"$DB_FILE\")\" \"$(dirname \"$LOG_FILE\")\"",n:"Ensure parent directories exist. dirname extracts directory component from path."},
          {c:"",n:""},
          {c:"fim_alert() {",n:""},
          {c:"    local event=\"$1\" file=\"$2\" detail=\"$3\"",n:"local = function-scoped variable. Prevents polluting global namespace."},
          {c:"    local ts; ts=$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")",n:"UTC ISO-8601 timestamp — standard for log aggregation and correlation."},
          {c:"    local host; host=$(hostname -f)",n:"FQDN for multi-host SIEM correlation across infrastructure."},
          {c:"    printf '{\"ts\":\"%s\",\"host\":\"%s\",\"event\":\"%s\",\"file\":\"%s\",\"detail\":\"%s\"}\\n' \\",n:"JSON output — directly ingestible by Splunk, ELK, Graylog without parsing."},
          {c:"        \"$ts\" \"$host\" \"$event\" \"$file\" \"$detail\" | tee -a \"$LOG_FILE\"",n:"tee -a: write to log AND stdout simultaneously. Good for real-time watching."},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"build_baseline() {",n:""},
          {c:"    > \"$DB_FILE\"",n:"> file: truncate/create. Clears old baseline before rebuilding from scratch."},
          {c:"    for dir in \"${WATCH_DIRS[@]}\"; do",n:"Iterate each watched directory."},
          {c:"        find \"$dir\" -type f -print0 2>/dev/null | \\",n:"-print0: NUL-delimited output. Handles filenames with spaces/newlines safely."},
          {c:"        while IFS= read -r -d '' fp; do",n:"read -d '': NUL as delimiter, -r: no backslash interp. Safest file-reading loop."},
          {c:"            [[ \"$fp\" =~ $EXCLUDE ]] && continue",n:"Skip excluded patterns. =~ is bash regex match operator."},
          {c:"            sha256sum \"$fp\" 2>/dev/null >> \"$DB_FILE\"",n:"sha256sum outputs: <64-char-hash>  <filepath> per line."},
          {c:"        done",n:""},
          {c:"    done",n:""},
          {c:"    echo \"[+] Baseline: $(wc -l < \"$DB_FILE\") files hashed.\"",n:"wc -l < file: count lines without printing filename."},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"check_integrity() {",n:""},
          {c:"    [[ ! -f \"$DB_FILE\" ]] && { build_baseline; return; }",n:"First run: create baseline instead of checking against nothing."},
          {c:"    declare -A bmap",n:"Build hash map for O(1) lookup vs O(n) grep scan per file."},
          {c:"    while IFS='  ' read -r hash fp; do",n:"IFS='  ' (two spaces): sha256sum uses double-space between hash and filename."},
          {c:"        bmap[\"$fp\"]=\"$hash\"",n:"Store: filepath → expected_hash"},
          {c:"    done < \"$DB_FILE\"",n:"Feed DB file into while loop via input redirection."},
          {c:"",n:""},
          {c:"    for dir in \"${WATCH_DIRS[@]}\"; do",n:""},
          {c:"        find \"$dir\" -type f -print0 2>/dev/null | \\",n:""},
          {c:"        while IFS= read -r -d '' fp; do",n:""},
          {c:"            [[ \"$fp\" =~ $EXCLUDE ]] && continue",n:""},
          {c:"            cur=$(sha256sum \"$fp\" 2>/dev/null | cut -d' ' -f1)",n:"cut -d' ' -f1: extract first space-delimited field = the hash only."},
          {c:"            exp=\"${bmap[$fp]:-}\"",n:":-: default to empty if key not in map (file not in baseline = new file)."},
          {c:"            if [[ -z \"$exp\" ]]; then",n:"-z: true if string is empty. Means: file is NEW, not previously hashed."},
          {c:"                fim_alert 'NEW_FILE' \"$fp\" 'not in baseline'",n:"New file in system dir = potential dropper or backdoor installation."},
          {c:"            elif [[ \"$cur\" != \"$exp\" ]]; then",n:"Hash mismatch = file was modified since baseline was taken."},
          {c:"                fim_alert 'MODIFIED' \"$fp\" \"exp:${exp:0:16} got:${cur:0:16}\"",n:":0:16 = substring, first 16 chars of hash. Enough to identify change without bloating log."},
          {c:"            fi",n:""},
          {c:"        done",n:""},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"case \"${1:-check}\" in",n:"case = switch. Default action when no arg given = 'check'."},
          {c:"    baseline) build_baseline ;;",n:"./fim.sh baseline → rebuild hash DB from current system state"},
          {c:"    check)   check_integrity ;;",n:"./fim.sh check   → compare current files vs baseline"},
          {c:"    *)       echo \"Usage: $0 {baseline|check}\"; exit 1 ;;",n:""},
          {c:"esac",n:"esac = 'case' reversed. Closes case block (bash convention)."},
        ]},
        {type:"code",lang:"bash",label:"SCRIPT 2: Auth Log Brute-Force Detector",lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"",n:""},
          {c:"readonly THRESHOLD=5",n:"Alert if >= 5 failures from one IP within the time window."},
          {c:"readonly WINDOW_MINS=5",n:"Time window for counting failures."},
          {c:"readonly LOG='/var/log/auth.log'",n:"Debian/Ubuntu. RHEL/CentOS: /var/log/secure"},
          {c:"",n:""},
          {c:"WINDOW_START=$(date -d \"$WINDOW_MINS minutes ago\" +%s)",n:"GNU date relative time. +%s = Unix epoch for numeric comparison."},
          {c:"declare -A fail_count fail_users",n:"Two associative arrays: IP→count and IP→usernames."},
          {c:"",n:""},
          {c:"while IFS= read -r line; do",n:"Read log line by line. IFS= preserves leading whitespace."},
          {c:"    if [[ \"$line\" =~ Failed[[:space:]]password.*from[[:space:]]([0-9.]+) ]]; then",n:"[[ =~ ]] regex match. BASH_REMATCH[1] = first capture group. [[:space:]] = POSIX char class."},
          {c:"        ip=\"${BASH_REMATCH[1]}\"",n:"Captured source IP address from regex group 1."},
          {c:"        ts=$(echo \"$line\" | awk '{print $1,$2,$3}')",n:"awk: extract fields 1-3 = 'Jan 15 22:01:43' timestamp."},
          {c:"        epoch=$(date -d \"$ts\" +%s 2>/dev/null || echo 0)",n:"Convert log timestamp to epoch. || echo 0: on failure, treat as outside window."},
          {c:"        if (( epoch >= WINDOW_START )); then",n:"(( )) arithmetic comparison — correct way to compare integers in bash."},
          {c:"            (( fail_count[$ip]++ ))",n:"Increment failure counter for this IP."},
          {c:"            fail_users[$ip]+=\"${line##* for } \"",n:"Accumulate targeted username context."},
          {c:"        fi",n:""},
          {c:"    fi",n:""},
          {c:"done < \"$LOG\"",n:""},
          {c:"",n:""},
          {c:"for ip in \"${!fail_count[@]}\"; do",n:"${!array[@]} iterates the KEYS of an associative array."},
          {c:"    count=${fail_count[$ip]}",n:""},
          {c:"    (( count >= THRESHOLD )) || continue",n:"Skip IPs below threshold."},
          {c:"    echo \"[BRUTE-FORCE] IP: $ip | Attempts: $count\"",n:""},
          {c:"    # ufw deny from \"$ip\" to any comment 'brute-force-detected'",n:"Auto-block. Uncomment carefully — test for false positives first."},
          {c:"done",n:""},
        ]},
        {type:"code",lang:"bash",label:"SCRIPT 3: Suspicious Process Watcher (/proc + inotify)",lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"# Requires: sudo apt install inotify-tools",n:""},
          {c:"",n:""},
          {c:"readonly WATCH_PATHS=('/tmp' '/var/tmp' '/dev/shm' '/run')",n:"World-writable exec locations. Favourite malware dropper destinations on Linux."},
          {c:"readonly LOG='/var/log/proc_watch.log'",n:""},
          {c:"",n:""},
          {c:"check_proc_tree() {",n:""},
          {c:"    local parents=(apache2 nginx php-fpm python3 node java tomcat)",n:"Web servers and interpreters that should NEVER spawn interactive shells."},
          {c:"    local children=(bash sh dash zsh nc ncat socat curl wget)",n:"Shell/tool names that signal reverse shell or dropper download."},
          {c:"    declare -A pname ppid_of",n:""},
          {c:"    for d in /proc/[0-9]*/; do",n:"Glob: only numeric dirs in /proc = process directories."},
          {c:"        local pid; pid=$(basename \"$d\")",n:"Extract PID from directory path."},
          {c:"        pname[$pid]=$(cat \"$d/comm\" 2>/dev/null || echo '')",n:"/proc/PID/comm: process short name (kernel-truncated to 15 chars)."},
          {c:"        ppid_of[$pid]=$(awk '/PPid/{print $2}' \"$d/status\" 2>/dev/null || echo 0)",n:"/proc/PID/status has PPid line. awk extracts the numeric value."},
          {c:"    done",n:""},
          {c:"",n:""},
          {c:"    for pid in \"${!pname[@]}\"; do",n:""},
          {c:"        local child=\"${pname[$pid]}\"",n:""},
          {c:"        local ppid=\"${ppid_of[$pid]:-0}\"",n:""},
          {c:"        local parent=\"${pname[$ppid]:-unknown}\"",n:"Look up parent name using PPID as key. :-unknown = default if not found."},
          {c:"        local bad_p=0 bad_c=0",n:""},
          {c:"        for p in \"${parents[@]}\"; do [[ \"$parent\" == \"$p\" ]] && bad_p=1; done",n:"Check if parent is in dangerous list."},
          {c:"        for c in \"${children[@]}\"; do [[ \"$child\" == \"$c\" ]] && bad_c=1; done",n:"Check if child is in dangerous list."},
          {c:"        if (( bad_p && bad_c )); then",n:"Both match: high-fidelity signal of webshell or RCE exploit."},
          {c:"            local cmd; cmd=$(tr '\\0' ' ' < \"/proc/$pid/cmdline\" 2>/dev/null)",n:"/proc/PID/cmdline: NUL-separated args. tr converts NUL→space for readability."},
          {c:"            echo \"[ALERT] $parent($ppid) spawned $child($pid): $cmd\" | tee -a \"$LOG\"",n:""},
          {c:"        fi",n:""},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"watch_drops() {",n:""},
          {c:"    inotifywait -m -r -e create,moved_to --format '%w%f %e' \\",n:"-m=monitor forever, -r=recursive, -e=events, --format=output template."},
          {c:"        \"${WATCH_PATHS[@]}\" 2>/dev/null |",n:""},
          {c:"    while IFS=' ' read -r fp event; do",n:""},
          {c:"        [[ -x \"$fp\" ]] && echo \"[DROP] Exec created: $fp ($event)\" | tee -a \"$LOG\"",n:"-x test: is file executable? Executable in /tmp = dropper stage of malware."},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"check_proc_tree & watch_drops & wait $!",n:"Run both in parallel as background jobs. wait $! blocks on the inotify watcher."},
        ]},
      ]},
      { title:"Network Recon & Log Analysis", tag:"RED + BLUE", tagColor:C.amber, content:[
        {type:"h2",text:"Network Reconnaissance & Log Analysis"},
        {type:"code",lang:"bash",label:"SCRIPT 4: Parallel Subnet Ping Sweep",lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"readonly BASE=\"${1:?'Usage: $0 <first.3.octets>'}\"",n:"Pass first 3 octets: ./sweep.sh 192.168.1 → scans .1 through .254"},
          {c:"readonly MAX_JOBS=\"${2:-50}\"",n:"Default 50 parallel pings. More = faster but noisier traffic signature."},
          {c:"readonly LIVE=$(mktemp); trap 'rm -f \"$LIVE\"' EXIT",n:"Temp file to collect live hosts. Cleanup guaranteed via trap."},
          {c:"",n:""},
          {c:"ping_host() {",n:""},
          {c:"    local ip=\"$1\"",n:""},
          {c:"    ping -c1 -W1 -q \"$ip\" &>/dev/null && echo \"$ip\" >> \"$LIVE\" && echo \"  [UP] $ip\"",n:"-c1: 1 packet, -W1: 1s timeout, -q: quiet. &>/dev/null: suppress all output."},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"job_count=0",n:""},
          {c:"for i in $(seq 1 254); do",n:"seq 1 254: generates integers 1–254. Readable alternative to {1..254} for variable ranges."},
          {c:"    ping_host \"$BASE.$i\" &",n:"& = background job. Each ping runs as a separate async process."},
          {c:"    (( ++job_count ))",n:"Increment parallel job counter."},
          {c:"    if (( job_count >= MAX_JOBS )); then",n:""},
          {c:"        wait -n 2>/dev/null || wait",n:"wait -n: wait for ANY one job (bash 4.3+). Falls back to wait-all on older bash."},
          {c:"        (( job_count-- ))",n:"One slot freed."},
          {c:"    fi",n:""},
          {c:"done; wait",n:"Wait for all remaining background jobs before printing results."},
          {c:"echo \"[+] Live hosts:\"; sort -t. -k4 -n \"$LIVE\"",n:"sort -t. -k4 -n: sort by 4th dot-delimited field numerically = proper IP order."},
        ]},
        {type:"code",lang:"bash",label:"SCRIPT 5: Web Attack Log Hunter",lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"readonly LOG=\"${1:?'Usage: $0 <access.log>'}\"",n:""},
          {c:"",n:""},
          {c:"declare -a PATTERNS=(",n:"Array of attack signatures to hunt in access logs."},
          {c:"    '../'",n:"Path traversal: ../../etc/passwd"},
          {c:"    'union.*select'",n:"SQLi UNION-based: ' UNION SELECT password FROM users--"},
          {c:"    '<script'",n:"XSS: <script>alert(document.cookie)</script> in URL parameter."},
          {c:"    'etc/passwd'",n:"LFI: Local File Inclusion targeting /etc/passwd."},
          {c:"    'cmd=|exec(|system('",n:"RCE patterns in web request parameters."},
          {c:"    'phpinfo()'",n:"PHP information disclosure probe."},
          {c:"    '\\.git/'",n:"Git repo exposure scan (.git/config, .git/HEAD, .git/objects)."},
          {c:"    'base64_decode'",n:"PHP webshell delivery: eval(base64_decode(...))"},
          {c:"    'wp-admin\\|wp-login'",n:"WordPress brute force / credential stuffing."},
          {c:")",n:""},
          {c:"",n:""},
          {c:"echo '=== Attack Indicators ==='",n:""},
          {c:"pattern=$(IFS='|'; echo \"${PATTERNS[*]}\")",n:"Join array with | to build alternation regex. IFS='|' sets field separator for ${PATTERNS[*]} join."},
          {c:"grep -iE \"$pattern\" \"$LOG\" \\",n:"Single grep pass with all patterns OR'd — efficient vs running grep N times."},
          {c:"| awk '{print $1, $7, $9}' \\",n:"Apache CLF: $1=client_IP, $7=request_path, $9=HTTP_status_code."},
          {c:"| sort | uniq -c | sort -rn | head -20",n:"Frequency analysis: most repeated attacker IP + path combinations first."},
          {c:"",n:""},
          {c:"echo '=== Status Code Distribution ==='",n:""},
          {c:"awk '{print $9}' \"$LOG\" | sort | uniq -c | sort -rn | \\",n:"Count each HTTP status code."},
          {c:"awk 'BEGIN{t=0}{t+=$1;l[NR]=$0;c[NR]=$1} END{for(i=1;i<=NR;i++) printf \"%s (%.1f%%)\\n\",l[i],c[i]/t*100}'",n:"Calculate percentage of total. NR = number of records processed."},
        ]},
      ]},
      { title:"Scripting Vulnerabilities", tag:"SECURE CODING", tagColor:C.red, content:[
        {type:"h2",text:"Common Bash Security Vulnerabilities"},
        {type:"p",text:"Security scripts often run as root. Vulnerabilities in them create direct privilege escalation paths. Know these patterns cold."},
        {type:"vuln",entries:[
          {
            title:"Command Injection via Unvalidated Input", risk:"CRITICAL",
            bad:['username="$1"  # could be: admin; rm -rf /',
                 'grep "$username" /etc/passwd',
                 '',
                 '# Even worse with eval:',
                 'eval "ls $user_path"  # user_path="/ ; cat /etc/shadow"'],
            good:['readonly USERNAME="$1"',
                  '# Allowlist: only alphanumeric + underscore',
                  'if [[ ! "$USERNAME" =~ ^[a-zA-Z0-9_]{1,32}$ ]]; then',
                  '    log_err "Invalid username: $USERNAME"; exit 1',
                  'fi',
                  '# -F = fixed string, no regex interpretation',
                  'grep -F "$USERNAME" /etc/passwd',
                  '# NEVER use eval on user input. Ever.'],
            explanation:"Command injection occurs when user data reaches the shell interpreter without sanitization. Validate with an allowlist regex first. grep -F treats the pattern as a literal string — no regex injection possible."
          },
          {
            title:"Insecure Temp File Handling (TOCTOU Race)", risk:"HIGH",
            bad:['TMPFILE="/tmp/myscript.txt"  # Predictable!',
                 'echo "$sensitive" > "$TMPFILE"',
                 '',
                 '# Attacker creates symlink between check and write:',
                 '# /tmp/myscript.txt -> /etc/crontab',
                 '# Your script OVERWRITES /etc/crontab!'],
            good:['# mktemp creates unique file atomically',
                  'TMPFILE=$(mktemp /tmp/scan_XXXXXXXXXX)',
                  'chmod 600 "$TMPFILE"  # Restrict immediately',
                  "trap 'rm -f \"$TMPFILE\"' EXIT INT TERM",
                  'echo "$sensitive" > "$TMPFILE"'],
            explanation:"TOCTOU (Time-Of-Check-Time-Of-Use) race: attacker inserts a symlink between your check and your write. mktemp uses O_EXCL flag — atomic creation, no race window possible."
          },
          {
            title:"Path Traversal in File Processing", risk:"HIGH",
            bad:['user_file="$1"  # could be ../../etc/shadow',
                 'cat "/var/logs/$user_file"',
                 '# Expands to: cat /var/logs/../../etc/shadow',
                 '# = cat /etc/shadow  <- reads password hashes!'],
            good:['readonly LOGS_DIR="/var/logs"',
                  'resolved=$(realpath -m "$LOGS_DIR/$1")',
                  '# Verify resolved path is inside allowed dir',
                  'if [[ "$resolved" != "$LOGS_DIR/"* ]]; then',
                  '    log_err "Traversal blocked: $1"; exit 1',
                  'fi',
                  'cat "$resolved"'],
            explanation:"realpath -m resolves all ../, symlinks, and extra slashes into a canonical path. The prefix check ensures the final resolved path stays inside the allowed directory boundary."
          },
          {
            title:"Unquoted Variables (Word Splitting / Glob)", risk:"MEDIUM",
            bad:['file="report march.pdf"  # contains a space',
                 'rm $file  # Expands to: rm report march.pdf',
                 '          # Deletes TWO separate files!',
                 '',
                 '# Glob expansion:',
                 'wc -l $pattern  # *.log expands in current dir'],
            good:['# ALWAYS double-quote variable references',
                  'rm "$file"    # Treated as ONE argument',
                  '',
                  '# Prevent glob expansion:',
                  'wc -l "$pattern"  # Literal string',
                  '',
                  '# Lint every script:',
                  'shellcheck ./myscript.sh'],
            explanation:"Unquoted variables undergo word splitting (split on whitespace) and glob expansion (*.log expands to matching filenames). This is the source of countless subtle bugs. Run shellcheck on every script before deployment."
          },
        ]},
      ]},
    ],
  },

  python: {
    label:"PYTHON", icon:"py", color:C.cyan,
    lessons:[
      { title:"Python Tool Architecture", tag:"FOUNDATION", tagColor:C.green, content:[
        {type:"h2",text:"Python Security Tool Architecture"},
        {type:"p",text:"Production security tools need proper CLI interfaces, structured logging, error handling, and modular design. This template shows how professional tools are structured."},
        {type:"concept",title:"C++ → Python Type System",rows:[
          ["C++ Type","Python Type","Key Difference"],
          ["int, long","int","Arbitrary precision. No integer overflow."],
          ["char*, string","str","Immutable. Use bytes for raw binary data."],
          ["vector<T>","list","Dynamic, mixed types. list.append() = push_back()."],
          ["map<K,V>","dict","Hash map. O(1) average key lookup."],
          ["set<T>","set","Hash set. O(1) membership test with 'in'."],
          ["optional<T>","T | None","Explicit None. No null pointer dereference."],
          ["unique_ptr<T>","Variable","GC manages memory. No manual delete/free."],
          ["try/catch","try/except","except Exception as e: for typed catch."],
          ["struct + methods","@dataclass","Auto-generates __init__, __repr__, __eq__."],
        ]},
        {type:"code",lang:"python",label:"TEMPLATE: Professional Security Tool",lines:[
          {c:"#!/usr/bin/env python3",n:"Always specify python3. Avoids python2 on systems where it is still the default."},
          {c:"from __future__ import annotations",n:"Postponed type hint evaluation. Required for forward references in Python < 3.10."},
          {c:"import argparse, logging, sys",n:"Core stdlib: CLI argument parsing, structured logging, system interface."},
          {c:"from pathlib import Path",n:"Modern path handling. Replaces os.path. Like std::filesystem in C++17."},
          {c:"from dataclasses import dataclass, field",n:"dataclass: auto-generates __init__, __repr__. Like a C struct with convenience methods."},
          {c:"",n:""},
          {c:"def setup_logging(verbose: bool = False) -> logging.Logger:",n:""},
          {c:"    level = logging.DEBUG if verbose else logging.INFO",n:"DEBUG: all messages. INFO: normal ops. WARNING/ERROR: problems only."},
          {c:"    fmt = '[%(asctime)s][%(levelname)-8s] %(message)s'",n:"%(levelname)-8s: left-aligned 8-char level label. Clean aligned columns in output."},
          {c:"    logging.basicConfig(level=level, format=fmt, datefmt='%Y-%m-%d %H:%M:%S')",n:"ISO datetime format for log aggregation compatibility."},
          {c:"    return logging.getLogger(__name__)",n:"__name__ = current module name. Each module gets its own logger namespace."},
          {c:"",n:""},
          {c:"@dataclass",n:"Decorator. Auto-generates __init__(__repr__, __eq__ from field annotations."},
          {c:"class ScanResult:",n:""},
          {c:"    host:    str",n:"Required field — no default. Must be passed to the constructor."},
          {c:"    port:    int",n:""},
          {c:"    state:   str   = 'closed'",n:"Default value. C++ analogy: string state = 'closed';"},
          {c:"    banner:  str   = ''",n:""},
          {c:"    latency: float = 0.0",n:""},
          {c:"",n:""},
          {c:"    def to_dict(self) -> dict:",n:"Serialize to dict for JSON output."},
          {c:"        from dataclasses import asdict",n:""},
          {c:"        return asdict(self)",n:"asdict() recursively converts dataclass to nested dict."},
          {c:"",n:""},
          {c:"class NetworkScanner:",n:"Encapsulate state and methods. C++ class analogy."},
          {c:"    def __init__(self, timeout: float = 1.0, workers: int = 100):",n:"__init__ = constructor. self = this pointer in C++."},
          {c:"        self.timeout = timeout",n:""},
          {c:"        self.workers = workers",n:""},
          {c:"        self.log = logging.getLogger(self.__class__.__name__)",n:"Class-specific logger. Appears in log as 'NetworkScanner'."},
          {c:"        self.results: list[ScanResult] = []",n:"Type-annotated list. C++: vector<ScanResult> results;"},
          {c:"",n:""},
          {c:"    def _probe_port(self, host: str, port: int) -> ScanResult:",n:"_prefix = private by convention. C++: private method."},
          {c:"        import socket, time",n:""},
          {c:"        r = ScanResult(host=host, port=port)",n:"Create with defaults (state='closed', banner='')."},
          {c:"        t0 = time.monotonic()",n:"monotonic: never goes backwards. Correct for latency measurement unlike time.time()."},
          {c:"        try:",n:""},
          {c:"            with socket.create_connection((host, port), timeout=self.timeout) as s:",n:"with = context manager = C++ RAII. Guarantees s.close() even on exception."},
          {c:"                r.state = 'open'",n:""},
          {c:"                r.latency = (time.monotonic() - t0) * 1000",n:"Latency in milliseconds."},
          {c:"                try:",n:"Nested try: banner grab is optional, failure is acceptable."},
          {c:"                    s.settimeout(0.3)",n:"Short timeout for banner only — don't stall the scanner."},
          {c:"                    r.banner = s.recv(1024).decode('utf-8', errors='replace').strip()[:100]",n:"errors='replace': bad UTF-8 → ?. Never crash on binary banners. Truncate at 100."},
          {c:"                except Exception: pass",n:"Banner grab failed = fine. Port is still open and recorded."},
          {c:"        except (ConnectionRefusedError, OSError): pass",n:"Port closed or filtered — expected, not an error."},
          {c:"        except Exception as e:",n:""},
          {c:"            self.log.debug('Port %d error: %s', port, e)",n:"Use %s formatting in logging — lazy eval, string only built if message is logged."},
          {c:"        return r",n:""},
          {c:"",n:""},
          {c:"    def scan(self, host: str, ports: list[int]) -> list[ScanResult]:",n:""},
          {c:"        from concurrent.futures import ThreadPoolExecutor, as_completed",n:""},
          {c:"        self.log.info('Scanning %s: %d ports', host, len(ports))",n:""},
          {c:"        with ThreadPoolExecutor(max_workers=self.workers) as pool:",n:"Bounded thread pool. C++: std::async with semaphore-limited concurrency."},
          {c:"            futures = {pool.submit(self._probe_port, host, p): p for p in ports}",n:"Dict comprehension: submit all jobs immediately. Maps future → port number."},
          {c:"            for fut in as_completed(futures):",n:"as_completed: yield futures as they finish. Order not guaranteed (fastest first)."},
          {c:"                r = fut.result()",n:".result() blocks until that one future finishes, then returns its value."},
          {c:"                if r.state == 'open':",n:""},
          {c:"                    self.results.append(r)",n:""},
          {c:"                    self.log.info('[OPEN] %d/tcp  %s', r.port, r.banner[:50])",n:""},
          {c:"        return sorted(self.results, key=lambda r: r.port)",n:"Sort by port number. lambda r: r.port = key extractor. C++: std::sort with comparator."},
          {c:"",n:""},
          {c:"def expand_ports(s: str) -> list[int]:",n:"Parse '22,80,8000-8100' → sorted list of ints."},
          {c:"    ports: set[int] = set()",n:""},
          {c:"    for part in s.split(','):",n:"Split on comma: '22,80,8000-8100' → ['22','80','8000-8100']"},
          {c:"        if '-' in part:",n:""},
          {c:"            a, b = map(int, part.split('-'))",n:"map(int, ...) applies int() to each element. C++: std::transform."},
          {c:"            ports.update(range(a, b + 1))",n:"set.update() adds all elements from range. Like set union."},
          {c:"        else: ports.add(int(part))",n:""},
          {c:"    return sorted(ports)",n:""},
          {c:"",n:""},
          {c:"def main() -> int:",n:"Returns int exit code. 0 = success, 1 = failure (scriptable)."},
          {c:"    ap = argparse.ArgumentParser(description='Port scanner')",n:""},
          {c:"    ap.add_argument('target')",n:"Positional argument — required."},
          {c:"    ap.add_argument('-p','--ports', default='1-1024')",n:"Optional. -p 80 or --ports 80,443,8000-8100"},
          {c:"    ap.add_argument('-t','--timeout', default=1.0, type=float)",n:"type=float: argparse auto-converts string argument to float."},
          {c:"    ap.add_argument('-w','--workers', default=100, type=int)",n:""},
          {c:"    ap.add_argument('-o','--output', default=None)",n:""},
          {c:"    ap.add_argument('-v','--verbose', action='store_true')",n:"Flag: if -v present → args.verbose = True. No value needed."},
          {c:"    args = ap.parse_args()",n:""},
          {c:"    log  = setup_logging(args.verbose)",n:""},
          {c:"    scanner = NetworkScanner(timeout=args.timeout, workers=args.workers)",n:""},
          {c:"    results = scanner.scan(args.target, expand_ports(args.ports))",n:""},
          {c:"    if args.output:",n:""},
          {c:"        import json",n:""},
          {c:"        Path(args.output).write_text(json.dumps([r.to_dict() for r in results], indent=2))",n:"List comprehension applies .to_dict() to each result. write_text = atomic file write."},
          {c:"    return 0 if results else 1",n:""},
          {c:"",n:""},
          {c:"if __name__ == '__main__': sys.exit(main())",n:"Only run main() when executed directly, not when imported as a module."},
        ]},
      ]},
      { title:"IOC Extractor & Log Analysis", tag:"INTERMEDIATE", tagColor:C.amber, content:[
        {type:"h2",text:"IOC Extraction & Threat Intelligence"},
        {type:"code",lang:"python",label:"SCRIPT: IOC Extractor with VirusTotal Enrichment",lines:[
          {c:"#!/usr/bin/env python3",n:""},
          {c:"import re, json, sys, os",n:""},
          {c:"from pathlib import Path",n:""},
          {c:"from collections import defaultdict",n:"defaultdict(set): missing keys auto-create empty set. Avoids KeyError on first access."},
          {c:"from urllib.request import urlopen, Request",n:"stdlib HTTP. No external requests library needed for VT lookups."},
          {c:"from urllib.error import URLError",n:""},
          {c:"",n:""},
          {c:"PATTERNS: dict[str, re.Pattern] = {",n:"Type-annotated dict of pre-compiled regex patterns."},
          {c:"    'ipv4':   re.compile(r'\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b'),",n:"RFC-compliant IPv4: validates each octet 0-255. Simple \\d{1,3} would match 999.999.999.999."},
          {c:"    'domain': re.compile(r'\\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}\\b'),",n:"RFC-1123 compliant hostname. Requires TLD of at least 2 characters."},
          {c:"    'url':    re.compile(r'https?://[^\\s<>\"\\']+'),",n:"URLs starting with http:// or https://"},
          {c:"    'md5':    re.compile(r'\\b[a-fA-F0-9]{32}\\b'),",n:"MD5: exactly 32 hex characters."},
          {c:"    'sha256': re.compile(r'\\b[a-fA-F0-9]{64}\\b'),",n:"SHA-256: exactly 64 hex characters."},
          {c:"    'email':  re.compile(r'[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}'),",n:""},
          {c:"}",n:""},
          {c:"PRIVATE = re.compile(r'^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|127\\.)')",n:"RFC1918 + loopback filter. Private IPs are not useful external IOCs."},
          {c:"",n:""},
          {c:"class IOCExtractor:",n:""},
          {c:"    def __init__(self, vt_key: str | None = None):",n:""},
          {c:"        self.vt_key = vt_key",n:"Optional VirusTotal API key for enrichment."},
          {c:"        self.results: dict[str, set] = defaultdict(set)",n:""},
          {c:"",n:""},
          {c:"    def extract(self, text: str) -> dict[str, list]:",n:""},
          {c:"        self.results.clear()",n:""},
          {c:"        for ioc_type, pat in PATTERNS.items():",n:""},
          {c:"            for m in pat.finditer(text):",n:"finditer: generator of all non-overlapping matches. Memory-efficient vs findall."},
          {c:"                val = m.group()",n:".group() = the full matched string."},
          {c:"                if ioc_type == 'ipv4' and PRIVATE.match(val): continue",n:"Skip private/loopback IPs."},
          {c:"                self.results[ioc_type].add(val)",n:"set.add() deduplicates automatically. O(1) average."},
          {c:"        return {k: sorted(v) for k, v in self.results.items() if v}",n:"Dict comprehension: only non-empty types, sorted for consistent output."},
          {c:"",n:""},
          {c:"    def enrich_vt(self, ioc: str, ioc_type: str) -> dict:",n:""},
          {c:"        if not self.vt_key: return {}",n:"Short-circuit if no API key provided."},
          {c:"        eps = {'ipv4': f'https://www.virustotal.com/api/v3/ip_addresses/{ioc}',",n:"f-string: Python's format string. Like sprintf() but cleaner."},
          {c:"               'domain': f'https://www.virustotal.com/api/v3/domains/{ioc}',",n:""},
          {c:"               'sha256': f'https://www.virustotal.com/api/v3/files/{ioc}'}",n:""},
          {c:"        url = eps.get(ioc_type)",n:".get() returns None if key not found (no KeyError)."},
          {c:"        if not url: return {}",n:""},
          {c:"        req = Request(url, headers={'x-apikey': self.vt_key})",n:"Request with auth header. Like: curl -H 'x-apikey: KEY' URL"},
          {c:"        try:",n:""},
          {c:"            with urlopen(req, timeout=10) as r:",n:""},
          {c:"                data = json.loads(r.read())",n:""},
          {c:"                s = data.get('data',{}).get('attributes',{}).get('last_analysis_stats',{})",n:"Chained .get() with defaults: safe deep dict access without KeyError chain."},
          {c:"                return {'malicious': s.get('malicious',0), 'total': sum(s.values())}",n:""},
          {c:"        except (URLError, json.JSONDecodeError, KeyError): return {}",n:"Catch all expected failure modes gracefully."},
          {c:"",n:""},
          {c:"    def report(self, text: str) -> None:",n:""},
          {c:"        iocs = self.extract(text)",n:""},
          {c:"        if not iocs: print('No IOCs found.'); return",n:""},
          {c:"        for ioc_type, vals in iocs.items():",n:""},
          {c:"            print(f'\\n  [{ioc_type.upper()}] ({len(vals)} found)')",n:""},
          {c:"            for val in vals[:20]:",n:"Cap display at 20 per type."},
          {c:"                e = self.enrich_vt(val, ioc_type)",n:""},
          {c:"                vt  = f\" [VT: {e['malicious']}/{e['total']}]\" if e else ''",n:"Ternary: a if cond else b.  C++: cond ? a : b"},
          {c:"                flag = ' ⚠' if e.get('malicious',0) > 0 else ''",n:""},
          {c:"                print(f'    -> {val}{vt}{flag}')",n:""},
          {c:"",n:""},
          {c:"if __name__ == '__main__':",n:""},
          {c:"    key = os.environ.get('VT_API_KEY')  # NEVER hardcode API keys",n:"Read key from environment variable. C++: getenv('VT_API_KEY')"},
          {c:"    x = IOCExtractor(vt_key=key)",n:""},
          {c:"    src = Path(sys.argv[1]).read_text(errors='replace') if len(sys.argv)>1 else sys.stdin.read()",n:"Read file arg or stdin — pipe-friendly. Like: cat access.log | python3 ioc.py"},
          {c:"    x.report(src)",n:""},
        ]},
      ]},
      { title:"Live /proc Forensics", tag:"ADVANCED", tagColor:C.red, content:[
        {type:"h2",text:"Forensic Python: Live /proc Analysis"},
        {type:"p",text:"On Linux, /proc is a goldmine for live forensics. This script replicates what Volatility does but on a running system — ideal for incident response."},
        {type:"code",lang:"python",label:"SCRIPT: Live Process Forensics via /proc",lines:[
          {c:"#!/usr/bin/env python3",n:""},
          {c:"import os",n:""},
          {c:"from pathlib import Path",n:""},
          {c:"from dataclasses import dataclass, field",n:""},
          {c:"",n:""},
          {c:"@dataclass",n:""},
          {c:"class ProcInfo:",n:""},
          {c:"    pid:       int",n:""},
          {c:"    name:      str  = ''",n:"Process short name from /proc/PID/comm (max 15 chars, kernel-truncated)."},
          {c:"    ppid:      int  = 0",n:"Parent PID. Use for process tree reconstruction."},
          {c:"    cmdline:   str  = ''",n:"Full command line with arguments."},
          {c:"    exe:       str  = ''",n:"Resolved executable path. Appends '(deleted)' if binary was removed post-launch."},
          {c:"    cwd:       str  = ''",n:"Current working directory of the process."},
          {c:"    uid:       int  = -1",n:"Real user ID. 0 = root."},
          {c:"    anon_exec: list = field(default_factory=list)",n:"Anonymous executable memory mappings. field(default_factory=list): new list per instance!"},
          {c:"    flags:     list = field(default_factory=list)",n:"Suspicious indicators detected. default_factory avoids shared mutable default."},
          {c:"",n:""},
          {c:"def read_proc(pid: int, fname: str) -> str:",n:""},
          {c:"    try: return Path(f'/proc/{pid}/{fname}').read_text(errors='replace')",n:""},
          {c:"    except (PermissionError, FileNotFoundError, ProcessLookupError): return ''",n:"Process may die between discovery and reading. All errors → empty string."},
          {c:"",n:""},
          {c:"def parse(pid: int) -> ProcInfo:",n:""},
          {c:"    p = ProcInfo(pid=pid)",n:""},
          {c:"    p.name = read_proc(pid, 'comm').strip()",n:"/proc/PID/comm: process name (kernel-truncated to 15 chars)."},
          {c:"    for line in read_proc(pid, 'status').splitlines():",n:""},
          {c:"        if   line.startswith('PPid:'): p.ppid = int(line.split()[1])",n:"split()[1] = second whitespace-delimited token = PPID number."},
          {c:"        elif line.startswith('Uid:'):  p.uid  = int(line.split()[1])",n:"Real UID. split()[1] = first Uid field. 0 = root."},
          {c:"    raw = Path(f'/proc/{pid}/cmdline').read_bytes() if Path(f'/proc/{pid}/cmdline').exists() else b''",n:"read_bytes(): binary read. cmdline uses NUL bytes as argument separators."},
          {c:"    p.cmdline = raw.replace(b'\\x00', b' ').decode('utf-8', errors='replace').strip()",n:"Replace NUL with space → readable command line string."},
          {c:"    try:    p.exe = os.readlink(f'/proc/{pid}/exe')",n:"readlink: resolve exe symlink. Shows '(deleted)' if binary removed — classic malware indicator."},
          {c:"    except: p.exe = '[no-access]'",n:""},
          {c:"    try:    p.cwd = os.readlink(f'/proc/{pid}/cwd')",n:""},
          {c:"    except: p.cwd = ''",n:""},
          {c:"    for line in read_proc(pid, 'maps').splitlines():",n:"/proc/PID/maps: virtual memory layout. addr perms offset dev inode [path]"},
          {c:"        parts = line.split()",n:""},
          {c:"        if len(parts) >= 2:",n:""},
          {c:"            perms = parts[1]",n:"Permissions: r=read, w=write, x=execute, p=private copy-on-write."},
          {c:"            path  = parts[5] if len(parts) > 5 else '[anon]'",n:"No backing file = anonymous memory."},
          {c:"            if 'x' in perms and path == '[anon]':",n:"Executable + anonymous = shellcode injection or packed malware."},
          {c:"                p.anon_exec.append(f'{parts[0]} {perms}')",n:"Legitimate code is always backed by a file. Anonymous executable is a red flag."},
          {c:"    if '(deleted)' in p.exe:            p.flags.append('EXE_DELETED')",n:"Binary deleted after launch: classic fileless malware technique."},
          {c:"    if p.cwd.startswith(('/tmp','/dev/shm','/var/tmp')): p.flags.append(f'SUSP_CWD:{p.cwd}')",n:"Running from world-writable temp dir = dropper stage."},
          {c:"    if p.uid==0 and any(x in p.name for x in ['sh','bash','nc','python']): p.flags.append('ROOT_SHELL')",n:"Interactive shell/tool running as root."},
          {c:"    if p.anon_exec: p.flags.append(f'ANON_EXEC:{len(p.anon_exec)}regions')",n:""},
          {c:"    return p",n:""},
          {c:"",n:""},
          {c:"def scan() -> list[ProcInfo]:",n:""},
          {c:"    return sorted([parse(int(e.name)) for e in Path('/proc').iterdir() if e.name.isdigit()], key=lambda p:p.pid)",n:"iterdir(): lazy dir listing. isdigit(): only process dirs. Sorted by PID."},
          {c:"",n:""},
          {c:"if __name__ == '__main__':",n:""},
          {c:"    all_p  = scan()",n:""},
          {c:"    flagged = [p for p in all_p if p.flags]",n:"List comprehension: filter to suspicious processes only."},
          {c:"    print(f'Scanned {len(all_p)} processes. Flagged: {len(flagged)}')",n:""},
          {c:"    for p in flagged:",n:""},
          {c:"        print(f'\\n[PID:{p.pid:5d}] {p.name} (UID:{p.uid})')",n:":5d = right-align PID in 5-char field."},
          {c:"        print(f'  CMD: {p.cmdline[:120]}')",n:""},
          {c:"        print(f'  EXE: {p.exe}')",n:""},
          {c:"        for f in p.flags: print(f'  FLAG: {f}')",n:""},
        ]},
      ]},
    ],
  },

  powershell: {
    label:"POWERSHELL", icon:"PS>", color:C.purple,
    lessons:[
      { title:"Event Log Security Auditor", tag:"BLUE TEAM", tagColor:C.cyan, content:[
        {type:"h2",text:"PowerShell: Windows Security Scripting"},
        {type:"p",text:"PowerShell has direct access to Windows APIs, WMI, .NET, and the registry. It is the most powerful built-in tool on Windows for both offense and defense."},
        {type:"code",lang:"powershell",label:"SCRIPT 1: Security Event Log Auditor",lines:[
          {c:"#Requires -RunAsAdministrator",n:"Enforces admin at parse time. Script fails immediately if not elevated."},
          {c:"[CmdletBinding()]",n:"Adds -Verbose, -Debug, -ErrorAction, -WhatIf to your script automatically."},
          {c:"param(",n:""},
          {c:"    [ValidateRange(1, 90)] [int]$Days = 1,",n:"Built-in validation. PowerShell throws error if value is outside 1-90."},
          {c:"    [string]$OutputPath = $null",n:"$null = PowerShell's null. Like nullptr in C++."},
          {c:")",n:""},
          {c:"Set-StrictMode -Version Latest",n:"Like 'set -u' in bash. Errors on undefined variables and out-of-bounds array access."},
          {c:"$ErrorActionPreference = 'Stop'",n:"All errors are terminating by default. Like 'set -e' in bash."},
          {c:"",n:""},
          {c:"function Write-Alert {",n:""},
          {c:"    param([string]$Type, [string]$Msg, [hashtable]$Data = @{})",n:"Hashtable @{}: like Python dict. C++: unordered_map<string,object>."},
          {c:"    $obj = [PSCustomObject]@{",n:"[PSCustomObject]: create named-property object on the fly."},
          {c:"        Timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",n:"ISO datetime format."},
          {c:"        Type      = $Type",n:""},
          {c:"        Message   = $Msg",n:""},
          {c:"        Data      = $Data",n:""},
          {c:"    }",n:""},
          {c:"    Write-Host \"[ALERT][$Type] $Msg\" -ForegroundColor Red",n:""},
          {c:"    $obj",n:"Output to pipeline. In PowerShell, outputting = returning. No 'return' needed."},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"function Get-FailedLogons([int]$Days) {",n:""},
          {c:"    $since = (Get-Date).AddDays(-$Days)",n:"Date arithmetic. .AddDays(-N) = N days ago. C++: chrono::system_clock::now() - days(N)."},
          {c:"    Get-WinEvent -FilterHashtable @{",n:"FilterHashtable: filters at ETW provider level — fastest method vs Where-Object."},
          {c:"        LogName='Security'; Id=4625; StartTime=$since",n:"EventID 4625 = Account Failed to Logon. Core brute-force detection event."},
          {c:"    } -ErrorAction SilentlyContinue | ForEach-Object {",n:"SilentlyContinue: suppress error if no events found. ForEach-Object: pipeline iterator."},
          {c:"        $d = ([xml]$_.ToXml()).Event.EventData.Data",n:"Cast to XML. ToXml() exposes all EventData fields in structured form."},
          {c:"        [PSCustomObject]@{",n:""},
          {c:"            Time     = $_.TimeCreated",n:""},
          {c:"            User     = ($d | Where-Object { $_.Name -eq 'TargetUserName' }).'#text'",n:"Filter by Name attr, get text content. Like XPath node selection."},
          {c:"            SourceIP = ($d | Where-Object { $_.Name -eq 'IpAddress' }).'#text'",n:""},
          {c:"            LogonType= ($d | Where-Object { $_.Name -eq 'LogonType' }).'#text'",n:"3=Network, 10=RemoteInteractive(RDP), 2=Interactive local."},
          {c:"        }",n:""},
          {c:"    }",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"function Detect-BruteForce([array]$Events, [int]$Threshold = 5) {",n:""},
          {c:"    $Events | Group-Object -Property SourceIP |",n:"Group-Object: like SQL GROUP BY. Groups events sharing the same SourceIP."},
          {c:"    Where-Object Count -ge $Threshold |",n:"Filter: only IPs with >= $Threshold failures."},
          {c:"    ForEach-Object {",n:""},
          {c:"        Write-Alert -Type 'BRUTE_FORCE' \\",n:""},
          {c:"            -Msg \"$($_.Count) failures from $($_.Name)\" \\",n:"$($expr): expression inside string. Like f-strings in Python."},
          {c:"            -Data @{ IP=$_.Name; Count=$_.Count; Users=($_.Group.User | Select-Object -Unique) }",n:""},
          {c:"    }",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"$alerts = @()",n:"@(): empty array. Will collect all alert objects."},
          {c:"$failed = Get-FailedLogons -Days $Days",n:""},
          {c:"Write-Host \"Failed logons (last $Days day): $($failed.Count)\" -ForegroundColor Cyan",n:""},
          {c:"$alerts += Detect-BruteForce -Events $failed",n:"+= on arrays: creates new array with appended items. PS arrays are fixed-size internally."},
          {c:"if ($OutputPath) { $alerts | ConvertTo-Json -Depth 10 | Out-File $OutputPath -Encoding UTF8 }",n:"ConvertTo-Json: serialize objects to JSON. Depth 10: fully serialize nested objects."},
        ]},
      ]},
      { title:"Persistence Hunter", tag:"THREAT HUNT", tagColor:C.amber, content:[
        {type:"h2",text:"Registry & Scheduled Task Persistence Hunter"},
        {type:"code",lang:"powershell",label:"SCRIPT 2: Windows Persistence Enumerator",lines:[
          {c:"function Get-PersistenceLocations {",n:""},
          {c:"    $locs = @(",n:"@(): array literal. Each element is a hashtable."},
          {c:"        @{ P='HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';     D='HKLM Run' },",n:"HKLM: = HKEY_LOCAL_MACHINE. PowerShell exposes registry as a PSDrive!"},
          {c:"        @{ P='HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';     D='HKCU Run' },",n:"HKCU: = HKEY_CURRENT_USER. Per-user persistence, no admin needed."},
          {c:"        @{ P='HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce'; D='HKLM RunOnce' },",n:"RunOnce: executes once at next login then auto-deletes. Used by droppers."},
          {c:"        @{ P='HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'; D='HKLM Run(32bit)' },",n:"Wow6432Node: separate 32-bit registry hive on 64-bit Windows."},
          {c:"        @{ P=\"$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\"; D='User Startup' },",n:"$env:APPDATA: environment variable expansion. Per-user startup folder."},
          {c:"        @{ P='C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp'; D='System Startup' }",n:"System-wide startup. Requires admin write access."},
          {c:"    )",n:""},
          {c:"    foreach ($loc in $locs) {",n:""},
          {c:"        if (-not (Test-Path $loc.P)) { continue }",n:"Test-Path: like [ -e path ] in bash. Works for both filesystem AND registry."},
          {c:"        $items = Get-ItemProperty -Path $loc.P -ErrorAction SilentlyContinue",n:"Reads all values from registry key as a PSObject with named properties."},
          {c:"        if (-not $items) { continue }",n:""},
          {c:"        $items.PSObject.Properties | Where-Object { $_.Name -notmatch '^PS(Path|ParentPath|ChildName|Drive|Provider)$' } |",n:"Exclude PS metadata properties automatically added by Get-ItemProperty."},
          {c:"        ForEach-Object {",n:""},
          {c:"            [PSCustomObject]@{",n:""},
          {c:"                Location  = $loc.D",n:""},
          {c:"                Name      = $_.Name",n:""},
          {c:"                Command   = $_.Value",n:""},
          {c:"                Suspicious = ($_.Value -match '(temp|appdata\\\\[a-z0-9]{8,}|cmd\\.exe|wscript|mshta|powershell.*-enc|rundll32)')",n:"Boolean $True if command matches any suspicious pattern (LOLBins, obfuscated PS, temp paths)."},
          {c:"            }",n:""},
          {c:"        }",n:""},
          {c:"    }",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"function Detect-SuspiciousScheduledTasks {",n:""},
          {c:"    Get-ScheduledTask | Where-Object State -ne 'Disabled' | ForEach-Object {",n:""},
          {c:"        $actions = ($_.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; '",n:"-join: array to string. Like str.join() in Python. Combines all task actions."},
          {c:"        if ($actions -match '(powershell.*-enc|cmd.*/c.*http|wscript|mshta|appdata\\\\[a-z0-9]{8,})') {",n:"Regex match for known malicious scheduled task patterns."},
          {c:"            [PSCustomObject]@{ Name=$_.TaskName; Path=$_.TaskPath; Actions=$actions }",n:""},
          {c:"        }",n:""},
          {c:"    }",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"Write-Host '=== PERSISTENCE AUDIT ===' -ForegroundColor Cyan",n:""},
          {c:"$entries = Get-PersistenceLocations",n:""},
          {c:"$entries | Sort-Object Suspicious -Descending |",n:"Sort: $True (suspicious) entries appear first."},
          {c:"    Format-Table Location, Name, Suspicious, @{",n:"Format-Table: tabular console output. @{}: calculated column."},
          {c:"        Label='Command'; Expression={ $_.Command.Substring(0,[Math]::Min($_.Command.Length,60)) }",n:"[Math]::Min: .NET static method. C++: std::min(). Truncate to 60 chars."},
          {c:"    } -AutoSize",n:"-AutoSize: auto-fit column widths to content."},
          {c:"",n:""},
          {c:"Write-Host '=== SUSPICIOUS SCHEDULED TASKS ===' -ForegroundColor Cyan",n:""},
          {c:"$t = Detect-SuspiciousScheduledTasks",n:""},
          {c:"if ($t) { $t | Format-List } else { Write-Host 'None found.' -ForegroundColor Green }",n:"Format-List: vertical layout — better for objects with long property values."},
        ]},
      ]},
    ],
  },

  labs: {
    label:"LABS", icon:">>", color:C.green,
    lessons:[
      { title:"Practical Lab Exercises", tag:"HANDS-ON", tagColor:C.green, content:[
        {type:"h2",text:"Lab Exercises — Build, Deploy & Test"},
        {type:"p",text:"All labs run on your Ubuntu/Kali system. No external targets. Each builds toward a unified detection pipeline. Read the TIP before starting each lab."},
        {type:"lab",entries:[
          { num:"LAB 01", title:"Bash: FIM Deployment & Live Detection", difficulty:"BEGINNER",
            objective:"Deploy the FIM script, establish a baseline, simulate file modification attacks, and verify JSON alert output.",
            steps:[
              "Save fim.sh from SCRIPT 1 to ~/workspace/projects/security/fim.sh",
              "chmod +x fim.sh",
              "sudo ./fim.sh baseline  →  note the file count",
              "Inspect: head -3 /var/lib/fim/baseline.db",
              "Simulate dropper: sudo touch /usr/bin/evil_backdoor",
              "sudo ./fim.sh check  →  expect NEW_FILE alert in JSON",
              "Simulate modification: sudo bash -c 'echo #test >> /etc/hosts'",
              "sudo ./fim.sh check  →  expect MODIFIED alert on /etc/hosts",
              "Verify JSON: tail -5 /var/log/fim/fim_alerts.log | python3 -m json.tool",
              "Cleanup: sudo rm /usr/bin/evil_backdoor && sudo sed -i '/#test/d' /etc/hosts",
              "Deploy to cron: echo '*/5 * * * * root /path/fim.sh check' | sudo tee /etc/cron.d/fim",
            ],
            expected:"{event: 'NEW_FILE', file: '/usr/bin/evil_backdoor'} and {event: 'MODIFIED', file: '/etc/hosts'}",
            tips:"Watch alerts live: tail -f /var/log/fim/fim_alerts.log in one terminal while running tests in another."
          },
          { num:"LAB 02", title:"Bash: Brute-Force Simulation & Detection", difficulty:"BEGINNER",
            objective:"Simulate SSH brute-force attacks against localhost and catch them with the auth log analyzer.",
            steps:[
              "Ensure SSH is running: sudo systemctl start ssh",
              "Install hydra: sudo apt install hydra -y",
              "Create wordlist: printf 'wrong1\\nwrong2\\nwrong3\\nwrong4\\nwrong5\\n' > /tmp/pass.txt",
              "Simulate against YOUR OWN machine ONLY: hydra -l nobody -P /tmp/pass.txt ssh://127.0.0.1 -t 1",
              "Run detector: sudo ./brute_detect.sh /var/log/auth.log",
              "Verify: 127.0.0.1 appears with count >= 5",
              "Change THRESHOLD=3 in script, re-run, verify earlier trigger",
              "Extension: pipe output to Slack webhook for real-time alerts via curl",
              "Cleanup: rm /tmp/pass.txt",
            ],
            expected:"[BRUTE-FORCE] IP: 127.0.0.1 | Attempts: 5",
            tips:"Monitor auth.log live during attack: sudo tail -f /var/log/auth.log | grep Failed"
          },
          { num:"LAB 03", title:"Python: IOC Extraction on Synthetic Log", difficulty:"INTERMEDIATE",
            objective:"Create a log file with embedded IOCs and validate that the extractor correctly identifies and filters them.",
            steps:[
              "Save ioc_extractor.py from the Python section",
              "Create test log with: cat > /tmp/test.log",
              "  Line 1: 2024-01-15 22:00:01 Failed login from 198.51.100.4",
              "  Line 2: 2024-01-15 22:00:02 File hash: 44d88612fea8a8f36de82e1278abb02f",
              "  Line 3: 2024-01-15 22:00:03 Beacon to evil-c2.ru every 60s",
              "  Line 4: 2024-01-15 22:00:04 Internal hop from 192.168.1.5",
              "Run: python3 ioc_extractor.py /tmp/test.log",
              "Verify: 198.51.100.4 found (public IP), MD5 hash found, domain found",
              "Verify: 192.168.1.5 NOT in output (RFC1918 private — filtered)",
              "Set VT key: export VT_API_KEY=your_key && python3 ioc_extractor.py /tmp/test.log",
            ],
            expected:"[IPV4] 198.51.100.4, [MD5] 44d88612..., [DOMAIN] evil-c2.ru",
            tips:"Free VirusTotal API: 1000 requests/day. Register at virustotal.com. Set key in env, never hardcode."
          },
          { num:"LAB 04", title:"Python: Trigger & Catch /proc Anomalies", difficulty:"INTERMEDIATE",
            objective:"Deliberately trigger each detection rule in proc_forensics.py and confirm each flag fires correctly.",
            steps:[
              "Save proc_forensics.py, run: sudo python3 proc_forensics.py (baseline — no flags expected)",
              "Trigger CWD anomaly: cd /tmp && python3 -c 'import time; time.sleep(60)' &",
              "Re-run: should flag SUSP_CWD for the python3 sleep process",
              "Trigger deleted exe: cp /bin/sleep /tmp/test_del && /tmp/test_del 60 & && sleep 0.5 && rm /tmp/test_del",
              "Re-run: should flag EXE_DELETED for the test_del process",
              "Observe maps output for any python3 process (anon regions are normal for Python runtime)",
              "Kill test processes: kill %1 %2",
              "Extension: add /proc/net/tcp parsing to show open ports per-process",
            ],
            expected:"SUSP_CWD for /tmp python3 process and EXE_DELETED for test_del process.",
            tips:"/proc/net/tcp shows connections in hex. Col 2 = local addr:port. Use int(hex,16) to decode each component."
          },
          { num:"LAB 05", title:"PowerShell: Persistence Audit (Windows VM)", difficulty:"INTERMEDIATE",
            objective:"Run the persistence hunter in your Windows analysis VM, plant a test entry, verify detection.",
            steps:[
              "Boot Windows 10 analysis VM — TAKE A SNAPSHOT BEFORE STARTING",
              "Copy persistence_hunter.ps1 to Desktop",
              "Check policy: Get-ExecutionPolicy → if Restricted: Set-ExecutionPolicy -Scope Process Bypass",
              "Run baseline: .\\persistence_hunter.ps1",
              "Plant test entry: New-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'EvilUpdate' -Value 'C:\\Windows\\Temp\\update.exe' -PropertyType String",
              "Re-run: EvilUpdate should appear with Suspicious=$True (matches Temp pattern)",
              "Create a suspicious scheduled task with PowerShell -EncodedCommand",
              "Re-run: should detect it in Detect-SuspiciousScheduledTasks",
              "Cleanup: Remove-ItemProperty -Path 'HKCU:\\...\\Run' -Name 'EvilUpdate'",
            ],
            expected:"EvilUpdate in persistence report with Suspicious=True.",
            tips:"Use Get-WinEvent -Path .\\sample.evtx to test against EVTX sample files from Blue Team Labs Online."
          },
          { num:"LAB 06", title:"CAPSTONE: Unified Detection Pipeline", difficulty:"ADVANCED",
            objective:"Chain FIM + brute-force detection + process forensics into one automated pipeline with systemd timer deployment.",
            steps:[
              "Create pipeline.sh that runs all three tools, aggregates JSON to /var/log/security/pipeline_$(date +%Y%m%d_%H%M%S).json",
              "Test manually: sudo ./pipeline.sh",
              "Create /etc/systemd/system/sec-pipeline.service pointing to the script",
              "Create /etc/systemd/system/sec-pipeline.timer (OnCalendar=*:0/5 = every 5 min)",
              "Enable: sudo systemctl enable --now sec-pipeline.timer",
              "Verify: systemctl status sec-pipeline.timer",
              "Simultaneously simulate all 3 attack scenarios",
              "Verify all 3 detections appear in the aggregated JSON output",
              "Parse output: python3 -c \"import json,pathlib; [print(e) for e in json.loads(pathlib.Path('latest.json').read_text())]\"",
              "BONUS: Send Slack webhook alert on any detection via curl -X POST",
            ],
            expected:"Single JSON file with FIM, brute-force, and process anomaly alerts from one pipeline run.",
            tips:"systemd timers are more reliable than cron — handle missed runs and log to journald. Debug: journalctl -u sec-pipeline.service -f"
          },
        ]},
      ]},
    ],
  },
};

/* ── COMPONENTS ── */
function CodeBlock({ lines, label, lang }) {
  const [hov, setHov] = useState(null);
  const lc = { bash:C.amber, python:C.cyan, powershell:C.purple }[lang] || C.amber;
  return (
    <div style={{margin:"14px 0",border:`1px solid ${C.border}`,borderRadius:4}}>
      <div style={{background:"#0f0c00",borderBottom:`1px solid ${C.border}`,padding:"4px 12px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:lc,fontSize:9,fontWeight:700,letterSpacing:"0.1em"}}>{lang.toUpperCase()}</span>
        <span style={{color:C.dim,fontSize:10}}>{label}</span>
        <span style={{marginLeft:"auto",color:"#1a1500",fontSize:9}}>hover line → annotation</span>
      </div>
      <div style={{background:C.bg,fontFamily:"'Fira Code','Courier New',monospace",fontSize:11}}>
        {lines.map((ln,i)=>(
          <div key={i} onMouseEnter={()=>ln.n&&setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{display:"grid",gridTemplateColumns:"32px 1fr",
              background:hov===i?"#1a1400":"transparent",
              borderLeft:hov===i?`2px solid ${lc}`:"2px solid transparent",
              cursor:ln.n?"pointer":"default"}}>
            <span style={{color:"#2a2000",padding:"0 6px",textAlign:"right",fontSize:10,userSelect:"none",lineHeight:"1.7"}}>
              {ln.c?i+1:""}
            </span>
            <div style={{padding:"0 10px 0 4px",lineHeight:"1.7"}}>
              <span style={{color:ln.c.startsWith('#')?C.dim:(ln.c.startsWith('set ')||ln.c.startsWith('declare ')||ln.c.startsWith('param')||ln.c.startsWith('[Valid')?C.amberF:C.amberD)}}>
                {ln.c}
              </span>
              {hov===i&&ln.n&&(
                <div style={{marginTop:3,padding:"5px 10px",background:"#0f0c00",border:`1px solid ${lc}33`,borderLeft:`3px solid ${lc}`,borderRadius:3,color:C.bright,fontSize:11,lineHeight:1.5}}>
                  ▸ {ln.n}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConceptTable({ title, rows }) {
  return (
    <div style={{margin:"12px 0"}}>
      <div style={{color:C.amberD,fontSize:9,letterSpacing:"0.12em",marginBottom:5}}>{title}</div>
      <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
        {rows.map((row,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:`repeat(${row.length},1fr)`,
            background:ri===0?"#0f0c00":ri%2?C.bg:C.bg2,
            borderBottom:ri<rows.length-1?`1px solid ${C.border}`:"none"}}>
            {row.map((cell,ci)=>(
              <div key={ci} style={{padding:"5px 10px",color:ri===0?C.amberF:(ci===0?C.amber:C.dim),fontSize:11,
                fontFamily:"'Fira Code','Courier New',monospace",
                borderRight:ci<row.length-1?`1px solid ${C.border}`:"none"}}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function VulnBlock({ entries }) {
  const [open,setOpen] = useState(0);
  const rc = {CRITICAL:"#ff2222",HIGH:C.red,MEDIUM:C.amber,LOW:C.green};
  return (
    <div style={{margin:"12px 0"}}>
      {entries.map((e,i)=>(
        <div key={i} style={{marginBottom:8,border:`1px solid ${open===i?rc[e.risk]+"44":C.border}`,borderRadius:4}}>
          <div onClick={()=>setOpen(open===i?-1:i)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:open===i?"#120900":C.bg2}}>
            <span style={{background:rc[e.risk]+"22",color:rc[e.risk],fontSize:9,padding:"1px 6px",borderRadius:2,minWidth:60,textAlign:"center"}}>{e.risk}</span>
            <span style={{color:C.bright,fontSize:12}}>{e.title}</span>
            <span style={{marginLeft:"auto",color:C.dim}}>{open===i?"▲":"▼"}</span>
          </div>
          {open===i&&(
            <div style={{padding:"12px 14px",background:"#0a0800"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{color:C.red,fontSize:9,letterSpacing:"0.1em",marginBottom:5}}>❌ VULNERABLE</div>
                  <pre style={{background:"#120000",border:"1px solid #2a0000",borderRadius:3,padding:"8px 10px",color:"#ff8888",fontSize:11,fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>{e.bad.join("\n")}</pre>
                </div>
                <div>
                  <div style={{color:C.green,fontSize:9,letterSpacing:"0.1em",marginBottom:5}}>✓ SECURE</div>
                  <pre style={{background:"#001200",border:"1px solid #002a00",borderRadius:3,padding:"8px 10px",color:"#88ff88",fontSize:11,fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>{e.good.join("\n")}</pre>
                </div>
              </div>
              <div style={{marginTop:10,padding:"7px 10px",background:"#0f0e00",borderLeft:`3px solid ${C.amber}`,color:C.dim,fontSize:11,lineHeight:1.6}}>▸ {e.explanation}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LabBlock({ entries }) {
  const [open,setOpen] = useState(0);
  const dc={BEGINNER:C.green,INTERMEDIATE:C.amber,ADVANCED:C.red};
  return (
    <div style={{margin:"12px 0"}}>
      {entries.map((e,i)=>(
        <div key={i} style={{marginBottom:8,border:`1px solid ${open===i?C.green+"44":C.border}`,borderRadius:4}}>
          <div onClick={()=>setOpen(open===i?-1:i)} style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:open===i?"#050f05":C.bg2}}>
            <span style={{color:C.dim,fontSize:9,minWidth:48}}>{e.num}</span>
            <span style={{color:C.bright,fontSize:12}}>{e.title}</span>
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:dc[e.difficulty],fontSize:9,background:dc[e.difficulty]+"22",padding:"1px 6px",borderRadius:2}}>{e.difficulty}</span>
              <span style={{color:C.dim}}>{open===i?"▲":"▼"}</span>
            </span>
          </div>
          {open===i&&(
            <div style={{padding:"12px 16px",background:"#030d03"}}>
              <div style={{color:C.dim,fontSize:11,marginBottom:10,lineHeight:1.6}}>{e.objective}</div>
              <div style={{color:C.green,fontSize:9,letterSpacing:"0.1em",marginBottom:7}}>STEPS</div>
              {e.steps.map((s,si)=>(
                <div key={si} style={{display:"flex",gap:8,marginBottom:4}}>
                  <span style={{color:C.amber,minWidth:18,fontSize:11}}>{si+1}.</span>
                  <span style={{color:"#88aa88",fontSize:11,fontFamily:"'Fira Code','Courier New',monospace"}}>{s}</span>
                </div>
              ))}
              <div style={{padding:"7px 10px",background:"#001a00",border:`1px solid ${C.green}33`,borderRadius:3,margin:"8px 0"}}>
                <span style={{color:C.green,fontSize:9}}>EXPECTED: </span>
                <span style={{color:"#88cc88",fontSize:11}}>{e.expected}</span>
              </div>
              <div style={{padding:"5px 10px",background:"#0f0e00",borderLeft:`2px solid ${C.amber}`,color:C.dim,fontSize:11}}>💡 {e.tips}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function renderBlock(block,i) {
  switch(block.type){
    case"h2": return <h2 key={i} style={{color:C.amberF,fontSize:15,fontFamily:"'Courier New',monospace",fontWeight:700,margin:"18px 0 8px",borderBottom:`1px solid ${C.border}`,paddingBottom:6}}>{block.text}</h2>;
    case"h3": return <h3 key={i} style={{color:C.amber,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:600,margin:"14px 0 5px"}}>{block.text}</h3>;
    case"p":  return <p  key={i} style={{color:C.dim,fontSize:12,lineHeight:1.7,margin:"5px 0",fontFamily:"'Courier New',monospace"}}>{block.text}</p>;
    case"code":    return <CodeBlock    key={i} lines={block.lines}    label={block.label} lang={block.lang}/>;
    case"concept": return <ConceptTable key={i} title={block.title}    rows={block.rows}/>;
    case"vuln":    return <VulnBlock    key={i} entries={block.entries}/>;
    case"lab":     return <LabBlock     key={i} entries={block.entries}/>;
    default: return null;
  }
}

/* ── MAIN APP ── */
export default function Mod01() {
  const [activeSec, setActiveSec] = useState("bash");
  const [activeLi,  setActiveLi]  = useState(0);
  const ref = useRef(null);

  const sec    = SECTIONS[activeSec];
  const lesson = sec.lessons[activeLi];

  const goSec = (k) => { setActiveSec(k); setActiveLi(0); ref.current?.scrollTo(0,0); };
  const goLi  = (i) => { setActiveLi(i);                  ref.current?.scrollTo(0,0); };

  const allLessons = Object.entries(SECTIONS).flatMap(([sk,s])=>s.lessons.map((_,li)=>({sk,li})));
  const flat = allLessons.findIndex(x=>x.sk===activeSec&&x.li===activeLi);

  const prev = () => { if(flat>0){ const p=allLessons[flat-1]; goSec(p.sk); setTimeout(()=>setActiveLi(p.li),0); }};
  const next = () => { if(flat<allLessons.length-1){ const n=allLessons[flat+1]; goSec(n.sk); setTimeout(()=>setActiveLi(n.li),0); }};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.amberD,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)"}}>

      {/* HEADER */}
      <div style={{background:"#000",borderBottom:`2px solid ${C.amber}33`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.amber+"22",border:`1px solid ${C.amber}55`,borderRadius:3,padding:"4px 10px",color:C.amber,fontSize:12,fontWeight:700,letterSpacing:"0.12em"}}>MOD-01</div>
        <div>
          <div style={{color:C.amberF,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>SCRIPTING FOR SECURITY</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.1em"}}>BASH · PYTHON · POWERSHELL · SECURE CODING · LABS — HOVER CODE LINES FOR ANNOTATIONS</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {[C.green,C.cyan,C.purple,C.red].map((c,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:c,opacity:0.8}}/>)}
        </div>
      </div>

      {/* SECTION TABS */}
      <div style={{background:"#000",borderBottom:`1px solid ${C.border}`,display:"flex"}}>
        {Object.entries(SECTIONS).map(([key,s])=>(
          <button key={key} onClick={()=>goSec(key)} style={{
            background:activeSec===key?C.bg3:"transparent",border:"none",
            borderBottom:activeSec===key?`2px solid ${s.color}`:"2px solid transparent",
            borderTop:"2px solid transparent",
            color:activeSec===key?s.color:"#3a3000",
            padding:"9px 16px",cursor:"pointer",fontSize:11,letterSpacing:"0.08em",
            fontFamily:"'Courier New',monospace",fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:9,opacity:0.7}}>[{s.icon}]</span>
            {s.label}
            <span style={{color:activeSec===key?s.color+"55":"#2a2000",fontSize:8}}>{s.lessons.length}</span>
          </button>
        ))}
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{width:200,minWidth:200,background:"#040300",borderRight:`1px solid ${C.border}`,padding:"14px 10px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
          <div style={{color:sec.color,fontSize:9,letterSpacing:"0.12em",marginBottom:10,paddingBottom:7,borderBottom:`1px solid ${C.border}`}}>
            {sec.label} — {sec.lessons.length} TOPICS
          </div>
          {sec.lessons.map((l,i)=>(
            <button key={i} onClick={()=>goLi(i)} style={{background:activeLi===i?C.bg3:"transparent",border:activeLi===i?`1px solid ${sec.color}33`:"1px solid transparent",borderRadius:3,padding:"7px 9px",cursor:"pointer",textAlign:"left"}}>
              <div style={{color:activeLi===i?C.bright:"#5a4a00",fontSize:11,marginBottom:3,lineHeight:1.4}}>{l.title}</div>
              <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:l.tagColor+"22",color:l.tagColor}}>{l.tag}</span>
            </button>
          ))}
          <div style={{marginTop:"auto",paddingTop:14,borderTop:`1px solid ${C.border}`}}>
            <div style={{color:"#2a2000",fontSize:9,marginBottom:7,letterSpacing:"0.1em"}}>ALL MODULES</div>
            {Object.entries(SECTIONS).map(([key,s])=>(
              <button key={key} onClick={()=>goSec(key)} style={{display:"flex",alignItems:"center",gap:6,width:"100%",background:activeSec===key?"#0f0c00":"transparent",border:"none",color:activeSec===key?s.color:"#2a2000",padding:"4px 6px",cursor:"pointer",fontSize:9,textAlign:"left",borderRadius:2,fontFamily:"'Courier New',monospace"}}>
                <span>[{s.icon}]</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div ref={ref} style={{flex:1,padding:"24px 28px",overflowY:"auto",background:C.bg}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,fontSize:10}}>
            <span style={{color:sec.color}}>{sec.label}</span>
            <span style={{color:"#2a2000"}}>›</span>
            <span style={{color:C.amberD}}>{lesson.title}</span>
            <span style={{marginLeft:"auto"}}>
              <span style={{background:lesson.tagColor+"11",border:`1px solid ${lesson.tagColor}44`,color:lesson.tagColor,padding:"2px 8px",borderRadius:3,fontSize:9,letterSpacing:"0.08em"}}>{lesson.tag}</span>
            </span>
          </div>

          {lesson.content.map((block,i)=>renderBlock(block,i))}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:36,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
            <button onClick={prev} disabled={flat===0} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,color:flat===0?C.dim:C.amber,padding:"7px 16px",cursor:flat===0?"default":"pointer",fontSize:10,letterSpacing:"0.06em"}}>← PREV</button>
            <span style={{color:C.dim,fontSize:10,alignSelf:"center"}}>{flat+1} / {allLessons.length}</span>
            <button onClick={next} disabled={flat===allLessons.length-1} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,color:flat===allLessons.length-1?C.dim:C.amber,padding:"7px 16px",cursor:flat===allLessons.length-1?"default":"pointer",fontSize:10,letterSpacing:"0.06em"}}>NEXT →</button>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 20px",display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a2000"}}>
        <span>MOD-01 :: SCRIPTING FUNDAMENTALS FOR SECURITY</span>
        <span style={{color:C.amber+"44"}}>{sec.label} · {lesson.title.toUpperCase()}</span>
      </div>
    </div>
  );
}
