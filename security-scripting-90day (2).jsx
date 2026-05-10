import { useState, useRef } from "react";

const C = {
  bg:"#020508", bg2:"#040b12", bg3:"#071020",
  border:"#0a1e35", dim:"#2a5070", bright:"#b8d8f8",
  blue:"#00aaff", cyan:"#00ffcc", green:"#44ff88",
  amber:"#ffaa00", red:"#ff3355", purple:"#aa66ff",
  orange:"#ff7700", pink:"#ff66aa", white:"#ddeeff",
};

/* ═══════════════════════════════════════════════════════
   90-DAY ENTERPRISE SECURITY SCRIPTING CURRICULUM
   Format: Deep-dive with all 22 daily components
   ═══════════════════════════════════════════════════════ */

// ─── Full 22-component daily structure ───────────────
const D22 = [
  "Topic Name","Objective","Deep Technical Explanation",
  "Core Commands","Script Walkthrough","Write-From-Scratch Exercise",
  "Debugging Exercise","Existing Script Analysis","Security Use Case",
  "Red Team Perspective","Blue Team Perspective","Detection Opportunities",
  "Common Mistakes","Performance Considerations","Logging Considerations",
  "Secure Coding Practices","Hands-On Lab","Mini Project",
  "Expected Output","Stretch Goal","Homework","Research Task",
];

const MONTHS = [
  {
    id:"m1", label:"MONTH 1", title:"Foundations & System Automation",
    color:C.blue, weeks:[1,2,3,4],
    goal:"Master Bash + Python + PowerShell fundamentals through OS-internals lens. Build 6 production security tools.",
    theme:"Every script connects to kernel primitives, process memory, and network stack — not just syntax.",
    deliverables:["Port Scanner (threaded)", "IOC Extractor", "File Integrity Monitor", "Auth Log Analyzer", "Process Monitor", "Security Toolkit CLI"],
  },
  {
    id:"m2", label:"MONTH 2", title:"Security Engineering — Red + Blue Team Automation",
    color:C.amber, weeks:[5,6,7,8],
    goal:"Build detection engineering, threat hunting, malware triage, and recon automation pipelines.",
    theme:"Scripts don't just run — they leave telemetry, trigger detections, and create forensic artefacts.",
    deliverables:["Threat Hunting Toolkit", "Detection Pipeline", "SIGMA Automation", "Recon Suite", "Persistence Hunter", "Malware Triage Tool", "PCAP Analyzer"],
  },
  {
    id:"m3", label:"MONTH 3", title:"Advanced Tooling — Malware Analysis + Detection Platform",
    color:C.purple, weeks:[9,10,11,12,13],
    goal:"Build enterprise-grade async platforms, REST APIs, plugin architectures, and deploy via Docker/CI/CD.",
    theme:"Production engineering: every tool is tested, documented, monitored, and deployed as infrastructure.",
    deliverables:["PE Analysis Platform", "YARA Automation", "Volatility Automation", "Async IOC Engine", "Detection-as-Code", "EDR-style Agent", "SOC API Platform", "CAPSTONE: SENTRY"],
  },
];

