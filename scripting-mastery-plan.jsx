import { useState } from "react";

/* ═══════════════════════════════════════════════════════════
   90-DAY SECURITY SCRIPTING MASTERY PLAN
   Aesthetic: Electric blue / phosphor green industrial terminal
   ═══════════════════════════════════════════════════════════ */

const C = {
  bg:"#030508", bg2:"#060a10", bg3:"#0a1020",
  border:"#0a1a30", dim:"#2a4a6a", bright:"#aad4ff",
  blue:"#00aaff", blue2:"#0066cc", cyan:"#00ffcc",
  green:"#44ff88", amber:"#ffaa00", red:"#ff3355",
  purple:"#aa66ff", white:"#cce8ff",
};

const TOOLS = [
  { name:"Ubuntu 24.04", role:"Primary OS", icon:"🐧", color:C.amber },
  { name:"VS Code", role:"Editor + terminal", icon:"📝", color:C.blue },
  { name:"Python 3.11+", role:"Security automation", icon:"🐍", color:C.green },
  { name:"Bash 5.x", role:"Linux automation", icon:"💲", color:C.cyan },
  { name:"PowerShell 7", role:"Windows security", icon:"🪟", color:C.purple },
  { name:"Kali VM", role:"Red team tools", icon:"💀", color:C.red },
  { name:"Windows 10 VM", role:"Blue team/EDR lab", icon:"🖥", color:C.blue },
  { name:"Wireshark", role:"Network analysis", icon:"🦈", color:C.amber },
  { name:"Git + GitHub", role:"Version control", icon:"🔀", color:C.green },
  { name:"pefile/yara", role:"Malware analysis", icon:"🔬", color:C.purple },
];

