import { useState, useRef } from "react";

const C = {
  bg:"#040208", bg2:"#07030d", bg3:"#0b0516",
  border:"#1a0835", dim:"#5a3575", bright:"#e8ccff",
  purple:"#aa55ff", violet:"#8844dd", cyan:"#44ddff",
  green:"#44ff88", amber:"#ffaa00", red:"#ff3355",
  pink:"#ff55cc", blue:"#4499ff", white:"#ddc8ff",
};

/* ═══════════════════════════════════════════════════
   MONTH 2 — SECURITY ENGINEERING: RED + BLUE TEAM
   Days 29-56 | Full 22-component daily format
   ═══════════════════════════════════════════════════ */

const WEEKS = [
  {
    id:"w5", week:5, color:C.cyan,
    title:"Blue Team — Detection Engineering",
    theme:"Build production detection infrastructure. Every script you write becomes a detection artefact.",
    challenge:"Write 10 SIGMA rules covering T1059, T1003, T1053, T1547, T1071. All pass validation and convert to ELK/Splunk. ATT&CK coverage report generated automatically.",
    projects:["SIGMA automation platform","Detection pipeline v1","ATT&CK coverage heatmap"],
    days:[
      {
        day:29, lang:"PYTHON", title:"SIGMA Rule Architecture & pySigma Automation",
        obj:"Master SIGMA specification at schema level. Build automated rule pipeline: write → validate → test → convert → deploy.",
        tech:`SIGMA YAML parsed as: dict[str,Any] by PyYAML → pySigma builds SigmaRule object.
SigmaRule.detection: dict of named groups → SigmaDetection objects containing SigmaCondition.
Field modifiers (|contains, |endswith, |re): applied during SigmaDetectionItem construction.
pySigma condition parser: recursive descent parser for boolean expressions.
Backends translate SigmaCondition objects to backend-specific query syntax.
SigmaCollection: multiple rules in one file or across files. Backend.convert(collection) → list[str].
Custom backends: subclass SigmaBackend, override convert_condition_and/or/not methods.
FalsePositive tuning: filter rules add 'not' conditions — same SigmaCondition mechanism.
Rule severity levels map to backend-specific alert priorities (critical → correlation rule in Splunk).`,
        commands:["sigma check rules/*.yml","sigma convert -t splunk -p windows-sysmon rule.yml","sigma convert -t elasticsearch-eql -p windows-sysmon rule.yml","from sigma.collection import SigmaCollection","from sigma.backends.splunk import SplunkBackend"],
        walkthrough:`sigma_engine.py — Production SIGMA pipeline:
1. SigmaLoader: scan directory tree for *.yml files
2. Validate each rule: required fields, valid logsource, condition syntax
3. SigmaQualityChecker: detect: missing filters, overly broad conditions, missing metadata
4. Backend converter: one rule → {splunk_spl, elastic_eql, kql, qradar_aql}
5. FP Estimator: convert rule to query, run against 30-day baseline, count hits
6. Auto-deploy: push converted queries to configured backends via API
7. Coverage Reporter: map rules to ATT&CK techniques → Navigator JSON`,
        scratch:`# From scratch: sigma_rule_generator.py
# Input: TTP description + log sample
# Output: valid SIGMA YAML + tests

Given TTP: "Detect PowerShell using DownloadString to fetch payloads"
Generate:
  title: PowerShell Download Cradle Detection
  logsource: {category: process_creation, product: windows}
  detection:
    selection:
      Image|endswith: '\\powershell.exe'
      CommandLine|contains:
        - 'DownloadString'
        - 'DownloadFile' 
        - 'WebClient'
        - 'Net.WebClient'
    filter_legit:
      CommandLine|contains:
        - '\\Windows\\CCM\\'     # SCCM
        - 'WindowsUpdate'
    condition: selection and not filter_legit
  falsepositives: [SCCM, patching tools, Chocolatey]
  level: high`,
        debug:`# 5 bugs in this SIGMA rule — find and fix all
title: Suspicious Process
logsource:
  category: process    # BUG 1: invalid category — should be 'process_creation'
detection:
  keywords:            # BUG 2: 'keywords' deprecated — use named selection groups
    - cmd.exe
    - powershell.exe
  filter:
    CommandLine: null  # BUG 3: null condition — should check specific legit patterns
  condition: keywords  # BUG 4: missing 'not filter' — filter defined but never used
falsepositives: none   # BUG 5: 'none' is invalid — use empty list [] or remove field
level: informational   # BUG 6: this is HIGH severity — wrong classification`,
        analysis:`Analyse 5 rules from SigmaHQ/sigma repository:
- rules/windows/process_creation/proc_creation_win_powershell_download_cradles.yml
- rules/windows/process_access/proc_access_win_lsass_dump_comsvcs.yml
- rules/linux/auditd/lnx_auditd_susp_execution_from_dev_shm.yml
- rules/network/net_dns_high_nxdomain_count.yml
- rules/web/web_apache_susp_request.yml

For each: what does it detect? What would evade it? What generates FPs?
Write SIGMA evasion techniques for each (for understanding, not deployment).`,
        usecase:"Detection engineering core deliverable. Every new TTP documented in SIGMA. Shared across community. Deployed to all SIEMs simultaneously with one convert command.",
        red:`Red team uses SIGMA rules offensively:
- Study existing rules → identify gaps → operate in those gaps
- 'Defense evasion' is literally 'know what SIGMA rules exist and avoid triggering them'
- Example: SIGMA rule detects 'cmd.exe /c powershell' → use 'cmd.exe /Q /D /c powershell' instead
- Tools like Invoke-AtomicRedTeam test if your SIGMA rules fire on known-bad behaviour
Key insight: every SIGMA rule is an advertisement of what you're monitoring AND what you're NOT.`,
        blue:`Detection engineering workflow:
1. New TTP reported in CTI → write SIGMA within 24h of report
2. Test: does it fire on atomic test? What's FP rate on 30-day baseline?
3. Tune: add filters until FP < 5/day
4. Deploy: auto-convert and push to all SIEMs via CI/CD
5. Track: TP rate, MTTR, rule hit frequency — metrics for CISO reporting
Rule quality SLA: all rules must have: description, author, date, references, logsource, detection, falsepositives, level`,
        detect:`Meta-detection: monitor your own detection infrastructure.
Alert on: SIGMA rule file changes (git webhook), rule conversion failures, sudden alert volume drop (detection outage), alert volume spike (rule too broad or actual attack).
Detection health dashboard:
- Rules deployed: N
- Rules firing today: N
- Rules not fired in 30 days: (stale? or no matching activity?)
- ATT&CK coverage %
- FP rate per rule (trend)`,
        mistakes:[
          "Writing rules with no filters → instant alert fatigue",
          "Testing rule against same data you used to write it (confirmation bias)",
          "Wrong logsource category → rule never matches any events",
          "Missing ATT&CK technique tag → invisible in coverage map",
          "Deploying without FP baseline → unknown false positive rate",
          "Using 'keywords' (deprecated) instead of named selection groups",
        ],
        perf:`pySigma compilation: microseconds per rule. For 1000 rules: < 1 second.
SIEM query performance is the real concern:
- Splunk: index-time field extraction vs search-time → 100x speed difference
- ELK: filter context before query context → 10x speed difference  
- Always test converted query performance before deploying (query plan analysis)
Splunk: | explain on your converted rule to see estimated event count`,
        logging:`Log every deployment event:
{"ts":"...", "action":"rule_deployed", "rule_id":"uuid", "rule_title":"...",
 "backends":["splunk","elk"], "fp_estimate_30d":3, "deployed_by":"sac14"}
Alert on deployment failures — undeployed rules = blind spot.
Track rule version history: every change logged with before/after comparison.`,
        secure:`SIGMA rules contain detection logic — treat as SENSITIVE:
- Internal rules reveal what you're monitoring AND what gaps exist
- Sign rules with GPG before distribution
- Separate public (community) rules from proprietary internal rules
- CI/CD: verify rule signatures before deployment
- Access control: only detection engineers can push to rules/ directory`,
        lab:`Lab setup:
1. Clone SigmaHQ/sigma: git clone https://github.com/SigmaHQ/sigma ~/tools/sigma
2. pip install pySigma pySigma-backend-splunk pySigma-backend-elasticsearch
3. Write 3 SIGMA rules (choose from ATT&CK T1059, T1003, T1547)
4. Validate: sigma check rules/*.yml
5. Convert: sigma convert -t elasticsearch-eql -p windows-sysmon rules/*.yml
6. Deploy to your ELK (from docker-compose setup): push via Kibana API
7. Generate coverage report: python3 attck_coverage.py rules/ → navigator_layer.json`,
        project:`sigma_platform.py — Production SIGMA management:
Features:
  - Rule loader: scan directory, parse all YAML
  - Validator: pySigma validation + custom quality checks
  - FP tester: query ELK API with converted rule, count 30-day hits
  - Converter: multi-backend, save to backend-specific directories
  - Coverage mapper: extract ATT&CK techniques, build Navigator JSON
  - Deployer: push to ELK via API, push to Splunk via REST
  - Reporter: coverage %, FP rates, rule quality scores

CLI: python3 sigma_platform.py validate|convert|deploy|report rules/`,
        output:`sigma_platform.py report:
  Rules loaded: 10
  Valid: 10 (0 errors)
  Converted: Splunk(10) ELK(10) KQL(10)
  ATT&CK coverage: 8 techniques
  FP estimate (30d avg): 2.3 alerts/rule/day
  Rules >10 FP/day: 0 (good)
  Navigator layer: attck_coverage.json (open in navigator.attack.mitre.org)`,
        stretch:`Build a SIGMA rule quality scorer (0-100):
- Has description (+10), author (+5), references (+10), date (+5)
- Has falsepositives section (+10)
- Has ATT&CK tags (+15)
- Level matches severity of TTP (+10)
- FP estimate < 5/day (+20)
- Has test cases (+15)
Score < 70 = cannot deploy. Block in CI/CD pipeline.`,
        hw:`Study ATT&CK technique T1059.001 (PowerShell) in depth:
- All sub-techniques
- Known detection methods
- Known evasion techniques
Write 3 different SIGMA rules covering different detection angles for T1059.001.
Each rule should catch something the others miss.`,
        research:`How does Elastic Security's ESQL differ from EQL for detection rules?
What is KQL (Kusto Query Language) and how does it handle time-series detection?
Compare: Splunk SPL vs ELK EQL vs KQL for implementing the same SIGMA rule.
Which platform handles high-cardinality fields (process.command_line) most efficiently?`
      },
      {
        day:30, lang:"PYTHON", title:"ELK Stack Integration & Index Management",
        obj:"Deploy production ELK stack. Ingest security events. Build detection dashboards. Index lifecycle management.",
        tech:`Elasticsearch: inverted index over JSON documents. Shards: horizontal data partitions (default 1 primary, 1 replica).
Each field stored twice: source JSON + inverted index for search.
Field types matter: keyword (exact match, O(log n)) vs text (full-text, slower).
ILM (Index Lifecycle Management): hot (active writes) → warm (read-only) → cold (compressed) → delete.
Index templates: automatically apply mappings when index name matches pattern.
ECS (Elastic Common Schema): standard field names across all security data sources.
Kibana detection rules: KQL/EQL rules that run as background scheduled queries.
Elasticsearch Query DSL vs EQL: DSL for aggregations, EQL for sequence detection.
Logstash filter plugins: mutate (field manipulation), date (timestamp parsing), grok (log parsing).`,
        commands:["curl -X GET 'localhost:9200/_cat/indices?v'","curl -X PUT 'localhost:9200/security-alerts/_mapping'","curl -X POST 'localhost:9200/_bulk'","from elasticsearch import Elasticsearch, helpers","es.search(index='security-*', body={'query':{'match_all':{}}})"],
        walkthrough:`elk_integration.py — Production ELK pipeline:
1. ElasticsearchClient: connection pool, retry logic, auth
2. IndexManager: create index with ECS mapping, apply ILM policy
3. EventShipper: bulk indexing with retry-on-429, backpressure
4. AlertPoller: poll Kibana detection rule alerts via API
5. DashboardDeployer: import saved dashboards via Kibana API
6. HealthChecker: verify cluster health, shard allocation, lag`,
        scratch:`# Build log_shipper.py from scratch:
# Input: JSONL file of normalised security events
# Process: ECS mapping, bulk index to ES
# Output: indexed events searchable in Kibana

Key functions to implement:
  map_to_ecs(event: dict) -> dict:
    # Map your tool's field names to ECS standard names
    # source.ip, destination.port, process.name, user.name, event.action
  
  bulk_ship(events: list[dict], index: str):
    # Use elasticsearch.helpers.bulk() for performance
    # Handle 429 (rate limit) with backoff
    # Log: events shipped, errors, latency`,
        debug:`from elasticsearch import Elasticsearch

es = Elasticsearch(['http://localhost:9200'])

def ship_alert(alert):
    # BUG 1: no index specified — goes to default index (bad practice)
    es.index(body=alert)
    
def bulk_ship(alerts):
    # BUG 2: building bulk body manually — use helpers.bulk() instead
    for alert in alerts:
        es.index(index='alerts', body=alert)  # BUG 3: N individual requests, not bulk
    # BUG 4: no error handling — 429 rate limit crashes silently
    # BUG 5: @timestamp field missing — Kibana can't build time-series`,
        analysis:`Run your detection pipeline against ELK. Check:
- Are events indexed correctly? (Check mappings: GET /security-alerts/_mapping)
- Are timestamps parsed? (Can you build time-series in Kibana?)
- Are IPs stored as ip type? (Enables geo_point, CIDR queries)
- Are fields tokenised correctly? (keyword vs text matters for filtering)
Profile: 10,000 events bulk indexed — what's the throughput? Memory usage?`,
        usecase:"Every enterprise SOC runs on ELK or Splunk. ELK is the open-source path. Understanding indexing = understanding why some searches are fast and others are slow.",
        red:"Attackers target ELK: unauthenticated ELK clusters are regularly found on Shodan. Data in ELK is HIGH value (security tool logs, credentials, network maps). Ransomware groups specifically target ELK.",
        blue:"ELK security hardening: enable xpack.security, TLS on all ports, field-level access control, audit logging, network isolation. Monitor: login attempts to Kibana, API key usage, index creation.",
        detect:"ELK meta-monitoring: alert when events per minute drops below baseline (collection failure). Alert when new index appears (possible log source added or attacker writing their own). Monitor Kibana login events.",
        mistakes:["Not setting @timestamp → Kibana time filter broken","keyword vs text confusion → slow aggregations","Missing ILM → disk fills after 30 days","No replica shards → single node failure = data loss","Indexing sensitive fields in clear text"],
        perf:"Bulk indexing: 5,000-10,000 events/request optimal. Larger = memory pressure. Use refresh_interval=30s during bulk ingest (not -1 permanently). Disable replicas during initial bulk load, re-enable after.",
        logging:"Log all ELK operations: index name, document count, latency, errors. Alert on: bulk rejection rate > 1%, cluster health yellow/red, shard unassigned.",
        secure:"ELK cluster: never expose 9200 to internet. API key auth for all clients. Encrypt: inter-node communication, client-cluster, snapshots. Role-based access: analysts can search, not delete.",
        lab:"Deploy ELK via docker-compose (from lab-setup). Configure: ILM policy (7 day hot, 30 day warm, 90 day delete). Create index template with ECS mapping. Ship 100 events. Build Kibana dashboard: events/hour, top source IPs, top rules fired.",
        project:"siem_shipper.py: production event shipper. Features: ECS normalisation, bulk indexing, ILM, retry-with-backoff, Prometheus metrics (events/sec, errors, lag), health endpoint.",
        output:"ELK running. 10,000 events indexed. Kibana dashboard shows: event timeline, top attackers, rule hits. ILM policy managing index lifecycle.",
        stretch:"Build a Kibana dashboard as code: export dashboard JSON, store in git, deploy via API on fresh ELK. Enables reproducible SIEM deployments.",
        hw:"Study Elasticsearch query performance: explain why a range query on a keyword field is slow vs a range query on a numeric field. How does ILM affect query performance?",
        research:"Compare ELK vs Splunk for security analytics: cost, performance, detection capabilities, community rules. When would you choose one over the other? What is Chronicle (Google) and how does it differ?"
      },
      {
        day:31, lang:"BASH+PYTHON", title:"Log Normalisation at Scale — ECS Pipeline",
        obj:"Build universal log normaliser supporting 10 formats. Map all fields to ECS. Stream at 10k events/second.",
        tech:`ECS field mappings: every security tool has different field names for same concepts.
Apache 'clientip' = Zeek 'id.orig_h' = Windows 'IpAddress' = ECS 'source.ip'
Normalisation: standardise field names AND value formats (timestamps → ISO8601, IPs → dotted decimal).
Grok patterns: named regex groups applied to log lines → field extraction.
Python's struct module: unpack binary log formats (Windows EVTX is binary XML).
python-evtx: parse Windows Event Log EVTX files in Python.
Zeek log format: TSV with header comment lines specifying field names and types.
Syslog RFC 5424: structured data section [exampleSDID@32473 iut="3" eventSource="..."]
Streaming parser: yield events one at a time — constant memory regardless of file size.`,
        commands:["python-evtx", "pywin32.evtlog", "zeek-cut field1 field2 < conn.log", "grok pattern matching", "jq -r '@csv' for CSV export"],
        walkthrough:`normaliser.py — Universal log normaliser:
Supported formats: Apache CLF, Nginx, auth.log, syslog RFC3164/5424, 
Windows Event Log XML, Sysmon EVTX, Zeek TSV, Suricata EVE JSON, CSV.
Architecture:
  FormatDetector.identify(line) → parser_class
  Parser.parse(line) → raw_event: dict
  ECSMapper.map(raw_event, source_type) → ecs_event: dict
  Validator.validate(ecs_event) → valid: bool, errors: list
  Output: yield ecs_event as JSONL`,
        scratch:`# Build normaliser.py for 3 log formats:
# 1. Apache CLF: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326
# 2. auth.log:  Jan 15 22:01:43 host sshd[1234]: Failed password for root from 1.2.3.4 port 52341 ssh2
# 3. Sysmon Event 1: XML with Image, ParentImage, CommandLine fields

ECS output for Apache:
{
  "@timestamp": "2000-10-10T13:55:36-07:00",
  "source.ip": "127.0.0.1",
  "user.name": "frank",
  "http.request.method": "GET",
  "url.path": "/index.html",
  "http.response.status_code": 200,
  "event.dataset": "apache.access"
}`,
        debug:`# Broken normaliser — 6 bugs
import re
from datetime import datetime

def parse_auth_log(line):
    pattern = r'(\\w+ \\d+ \\d+:\\d+:\\d+) (\\w+) (\\w+)\\[\\d+\\]: (.+)'
    match = re.match(pattern, line)
    ts = datetime.strptime(match.group(1), '%b %d %H:%M:%S')  # BUG 1: no year
    host = match.group(2)
    process = match.group(3)
    message = match.group(4)
    
    if 'Failed password' in message:
        ip = re.search(r'from (\\S+)', message).group(1)  # BUG 2: no None check
        return {'ip': ip, 'host': host}  # BUG 3: non-ECS field names
    
    return None  # BUG 4: returns None for non-failure lines — loses valid events`,
        analysis:"Collect 5 different log samples from your lab. For each: identify format, write parser, map to ECS, validate output. Measure throughput: events/second for each parser.",
        usecase:"SIEM ingestion requires normalised data. This is the ETL layer every SOC needs. Getting it right determines quality of all downstream detections.",
        red:"Normalisation bugs create blind spots: if auth.log IPs aren't parsed correctly, brute force detection fails. Test adversarially: craft log lines that break parsers.",
        blue:"Test normalisation coverage: for each detection rule, verify the field it queries is correctly normalised. A rule querying 'source.ip' that's stored as 'ip' = silent failure.",
        detect:"Monitor normalisation health: parse error rate per source, field population rate per source, events per minute per source. Alert on: > 5% parse errors, any source going silent.",
        mistakes:["Year missing from auth.log timestamps (syslog has no year)","Timezone handling (auth.log is local time, not UTC)","Not handling multi-line events (Java stack traces)","IP string vs IP object — some fields need CIDR query capability"],
        perf:"Python parser: 5,000-10,000 events/sec single-threaded. For 100k+ events/sec: use Rust/Go or Logstash. asyncio helps if I/O bound (reading from socket), not if CPU bound (parsing).",
        logging:"Log: source file, events parsed, events failed, parse error samples (first 5 per error type), throughput. Don't log: raw event content (may be sensitive).",
        secure:"Log parsers are often given elevated access (read system logs). Run with minimum required permissions. Validate all input: crafted log lines can cause regex catastrophic backtracking.",
        lab:"normalise.py: parse 3 log formats, output ECS JSONL, ship to ELK. Verify in Kibana: all timestamps correct, all IPs correct type, all events searchable.",
        project:"universal_normaliser.py: 10-format normaliser as streaming pipeline. Metrics: throughput, error rate, field population %. Deploy as systemd service feeding ELK.",
        output:"10k events/sec throughput. 99%+ field mapping accuracy. ECS-compliant output verified against schema. All events visible in Kibana.",
        stretch:"Add schema drift detection: if a log source suddenly changes format (missing fields, different timestamp), alert rather than silently corrupt the pipeline.",
        hw:"Study ECS specification for 'process' category: all fields, their types, when each is populated. Map your proc_forensics.py output from Month 1 to ECS process fields.",
        research:"How does Logstash's grok filter compare to Python regex for log parsing performance? What is Vector (from Datadog) and how does it achieve higher throughput than Logstash?"
      },
      {
        day:32, lang:"PYTHON", title:"Threat Intelligence Integration — MISP & STIX",
        obj:"Integrate with MISP threat intel platform. Consume and produce STIX 2.1. Automate IOC lifecycle.",
        tech:`MISP (Malware Information Sharing Platform): threat intel sharing system. REST API on /events, /attributes, /tags.
PyMISP: Python library wrapping MISP REST API. Handles auth, pagination, error handling.
STIX 2.1: Structured Threat Information Expression. JSON-based format for threat intel.
STIX objects: Indicator, Malware, ThreatActor, Campaign, AttackPattern, CourseOfAction.
STIX relationships: links between objects (Indicator indicates Malware, Malware uses AttackPattern).
TAXII 2.1: protocol for STIX distribution. Collections exposed as HTTPS endpoints.
TLP (Traffic Light Protocol): WHITE (public), GREEN (community), AMBER (org), RED (named recipients).
IOC lifecycle: NEW → ACTIVE → EXPIRING → EXPIRED. Auto-expire based on age and confidence.
Threat intel scoring: confidence 0-100, impact 0-100, priority = confidence × impact / 100.`,
        commands:["pip install pymisp stix2 taxii2-client","misp = PyMISP(url, key, ssl=False)","from stix2 import Indicator, Malware, Bundle","taxii_server = Server('https://otx.alienvault.com/taxii2/')"],
        walkthrough:`ti_platform.py — Threat Intelligence automation:
1. MISP connector: pull new events since last run, extract IOCs with metadata
2. STIX builder: convert IOCs to STIX Indicator objects with proper patterns
3. IOC lifecycle: expire IOCs older than N days with no hits, raise confidence on repeated hits
4. Enrichment: push to VT/AbuseIPDB, store results back in MISP attribute comments
5. Distribution: push high-confidence IOCs to firewall, SIEM watchlist, EDR blocklist
6. TAXII consumer: pull IOCs from threat feeds (AlienVault OTX, CIRCL, etc.)`,
        scratch:`# ti_sync.py from scratch: bidirectional MISP sync
# Push: your IOC extractor findings → MISP (new event per scan)
# Pull: MISP indicators → local SQLite cache → detection pipeline

Key operations:
  push_iocs(iocs: dict, event_title: str, tlp: str = 'amber') -> str:
    # Create MISP event with attributes
    # Return: event ID for tracking
  
  pull_active_iocs(since: datetime, types: list[str]) -> list[dict]:
    # Fetch all active (not expired) indicators
    # Filter by TLP (don't distribute RED externally)
    # Return: [{value, type, confidence, first_seen, tags}]`,
        debug:`import pymisp

misp = pymisp.PyMISP('https://misp.local', 'API_KEY', False)

def push_ioc(ip, description):
    event = misp.new_event(info=description)  # BUG 1: no error handling on new_event
    
    attribute = {
        'type': 'ip-dst',
        'value': ip,
        'to_ids': True
    }
    # BUG 2: event is a dict, need event['Event']['id']
    misp.add_attribute(event, attribute)
    # BUG 3: TLP not set — defaults to organisation
    # BUG 4: no confidence score — unknown reliability
    # BUG 5: no expiry — IOC never ages out`,
        analysis:"Study AlienVault OTX public TAXII feed. Pull 100 indicators. Analyse: what types are most common? What's the average age? How many have been confirmed malicious vs suspicious?",
        usecase:"Threat intel automation: new malware campaign → IOCs shared on MISP within hours → automatically deployed to all member firewalls and SIEMs. This is how the industry shares intelligence.",
        red:"Threat intel feeds contain false positives (legitimate IPs misidentified). Attackers abuse this: submit false IOCs to poison threat intel feeds, causing defenders to block legitimate services.",
        blue:"IOC quality management: don't blindly deploy all MISP indicators. Score by: source reputation, age, confirmation count. Only auto-deploy high-confidence IOCs to blocking positions.",
        detect:"Monitor your TI pipeline: track how many indicators were deployed, how many caused alerts, how many alerts were true positives. Low TP rate = poor quality intel source.",
        mistakes:["Deploying all IOCs without scoring → block legitimate services","Not expiring old IOCs → performance degradation in detection systems","Missing TLP → sharing intel beyond intended audience","No deduplication → same IOC submitted 100× inflates metrics"],
        perf:"MISP API: ~100 attributes/second. For bulk: use /attributes/restSearch with limit/page. Local SQLite cache for fast lookups: no API call for cached IOCs. Cache TTL: 1h for active IOCs.",
        logging:"Log all MISP operations: events created, attributes added, IOCs deployed, IOCs expired. Include: source event ID, TLP, confidence, deployment targets.",
        secure:"MISP API key: same sensitivity as the intel it protects. 600 permissions, never in code. Separate read-only key for consumers. Write key for producers. Audit all API access.",
        lab:"Set up local MISP (Docker: https://github.com/MISP/misp-docker). Push your IOC extractor findings from Month 1 as MISP events. Pull and deploy to ELK watchlist.",
        project:"ti_engine.py: full TI platform. Pull from 3 sources (MISP, OTX, CIRCL), score, deduplicate, manage lifecycle, push to: firewall blocklist, ELK watchlist, Slack alert.",
        output:"TI engine running on 500 IOCs. 95%+ dedup accuracy. Lifecycle management working. ELK watchlist updated automatically.",
        stretch:"Build IOC correlation: find IOCs that appear across multiple independent sources → higher confidence score. Alert when same IOC appears in 3+ different feeds within 24h.",
        hw:"Study STIX 2.1 patterns: understand how to express 'this indicator detects malware that uses this technique against these sectors' in STIX object relationships.",
        research:"How does AlienVault OTX score IOC confidence? How does VirusTotal calculate malicious consensus? How do commercial TI platforms (Recorded Future, Intel 471) differ from community platforms?"
      },
      {
        day:33, lang:"POWERSHELL", title:"Windows Sysmon Deployment & Event Analysis",
        obj:"Deploy Sysmon with production config. Build automated event analysis. Build PowerShell-based threat hunting.",
        tech:`Sysmon architecture: kernel driver (SysMon) + user-mode service. Driver registered via PsSetCreateProcessNotifyRoutineEx.
Events written to: Microsoft-Windows-Sysmon/Operational channel (ETW provider).
Event ID 1: uses WMI to get process creation context (parent process, command line).
Event ID 10: hooks NtOpenProcess to capture PROCESS_VM_READ handles to protected processes.
Process GUID: unique identifier that persists across process lifetime, more reliable than PID.
RuleName field: which Sysmon config rule triggered the event (useful for filtering).
ETW provider: {5770385F-C22A-43E0-BF4C-06F5698FFBD9} — use with logman or xperf.
Config schema: XML with EventFiltering → RuleGroup → EventType (include/exclude rules).
SwiftOnSecurity config: community-maintained production config, 100k+ stars on GitHub.`,
        commands:["sysmon64.exe -accepteula -i config.xml","sysmon64.exe -c config.xml (update)","Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -MaxEvents 100","sysmon64.exe -s (print schema)","[xml]$event.ToXml() (parse event XML)"],
        walkthrough:`sysmon_analyzer.ps1 — Automated Sysmon analysis:
1. EventCollector: Get-WinEvent with FilterHashtable (provider-level filter, fastest)
2. EventParser: [xml]$event.ToXml() → extract all EventData fields
3. AlertEngine: correlation rules for common attack patterns
4. CorrelationEngine: link events by ProcessGuid (parent→child chains)
5. Reporter: HTML report with event timeline and alert summary`,
        scratch:`# sysmon_hunter.ps1 — threat hunting from Sysmon events
# Hunt: processes that: injected into other processes, made network connections, 
#       created files in Temp directories, modified registry Run keys

Write-Host "=== SYSMON THREAT HUNT ===" -ForegroundColor Cyan

# Event 8: CreateRemoteThread (injection indicator)
$injections = Get-WinEvent -FilterHashtable @{
    LogName = 'Microsoft-Windows-Sysmon/Operational'; Id = 8
    StartTime = (Get-Date).AddDays(-1)
} -EA SilentlyContinue

# Event 10: ProcessAccess with high privileges on lsass
# Event 1: process creation with suspicious parent
# Event 3: network connections from cmd/powershell
# Event 13: RunKey registry modifications`,
        debug:`# Broken Sysmon analyzer
$events = Get-WinEvent 'Microsoft-Windows-Sysmon/Operational'  # BUG 1: loads ALL events, not filtered
foreach($e in $events) {
    if($e.Id -eq 1) {   # BUG 2: comparing int to int, but Id is EventId property
        $xml = [xml]$e.Message  # BUG 3: should be $e.ToXml() not $e.Message
        $proc = $xml.EventData.Data.Name  # BUG 4: wrong path — Data is array
        Write-Host "Process: $proc"
    }
}`,
        analysis:"Deploy Sysmon with SwiftOnSecurity config on your Windows VM. Run 5 attack simulations (from MOD-02 techniques). For each: find the Sysmon events. Build a correlation that detects the attack.",
        usecase:"Sysmon is the most important single defensive control on Windows. Without it, Event Log has < 20% visibility. With it: process creation, DLL loading, network connections, registry, file creation all logged.",
        red:"Sysmon evasion: Direct Syscalls (bypasses Event 8 for some injection techniques), Sysmon config tampering (Event 16 fires — detect this), Sysmon driver unload (requires admin, but attackers with admin can try).",
        blue:"Sysmon Event 16 (config change): ALERT IMMEDIATELY. Sysmon process termination: ALERT IMMEDIATELY. These indicate attacker actively working to blind you.",
        detect:"Alert on: Event 16 (Sysmon config change), any process attempting to stop SysMon service (Event 7045 for service stop, or process accessing sysmon.exe), unusual RuleName values.",
        mistakes:["Not filtering in FilterHashtable → loads entire event log into memory","Parsing Message instead of ToXml() → unreliable text parsing","Not correlating by ProcessGuid → lose process chain context","Sysmon config too aggressive → event log fills in hours"],
        perf:"Get-WinEvent with FilterHashtable: provider-level, fast. Avoid Where-Object after Get-WinEvent (client-side filter). For large analysis: export to CSV first, process offline.",
        logging:"Sysmon events should flow to: local EVTX, WEF (Windows Event Forwarding) to central collector, then to ELK. Never analyse only the local EVTX — attackers can clear it.",
        secure:"Sysmon binary: verify signature before deployment. Config file: store in read-only location, monitor for changes (FIM on sysmon config). Sysmon service: Protected Process Light (if supported).",
        lab:"Deploy Sysmon on Windows VM with SwiftOnSecurity config. Simulate: macro execution (Word→cmd.exe), LSASS access (procdump), registry persistence (Run key), lateral movement (PsExec). Find all events.",
        project:"sysmon_platform.ps1: automated threat detection from Sysmon events. Rules: process injection chains, LSASS access, suspicious network connections, persistence. Outputs HTML report.",
        output:"Sysmon deployed. 5 attack simulations all detected. HTML report generated. Events flowing to ELK.",
        stretch:"Build Sysmon event correlation engine: link related events by ProcessGuid to reconstruct full attack chain from initial process creation through persistence.",
        hw:"Study Windows Event Forwarding (WEF): how to centralise Sysmon events from 100 machines to a single Windows Event Collector. Configure a WEF subscription.",
        research:"How does Microsoft Defender for Endpoint use ETW for telemetry? Compare ETW-based telemetry to kernel driver telemetry (like Sysmon's driver approach). What are the tradeoffs?"
      },
      {
        day:34, lang:"PYTHON", title:"Canary Files, Honeytokens & Deception Technology",
        obj:"Deploy deception layer. Canary files for ransomware detection. Honeytokens for lateral movement detection.",
        tech:`Canary files: fake sensitive files placed throughout filesystem. Ransomware encrypts them → immediate detection.
Honeytokens: fake credentials/URLs that trigger alerts when used. AWS canary tokens, fake passwords.
CanaryTokens.org: hosted honeytoken service. Generates URLs/documents that alert when accessed.
inotifywait: uses inotify kernel subsystem. IN_OPEN event fires when file opened — millisecond detection.
File access patterns: inotifywait event IN_ACCESS (read), IN_MODIFY (write), IN_OPEN (open).
Python canary implementation: write realistic-looking fake files, monitor with inotify.
Distributed canaries: canary files in every directory — attacker hits one during enumeration.
Timing: canary alert fires before encryption completes → time to isolate the host.`,
        commands:["inotifywait -m -r -e open,access,modify /sensitive/", "canarytoken.org API", "find / -name '*.docx' | head -5 (attacker enumeration)"],
        walkthrough:`canary_deploy.py + canary_monitor.sh:
Deployment:
  1. Create realistic-looking canary files:
     - salary_report_Q3_2024.xlsx (fake, but realistic name)
     - vpn_credentials_backup.txt
     - database_passwords.csv
  2. Place in high-value directories: /home/*/Documents/, /var/backups/, network shares
  3. Record: {path, hash, creation_time, type}
  
Monitoring:
  4. inotifywait: watch all canary paths for any access
  5. On access: immediate alert with: who, what process, what time
  6. EDR-level: also monitor via auditd for forensic completeness`,
        scratch:`# canary_system.py — full honeytoken deployment
# Create 50 canary files across filesystem
# Monitor with inotify
# Alert within 1 second of any access

class CanaryFile:
    def __init__(self, path, content_type='salary'):
        self.path = path
        self.content = self._generate_realistic_content(content_type)
        self.hash = hashlib.sha256(self.content.encode()).hexdigest()
        self.deployed_at = datetime.now(timezone.utc)
    
    def _generate_realistic_content(self, ctype) -> str:
        templates = {
            'salary': "CONFIDENTIAL\\nQ3 2024 Salary Report\\n...",
            'password': "Database Credentials\\nHost: prod-db-01\\n...",
            'ssh_key': "-----BEGIN OPENSSH PRIVATE KEY-----\\n...(fake)...",
        }
        return templates.get(ctype, "CONFIDENTIAL DOCUMENT")`,
        debug:`# Broken canary monitor — race conditions and FPs
import subprocess, os

CANARY_DIR = '/opt/canaries'
os.makedirs(CANARY_DIR, exist_ok=True)

# Create canary
with open(f'{CANARY_DIR}/passwords.txt', 'w') as f:
    f.write('admin:password123')  # BUG 1: REAL-looking but still visible to attacker
    
# Monitor (broken)
proc = subprocess.run(  # BUG 2: run() blocks — should be Popen() for async
    ['inotifywait', '-m', CANARY_DIR],
    capture_output=True, text=True
)
# BUG 3: this code never runs — blocked on inotifywait
for line in proc.stdout.split('\\n'):
    if 'OPEN' in line:
        print(f"ALERT: canary accessed: {line}")  # BUG 4: no context — who/what process?`,
        analysis:"Deploy 10 canary files on your Ubuntu VM. Run: cat /opt/canaries/passwords.txt (simulate attacker). Verify alert fires within 1 second. Check: does your monitoring detect the process name?",
        usecase:"Ransomware detection before mass encryption. Insider threat lateral movement detection. Early warning for APT reconnaissance. Deception is the only 100% reliable detection (no FPs).",
        red:"Professional red teamers know about canary files. Techniques: read filesystem metadata without opening files (stat() not read()), enumerate files from backup without accessing live filesystem.",
        blue:"Canary placement strategy: directories where attackers enumerate first (home directories, /etc, /var/backups, network shares). Include in every backup directory — backup enumeration triggers early.",
        detect:"Canary access is ALWAYS an alert — zero false positives. The only legitimate access is from your deployment script. Any other access = incident. No tuning needed.",
        mistakes:["Placing all canaries in one directory → attacker avoids after first detection","File names that don't look realistic → attacker skips them during enumeration","Not monitoring who accessed (need process name + user, not just access event)","Canary files visible in backup to legitimate users"],
        perf:"inotifywait: kernel-level, microsecond latency. Zero CPU until event fires. 10,000 canary files = 10,000 inotify watches = ~1.5MB kernel memory. Scale to entire filesystem.",
        logging:"Canary alert: timestamp, canary path, accessing process PID+name, user UID+name, parent process. This IS your incident alert — make it actionable.",
        secure:"Canary files: realistic but never real credentials. Hash canary content for integrity verification. Protect canary list (attacker knowledge of canary locations = bypassing them).",
        lab:"Deploy 20 canaries across filesystem. Simulate 3 access scenarios: legitimate user (FP test), attacker cat (TP test), ransomware mass-write (ransomware detection test). Verify detection in all cases.",
        project:"canary_platform.py: deploy + monitor + alert. Scheduled refresh (change canary content to appear recently modified). Central dashboard showing deployment status and alert history.",
        output:"50 canaries deployed. All accesses detected within 1 second. Zero false positives. Ransomware simulation detected before completing 10% of files.",
        stretch:"Implement network-based honeytokens: fake AWS access keys that call back to canarytoken.org when used. Deploy in fake config files alongside your file canaries.",
        hw:"Research canarytokens.org: all token types available. How does a Word document canary work technically? How does the DNS canary work? Implement a simple DNS canary using Python.",
        research:"How do commercial deception platforms (Illusive Networks, Attivo Networks) differ from simple canary files? What is 'deception at scale' and what does it require technically?"
      },
      {
        day:35, lang:"ALL", title:"Week 5 Synthesis — Detection Platform v1",
        obj:"Integrate: SIGMA platform + ELK + normaliser + TI integration + Sysmon + canaries into cohesive detection platform.",
        tech:"Detection platform architecture: SIGMA rules as code → ELK as storage+query engine → normalised events as fuel → TI as enrichment → Sysmon as Windows telemetry → canaries as deception layer.",
        commands:["docker-compose up -d (full stack)", "sigma convert --recursive -t elasticsearch-eql rules/ | push_to_elk.py", "python3 detection_platform.py status"],
        walkthrough:`detection_platform_v1/:
  ├── agents/           (syslog_agent.sh, sysmon_exporter.ps1)
  ├── normaliser/       (normaliser.py — ECS mapping)
  ├── rules/sigma/      (10 rules covering T1059, T1003, T1053, T1547, T1071)
  ├── rules/yara/       (4 rules for malware family detection)
  ├── ti/               (misp_sync.py, ioc_lifecycle.py)
  ├── deception/        (canary_deploy.py, canary_monitor.sh)
  ├── elk/              (docker-compose.yml, index templates, dashboards)
  ├── api/              (first version of platform API)
  └── reports/          (attck_coverage.json, daily_digest.py)`,
        scratch:"Wire all components: events flow from agents → normaliser → ELK → SIGMA detection → TI enrichment → alerts → Slack. Write the orchestration script.",
        debug:"End-to-end: run 5 attack simulations. Find and fix: event not normalised correctly, SIGMA rule not matching, TI lookup timeout, alert not sent.",
        analysis:"Run the complete attack simulation used in MOD-04 ransomware playbook. Verify: all 9 phases generate detectable events. Map each detection to its SIGMA rule and ATT&CK technique.",
        usecase:"This is a real lightweight SOC platform. Deployable in small-medium enterprises for $0 (all open source). Detection capability comparable to commercial SIEM for common attacks.",
        red:"Red team your own platform: run each ATT&CK technique from MOD-02 kill chain. For each: does detection fire? How quickly? What technique beats it? Document all gaps.",
        blue:"Platform coverage report: for each of your 10 SIGMA rules: TP rate (this week), FP rate, mean time from attack to alert. Create SLA: all HIGH alerts acknowledged within 15 minutes.",
        detect:"Platform self-monitoring: alert when event collection drops 50% below baseline (agent failure), detection engine processing lag > 30 seconds, any canary accessed.",
        mistakes:["Skipping integration testing → individual components work but don't connect","No monitoring for the monitoring platform itself","Alert fatigue from untested SIGMA rules","Missing correlation across data sources"],
        perf:"Full stack throughput: 1,000 events/sec → normalise → ELK → SIGMA → alert. Measure: end-to-end latency (event occurs → alert fired). Target: < 30 seconds.",
        logging:"Platform operational log: events ingested (per source), SIGMA rule hits (per rule), TI lookups, canary accesses, alert counts (by severity), system health metrics.",
        secure:"Final security review: platform itself has attack surface. ELK unauthenticated? API key exposed? Canary list readable? Run assessment against your own platform.",
        lab:"Full deployment: all components running. Run 10 attack simulations. Document: detection rate, false positive rate, mean detection time. Create Kibana dashboard.",
        project:"detection_platform v1.0: GitHub release with README, docker-compose, example config, sample SIGMA rules, coverage report. 1-click deployment.",
        output:"Detection platform v1.0 deployed. 10 attack simulations detected. ATT&CK coverage: 8+ techniques. Kibana dashboard live. Slack alerts working.",
        stretch:"Implement alert deduplication: if same rule fires on same host within 5 minutes, suppress subsequent alerts (keep first). Reduce alert volume by 60% while maintaining detection coverage.",
        hw:"Write a 1-page detection gap analysis: what ATT&CK techniques does your platform NOT detect? Prioritise by: attacker use frequency, impact, ease of detection. Plan for Week 6-8.",
        research:"Study MITRE D3FEND: the defensive counterpart to ATT&CK. For each technique in your ATT&CK coverage gap, what D3FEND defensive technique would address it? How would you implement it as a script?"
      },
    ]
  },
  {
    id:"w6", week:6, color:C.red,
    title:"Red Team Scripting — Authorised Lab Only",
    theme:"Every offensive technique teaches you what to detect. Build tools to understand them. Then build detections for them.",
    challenge:"Build complete recon suite: passive OSINT → active scan → service enum → risk report. Test on your own lab VMs only.",
    projects:["Recon automation suite","Service fingerprinting tool","Pentest report generator"],
    days:[
      {
        day:36, lang:"PYTHON", title:"OSINT Automation — Passive Reconnaissance",
        obj:"Automate passive recon: Certificate Transparency, DNS enumeration, WHOIS, email harvesting. Zero target interaction.",
        tech:`Certificate Transparency (CT) logs: every TLS certificate issued is logged publicly by law.
crt.sh: CT log search engine. REST API: https://crt.sh/?q=%.domain.com&output=json
Returns: CN, SANs of all certificates for domain → reveals subdomain infrastructure.
DNS enumeration: resolve discovered subdomains → live host discovery without scanning.
WHOIS: IANA/registrar databases. Python: python-whois library.
Email harvesting: search engines, LinkedIn, OSINT frameworks (theHarvester).
Shodan API: internet-wide scan results. Find: servers, devices, open ports, service banners.
Rate limiting in passive recon: CT logs have no rate limit. Shodan: 1 query/second free tier.`,
        commands:["python3 -m theHarvester -d target.com -b all","shodan search 'org:\"Target Corp\"'","curl 'https://crt.sh/?q=%.target.com&output=json'","whois target.com","dig ANY target.com"],
        walkthrough:`osint_recon.py — Passive recon pipeline:
1. CT Logs: crt.sh query → unique subdomains list
2. DNS resolver: resolve each subdomain → live hosts (remove NXDOMAINs)
3. WHOIS: organisation info, registrar, contacts, related domains
4. Shodan: search by org name → exposed services, IPs, open ports
5. Email harvester: search engine queries for email patterns
6. Output: structured JSON with confidence scores per finding`,
        scratch:`# From scratch: ct_enum.py
# Query crt.sh for domain's certificate history
# Extract unique subdomains
# Resolve each subdomain → live IP list

import urllib.request, json, re, socket
from collections import defaultdict

def query_ct_logs(domain: str) -> list[str]:
    url = f'https://crt.sh/?q=%.{domain}&output=json'
    # Request → parse JSON → extract name_value fields
    # Parse: SANs may contain multiple domains separated by newlines
    # Deduplicate → sort → return list

def resolve_subdomains(subdomains: list[str]) -> dict[str,str]:
    # For each subdomain: socket.gethostbyname_ex()
    # Return: {subdomain: ip} for successfully resolved ones
    # Skip: wildcard domains (*.domain.com)`,
        debug:`import requests, json

def osint_scan(domain):
    # BUG 1: requests instead of urllib — adds dependency not needed
    r = requests.get(f'https://crt.sh/?q=%.{domain}&output=json')
    
    subdomains = []
    for cert in r.json():          # BUG 2: no error handling for non-JSON response
        subdomains.append(cert['name_value'])  # BUG 3: may contain newlines (multi-SAN)
    
    results = {}
    for sub in subdomains:
        ip = socket.gethostbyname(sub)  # BUG 4: raises exception if no DNS record
        results[sub] = ip
        
    return results  # BUG 5: duplicates not removed, wildcards not filtered`,
        analysis:`Run osint_recon.py against: your own domain (if you have one) OR a HackTheBox target (with permission) OR a public bug bounty target within scope.
Measure: how many subdomains discovered vs what you knew about? What live hosts found?
Compare your results against theHarvester and recon-ng.`,
        usecase:"Pentest phase 1: build target map before touching anything. External attack surface assessment. Brand/domain monitoring. Third-party risk assessment.",
        red:`OPSEC in passive recon: crt.sh queries are logged but rarely monitored by targets.
DNS resolution IS visible (resolver sees queries). Use a VPN or Tor exit node for DNS.
Shodan: your searches are logged by Shodan. Use anonymous API key.
Goal: maximum intelligence, minimum target visibility.`,
        blue:`Defensive use of OSINT: run this on YOUR OWN organisation monthly.
What subdomains do you have exposed? What services are on Shodan for your org?
Attack surface management: auto-monitor for new certificates on your domains → alert on new subdomains.`,
        detect:`For your own domain: set up certificate transparency monitoring:
Google has a CT log feed. Subscribe to alerts for new certificates issued for your domain.
New certificate = new subdomain = potential shadow IT or forgotten asset.
Alert on: unexpected certificates, certificates with unusual SANs.`,
        mistakes:["Not filtering wildcard certificates (*.domain.com)", "Not handling DNS timeout gracefully", "Hitting Shodan API without checking rate limits first", "Not storing results persistently (re-running wastes API quota)"],
        perf:"CT log query: 1-3 seconds. DNS resolution for 100 subdomains: 10-30 seconds (sequential). Use asyncio.gather for parallel DNS resolution: 100 subdomains in < 2 seconds.",
        logging:"Log: target domain, query timestamp, subdomains found, live hosts, API calls made. Store in SQLite for trending: new subdomains appearing over time.",
        secure:`IMPORTANT: this tool should ONLY be used on:
1. Your own domains
2. Bug bounty targets (within stated scope)
3. Authorised penetration test targets (written scope)
4. Your own lab VMs
Using this on targets without permission is illegal under the Computer Fraud and Abuse Act and equivalent laws.`,
        lab:"Run osint_recon.py against: yourname.github.io or another domain you own. Count: subdomains discovered, live hosts, Shodan results. Verify with manual browser checks.",
        project:"recon_suite.py v1: passive OSINT module. Inputs: target domain. Outputs: JSON recon report with: subdomains, IPs, emails, technologies, Shodan results.",
        output:"Recon report for your own domain. < 60 seconds total. Structured JSON. HTML report generated.",
        stretch:"Add technology detection: for each discovered web server, fetch HTTP headers and identify: web server, CMS, CDN, WAF, analytics. Use Wappalyzer fingerprints database.",
        hw:"Study theHarvester source code. How does it query different search engines? What techniques does it use to avoid being blocked? How would you detect someone running theHarvester against your domain?",
        research:"What is Certificate Transparency and why was it created? How does it prevent mis-issuance? How do attackers abuse CT logs for recon? How do defenders use CT monitoring?"
      },
      {
        day:37, lang:"PYTHON", title:"Service Enumeration & Version Fingerprinting",
        obj:"Build service fingerprinter: identify exact service+version from banner + probes. Map to known CVEs.",
        tech:`Service fingerprinting: send specific probes, analyse responses to identify service name and version.
HTTP: GET / → Server header, X-Powered-By, response body patterns.
SSH: connect → banner SSH-2.0-OpenSSH_8.2p1 (version in banner format).
FTP: connect → 220 Service Ready (version often in banner).
SMTP: EHLO → 250-Exim 4.94.2 (version in EHLO response).
SMB: negotiate protocol → dialect reveals Windows version.
Nmap service probes: nmap-service-probes database has 1000+ probe patterns.
NVD (National Vulnerability Database) API: search CVEs by product + version.
CPE (Common Platform Enumeration): standardised naming for software products.`,
        commands:["nmap -sV -sC target", "curl -I http://target/", "nc -w2 target 22", "python-nmap: nmap.PortScanner()"],
        walkthrough:`service_enum.py — Service fingerprinter:
1. Load probe database: HTTP, SSH, FTP, SMTP, SMB, MySQL, Redis probes
2. For each open port: send appropriate probes, capture responses
3. Version extractor: regex against responses, extract version strings
4. CPE builder: build CPE string from service+version
5. NVD lookup: query NVD API for CVEs matching CPE
6. Risk scorer: combine: CVE CVSS score + exploitability + patch availability`,
        scratch:`# service_fingerprinter.py from scratch
# Supports: HTTP, SSH, FTP, SMTP, IMAP, MySQL, Redis, MongoDB

SERVICE_PROBES = {
    22:   [b'\\r\\n', b'SSH-2.0-\r\n'],  # SSH banner trigger
    80:   [b'HEAD / HTTP/1.0\r\n\r\n', b'GET / HTTP/1.0\r\n\r\n'],
    21:   [b'', b'USER anonymous\r\n'],   # FTP banner + anonymous test
    25:   [b'EHLO test.com\r\n'],         # SMTP EHLO
    3306: [b'\\x00'],                     # MySQL greeting
    6379: [b'INFO\r\n'],                  # Redis INFO command
}

VERSION_PATTERNS = {
    'ssh':  re.compile(r'SSH-[0-9.]+-([\\w.]+)'),
    'http': re.compile(r'Server:\\s*([^\r\n]+)', re.I),
    'ftp':  re.compile(r'^\\d+\\s+.*?(\\d+\\.\\d+[^\\s]*)'),
}`,
        debug:`def fingerprint_service(host, port, timeout=2):
    import socket
    s = socket.socket()
    s.settimeout(timeout)
    s.connect((host, port))  # BUG 1: no exception handling
    
    banner = s.recv(1024).decode()  # BUG 2: binary data, decode may fail
    s.send(b'\\r\\n')  # BUG 3: sending before receiving might work, but wrong order for some protocols
    response = s.recv(1024)
    
    version = banner.split(' ')[1]  # BUG 4: assumes version is second word — fragile
    return {'port': port, 'version': version}  # BUG 5: no service name, no confidence`,
        analysis:"Test your fingerprinter against: your Ubuntu target VM (known services). Compare results against nmap -sV. How accurate is your version detection? What's your false negative rate?",
        usecase:"Pentest: after port scan, fingerprint to find exploitable versions. Asset inventory: track all software versions in environment. Patch management: alert when vulnerable version detected.",
        red:"Service fingerprinting IS active reconnaissance — target sees your probe connections. Detection-aware fingerprinting: use single probes, not aggressive scanning. Fingerprint only ports from your port scan.",
        blue:"Detect service enumeration: multiple connections to same port with varied payloads (probing). Unusual protocols to wrong ports. Alert: HTTP request to SSH port, SMTP command to HTTP port.",
        detect:"IDS signature: connection to multiple services in short time from same source. Honeypot services on non-standard ports: any connection = scanner. Alert on: probes to closed ports in same /24.",
        mistakes:["Not handling binary protocols (send raw bytes not strings)", "Timeout too short for slow services", "Not testing probes against real services before deployment", "Version regex too greedy — false matches"],
        perf:"Sequential fingerprinting: 1-2 seconds per port. For 1000 open ports: ~30 minutes sequential. asyncio with Semaphore(50): < 2 minutes.",
        logging:"Log: host, port, service, version, confidence, CVEs found, probe used. Track over time: service version changes are inventory changes → alert on unexpected version downgrades.",
        secure:"Fingerprinting REQUIRES authorisation — same as port scanning. All scans must stay within defined scope. Log your own scanning for audit trail.",
        lab:"Fingerprint all open ports on your Ubuntu target VM. For each: verify version manually (dpkg -l | grep service). Accuracy? CVEs found for versions present?",
        project:"service_enum.py: complete fingerprinter. HTTP, SSH, FTP, SMTP, MySQL, Redis, PostgreSQL. NVD CVE lookup. Risk report with: service, version, CVE list, CVSS scores.",
        output:"Fingerprints 20 services accurately. CVE lookup working. Risk report generated. 90%+ version accuracy vs manual verification.",
        stretch:"Add banner manipulation detection: if service returns banner you don't recognise, query Shodan historical data to see if banner changed recently (possible compromise indicator).",
        hw:"Study nmap-service-probes file (/usr/share/nmap/nmap-service-probes). How does nmap's version detection algorithm work? What makes it more accurate than simple banner grabbing?",
        research:"How does CVE scoring work (CVSS v3.1)? What are: Base Score, Temporal Score, Environmental Score? How should you use CVSS scores in your risk prioritisation? What are CVSS's limitations?"
      },
    ]
  },
  {
    id:"w7", week:7, color:C.purple,
    title:"Malware Analysis Automation",
    theme:"Automate triage. One script that classifies a malware sample in 60 seconds without executing it.",
    challenge:"Process 50 malware samples from MalwareBazaar. Cluster into families by IMPHASH. Identify 3 novel samples (not matching known families). Generate triage report for each.",
    projects:["PE analysis platform","YARA rule test framework","Malware triage automation"],
    days:[
      {
        day:43, lang:"PYTHON", title:"PE Format Deep Dive & pefile Automation",
        obj:"Understand PE format at byte level. Automate full PE static analysis pipeline. Cluster samples by IMPHASH.",
        tech:`PE format review from MOD-03, now with automation focus:
pefile.PE(): memory-maps the file, parses headers lazily (only parses section when accessed).
IMPHASH algorithm: (1) iterate imports alphabetically by DLL, (2) lowercase DLL name + function name,
  (3) concatenate as 'dll.func,dll.func,...', (4) MD5 of result.
Section entropy: Shannon H(X) = -Σ p(x) log₂ p(x) where p(x) = byte_value_frequency / total_bytes.
RICH header: undocumented Microsoft build metadata header. Between DOS stub and PE signature.
Debug directory: points to PDB file path — may reveal internal build paths, developer usernames.
Manifest resource: version info, requested execution level (requireAdministrator = privilege elevation).
Overlay data: bytes after last section end — used by: self-extracting installers, malware config.`,
        commands:["pefile.PE(path, fast_load=True)", "pe.get_imphash()", "pe.OPTIONAL_HEADER.CheckSum","pe.get_overlay()", "pe.DIRECTORY_ENTRY_DEBUG[0].entry.PdbFileName"],
        walkthrough:`pe_platform.py — Production PE analysis:
1. TypeIdentifier: magic bytes → file type (PE32, PE32+, DLL, SYS)
2. HeaderAnalyser: timestamps, machine type, subsystem, characteristics
3. SectionAnalyser: name, entropy, raw/virtual size ratios, characteristics
4. ImportAnalyser: DLL imports, function imports, suspicious API categorisation
5. ExportAnalyser: exports (DLL), forwarded exports
6. ResourceAnalyser: version info, manifest, icon, embedded files
7. IMPHASHer: generate + cluster by IMPHASH
8. RiskScorer: weighted score from all analysers → overall risk level`,
        scratch:`# malware_clusterer.py — IMPHASH-based family clustering
# Input: directory of samples
# Process: extract IMPHASH from each, cluster identical hashes
# Output: family clusters with member count, shared characteristics

from pathlib import Path
from collections import defaultdict
import pefile, json

def cluster_by_imphash(samples_dir: str) -> dict[str, list]:
    clusters = defaultdict(list)
    for sample in Path(samples_dir).glob('*'):
        try:
            pe = pefile.PE(str(sample), fast_load=True)
            ih = pe.get_imphash()
            clusters[ih].append({
                'path': str(sample),
                'sha256': hash_file(sample),
                'name': sample.name,
            })
        except pefile.PEFormatError:
            pass  # Not a PE file
    return dict(clusters)`,
        debug:`import pefile

def analyze_pe(path):
    pe = pefile.PE(path)
    
    # BUG 1: fast_load=True skips parsing some directories
    # need pe.parse_data_directories() for imports when using fast_load
    
    for entry in pe.DIRECTORY_ENTRY_IMPORT:
        dll = entry.dll               # BUG 2: bytes, not str — need .decode()
        for imp in entry.imports:
            name = imp.name           # BUG 3: may be None (import by ordinal)
            if 'VirtualAlloc' in name:  # BUG 4: bytes in bytes comparison — fine but confusing
                print(f"Found: {name}")
    
    ts = pe.FILE_HEADER.TimeDateStamp  # BUG 5: raw int, not human-readable datetime
    print(f"Compiled: {ts}")`,
        analysis:"Take 10 samples from MalwareBazaar. Run pe_platform.py on each. For each: family (from VT), IMPHASH, section entropy, suspicious APIs. Do samples in same family share IMPHASH? Verify.",
        usecase:"Malware triage at scale: L1 SOC runs pe_platform.py on every suspicious file. 60-second analysis guides escalation decisions. IMPHASH clustering groups related incidents automatically.",
        red:"PE header manipulation: malware authors modify timestamps, strip imports table, modify section names to confuse automated analysis. Counter: entropy analysis catches packed samples regardless of header manipulation.",
        blue:"IMPHASH in your SIEM: every file executed (Sysmon Event 7: Image Loaded) has IMPHASH. Alert when IMPHASH matches known-bad. Cluster alerts by IMPHASH: same family = same campaign.",
        detect:"SIEM query: files with: IMPHASH matching threat intel, OR section entropy > 7.5, OR imports count < 5 (possible packer). Sysmon Event 1 has ImageHashes field including IMPHASH.",
        mistakes:["Bytes vs str comparison for DLL/function names","Not handling pefile.PEFormatError (file not PE)","Assuming DIRECTORY_ENTRY_IMPORT exists (packed → none)","Entropy of small sections unreliable (< 256 bytes)"],
        perf:"pefile.PE(fast_load=False): ~10ms per file. With fast_load=True: ~2ms but need manual data directory parsing. For 1000 samples: ThreadPoolExecutor(10) → ~10 seconds.",
        logging:"Log: file path, sha256, imphash, risk_score, flags, analysis_duration. Separate log for analysis errors (file not PE, corrupt PE, access denied).",
        secure:"Never execute samples during static analysis. Malware may exploit pefile vulnerabilities (CVEs exist). Run in read-only sandbox. Consider running in Docker container per sample.",
        lab:"Download 20 samples from MalwareBazaar (tag: emotet or trickbot). Run pe_platform.py. Cluster by IMPHASH. How many distinct families? What's the most common suspicious API combination?",
        project:"pe_platform.py v1.0: full analysis, IMPHASH clustering, risk scoring, HTML report. Batch mode: process entire directory. Summary statistics: families, capabilities, risk distribution.",
        output:"20 samples analysed in < 30 seconds. Clustered into 3-4 families. HTML report with per-sample and summary views. Risk scores correlate with VT detection rates.",
        stretch:"Add Rich header parsing: Microsoft build metadata reveals: compiler version, linker version, build configuration. Correlate: samples built with same compiler = same threat actor toolchain?",
        hw:"Study IMPHASH in depth: what happens when malware adds a dummy DLL import? Does IMPHASH change? How does TLSH (fuzzy hash) compare to IMPHASH for malware clustering? When is TLSH better?",
        research:"How does Mandiant/Google's FLOSS tool work? It extracts obfuscated strings that regular 'strings' misses. What techniques does it use? How would you integrate FLOSS into your pe_platform.py?"
      },
    ]
  },
  {
    id:"w8", week:8, color:C.green,
    title:"Advanced Detection Engineering",
    theme:"Statistical anomaly detection + ML basics + detection-as-code CI/CD pipeline.",
    challenge:"Detection-as-code: SIGMA rule committed to git → CI validates → converts → deploys to ELK → FP test runs automatically. Zero manual steps.",
    projects:["Statistical beaconing detector","Detection-as-code CI/CD","ATT&CK heatmap generator"],
    days:[
      {
        day:50, lang:"PYTHON", title:"Statistical Anomaly Detection for Security",
        obj:"Implement Z-score, IQR, rolling statistics, and beaconing detection. Build adaptive thresholds.",
        tech:`Z-score: (x - μ) / σ. Measures standard deviations from mean. Z > 3 = anomaly (0.3% probability of normal).
IQR (Interquartile Range): Q3 - Q1. Outliers: x < Q1 - 1.5*IQR or x > Q3 + 1.5*IQR. Robust to extreme outliers.
Coefficient of Variation (CV): σ/μ * 100. Normalised variability. CV < 15% = very regular = beaconing signal.
EWMA (Exponentially Weighted Moving Average): recent values weighted more heavily than older values.
Time-series seasonality: SOC events have daily patterns (business hours). Baselines must account for time-of-day.
Adaptive threshold: threshold that adjusts based on rolling baseline. Prevents stale thresholds.
Rare event detection: events that occur < N times in 30 days are anomalous when they suddenly occur frequently.`,
        commands:["from scipy.stats import zscore, iqr","from statistics import mean, stdev, median","collections.deque(maxlen=N) for rolling windows","numpy.percentile() for IQR"],
        walkthrough:`anomaly_engine.py — Statistical detection:
1. BaselineManager: collect 30 days of metrics per metric type
2. ZScoreDetector: flag values > 3σ from rolling mean
3. BurstDetector: alert when event rate doubles in 5-minute window
4. BehaviourProfiler: per-host baseline, alert on deviation
5. BeaconingDetector: CV-based C2 beaconing detection (from MOD-04)
6. RareEventDetector: alert when rare event suddenly becomes common`,
        scratch:`# From scratch: beaconing_detector.py
# Input: connection log CSV (ts, src, dst, port)
# Algorithm:
#   Group connections by (src, dst, port)
#   Calculate inter-connection intervals
#   Compute CV (coefficient of variation) of intervals
#   Flag groups with: count > 5, CV < 25% as potential beaconing

import csv, math, statistics
from collections import defaultdict
from datetime import datetime

def detect_beaconing(log_path: str, min_count=5, max_cv=25.0) -> list[dict]:
    connections: dict[tuple, list[float]] = defaultdict(list)
    
    with open(log_path) as f:
        for row in csv.DictReader(f):
            ts = datetime.fromisoformat(row['ts']).timestamp()
            key = (row['src_ip'], row['dst_ip'], row['dst_port'])
            connections[key].append(ts)
    
    suspects = []
    for key, timestamps in connections.items():
        # Calculate intervals between consecutive connections
        timestamps.sort()
        intervals = [timestamps[i+1]-timestamps[i] for i in range(len(timestamps)-1)]
        intervals = [x for x in intervals if 10 < x < 7200]  # Filter noise
        
        if len(intervals) < min_count: continue
        
        mean_i = statistics.mean(intervals)
        cv = (statistics.stdev(intervals) / mean_i * 100) if mean_i > 0 else 999
        
        if cv <= max_cv:
            suspects.append({
                'src': key[0], 'dst': key[1], 'port': key[2],
                'mean_interval_s': round(mean_i, 1),
                'cv_pct': round(cv, 1),
                'count': len(intervals) + 1,
                'risk': 'HIGH' if cv < 10 else 'MEDIUM'
            })
    
    return sorted(suspects, key=lambda x: x['cv_pct'])`,
        debug:`import statistics, json

def detect_anomalies(events: list[dict]):
    counts = {}
    for e in events:
        host = e['host']
        counts[host] = counts.get(host, 0) + 1
    
    values = list(counts.values())
    mean = sum(values) / len(values)  # BUG 1: ZeroDivisionError if empty
    std  = statistics.stdev(values)   # BUG 2: stdev requires N >= 2
    
    anomalies = {}
    for host, count in counts.items():
        z = (count - mean) / std      # BUG 3: ZeroDivisionError if std == 0
        if z > 2:                     # BUG 4: threshold of 2 generates too many FPs
            anomalies[host] = {'z': z, 'count': count}
    
    return anomalies`,
        analysis:"Generate synthetic connection log: 200 hosts with random connections + 1 host beaconing every 60s ±5s. Run beaconing_detector.py. Verify beacon detected with CV < 10%. Measure FP rate.",
        usecase:"Detect C2 beaconing from novel/unknown malware families not in any signature database. No signatures needed — pure statistics catches timing patterns.",
        red:"Sophisticated C2 adds jitter to beaconing interval specifically to defeat CV-based detection. Counter: even with 40% jitter, CV is ~35% — adjust threshold. Or use autocorrelation analysis.",
        blue:"Baseline first: run beaconing detector on 30 days of known-clean traffic. Find legitimate tools that look like beaconing (Windows Update, telemetry). Add to allowlist before enabling alerts.",
        detect:"Statistical detection has no silver bullet: tune thresholds per environment. Too sensitive → alert fatigue. Too loose → miss beaconing. Tune: start strict (CV < 10%), loosen if too many FPs.",
        mistakes:["Running with no baseline → unknown FP rate","CV threshold same for all environments → wrong for some","Not filtering by minimum count → 2-connection 'beaconing' at CV=0","Forgetting time-of-day seasonality in baseline"],
        perf:"Beaconing detector: O(n log n) for sorting timestamps. For 1M connection records: < 5 seconds in Python. For real-time: maintain running statistics with rolling window, O(1) per event.",
        logging:"Log detected beacons: src, dst, port, interval_mean, CV, connection_count, detection_time. Track: how many connections occurred before detection (detection latency in events).",
        secure:"Connection logs contain full network topology — treat as highly sensitive. Statistical detection outputs are sensitive too (reveal what you monitor). Encrypt at rest.",
        lab:"Generate 7-day synthetic log with embedded beaconing (60s interval, 10% jitter). Run detector. Tune thresholds until: TP=100%, FP<5%. Record optimal threshold for your data.",
        project:"anomaly_platform.py: Z-score (event frequency), IQR (connection count), CV-beaconing, rare event detection. All with adaptive baselines. Configurable thresholds per metric.",
        output:"Detects beaconing with < 5% FP rate on synthetic dataset. Adaptive threshold adjusts to 7-day baseline. Prometheus metrics: detection rate, FP rate, processing latency.",
        stretch:"Implement autocorrelation-based beaconing detection: more robust to high-jitter C2. Compare: CV vs autocorrelation on synthetic data with 0%, 20%, 40%, 60% jitter.",
        hw:"Study Fourier transform analysis for beaconing detection: signals with regular periods have peaks in frequency domain. Why might FFT be better than CV for detecting beaconing with jitter?",
        research:"How do commercial NDR (Network Detection and Response) tools detect beaconing? What ML techniques do they use beyond simple statistics? What is 'long tail' analysis and when is it useful?"
      },
    ]
  },
];