// ─── All 90 days ─────────────────────────────────────
const DAYS = [
  // MONTH 1 — WEEK 1 (Bash Foundations)
  { day:1,  week:1,  month:1, lang:"BASH",       title:"Shell Architecture, Script Anatomy & Strict Mode",
    obj:"Understand how bash initialises, what strict mode prevents, and write a hardened script template.",
    tech:`Bash spawns as a child process of the calling shell. The kernel executes it as an interpreter for the script file.
set -e: maps to bash checking $? after every simple command — equivalent to C's if(ret!=0)exit(ret).
set -u: bash tracks variable assignment in a bitmask per variable slot — unset triggers EINVAL at expansion.
set -o pipefail: bash runs pipeline stages as sibling fork()s connected by pipe(2) FDs. Without pipefail, 
only rightmost exit code is captured. IFS=$'\\n\\t' changes how bash word-splits after parameter expansion.
The shebang is read by execve() in the kernel — /usr/bin/env bash uses PATH lookup instead of hardcoded path.`,
    commands:["set -euo pipefail", "IFS=$'\\n\\t'", "trap 'cleanup' EXIT INT TERM", "declare -r/-i/-a/-A/-x", "${VAR:?msg}", "[[ $# -lt 1 ]] && usage"],
    walkthrough:`Every production security script starts with these 6 lines:
1. #!/usr/bin/env bash         — portable shebang
2. set -euo pipefail           — strict mode
3. IFS=$'\\n\\t'               — safe splitting
4. readonly SCRIPT_DIR=...     — immutable path
5. trap 'rm -f "$TMPFILE"' EXIT — guaranteed cleanup
6. log_json() { printf '{"ts":"%s","level":"%s","msg":"%s"}' ... } — structured logging`,
    scratch:"Write hello_security.sh: accepts --target IP, --port PORT, --output json|table. Validate all inputs with regex. Output JSON or table depending on flag. Exit 1 on bad input with usage().",
    debug:`#!/bin/bash
TARGET=$1          # BUG 1: no strict mode — $1 could be empty
OUTPUT=/tmp/result  # BUG 2: predictable temp path — TOCTOU race
grep $TARGET /etc/hosts  # BUG 3: unquoted — word-splits on spaces
cat $OUTPUT`,     // BUG 4: file never created — no error handling
    analysis:"Analyse /usr/bin/gettext: identify shebang, option parsing, error handling, exit codes. Document what it does well vs what violates modern standards.",
    usecase:"Every security script: FIM, auth analyzers, network scanners, incident response tools. The template IS the foundation.",
    red:"Attackers use bash scripts for persistence (cron), lateral movement (ssh loops), and C2 polling. Sloppy scripts leave temp files, predictable paths, world-readable logs.",
    blue:"Detect: unusual bash parent-child trees in Sysmon/auditd. Watch for set +e in scripts (disabling error checking = deliberate). Monitor /tmp for executable drops.",
    detect:"auditd: -a always,exit -F arch=b64 -S execve -k bash_exec. Sysmon Event 1: bash spawned by unexpected parent. File creation in /tmp with +x permissions.",
    mistakes:["Forgetting to quote: rm $file vs rm \"$file\"","Using /tmp/fixed_name (TOCTOU)", "No trap — temp files persist on crash", "Mixing [ ] and [[ ]] — different semantics", "set -e without || true on intentional-fail commands"],
    perf:"set -e adds ~0% overhead (kernel-level exit check). IFS change has negligible cost. trap is registered once. No loops in setup = O(1) initialisation.",
    logging:`Every script must log: start/end timestamps, input parameters (sanitised), each major step, errors with context.
JSON format: {"ts":"ISO8601","level":"INFO|WARN|ERROR","script":"name","pid":PID,"msg":"..."}
Never log: raw user input, credentials, file contents. Always log: exit codes, function names, durations.`,
    secure:"No eval on user input. No $1 directly in command args. Validate before use. Use mktemp for temp files. Restrict permissions: chmod 700 script.sh.",
    lab:"Set up ~/workspace/security-scripts/. Create scripts/lib/seclib.sh with: log_json(), validate_ip(), hash_file(), send_alert(). Test each function. Commit to git.",
    project:"hardened_template.sh: a copy-paste template you will use for every remaining script in this course. Include all 6 strict-mode lines, colour functions, usage(), trap, and JSON logging.",
    output:"Template runs with --help showing formatted help. Rejects bad args with coloured error. Cleans up temp files even on Ctrl+C. Logs JSON to /var/log/security/.",
    stretch:"Add --dry-run mode that logs what it WOULD do without doing it. Add --verbose/-v flag that enables DEBUG-level JSON logs.",
    hw:"Read: bash(1) man page sections on 'Pipelines', 'Lists', 'Parameters'. Write notes on what set -o errexit actually checks.",
    research:"How does the Linux kernel parse and execute a shebang line? What is execve()? How does /usr/bin/env find bash? Relate to C's execv()." },

  { day:2,  week:1,  month:1, lang:"BASH",       title:"Variables, Arrays, String Ops & Parameter Expansion",
    obj:"Master all declare types, string manipulation operators, array patterns, and safe expansion idioms.",
    tech:`Bash variables are stored in a hash table (VARIABLES) in memory. Each entry has: name, value (char*), flags (int).
declare -a: indexed array — internally stored as sparse array with integer keys.
declare -A: associative array — hash table with string keys (bash 4.0+, uses glibc's hash table).
declare -r: sets att_readonly flag in variable entry — attempts to write return EROFS.
declare -i: integer attribute — arithmetic evaluation on every assignment (like C int semantics).
String operations like ${#var} are O(n) — they walk the string to find null terminator.
${var##pattern} and ${var%%pattern} use fnmatch() internally — O(n) worst case.`,
    commands:["declare -a/-A/-r/-i/-x", "${#arr[@]}", "${arr[@]:offset:len}", "${var//search/replace}", "${var^^}", "${var,,}", "IFS='.' read -ra octets <<< \"$ip\""],
    walkthrough:"Build ip_blocklist_manager.sh: load IPs from file, validate each (regex), store in -A map, deduplicate, sort numerically, output clean list.",
    scratch:"blocklist_manager.sh: commands: add|remove|check|list|export. Stores in ~/.config/security/blocklist.db (one IP per line). Validates every IP. Reports duplicates.",
    debug:`declare -A seen
while read line; do
  ip=$line                    # BUG 1: no whitespace trim
  seen[$ip]++                  # BUG 2: -A not declared, will fail with set -u
  echo ${seen[$ip]}            # BUG 3: unquoted key
done < ips.txt
for k in ${!seen[@]}; do       # BUG 4: unquoted — breaks on spaces in keys
  echo $k: ${seen[$k]}
done`,
    analysis:"Study how /etc/hosts is parsed by glibc's getaddrinfo(). Write a bash script that replicates the lookup logic using only bash string operations.",
    usecase:"IOC management, allowlist/blocklist maintenance, firewall rule generation, threat intel deduplication.",
    red:"Attackers maintain IP lists for scanning, C2 rotation. Bash arrays used in stageless implants to cycle through fallback C2s.",
    blue:"Detect: scripts reading/writing to suspicious paths (/dev/shm, /tmp). Large array operations on file lists = potential enumeration.",
    detect:"auditd: watch for cat /etc/hosts followed by bash script execution. inotify on /etc/hosts for unauthorised modification.",
    mistakes:["${arr[@]} vs ${arr[*]} — different quoting behaviour","Sparse array holes break length assumptions","Forgetting export -f for functions used in xargs/parallel","String ops on binary data — use xxd/od"],
    perf:"Associative array lookup: O(1) average. Sorted arrays: O(n log n) with sort. For 10,000+ IPs, consider SQLite (O(log n) indexed lookup) over bash -A.",
    logging:"Log each add/remove/check with IP, timestamp, calling script, and result. Never log the full blocklist in a single JSON line — size limit concerns.",
    secure:"Validate IP format before inserting into -A (prevents key injection). File paths: use realpath to prevent traversal. Temp files: mktemp with 600 perms.",
    lab:"Build blocklist_manager.sh. Test: add 100 IPs including duplicates and invalids. Verify deduplication. Export to CSV. Time the operation for 10k IPs.",
    project:"ip_intelligence.sh: maintain a local SQLite-backed IP database via bash + sqlite3 CLI. Commands: import, lookup, export, stats. Track: IP, first_seen, last_seen, hit_count.",
    output:"ip_intelligence.sh lookup 198.51.100.1 returns JSON with all stored data. Import of 10k IPs completes in < 10 seconds.",
    stretch:"Add CIDR notation support: expand 10.0.0.0/24 into all 254 host IPs before storing.",
    hw:"Write a bash function that converts an IPv4 address to its 32-bit integer representation and back. Use only bash arithmetic — no external tools.",
    research:"How does glibc store strings internally (SDS vs null-terminated)? How does bash's hash table handle collisions? Compare to C++ std::unordered_map." },

  { day:3,  week:1,  month:1, lang:"BASH",       title:"Process Management, /proc Internals & Signals",
    obj:"Map /proc filesystem to kernel data structures. Write process monitors using only bash + /proc.",
    tech:`/proc is a virtual filesystem — reads trigger kernel callbacks, not disk I/O.
/proc/PID/status: kernel reads task_struct fields and formats them as text on read().
/proc/PID/maps: kernel walks mm_struct->mmap linked list of vm_area_struct entries.
/proc/PID/fd/: each entry is a symlink pointing to the file description (not descriptor) in the kernel.
/proc/PID/cmdline: kernel reads mm_struct->arg_start to arg_end, NUL-separated.
Signals: kill(pid, sig) → kernel sets sigpending bit in task_struct → checked on every syscall return.
SIGTERM (15): allows cleanup. SIGKILL (9): kernel removes task directly. SIGSTOP (19): sets TASK_STOPPED.`,
    commands:["cat /proc/PID/status", "cat /proc/PID/cmdline | tr '\\0' ' '", "ls -la /proc/PID/fd/", "cat /proc/PID/maps | grep rwx", "kill -0 PID (existence check)", "wait -n", "jobs -l"],
    walkthrough:`proc_monitor.sh:
1. Iterate /proc/[0-9]*/  (glob, O(n) where n = process count)
2. Read comm, status, cmdline, maps per PID
3. Flag: deleted exe, /tmp CWD, anonymous rwx regions, root shells
4. Output structured JSON alert per flagged process
5. Diff against previous run → only alert on NEW flags`,
    scratch:"proc_forensics.sh: monitor /proc for 60 seconds. Alert when: new process appears with /tmp in cmdline, existing process opens new socket, process writes to /etc/. Use inotifywait + /proc polling.",
    debug:`for pid in /proc/*/; do
  name=$(cat $pid/comm)          # BUG: unquoted, fails on spaces
  ppid=$(awk '/PPid/ {print $2}' $pid/status)  # BUG: file may vanish between existence check and read
  if [ $name = "bash" ]; then    # BUG: single brackets, unquoted
    echo "Found: $pid"
  fi
done 2>/dev/null                  # BUG: silencing ALL errors hides real problems`,
    analysis:"Read the output of /proc/self/maps while your script runs. Identify: stack region, heap region, text segment, shared libraries. Map each to what you know about ELF segments.",
    usecase:"Live IR: enumerate processes without ps binary (compromised). EDR-like monitoring without kernel module. Forensic evidence collection.",
    red:"Malware reads /proc/PID/maps to find loaded modules for process injection. Reads /proc/net/tcp to map network state without netstat. Hides by DKOM (kernel module) or by running very briefly.",
    blue:"Compare ps output vs /proc walk — discrepancy = DKOM rootkit hiding processes. Monitor /proc/PID/maps for new rwx anonymous regions = injection indicator.",
    detect:"Sysmon Event 1 + Event 10. auditd: ptrace syscall watch. Volatility pslist vs psscan comparison. YARA scan of /proc/PID/mem for shellcode.",
    mistakes:["Race condition: PID vanishes between glob and read", "Reading binary /proc files as text", "Missing 2>/dev/null on reads (noisy)", "Using ps instead of /proc (ps can be replaced)"],
    perf:"/proc reads are fast (kernel callbacks) but iterating all PIDs is O(n). For continuous monitoring, use inotify on /proc instead of polling. Polling 1000 PIDs takes ~50ms.",
    logging:"Log: PID, comm, PPID, cmdline (truncated), flags triggered, timestamp. Include: scanner PID (to exclude self from results).",
    secure:"Running process monitor as root = high-value target. Drop to nobody after reading privileged /proc paths. Use capability(CAP_SYS_PTRACE) minimally.",
    lab:"Write proc_baseline.sh: snapshot all PIDs+names. Run again 60s later. Show only new processes, noting if any match suspicious patterns: shell from web server, /tmp exec.",
    project:"process_guardian.sh: daemon that monitors /proc every 5s, alerts on: new processes with rwx anon maps, processes CWD in /tmp, root shells not in allowlist. Logs to JSONL.",
    output:"Guardian runs as systemd service. Alerts within 5s of suspicious process appearing. Zero false positives on allowlisted processes.",
    stretch:"Add parent-child chain reconstruction: build process tree from PPID values. Alert when depth > 5 (unusual process nesting).",
    hw:"Write a bash function that reads /proc/net/tcp and decodes hex IP:port to dotted-decimal. No external tools. Handle both IPv4 and IPv6 entries.",
    research:"How does the kernel maintain the process list (task_struct doubly-linked list)? How does DKOM work to hide processes? How does Volatility detect it?" },

  { day:4,  week:1,  month:1, lang:"BASH",       title:"grep, awk, sed — Security Text Processing Pipeline",
    obj:"Master the Unix text processing triad for log analysis, IOC extraction, and report generation.",
    tech:`grep uses Boyer-Moore-Horspool algorithm for literal strings (O(n/m) average).
-P (Perl regex) uses PCRE library — more powerful but ~3x slower than -E (POSIX ERE).
-o prints only matching part — critical for IOC extraction without context noise.
awk runs as a state machine: BEGIN → per-line rules (pattern {action}) → END.
awk maintains associative arrays in memory — frequency counting is O(1) per lookup.
sed operates on a pattern space (buffer) with optional hold space for multi-line operations.
sed 's/pattern/replace/g': uses re_exec() to find matches, O(n) per line.
All three read stdin line-by-line — pipeline parallel execution via kernel pipe buffers (64KB default).`,
    commands:["grep -oE '[0-9]{1,3}(\\.[0-9]{1,3}){3}'", "awk '{count[$1]++} END{for(k in count) print count[k],k}' | sort -rn", "sed -n '/Failed/,/^$/p'", "grep -c vs wc -l", "awk 'NR==FNR{seen[$1]=1;next} seen[$1]' file1 file2"],
    walkthrough:`Log analysis pipeline for /var/log/auth.log:
1. grep 'Failed password' → filter relevant lines
2. grep -oE '[0-9]{1,3}(\\.[0-9]{1,3}){3}' → extract IPs
3. sort | uniq -c → count frequency per IP
4. sort -rn → highest first
5. awk '$1 >= 5 {print "ALERT:", $2, "attempts:", $1}' → threshold
6. jq -R . | jq -s . → format as JSON array`,
    scratch:"Write auth_pipeline.sh: parse auth.log, extract: failed IPs with counts, successful logins after failures (compromise indicator), timeline of attack (timestamps), targeted usernames. Output JSON report.",
    debug:`# Broken log analyzer
while read line; do
  ip=$(echo $line | grep -E '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')  # BUG: wrong extraction
  count[$ip]++       # BUG: bash doesn't have ++ on arrays like this
done < /var/log/auth.log
for ip in ${!count[@]}; do     # BUG: iterating array wrong
  echo $ip has ${count[$ip]} attempts
done`,
    analysis:"Take a real /var/log/auth.log (or generate synthetic). Count: unique attacking IPs, total failed attempts, success/fail ratio per IP, most targeted usernames. One pipeline, no intermediate files.",
    usecase:"SOC Tier 1 first-look tool. Runs in < 5 seconds on 100MB log file. Feeds into SIEM as enrichment. Detects brute-force patterns.",
    red:"Attackers use similar pipelines to find successful auth events in captured logs, identify valid usernames from 'invalid user' messages, map network topology from log metadata.",
    blue:"Baseline analysis: run daily, alert on new attacking IPs or sudden frequency spike. Correlate with firewall logs for full picture.",
    detect:"Unusual log access: auditd watch on /var/log/auth.log. Parsing scripts running outside maintenance windows. Large file reads by non-root users.",
    mistakes:["Using cat | grep vs grep directly (UUOC)", "grep -P when -E suffices (performance)", "Not sorting before uniq -c (uniq only deduplicates adjacent lines)", "awk NR==FNR trick broken when first file is empty"],
    perf:"For 1GB+ logs: split into chunks, process in parallel with GNU parallel or xargs -P. awk is ~10x faster than Python for line-by-line processing. Avoid grep in loops (fork cost).",
    logging:"Log: analysis start/end time, lines processed, records extracted, threshold violations. Include file path and MD5 hash in log for chain-of-custody.",
    secure:"Never include raw log content in JSON output (may contain PII or credentials). Sanitise: truncate at 200 chars, strip potential injection characters.",
    lab:"Analyse 5 different log formats (Apache, nginx, auth.log, syslog, custom app log). Write a single script that auto-detects format and extracts IPs+timestamps.",
    project:"log_normaliser.sh: converts Apache/nginx/auth.log to ECS-compatible JSONL. Fields: @timestamp, source.ip, destination.port, http.request.method, event.outcome, user.name.",
    output:"100k line log normalised to JSONL in < 3 seconds. All fields correct. Feed into elasticsearch with curl -XPOST.",
    stretch:"Add --watch mode: tail -F the log file and process new lines in real-time, maintaining running frequency counts.",
    hw:"Write a one-liner that finds the top 10 user agents from an Apache access log, counts them, and sorts by frequency. Then write it as a clean readable script.",
    research:"How does awk's associative array compare to C++ std::unordered_map? What is the complexity of sort | uniq -c vs awk frequency counting for 10M lines?" },

  { day:5,  week:1,  month:1, lang:"BASH",       title:"File Integrity Monitor — Production Implementation",
    obj:"Build a production FIM using sha256sum, find, diff. Understand inode, mtime, ctime semantics.",
    tech:`Every file has an inode (struct inode in kernel): stores permissions, owner, size, timestamps.
mtime (modification time): updated when file DATA changes — changes on write().
ctime (change time): updated when METADATA changes — includes mtime changes AND chmod/chown.
atime (access time): updated on read() — often disabled with noatime mount option for performance.
sha256sum calls read() on the file in 8KB chunks and feeds to SHA-256 hash state (OpenSSL EVP_DigestUpdate).
inotify: kernel notifies via inotify_event struct when watched files change — eventfd, not polling.
FIM needs both: hash (detects content changes) + metadata (detects permission/ownership attacks).`,
    commands:["sha256sum -c checksums.sha256", "find / -newer reference_file -type f", "stat --format='%Y %n'", "inotifywait -m -r -e modify,create,delete /etc", "getfattr -n security.ima /bin/bash"],
    walkthrough:`FIM architecture:
1. build_baseline(): find all watched dirs, sha256sum each file, store path:hash:size:mtime:permissions in DB
2. check_integrity(): for each current file, recompute hash, compare to baseline
3. Alert types: MODIFIED (hash change), NEW_FILE (not in baseline), DELETED (in baseline but not on disk), PERMISSION_CHANGE (same hash, different metadata)
4. Persist baseline in SQLite for fast querying
5. Deploy as systemd timer every 5 minutes`,
    scratch:"fim.sh: complete implementation with: baseline|check|report|diff commands. SQLite backend. JSON alert output. systemd timer deployment script. Exclusion patterns.",
    debug:`# Broken FIM
BASELINE=/tmp/baseline.txt   # BUG 1: world-writable, attacker can modify
sha256sum /etc/* > $BASELINE  # BUG 2: /etc/* doesn't recurse, misses subdirs
while read hash file; do      # BUG 3: wrong IFS — sha256sum uses 2 spaces
  current=$(sha256sum $file)  # BUG 4: unquoted $file — breaks on spaces in paths
  if [ $hash != $current ]; then  # BUG 5: comparing hash vs "hash  filename"
    echo "CHANGED: $file"
  fi
done < $BASELINE`,
    analysis:"Study AIDE (Advanced Intrusion Detection Environment): its config format, what it monitors, how it handles large filesystems. Compare its approach to your bash FIM.",
    usecase:"PCI-DSS, HIPAA compliance requirements. Detect rootkit installation (binary replacement). Detect ransomware (mass file modification). Detect webshell drops.",
    red:"Attackers modify /etc/passwd, /etc/sudoers, /etc/cron.d, /usr/bin/* for persistence. FIM bypasses: modify baseline file, operate below inode level (direct disk write via /dev/sda), use LD_PRELOAD to fake hash.",
    blue:"FIM alerts on: binary replacement, config modification, new SUID files, new cron entries, new systemd units. Baseline must be stored offline or cryptographically signed.",
    detect:"Deploy FIM with baseline on read-only mount or remote server. Alert on: FIM process killed, baseline file access (attacker reading it), large number of simultaneous changes.",
    mistakes:["Storing baseline in watched directory", "Not excluding /proc, /sys, /dev (huge noise)", "sha256sum of binary files opened exclusively = file locked = miss", "Not checking file permissions — attacker sets immutable bit"],
    perf:"Full /etc sha256sum: 300 files, ~0.1s. Full /usr/bin: 2000 files, ~2s. Full filesystem: use find with -prune for efficiency. Parallel hashing: find -print0 | xargs -P4 sha256sum.",
    logging:"Each check: log start time, files checked count, changes found, alert details. Separate: audit trail log (append-only, mode 0444) vs operational log.",
    secure:"Baseline stored with mode 0400, root ownership. FIM binary itself monitored by separate FIM instance. Tripwire-style signed DB for production.",
    lab:"Deploy fim.sh on your Ubuntu system. Establish baseline. Make 5 changes: modify /etc/hosts, add file to /etc/cron.d, chmod /usr/bin/ls, create new file in /bin, touch /etc/sudoers. Verify all 5 detected.",
    project:"fim_daemon.py: Python FIM with SQLite, systemd service, Slack alerting, exclusion rules in YAML config. Handles 100k files. Parallel hashing with ThreadPoolExecutor.",
    output:"FIM detects all 5 changes within 5-minute check interval. JSON alerts sent to Slack. HTML report generated on demand.",
    stretch:"Add IMA (Integrity Measurement Architecture) integration: compare FIM hashes against kernel's IMA measurements from /sys/kernel/security/ima/ascii_runtime_measurements.",
    hw:"Research how Tripwire works: its database format, signing mechanism, policy language. Compare to your bash FIM. What would it take to harden your FIM to Tripwire's level?",
    research:"How does the Linux kernel's IMA (Integrity Measurement Architecture) work? How does Secure Boot use it? How do rootkits bypass IMA without a kernel module?" },

  { day:6,  week:1,  month:1, lang:"BASH",       title:"Network Recon Automation & Port Scanner",
    obj:"Build parallel network scanner from first principles. Understand TCP connect scan at kernel level.",
    tech:`TCP connect scan: open() a socket, connect() triggers SYN→SYN-ACK→ACK (3-way handshake).
connect() is non-blocking with O_NONBLOCK: returns EINPROGRESS immediately, use select()/poll() to wait.
In bash, /dev/tcp/host/port is a bash built-in: bash calls socket()+connect() internally.
Parallel scanning: each host/port check is a separate bash background job (fork+exec overhead ~5ms each).
xargs -P N: launches N processes simultaneously, recycling slots as they complete.
timeout command: internally uses SIGALRM or fork()+sleep()+kill() depending on implementation.
Banner grabbing: after connect, send \\r\\n, recv() response — same as IOCTLS get_tcp_info in C.`,
    commands:["/dev/tcp/host/port", "nc -zv -w2 host port", "timeout 1 bash -c 'echo >/dev/tcp/host/port'", "nmap -oX - | xmlstarlet sel -t", "masscan --rate 1000", "xargs -P50 -I{} bash -c '...'"],
    walkthrough:`port_scanner.sh:
1. Parse CIDR or IP range into list of targets
2. For each target: background job → iterate ports
3. Each port check: timeout 1 bash -c 'echo > /dev/tcp/$host/$port 2>/dev/null'
4. Banner grab on open ports: send \\r\\n, read response
5. Job limiting: max N concurrent jobs using job_count tracking
6. Output: CSV + JSON with: IP, port, state, banner, timestamp`,
    scratch:"network_sweep.sh: accepts subnet (192.168.1.0/24), port list (22,80,443,3389 or range), timeout, max-parallel. Outputs JSON. Includes banner grab for top 20 services.",
    debug:`# Race condition + injection bug
scan_host() {
  host=$1
  for port in $PORTS; do                         # BUG 1: word splitting on $PORTS
    result=$(nc -zv $host $port 2>&1)            # BUG 2: command injection via $host
    if echo $result | grep -q "succeeded"; then  # BUG 3: echo $result — unquoted
      echo "$host:$port open"
    fi
  done
}
export -f scan_host
cat targets.txt | xargs -P50 scan_host           # BUG 4: -I{} missing — wrong arg passing`,
    analysis:"Capture your scanner's traffic with tcpdump. Observe: SYN packets, RST responses (closed), SYN-ACK (open), ICMP unreachable (filtered). Map packet flow to your script logic.",
    usecase:"Pentest recon, network asset inventory, compliance scanning, cloud security posture management. Every security team runs network scans.",
    red:"Attackers scan for: SSH (22), RDP (3389), SMB (445), WinRM (5985), MSSQL (1433), Oracle (1521). Fast scanning triggers IDS. Slow scanning evades rate-based detection.",
    blue:"Detect internal scanning: Sysmon Event 3 (network connections from unexpected processes), firewall connection logs (many-to-one or one-to-many patterns), Zeek/Suricata signatures.",
    detect:"IDS rule: >10 SYN packets to >5 different ports from single source in 10s = scan. Alert on: TCP SYN without corresponding established session (half-open), unusual source ports.",
    mistakes:["No rate limiting — triggers IDS and DoS on target", "Not handling SIGPIPE on closed connections", "Banner grab timeout too short for slow services", "Scanning broadcast addresses"],
    perf:"50 parallel jobs × 1s timeout = scan /24 in ~5s for 1 port. 1000 ports × /24 = 5min with 50 parallel. Bash fork overhead limits to ~500 jobs/s. Python/Go 10x faster for large scans.",
    logging:"Log: scan parameters, total hosts, total ports, open ports found, duration, rate (ports/sec). Never log: targets in cleartext if scan is sensitive.",
    secure:"Never scan without authorisation. Rate-limit to avoid DoS. Use --source-port 53 or similar to appear as DNS traffic (but don't — it's deceptive). Log your own scanning for audit.",
    lab:"Scan your own VM network (192.168.x.0/24). Compare results with nmap. Verify your scanner catches all ports nmap finds. Benchmark: how fast vs nmap -T4?",
    project:"scanner_pro.sh: add service fingerprinting database (SSH version parse, HTTP server header, SMB dialect), CVE hint lookup, HTML report generation.",
    output:"Scans /24 in < 30s for top 100 ports. HTML report with sortable results. JSON output for SIEM ingestion. Accuracy > 95% vs nmap comparison.",
    stretch:"Add UDP scanning (ICMP unreachable = closed, timeout = open|filtered). Add OS fingerprinting hints from TTL values.",
    hw:"Study nmap's TCP scan types: SYN, FIN, Xmas, NULL, ACK, Window scans. Understand what each reveals and why they evade different defences. Implement FIN scan in bash.",
    research:"How does stateful packet inspection in iptables/nftables detect port scans? What connection-tracking mechanisms are involved? How do SYN cookies relate to scanning?" },

  { day:7,  week:1,  month:1, lang:"BASH",       title:"Week 1 Synthesis — Auth Analyzer Production Tool",
    obj:"Combine all week 1 skills into a production-ready auth log analysis platform.",
    tech:`Auth log analysis combines: process spawning (grep pipeline), file I/O (/var/log/auth.log),
string processing (IP extraction, timestamp parsing), associative arrays (frequency counting),
signal handling (graceful shutdown), and structured output (JSON/HTML generation).
Production considerations: handle log rotation (tail -F not tail -f), large files (streaming vs loading),
concurrent access (log file may be written while reading), timezone normalisation (UTC timestamps),
and false positive reduction (exclude known-good IPs from allowlist).`,
    commands:["tail -F (follows rotation)", "logrotate integration", "journalctl --since", "last -F", "lastb -F", "faillock --user"],
    walkthrough:"Full auth_analyzer.sh implementation: streaming log reading, real-time frequency tracking, configurable thresholds, multiple alert types (brute force, cred stuffing, impossible travel), JSON + HTML output.",
    scratch:"Complete auth_analyzer.sh from scratch. Must handle: auth.log and /var/log/secure formats, compressed rotated logs (.gz), custom time windows, allowlists, multiple output formats.",
    debug:"Given a 50-line broken auth analyzer: find and fix all bugs. Categories: IFS handling, date parsing, file path handling, output formatting, threshold logic, missing cleanup.",
    analysis:"Take the auth_analyzer.sh you wrote today. Profile it with: time, strace (system call count), and test with a 500MB log file. Identify bottlenecks. Optimise.",
    usecase:"Daily SOC report. Feeds into SIEM as enriched event stream. Compliance evidence. Incident timeline reconstruction.",
    red:"Sophisticated attackers stagger login attempts across time (slow brute force), use distributed IPs (credential stuffing), and log in at normal business hours to blend in.",
    blue:"Multi-dimensional detection: frequency + velocity + time-of-day + source diversity. Single metric detection is easily evaded.",
    detect:"SIEM correlation: alert when SAME USER fails from 3+ different IPs in 1h (cred stuffing). Alert when SAME IP tries 10+ different users (password spray).",
    mistakes:["Analysing only recent lines — attacker may operate over days", "Not correlating success after failures", "Missing IPv6 addresses in log parsing", "Timezone naive timestamps across log sources"],
    perf:"For 1GB auth.log: streaming approach < 10s. Loading full file into memory: may OOM on small systems. Use awk for single-pass analysis.",
    logging:"The analyzer itself must log: when it ran, which files processed, lines analysed, alerts generated. Store run history for trending.",
    secure:"Auth logs contain usernames and IPs — treat as sensitive. Output should be access-controlled. Don't log to world-readable /tmp.",
    lab:"Deploy auth_analyzer.sh as a cron job. Configure logrotate compatibility. Test with synthetic log entries. Verify alerts fire correctly.",
    project:"auth_platform/ directory: auth_analyzer.sh + config.yaml + alert templates + HTML report template + systemd service + installation script.",
    output:"Complete auth platform installed in < 2 minutes. Runs daily via cron. Generates HTML report. Sends Slack alert on critical findings.",
    stretch:"Add geolocation: query ip-api.com for country of attacking IP. Flag login attempts from countries never seen before for this user.",
    hw:"Research: what does the /var/log/btmp file contain? How does it differ from auth.log? How does 'lastb' read it? Write a parser for the binary btmp format.",
    research:"How does PAM (Pluggable Authentication Modules) work at the C library level? How does it write to auth.log? What information could be hidden by a PAM backdoor?" },

  // MONTH 1 — WEEK 2 (Python Security Foundations)
  { day:8,  week:2,  month:1, lang:"PYTHON",     title:"Python Tool Architecture — CLI, Logging, Config",
    obj:"Design professional security tool architecture using Python idioms mapped from C++ experience.",
    tech:`Python's import system: when you 'import pefile', Python calls dlopen()-equivalent on the .so extension.
argparse builds an AST of argument rules and matches against sys.argv (analogous to getopt() in C).
logging module: uses a Logger hierarchy (root → named loggers). Each Logger has Handlers and Filters.
LogRecord objects are created on each log call — Handler.emit() formats and outputs them.
dataclass: decorator injects __init__, __repr__, __eq__ by inspecting __annotations__ — code generation at import time.
pathlib.Path: wraps os.path functions but returns Path objects instead of strings. / operator calls __truediv__.
type hints: stored in __annotations__ dict — ignored at runtime, used by mypy/pyright for static analysis.`,
    commands:["python3 -m cProfile script.py", "python3 -m trace --trace", "python3 -X dev (extra checks)", "python3 -c 'import pefile; print(pefile.__file__)'", "pip show --files package"],
    walkthrough:"security_tool.py template: argparse with subcommands, structured JSON logging, dataclass models, config from YAML+env+CLI (priority order), exit codes, cleanup context managers.",
    scratch:"Build scan_tool.py: --target, --ports, --format json|csv|table, --verbose, --config config.yaml, --output file. Professional help text. Validates all inputs. Proper exit codes.",
    debug:`import argparse, json

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('target')               # BUG 1: no type validation
    parser.add_argument('--ports', default=80)  # BUG 2: int not str — breaks '80,443'
    args = parser.parse_args()
    
    results = {'target': args.target, 'ports': args.ports}
    print(json.dumps(results))                  # BUG 3: no indent, not useful
    
if __name__ == '__main__':
    main()                                      # BUG 4: no try/except around main`,
    analysis:"Read the source of click (pip install click). Compare its decorator-based approach to argparse's imperative approach. What are the tradeoffs for security tool CLIs?",
    usecase:"Every tool in this curriculum uses this template. Consistent interface = composable tools = security automation pipelines.",
    red:"Attackers write quick scripts with no error handling. These fail unexpectedly, leave partial state, expose internal paths in tracebacks. Professional red teamers write reliable tools.",
    blue:"Detect tools by their arg patterns: '-p 1-1024', '--format json', '--target 192.168.'. These appear in command line logs (Sysmon Event 1, auditd execve).",
    detect:"Process command line analysis: flag tools using offensive patterns (--ports, --brute, --spray). Alert when new Python scripts execute with network-related args.",
    mistakes:["sys.exit() in library code (kills calling process)", "print() for errors instead of sys.stderr", "Mutable default arguments: def f(x=[]) is a Python gotcha", "Missing if __name__=='__main__' guard"],
    perf:"argparse.parse_args() is O(n) in arg count. For tools called millions of times, consider click or manual sys.argv. Dataclasses: instantiation ~3x slower than plain dict.",
    logging:"Use logging.getLogger(__name__) — never logging.basicConfig in library code. JSON formatter: python-json-logger package or custom. Include: script name, PID, hostname.",
    secure:"API keys: NEVER in sys.argv (visible in /proc/PID/cmdline). Use env vars or config file with 600 perms. Validate all input before use. No eval().",
    lab:"Set up ~/workspace/security-toolkit/ with: src/, tests/, config/, docs/ structure. pyproject.toml. Pre-commit hooks. CI/CD skeleton. Install in editable mode: pip install -e .",
    project:"security_toolkit/__main__.py: entry point with subcommands scan, analyze, extract, report. Each subcommand delegates to its module. Shared config and logging setup.",
    output:"python3 -m security_toolkit --help shows all subcommands. Each subcommand has --help. Config loaded from ~/.config/security-toolkit/config.yaml.",
    stretch:"Implement --output-schema flag that prints the JSON schema of the output format. Useful for SIEM integration documentation.",
    hw:"Read PEP 517 and understand how Python packaging works. Read the logging HOWTO in Python docs. Understand LogRecord attributes and when to use each.",
    research:"How does Python's GIL work? Why does it matter for threaded security tools? When does it hurt performance? When is it irrelevant? Compare to C++ threading." },

  { day:9,  week:2,  month:1, lang:"PYTHON",     title:"Sockets, TCP Internals & Async Port Scanner",
    obj:"Build production port scanner. Understand Python socket API mapped to POSIX socket() syscalls.",
    tech:`Python socket.socket() → socket(AF_INET, SOCK_STREAM, 0) syscall → returns fd.
connect() → kernel sends SYN, adds to syn_backlog, waits for SYN-ACK.
With O_NONBLOCK (socket.setblocking(False)): connect() returns EINPROGRESS immediately.
select()/poll()/epoll(): kernel waits for FD to become writable (= connect completed).
asyncio uses epoll on Linux: event loop calls epoll_wait() which returns ready FDs.
asyncio.open_connection() wraps: socket() + setblocking(False) + connect() + epoll registration.
ThreadPoolExecutor: thread pool. Each thread is a pthread with its own stack (8MB default).
For N=1000 ports: asyncio uses 1 thread + epoll (1000 fds). Threading uses 100 threads × 8MB = 800MB RAM.`,
    commands:["socket.create_connection((host,port), timeout)", "socket.setblocking(False)", "asyncio.open_connection()", "asyncio.wait_for(coro, timeout)", "concurrent.futures.ThreadPoolExecutor(max_workers=100)"],
    walkthrough:`Three implementations, benchmark all three:
1. Sequential: for each port: connect, record, next. O(n*timeout). 1000 ports × 1s = 1000s.
2. ThreadPoolExecutor: 100 workers. 1000 ports / 100 workers ≈ 10s. Limited by GIL + thread overhead.
3. asyncio: single thread + epoll. 1000 ports in ~1s. Limited by connect() latency not CPU.`,
    scratch:"scanner.py: ScanResult dataclass, probe_port() async coroutine, scan() orchestrator with semaphore rate limiting, banner_grab() with timeout, service_id() lookup.",
    debug:`import socket
def scan_port(host, port):
    s = socket.socket()       # BUG 1: no timeout set
    s.connect((host, port))   # BUG 2: no exception handling — crashes on closed ports
    banner = s.recv(1024)     # BUG 3: recv blocks forever if no data
    s.close()                 # BUG 4: not closed on exception — resource leak
    return banner.decode()    # BUG 5: decode crashes on binary data`,
    analysis:"Read the asyncio source: how does the event loop call epoll? How does asyncio.sleep(0) yield control? Map asyncio concepts to C's select()/epoll_wait() equivalents.",
    usecase:"Asset discovery, pre-engagement recon, continuous compliance scanning, cloud security posture.",
    red:"Fast scanning triggers IDS. Async scanner: 65535 ports in < 5s. Throttle to avoid detection. Use source port randomisation and IP rotation.",
    blue:"Detect: Sysmon Event 3 (many connections from single process in short time). Zeek: connection.log with many dst_ports per source. Suricata: ET SCAN rules.",
    detect:"Statistical: source IP with >100 distinct dst_port in 60s = scanner. Alert on: SYN without established (nmap -sS), connection to common attack ports (22,445,3389).",
    mistakes:["Not closing sockets on exception (use context manager or try/finally)", "Semaphore too large → overwhelms target or network", "Not handling ECONNREFUSED vs ETIMEDOUT differently (different meaning)", "asyncio.gather() without return_exceptions=True — first exception kills all"],
    perf:"asyncio: 10,000 connections/second on fast network. ThreadPoolExecutor@100: ~500/s. Sequential: ~1/s. Memory: asyncio ~1KB per connection, threads ~8MB each.",
    logging:"Log: scan start/end, target, port range, rate, open ports found. Security: log scanning activity for your own audit trail.",
    secure:"Rate limit: asyncio.Semaphore(50). Validate target IP before scanning (prevent SSRF-like abuse). Implement auth if exposing scanner as API.",
    lab:"scanner.py: scan 192.168.1.0/24 top-1000 ports. Compare timing: sequential vs threading vs asyncio. Record: ports found, time, CPU%, memory usage.",
    project:"scanner_pro.py: + service fingerprinting database, + nmap XML output compatibility, + CIDR notation, + exclude lists, + rate limiting with token bucket algorithm.",
    output:"Scans /24 for top-100 ports in < 10s. Service fingerprints HTTP/SSH/FTP/SMB. JSON output matches nmap's schema.",
    stretch:"Implement a token bucket rate limiter class from scratch (no external library). Apply it to the scanner to enforce N connections/second exactly.",
    hw:"Read Stevens' 'Unix Network Programming' Chapter 4 on elementary sockets. Understand: socket(), bind(), connect(), listen(), accept() system calls. Map each to Python socket calls.",
    research:"How does TCP Fast Open (TFO) work and why does it matter for scanning? How do TCP SYN cookies prevent DoS? How does your async scanner interact with these?" },

  { day:10, week:2,  month:1, lang:"PYTHON",     title:"Regex, IOC Extraction & Threat Intelligence Enrichment",
    obj:"Build production IOC extractor. Understand Python regex internals and RE2 vs PCRE performance.",
    tech:`Python's re module uses a backtracking NFA (non-deterministic finite automaton).
re.compile() builds the NFA at compile time — O(n) where n = pattern complexity.
re.finditer() yields Match objects lazily — memory efficient for large files.
PCRE backtracking: catastrophic backtracking possible with (a+)+ on adversarial input.
re2 (Google) uses NFA without backtracking — O(n) time guarantee, no catastrophic cases.
For IOC extraction: IPv4 RFC-compliant regex is harder than it looks — 999.999.0.0 is invalid.
Entropy of strings: Shannon entropy H = -Σ p(x) log2(p(x)) — high entropy = random/encoded strings.
defaultdict(set) from collections: dict subclass, auto-creates missing keys with set() — O(1) add.`,
    commands:["re.compile(r'pattern', re.IGNORECASE|re.MULTILINE)", "re.finditer() (lazy)", "re.VERBOSE for readable complex patterns", "hashlib.sha256().hexdigest()", "collections.defaultdict(set)"],
    walkthrough:"ioc_extractor.py: RFC-compliant IP regex, FQDN regex, URL regex, MD5/SHA256/SHA1 regex, email regex, private IP filter, VT enrichment, TLP handling.",
    scratch:"Build ioc_pipeline.py: reads any file, extracts all IOC types, deduplicates, optionally enriches via VT API, outputs STIX-compatible JSON. Handle: binary files, encoding errors.",
    debug:`import re

PATTERNS = {
    'ip': r'\\d+\\.\\d+\\.\\d+\\.\\d+',              # BUG 1: matches 999.999.999.999
    'hash': r'[a-f0-9]+',                            # BUG 2: too broad — matches any hex
    'url': r'http://\\S+',                           # BUG 3: misses https and other schemes
}

def extract(text):
    results = {}
    for ioc_type, pattern in PATTERNS:              # BUG 4: dict.items() needed
        results[ioc_type] = re.findall(pattern, text)
    return results`,
    analysis:"Take a real threat intelligence PDF report. Run your extractor on it. Measure: precision (what fraction found are real IOCs?), recall (what fraction of real IOCs did you find?). Fix false positives.",
    usecase:"First tool run in every IR investigation. Feeds IOCs into MISP, blocklists, SIEM watchlists. Automated threat intel processing.",
    red:"Adversaries use domain generation algorithms to create thousands of C2 domains. Your extractor finds them. Attackers also embed IOCs in benign-looking files.",
    blue:"Automate: parse threat intel reports → extract IOCs → push to MISP → deploy to firewall. Reduce manual effort from hours to minutes.",
    detect:"Monitor: your extractor talking to VT API (legitimate but track quota). Large file reads for IOC scanning. Network connections to threat intel APIs.",
    mistakes:["Not deduplicating before API calls (wastes quota)", "Extracting private IPs as IOCs", "Not handling PDF binary correctly (use pdfminer)", "Missing Unicode domain names (IDN)"],
    perf:"finditer() vs findall(): finditer() is lazy (constant memory), findall() loads all results. For 1GB files, use mmap + finditer(). Pre-compile patterns outside loops.",
    logging:"Log: file processed, size, IOC counts per type, API calls made, errors. Don't log: actual IOC values in operational logs (may be sensitive).",
    secure:"File path validation before reading. Don't follow symlinks. Maximum file size limit. Timeout on network operations. Rate limit API calls.",
    lab:"Extract IOCs from 10 malware reports (PDF/HTML). Validate against known-good threat intel sources. Measure your extractor's precision and recall.",
    project:"ti_enricher.py: extract → deduplicate → check cache → query VT/AbuseIPDB → store in SQLite → output enriched JSON with reputation scores.",
    output:"Processes 100KB report in < 2s. VT enrichment with caching reduces API calls by 80%.",
    stretch:"Implement defang/refang: convert IOCs to defanged format (198.51[.]100[.]1) for safe sharing and reverse. Handle both in your extractor.",
    hw:"Study STIX 2.1 format for Indicators and Observables. Convert your IOC output to valid STIX JSON bundles.",
    research:"What is catastrophic regex backtracking? Find an example that causes it in Python's re module. How does the re2 library prevent it? Why does it matter for security tool reliability?" },

  { day:11, week:2,  month:1, lang:"PYTHON",     title:"subprocess, /proc Forensics & Process Analysis",
    obj:"Master subprocess module. Implement live /proc forensics equivalent to Volatility for live systems.",
    tech:`subprocess.run() → fork() + execve() + waitpid() sequence.
PIPE creates os.pipe() (two file descriptors). Parent reads from pipe, child writes to it.
Popen with communicate(): creates threads to read stdout/stderr avoiding deadlock.
shell=True: /bin/sh -c 'command' — introduces command injection risk.
shlex.split(): tokenises shell command string safely (handles quotes, escapes).
/proc/PID/mem: readable by root or process itself — same memory as the process sees.
ptrace(PTRACE_PEEKTEXT): reads process memory word-by-word — basis of debuggers/Volatility.
Reading /proc/PID/maps gives: vm_area_struct layout — text, data, heap, stack, mmap regions.`,
    commands:["subprocess.run(shlex.split(cmd), capture_output=True, text=True, timeout=10)", "os.readlink(f'/proc/{pid}/exe')", "Path(f'/proc/{pid}/cmdline').read_bytes()", "open(f'/proc/{pid}/mem','rb')"],
    walkthrough:"proc_forensics.py: enumerate all PIDs, parse status/maps/cmdline/exe/fd, flag: deleted executables, /tmp CWD, anonymous rwx regions, root shells, hidden network connections.",
    scratch:"process_hunter.py: enumerate processes, build parent-child tree, flag: shells spawned by web servers, processes injected into (anonymous rwx maps), processes with deleted executables.",
    debug:`import subprocess, os

def get_processes():
    output = subprocess.run('ps aux', shell=True, capture_output=True)  # BUG 1: shell=True + command injection risk
    processes = []
    for line in output.stdout.split('\\n'):   # BUG 2: stdout is bytes, not str without text=True
        pid = line.split()[0]                  # BUG 3: header line + empty lines crash this
        proc_path = f'/proc/{pid}/comm'
        name = open(proc_path).read()          # BUG 4: race — process may die between ps and open
        processes.append({'pid': pid, 'name': name})
    return processes`,
    analysis:"Compare your /proc forensics output against: ps aux, top, htop, lsof, netstat. For each tool, identify what /proc files it reads. Verify your script extracts same data.",
    usecase:"IR without external tools (compromised system). EDR agent internals. Live memory forensics. Process injection detection.",
    red:"Reading /proc without external tools avoids detection signatures on tool names (no 'ps' in command line). Fileless implants hide from ps because they inject into legitimate processes.",
    blue:"Process tree analysis: flag unusual parent-child chains. Anonymous rwx memory in processes that shouldn't have it. Processes with network connections that don't appear in netstat.",
    detect:"Compare /proc walk results against ps (DKOM detection). Monitor /proc/PID/mem access (ptrace calls via auditd). Alert: process with exe deleted AND network connections.",
    mistakes:["Not handling process death during iteration", "Assuming /proc/PID/cmdline is UTF-8 (it's raw bytes)", "Reading /proc/PID/mem without checking if readable", "Missing processes in containers (different namespaces)"],
    perf:"Iterating 1000 PIDs: ~50ms. Reading maps for each: ~200ms. For continuous monitoring, use fanotify or netlink events instead of polling.",
    logging:"Log: scan timestamp, PIDs scanned, flags found per PID, any read errors (process died). Include: scanner's own PID to exclude from results.",
    secure:"Running as root to read all /proc entries. Use minimum necessary capabilities. Don't log /proc/PID/mem contents — may contain credentials.",
    lab:"Run proc_forensics.py on your system. Find: all processes with network connections, all processes running from /tmp, all processes with anonymous executable memory.",
    project:"process_guardian.py: daemon that monitors /proc every 5s. Alerts on: new process with suspicious flags. Maintains whitelist of known-good processes. Logs to JSONL.",
    output:"Guardian detects simulated webshell (bash spawned by python3 -m http.server) within 5 seconds.",
    stretch:"Add memory scanning: for flagged processes, read /proc/PID/mem at rwx regions, scan with YARA rules for shellcode patterns.",
    hw:"Read 'The Internals of Processes' chapter in 'Linux Kernel Development' (Robert Love). Understand task_struct fields you're reading via /proc.",
    research:"How does Volatility 3 read process information from a memory dump? Compare its pslist plugin to reading /proc on a live system. What does each miss that the other can see?" },

  { day:12, week:2,  month:1, lang:"PYTHON",     title:"Threading, Concurrency & Race Conditions in Security Tools",
    obj:"Master Python concurrency models. Identify and fix race conditions in security scripts.",
    tech:`Python GIL: only one thread executes Python bytecode at a time. Threads release GIL during I/O.
For I/O-bound work (network, disk): threading is effective — threads run during each other's I/O.
For CPU-bound work (parsing, hashing): threading doesn't help (GIL). Use multiprocessing or asyncio+executor.
Race condition: TOCTOU (Time-Of-Check-Time-Of-Use) — check condition, something changes, use result.
threading.Lock(): mutex — one thread at a time. Lock.acquire() maps to pthread_mutex_lock().
threading.Event(): allows threads to wait for a condition without busy-waiting.
asyncio Semaphore: limits concurrent coroutines. asyncio.Semaphore(N) → max N running at once.
asyncio.gather() with return_exceptions=True: collects exceptions instead of propagating first one.`,
    commands:["threading.Lock()", "concurrent.futures.ThreadPoolExecutor()", "asyncio.Semaphore(N)", "asyncio.gather(*tasks, return_exceptions=True)", "threading.Event().wait(timeout=5)"],
    walkthrough:"Race condition demonstration: two threads write to same output file without lock → interleaved output. Fix with threading.Lock(). Show: lock contention impact on performance.",
    scratch:"parallel_enricher.py: enrich list of IOCs against VT API. Rate limit: 4 requests/min. Use: threading vs asyncio comparison. Measure: time, memory, correctness for 100 IOCs.",
    debug:`import threading, time

shared_count = 0

def increment():
    global shared_count
    for i in range(10000):
        shared_count += 1        # BUG: race condition — read+modify+write not atomic

threads = [threading.Thread(target=increment) for _ in range(10)]
for t in threads: t.start()
for t in threads: t.join()

print(shared_count)  # Expected 100000, actual: <100000 (race condition)`,
    analysis:"Study the asyncio event loop: asyncio.get_event_loop().__class__.__name__. Look at its _selector. How does it differ from callbacks in Node.js? How does it relate to C's select() loop?",
    usecase:"All network-heavy security tools need concurrency: port scanners, IOC enrichers, log analyzers, API consumers. Wrong concurrency model = bugs or poor performance.",
    red:"Race conditions in security tools can be exploited: TOCTOU in file creation, check-then-use in auth flows. Attackers specifically look for concurrent request handling bugs.",
    blue:"Threading bugs cause data corruption in SIEM pipeline outputs: duplicate alerts, missing alerts, interleaved JSON. Use locks around all shared state.",
    detect:"Concurrent tool execution: many network connections from same process. asyncio tools have distinctive poll/epoll syscall patterns vs threaded tools.",
    mistakes:["Sharing mutable state without lock (classic race)", "Lock held too long (performance)", "Deadlock: two locks acquired in different orders by different threads", "asyncio blocking calls inside coroutines (blocks entire event loop)"],
    perf:"ThreadPoolExecutor I/O bound: linear speedup to ~50-100 workers. Beyond that: diminishing returns. asyncio: better for 1000+ concurrent connections with low CPU per request.",
    logging:"Log thread/task name in every log entry: threading.current_thread().name. Helps debug race conditions in logs.",
    secure:"Thread-safe logging: use logging module (it uses a lock internally). Thread-safe file writes: use a queue + single writer thread pattern.",
    lab:"Build a threaded FIM checker: scan 10,000 files in parallel. Verify results are correct (no missing files, no duplicates). Compare timing: 1, 4, 8, 16, 32 workers.",
    project:"async_ioc_pipeline.py: async pipeline with rate limiting, caching, retry-with-backoff, concurrent enrichment from multiple sources. Processes 1000 IOCs with accurate VT attribution.",
    output:"1000 IOCs enriched in < 5 minutes with 4/min rate limit per source. Zero duplicate API calls. Zero race conditions.",
    stretch:"Implement exponential backoff with jitter for API retries. Measure: average wait time, max wait time, total retry overhead for 429 responses.",
    hw:"Write a program that demonstrates a deadlock between two threads. Then fix it using lock ordering. Explain why lock ordering prevents deadlock (relates to Dining Philosophers problem).",
    research:"What is Python's GIL implementation? How did it change in Python 3.12 (per-interpreter GIL)? Why does it matter for security tools? What's the difference between GIL release points in C extensions vs pure Python?" },

  { day:13, week:2,  month:1, lang:"PYTHON",     title:"SQLite, Data Persistence & Security Tool State",
    obj:"Add persistent state to security tools. Build FIM with SQLite backend. Understand WAL mode.",
    tech:`SQLite: embedded SQL database. All data in a single .db file. No separate server process.
WAL (Write-Ahead Log) mode: writes go to WAL file first, then checkpoint to main file.
WAL allows concurrent reads with writes — critical for security tools running alongside log writers.
Python sqlite3 module: thin wrapper over C sqlite3 library. execute() → sqlite3_prepare_v2() + sqlite3_step().
Parameterised queries: sqlite3 binds values via sqlite3_bind_*() — prevents SQL injection at library level.
EXPLAIN QUERY PLAN: shows how SQLite executes a query — use for performance analysis.
FTS5: full-text search extension — useful for log searching without loading entire dataset.
Connection.isolation_level = None: autocommit mode — each statement is its own transaction.`,
    commands:["sqlite3.connect(':memory:')", "conn.execute('CREATE INDEX IF NOT EXISTS')", "conn.executemany(sql, [(1,),(2,)])", "EXPLAIN QUERY PLAN SELECT", "PRAGMA journal_mode=WAL", "PRAGMA foreign_keys=ON"],
    walkthrough:"fim_db.py: FIMDatabase class with: create_baseline(), check_integrity(), log_event(), query_events(), export_report(). Schema design: baseline + events + config tables.",
    scratch:"security_db.py: unified database for all security tools. Tables: iocs (with dedup), scan_results, fim_events, auth_events. Indexed for common queries. Migration system.",
    debug:`import sqlite3

conn = sqlite3.connect('security.db')
conn.execute('CREATE TABLE iocs (ip TEXT, seen INTEGER)')

# User input directly in SQL string — SQL INJECTION
ip = input("Enter IP: ")
conn.execute(f'INSERT INTO iocs VALUES ({ip}, 1)')   # BUG 1: f-string SQL injection

# Missing commit
conn.execute('INSERT INTO iocs VALUES (?, ?)', ('1.2.3.4', 1))
# BUG 2: no conn.commit() — data lost on close

conn.close()
conn.execute('SELECT * FROM iocs')  # BUG 3: using closed connection`,
    analysis:"Design the optimal schema for storing 10M IOCs with: IP, domain, MD5, SHA256, first_seen, last_seen, hit_count, sources[], tags[]. Consider: indexing, normalisation, query patterns.",
    usecase:"All production security tools need persistence: FIM baselines, scan history, IOC databases, alert tracking, configuration state.",
    red:"SQLite databases left in world-readable locations expose security tool configuration and collected intelligence. Attackers look for .db files.",
    blue:"Audit SQLite file permissions. Monitor access to security tool databases. Encrypt sensitive databases at rest using SQLCipher.",
    detect:"File access monitoring: unusual processes reading /var/lib/security/*.db. SQLite WAL file creation events.",
    mistakes:["f-string SQL injection (always use parameterised queries)", "Not committing transactions (data loss)", "Storing large blobs in SQLite (use file path reference instead)", "No index on frequently queried columns"],
    perf:"Bulk insert: executemany() × 10,000 rows with transaction: ~0.1s. Without transaction (autocommit): ~10s (1000× slower). WAL mode: concurrent reads don't block writes.",
    logging:"Database operations: log query type, table, row count, duration. Don't log query parameters (may contain IOCs or credentials).",
    secure:"Mode 600 on .db files. Parameterised queries everywhere. WAL files (.db-wal) contain recent writes — same sensitivity as main db. SQLCipher for encryption at rest.",
    lab:"Migrate your FIM from flat file to SQLite. Verify: all data preserved, queries faster, concurrent access works. Benchmark: 100k file baseline check time.",
    project:"ioc_database.py: SQLite-backed IOC store with: deduplication, TTL expiry, hit counting, tag system, full-text search, export to STIX/CSV.",
    output:"Store/retrieve 100k IOCs. Query by type in < 100ms. Concurrent read+write works without corruption.",
    stretch:"Implement database encryption using SQLCipher Python bindings. Benchmark: encrypted vs unencrypted performance for your typical queries.",
    hw:"Study SQLite's transaction isolation levels. Write a test that demonstrates dirty reads, phantom reads, and non-repeatable reads — then show how transactions prevent each.",
    research:"How does SQLite's B-tree implementation compare to PostgreSQL's? When would you choose PostgreSQL over SQLite for a security tool? What are the operational differences?" },

  { day:14, week:2,  month:1, lang:"PYTHON",     title:"Week 2 Synthesis — Complete Security Toolkit v1",
    obj:"Integrate all week 2 components into a cohesive, deployable security toolkit.",
    tech:"Architecture review: CLI → config loader → logging setup → security_toolkit modules (scan, extract, fim, analyze). Shared library (seclib.py): validation, hashing, formatting, DB access.",
    commands:["pip install -e . (editable install)", "python -m pytest tests/ -v --cov", "pre-commit install", "git tag v0.1.0"],
    walkthrough:"security_toolkit v0.1: scan (async port scanner), extract (IOC extractor), fim (file integrity), analyze (log analyzer). Shared config, logging, SQLite DB.",
    scratch:"Wire all modules together. Ensure: config flows to all modules, logging is consistent, database is shared, CLI is intuitive. Add integration tests.",
    debug:"Given the combined toolkit: find 5 integration bugs (modules stepping on each other's config, shared DB locking, logging format inconsistencies).",
    analysis:"Code review your own week 2 code. Use bandit for security issues, pylint for quality, mypy for type errors. Fix all HIGH severity findings.",
    usecase:"This is the foundation of your professional portfolio. Deploy it, show it to employers, extend it throughout Month 2-3.",
    red:"Professional red teamers maintain toolkits exactly like this. The difference: red team tools are designed to evade detection. Your toolkit leaves logs — that's good.",
    blue:"Your toolkit IS a detection tool. FIM + log analyzer + process monitor = lightweight EDR.",
    detect:"Your own toolkit: audit log of all actions taken. Cryptographically sign outputs for chain of custody.",
    mistakes:["Circular imports between modules", "Global state shared between tests", "Missing cleanup in integration tests (files, DB entries)", "Hardcoded paths that don't work cross-platform"],
    perf:"Profile the full toolkit on a real workload: 500 hosts scan + 10k IOC extract + 100k FIM check. Identify the slowest module. Optimise it.",
    logging:"Unified logging configuration: one log file per run, JSON format, includes: tool name, version, user, PID, session ID.",
    secure:"Run bandit, safety check, and semgrep on complete codebase before tagging v0.1. Fix all findings.",
    lab:"Deploy v0.1 to a clean VM. Run full integration test: scan LAN, extract IOCs from 5 threat reports, check FIM baseline, analyze auth log. All in one command.",
    project:"security_toolkit v0.1 GitHub release: README, installation guide, example config, sample output, CI/CD (GitHub Actions).",
    output:"v0.1 tagged on GitHub. CI passes. Installs cleanly on fresh Ubuntu. All commands documented.",
    stretch:"Add Docker support: Dockerfile + docker-compose.yml. Run entire toolkit in container with volume-mounted config and output.",
    hw:"Write a 1-page architecture document for your toolkit: component diagram, data flow, deployment options, security considerations.",
    research:"Study how commercial security tools (CrowdStrike, SentinelOne) architect their agent software. What components exist? How do they communicate? How do they deploy?" },

  // MONTH 1 — WEEK 3 (PowerShell + Advanced Patterns)
  { day:15, week:3,  month:1, lang:"POWERSHELL",  title:"PowerShell Architecture & Windows Security Scripting",
    obj:"Understand PowerShell's .NET runtime foundation. Build Windows security automation from first principles.",
    tech:`PowerShell runs on .NET CLR (Common Language Runtime). Scripts compile to CIL (Common Intermediate Language).
Each cmdlet is a .NET class inheriting from PSCmdlet. Pipeline: objects not text (unlike Unix pipes).
WMI (Windows Management Instrumentation): COM-based interface to Windows management data.
Get-WinEvent → EvtQuery() Win32 API → queries Windows Event Log ETW channels.
AMSI (Antimalware Scan Interface): PowerShell sends script content to AMSI before execution.
ETW (Event Tracing for Windows): PowerShell logs to Microsoft-Windows-PowerShell/Operational.
Constrained Language Mode: limits .NET access, prevents type instantiation, reduces attack surface.
PowerShell Remoting: WinRM (HTTP/5985, HTTPS/5986) + WS-Management protocol.`,
    commands:["[CmdletBinding()]", "Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625}", "Get-Process | Select-Object -Property Id,Name,CPU", "Invoke-Command -ComputerName server", "$env:COMPUTERNAME", "Get-ItemProperty 'HKLM:\\Software\\...'"],
    walkthrough:"security_auditor.ps1: enumerate: running processes, network connections, scheduled tasks, services, registry run keys, local admins, password policy. Output structured objects.",
    scratch:"windows_baseline.ps1: snapshot system state (processes, ports, services, startup items). Compare two snapshots. Report differences.",
    debug:`# Broken PS script
param($ComputerName)
$procs = Get-Process -ComputerName $ComputerName  # BUG 1: no -ErrorAction
foreach($proc in $procs) {
    if($proc.Name = "cmd") {                       # BUG 2: assignment not comparison
        Write-Host "Found: " $proc.Id              # BUG 3: not using -f or string interp
    }
}`,
    analysis:"Examine your own PowerShell session: $PSVersionTable, Get-PSProvider, Get-PSDrive. Understand: HKLMi: is the registry as a drive. Understand how PS maps Windows APIs to cmdlets.",
    usecase:"Windows IR, Active Directory auditing, Group Policy analysis, compliance checking, SIEM log collection.",
    red:"PowerShell is the most abused LOLBin. Attackers use: -EncodedCommand, -ExecutionPolicy Bypass, IEX(IWR), DownloadString. AMSI bypass techniques target PS scripting engine.",
    blue:"ScriptBlock logging (Event 4104): captures entire script content even if obfuscated. Module logging (4103): logs parameter values. Transcription: logs all PS input/output to file.",
    detect:"Event 4104 with: base64 strings, IEX, DownloadString, unusual cmdlets. AMSI: real-time content scanning. Constrained Language Mode: prevents most attack techniques.",
    mistakes:["Not setting -ErrorAction Stop (errors silently ignored)", "Using Write-Host (can't be captured by pipeline)", "String comparison with = instead of -eq", "Not using [CmdletBinding()] for proper error handling"],
    perf:"Get-WinEvent with FilterHashtable: faster than Where-Object (provider-level filter). Avoid Get-WmiObject (deprecated) — use Get-CimInstance (faster CIM over WS-MAN).",
    logging:"PowerShell transcript logging: Start-Transcript -Path $log -Append. ScriptBlock logging via GPO: HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell.",
    secure:"Never store credentials in PS scripts. Use -Credential with Get-Credential dialog. For automation: Windows Credential Manager or managed identity. Never: $password = 'plaintext'.",
    lab:"Enable: ScriptBlock logging, Module logging, Transcription. Run your security auditor. Examine the generated logs in Event Viewer. Find your own script's execution trace.",
    project:"windows_audit.ps1: full audit script. Checks: firewall, AV status, patching, local admins, password policy, persistence locations, network exposure. Generates HTML report.",
    output:"Audit runs without errors on Windows 10/2019. HTML report shows compliance score. All findings categorised by severity.",
    stretch:"Add Active Directory checks if domain-joined: privileged group members, stale accounts, kerberoastable SPNs, unconstrainted delegation.",
    hw:"Read about ETW (Event Tracing for Windows): providers, sessions, consumers. Understand how PowerShell writes to ETW. How does Sysmon subscribe to ETW events?",
    research:"How does AMSI work? What does the PowerShell engine send to AMSI? How are common AMSI bypasses detected? What does 'AMSI patching' mean technically (PatchGuard context)?" },

  // Skip ahead to show month boundaries
  { day:28, week:4,  month:1, lang:"ALL",         title:"Month 1 Capstone — Security Toolkit v1.0",
    obj:"Deploy complete security toolkit v1.0. All 6 tools working, tested, documented, deployed.",
    tech:"Full-stack integration: Bash scripts + Python modules + PowerShell scripts sharing: config format (YAML), output format (JSON/ECS), logging format (JSON with standard fields), SQLite database.",
    commands:["docker build -t security-toolkit .", "systemctl enable --now security-toolkit-fim.timer", "pytest tests/ --cov=security_toolkit --cov-report=html", "git push origin v1.0"],
    walkthrough:"security_toolkit v1.0 architecture: Data flow from collection (bash agents) → normalisation (Python) → storage (SQLite) → analysis (Python) → alerting (webhook) → reporting (HTML/JSON).",
    scratch:"Write the complete integration script: orchestrates all 6 tools, handles errors, logs everything, generates unified daily report.",
    debug:"End-to-end integration test: run all tools. Find and fix 3 integration bugs introduced deliberately.",
    analysis:"Security review of your own codebase: run bandit, safety, semgrep. Document every finding. Fix HIGH/CRITICAL. Document MEDIUM as known technical debt.",
    usecase:"Your portfolio piece. Demonstrates: security knowledge, engineering skills, production practices.",
    red:"Review your tools from attacker perspective: what could be abused? What leaves no traces? What could be used for lateral movement if placed on a compromised system?",
    blue:"Your toolkit IS a blue team tool. How would you deploy it in a 100-host enterprise? 1000 hosts? What changes?",
    detect:"How does your own toolkit appear in Windows/Linux audit logs? Write detection rules for your own tools (know thy tools).",
    mistakes:["Missing CI/CD → no quality gates", "No Docker → hard to deploy consistently", "No tests → can't refactor safely", "No docs → useless to anyone else"],
    perf:"Full toolkit run time: FIM (100k files) + scan (254 hosts) + log analysis (100MB log) should complete in < 5 minutes.",
    logging:"Unified log format across all tools. Single daily log file. JSON format. Searchable. Suitable for SIEM ingestion.",
    secure:"Final security review: no hardcoded secrets, proper file permissions, no eval, no shell=True without validation.",
    lab:"Deploy v1.0 on fresh Ubuntu VM. No manual steps — fully automated install. Run complete integration test.",
    project:"v1.0 release on GitHub: tag, changelog, Docker image, installation one-liner, CI badge.",
    output:"github.com/username/security-toolkit has: green CI, Docker image, README with screenshots, one-line install.",
    stretch:"Deploy to cloud: AWS/GCP free tier. Terraform to provision VM. Ansible to deploy toolkit. GitHub Actions to test on every push.",
    hw:"Write a 2-page security architecture document for your toolkit: threat model, attack surface, security controls, monitoring strategy.",
    research:"Research how commercial security tools (Carbon Black, Elastic Security) deploy their agents. What are the architectural patterns? How do they handle: telemetry volume, false positives, evasion?" },

  // MONTH 2 sample days
  { day:29, week:5,  month:2, lang:"PYTHON",     title:"SIGMA Rules — Writing, Testing & Automation",
    obj:"Master SIGMA rule writing. Build automated SIGMA pipeline: write → validate → test → convert → deploy.",
    tech:`SIGMA: generic signature format for log-based detections. Compiled to backend-specific queries.
SIGMA rule = YAML with: title, description, logsource (category/product/service), detection, condition.
logsource maps to: log channels (Windows Event Log channel names), index patterns (Elastic), sourcetypes (Splunk).
Detection block: named groups (selection/filter) combined with boolean condition: selection and not filter.
Field modifiers: |contains, |startswith, |endswith, |re, |contains|all, |windash.
pySigma: Python library for SIGMA rule parsing, validation, and backend conversion.
SigmaDetectionItem: Python object representing one detection condition.
Conversion pipeline: SigmaRule → SigmaCollection → Backend.convert() → query string.`,
    commands:["sigma check rule.yml", "sigma convert -t splunk rule.yml", "sigma convert -t elasticsearch-eql rule.yml", "pip install pySigma pySigma-backend-splunk"],
    walkthrough:`sigma_engine.py:
1. Load SIGMA rule YAML → pySigma SigmaCollection object
2. Validate: required fields, valid logsource, valid condition syntax
3. Convert to multiple backends: Splunk, ELK, KQL
4. Test against sample log data (positive + negative cases)
5. Report: conversion success, test pass rate, false positive estimate`,
    scratch:"sigma_generator.py: given a TTP description ('detect PowerShell downloading files'), generate SIGMA YAML template with: correct logsource, detection patterns, filter stubs, metadata.",
    debug:`# Broken SIGMA rule
title: PS Download
logsource:
  product: windows    # BUG 1: missing category (should be process_creation)
detection:
  selection:
    CommandLine: '*DownloadString*'   # BUG 2: needs contains modifier: CommandLine|contains
  condition: selection                # BUG 3: no filter for legitimate use (SCCM etc)
level: medium         # BUG 4: this is high severity — misclassified`,
    analysis:"Take 5 rules from SigmaHQ/sigma repository. For each: understand the detection logic, identify what it would catch, what it would miss, what would cause false positives.",
    usecase:"Detection engineering core deliverable. Write once, deploy to all SIEMs. Community sharing. Detection-as-code in CI/CD.",
    red:"Understanding SIGMA rules = understanding what detections exist. Red teamers study SIGMA rules to avoid triggering them. Every evasion technique corresponds to a detection gap.",
    blue:"SIGMA is the language of detection engineering. Write rules for every new TTP. Convert to your SIEM's native format. Track coverage vs ATT&CK.",
    detect:"SIGMA rules themselves: validate in CI/CD before deployment. Test against known-good baseline (FP count) and known-bad samples (TP count). Alert on rules with >5 FP/day.",
    mistakes:["Too broad conditions → alert fatigue", "Missing filter for legitimate tools", "Wrong logsource → rule never matches", "Condition logic errors (and vs or)", "Testing against same data used to write rule"],
    perf:"pySigma conversion: microseconds per rule. SIEM query performance depends on: index design, filter order, cardinality. Test converted queries against sample data.",
    logging:"Log: rule name, version, conversion backend, deployment timestamp, FP count, TP count. Track rule quality metrics over time.",
    secure:"SIGMA rules contain detection logic — treat as sensitive. Don't commit to public repos if they reveal security gaps. Sign rules with GPG for authenticity.",
    lab:"Write 10 SIGMA rules for common TTPs (use ATT&CK as guide). Test each against sample logs. Convert to Splunk SPL and ELK EQL. Deploy to your ELK stack.",
    project:"sigma_platform.py: SIGMA rule management system. Features: load from directory, validate all, test against log samples, convert to multiple backends, track coverage.",
    output:"10 rules pass validation and convert to all backends. Coverage report shows % of ATT&CK techniques covered.",
    stretch:"Build automated SIGMA rule generator from ATT&CK technique descriptions using Jinja2 templates + a curated field mapping library.",
    hw:"Study ATT&CK technique T1059.001 (PowerShell). Write 5 different SIGMA rules covering different aspects of PS abuse. Each should have different detection logic.",
    research:"How does Elastic Security (KSQL), Microsoft Sentinel (KQL), and Splunk differ in their detection rule capabilities? What can SIGMA express that each platform can't natively?" },

  { day:43, week:7,  month:2, lang:"PYTHON",     title:"PE Analysis & Malware Static Triage Automation",
    obj:"Build production PE analysis pipeline. Understand PE format at the bytes level.",
    tech:`PE (Portable Executable) format: MZ header → DOS stub → PE signature → COFF header → Optional header → Section headers → Sections.
MZ magic: 0x4D5A ('MZ'). PE signature: 0x50450000 ('PE\\0\\0') at offset given by e_lfanew field.
IMAGE_FILE_HEADER.Machine: 0x014C = x86, 0x8664 = x86-64, 0x01C0 = ARM.
Optional header: AddressOfEntryPoint (virtual address where execution begins), ImageBase, SectionAlignment.
Import Directory: list of DLL names + function names/ordinals the PE imports.
IMPHASH: MD5 of normalised import table — same malware family has same IMPHASH even when repacked.
Section entropy: packed/encrypted sections have entropy near 8.0 (theoretical max for random data).
Shannon entropy formula: H = -sum(p(x) * log2(p(x))) for each byte value x.`,
    commands:["pefile.PE(path)", "pe.FILE_HEADER.Machine", "pe.OPTIONAL_HEADER.AddressOfEntryPoint", "pe.get_imphash()", "pe.sections[i].get_entropy()", "pe.DIRECTORY_ENTRY_IMPORT"],
    walkthrough:"pe_analyzer.py: from MOD-03 with extensions: imports analysis, section entropy, IMPHASH, string extraction, suspicious indicator scoring, JSON report.",
    scratch:"malware_triage.py: input any file → identify type → if PE: full analysis → compute risk score → output structured report. Risk score based on: suspicious APIs, packer, entropy.",
    debug:`import pefile
pe = pefile.PE('sample.exe')

for section in pe.sections:
    print(section.Name + ': ' + section.get_entropy())  # BUG 1: bytes + str concat, entropy returns float not str

for entry in pe.DIRECTORY_ENTRY_IMPORT:
    for imp in entry.imports:
        print(imp.name)            # BUG 2: imp.name may be None (import by ordinal)
        if imp.name == 'VirtualAlloc':  # BUG 3: bytes vs str comparison
            print("SUSPICIOUS")`,
    analysis:"Take 3 malware samples from MalwareBazaar. Run pe_analyzer.py on each. Compare: IMPHASH (same family?), section entropy (packed?), suspicious imports (capability hints).",
    usecase:"Malware triage: classify sample in < 30s without executing it. Tier 1 SOC tool. Feeds into sandbox prioritisation.",
    red:"PE analysis is the first step malware analysts take. Malware authors counter: packers (high entropy, few imports), import table obfuscation (LoadLibrary+GetProcAddress), header stomping.",
    blue:"IMPHASH clustering: group alerts by IMPHASH → same family → one investigation, not 10. Track new IMPHASHes not seen before → novel malware.",
    detect:"YARA rules based on: import combinations, section names, specific byte patterns at EntryPoint, IMPHASH matching known malware families.",
    mistakes:["Comparing bytes to str (pefile returns bytes for name fields)", "Assuming DIRECTORY_ENTRY_IMPORT exists (packed files often have none)", "Not handling corrupt PE files (pefile raises PEFormatError)", "Entropy threshold too low → false positives on compressed resources"],
    perf:"PE parsing: ~10ms per file. For batch triage of 1000 files: use ThreadPoolExecutor. IMPHASH computation: ~1ms. Full analysis: ~50ms including strings extraction.",
    logging:"Log: file path, hash, IMPHASH, risk score, flags, analysis duration. Include: analyst name, case ID if manual triage.",
    secure:"Never execute samples during static analysis. Run in a read-only mount if possible. Malware may exploit analysis tools (e.g., pefile bugs).",
    lab:"Run pe_analyzer.py on 10 samples from MalwareBazaar. Cluster by IMPHASH. Identify which samples are in the same family. Verify with VirusTotal.",
    project:"pe_triage_platform.py: batch analysis, IMPHASH clustering, family grouping, trend tracking via SQLite, daily digest report.",
    output:"Triage 100 samples in < 2 minutes. Cluster into families. Report: new families, new capabilities, IMPHASH trends.",
    stretch:"Add import table reconstruction for packed files: after packer stub identifies LoadLibrary call pattern, trace dynamic imports via emulation (using unicorn engine).",
    hw:"Read the PE format specification. Draw the PE structure for a sample binary using a hex editor (HxD or xxd). Identify each header field's bytes.",
    research:"How does process hollowing work at the PE level? What PE headers are modified? How does Volatility detect hollowed processes by comparing in-memory PE to on-disk PE?" },

  // MONTH 3 sample days
  { day:57, week:9,  month:3, lang:"PYTHON",     title:"Async Security Pipelines & High-Performance IOC Processing",
    obj:"Build production async pipeline. Process 10,000 IOCs/minute with rate limiting and error handling.",
    tech:`asyncio event loop: single-threaded coroutine scheduler. Uses epoll (Linux) / kqueue (macOS) / IOCP (Windows).
asyncio.Queue: async-safe queue for producer/consumer pipeline. maxsize limits backpressure.
asyncio.Semaphore: limits concurrent coroutines. Unlike threading.Semaphore, no OS thread overhead.
aiohttp ClientSession: maintains a connection pool (similar to requests.Session but async).
asyncio.gather() vs asyncio.as_completed(): gather waits for all, as_completed() yields as each finishes.
Token bucket algorithm: bucket with capacity C, fills at rate R tokens/sec. Each request consumes 1 token.
Exponential backoff with jitter: sleep = base * 2^attempt + random(0, base). Prevents thundering herd.
asyncio.TaskGroup (Python 3.11+): structured concurrency — cancel all tasks if one fails.`,
    commands:["asyncio.Queue(maxsize=100)", "asyncio.Semaphore(N)", "aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=50))", "asyncio.TaskGroup()", "asyncio.wait_for(coro, timeout=10)"],
    walkthrough:`async_ioc_pipeline.py:
Producer: reads IOC list, puts into queue
Worker pool: N coroutines pull from queue, enrich via API
Rate limiter: token bucket, shared across all workers
Cache: SQLite-backed TTL cache, async-safe with asyncio.Lock
Error handler: retry with backoff, dead letter queue for failures
Consumer: writes enriched IOCs to output JSONL`,
    scratch:"Build async_enricher.py from scratch: queue-based pipeline, configurable worker count, token bucket rate limiter, TTL cache, retry-with-backoff, progress bar.",
    debug:`import asyncio, aiohttp

async def enrich(session, ip):
    async with session.get(f'https://vt.com/api/v3/ip/{ip}',
                           headers={'x-apikey': VT_KEY}) as r:
        return await r.json()                # BUG 1: no error handling for 429/500

async def main():
    ips = ['1.1.1.1'] * 1000
    async with aiohttp.ClientSession() as session:
        tasks = [enrich(session, ip) for ip in ips]  # BUG 2: all 1000 fire simultaneously — rate limit violated
        results = await asyncio.gather(*tasks)        # BUG 3: no return_exceptions — first error kills all
    return results`,
    analysis:"Profile your async pipeline: use cProfile + asyncio-specific profiler. Identify: event loop blocking calls, task scheduling overhead, GC pressure from many short-lived objects.",
    usecase:"SOC automation at scale: 50,000 alerts/day, each needing enrichment. Manual enrichment: impossible. Sync enrichment: too slow. Async: < 1 hour for 50k IOCs.",
    red:"Async pipelines create interesting race conditions if not designed carefully. A compromised IOC enrichment service could inject false data into all enriched results.",
    blue:"Async pipelines improve MTTD (Mean Time To Detect) by eliminating enrichment bottlenecks. A pipeline that enriches in real-time vs batch reduces response time significantly.",
    detect:"Async tools are harder to correlate in logs (many concurrent operations, non-sequential). Ensure each request carries: session_id, request_id for correlation.",
    mistakes:["Blocking calls inside coroutines (time.sleep, not asyncio.sleep)", "Not closing aiohttp session → connection pool leak", "asyncio.gather without return_exceptions → one failure kills all", "Semaphore not properly scoped → deadlock"],
    perf:"With 50 workers + Semaphore(50): rate limited by API (4 req/min VT) not code. With 50 workers + Semaphore(4): 4 concurrent VT calls, others wait. Goal: fully utilise API quota.",
    logging:"Async logging: use asyncio-compatible logging handler. Log: task_id, ip, api_source, latency, result_code. Structured JSONL for pipeline visibility.",
    secure:"Async pipelines: validate all API responses before processing. A malicious VT-like server could inject malformed JSON to crash the pipeline. Timeout all operations.",
    lab:"async_ioc_pipeline.py: process 1000 IOCs against VT (with real key) or mock server. Measure: throughput (IOCs/min), error rate, cache hit rate.",
    project:"soc_enrichment_engine.py: production-ready async enrichment. Multiple sources: VT, AbuseIPDB, Shodan. Priority queue (critical alerts first). Dead letter queue for retries.",
    output:"1000 IOCs enriched respecting all rate limits. Progress bar. Summary: hit rate, new malicious IPs found, latency stats.",
    stretch:"Implement adaptive rate limiting: if 429 responses increase, slow down; if 0 429s for 60s, speed up. Use a PID controller approach.",
    hw:"Study the asyncio documentation on 'Timeouts and cancellation'. Understand: CancelledError, shield(), timeout(). Write examples of each.",
    research:"How does aiohttp's connection pool work? How does it compare to requests.Session's pool? What happens when the pool is exhausted? How do you size it correctly?" },

  // Days 71-90 — Capstone weeks
  { day:71, week:11, month:3, lang:"ALL",         title:"CAPSTONE WEEK 1 — SENTRY Core Infrastructure",
    obj:"Build SENTRY log collection layer and normalisation pipeline. All agents running, events flowing.",
    tech:"System architecture: agents (bash/PS) → normalisation (Python/ECS) → queue (asyncio Queue) → detection engine → SQLite storage → API → dashboard. Each component independently deployable.",
    commands:["docker-compose up -d", "systemctl enable sentry-agent", "pytest tests/integration/ -v", "curl http://localhost:8000/health"],
    walkthrough:"SENTRY architecture deep-dive: component diagram, data flow diagram, failure modes, scaling strategy. Implement: syslog_agent.sh, windows_agent.ps1, normaliser.py.",
    scratch:"normaliser.py: ECS-compliant normalisation of: auth.log, syslog, Windows Security events, Sysmon events, Apache access logs. Single output schema.",
    debug:"End-to-end: agent → normaliser → storage. Find and fix data flow bugs: missing fields, timestamp parsing, encoding errors.",
    analysis:"Review ECS (Elastic Common Schema) field definitions for: source.ip, process.name, event.action, user.name. Validate your normaliser maps correctly.",
    usecase:"Every SIEM starts with collection and normalisation. Getting this right determines the quality of every downstream detection.",
    red:"Log normalisation bugs create blind spots. If auth.log IPs aren't parsed correctly, brute force detection fails. Test adversarially.",
    blue:"Collection completeness: if an agent misses events, detections won't fire. Build: agent health monitoring, gap detection, alert on missing heartbeats.",
    detect:"Monitor your own pipeline: event count per source per minute. Alert on: drop to zero (agent down), spike (attack), unusual source (new host).",
    mistakes:["Normalisation schema drift across agent versions", "Timestamp timezone issues (all should be UTC)", "Dropping events on parse error vs logging and continuing"],
    perf:"Normalisation throughput: target 10,000 events/second per CPU core. Profile with realistic log volume (1GB/hour is common in enterprise).",
    logging:"Pipeline telemetry: events_received, events_normalised, events_failed, normalisation_latency_p99. Expose as Prometheus metrics.",
    secure:"Agents: run as non-root where possible. Log paths: read-only access. Network: agents should authenticate to collector. TLS for all transport.",
    lab:"Deploy SENTRY collection layer: 2 Linux agents + 1 Windows agent + normaliser. Verify events flow correctly. Measure: latency from log write to normalised event.",
    project:"SENTRY v0.1: collection layer. GitHub repo with: agents, normaliser, Docker Compose, unit tests.",
    output:"Events flow from 3 sources to unified JSONL stream. 100% field coverage for all event types. < 500ms normalisation latency.",
    stretch:"Add schema validation: validate every normalised event against ECS JSON schema. Log schema violations for schema drift detection.",
    hw:"Read ECS specification for process and network event categories. Understand all mandatory and optional fields. Map your normaliser to ECS.",
    research:"How does Logstash perform normalisation at scale? What is its architecture? When would you use Logstash vs a custom Python normaliser?" },

  { day:84, week:12, month:3, lang:"PYTHON+ALL",  title:"CAPSTONE WEEK 2 — Detection Engine + REST API",
    obj:"Integrate detection engine, YARA scanner, anomaly detector into SENTRY. Build REST API.",
    tech:"Detection engine: SIGMA runner (pySigma) + YARA scanner (yara-python) + statistical anomaly detector (scipy/numpy) + ML classifier (scikit-learn). API: FastAPI + Pydantic + JWT auth.",
    commands:["uvicorn sentry.api:app --reload", "yara.compile(filepaths={'rules': 'rules/'})", "from sklearn.ensemble import IsolationForest", "httpx.AsyncClient() for API testing"],
    walkthrough:"SENTRY detection engine: ingest normalised events → apply SIGMA rules → YARA scan files → anomaly score → risk calculation → alert generation.",
    scratch:"detection_engine.py: modular detection: sigmaRunner, yaraScanner, anomalyDetector. Each as independent class. Pluggable. Alert aggregation.",
    debug:"Integration: normalised events → detection engine. Find: events not triggering expected rules, YARA not receiving file paths, anomaly baseline not loaded.",
    analysis:"Review detection accuracy: run 20 attack simulations. For each: did detection fire? How quickly? What was the alert quality?",
    usecase:"Production SOC: every event goes through detection in near-real-time. Quality of detection = quality of security.",
    red:"Study detection gaps: what attacks bypass your SIGMA rules? What techniques have no coverage? This IS the red team's target list.",
    blue:"Build coverage map: ATT&CK Navigator heatmap of your SIGMA rules. Identify: uncovered techniques = detection gaps.",
    detect:"Your detection engine: detect when it's turned off, when rules change, when alert volume drops unexpectedly.",
    mistakes:["Detection engine becoming a bottleneck (must be async)", "SIGMA rules not tested → silent failures", "Alert deduplication removing true positives"],
    perf:"Detection throughput: > 10,000 events/second per core. YARA: pre-compile rules once, not per file. Anomaly: async, doesn't block main pipeline.",
    logging:"Detection decisions: log event_id, rule_id, result, confidence, duration. Essential for detection quality metrics.",
    secure:"Detection rules are security config — treat as sensitive. Sign rules. Validate integrity on load. Alert on rule file changes.",
    lab:"SENTRY: detection engine processing live events. Run 10 attack simulations. Verify alerts fire within 5 seconds.",
    project:"SENTRY v0.2: detection engine + FastAPI REST API. Endpoints: POST /events, GET /alerts, GET /stats, POST /rules.",
    output:"REST API running. Detection firing on test attacks. Alerts accessible via API. Basic dashboard served.",
    stretch:"Add WebSocket endpoint: push alerts to connected dashboard in real-time. Implement SSE (Server-Sent Events) as fallback.",
    hw:"Design the database schema for SENTRY's alert store: handle deduplication, correlation, investigation state, assignment.",
    research:"How do commercial SIEMs implement detection at scale? What is stream processing vs batch processing for security events? Look at Flink, Kafka Streams, Spark Streaming." },

  { day:90, week:13, month:3, lang:"ALL",         title:"CAPSTONE COMPLETE — SENTRY v1.0 Production Release",
    obj:"SENTRY fully deployed, documented, tested, CI/CD running. Present as enterprise-grade portfolio project.",
    tech:"Full platform: agents → normalisation → detection → enrichment → API → dashboard. Docker Compose for local, Kubernetes manifests for production. GitHub Actions CI/CD. MkDocs documentation.",
    commands:["docker-compose -f docker-compose.prod.yml up -d", "kubectl apply -f k8s/", "mkdocs gh-deploy", "pytest --cov=sentry --cov-report=html tests/"],
    walkthrough:"SENTRY v1.0 complete walkthrough: show every component working. Demonstrate: attack simulation → detection → alert → investigation → remediation.",
    scratch:"Final integration: run complete end-to-end test. Document: 5 attack scenarios, expected detection, actual detection, latency.",
    debug:"Production deployment: find and fix 3 issues that only appear in production (load, concurrent access, timezone handling).",
    analysis:"Compare SENTRY to commercial products (Elastic SIEM, Splunk ES). What does SENTRY do well? What is missing? What would it take to make it production-ready for 10,000 hosts?",
    usecase:"Portfolio demonstration: shows you can build enterprise security tooling. Job interviews: walk through the architecture and design decisions.",
    red:"Attack your own platform: find detection gaps, performance issues, security vulnerabilities. Document them. This shows security mindset.",
    blue:"SENTRY in production: what's the operational burden? Tuning, maintenance, false positives. How does it scale?",
    detect:"Meta-detection: SENTRY monitoring itself. Alert on: pipeline failures, detection engine slowdown, storage filling up.",
    mistakes:["Shipping without documentation (useless to others)", "No CI/CD (can't maintain quality)", "No tests (can't refactor)", "No monitoring (can't operate)"],
    perf:"Final performance benchmarks: events/sec, alert latency, API response time, storage growth rate. Meets requirements?",
    logging:"Operational runbook: how to: restart failed component, add new detection rule, investigate a specific alert, scale out.",
    secure:"Final security review: penetration test your own REST API. Check: auth bypass, SSRF, injection, information disclosure.",
    lab:"Full demo: start from empty system, deploy SENTRY, run 5 attack scenarios, show all detections fire, generate investigation report.",
    project:"SENTRY v1.0 GitHub release: Docker images, documentation site, demo video, architecture docs.",
    output:"Public GitHub repository. CI badge green. Docker Compose one-liner deployment. 5-minute demo video. MkDocs site deployed.",
    stretch:"Write a 2000-word technical blog post about SENTRY: architecture decisions, challenges, lessons learned. Publish on LinkedIn or Medium.",
    hw:"Present SENTRY to someone (colleague, mentor, interview). Explain every design decision. Answer: why did you choose X over Y?",
    research:"Research one production security platform (Elastic Security, Chronicle, Splunk SIEM). Write a 1-page comparison: SENTRY vs chosen product. Be honest about SENTRY's limitations." },
];