const PLAN = {
  month1: {
    label:"MONTH 1", title:"Scripting Foundations", color:C.blue,
    weeks:[
      {
        week:1, title:"Bash Foundations", color:C.cyan,
        focus:"Master Bash syntax, control flow, and basic security automation",
        challenge:"Write a script that monitors /var/log/auth.log in real-time and prints coloured alerts for failed logins",
        days:[
          {
            day:1, lang:"BASH", title:"Shell Architecture & Script Anatomy",
            concept:"Shebang, strict mode (set -euo pipefail), variables, quoting, argument handling",
            task:"Write a hardened script template with strict mode, colour functions, usage(), and trap cleanup",
            lab:"Create hello_security.sh that accepts a target IP, validates it with regex, and prints a coloured report header",
            usecase:"Every production security script starts with this template — used in FIM, log parsers, incident response tools",
            output:"Validated, coloured script output with error handling. Script exits cleanly on bad input.",
            code:`#!/usr/bin/env bash
set -euo pipefail; IFS=$'\\n\\t'
readonly RED='\\033[0;31m' GREEN='\\033[0;32m' NC='\\033[0m'
log_ok()  { echo -e "${GREEN}[+]${NC} $*"; }
log_err() { echo -e "${RED}[-]${NC} $*" >&2; }
usage()   { echo "Usage: $0 <IP>"; exit 1; }
[[ $# -lt 1 ]] && usage
IP="${1:?IP required}"
[[ "$IP" =~ ^([0-9]{1,3}\\.){3}[0-9]{1,3}$ ]] || { log_err "Invalid IP: $IP"; exit 1; }
log_ok "Target validated: $IP"`
          },
          {
            day:2, lang:"BASH", title:"Variables, Arrays & String Manipulation",
            concept:"declare -a/-A/-r/-i, string operations (##, %%, //, ^^), parameter expansion",
            task:"Build an IP list manager: store IPs in indexed array, search, add, remove, print",
            lab:"ip_manager.sh — reads IPs from file, deduplicates, validates each, outputs sorted clean list",
            usecase:"IOC management — maintain blocklists, allowlists, and threat intel IP databases",
            output:"Clean sorted unique IP list with invalid entries flagged and removed",
            code:`declare -a IPS=()
declare -A SEEN=()
while IFS= read -r line; do
  ip=$(echo "$line" | tr -d '[:space:]')
  [[ -z "$ip" || -n "${SEEN[$ip]:-}" ]] && continue
  [[ "$ip" =~ ^([0-9]{1,3}\\.){3}[0-9]{1,3}$ ]] || { echo "INVALID: $ip"; continue; }
  SEEN[$ip]=1; IPS+=("$ip")
done < "$1"
printf '%s\\n' "${IPS[@]}" | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n`
          },
          {
            day:3, lang:"BASH", title:"Loops, Conditionals & File I/O",
            concept:"for/while/until, case, read loops, find, file tests (-f -d -x -r -s)",
            task:"Loop through /proc filesystem to list all running processes with PID, name, and user",
            lab:"proc_lister.sh — enumerate /proc/*/comm and /proc/*/status, format as table",
            usecase:"Live process forensics — quick triage of running processes without external tools",
            output:"PID | NAME | USER | PPID table of all running processes",
            code:`printf '%-8s %-20s %-15s %-8s\\n' PID NAME USER PPID
echo "──────────────────────────────────────────────────"
for d in /proc/[0-9]*/; do
  pid=$(basename "$d")
  name=$(cat "$d/comm" 2>/dev/null || echo '?')
  uid=$(awk '/^Uid:/{print $2}' "$d/status" 2>/dev/null || echo 0)
  ppid=$(awk '/^PPid:/{print $2}' "$d/status" 2>/dev/null || echo 0)
  user=$(getent passwd "$uid" 2>/dev/null | cut -d: -f1 || echo "$uid")
  printf '%-8s %-20s %-15s %-8s\\n' "$pid" "$name" "$user" "$ppid"
done`
          },
          {
            day:4, lang:"BASH", title:"Functions, Libraries & Modular Design",
            concept:"Function declaration, local vars, return values, source ./lib.sh, trap ERR",
            task:"Build a reusable security library (seclib.sh) with: validate_ip(), hash_file(), log_json(), send_alert()",
            lab:"Source the library in a new script; use all 4 functions in a file-check pipeline",
            usecase:"Enterprise security scripts share a common library — consistent logging, alerting, validation",
            output:"seclib.sh library + demo script using all functions. JSON-formatted log output.",
            code:`# seclib.sh — reusable security library
validate_ip() {
  [[ "$1" =~ ^([0-9]{1,3}\\.){3}[0-9]{1,3}$ ]] && return 0 || return 1
}
hash_file() {
  local path="$1" algo="${2:-sha256}"
  "${algo}sum" "$path" 2>/dev/null | cut -d' ' -f1
}
log_json() {
  local level="$1" msg="$2"
  printf '{"ts":"%s","level":"%s","msg":"%s"}\\n' \\
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$level" "$msg"
}`
          },
          {
            day:5, lang:"BASH", title:"Text Processing: grep, awk, sed",
            concept:"grep -E/-o/-P, awk fields/conditions/BEGIN-END, sed substitution/deletion",
            task:"Parse /var/log/auth.log: extract failed IPs, count occurrences, sort by frequency",
            lab:"auth_parser.sh — full auth log pipeline: extract→count→sort→threshold→alert",
            usecase:"SOC Tier-1: first triage script run on every Linux incident. Brute-force detection.",
            output:"Top-10 attacking IPs with attempt counts. Alert if count exceeds threshold.",
            code:`#!/usr/bin/env bash
set -euo pipefail
LOG="${1:-/var/log/auth.log}"
THRESHOLD="${2:-5}"
echo "=== TOP ATTACKER IPs ==="
grep "Failed password" "$LOG" 2>/dev/null \\
  | grep -oE '[0-9]{1,3}(\\.[0-9]{1,3}){3}' \\
  | sort | uniq -c | sort -rn | head -10 \\
  | awk -v thr="$THRESHOLD" '{
      flag = ($1 >= thr) ? "⚠ ALERT" : "  ok"
      printf "%s  [%5d attempts]  %s\\n", flag, $1, $2
    }'`
          },
          {
            day:6, lang:"BASH", title:"Network Tools: curl, nc, nmap integration",
            concept:"curl options, nc listener/client, nmap XML output parsing, timeout handling",
            task:"Build a host-alive checker using ping + nc banner grab on common ports",
            lab:"host_check.sh — ping sweep + banner grab for a subnet, output to CSV",
            usecase:"Pre-engagement recon automation. Quick asset discovery for pentest scope.",
            output:"CSV: IP,Status,Open_Ports,Banners for each host in the subnet",
            code:`#!/usr/bin/env bash
set -euo pipefail
SUBNET="${1:?Usage: $0 <x.x.x>}"
OUTFILE="hosts_$(date +%Y%m%d).csv"
echo "ip,status,port,banner" > "$OUTFILE"
for i in $(seq 1 254); do
  ip="$SUBNET.$i"
  if ping -c1 -W1 -q "$ip" &>/dev/null; then
    for port in 22 80 443 3389 8080; do
      banner=$(timeout 1 bash -c "echo '' | nc -w1 $ip $port 2>/dev/null | head -1" || echo "")
      echo "$ip,UP,$port,$banner" >> "$OUTFILE"
    done
  fi
done &
done; wait
echo "[+] Results: $OUTFILE"`
          },
          {
            day:7, lang:"BASH", title:"Week 1 Project — Auth Log Analyzer",
            concept:"Consolidate all week 1 skills into a production security tool",
            task:"Complete log analyzer with: brute-force detection, timeline, IP geolocation, JSON report",
            lab:"auth_analyzer.sh — full tool with config file, multiple log formats, report generation",
            usecase:"Real SOC tool — run daily against all Linux servers, feed reports to SIEM",
            output:"HTML + JSON report with: attacking IPs, timelines, user accounts targeted, recommendations",
            code:`# Full tool structure:
# auth_analyzer.sh [--log FILE] [--threshold N] [--output json|html] [--since DATE]
# Features:
#   - Multi-format log support (auth.log, secure, syslog)
#   - Brute force detection with timeline
#   - Successful logins after failures (compromise indicator)
#   - Country lookup via ip-api.com (optional)
#   - JSON + HTML report generation
#   - Exit codes for SIEM integration (0=clean, 1=warning, 2=critical)`
          },
        ]
      },
      {
        week:2, title:"Python Security Foundations", color:C.green,
        focus:"Python scripting with C++ mental models — sockets, files, processes, data structures",
        challenge:"Build a fully functional port scanner that: scans a range, grabs banners, identifies services, exports JSON",
        days:[
          {
            day:8, lang:"PYTHON", title:"Python Environment & Tool Architecture",
            concept:"venv, pyenv, argparse, logging, dataclasses, pathlib, type hints",
            task:"Set up security tool template with: CLI args, structured logging, config file, exit codes",
            lab:"Create port_scanner.py skeleton using the professional tool template from MOD-01",
            usecase:"Production security tools need proper architecture — this template is used for every script",
            output:"Working CLI tool: python3 tool.py --help shows formatted help. All args validated.",
            code:`# Setup:
python3 -m venv ~/.venvs/security
source ~/.venvs/security/bin/activate
pip install pefile yara-python requests scapy colorama
# Template already covered in MOD-01 — adapt it here
# Focus: argparse with subcommands, FileType args, logging levels`
          },
          {
            day:9, lang:"PYTHON", title:"Sockets, Networking & Banner Grabbing",
            concept:"socket module, TCP connect, UDP, timeout, concurrent.futures.ThreadPoolExecutor",
            task:"Port scanner: TCP connect scan with banner grabbing, threaded, 100-1000 ports/sec",
            lab:"scanner.py — full implementation with ThreadPoolExecutor, service ID, JSON output",
            usecase:"Pentest recon, asset inventory, network security auditing",
            output:"port_scan_results.json with: host, port, state, service, banner, latency",
            code:`import socket, concurrent.futures, json, time
from dataclasses import dataclass, asdict

@dataclass
class PortResult:
    port: int; state: str = 'closed'
    service: str = ''; banner: str = ''; ms: float = 0.0

def probe(host, port, timeout=1.0):
    r = PortResult(port=port)
    t0 = time.monotonic()
    try:
        with socket.create_connection((host,port), timeout) as s:
            r.state, r.ms = 'open', round((time.monotonic()-t0)*1000,1)
            s.settimeout(0.3)
            try: r.banner = s.recv(1024).decode('utf-8',errors='replace').strip()[:80]
            except: pass
    except: pass
    return r`
          },
          {
            day:10, lang:"PYTHON", title:"File I/O, Regex & IOC Extraction",
            concept:"pathlib, re module (compile, finditer, groups), CSV/JSON read-write, generators",
            task:"IOC extractor: parse any log file, extract IPs/domains/hashes/URLs, deduplicate, export",
            lab:"ioc_extractor.py — full implementation with VirusTotal hash lookup (from MOD-01)",
            usecase:"Threat intel automation — first tool run on any log, malware report, or email for IOCs",
            output:"iocs.json with: ipv4[], domains[], md5[], sha256[], urls[], emails[]",
            code:`import re
PATTERNS = {
    'ipv4':   re.compile(r'\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b'),
    'domain': re.compile(r'\\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61})?)+(?:\\.[a-zA-Z]{2,})+\\b'),
    'md5':    re.compile(r'\\b[a-fA-F0-9]{32}\\b'),
    'sha256': re.compile(r'\\b[a-fA-F0-9]{64}\\b'),
    'url':    re.compile(r'https?://[^\\s<>"\\'']+'),
}
PRIVATE = re.compile(r'^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|127\\.)')`
          },
          {
            day:11, lang:"PYTHON", title:"Subprocess & System Interaction",
            concept:"subprocess.run/Popen, shlex, os/sys, pathlib, /proc parsing, platform detection",
            task:"Process forensics script: list all processes with full detail from /proc",
            lab:"proc_forensics.py — implementation from MOD-01 (live /proc analysis)",
            usecase:"Live incident response — enumerate processes, detect suspicious indicators, no external tools",
            output:"Flagged processes with: EXE_DELETED, SUSP_CWD, ANON_EXEC, ROOT_SHELL indicators",
            code:`import subprocess, shlex
def run(cmd, timeout=10):
    try:
        result = subprocess.run(
            shlex.split(cmd) if isinstance(cmd,str) else cmd,
            capture_output=True, text=True,
            timeout=timeout, check=False
        )
        return result.stdout, result.returncode
    except subprocess.TimeoutExpired:
        return '', -1
    except FileNotFoundError:
        return '', -2`
          },
          {
            day:12, lang:"PYTHON", title:"HTTP Clients, APIs & Web Scraping",
            concept:"urllib (no requests dependency), json, base64, HMAC auth, rate limiting",
            task:"Build a threat intel enricher: query VirusTotal, AbuseIPDB for IOC reputation",
            lab:"ti_enricher.py — async IOC enrichment with caching, rate-limit handling",
            usecase:"Automate threat intel lookups in every IR investigation. Reduce analyst manual work.",
            output:"Enriched IOC report: each IP/hash has VT detections, AbuseIPDB score, country, ASN",
            code:`import urllib.request, json, os, time
VT_KEY = os.environ.get('VT_API_KEY','')

class RateLimiter:
    def __init__(self, calls_per_min=4):
        self.interval = 60/calls_per_min
        self.last = 0.0
    def wait(self):
        elapsed = time.monotonic() - self.last
        if elapsed < self.interval:
            time.sleep(self.interval - elapsed)
        self.last = time.monotonic()

rl = RateLimiter(calls_per_min=4)  # VT free: 4/min`
          },
          {
            day:13, lang:"PYTHON", title:"SQLite, Data Persistence & Reporting",
            concept:"sqlite3 context manager, executemany, parameterised queries, json.dumps with indent",
            task:"Add persistent SQLite storage to IOC extractor — track findings across runs",
            lab:"fim_db.py — File Integrity Monitor with SQLite baseline (from MOD-01)",
            usecase:"Production FIM needs persistent state. SQLite stores baseline hashes between runs.",
            output:"fim.db SQLite database with baseline + events tables. HTML report of changes.",
            code:`import sqlite3, hashlib
from pathlib import Path

class FIMDatabase:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(str(db_path))
        self.conn.execute('''CREATE TABLE IF NOT EXISTS baseline
            (path TEXT PRIMARY KEY, hash TEXT, size INTEGER, mtime REAL, created TEXT DEFAULT(datetime('now')))''')
        self.conn.execute('''CREATE TABLE IF NOT EXISTS events
            (id INTEGER PRIMARY KEY, ts TEXT DEFAULT(datetime('now')), event TEXT, path TEXT, detail TEXT)''')
        self.conn.commit()`
          },
          {
            day:14, lang:"PYTHON", title:"Week 2 Project — Port Scanner Pro",
            concept:"Consolidate: sockets, threading, argparse, JSON output, service fingerprinting",
            task:"Production port scanner: SYN-style scan, OS detection hints, service version, CVE links",
            lab:"scanner_pro.py — full tool with multiple scan modes, rate limiting, Nmap comparison",
            usecase:"Pre-engagement asset discovery. Internal network auditing. Vulnerability scope definition.",
            output:"Full scan report: open ports + service versions + known CVEs + export formats (JSON/CSV/HTML)",
            code:`# scanner_pro.py features:
# Modes: --tcp-connect, --udp (root), --banner, --full
# Output: --format json|csv|html|table
# Rate limit: --rate 100 (connections/sec)
# Service DB: /etc/services + custom fingerprints
# CVE hints: lookup NVD by service + version
# Usage: python3 scanner_pro.py 192.168.1.0/24 -p 1-1024 --full --format html`
          },
        ]
      },
      {
        week:3, title:"Intermediate Bash + Python Security", color:C.amber,
        focus:"Advanced scripting patterns, automation pipelines, Blue Team tools",
        challenge:"Build an end-to-end log analysis pipeline: ingest → parse → detect → alert → report",
        days:[
          {
            day:15, lang:"BASH", title:"Advanced Bash: Parallel Execution & Jobs",
            concept:"Background jobs (&), wait -n, xargs -P, GNU parallel, job arrays",
            task:"Parallel subnet scanner: ping sweep 256 hosts in under 5 seconds",
            lab:"parallel_sweep.sh — full parallel implementation with job limiting and result aggregation",
            usecase:"Large-scale recon and auditing where sequential execution is too slow",
            output:"Live hosts listed as they respond. Total time < 5s for /24 subnet.",
            code:`ping_host() {
    local ip="$1" live="$2"
    ping -c1 -W1 -q "$ip" &>/dev/null && echo "$ip" >> "$live"
}
export -f ping_host
LIVE=$(mktemp); trap 'rm -f "$LIVE"' EXIT
printf '%s\\n' 192.168.1.{1..254} | xargs -P50 -I{} bash -c 'ping_host "$@"' _ {} "$LIVE"
sort -t. -k4 -n "$LIVE"`
          },
          {
            day:16, lang:"BASH", title:"inotify, cron & Systemd Timers",
            concept:"inotifywait events, crontab syntax, systemd .service/.timer units, journalctl",
            task:"Deploy FIM script as a systemd service that auto-restarts and logs to journald",
            lab:"fim.service + fim.timer — install, enable, test, verify journal entries",
            usecase:"Production FIM must survive reboots and run automatically. Systemd > cron for reliability.",
            output:"Systemd service running FIM every 5 min, logging to journald, visible in journalctl",
            code:`# /etc/systemd/system/fim.service
[Unit]
Description=File Integrity Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/security/fim.sh check
StandardOutput=journal
StandardError=journal

# /etc/systemd/system/fim.timer
[Timer]
OnCalendar=*:0/5  # Every 5 minutes
Persistent=true   # Run missed jobs after downtime

[Install]
WantedBy=timers.target`
          },
          {
            day:17, lang:"PYTHON", title:"Concurrency: Threading vs asyncio",
            concept:"threading.Thread, ThreadPoolExecutor, asyncio basics, aiohttp vs urllib",
            task:"Rewrite port scanner using asyncio for 10x speed improvement vs threading",
            lab:"async_scanner.py — asyncio TCP connect scanner, benchmark vs threaded version",
            usecase:"High-performance scanning tools need async I/O. Understanding both models essential.",
            output:"Asyncio scanner runs 10x faster than threaded for large port ranges. Benchmark comparison.",
            code:`import asyncio

async def probe(host, port, timeout=1.0):
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=timeout)
        writer.close()
        await writer.wait_closed()
        return port, 'open'
    except: return port, 'closed'

async def scan(host, ports):
    tasks = [probe(host, p) for p in ports]
    return await asyncio.gather(*tasks)`
          },
          {
            day:18, lang:"PYTHON", title:"Class Design & OOP for Security Tools",
            concept:"Dataclasses, inheritance, __enter__/__exit__ (context managers), Protocol, ABC",
            task:"Refactor IOC extractor as class hierarchy: BaseExtractor → LogExtractor → PcapExtractor",
            lab:"extractor_oop.py — class-based design with plugin architecture for new IOC types",
            usecase:"Production tools are classes, not scripts. Testable, extensible, maintainable.",
            output:"Pluggable extractor: add new IOC type by subclassing, zero modification to core",
            code:`from abc import ABC, abstractmethod
from dataclasses import dataclass, field

class BaseExtractor(ABC):
    def __init__(self): self.results = {}
    
    @abstractmethod
    def extract(self, source: str) -> dict: ...
    
    def report(self):
        for ioc_type, vals in self.results.items():
            print(f"[{ioc_type.upper()}] {len(vals)} found")

class LogExtractor(BaseExtractor):
    def extract(self, logfile: str) -> dict:
        text = open(logfile, errors='replace').read()
        # ... pattern matching
        return self.results`
          },
          {
            day:19, lang:"BASH+PYTHON", title:"Pipeline Design: stdin/stdout/pipes",
            concept:"Unix philosophy, stdin reading in Python, subprocess pipes, tee, named pipes (mkfifo)",
            task:"Build a detection pipeline: log_tail | ioc_extract | vt_lookup | alert",
            lab:"detection_pipeline.sh — orchestrate Python tools via Unix pipes",
            usecase:"SIEM-like pipeline using only shell tools. Real-time IOC detection from live logs.",
            output:"Real-time alerts as new IOCs appear in logs. Latency < 2 seconds from log entry to alert.",
            code:`# pipeline: tail → extract → enrich → alert
tail -F /var/log/auth.log \\
  | python3 ioc_extract.py --stdin --format jsonl \\
  | python3 vt_lookup.py --threshold 3 \\
  | python3 alert.py --slack-webhook "$WEBHOOK"

# Each script reads stdin, writes stdout as JSONL
# Backpressure: if VT is slow, extract buffers
# Each stage is independently testable`
          },
          {
            day:20, lang:"POWERSHELL", title:"PowerShell Foundations for Security",
            concept:"CmdletBinding, param validation, pipeline, objects (not text), Get-WinEvent",
            task:"Windows auth event analyzer: query Event 4624/4625, build login timeline",
            lab:"auth_analyzer.ps1 — Event Log query, object pipeline, brute-force detection",
            usecase:"Windows IR — same concepts as Bash auth_analyzer but with richer Windows event data",
            output:"Login timeline HTML report: logon types, source IPs, success/failure rates",
            code:`[CmdletBinding()]
param([int]$Days=1, [int]$Threshold=5, [string]$Output='report.html')
Set-StrictMode -Version Latest; $ErrorActionPreference = 'Stop'

$since = (Get-Date).AddDays(-$Days)
$failed = Get-WinEvent -FilterHashtable @{
    LogName='Security'; Id=4625; StartTime=$since
} -EA SilentlyContinue | ForEach-Object {
    $d = ([xml]$_.ToXml()).Event.EventData.Data
    [PSCustomObject]@{
        Time = $_.TimeCreated
        IP   = ($d|?{$_.Name-eq'IpAddress'}).'#text'
        User = ($d|?{$_.Name-eq'TargetUserName'}).'#text'
    }
}`
          },
          {
            day:21, lang:"BASH+PYTHON", title:"Week 3 Project — Detection Pipeline",
            concept:"Integrate week 3 skills: parallel bash + Python classes + PS event logs + pipes",
            task:"End-to-end detection pipeline: monitor logs → extract IOCs → enrich → SIEM-ready output",
            lab:"detection_engine/ — directory with: collector.sh, extractor.py, enricher.py, reporter.py",
            usecase:"Lightweight SIEM replacement for small environments. Full detection-to-alert workflow.",
            output:"Structured JSON alerts: {ts, rule, severity, iocs, enrichment, recommended_action}",
            code:`# Architecture:
# collector.sh    → tail multiple logs → stdout JSONL
# extractor.py    → read stdin → extract IOCs → stdout JSONL
# enricher.py     → read stdin → VT/AbuseIPDB → stdout JSONL
# reporter.py     → read stdin → write alerts + HTML dashboard

# Run:
# ./collector.sh | python3 extractor.py | python3 enricher.py | python3 reporter.py`
          },
        ]
      },
      {
        week:4, title:"Automation & Tool Development", color:C.purple,
        focus:"Building complete security tools, testing, documentation, deployment",
        challenge:"Deploy your FIM, auth analyzer, and detection pipeline as production systemd services with alerts",
        days:[
          {
            day:22, lang:"PYTHON", title:"Testing Security Scripts (pytest)",
            concept:"pytest basics, fixtures, parametrize, mock (unittest.mock), coverage",
            task:"Write test suite for IOC extractor: test all pattern types, edge cases, false positives",
            lab:"test_extractor.py — 20+ tests covering all IOC types, private IP filtering, empty input",
            usecase:"Production security tools must be tested. A bug in IOC extraction = missed threats.",
            output:"pytest output: 20 passed, 0 failed. Coverage report > 85%.",
            code:`import pytest
from ioc_extractor import IOCExtractor

@pytest.fixture
def extractor(): return IOCExtractor()

@pytest.mark.parametrize("ip,expected", [
    ("198.51.100.1", True),   # public IP — should match
    ("192.168.1.1",  False),  # private — should filter
    ("999.999.0.1",  False),  # invalid — should not match
    ("10.0.0.1",     False),  # RFC1918 — should filter
])
def test_ipv4_extraction(extractor, ip, expected):
    iocs = extractor.extract(f"connection from {ip}")
    assert (ip in iocs.get('ipv4', [])) == expected`
          },
          {
            day:23, lang:"PYTHON", title:"Configuration Management & Secrets",
            concept:"configparser, python-dotenv, environment vars, no hardcoded secrets, YAML",
            task:"Add config file support to detection pipeline: YAML config with all settings",
            lab:"config.py — hierarchical config: defaults → config.yaml → environment → CLI args",
            usecase:"Real tools have config files. API keys from env vars, never in code. 12-factor app.",
            output:"Tool reads config.yaml + .env. CLI args override. No secrets in git.",
            code:`# config.yaml
logging:
  level: INFO
  file: /var/log/security/tool.log
thresholds:
  brute_force: 5
  scan_rate: 100
apis:
  virustotal_key: ""  # Set via VT_API_KEY env var
  abuseipdb_key: ""   # Set via ABUSEIPDB_KEY env var
alerts:
  slack_webhook: ""   # Set via SLACK_WEBHOOK env var
  email: ""

# Load: key from env overrides yaml value`
          },
          {
            day:24, lang:"BASH", title:"Advanced awk, sed, jq",
            concept:"awk arrays and multi-file, sed branching, jq filters and transforms",
            task:"Log normaliser: convert Apache/Nginx/auth.log to unified JSON format using awk+jq",
            lab:"normalise.sh — converts 3 log formats to common JSONL schema",
            usecase:"SIEM ingestion requires normalised logs. This script is a lightweight ETL pipeline.",
            output:"normalised.jsonl — all log entries as consistent JSON objects regardless of source format",
            code:`# Apache CLF → JSON using awk
awk '{
    split($4, dt, /[\/:]/)
    printf "{\\"ts\\":\\"%s-%s-%s %s:%s:%s\\",\\"ip\\":\\"%s\\",\\"method\\":\\"%s\\",\\"path\\":\\"%s\\",\\"status\\":%s,\\"bytes\\":%s}\\n",
    dt[3],dt[2],dt[1],dt[4],dt[5],dt[6],
    $1, substr($6,2), $7, $9, ($10=="-"?0:$10)
}' access.log | jq -c .  # validate + compact`
          },
          {
            day:25, lang:"POWERSHELL", title:"PowerShell Persistence & Registry Hunting",
            concept:"Registry PSDrive, Get-ItemProperty, scheduled tasks, COM objects, WMIC",
            task:"Persistence hunter: enumerate all Windows persistence locations and flag suspicious",
            lab:"persistence_hunter.ps1 — from MOD-01 with full implementation",
            usecase:"Windows incident response step 2: after credential dump alert, hunt for persistence",
            output:"Persistence report: all Run keys, scheduled tasks, services — suspicious entries flagged",
            code:`# Implemented in MOD-01 — extend it here:
# Add: WMI event subscriptions (most stealthy)
Get-WMIObject -NS root\\subscription -Class __EventFilter | ForEach-Object {
    [PSCustomObject]@{
        Type    = 'WMI_EventFilter'
        Name    = $_.Name
        Query   = $_.Query
        Suspicious = ($_.Query -match '(?i)(powershell|cmd|wscript|mshta)')
    }
}`
          },
          {
            day:26, lang:"PYTHON", title:"Packaging & CLI Tool Distribution",
            concept:"setup.py / pyproject.toml, entry_points, __main__.py, pip install -e .",
            task:"Package your port scanner as installable CLI tool: pip install → portscanner command",
            lab:"package the scanner with proper pyproject.toml, README, and pip install -e . test",
            usecase:"Security tools should be installable, versioned, and distributable to team members",
            output:"pip install -e . works. portscanner --help works from anywhere. Version shows correctly.",
            code:`# pyproject.toml
[project]
name = "portscanner"
version = "1.0.0"
description = "Production TCP port scanner"
requires-python = ">=3.11"
dependencies = []

[project.scripts]
portscanner = "portscanner.__main__:main"

[build-system]
requires = ["setuptools"]
build-backend = "setuptools.backends.legacy:build"

# Install: pip install -e .
# Run:    portscanner 192.168.1.1 -p 1-1024`
          },
          {
            day:27, lang:"BASH+PYTHON", title:"Git Workflows for Security Tools",
            concept:"git commit conventions, .gitignore for security tools, pre-commit hooks, secret scanning",
            task:"Set up git repo for all your tools with pre-commit hooks that block secret commits",
            lab:"git-hooks/pre-commit — scans staged files for API keys, passwords, private keys",
            usecase:"Security tools in git must never expose secrets. Pre-commit hooks = automated enforcement",
            output:"git commit blocked if staged files contain: API key patterns, private keys, passwords",
            code:`#!/bin/bash
# .git/hooks/pre-commit — install: chmod +x .git/hooks/pre-commit
set -e
BLOCKED=0
patterns=(
    'AKIA[A-Z0-9]{16}'           # AWS access key
    'sk-[a-zA-Z0-9]{48}'         # OpenAI
    '-----BEGIN.*PRIVATE KEY-----' # Private key
    'api[_-]?key\s*=\s*["\'][^"\']+["\']' # Generic API key
)
for file in $(git diff --cached --name-only); do
    for pat in "${patterns[@]}"; do
        grep -qiE "$pat" "$file" 2>/dev/null && {
            echo "BLOCKED: Secret pattern in $file"; BLOCKED=1; }
    done
done
exit $BLOCKED`
          },
          {
            day:28, lang:"ALL", title:"Week 4 Project — Security Tool Suite",
            concept:"Combine all Month 1 tools into a coherent toolkit with shared library",
            task:"security_toolkit/ — unified CLI that runs all tools: scan, fim, analyze, extract, enrich",
            lab:"Run the full pipeline: scan → identify hosts → analyze logs → extract IOCs → enrich → report",
            usecase:"The toolkit is your personal security automation platform. Demo-able to employers.",
            output:"security_toolkit --help shows all subcommands. Full pipeline runs end-to-end.",
            code:`# security_toolkit CLI
security_toolkit scan   192.168.1.0/24          # Port scan
security_toolkit fim    baseline|check|report   # File integrity
security_toolkit analyze --log /var/log/auth.log # Log analysis
security_toolkit extract --file malware.txt      # IOC extraction
security_toolkit enrich  --iocs iocs.json        # VT enrichment
security_toolkit report  --format html           # Generate report`
          },
        ]
      },
    ]
  },

  month2: {
    label:"MONTH 2", title:"Security Scripting — Red & Blue Team", color:C.amber,
    weeks:[
      {
        week:5, title:"Blue Team: SIEM & Detection Scripts", color:C.cyan,
        focus:"Build production detection rules, SIEM queries, and automated alert enrichment",
        challenge:"Write 5 SIGMA rules and convert them to Splunk SPL, ELK, and KQL using pySigma",
        days:[
          { day:29, lang:"PYTHON", title:"SIGMA Rule Automation", concept:"pySigma library, rule parsing, backend conversion, validation", task:"Build a SIGMA rule generator that takes a detection description and produces a valid SIGMA YAML", lab:"sigma_gen.py — NLP-to-SIGMA converter with template library for common TTPs", usecase:"Detection engineers write dozens of rules per week. Automation saves hours.", output:"Valid SIGMA YAML that passes 'sigma check'. Converts to SPL/KQL correctly.", code:`pip install pySigma pySigma-backend-splunk pySigma-backend-elasticsearch
from sigma.collection import SigmaCollection
from sigma.backends.splunk import SplunkBackend

rules = SigmaCollection.from_yaml(open('rule.yml').read())
backend = SplunkBackend()
print(backend.convert(rules))` },
          { day:30, lang:"PYTHON", title:"ELK Stack Integration", concept:"Elasticsearch Python client, index templates, ILM, Kibana API", task:"Build a log shipper that sends security events to Elasticsearch with proper mapping", lab:"log_shipper.py — reads JSONL alerts, bulks to ES, creates index with proper field mapping", usecase:"Route your detection pipeline alerts to Elasticsearch for SOC dashboarding", output:"Alerts searchable in Kibana. Dashboard shows: alert rate, top rules, top hosts.", code:`from elasticsearch import Elasticsearch, helpers
import json

es = Elasticsearch(['http://localhost:9200'])

def ship_alerts(alerts_jsonl):
    actions = []
    for line in open(alerts_jsonl):
        doc = json.loads(line)
        actions.append({'_index':'security-alerts','_source':doc})
    helpers.bulk(es, actions)
    print(f"[+] Shipped {len(actions)} alerts")` },
          { day:31, lang:"BASH+PYTHON", title:"Log Normalisation at Scale", concept:"Multi-format parsing, field mapping, timestamp normalisation, ECS (Elastic Common Schema)", task:"Universal log normaliser: handles 10 log formats, maps to ECS, streams via JSONL", lab:"normaliser.py — 10 parsers using regex, handles Apache/Nginx/auth/Windows/Sysmon", usecase:"SIEM ingestion requires normalised data. This is the ETL layer of any detection stack.", output:"All log formats produce consistent ECS-compatible JSONL output.", code:`ECS_MAPPING = {
    'source.ip':         ['ip', 'src_ip', 'client_ip', 'IpAddress'],
    'user.name':         ['user', 'username', 'TargetUserName'],
    'event.action':      ['action', 'event_type'],
    'process.name':      ['process', 'Image', 'comm'],
    'destination.port':  ['port', 'dst_port', 'DestinationPort'],
}` },
          { day:32, lang:"PYTHON", title:"Threat Intelligence Integration", concept:"MISP API, OpenCTI, STIX/TAXII, indicator scoring, TLP handling", task:"MISP integration script: push new IOCs from your extractor to MISP, pull indicators for detection", lab:"misp_sync.py — bidirectional MISP sync with deduplication and TLP handling", usecase:"Threat intel sharing: your IOC findings enrich the community. Community findings improve your detections.", output:"New IOCs pushed to MISP event. MISP indicators pulled and used in detection pipeline.", code:`import pymisp
misp = pymisp.PyMISP('https://misp.local', 'API_KEY', False)

def push_iocs(iocs: dict, event_title: str):
    event = misp.new_event(info=event_title, distribution=1, threat_level_id=2)
    for ip in iocs.get('ipv4', []):
        misp.add_attribute(event['Event']['id'],
            {'type':'ip-dst','value':ip,'to_ids':True,'comment':'automated'})` },
          { day:33, lang:"PYTHON", title:"Canary Files & Honeytokens", concept:"Tripwire files, honeytokens, file access monitoring, alerting on access", task:"Deploy 50 canary files across file system; alert immediately when any is accessed", lab:"canary_deploy.py + canary_monitor.sh — deploy canaries, monitor with inotify, alert", usecase:"Ransomware detection: canary files are encrypted first. Alert fires before mass encryption.", output:"Canary network deployed. inotify alert fires within 1 second of any canary access.", code:`import random, string, hashlib
from pathlib import Path

def create_canary(directory, prefix='~report_'):
    """Create a realistic-looking fake sensitive file"""
    name = prefix + ''.join(random.choices(string.ascii_lowercase, k=8)) + '.docx'
    path = Path(directory) / name
    # Write realistic-looking content
    content = f"CONFIDENTIAL\\nEmployee Salary Report Q{random.randint(1,4)}\\n"
    path.write_text(content)
    return path, hashlib.sha256(content.encode()).hexdigest()` },
          { day:34, lang:"POWERSHELL", title:"Windows Event Log Hunting", concept:"Custom views, XPath queries, correlation across logs, timeline building", task:"Build a Windows IR timeline tool: correlate 10+ event IDs into a single attack narrative", lab:"ir_timeline.ps1 — queries Security/Sysmon/System logs, correlates by time and host", usecase:"Windows incident response: build attack timeline in minutes not hours", output:"Chronological attack narrative: initial access → execution → persistence → lateral movement", code:`# Correlate events across multiple logs
$timeline = @()
$logs = @('Security','Microsoft-Windows-Sysmon/Operational','System')

foreach ($log in $logs) {
    $events = Get-WinEvent -FilterHashtable @{
        LogName=$log; StartTime=(Get-Date).AddDays(-1)
    } -EA SilentlyContinue
    $timeline += $events | Select-Object TimeCreated, Id, Message
}

$timeline | Sort-Object TimeCreated | Format-Table -Wrap` },
          { day:35, lang:"ALL", title:"Week 5 Project — Mini SOC Platform", concept:"Tie together: SIGMA → ELK → MISP → alerting into a working SOC workflow", task:"Deploy: ELK stack (Docker) + your log pipeline + 10 SIGMA rules + Kibana dashboard", lab:"docker-compose.yml for ELK + all your pipeline scripts configured to feed it", usecase:"This is a real lightweight SOC platform. Deployable in a small enterprise for < $500/year.", output:"Working ELK + pipeline. Kibana dashboard shows real-time alerts. SIGMA rules detect test attacks.", code:`# docker-compose.yml skeleton
version: '3.8'
services:
  elasticsearch: {image: elasticsearch:8.12.0, ports: ['9200:9200']}
  kibana:         {image: kibana:8.12.0,         ports: ['5601:5601']}
  logstash:       {image: logstash:8.12.0,       ports: ['5044:5044']}
# Your pipeline connects to logstash:5044` },
        ]
      },
      {
        week:6, title:"Red Team: Scripting Offensive Tools", color:C.red,
        focus:"Understanding offensive scripting for better defensive engineering (all in authorised lab only)",
        challenge:"Build a complete red team recon script suite: OSINT → scan → service enum → output report",
        days:[
          { day:36, lang:"PYTHON", title:"OSINT Automation", concept:"DNS enumeration, WHOIS, Certificate Transparency, passive recon, rate limiting", task:"Domain recon tool: DNS records, subdomains via CT logs, WHOIS, email harvesting", lab:"recon.py — passive recon for authorised target, structured JSON output", usecase:"Pentest phase 1: gather intelligence without touching target. Builds attack surface map.", output:"target_recon.json: DNS records, 50+ subdomains, open ports hint from cert SANs, contacts", code:`import ssl, socket, json
# Certificate Transparency log query (crt.sh)
def ct_enum_subdomains(domain):
    url = f'https://crt.sh/?q=%.{domain}&output=json'
    # urllib fetch → parse JSON → extract unique subdomains
    # Returns: ['mail.domain.com', 'vpn.domain.com', ...]
    pass

# DNS brute force with wordlist
def dns_brute(domain, wordlist='/usr/share/wordlists/subdomains.txt'):
    # For each word: try to resolve word.domain → if resolves → add to results
    pass` },
          { day:37, lang:"PYTHON", title:"Service Enumeration & Fingerprinting", concept:"Protocol-specific banners, version parsing, vulnerability hints, Shodan API", task:"Service enumerator: connect to open ports, identify exact service+version, lookup CVEs", lab:"service_enum.py — fingerprints SSH/HTTP/FTP/SMTP/SMB, returns version + CVE hints", usecase:"Pentest phase 2: turn open ports into exploitable vulnerabilities. Automates manual work.", output:"Identified services with versions. 3+ CVE links per service if unpatched versions found.", code:`SERVICE_PATTERNS = {
    'ssh':   re.compile(r'SSH-([\\d.]+)-([\\w._]+)'),
    'http':  re.compile(r'Server:\\s*([^\\r\\n]+)'),
    'ftp':   re.compile(r'^2\\d\\d.*?(\\S+)\\s+FTP'),
    'smtp':  re.compile(r'^2\\d\\d\\s+([\\w.]+)\\s+ESMTP'),
}
# CVE lookup: https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=apache+2.4.49` },
          { day:38, lang:"BASH", title:"Automated Privilege Escalation Checks", concept:"SUID/SGID audit, sudo misconfiguration, writable paths, linpeas integration", task:"Build a privesc checker script that identifies the top 20 Linux privesc vectors", lab:"privesc_check.sh — systematic check of SUID, sudo, cron, path, NFS, docker", usecase:"Post-exploitation: immediately after foothold, run to find path to root. Defensive use: audit your own servers.", output:"Colour-coded report: CRITICAL/HIGH/MEDIUM privesc vectors found on current host", code:`#!/usr/bin/env bash
# Only run on authorised systems you own or have permission to test
check_suid() {
    echo "=== SUID BINARIES ==="
    find / -perm -4000 -type f 2>/dev/null | while read -r bin; do
        # Check if in GTFOBins
        name=$(basename "$bin")
        if curl -s "https://gtfobins.github.io/gtfobins/$name/" 2>/dev/null | grep -q "SUID"; then
            echo "  [EXPLOITABLE] $bin → GTFOBins entry found"
        fi
    done
}` },
          { day:39, lang:"PYTHON", title:"Payload Encoding & Obfuscation Analysis", concept:"Base64, XOR, hex encoding, decode chains, identifying obfuscation layers", task:"Build an obfuscation detector and decoder: identifies encoding type, decodes layers", lab:"deobfuscate.py — detects base64/XOR/hex and auto-decodes recursively", usecase:"Malware analysis and IR: deobfuscate malicious payloads to understand intent", output:"Multi-layer obfuscated string fully decoded to reveal plaintext IOCs/payload", code:`import base64, re, binascii

def detect_and_decode(data: str, depth=0, max_depth=10) -> str:
    if depth > max_depth: return data
    # Try base64
    if re.match(r'^[A-Za-z0-9+/]{20,}={0,2}$', data.strip()):
        try:
            decoded = base64.b64decode(data).decode('utf-8','replace')
            print(f"  {'  '*depth}[BASE64] → '{decoded[:50]}...'")
            return detect_and_decode(decoded, depth+1)
        except: pass
    # Try hex
    if re.match(r'^[0-9a-fA-F]{20,}$', data.strip()):
        try: return bytes.fromhex(data).decode('utf-8','replace')
        except: pass
    return data` },
          { day:40, lang:"PYTHON", title:"Network Traffic Analysis with Scapy", concept:"Scapy packet crafting, PCAP analysis, protocol dissection, flow reconstruction", task:"PCAP analyser: extract DNS queries, HTTP requests, and detect C2 beaconing patterns", lab:"pcap_analyze.py — parses PCAP, extracts IOCs, detects anomalies, generates report", usecase:"Incident response: analyse captured traffic for C2 communications and data exfil", output:"PCAP report: unique IPs, domains queried, HTTP requests, potential C2 connections flagged", code:`from scapy.all import rdpcap, DNS, DNSQR, HTTP, IP

def analyze_pcap(path: str) -> dict:
    pkts = rdpcap(path)
    results = {'dns_queries': [], 'http_hosts': [], 'connections': {}}
    
    for pkt in pkts:
        if pkt.haslayer(DNS) and pkt[DNS].opcode == 0:  # query
            if pkt.haslayer(DNSQR):
                results['dns_queries'].append(pkt[DNSQR].qname.decode('utf-8','replace'))
        if pkt.haslayer(IP):
            key = f"{pkt[IP].src}:{pkt[IP].dst}"
            results['connections'][key] = results['connections'].get(key,0)+1
    return results` },
          { day:41, lang:"BASH+PYTHON", title:"Automated Report Generation", concept:"Jinja2 templates, WeasyPrint PDF, HTML/CSS reports, structured pentest format", task:"Professional pentest report generator: takes findings JSON, produces PDF/HTML report", lab:"report_gen.py — Jinja2-based pentest report with executive summary + technical findings", usecase:"Pentest deliverable: professional report in seconds from your structured findings data", output:"report.pdf + report.html with: executive summary, risk matrix, findings, recommendations", code:`from jinja2 import Environment, FileSystemLoader
import json

def generate_report(findings_json: str, template_dir: str = 'templates') -> str:
    findings = json.loads(open(findings_json).read())
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('pentest_report.html.j2')
    return template.render(
        findings=findings['findings'],
        target=findings['target'],
        date=findings['date'],
        critical=sum(1 for f in findings['findings'] if f['severity']=='Critical')
    )` },
          { day:42, lang:"ALL", title:"Week 6 Project — Recon & Enum Suite", concept:"OSINT + scan + enum + report into a complete pentest phase 1 tool", task:"recon_suite.py — full tool: passive OSINT → active scan → service enum → HTML report", lab:"Run against HackTheBox target (authorised) or your own lab network", usecase:"This is a real pentest automation tool. Run at start of every engagement.", output:"Full recon report in < 5 minutes for a single target. PDF output ready for client.", code:`# recon_suite.py workflow:
# 1. ct_enum_subdomains(target)       → subdomain list
# 2. dns_resolve(subdomains)          → live hosts
# 3. port_scan(live_hosts, top=1000)  → open ports
# 4. service_enum(hosts_ports)        → service versions
# 5. cve_lookup(services)             → vulnerability hints
# 6. generate_report(all_findings)    → HTML + PDF

# Usage: python3 recon_suite.py --target example.com --output report/` },
        ]
      },
      {
        week:7, title:"Malware Analysis Scripting", color:C.purple,
        focus:"Static and dynamic analysis automation, YARA writing, PE analysis",
        challenge:"Write a complete triage script that classifies a malware sample in under 60 seconds",
        days:[
          { day:43, lang:"PYTHON", title:"PE File Analysis Automation", concept:"pefile library, entropy calculation, import table, section analysis, packer detection", task:"Automate full PE static analysis: sections, imports, strings, entropy, suspicious indicators", lab:"pe_analyzer.py — full implementation from MOD-03", usecase:"Malware triage: classify sample before wasting time on manual analysis", output:"pe_analysis.json: packer detected, suspicious APIs, network capability, flags, risk score", code:`import pefile, math
from collections import Counter

def entropy(data: bytes) -> float:
    if not data: return 0.0
    freq = Counter(data)
    return -sum((c/len(data))*math.log2(c/len(data)) for c in freq.values())

pe = pefile.PE('sample.exe')
for section in pe.sections:
    e = entropy(section.get_data())
    print(f"{section.Name.decode(errors='?').strip(chr(0)):10} entropy={e:.2f} {'PACKED' if e>7.0 else 'ok'}")` },
          { day:44, lang:"YARA+PYTHON", title:"YARA Rule Development & Testing", concept:"YARA syntax, hex patterns, regex, conditions, modules (pe, math, hash)", task:"Write 10 production YARA rules for common malware families using real sample strings", lab:"Build automated YARA testing framework: rule → test on positive/negative samples → report", usecase:"Detection engineering core skill. YARA rules ship in every AV/EDR product.", output:"10 validated YARA rules with true-positive rate > 90% and false-positive rate < 1%", code:`rule CobaltStrike_Beacon {
    meta:
        description = "Detects CS Beacon default artifacts"
        author = "sac14"
    strings:
        $pipe1 = "\\\\.\\pipe\\msagent_" wide ascii
        $rdll  = { FC 48 83 E4 F0 E8 C8 00 00 00 }
    condition:
        (uint16(0)==0x5A4D) and (any of ($pipe*) or $rdll)
}` },
          { day:45, lang:"PYTHON", title:"Dynamic Analysis Automation", concept:"subprocess for sandbox invocation, ProcMon log parsing, PCAP analysis, diff-based detection", task:"Automate dynamic analysis: run sample in VM, collect ProcMon + PCAP + diff, generate report", lab:"dynamic_analyzer.py — orchestrates analysis VM via subprocess/SSH, collects artefacts", usecase:"Scale malware analysis: 1 analyst can triage 100s of samples/day with automation", output:"Automated dynamic report: file drops, registry changes, network connections, injections", code:`# Workflow:
# 1. Take VM snapshot (VBoxManage snapshot take ...)
# 2. Start monitoring tools via SSH/WMI (ProcMon, tcpdump)
# 3. Execute sample
# 4. Wait N seconds
# 5. Collect artefacts via SSH
# 6. Restore snapshot
# 7. Generate diff report
# Tools: VBoxManage, paramiko (SSH), dpkt (PCAP parsing)` },
          { day:46, lang:"PYTHON", title:"Volatility 3 Automation", concept:"Volatility 3 API, custom plugins, memory artefact extraction, IOC correlation", task:"Build a memory forensics automation script: run key Volatility plugins, correlate findings", lab:"mem_forensics.py — runs pslist, malfind, netstat, yarascan, generates unified report", usecase:"Memory forensics at scale: batch analyse multiple memory dumps automatically", output:"Memory forensics report: hidden processes, injected code, network connections, YARA hits", code:`import subprocess, json

VOL = 'python3 ~/tools/volatility3/vol.py'

def run_plugin(dump: str, plugin: str, extra='') -> str:
    cmd = f"{VOL} -f {dump} {plugin} {extra} --output json"
    result = subprocess.run(cmd.split(), capture_output=True, text=True)
    try: return json.loads(result.stdout)
    except: return result.stdout

def full_analysis(dump: str) -> dict:
    return {
        'processes': run_plugin(dump, 'windows.pslist'),
        'malfind':   run_plugin(dump, 'windows.malfind'),
        'network':   run_plugin(dump, 'windows.netstat'),
    }` },
          { day:47, lang:"PYTHON", title:"Malware Family Classification", concept:"Feature extraction, similarity hashing (ssdeep), import hash clustering, ML basics", task:"Build a malware classifier: extract features, compute IMPHASH, cluster by similarity", lab:"classifier.py — groups malware samples by family using IMPHASH + section entropy clustering", usecase:"Process 1000 samples, group into families, find new variants. Threat intel automation.", output:"samples.json with clusters: each cluster = one malware family. 85%+ classification accuracy.", code:`import pefile, hashlib

def imphash(path: str) -> str:
    pe = pefile.PE(path)
    if not hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'): return 'none'
    return pe.get_imphash()

# Cluster by IMPHASH → same family
from collections import defaultdict
families = defaultdict(list)
for sample in samples:
    ih = imphash(sample)
    families[ih].append(sample)
print(f"Found {len(families)} distinct malware families")` },
          { day:48, lang:"BASH+PYTHON", title:"CAPA — Capability Detection Automation", concept:"CAPE/capa tool, ATT&CK mapping, capability reports, batch analysis", task:"Automate capa on 50 samples, extract ATT&CK techniques, build capability heatmap", lab:"capa_batch.sh + heatmap.py — batch capa analysis + ATT&CK Navigator JSON output", usecase:"Quickly map 50 malware samples to ATT&CK techniques without manual analysis", output:"ATT&CK Navigator JSON heatmap. Techniques sorted by frequency across sample set.", code:`#!/bin/bash
# batch_capa.sh
for sample in samples/*; do
    name=$(basename "$sample")
    capa --json "$sample" 2>/dev/null > "capa_results/${name}.json" || true
done

# heatmap.py — aggregate ATT&CK techniques from all capa JSON files
# → navigator_layer.json for ATT&CK Navigator import` },
          { day:49, lang:"ALL", title:"Week 7 Project — Malware Triage Tool", concept:"PE analysis + YARA + Volatility + capa into single triage workflow", task:"triage.py — input: malware sample → output: full triage report in 60 seconds", lab:"Test against 5 samples from MalwareBazaar. Validate detection accuracy.", usecase:"L1 SOC tool: give analyst complete picture before escalating to malware analyst", output:"triage_report.html: risk score, family hint, ATT&CK techniques, IOCs, recommended actions", code:`# triage.py --sample malware.exe --output report/
# 1. file type + hashes (2s)
# 2. PE analysis: sections, imports, entropy (5s)
# 3. YARA scan: 50 rules (3s)
# 4. strings extraction + IOC extraction (5s)
# 5. capa analysis: ATT&CK techniques (30s)
# 6. risk scoring + report generation (5s)
# Total: ~50 seconds. Full triage without execution.` },
        ]
      },
      {
        week:8, title:"Advanced Detection Engineering", color:C.green,
        focus:"Production detection rules, SIEM tuning, statistical anomaly detection",
        challenge:"Build a complete detection-as-code pipeline: SIGMA → test → deploy → monitor → tune",
        days:[
          { day:50, lang:"PYTHON", title:"Statistical Anomaly Detection", concept:"Z-score, IQR, rolling statistics, time-series analysis, threshold tuning", task:"Build statistical beaconing detector from MOD-04 — extend with adaptive thresholds", lab:"anomaly_detector.py — configurable statistical detector for multiple anomaly types", usecase:"Detect novel attacks that don't match signatures but deviate from baseline behaviour", output:"Beaconing detected at CV < 15%. False positive rate < 5% on 30-day baseline.", code:`from collections import defaultdict
import math, statistics

def detect_beaconing(connections: dict, min_n=5, max_cv=25.0):
    suspects = []
    for (src,dst,port), timestamps in connections.items():
        if len(timestamps) < min_n: continue
        timestamps.sort()
        intervals = [timestamps[i+1]-timestamps[i] for i in range(len(timestamps)-1)]
        intervals = [x for x in intervals if 10 < x < 7200]
        if len(intervals) < 3: continue
        mean = statistics.mean(intervals)
        if mean == 0: continue
        cv = (statistics.stdev(intervals)/mean)*100
        if cv <= max_cv:
            suspects.append({'src':src,'dst':dst,'cv':round(cv,1),'mean_s':round(mean,1)})
    return sorted(suspects, key=lambda x:x['cv'])` },
          { day:51, lang:"PYTHON", title:"Machine Learning for Security (Intro)", concept:"scikit-learn basics, feature engineering for security data, Random Forest, evaluation metrics", task:"Build ML classifier: benign vs malicious network traffic using extracted features", lab:"ml_classifier.py — train on labeled PCAP features, evaluate precision/recall, export model", usecase:"ML-based detection: catches novel threats that signature rules miss", output:"Model accuracy > 92% on test set. ROC curve plotted. Model saved for inference.", code:`from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pandas as pd

# Feature engineering from connection data
features = ['bytes_in','bytes_out','duration','packet_count',
            'dest_port','protocol','connection_count_per_hour']

X = df[features]
y = df['label']  # 0=benign, 1=malicious

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
clf = RandomForestClassifier(n_estimators=100, max_depth=10)
clf.fit(X_train, y_train)
print(classification_report(y_test, clf.predict(X_test)))` },
          { day:52, lang:"BASH+PYTHON", title:"Detection-as-Code Pipeline", concept:"Git-based detection management, CI/CD for rules, automated testing, deployment", task:"Build GitHub Actions pipeline: commit SIGMA rule → auto-test → deploy to SIEM", lab:"detection-as-code/ — git repo with SIGMA rules + pytest + GitHub Actions CI", usecase:"Enterprise detection teams use detection-as-code to manage 1000s of rules with quality gates", output:"GitHub Actions passes: SIGMA syntax valid, no FPs on 30-day baseline, deployed to ELK", code:`# .github/workflows/detections.yml
name: Detection Testing
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pip install pySigma pytest
      - run: sigma check rules/**/*.yml       # Syntax validation
      - run: python3 tests/test_rules.py       # FP testing on baseline
      - run: sigma convert -t elasticsearch rules/ > es_rules.json  # Convert
      - run: python3 deploy/push_to_elk.py es_rules.json  # Deploy` },
          { day:53, lang:"PYTHON", title:"Automated Alert Triage & Enrichment", concept:"Alert correlation, MITRE ATT&CK enrichment, risk scoring, auto-ticketing", task:"Alert enricher from MOD-04 — extend with ATT&CK context, MISP enrichment, Jira tickets", lab:"alert_enricher.py — production-grade enrichment with all integrations", usecase:"SOC automation: reduce L1 analyst manual work from 15min to 2min per alert", output:"Enriched alert: risk score + ATT&CK context + IOC reputation + recommended actions + Jira ticket", code:`# Extended alert_enricher.py from MOD-04
# New additions:
# + ATT&CK technique context from mitreattack-python
# + MISP IOC lookup
# + Jira ticket creation via REST API
# + Slack/Teams notification with action buttons
# + Automated host isolation via EDR API (CrowdStrike/SentinelOne)

from mitreattack.stix20 import MitreAttackData
attack = MitreAttackData('enterprise-attack.json')

def get_technique_context(technique_id: str) -> dict:
    t = attack.get_technique_by_id(technique_id)
    return {'name':t.name,'tactic':t.kill_chain_phases,'mitigations':t.mitigations}` },
          { day:54, lang:"PYTHON", title:"Threat Hunting Automation", concept:"Hypothesis-driven hunting, automated search, evidence collection, finding documentation", task:"Automated threat hunt: run 20 hunting queries, collect hits, generate hunt report", lab:"threat_hunter.py — runs SIGMA queries via ELK API, collects results, generates report", usecase:"SOC proactive hunting: analyst defines hypothesis, automation does the data collection", output:"Hunt report: hypotheses tested, hits found, false positives noted, IOCs extracted", code:`from elasticsearch import Elasticsearch
import json

def hunt(es: Elasticsearch, query: str, index: str = 'security-*') -> dict:
    body = {'query': {'query_string': {'query': query}}, 'size': 100}
    result = es.search(index=index, body=body)
    return {
        'total': result['hits']['total']['value'],
        'hits':  [h['_source'] for h in result['hits']['hits']]
    }

HUNTS = [
    ('PowerShell Download', 'process.name:powershell AND cmdline:*DownloadString*'),
    ('LSASS Access',        'event.id:10 AND target.image:*lsass*'),
    ('Shadow Deletion',     'cmdline:*vssadmin* AND cmdline:*delete* AND cmdline:*shadows*'),
]` },
          { day:55, lang:"ALL", title:"SIEM Tuning & Noise Reduction", concept:"Alert fatigue, FP tuning, contextual suppression, dynamic thresholds, time-based rules", task:"Audit 30 days of SIEM alerts, identify top 10 noisy rules, tune them to < 5 FP/day", lab:"siem_tuner.py — analyses alert history, identifies FP patterns, suggests suppressions", usecase:"Production SIEM management: most alerts are noise. Tuning is continuous and critical.", output:"Tuning report: 10 rules tuned. Alert volume reduced 60%. True-positive rate increased 40%.", code:`# siem_tuner.py
# 1. Pull 30-day alert history from ES
# 2. Identify rules with >10 alerts/day
# 3. Cluster FP alerts by: process, user, host, time-of-day
# 4. Suggest suppression filters for each cluster
# 5. Calculate projected alert reduction
# 6. Generate tuning recommendations as SIGMA filter additions

# Example tuning output:
# Rule: PowerShell_Download
#   FP pattern: user=backup_svc, cmdline=*SCCM*
#   Suggestion: add filter: filter_sccm: {User: 'backup_svc'}
#   Projected reduction: 47 FP/day → 2 FP/day` },
          { day:56, lang:"ALL", title:"Week 8 Project — Detection Platform", concept:"Complete detection engineering platform: code → test → deploy → tune cycle", task:"Full platform: 20 SIGMA rules + automated testing + ELK deployment + tuning dashboard", lab:"detection_platform/ — production-ready detection-as-code with CI/CD and dashboards", usecase:"This is what enterprise detection engineering teams build. Fully automated quality pipeline.", output:"Complete detection platform deployed. 20 rules running. Dashboard shows coverage + quality.", code:`# Final platform structure:
# detection_platform/
# ├── rules/          # 20 SIGMA .yml rules
# ├── tests/          # pytest rule validation
# ├── deploy/         # push_to_elk.py, push_to_splunk.py
# ├── tune/           # siem_tuner.py, fp_analyzer.py
# ├── dashboards/     # Kibana dashboard JSON exports
# ├── .github/        # CI/CD workflows
# └── README.md       # Runbook` },
        ]
      },
    ]
  },

  month3: {
    label:"MONTH 3", title:"Advanced Tooling & Capstone", color:C.purple,
    weeks:[
      {
        week:9, title:"Advanced Python Security Patterns", color:C.purple,
        focus:"Production-grade patterns: async, caching, plugin systems, API design",
        challenge:"Build an async IOC enrichment engine that processes 1000 IOCs/minute with rate limiting",
        days:[
          { day:57, lang:"PYTHON", title:"Async Security Tools", concept:"asyncio, aiohttp, async context managers, semaphores for rate limiting", task:"Async VT enricher: process 100 IOCs concurrently with strict rate limiting", lab:"async_enricher.py — asyncio-based multi-source enrichment, 100x faster than sync", usecase:"Production enrichment at scale: thousands of IOCs per minute. SOC automation speed.", output:"100 IOCs enriched in < 30 seconds vs 400 seconds synchronously.", code:`import asyncio, aiohttp

async def enrich_ip(session, ip, semaphore):
    async with semaphore:
        url = f'https://www.virustotal.com/api/v3/ip_addresses/{ip}'
        async with session.get(url, headers={'x-apikey':VT_KEY}) as r:
            data = await r.json()
            await asyncio.sleep(15)  # VT free: 4/min rate limit
            return ip, data

async def bulk_enrich(ips):
    sem = asyncio.Semaphore(4)  # 4 concurrent max
    async with aiohttp.ClientSession() as session:
        tasks = [enrich_ip(session, ip, sem) for ip in ips]
        return await asyncio.gather(*tasks, return_exceptions=True)` },
          { day:58, lang:"PYTHON", title:"Plugin Architecture & Extensibility", concept:"ABC, entry_points, importlib, dynamic loading, hook systems", task:"Refactor detection pipeline with plugin system: add new data sources/detectors without changing core", lab:"plugin_engine.py — dynamic plugin loader with hooks for: ingest, detect, enrich, alert", usecase:"Enterprise tools need extensibility. New data sources added by dropping in a Python file.", output:"New plugin detected and loaded automatically on next run without modifying core.", code:`import importlib, pkgutil
from abc import ABC, abstractmethod

class DetectorPlugin(ABC):
    name: str = "unnamed"
    
    @abstractmethod
    def detect(self, event: dict) -> list[dict]: ...

def load_plugins(pkg_dir: str) -> list[DetectorPlugin]:
    plugins = []
    for _, name, _ in pkgutil.iter_modules([pkg_dir]):
        mod = importlib.import_module(f'plugins.{name}')
        for attr in dir(mod):
            cls = getattr(mod, attr)
            if isinstance(cls, type) and issubclass(cls, DetectorPlugin) and cls is not DetectorPlugin:
                plugins.append(cls())
    return plugins` },
          { day:59, lang:"PYTHON", title:"REST API for Security Tools", concept:"FastAPI, Pydantic models, API key auth, rate limiting, OpenAPI docs", task:"Build REST API for your toolkit: POST /scan, GET /iocs, POST /analyze endpoints", lab:"security_api.py — FastAPI app exposing all toolkit functions via documented API", usecase:"Share tools with team via API. Integrate with SOAR platforms. Webhook receivers.", output:"API running at localhost:8000. /docs shows all endpoints. Auth working. Rate limiting active.", code:`from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Security Toolkit API", version="1.0.0")

class ScanRequest(BaseModel):
    target: str; ports: str = "1-1024"; format: str = "json"

@app.post("/scan", tags=["scanning"])
async def scan(req: ScanRequest, x_api_key: str = Header(...)):
    if x_api_key != API_KEY: raise HTTPException(401, "Invalid API key")
    results = await async_scan(req.target, req.ports)
    return results` },
          { day:60, lang:"PYTHON", title:"Caching, Deduplication & Performance", concept:"functools.lru_cache, TTL caches, Redis basics, hash-based dedup, profiling", task:"Add TTL caching to VT enricher: avoid re-querying same IOC within 24 hours", lab:"cache_layer.py — disk-based TTL cache for API responses with SQLite backend", usecase:"API quota conservation: don't re-query same IOC. Save $100s/month in API costs.", output:"VT lookups cached. Same IOC queried once per 24h. 90% reduction in API calls.", code:`import sqlite3, json, time, hashlib

class TTLCache:
    def __init__(self, db='cache.db', ttl=86400):
        self.ttl = ttl
        self.conn = sqlite3.connect(db)
        self.conn.execute('''CREATE TABLE IF NOT EXISTS cache
            (key TEXT PRIMARY KEY, value TEXT, expires REAL)''')
    
    def get(self, key: str):
        row = self.conn.execute('SELECT value,expires FROM cache WHERE key=?',[key]).fetchone()
        if row and row[1] > time.time(): return json.loads(row[0])
        return None
    
    def set(self, key: str, value):
        self.conn.execute('REPLACE INTO cache VALUES(?,?,?)',
            [key, json.dumps(value), time.time()+self.ttl])
        self.conn.commit()` },
          { day:61, lang:"PYTHON", title:"Monitoring & Observability for Tools", concept:"Prometheus metrics, structured logging, health checks, alerting on tool failures", task:"Add observability to detection pipeline: metrics, structured logs, health endpoint", lab:"observability.py — Prometheus metrics + structured logging + /health endpoint", usecase:"Production tools need monitoring. How do you know your detection pipeline is running?", output:"Grafana dashboard shows: alerts/minute, enrichment latency, API error rates, queue depth.", code:`from prometheus_client import Counter, Histogram, start_http_server
import time, logging, json

# Metrics
alerts_total    = Counter('security_alerts_total', 'Total alerts', ['rule','severity'])
enrich_duration = Histogram('enrichment_duration_seconds', 'Enrichment time')
iocs_processed  = Counter('iocs_processed_total', 'IOCs processed', ['type'])

# Structured logging
log = logging.getLogger('security_pipeline')
log.addHandler(logging.StreamHandler())
log.setLevel(logging.INFO)

def log_alert(alert: dict):
    log.info(json.dumps({'event':'alert','rule':alert['rule'],'severity':alert['severity']}))
    alerts_total.labels(rule=alert['rule'], severity=alert['severity']).inc()` },
          { day:62, lang:"ALL", title:"Code Review & Security of Scripts", concept:"Bandit (SAST), semgrep rules for Python, secret scanning, dependency audit", task:"Security audit your entire toolkit: bandit scan, dependency CVEs, secret check", lab:"Run bandit + safety + semgrep on all scripts. Fix all HIGH severity findings.", usecase:"Security professionals must write secure code. Your tools are targets too.", output:"Bandit report: 0 HIGH/CRITICAL. All dependencies up to date. No secrets found.", code:`pip install bandit safety semgrep

# Static analysis
bandit -r security_toolkit/ -ll  # Show medium+ severity

# Dependency vulnerabilities
safety check

# Custom semgrep rules for security anti-patterns
semgrep --config p/python security_toolkit/

# Fix common findings:
# B101: assert removed in optimised Python → use if/raise
# B108: temp file without mkstemp → use tempfile.mktemp
# B506: yaml.load → yaml.safe_load` },
          { day:63, lang:"ALL", title:"Week 9 Project — API-First Toolkit", concept:"Package entire toolkit as REST API with auth, rate limiting, docs, and monitoring", task:"Deploy security_toolkit as production API on localhost with Nginx reverse proxy", lab:"docker-compose.yml — FastAPI + Nginx + Prometheus + Grafana stack", usecase:"Share tools with team without shell access. Integrate with SOAR. Webhook compatible.", output:"Fully deployed API stack. Grafana dashboard live. API docs at /docs. Auth working.", code:`# docker-compose.yml
services:
  api:        {build: ., ports: ['8000:8000']}
  nginx:      {image: nginx, ports: ['443:443'], volumes: ['./nginx.conf:/etc/nginx/nginx.conf']}
  prometheus: {image: prom/prometheus, ports: ['9090:9090']}
  grafana:    {image: grafana/grafana, ports: ['3000:3000']}` },
        ]
      },
      {
        week:10, title:"Month 3: Advanced Scripting Patterns", color:C.cyan,
        focus:"PowerShell advanced, cross-platform scripting, enterprise deployment",
        challenge:"Build a cross-platform (Linux/Windows) endpoint security audit tool",
        days:[
          { day:64, lang:"POWERSHELL", title:"Advanced PowerShell: Classes & DSC", concept:"PowerShell classes, DSC resources, module development, Pester testing", task:"Create a PowerShell security module: reusable functions with proper module structure", lab:"SecurityAudit PowerShell module: Get-SecurityScore, Test-Hardening, Get-Persistence", usecase:"Enterprise IT teams use PowerShell modules. Your functions become part of their tooling.", output:"SecurityAudit.psm1 module: installable, importable, Pester tested, PSD1 manifest.", code:`# SecurityAudit.psm1
class SecurityScore {
    [string]$Category; [int]$Score; [string]$Finding
    SecurityScore([string]$c, [int]$s, [string]$f) {
        $this.Category=$c; $this.Score=$s; $this.Finding=$f
    }
}

function Get-SecurityScore {
    [CmdletBinding()]
    param([string]$ComputerName = $env:COMPUTERNAME)
    
    $scores = @()
    # Check: firewall, AV, patches, local admins, password policy
    $scores += [SecurityScore]::new('Firewall', (Test-FirewallStatus), 'Windows Firewall state')
    return $scores | Sort-Object Score
}` },
          { day:65, lang:"PYTHON+BASH", title:"Cross-Platform Security Scripts", concept:"platform.system(), conditional execution, Windows subsystem for Linux, Docker containers", task:"Endpoint auditor that runs identically on Linux and Windows, produces same report format", lab:"endpoint_audit.py — cross-platform: detects OS, uses platform-specific checks, unified output", usecase:"Enterprise tools must work everywhere. One script for 10,000 Linux + Windows endpoints.", output:"Same JSON report format on Linux and Windows. CIS benchmark checks pass on both.", code:`import platform, subprocess

OS = platform.system()

def get_listening_ports() -> list:
    if OS == 'Windows':
        out, _ = run(['netstat', '-ano'])
    else:
        out, _ = run(['ss', '-antp'])
    return parse_ports(out, OS)

def check_password_policy() -> dict:
    if OS == 'Windows':
        out, _ = run(['net', 'accounts'])
        return parse_windows_password_policy(out)
    else:
        return parse_linux_password_policy('/etc/login.defs')` },
          { day:66, lang:"PYTHON", title:"Automated Compliance Checking (CIS)", concept:"CIS benchmarks, automated control testing, evidence collection, remediation scripts", task:"CIS Level 1 automated checker for Ubuntu: test 50 controls, generate compliance report", lab:"cis_checker.py — 50 CIS Ubuntu controls tested automatically with evidence collection", usecase:"Compliance automation: replace manual CIS audit with automated script. Saves 40+ hours.", output:"CIS compliance report: 50 controls, pass/fail/not-applicable, evidence, remediation steps", code:`CIS_CHECKS = [
    {
        'id': '1.1.1.1', 'title': 'Ensure cramfs is disabled',
        'check': lambda: run('modprobe -n -v cramfs 2>&1 | grep -q "install /bin/true"'),
        'remediate': 'echo "install cramfs /bin/true" >> /etc/modprobe.d/cramfs.conf'
    },
    {
        'id': '5.2.4', 'title': 'Ensure SSH root login is disabled',
        'check': lambda: 'PermitRootLogin no' in open('/etc/ssh/sshd_config').read(),
        'remediate': 'sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config'
    },
]` },
          { day:67, lang:"BASH+PYTHON", title:"Incident Response Automation", concept:"IR playbook automation, evidence collection, containment actions, timeline generation", task:"Automated IR toolkit: detect → contain → collect → report pipeline with playbooks", lab:"ir_toolkit/ — automated playbooks for ransomware, credential dump, webshell scenarios", usecase:"IR at scale: automate tier-1 response. Analyst gets enriched alert + pre-collected evidence.", output:"IR playbook executed in < 2 minutes. Evidence collected, host isolated, report generated.", code:`# ir_playbook.py
PLAYBOOKS = {
    'ransomware':    [isolate_host, capture_memory, collect_iocs, notify_team],
    'credential_dump': [isolate_host, reset_passwords, collect_iocs, hunt_lateral],
    'webshell':      [preserve_webshell, capture_memory, analyse_traffic, notify_team],
}

def run_playbook(alert_type: str, host: str):
    print(f"[IR] Running {alert_type} playbook on {host}")
    for action in PLAYBOOKS.get(alert_type, []):
        print(f"  → {action.__name__}")
        result = action(host)
        log_action(action.__name__, result)` },
          { day:68, lang:"PYTHON", title:"Network Defence: Firewall Automation", concept:"iptables/nftables Python bindings, dynamic blocklists, auto-response to attacks", task:"Auto-blocking script: integrates with detection pipeline, auto-blocks attacking IPs", lab:"auto_block.py — receives alerts, validates IPs, adds to iptables/nftables, sends notifications", usecase:"Active defence: reduce mean time to block (MTTB) from hours to seconds", output:"Attacking IP blocked within 5 seconds of detection. Automatically unblocked after TTL.", code:`import subprocess, ipaddress, time

class FirewallManager:
    def __init__(self, ttl=3600):
        self.blocked = {}  # ip → unblock_time
        self.ttl = ttl
    
    def block_ip(self, ip: str) -> bool:
        try:
            ipaddress.ip_address(ip)  # Validate
        except ValueError: return False
        
        subprocess.run(['iptables','-I','INPUT','-s',ip,'-j','DROP'], check=True)
        self.blocked[ip] = time.time() + self.ttl
        print(f"[BLOCKED] {ip} (TTL={self.ttl}s)")
        return True
    
    def unblock_expired(self):
        for ip, exp in list(self.blocked.items()):
            if time.time() > exp:
                subprocess.run(['iptables','-D','INPUT','-s',ip,'-j','DROP'])
                del self.blocked[ip]` },
          { day:69, lang:"ALL", title:"Documentation & Knowledge Base", concept:"MkDocs, docstrings, runbooks, architecture diagrams (Mermaid), video walkthroughs", task:"Document your entire toolkit: MkDocs site with: API reference, runbooks, architecture", lab:"docs/ — MkDocs site with all tool documentation. Deploy to GitHub Pages.", usecase:"Professional tools have documentation. Docs separate a portfolio project from a script.", output:"MkDocs site deployed at username.github.io/security-toolkit. All tools documented.", code:`# mkdocs.yml
site_name: Security Toolkit
theme: {name: material, palette: {scheme: slate}}
nav:
  - Home: index.md
  - Tools:
    - Port Scanner: tools/scanner.md
    - IOC Extractor: tools/ioc.md
    - FIM: tools/fim.md
    - Detection Engine: tools/detection.md
  - API Reference: api.md
  - Runbooks: runbooks/
  
# pip install mkdocs-material mkdocstrings[python]
# mkdocs serve` },
          { day:70, lang:"ALL", title:"Week 10 Project — Enterprise Audit Tool", concept:"CIS compliance + persistence hunting + IR automation in one cross-platform tool", task:"enterprise_audit.py — full Linux/Windows audit: CIS checks + persistence + network + report", lab:"Run on your Ubuntu system, fix findings, run again, verify improvement", usecase:"External and internal audit tool. Run before and after hardening to measure improvement.", output:"Audit report: compliance score, critical findings, remediation steps, risk rating.", code:`# enterprise_audit.py workflow:
# 1. OS detection + system info
# 2. CIS Level 1 checks (50 controls)
# 3. Persistence enumeration
# 4. Network exposure audit (listening ports, firewall rules)
# 5. User account audit (privileged accounts, SSH keys)
# 6. Log configuration audit (what's being logged)
# 7. Patch level assessment
# 8. HTML + JSON report generation
# Usage: python3 enterprise_audit.py --output audit_$(date +%Y%m%d).html` },
        ]
      },
    ]
  },
};