/* ── UI ── */
function CodeBlock({ code, lang }) {
  const lc = {PYTHON:C.green,BASH:C.cyan,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue}[lang]||C.purple;
  return (
    <pre style={{background:"#040210",border:`1px solid ${C.border}`,borderLeft:`3px solid ${lc}`,
      borderRadius:3,padding:"10px 12px",color:lc,fontSize:10,
      fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",
      wordBreak:"break-word",margin:"8px 0",lineHeight:1.6}}>
      {code}
    </pre>
  );
}

function DayView({ d }) {
  const [open, setOpen] = useState(null);
  const lc = {PYTHON:C.green,BASH:C.cyan,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue}[d.lang]||C.purple;

  const ITEMS = [
    {k:"tech",     label:"1. Technical Deep Dive",       val:d.tech,     c:C.cyan},
    {k:"commands", label:"2. Core Commands",              val:Array.isArray(d.commands)?d.commands.join("\n"):d.commands, c:C.green, code:true},
    {k:"walkthrough",label:"3. Script Walkthrough",       val:d.walkthrough, c:C.blue},
    {k:"scratch",  label:"4. Write From Scratch",         val:d.scratch,  c:C.amber, code:true},
    {k:"debug",    label:"5. Debugging Exercise",         val:d.debug,    c:C.red,  code:true},
    {k:"analysis", label:"6. Script Analysis",            val:d.analysis, c:C.purple},
    {k:"usecase",  label:"7. Security Use Case",          val:d.usecase,  c:C.cyan},
    {k:"red",      label:"8. Red Team Perspective",       val:d.red,      c:C.red},
    {k:"blue",     label:"9. Blue Team Perspective",      val:d.blue,     c:C.blue},
    {k:"detect",   label:"10. Detection Opportunities",   val:d.detect,   c:C.green},
    {k:"mistakes", label:"11. Common Mistakes",           val:Array.isArray(d.mistakes)?("• "+d.mistakes.join("\n• ")):d.mistakes, c:C.orange},
    {k:"perf",     label:"12. Performance",               val:d.perf,     c:C.purple},
    {k:"logging",  label:"13. Logging Considerations",    val:d.logging,  c:C.amber},
    {k:"secure",   label:"14. Secure Coding",             val:d.secure,   c:C.red},
    {k:"lab",      label:"15-16. Lab + Mini Project",     val:`LAB:\n${d.lab}\n\nPROJECT:\n${d.project}`, c:C.green},
    {k:"output",   label:"17. Expected Output",           val:d.output,   c:C.cyan},
    {k:"stretch",  label:"18. Stretch Goal",              val:d.stretch,  c:C.purple},
    {k:"hw",       label:"19-20. Homework + Research",    val:`HOMEWORK:\n${d.hw}\n\nRESEARCH:\n${d.research}`, c:C.amber},
  ];

  return (
    <div style={{marginTop:8}}>
      <div style={{padding:"8px 12px",background:lc+"08",border:`1px solid ${lc}33`,borderRadius:3,marginBottom:10}}>
        <div style={{color:lc,fontSize:8,letterSpacing:"0.1em",marginBottom:3}}>OBJECTIVE</div>
        <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{d.obj}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
        {ITEMS.map((item,i)=>(
          item.val && (
            <div key={item.k}
              style={{border:`1px solid ${open===item.k?item.c+"55":C.border}`,borderRadius:3,
                gridColumn:open===item.k?"1/-1":"auto"}}>
              <div onClick={()=>setOpen(open===item.k?null:item.k)}
                style={{padding:"5px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                  background:open===item.k?item.c+"0a":C.bg2}}>
                <span style={{color:open===item.k?item.c:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{item.label}</span>
                <span style={{marginLeft:"auto",color:C.dim,fontSize:9}}>{open===item.k?"▲":"▼"}</span>
              </div>
              {open===item.k&&(
                <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`}}>
                  {item.code ?
                    <CodeBlock code={item.val} lang={d.lang}/> :
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{item.val}</div>
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

function DayCard({ d }) {
  const [open, setOpen] = useState(false);
  const lc = {PYTHON:C.green,BASH:C.cyan,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue}[d.lang]||C.purple;
  return (
    <div style={{border:`1px solid ${open?lc+"44":C.border}`,borderRadius:4,marginBottom:5}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:open?lc+"08":C.bg2}}>
        <span style={{background:lc+"22",color:lc,fontSize:8,padding:"1px 5px",borderRadius:2,minWidth:60,textAlign:"center",fontFamily:"'Courier New',monospace",fontWeight:700}}>{d.lang}</span>
        <span style={{color:"#2a0850",fontSize:9,minWidth:40,fontFamily:"'Courier New',monospace"}}>DAY {d.day}</span>
        <span style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",flex:1}}>{d.title}</span>
        <span style={{color:C.dim}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<DayView d={d}/>}
    </div>
  );
}

function WeekBlock({ w }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:`1px solid ${open?w.color+"44":C.border}`,borderRadius:5,marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:open?w.color+"08":C.bg2}}>
        <span style={{background:w.color+"22",color:w.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:2,fontFamily:"'Courier New',monospace",minWidth:64,textAlign:"center"}}>WEEK {w.week}</span>
        <div>
          <div style={{color:C.bright,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:700}}>{w.title}</div>
          <div style={{color:C.dim,fontSize:9,marginTop:2}}>{w.days.length} detailed days</div>
        </div>
        <span style={{marginLeft:"auto",color:C.dim}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"14px 16px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <div style={{padding:"8px 12px",background:w.color+"08",border:`1px solid ${w.color}33`,borderRadius:3,marginBottom:12}}>
            <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:4}}>THEME</div>
            <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:8,lineHeight:1.5}}>{w.theme}</div>
            <div style={{color:C.amber,fontSize:9,letterSpacing:"0.1em",marginBottom:4}}>WEEKLY CHALLENGE 🏆</div>
            <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.5}}>{w.challenge}</div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {w.projects.map((p,i)=>(
              <span key={i} style={{background:w.color+"11",color:w.color,fontSize:10,padding:"2px 8px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>📦 {p}</span>
            ))}
          </div>
          {w.days.map(d=><DayCard key={d.day} d={d}/>)}
          {w.days.length < 7 && (
            <div style={{padding:"12px 14px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,marginTop:8}}>
              <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",textAlign:"center"}}>
                Remaining days in Week {w.week}: follow the pattern established in detailed days above.
                Apply all 22 components to each remaining day's topic from the curriculum overview.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Month2Detail() {
  const ref = useRef(null);
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(40,0,80,0.04) 3px,rgba(40,0,80,0.04) 4px)"}}>

      <div style={{background:"#000",borderBottom:`2px solid ${C.purple}44`,padding:"10px 22px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.purple+"22",border:`1px solid ${C.purple}66`,borderRadius:4,padding:"4px 12px",color:C.purple,fontSize:12,fontWeight:700,letterSpacing:"0.12em"}}>M2</div>
        <div>
          <div style={{color:C.bright,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>MONTH 2 — SECURITY ENGINEERING: RED + BLUE TEAM</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.1em",marginTop:1}}>DAYS 29–56 · FULL 22-COMPONENT FORMAT · SIGMA · ELK · TI · SYSMON · RECON · MALWARE · DETECTION</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          {WEEKS.map(w=>(
            <div key={w.id} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:w.color}}/>
              <span style={{color:w.color,fontSize:8}}>W{w.week}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={ref} style={{flex:1,padding:"22px 26px",overflowY:"auto",background:C.bg}}>
        <div style={{border:`1px solid ${C.purple}33`,borderRadius:4,padding:"12px 16px",background:C.purple+"08",marginBottom:20}}>
          <div style={{color:C.purple,fontSize:10,fontWeight:700,letterSpacing:"0.1em",marginBottom:6}}>MONTH 2 SUMMARY</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
            {[
              {w:"Week 5",  topic:"Detection Engineering",   color:C.cyan,   n:"Days 29-35"},
              {w:"Week 6",  topic:"Red Team Scripting",      color:C.red,    n:"Days 36-42"},
              {w:"Week 7",  topic:"Malware Analysis Auto",   color:C.purple, n:"Days 43-49"},
              {w:"Week 8",  topic:"Advanced Detection",      color:C.green,  n:"Days 50-56"},
            ].map((s,i)=>(
              <div key={i} style={{border:`1px solid ${s.color}33`,borderRadius:3,padding:"8px 10px",background:s.color+"08"}}>
                <div style={{color:s.color,fontSize:10,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{s.w}</div>
                <div style={{color:C.bright,fontSize:11,marginTop:2}}>{s.topic}</div>
                <div style={{color:C.dim,fontSize:9,marginTop:2}}>{s.n}</div>
              </div>
            ))}
          </div>
        </div>

        {WEEKS.map(w=><WeekBlock key={w.id} w={w}/>)}
      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 22px",display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a0850"}}>
        <span>MONTH 2 — SECURITY ENGINEERING DAILY CURRICULUM</span>
        <span style={{color:C.purple+"44"}}>WEEKS 5-8 · DAYS 29-56 · 22 COMPONENTS/DAY</span>
      </div>
    </div>
  );
}