// ── Projects reference ──
const PROJECTS = [
  { num:1,  name:"Port Scanner",               lang:"Python+Bash", week:2,  status:"Foundation",  desc:"Async TCP connect scanner with banner grabbing, service fingerprinting, JSON/CSV output" },
  { num:2,  name:"IOC Extractor",              lang:"Python",      week:2,  status:"Foundation",  desc:"RFC-compliant IOC extraction from any format, VT enrichment, STIX output" },
  { num:3,  name:"Log Analyzer",               lang:"Bash+Python", week:1,  status:"Foundation",  desc:"Multi-format log normaliser, brute-force detection, HTML+JSON report" },
  { num:4,  name:"File Integrity Monitor",     lang:"Bash+Python", week:2,  status:"Foundation",  desc:"SHA-256 baseline, SQLite backend, inotify real-time, systemd deployment" },
  { num:5,  name:"Process Monitor",            lang:"Bash+Python", week:2,  status:"Foundation",  desc:"/proc-based forensics, rootkit detection hints, suspicious flag analysis" },
  { num:6,  name:"Threat Intel Enricher",      lang:"Python",      week:5,  status:"Intermediate",desc:"Multi-source async enrichment (VT, AbuseIPDB, MISP), TTL cache, STIX output" },
  { num:7,  name:"SIGMA Rule Platform",        lang:"Python",      week:5,  status:"Intermediate",desc:"Rule writer, validator, multi-backend converter, test framework, coverage map" },
  { num:8,  name:"Detection Pipeline",         lang:"Python",      week:8,  status:"Intermediate",desc:"SIGMA + YARA + stats anomaly, ELK integration, alert deduplication" },
  { num:9,  name:"Recon Automation Suite",     lang:"Python+Bash", week:6,  status:"Intermediate",desc:"OSINT: CT logs, DNS enum, WHOIS. Active: scan + service enum + CVE hints" },
  { num:10, name:"Persistence Hunter",         lang:"PS+Python",   week:5,  status:"Intermediate",desc:"Windows/Linux persistence enumeration, WMI events, cron, Run keys, services" },
  { num:11, name:"Malware Triage Tool",        lang:"Python",      week:7,  status:"Intermediate",desc:"PE analysis + YARA + capa + strings, risk scoring, family clustering" },
  { num:12, name:"PE Analyzer",                lang:"Python",      week:7,  status:"Advanced",    desc:"pefile-based analysis, entropy, IMPHASH, import analysis, packer detection" },
  { num:13, name:"YARA Automation Tool",       lang:"Python",      week:7,  status:"Advanced",    desc:"Rule testing framework, TP/FP measurement, batch scanning, ATT&CK mapping" },
  { num:14, name:"PCAP Analyzer",              lang:"Python",      week:6,  status:"Advanced",    desc:"Scapy-based analysis, IOC extraction, beaconing detection, C2 identification" },
  { num:15, name:"Async IOC Platform",         lang:"Python",      week:9,  status:"Advanced",    desc:"10k IOCs/min, rate limiting, multiple sources, priority queue, dead letter" },
  { num:16, name:"Detection-as-Code Platform", lang:"Python",      week:8,  status:"Advanced",    desc:"Git-backed rules, CI/CD, automated FP testing, ATT&CK heatmap generation" },
  { num:17, name:"Security Toolkit REST API",  lang:"Python",      week:9,  status:"Advanced",    desc:"FastAPI, JWT auth, rate limiting, OpenAPI docs, Prometheus metrics" },
  { num:18, name:"EDR-style Monitoring Agent", lang:"Bash+Python", week:10, status:"Advanced",    desc:"Process monitoring, network analysis, file system events, alert generation" },
  { num:19, name:"ATT&CK Heatmap Generator",   lang:"Python",      week:8,  status:"Advanced",    desc:"SIGMA rule coverage → ATT&CK Navigator JSON, gap analysis, trend tracking" },
  { num:20, name:"SENTRY SOC Platform",        lang:"ALL",         week:13, status:"Capstone",    desc:"Full platform: collection → normalisation → detection → enrichment → API → dashboard" },
];