/* All capstone content */
const CAPSTONE = {
  title:"CAPSTONE PROJECT: SENTRY — Security Intelligence Platform",
  duration:"Days 71-90 (3 weeks)",
  description:"Build a production-grade security intelligence platform that combines all skills learned across 3 months. This is a real, deployable security tool.",
  components:[
    { name:"Data Collection Layer", tech:"Bash + Python", desc:"Multi-source log collection: syslog, Windows events, network PCAP, endpoint telemetry. Normalises to ECS format.", files:["collector/syslog_agent.sh","collector/windows_agent.ps1","collector/normaliser.py"] },
    { name:"Detection Engine", tech:"Python + YARA + SIGMA", desc:"25 SIGMA rules + YARA file scanner + statistical anomaly detector + ML classifier. Processes 10,000 events/minute.", files:["engine/sigma_runner.py","engine/yara_scanner.py","engine/anomaly.py","rules/"] },
    { name:"Enrichment Pipeline", tech:"Python async", desc:"Async IOC enrichment: VirusTotal, AbuseIPDB, MISP, Shodan. TTL cache. Rate limiting. 1000 IOCs/minute.", files:["enrichment/vt_client.py","enrichment/cache.py","enrichment/pipeline.py"] },
    { name:"REST API", tech:"FastAPI", desc:"Full API: /scan /analyze /hunt /report. API key auth. Rate limiting. OpenAPI docs. Webhook support.", files:["api/main.py","api/auth.py","api/models.py"] },
    { name:"Web Dashboard", tech:"HTML/CSS/JS", desc:"Real-time dashboard: alert feed, IOC map, detection coverage heatmap, trend charts.", files:["dashboard/index.html","dashboard/app.js","dashboard/charts.js"] },
    { name:"IR Automation", tech:"Python + Bash", desc:"4 automated playbooks: ransomware, credential dump, webshell, lateral movement. Auto-containment.", files:["ir/playbooks.py","ir/containment.sh","ir/evidence_collector.sh"] },
    { name:"Deployment", tech:"Docker + systemd", desc:"Docker Compose stack. Systemd service files. GitHub Actions CI/CD. MkDocs documentation site.", files:["docker-compose.yml","deploy/","docs/",".github/workflows/"] },
  ],
  deliverables:[
    "GitHub repository with 500+ lines of production-quality code",
    "Full test suite: pytest 50+ tests, > 85% coverage",
    "CI/CD pipeline: automated testing and deployment on push",
    "API documentation: auto-generated from FastAPI + OpenAPI",
    "User documentation: MkDocs site with runbooks",
    "Architecture diagram: Mermaid/draw.io system design",
    "Demo video: 5-minute walkthrough of all features",
    "Technical writeup: blog post explaining design decisions",
  ],
  week_breakdown:[
    { week:"Week 11 (Days 71-77)", focus:"Core infrastructure — collection, normalisation, detection engine", goals:["collector agents running on Linux + Windows VM","SIGMA runner processing 1000 events/min","YARA scanner integrated","Unit tests for all core modules"] },
    { week:"Week 12 (Days 78-84)", focus:"Enrichment, API, and dashboard", goals:["Async enrichment pipeline with caching","FastAPI REST API with auth","Real-time web dashboard","Integration tests end-to-end"] },
    { week:"Week 13 (Days 85-90)", focus:"IR automation, deployment, documentation, polish", goals:["4 IR playbooks automated","Docker Compose deployment","GitHub Actions CI/CD","MkDocs documentation site","Demo video recorded"] },
  ]
};

const COMMON_ERRORS = [
  { error:"Permission denied when running script", fix:"chmod +x script.sh  OR  bash script.sh  OR  Add #!/usr/bin/env bash shebang", lang:"Bash" },
  { error:"set -u: unbound variable", fix:"Check spelling: $VARNAME. Use ${VAR:-default} for optional vars. Always quote variables.", lang:"Bash" },
  { error:"[: ==: unary operator expected", fix:"Always double-quote: [[ \"$var\" == \"value\" ]] not [ $var == value ]", lang:"Bash" },
  { error:"ModuleNotFoundError: No module named 'pefile'", fix:"pip install pefile  OR activate venv first: source ~/.venvs/security/bin/activate", lang:"Python" },
  { error:"ConnectionRefusedError: [Errno 111]", fix:"Port is closed or host down. Check: nc -zv host port. Add try/except around socket code.", lang:"Python" },
  { error:"PermissionError when running as non-root", fix:"Use sudo for privileged ops. Or: add user to specific groups. Avoid running entire script as root.", lang:"Python" },
  { error:"JSONDecodeError: Expecting value", fix:"Check the raw response first: print(resp.read()). Handle empty responses: if not data: return {}", lang:"Python" },
  { error:"Execution of scripts is disabled on this system", fix:"Set-ExecutionPolicy -Scope Process Bypass  OR  run as: powershell -ExecutionPolicy Bypass -File script.ps1", lang:"PowerShell" },
  { error:"The term 'Get-WinEvent' is not recognized", fix:"Requires Windows PowerShell or PowerShell 7 on Windows. Not available on Linux PS7.", lang:"PowerShell" },
  { error:"Access is denied (Event Log)", fix:"Run PowerShell as Administrator. Security log requires admin rights.", lang:"PowerShell" },
  { error:"Script works manually but not in cron", fix:"Use full paths (/usr/bin/python3 not python3). Add: PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin to crontab.", lang:"Bash" },
  { error:"inotifywait: command not found", fix:"sudo apt install inotify-tools", lang:"Bash" },
];