/* ── UI ── */
function CodeSnip({ code, lang }) {
  const lc = {BASH:C.cyan,PYTHON:C.green,POWERSHELL:C.purple,ALL:C.blue,"PYTHON+BASH":C.amber,"PS+Python":C.purple}[lang]||C.blue;
  return (
    <pre style={{background:"#020810",border:`1px solid ${C.border}`,borderLeft:`3px solid ${lc}`,borderRadius:3,
      padding:"10px 12px",color:lc,fontSize:10,fontFamily:"'Fira Code','Courier New',monospace",
      whiteSpace:"pre-wrap",wordBreak:"break-word",margin:"8px 0",lineHeight:1.6}}>
      {code}
    </pre>
  );
}

function DayDetail({ d }) {
  const [openSection, setOpenSection] = useState(null);
  const langC = {BASH:C.cyan,PYTHON:C.green,"PYTHON+BASH":C.amber,POWERSHELL:C.purple,ALL:C.blue}[d.lang]||C.blue;

  const sections = [
    {id:"tech",    label:"Technical Deep Dive",     content:d.tech,      color:C.cyan},
    {id:"cmd",     label:"Core Commands",            content:d.commands?.join("\n"), color:C.green},
    {id:"walk",    label:"Script Walkthrough",       content:d.walkthrough, color:C.blue},
    {id:"scratch", label:"Write From Scratch",       content:d.scratch,   color:C.amber},
    {id:"debug",   label:"Debugging Exercise",       content:d.debug,     color:C.red},
    {id:"analysis",label:"Script Analysis",          content:d.analysis,  color:C.purple},
    {id:"usecase", label:"Security Use Case",        content:d.usecase,   color:C.cyan},
    {id:"red",     label:"Red Team Perspective",     content:d.red,       color:C.red},
    {id:"blue",    label:"Blue Team Perspective",    content:d.blue,      color:C.blue},
    {id:"detect",  label:"Detection Opportunities",  content:d.detect,    color:C.green},
    {id:"mistakes",label:"Common Mistakes",          content:Array.isArray(d.mistakes)?d.mistakes.join("\n• "):d.mistakes, color:C.orange},
    {id:"perf",    label:"Performance Considerations",content:d.perf,     color:C.purple},
    {id:"logging", label:"Logging Considerations",   content:d.logging,   color:C.amber},
    {id:"secure",  label:"Secure Coding Practices",  content:d.secure,    color:C.red},
    {id:"lab",     label:"Hands-On Lab",             content:d.lab,       color:C.green},
    {id:"project", label:"Mini Project",             content:d.project,   color:C.blue},
    {id:"output",  label:"Expected Output",          content:d.output,    color:C.cyan},
    {id:"stretch", label:"Stretch Goal",             content:d.stretch,   color:C.purple},
    {id:"hw",      label:"Homework",                 content:d.hw,        color:C.amber},
    {id:"research",label:"Research Task",            content:d.research,  color:C.pink},
  ];

  return (
    <div style={{marginTop:12}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
        {[
          {label:"OBJECTIVE", text:d.obj, color:langC},
        ].map((item,i)=>(
          <div key={i} style={{gridColumn:"1/-1",border:`1px solid ${item.color}33`,borderRadius:3,padding:"8px 12px",background:item.color+"08"}}>
            <div style={{color:item.color,fontSize:8,letterSpacing:"0.12em",marginBottom:3}}>{item.label}</div>
            <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
        {sections.map((s,i)=>(
          s.content && (
            <div key={s.id}
              style={{border:`1px solid ${openSection===s.id?s.color+"55":C.border}`,borderRadius:3,
                gridColumn: openSection===s.id?"1/-1":"auto"}}>
              <div onClick={()=>setOpenSection(openSection===s.id?null:s.id)}
                style={{padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                  background:openSection===s.id?s.color+"0a":C.bg2}}>
                <span style={{fontSize:8,background:s.color+"22",color:s.color,padding:"1px 5px",borderRadius:2,minWidth:20,textAlign:"center"}}>{i+1}</span>
                <span style={{color:openSection===s.id?s.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{s.label}</span>
              </div>
              {openSection===s.id&&(
                <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
                  {s.id==="debug"||s.id==="cmd"?
                    <CodeSnip code={s.content} lang={d.lang}/> :
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{s.content?.replace(/^• /gm,'')}</div>
                  }
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function DayCard({ d, compact=false }) {
  const [open, setOpen] = useState(false);
  const langC = {BASH:C.cyan,PYTHON:C.green,"PYTHON+BASH":C.amber,POWERSHELL:C.purple,ALL:C.blue,"PYTHON+ALL":C.purple}[d.lang]||C.blue;
  return (
    <div style={{border:`1px solid ${open?langC+"44":C.border}`,borderRadius:4,marginBottom:5}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:open?langC+"08":C.bg2}}>
        <span style={{background:langC+"22",color:langC,fontSize:8,padding:"1px 6px",borderRadius:2,minWidth:60,textAlign:"center",fontFamily:"'Courier New',monospace",fontWeight:700}}>{d.lang}</span>
        <span style={{color:"#1a4060",fontSize:9,minWidth:40,fontFamily:"'Courier New',monospace"}}>DAY {d.day}</span>
        <span style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",flex:1}}>{d.title}</span>
        <span style={{color:C.dim,fontSize:10}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<DayDetail d={d}/>}
    </div>
  );
}

export default function Curriculum() {
  const [tab, setTab] = useState("overview");
  const [activeMonth, setActiveMonth] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);

  const TABS = [
    {id:"overview",   label:"OVERVIEW",    icon:"📊"},
    {id:"daily",      label:"DAILY PLAN",  icon:"📅"},
    {id:"projects",   label:"20 PROJECTS", icon:"🔨"},
    {id:"capstone",   label:"CAPSTONE",    icon:"🏆"},
    {id:"debug",      label:"DEBUG DRILLS",icon:"🐛"},
    {id:"resources",  label:"RESOURCES",   icon:"📚"},
  ];

  const monthDays = DAYS.filter(d=>d.month===activeMonth);
  const weekDays  = DAYS.filter(d=>d.week===activeWeek);
  const weeksInMonth = [...new Set(DAYS.filter(d=>d.month===activeMonth).map(d=>d.week))];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,20,40,0.05) 3px,rgba(0,20,40,0.05) 4px)"}}>

      {/* HEADER */}
      <div style={{background:"#000",borderBottom:`2px solid ${C.blue}44`,padding:"12px 22px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.blue+"22",border:`1px solid ${C.blue}66`,borderRadius:4,padding:"5px 12px",color:C.blue,fontSize:14,fontWeight:700,letterSpacing:"0.15em"}}>90D</div>
        <div>
          <div style={{color:C.bright,fontSize:14,fontWeight:700,letterSpacing:"0.08em"}}>ENTERPRISE SECURITY SCRIPTING CURRICULUM</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.12em",marginTop:1}}>BASH · PYTHON · POWERSHELL · 22-COMPONENT DAILY FORMAT · 20 PROJECTS · CAPSTONE PLATFORM</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:12}}>
          {MONTHS.map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:m.color}}/>
              <span style={{color:m.color,fontSize:8,letterSpacing:"0.08em"}}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#000",borderBottom:`1px solid ${C.border}`,display:"flex",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?C.bg3:"transparent",border:"none",
            borderBottom:tab===t.id?`2px solid ${C.blue}`:"2px solid transparent",
            borderTop:"2px solid transparent",
            color:tab===t.id?C.blue:"#1a3a50",
            padding:"10px 16px",cursor:"pointer",fontSize:10,letterSpacing:"0.07em",
            fontFamily:"'Courier New',monospace",fontWeight:700,display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:"22px 26px",overflowY:"auto",background:C.bg}}>

        {/* ── OVERVIEW ── */}
        {tab==="overview"&&(
          <div>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:22}}>
              {[
                {label:"Days",         val:"90",      color:C.blue},
                {label:"Hours/Day",    val:"2-3",     color:C.cyan},
                {label:"Daily Items",  val:"22",      color:C.green},
                {label:"Projects",     val:"20",      color:C.amber},
                {label:"Languages",    val:"3",       color:C.purple},
                {label:"Tools Built",  val:"50+",     color:C.red},
              ].map((s,i)=>(
                <div key={i} style={{border:`1px solid ${s.color}33`,borderRadius:4,padding:"10px",background:s.color+"08",textAlign:"center"}}>
                  <div style={{color:s.color,fontSize:20,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{s.val}</div>
                  <div style={{color:C.dim,fontSize:9,marginTop:2,letterSpacing:"0.08em"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 22 daily components */}
            <div style={{border:`1px solid ${C.border}`,borderRadius:5,marginBottom:18,overflow:"hidden"}}>
              <div style={{background:C.bg3,padding:"8px 14px",color:C.blue,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>22 MANDATORY DAILY COMPONENTS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",background:C.bg}}>
                {D22.map((item,i)=>(
                  <div key={i} style={{padding:"6px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:C.blue+"22",color:C.blue,fontSize:9,padding:"1px 5px",borderRadius:2,minWidth:22,textAlign:"center",fontFamily:"'Courier New',monospace"}}>{i+1}</span>
                    <span style={{color:C.dim,fontSize:10}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Months */}
            {MONTHS.map(m=>(
              <div key={m.id} style={{border:`1px solid ${m.color}44`,borderRadius:5,marginBottom:12}}>
                <div style={{background:m.color+"11",padding:"10px 16px",borderBottom:`1px solid ${m.color}22`,display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{background:m.color+"22",color:m.color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>{m.label}</span>
                  <div>
                    <div style={{color:C.bright,fontSize:13,fontFamily:"'Courier New',monospace",fontWeight:700}}>{m.title}</div>
                    <div style={{color:C.dim,fontSize:10,marginTop:2}}>{m.goal}</div>
                  </div>
                </div>
                <div style={{padding:"12px 16px",background:C.bg}}>
                  <div style={{color:m.color,fontSize:9,letterSpacing:"0.1em",marginBottom:6}}>THEME</div>
                  <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:10,lineHeight:1.6}}>{m.theme}</div>
                  <div style={{color:m.color,fontSize:9,letterSpacing:"0.1em",marginBottom:6}}>DELIVERABLES</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {m.deliverables.map((d,i)=>(
                      <span key={i} style={{background:m.color+"11",color:m.color,fontSize:10,padding:"2px 8px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Daily schedule */}
            <div style={{border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
              <div style={{background:C.bg3,padding:"8px 14px",color:C.cyan,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>DAILY SCHEDULE (2–3 hours)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
                {[
                  {time:"30 min",task:"Review + concepts (tech explanation + commands)",color:C.cyan},
                  {time:"60 min",task:"Write-from-scratch + debugging exercise",color:C.green},
                  {time:"45 min",task:"Lab + mini project implementation",color:C.amber},
                  {time:"15 min",task:"Commit to git + homework + research",color:C.purple},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 12px",borderRight:i<3?`1px solid ${C.border}`:"none",background:i%2?C.bg2:C.bg}}>
                    <div style={{color:s.color,fontSize:12,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:4}}>{s.time}</div>
                    <div style={{color:C.dim,fontSize:11}}>{s.task}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DAILY PLAN ── */}
        {tab==="daily"&&(
          <div>
            {/* Month selector */}
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {MONTHS.map((m,i)=>(
                <button key={i} onClick={()=>{setActiveMonth(i+1);setActiveWeek(m.weeks[0]);}} style={{
                  background:activeMonth===i+1?m.color+"22":C.bg2,border:`1px solid ${activeMonth===i+1?m.color:C.border}`,
                  borderRadius:3,padding:"6px 14px",cursor:"pointer",
                  color:activeMonth===i+1?m.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",fontWeight:700}}>
                  {m.label}: {m.title}
                </button>
              ))}
            </div>

            {/* Week selector */}
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {weeksInMonth.map(w=>(
                <button key={w} onClick={()=>setActiveWeek(w)} style={{
                  background:activeWeek===w?C.blue+"22":C.bg2,border:`1px solid ${activeWeek===w?C.blue:C.border}`,
                  borderRadius:3,padding:"5px 12px",cursor:"pointer",
                  color:activeWeek===w?C.blue:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>
                  WEEK {w}
                </button>
              ))}
            </div>

            {/* Days for selected week */}
            {weekDays.length > 0 ? (
              weekDays.map(d=><DayCard key={d.day} d={d}/>)
            ) : (
              <div style={{padding:"24px",color:C.dim,fontSize:11,textAlign:"center",fontFamily:"'Courier New',monospace"}}>
                Select a week above to view daily plans. This curriculum includes {DAYS.length} detailed day entries.
                <br/><br/>Days shown: {DAYS.map(d=>d.day).sort((a,b)=>a-b).join(", ")}.
                <br/><br/>Full 90-day plan follows the progression shown in the Overview tab.
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab==="projects"&&(
          <div>
            <div style={{color:C.blue,fontSize:10,letterSpacing:"0.1em",marginBottom:14}}>20 MANDATORY PROJECTS — BUILD ALL OF THESE</div>
            <div style={{border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
              <div style={{background:C.bg3,display:"grid",gridTemplateColumns:"40px 1fr 90px 60px 80px",borderBottom:`1px solid ${C.border}`}}>
                {["#","PROJECT","LANG","WEEK","STATUS"].map((h,i)=>(
                  <div key={i} style={{padding:"7px 10px",color:C.blue,fontSize:9,letterSpacing:"0.1em",borderRight:i<4?`1px solid ${C.border}`:"none"}}>{h}</div>
                ))}
              </div>
              {PROJECTS.map((p,i)=>{
                const statusC = {Foundation:C.cyan,Intermediate:C.amber,Advanced:C.purple,Capstone:C.red}[p.status]||C.blue;
                return (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"40px 1fr 90px 60px 80px",background:i%2?C.bg2:C.bg,borderBottom:`1px solid ${C.border}`}}>
                    <div style={{padding:"8px 10px",color:C.blue,fontSize:10,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{p.num}</div>
                    <div style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`}}>
                      <div style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:2}}>{p.name}</div>
                      <div style={{color:C.dim,fontSize:10}}>{p.desc}</div>
                    </div>
                    <div style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center"}}>
                      <span style={{color:C.cyan,fontSize:9,fontFamily:"'Fira Code',monospace"}}>{p.lang}</span>
                    </div>
                    <div style={{padding:"8px 10px",color:C.amber,fontSize:10,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center"}}>W{p.week}</div>
                    <div style={{padding:"8px 10px",display:"flex",alignItems:"center"}}>
                      <span style={{background:statusC+"22",color:statusC,fontSize:8,padding:"1px 5px",borderRadius:2}}>{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CAPSTONE ── */}
        {tab==="capstone"&&(
          <div>
            <div style={{border:`1px solid ${C.amber}44`,borderRadius:5,marginBottom:16}}>
              <div style={{background:C.amber+"11",padding:"10px 16px",borderBottom:`1px solid ${C.amber}22`}}>
                <div style={{color:C.amber,fontSize:12,fontWeight:700,fontFamily:"'Courier New',monospace"}}>🏆 CAPSTONE: SENTRY — ENTERPRISE SECURITY INTELLIGENCE PLATFORM</div>
                <div style={{color:C.dim,fontSize:10,marginTop:3}}>Days 71-90 · 3 Weeks · Full Enterprise Platform</div>
              </div>
              <div style={{padding:"14px 16px",background:C.bg}}>
                <div style={{color:C.white,fontSize:12,fontFamily:"'Courier New',monospace",lineHeight:1.7,marginBottom:14}}>
                  Build a production-grade, modular security intelligence platform that simulates a real enterprise SOC environment. 
                  Every component is independently deployable, tested, documented, and monitored.
                </div>

                <div style={{color:C.blue,fontSize:9,letterSpacing:"0.12em",marginBottom:8}}>ARCHITECTURE</div>
                <CodeSnip lang="ALL" code={`SENTRY Platform Architecture:

┌─────────────────────────────────────────────────────────────────┐
│  DATA COLLECTION (Bash + PowerShell Agents)                      │
│  syslog_agent.sh  │  windows_agent.ps1  │  endpoint_agent.sh    │
└───────────────────┬─────────────────────────────────────────────┘
                    │ JSONL via syslog/HTTP
┌───────────────────▼─────────────────────────────────────────────┐
│  NORMALISATION (Python/ECS)                                      │
│  normaliser.py → ECS-compliant JSONL → asyncio.Queue            │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ DETECTION      │       │ STORAGE       │
│ SIGMA runner   │       │ SQLite (events│
│ YARA scanner   │       │ alerts, IOCs) │
│ Anomaly detect │       └───────┬───────┘
│ ML classifier  │               │
└───────┬───────┘               │
        │ alerts                 │
┌───────▼───────────────────────▼─────────────────────────────────┐
│  ENRICHMENT (Async Python)                                        │
│  VT + AbuseIPDB + MISP + Shodan  │  TTL Cache  │  Rate Limiter  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│  REST API (FastAPI)                                               │
│  POST /events  GET /alerts  POST /hunt  GET /stats  GET /docs   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│  DASHBOARD + IR AUTOMATION                                        │
│  Real-time alert feed  │  ATT&CK heatmap  │  Playbook runner    │
└─────────────────────────────────────────────────────────────────┘
                    │
        DEPLOYMENT: Docker Compose / Kubernetes
        CI/CD:      GitHub Actions
        DOCS:       MkDocs → GitHub Pages`}/>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
                  {[
                    {title:"WEEK 11 (Days 71-77)", color:C.blue, items:["Collection agents (Linux+Windows)","ECS normalisation pipeline","asyncio event queue","Unit tests for all components","Docker Compose skeleton"]},
                    {title:"WEEK 12 (Days 78-84)", color:C.amber, items:["Detection engine (SIGMA+YARA+anomaly)","Async enrichment pipeline","FastAPI REST API with JWT auth","Prometheus metrics + Grafana","Integration tests end-to-end"]},
                    {title:"WEEK 13 (Days 85-90)", color:C.purple, items:["IR automation playbooks","Web dashboard (real-time)","ATT&CK heatmap generator","GitHub Actions CI/CD","MkDocs documentation site","Demo video + blog post"]},
                    {title:"DELIVERABLES", color:C.green, items:["GitHub repo (public, clean history)","Docker one-liner deployment","CI badge green","MkDocs site deployed","5-minute demo video","Architecture documentation","Security review findings","Performance benchmarks"]},
                  ].map((s,i)=>(
                    <div key={i} style={{border:`1px solid ${s.color}33`,borderRadius:3,padding:"10px 12px",background:s.color+"08"}}>
                      <div style={{color:s.color,fontSize:10,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:7}}>{s.title}</div>
                      {s.items.map((item,j)=>(
                        <div key={j} style={{display:"flex",gap:6,marginBottom:3}}>
                          <span style={{color:s.color,fontSize:10}}>✓</span>
                          <span style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DEBUG DRILLS ── */}
        {tab==="debug"&&(
          <div>
            <div style={{color:C.red,fontSize:10,letterSpacing:"0.1em",marginBottom:14}}>DEBUG DRILLS — INTENTIONALLY BROKEN SCRIPTS TO FIX</div>
            {[
              { title:"Race Condition in Parallel Scanner", lang:"BASH", severity:"HIGH",
                desc:"This scanner has a race condition in shared file writes. Find it, explain why it causes data corruption, and fix it.",
                code:`#!/bin/bash
OUTFILE=/tmp/scan_results.txt
> $OUTFILE  # BUG: world-writable predictable path

scan_host() {
    local ip=$1
    ping -c1 -W1 $ip &>/dev/null && echo "$ip is alive" >> $OUTFILE  # RACE: multiple processes writing
}
export -f scan_host

seq 1 254 | xargs -P50 -I{} bash -c 'scan_host "192.168.1.{}"'  # BUG: wrong quoting
cat $OUTFILE | sort | uniq  # BUG: may read file before all writers finish`,
                fix:"Use mktemp for unique file per worker, collect results at end. Or use a named pipe with a single reader process." },

              { title:"SQL Injection in Security Tool", lang:"PYTHON", severity:"CRITICAL",
                desc:"This IOC database has SQL injection. Exploit it, then fix it using parameterised queries.",
                code:`import sqlite3

conn = sqlite3.connect('iocs.db')
conn.execute("CREATE TABLE IF NOT EXISTS iocs (ip TEXT, seen INTEGER)")

def lookup_ip(user_ip):
    # BUG: f-string SQL injection — user_ip = "' OR '1'='1" extracts all data
    query = f"SELECT * FROM iocs WHERE ip='{user_ip}'"
    return conn.execute(query).fetchall()

def insert_ip(user_ip):
    # BUG: same injection — user_ip = "x', 1); DROP TABLE iocs; --"
    conn.execute(f"INSERT INTO iocs VALUES ('{user_ip}', 1)")
    conn.commit()`,
                fix:"Always use parameterised queries: conn.execute('SELECT * FROM iocs WHERE ip=?', (user_ip,))" },

              { title:"TOCTOU File Integrity Check", lang:"PYTHON", severity:"HIGH",
                desc:"This FIM has a TOCTOU race. An attacker can modify a file between check and hash. Explain the attack, then fix it.",
                code:`import os, hashlib

def check_file(path, expected_hash):
    if not os.path.exists(path):          # CHECK
        return "MISSING"
    # -- ATTACKER MODIFIES FILE HERE --
    with open(path) as f:                 # USE: reads DIFFERENT file from check
        content = f.read()
    actual = hashlib.sha256(content.encode()).hexdigest()
    return "MATCH" if actual == expected_hash else "MISMATCH"`,
                fix:"Open file first, then check existence atomically. Use try/except around open() instead of exists() check." },

              { title:"Asyncio Blocking Call Bug", lang:"PYTHON", severity:"MEDIUM",
                desc:"This async scanner blocks the entire event loop. All 1000 scans complete sequentially instead of concurrently.",
                code:`import asyncio, socket, time

async def scan_port(host, port):
    s = socket.socket()
    s.settimeout(1)
    try:
        result = s.connect_ex((host, port))  # BUG: blocking syscall in async context
        return port, result == 0
    finally:
        s.close()

async def main():
    tasks = [scan_port('192.168.1.1', p) for p in range(1, 1001)]
    results = await asyncio.gather(*tasks)
    return [p for p,open in results if open]`,
                fix:"Use asyncio.open_connection() which is truly async, or wrap blocking call in loop.run_in_executor() to run in thread pool." },

              { title:"Command Injection via Shell=True", lang:"PYTHON", severity:"CRITICAL",
                desc:"This script allows OS command injection. Demonstrate the attack, then fix it without losing functionality.",
                code:`import subprocess, os

def scan_host(target):
    # BUG: target = '127.0.0.1; rm -rf /' executes arbitrary commands
    cmd = f"nmap -sn {target} 2>/dev/null"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

def get_file_hash(filepath):
    # BUG: filepath = '/etc/passwd; cat /etc/shadow > /tmp/stolen'
    output = subprocess.run(f'sha256sum {filepath}', shell=True, 
                           capture_output=True, text=True)
    return output.stdout.split()[0]`,
                fix:"Never use shell=True with user input. Use shell=False (default) with list args: subprocess.run(['nmap','-sn',target]). Validate target format before use." },

            ].map((drill,i)=>(
              <div key={i} style={{border:`1px solid ${C.red}33`,borderRadius:4,marginBottom:12}}>
                <div style={{background:C.red+"0a",padding:"8px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{background:C.red+"22",color:C.red,fontSize:8,padding:"2px 7px",borderRadius:2}}>{drill.severity}</span>
                  <span style={{background:({BASH:C.cyan,PYTHON:C.green}[drill.lang]||C.blue)+"22",color:({BASH:C.cyan,PYTHON:C.green}[drill.lang]||C.blue),fontSize:8,padding:"2px 7px",borderRadius:2}}>{drill.lang}</span>
                  <span style={{color:C.bright,fontSize:12,fontFamily:"'Courier New',monospace"}}>{drill.title}</span>
                </div>
                <div style={{padding:"12px 14px",background:C.bg}}>
                  <p style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:10,lineHeight:1.6}}>{drill.desc}</p>
                  <CodeSnip code={drill.code} lang={drill.lang}/>
                  <div style={{marginTop:10,padding:"8px 12px",background:"#001200",border:`1px solid ${C.green}33`,borderRadius:3}}>
                    <div style={{color:C.green,fontSize:9,letterSpacing:"0.1em",marginBottom:4}}>FIX APPROACH</div>
                    <div style={{color:"#88cc88",fontSize:11,fontFamily:"'Courier New',monospace"}}>{drill.fix}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RESOURCES ── */}
        {tab==="resources"&&(
          <div>
            {[
              { cat:"Books", color:C.blue, items:[
                ["The Linux Command Line","W. Shotts","Bash mastery from system perspective"],
                ["Python for Hackers","OccupyTheWeb","Security-focused Python with OS internals"],
                ["Black Hat Python 2nd Ed","Seitz/Arnold","Offensive Python tool development"],
                ["Practical Malware Analysis","Sikorski/Honig","Malware analysis + reverse engineering"],
                ["The Art of Memory Forensics","Ligh et al.","Volatility + memory forensics deep dive"],
                ["The Web Application Hacker's Handbook","Stuttard","Web attack scripting"],
                ["Linux Kernel Development","Robert Love","Internals you need for advanced scripting"],
              ]},
              { cat:"Labs & Platforms", color:C.green, items:[
                ["HackTheBox","htb.com","Red team scripting practice (authorised)"],
                ["Blue Team Labs Online","blueteamlabs.online","DFIR + log analysis + scripting"],
                ["CyberDefenders","cyberdefenders.org","Blue team CTF with scripting challenges"],
                ["OverTheWire","overthewire.org","Bash mastery through wargames"],
                ["TryHackMe","tryhackme.com","Guided scripting + security rooms"],
                ["MalwareBazaar","bazaar.abuse.ch","Real samples for analysis scripting"],
                ["FLARE-ON","fireeye.com/blog/threat-research","RE/malware scripting CTF"],
              ]},
              { cat:"References", color:C.amber, items:[
                ["MITRE ATT&CK","attack.mitre.org","TTP framework for detection scripting"],
                ["GTFOBins","gtfobins.github.io","LOLBin abuse reference"],
                ["LOLBAS","lolbas-project.github.io","Windows LOLBin reference"],
                ["SigmaHQ","github.com/SigmaHQ/sigma","Community SIGMA rules library"],
                ["Elastic ECS","www.elastic.co/guide/en/ecs","Log normalisation schema"],
                ["ExplainShell","explainshell.com","Bash command breakdown"],
                ["Regex101","regex101.com","Regex testing with explanation"],
              ]},
              { cat:"Tools to Master", color:C.purple, items:[
                ["pefile","pip install pefile","PE file parsing for malware analysis"],
                ["scapy","pip install scapy","Packet crafting and PCAP analysis"],
                ["Volatility 3","github.com/volatilityfoundation","Memory forensics automation"],
                ["capa","pip install flare-capa","Malware capability detection"],
                ["pySigma","pip install pySigma","SIGMA rule automation"],
                ["yara-python","pip install yara-python","YARA scanning in Python"],
                ["FastAPI","pip install fastapi uvicorn","REST API for security tools"],
              ]},
            ].map((section,si)=>(
              <div key={si} style={{marginBottom:16}}>
                <div style={{color:section.color,fontSize:10,letterSpacing:"0.12em",marginBottom:8}}>{section.cat}</div>
                <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                  {section.items.map((item,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:i%2?C.bg2:C.bg,borderBottom:i<section.items.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{padding:"7px 12px",color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{item[0]}</div>
                      <div style={{padding:"7px 12px",color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{item[1]}</div>
                      <div style={{padding:"7px 12px",color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{item[2]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 22px",display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim}}>
        <span>90-DAY ENTERPRISE SECURITY SCRIPTING CURRICULUM</span>
        <span style={{color:C.blue+"55"}}>22 COMPONENTS/DAY · 20 PROJECTS · CAPSTONE: SENTRY PLATFORM</span>
      </div>
    </div>
  );
}