/* ── UI COMPONENTS ── */

function SectionHeader({ label, title, color }) {
  return (
    <div style={{borderBottom:`1px solid ${color}33`,paddingBottom:10,marginBottom:20}}>
      <div style={{color,fontSize:9,fontWeight:700,letterSpacing:"0.2em",marginBottom:4}}>{label}</div>
      <div style={{color:C.bright,fontSize:16,fontWeight:700,fontFamily:"'Courier New',monospace",letterSpacing:"0.05em"}}>{title}</div>
    </div>
  );
}

function DayCard({ d }) {
  const [open, setOpen] = useState(false);
  const langC = {BASH:C.cyan,PYTHON:C.green,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue,"PYTHON+BASH":C.amber,"YARA+PYTHON":C.purple}[d.lang]||C.blue;
  return (
    <div style={{border:`1px solid ${open?langC+"55":C.border}`,borderRadius:4,marginBottom:6}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:open?langC+"0a":C.bg2}}>
        <span style={{background:langC+"22",color:langC,fontSize:8,padding:"1px 6px",borderRadius:2,minWidth:56,textAlign:"center",fontFamily:"'Courier New',monospace",fontWeight:700}}>{d.lang}</span>
        <span style={{color:C.dim,fontSize:9,minWidth:44,fontFamily:"'Courier New',monospace"}}>DAY {d.day}</span>
        <span style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace"}}>{d.title}</span>
        <span style={{marginLeft:"auto",color:C.dim,fontSize:10}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"12px 14px",background:"#040810",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[
              {label:"CONCEPT",   text:d.concept},
              {label:"TASK",      text:d.task},
              {label:"LAB",       text:d.lab},
              {label:"USE CASE",  text:d.usecase},
            ].map((item,i)=>(
              <div key={i}>
                <div style={{color:langC,fontSize:8,letterSpacing:"0.12em",marginBottom:3}}>{item.label}</div>
                <div style={{color:C.dim,fontSize:11,lineHeight:1.6,fontFamily:"'Courier New',monospace"}}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:10}}>
            <div style={{color:C.green,fontSize:8,letterSpacing:"0.12em",marginBottom:4}}>EXPECTED OUTPUT</div>
            <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.5}}>{d.output}</div>
          </div>
          <div>
            <div style={{color:C.amber,fontSize:8,letterSpacing:"0.12em",marginBottom:4}}>CODE EXAMPLE</div>
            <pre style={{background:"#020508",border:`1px solid ${C.border}`,borderLeft:`3px solid ${langC}`,borderRadius:3,padding:"10px 12px",color:langC,fontSize:10,fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,lineHeight:1.6}}>
              {d.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekBlock({ week: w }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:`1px solid ${open?w.color+"44":C.border}`,borderRadius:5,marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:open?w.color+"0a":C.bg2}}>
        <span style={{background:w.color+"22",color:w.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:2,fontFamily:"'Courier New',monospace",minWidth:64,textAlign:"center"}}>WEEK {w.week}</span>
        <span style={{color:C.bright,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:700}}>{w.title}</span>
        <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:C.dim,fontSize:9}}>{w.days.length} days</span>
          <span style={{color:C.dim}}>{open?"▲":"▼"}</span>
        </span>
      </div>
      {open&&(
        <div style={{padding:"14px 16px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <div style={{marginBottom:14}}>
            <div style={{color:w.color,fontSize:9,letterSpacing:"0.12em",marginBottom:4}}>WEEK FOCUS</div>
            <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace"}}>{w.focus}</div>
          </div>
          <div style={{marginBottom:14,padding:"8px 12px",background:"#050a15",border:`1px solid ${w.color}33`,borderRadius:3}}>
            <div style={{color:C.amber,fontSize:9,letterSpacing:"0.12em",marginBottom:4}}>WEEKLY CHALLENGE 🏆</div>
            <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.5}}>{w.challenge}</div>
          </div>
          <div>
            <div style={{color:w.color,fontSize:9,letterSpacing:"0.12em",marginBottom:8}}>DAILY PLAN</div>
            {w.days.map(d=><DayCard key={d.day} d={d}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthBlock({ month, data }) {
  const [open, setOpen] = useState(month==="month1");
  const color = data.color;
  const totalDays = data.weeks.reduce((s,w)=>s+w.days.length,0);
  return (
    <div style={{border:`1px solid ${open?color+"55":C.border}`,borderRadius:6,marginBottom:12}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,background:open?color+"0a":C.bg2}}>
        <span style={{background:color+"22",color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>{data.label}</span>
        <div>
          <div style={{color:C.bright,fontSize:13,fontFamily:"'Courier New',monospace",fontWeight:700}}>{data.title}</div>
          <div style={{color:C.dim,fontSize:9,marginTop:2}}>{data.weeks.length} weeks · {totalDays} days</div>
        </div>
        <span style={{marginLeft:"auto",color:C.dim,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"16px 18px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          {data.weeks.map(w=><WeekBlock key={w.week} week={w}/>)}
        </div>
      )}
    </div>
  );
}

export default function ScriptingPlan() {
  const [activeTab, setActiveTab] = useState("plan");
  const TABS = [
    {id:"plan",      label:"90-DAY PLAN",    icon:"📅"},
    {id:"tools",     label:"TOOLS SETUP",    icon:"🔧"},
    {id:"errors",    label:"ERROR GUIDE",    icon:"🐛"},
    {id:"capstone",  label:"CAPSTONE",       icon:"🏆"},
    {id:"resources", label:"RESOURCES",      icon:"📚"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,20,40,0.05) 3px,rgba(0,20,40,0.05) 4px)"}}>

      {/* HEADER */}
      <div style={{background:"#000",borderBottom:`2px solid ${C.blue}33`,padding:"14px 24px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{background:C.blue+"22",border:`1px solid ${C.blue}55`,borderRadius:4,padding:"6px 14px",color:C.blue,fontSize:14,fontWeight:700,letterSpacing:"0.15em"}}>90D</div>
        <div>
          <div style={{color:C.bright,fontSize:15,fontWeight:700,letterSpacing:"0.08em"}}>SECURITY SCRIPTING MASTERY PLAN</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.12em",marginTop:2}}>BASH · PYTHON · POWERSHELL · RED TEAM · BLUE TEAM · DETECTION ENGINEERING · MALWARE ANALYSIS</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
          {[{c:C.blue,l:"MONTH 1"},{c:C.amber,l:"MONTH 2"},{c:C.purple,l:"MONTH 3"}].map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:m.c}}/>
              <span style={{color:m.c,fontSize:9,letterSpacing:"0.08em"}}>{m.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#000",borderBottom:`1px solid ${C.border}`,display:"flex"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            background:activeTab===t.id?C.bg3:"transparent",border:"none",
            borderBottom:activeTab===t.id?`2px solid ${C.blue}`:"2px solid transparent",
            borderTop:"2px solid transparent",
            color:activeTab===t.id?C.blue:"#1a3050",
            padding:"10px 18px",cursor:"pointer",fontSize:10,letterSpacing:"0.07em",
            fontFamily:"'Courier New',monospace",fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:"24px 28px",overflowY:"auto",background:C.bg}}>

        {/* ── PLAN TAB ── */}
        {activeTab==="plan"&&(
          <div>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:24}}>
              {[
                {label:"Total Days",    val:"90",   color:C.blue},
                {label:"Hours/Day",     val:"2-3",  color:C.cyan},
                {label:"Projects",      val:"15+",  color:C.green},
                {label:"Scripts Built", val:"50+",  color:C.amber},
                {label:"Languages",     val:"3",    color:C.purple},
                {label:"Capstone",      val:"1 Platform",color:C.red},
              ].map((s,i)=>(
                <div key={i} style={{border:`1px solid ${s.color}33`,borderRadius:4,padding:"10px 14px",background:s.color+"0a",textAlign:"center"}}>
                  <div style={{color:s.color,fontSize:18,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{s.val}</div>
                  <div style={{color:C.dim,fontSize:9,marginTop:3,letterSpacing:"0.08em"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Daily schedule */}
            <div style={{border:`1px solid ${C.border}`,borderRadius:5,marginBottom:20,overflow:"hidden"}}>
              <div style={{background:C.bg3,padding:"8px 14px",color:C.blue,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>DAILY SCHEDULE (2-3 hours)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
                {[
                  {time:"30 min",activity:"Review yesterday + concepts",color:C.cyan},
                  {time:"60 min",activity:"Hands-on coding: main task",color:C.green},
                  {time:"45 min",activity:"Lab exercise + debugging",color:C.amber},
                  {time:"15 min",activity:"Document + commit to git",color:C.purple},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 12px",borderRight:i<3?`1px solid ${C.border}`:"none",background:i%2?C.bg2:C.bg}}>
                    <div style={{color:s.color,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:4}}>{s.time}</div>
                    <div style={{color:C.dim,fontSize:11}}>{s.activity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Month blocks */}
            <MonthBlock month="month1" data={PLAN.month1}/>
            <MonthBlock month="month2" data={PLAN.month2}/>
            <MonthBlock month="month3" data={PLAN.month3}/>
          </div>
        )}

        {/* ── TOOLS TAB ── */}
        {activeTab==="tools"&&(
          <div>
            <SectionHeader label="ENVIRONMENT" title="Tools & Setup" color={C.cyan}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8,marginBottom:24}}>
              {TOOLS.map((t,i)=>(
                <div key={i} style={{border:`1px solid ${t.color}33`,borderRadius:4,padding:"10px 14px",background:t.color+"0a"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:16}}>{t.icon}</span>
                    <span style={{color:t.color,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{t.name}</span>
                  </div>
                  <div style={{color:C.dim,fontSize:10}}>{t.role}</div>
                </div>
              ))}
            </div>

            <div style={{border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden",marginBottom:16}}>
              <div style={{background:C.bg3,padding:"8px 14px",color:C.green,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>INITIAL SETUP COMMANDS</div>
              <pre style={{background:C.bg,padding:"16px",margin:0,color:C.cyan,fontSize:11,fontFamily:"'Fira Code','Courier New',monospace",lineHeight:1.8,overflowX:"auto"}}>
{`# Ubuntu — install all security scripting tools
sudo apt update && sudo apt install -y \\
    python3 python3-pip python3-venv git curl wget \\
    nmap netcat-openbsd tcpdump wireshark tshark \\
    inotify-tools auditd strace ltrace binwalk \\
    yara jq xmlstarlet shellcheck

# Python security virtual environment
python3 -m venv ~/.venvs/security
source ~/.venvs/security/bin/activate
pip install pefile yara-python requests scapy colorama \\
    fastapi uvicorn pytest bandit safety jinja2 \\
    elasticsearch pandas matplotlib

# Volatility 3 (memory forensics)
git clone https://github.com/volatilityfoundation/volatility3 ~/tools/volatility3
pip install -r ~/tools/volatility3/requirements.txt

# VS Code extensions (install via command palette)
# Python, Pylance, Bash IDE, PowerShell, GitLens,
# YARA, SigmaHQ (for SIGMA rules)

# Git setup
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
mkdir -p ~/workspace/security-toolkit
cd ~/workspace/security-toolkit && git init`}
              </pre>
            </div>

            <div style={{border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
              <div style={{background:C.bg3,padding:"8px 14px",color:C.purple,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>HOW TO EXECUTE SCRIPTS</div>
              <div style={{background:C.bg}}>
                {[
                  {lang:"Bash",   cmds:["chmod +x script.sh && ./script.sh","bash script.sh (no chmod needed)","bash -x script.sh (debug mode — prints each line)","bash -n script.sh (syntax check only)"]},
                  {lang:"Python", cmds:["python3 script.py --arg value","python3 -m module_name (run as module)","python3 -c 'code here' (one-liner)","python3 -i script.py (interactive after running)"]},
                  {lang:"PowerShell",cmds:["powershell -File script.ps1",".\\script.ps1 (in PS session)","pwsh script.ps1 (PowerShell 7 cross-platform)","Set-ExecutionPolicy Bypass -Scope Process"]},
                ].map((item,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                    <div style={{color:C.amber,fontSize:9,letterSpacing:"0.1em",marginBottom:6}}>{item.lang.toUpperCase()}</div>
                    {item.cmds.map((cmd,ci)=>(
                      <div key={ci} style={{fontFamily:"'Fira Code','Courier New',monospace",fontSize:11,color:C.cyan,marginBottom:4}}>$ {cmd}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ERRORS TAB ── */}
        {activeTab==="errors"&&(
          <div>
            <SectionHeader label="DEBUGGING" title="Common Errors & Fixes" color={C.red}/>
            <div style={{border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
              <div style={{background:"#0a0508",borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 80px"}}>
                {["ERROR","FIX","LANG"].map((h,i)=>(
                  <div key={i} style={{padding:"7px 12px",color:C.red,fontSize:9,letterSpacing:"0.1em",borderRight:i<2?`1px solid ${C.border}`:"none"}}>{h}</div>
                ))}
              </div>
              {COMMON_ERRORS.map((e,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",background:i%2?C.bg2:C.bg,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{padding:"8px 12px",color:C.red,fontSize:11,fontFamily:"'Fira Code','Courier New',monospace",borderRight:`1px solid ${C.border}`,lineHeight:1.5}}>{e.error}</div>
                  <div style={{padding:"8px 12px",color:C.green,fontSize:11,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`,lineHeight:1.5}}>{e.fix}</div>
                  <div style={{padding:"8px 12px",display:"flex",alignItems:"center"}}>
                    <span style={{background:({Bash:C.cyan,Python:C.green,PowerShell:C.purple}[e.lang]||C.blue)+"22",color:{Bash:C.cyan,Python:C.green,PowerShell:C.purple}[e.lang]||C.blue,fontSize:8,padding:"1px 6px",borderRadius:2}}>{e.lang}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CAPSTONE TAB ── */}
        {activeTab==="capstone"&&(
          <div>
            <SectionHeader label="CAPSTONE PROJECT" title={CAPSTONE.title} color={C.amber}/>
            <div style={{padding:"12px 16px",background:C.amber+"0a",border:`1px solid ${C.amber}33`,borderRadius:4,marginBottom:20}}>
              <div style={{color:C.dim,fontSize:10,marginBottom:4}}>{CAPSTONE.duration}</div>
              <div style={{color:C.white,fontSize:12,lineHeight:1.7,fontFamily:"'Courier New',monospace"}}>{CAPSTONE.description}</div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{color:C.blue,fontSize:10,letterSpacing:"0.12em",marginBottom:10}}>PLATFORM COMPONENTS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
                {CAPSTONE.components.map((comp,i)=>(
                  <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:4,padding:"12px 14px",background:C.bg2}}>
                    <div style={{color:C.blue,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:3}}>{comp.name}</div>
                    <div style={{color:C.amber,fontSize:9,marginBottom:6}}>{comp.tech}</div>
                    <div style={{color:C.dim,fontSize:11,lineHeight:1.6,marginBottom:8}}>{comp.desc}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {comp.files.map((f,fi)=>(
                        <span key={fi} style={{background:C.bg3,color:C.cyan,fontSize:9,padding:"1px 6px",borderRadius:2,fontFamily:"'Fira Code',monospace"}}>{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{color:C.green,fontSize:10,letterSpacing:"0.12em",marginBottom:10}}>WEEK-BY-WEEK BREAKDOWN</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {CAPSTONE.week_breakdown.map((w,i)=>(
                  <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:4,padding:"12px 14px",background:C.bg2}}>
                    <div style={{color:C.amber,fontSize:10,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:4}}>{w.week}</div>
                    <div style={{color:C.dim,fontSize:10,marginBottom:8,lineHeight:1.5}}>{w.focus}</div>
                    {w.goals.map((g,gi)=>(
                      <div key={gi} style={{display:"flex",gap:6,marginBottom:3}}>
                        <span style={{color:C.green,fontSize:10}}>✓</span>
                        <span style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{g}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{color:C.purple,fontSize:10,letterSpacing:"0.12em",marginBottom:10}}>FINAL DELIVERABLES</div>
              <div style={{border:`1px solid ${C.border}`,borderRadius:4,background:C.bg2}}>
                {CAPSTONE.deliverables.map((d,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"8px 14px",borderBottom:i<CAPSTONE.deliverables.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                    <span style={{color:C.amber,fontSize:11,minWidth:20}}>{i+1}.</span>
                    <span style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace"}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESOURCES TAB ── */}
        {activeTab==="resources"&&(
          <div>
            <SectionHeader label="LEARNING RESOURCES" title="Books, Labs & References" color={C.purple}/>
            {[
              { category:"Books (Essential)", color:C.blue, items:[
                {name:"The Linux Command Line",          author:"W. Shotts",         focus:"Bash mastery foundation"},
                {name:"Python for Hackers",              author:"OccupyTheWeb",      focus:"Security-focused Python"},
                {name:"Black Hat Python (2nd Ed)",       author:"Seitz/Arnold",      focus:"Offensive Python tools"},
                {name:"Violent Python",                  author:"TJ O'Connor",       focus:"Python security automation"},
                {name:"Practical Malware Analysis",     author:"Sikorski/Honig",    focus:"Malware analysis with tools"},
                {name:"The Art of Memory Forensics",    author:"Ligh et al.",       focus:"Volatility + memory forensics"},
              ]},
              { category:"Practice Platforms", color:C.green, items:[
                {name:"HackTheBox",                     author:"htb.com",           focus:"Red team labs (authorised)"},
                {name:"TryHackMe",                      author:"tryhackme.com",     focus:"Guided security learning"},
                {name:"Blue Team Labs Online",          author:"blueteamlabs.online",focus:"DFIR + log analysis labs"},
                {name:"CyberDefenders",                 author:"cyberdefenders.org", focus:"Blue team CTF challenges"},
                {name:"MalwareBazaar",                  author:"bazaar.abuse.ch",    focus:"Real malware samples for analysis"},
                {name:"VirusTotal",                     author:"virustotal.com",    focus:"Static malware analysis"},
              ]},
              { category:"Online References", color:C.amber, items:[
                {name:"MITRE ATT&CK",                   author:"attack.mitre.org",  focus:"Adversary TTP framework"},
                {name:"GTFOBins",                       author:"gtfobins.github.io",focus:"SUID/sudo exploit reference"},
                {name:"LOLBAS Project",                 author:"lolbas-project.github.io",focus:"Living-off-the-land binaries"},
                {name:"Sigma Rules",                    author:"github.com/SigmaHQ",focus:"Community detection rules"},
                {name:"ExplainShell",                   author:"explainshell.com",  focus:"Understand any bash command"},
                {name:"RegexOne",                       author:"regexone.com",      focus:"Regex learning with exercises"},
              ]},
              { category:"Tools Documentation", color:C.purple, items:[
                {name:"pefile docs",        author:"github.com/erocarrera/pefile",    focus:"PE file analysis Python library"},
                {name:"Volatility 3 docs",  author:"volatility3.readthedocs.io",      focus:"Memory forensics framework"},
                {name:"Scapy docs",         author:"scapy.readthedocs.io",            focus:"Python packet manipulation"},
                {name:"FastAPI docs",       author:"fastapi.tiangolo.com",            focus:"Python REST API framework"},
                {name:"pySigma docs",       author:"github.com/SigmaHQ/pySigma",     focus:"SIGMA rule conversion library"},
                {name:"Sysmon config",      author:"github.com/SwiftOnSecurity",      focus:"Production Sysmon configuration"},
              ]},
            ].map((section,si)=>(
              <div key={si} style={{marginBottom:16}}>
                <div style={{color:section.color,fontSize:10,letterSpacing:"0.12em",marginBottom:8}}>{section.category}</div>
                <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                  {section.items.map((item,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:i%2?C.bg2:C.bg,borderBottom:i<section.items.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{padding:"7px 12px",color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{item.name}</div>
                      <div style={{padding:"7px 12px",color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{item.author}</div>
                      <div style={{padding:"7px 12px",color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{item.focus}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{border:`1px solid ${C.amber}33`,borderRadius:4,padding:"14px 16px",background:C.amber+"0a",marginTop:8}}>
              <div style={{color:C.amber,fontSize:10,letterSpacing:"0.1em",marginBottom:8}}>PROGRESSION MILESTONES — HOW TO MEASURE SUCCESS</div>
              {[
                {month:"After Month 1",check:"You can write a bash/python script from scratch in < 30 min. Your FIM, port scanner, and auth analyzer all work. You understand every line you wrote."},
                {month:"After Month 2",check:"You can analyse a malware sample, write a SIGMA rule for it, and deploy it to ELK in < 2 hours. You can automate a full pentest phase 1."},
                {month:"After Month 3",check:"You have a GitHub portfolio with 10+ tools. You can build any security automation given a specification. Your capstone is deployed and demo-able."},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <span style={{color:C.amber,fontSize:9,background:C.amber+"22",padding:"2px 8px",borderRadius:2,minWidth:100,textAlign:"center",fontFamily:"'Courier New',monospace",flexShrink:0}}>{m.month}</span>
                  <span style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{m.check}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 24px",display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim}}>
        <span>90-DAY SECURITY SCRIPTING MASTERY — BASH · PYTHON · POWERSHELL</span>
        <span style={{color:C.blue+"66"}}>2-3 HOURS/DAY · 50+ SCRIPTS · 15+ PROJECTS · 1 CAPSTONE PLATFORM</span>
      </div>
    </div>
  );
}
