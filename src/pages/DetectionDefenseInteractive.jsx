import { useState, useRef } from "react";

const C = {
  bg:"#070305", bg2:"#0c0408", bg3:"#110509",
  border:"#2a0810", dim:"#774455", bright:"#ffccdd",
  red:"#ff2244", orange:"#ff8800", amber:"#ffaa00",
  green:"#44ff88", cyan:"#44ccff", purple:"#cc88ff",
  pink:"#ff66aa", white:"#ffddee",
};

const SECTIONS = {
  edr: {
    label:"AV & EDR INTERNALS", icon:"🔴", color:C.red,
    lessons:[
      { title:"How AV & EDR Systems Work", tag:"FOUNDATION", tagColor:C.green, content:[
        {type:"h2", text:"AV & EDR — Detection Architecture Deep Dive"},
        {type:"p",   text:"Understanding how defenders detect malware is foundational for both blue teamers (building detections) and red teamers (understanding what to avoid). This is the engine behind every security product."},
        {type:"compare", title:"Signature-Based vs Behaviour-Based Detection",
          left:{ label:"SIGNATURE-BASED (Traditional AV)", color:C.amber, items:[
            {head:"How it works", body:"Hash the file OR scan for byte patterns inside it. Compare against a database of known-malicious hashes and byte sequences."},
            {head:"Example signature", body:"Hex: 6A 40 68 00 30 00 00 68 58 A4 53 E5 6A 00 FF D5\nThis byte sequence = Metasploit shellcode stub."},
            {head:"Speed", body:"Extremely fast. File scan in milliseconds. Hash lookup is O(1)."},
            {head:"Detection rate", body:"100% for known malware. 0% for unknown (zero-day). Single bit change defeats it."},
            {head:"Bypass", body:"XOR one byte, repack, change a string — signature no longer matches. Tools: custom encoders, packers."},
            {head:"Best for", body:"Known commodity malware. High-volume triage. Malware families with stable signatures."},
          ]},
          right:{ label:"BEHAVIOUR-BASED (EDR: CrowdStrike, SentinelOne, Defender for Endpoint)", color:C.red, items:[
            {head:"How it works", body:"Kernel driver hooks OS calls and monitors ALL process activity in real-time. Rules fire when behaviour patterns match attacker TTPs."},
            {head:"Example rule", body:"IF WINWORD.EXE spawns CMD.EXE\nTHEN ALERT: Macro execution (T1059)\nIF any process calls VirtualAllocEx on LSASS\nTHEN ALERT: Credential dump (T1003.001)"},
            {head:"Speed", body:"Slight overhead (~1-3% CPU). Every syscall monitored. Modern EDRs use kernel callbacks not inline hooks."},
            {head:"Detection rate", body:"High for novel malware using known TTPs. Can miss fully custom attacks that stay within normal behaviour bounds."},
            {head:"Bypass", body:"Stay within 'normal' behaviour. Use living-off-the-land. Abuse legitimate admin tools. Inject into trusted processes."},
            {head:"Best for", body:"APT-level threats. Novel malware. Fileless attacks. Process injection. Lateral movement."},
          ]}
        },
        {type:"code", lang:"analysis", label:"EDR KERNEL ARCHITECTURE — How CrowdStrike/SentinelOne Hooks the OS", lines:[
          {c:"EDR AGENT ARCHITECTURE",n:""},
          {c:"════════════════════════════════════════════════════════════",n:""},
          {c:"",n:""},
          {c:"USER MODE (Ring 3)",n:""},
          {c:"  ┌─────────────────────────────────────────────────────┐",n:""},
          {c:"  │  Malware Process                                     │",n:""},
          {c:"  │    → calls CreateFile('C:\\malware.exe')             │",n:""},
          {c:"  │    → calls VirtualAlloc(rwx, 4096)                  │",n:""},
          {c:"  │    → calls CreateRemoteThread(lsass.exe, shellcode) │",n:""},
          {c:"  └─────────────┬───────────────────────────────────────┘",n:""},
          {c:"                │  Win32 API → syscall transition",n:""},
          {c:"KERNEL (Ring 0) ▼",n:""},
          {c:"  ┌─────────────────────────────────────────────────────┐",n:""},
          {c:"  │  EDR KERNEL DRIVER (csagent.sys / SentinelOne.sys)  │",n:""},
          {c:"  │                                                      │",n:""},
          {c:"  │  Kernel Callbacks registered:                        │",n:""},
          {c:"  │  PsSetCreateProcessNotifyRoutineEx  ← process create│",n:"PsSetCreateProcessNotifyRoutineEx: MS-provided callback. EDR registers here; kernel calls it on every new process."},
          {c:"  │  PsSetCreateThreadNotifyRoutine     ← thread create │",n:"Thread creation callback: catches CreateRemoteThread injection."},
          {c:"  │  PsSetLoadImageNotifyRoutine        ← DLL load      │",n:"Image load callback: every DLL loaded fires this. Catch injection via LoadLibrary."},
          {c:"  │  CmRegisterCallback                 ← registry ops  │",n:"Registry callback: monitor ALL registry reads and writes. Catches persistence setup."},
          {c:"  │  ObRegisterCallbacks                ← object access │",n:"Object callbacks: intercept handle opens to protected processes (LSASS). Block dumping."},
          {c:"  │  FltRegisterFilter                  ← filesystem     │",n:"Minifilter driver: intercept ALL filesystem I/O. Scan files on create/write/execute."},
          {c:"  │                                                      │",n:""},
          {c:"  │  ETW-TI (Event Tracing for Windows-Threat Intel):   │",n:""},
          {c:"  │    Microsoft-Windows-Threat-Intelligence provider    │",n:"ETW-TI: special kernel ETW provider. Fires on process injection, credential access. More telemetry than callbacks alone."},
          {c:"  │    → THREATINT_PROCESS_INJECT                        │",n:""},
          {c:"  │    → THREATINT_ALLOCVM_REMOTE                        │",n:""},
          {c:"  └─────────────────────────────────────────────────────┘",n:""},
          {c:"",n:""},
          {c:"EVENT FLOW:",n:""},
          {c:"  1. Malware calls VirtualAllocEx on lsass.exe",n:""},
          {c:"  2. Kernel: ObRegisterCallback fires → EDR checks caller",n:""},
          {c:"  3. EDR: non-SYSTEM process requesting rwx in lsass",n:""},
          {c:"  4. EDR: send telemetry to cloud + apply local policy",n:""},
          {c:"  5. Policy: BLOCK (prevention) or ALERT (detection mode)",n:"Prevention: EDR returns ACCESS_DENIED. Detection-only: allows but alerts SOC."},
          {c:"  6. Cloud: correlate with process tree, parent, user",n:"Single event may be benign. Pattern across time/processes = threat."},
          {c:"  7. Alert surfaced to analyst in EDR console",n:""},
        ]},
        {type:"code", lang:"analysis", label:"EDR EVASION TECHNIQUES — Know to Defend Against", lines:[
          {c:"TECHNIQUE              │ MECHANISM                          │ DETECTION SIGNAL",n:""},
          {c:"───────────────────────┼────────────────────────────────────┼────────────────────────────",n:""},
          {c:"Direct Syscalls        │ Skip Win32/ntdll, invoke kernel     │ No ntdll stack frame.",n:"Call syscall number directly. Avoids userland hooks. Detect: ETW-TI still fires at kernel level."},
          {c:"Indirect Syscalls      │ Jump to syscall stub inside ntdll  │ Return addr in ntdll.",n:"More stealthy. Kernel callbacks still fire. Detect via ETW-TI."},
          {c:"Process Hollowing      │ Suspend legit process, swap memory │ Memory vs disk mismatch.",n:""},
          {c:"Unhooking ntdll        │ Overwrite hooked ntdll with clean  │ ntdll section overwrite.",n:"Load clean copy from KnownDlls. Overwrites EDR hooks. Detect: PsSetLoadImageNotifyRoutine."},
          {c:"PPID Spoofing          │ Set arbitrary parent PID at create │ Process tree mismatch.",n:"CreateProcess with PROC_THREAD_ATTRIBUTE_PARENT_PROCESS. cmd.exe appears to come from explorer."},
          {c:"ETW Patching           │ Patch EtwEventWrite() → RET        │ EDR scans for patched exports.",n:"Silences ETW for that process. Detect: EDR scans ntdll exports for modifications."},
          {c:"BYOVD                  │ Load vulnerable signed driver →    │ Allowlisted driver killing EDR.",n:"Bring-Your-Own-Vulnerable-Driver. Use its CVE to write kernel memory → kill EDR driver."},
          {c:"                       │ kill EDR from kernel level          │ WDAC/Defender driver blocklist.",n:""},
          {c:"Token Stealing         │ Duplicate SYSTEM token onto thread │ Privilege spike without elevation.",n:""},
        ]},
      ]},
      { title:"Sysmon — Full Telemetry Setup", tag:"BLUE TEAM", tagColor:C.cyan, content:[
        {type:"h2", text:"Sysmon — The Ultimate Windows Telemetry Source"},
        {type:"p",   text:"Sysmon (System Monitor) is a free Microsoft Sysinternals tool that dramatically improves Windows logging. Without it, Windows events are too sparse for effective threat detection."},
        {type:"code", lang:"xml", label:"Sysmon Config — Production Security Profile", lines:[
          {c:"<!-- Install: sysmon64.exe -accepteula -i sysmonconfig.xml -->",n:""},
          {c:"<!-- Update:  sysmon64.exe -c sysmonconfig.xml             -->",n:""},
          {c:"<Sysmon schemaversion='4.90'>",n:""},
          {c:"  <HashAlgorithms>SHA256,IMPHASH</HashAlgorithms>",n:"IMPHASH: hash of import table. Same malware family = same IMPHASH even if binary is repacked."},
          {c:"  <CheckRevocation/>",n:"Verify code signing certificate revocation. Catches stolen/revoked certs."},
          {c:"  <EventFiltering>",n:""},
          {c:"",n:""},
          {c:"    <!-- EVENT 1: Process Creation -->",n:""},
          {c:"    <RuleGroup name='ProcessCreate' groupRelation='or'>",n:""},
          {c:"      <ProcessCreate onmatch='exclude'>",n:"onmatch='exclude': log everything EXCEPT these patterns."},
          {c:"        <Image condition='is'>C:\\Windows\\System32\\svchost.exe</Image>",n:"svchost spawned by services.exe is normal. Spawned by anything else — log it."},
          {c:"        <CommandLine condition='contains'>MpCmdRun.exe</CommandLine>",n:"Windows Defender scanner — very noisy, exclude."},
          {c:"      </ProcessCreate>",n:""},
          {c:"    </RuleGroup>",n:""},
          {c:"",n:""},
          {c:"    <!-- EVENT 3: Network Connection -->",n:""},
          {c:"    <RuleGroup name='NetworkConnect' groupRelation='or'>",n:""},
          {c:"      <NetworkConnect onmatch='include'>",n:"onmatch='include': only log these specific patterns."},
          {c:"        <Image condition='end with'>\\cmd.exe</Image>",n:"cmd.exe making outbound connection = webshell or reverse shell."},
          {c:"        <Image condition='end with'>\\powershell.exe</Image>",n:"PowerShell outbound = download cradle or C2. High-value event."},
          {c:"        <Image condition='end with'>\\wscript.exe</Image>",n:""},
          {c:"        <Image condition='end with'>\\mshta.exe</Image>",n:""},
          {c:"        <Image condition='end with'>\\rundll32.exe</Image>",n:"rundll32 outbound = LOLBin C2."},
          {c:"        <DestinationPort condition='is'>4444</DestinationPort>",n:"Metasploit default port."},
          {c:"        <DestinationPort condition='is'>1337</DestinationPort>",n:""},
          {c:"      </NetworkConnect>",n:""},
          {c:"    </RuleGroup>",n:""},
          {c:"",n:""},
          {c:"    <!-- EVENT 8: Remote Thread Creation -->",n:""},
          {c:"    <RuleGroup name='CreateRemoteThread' groupRelation='or'>",n:""},
          {c:"      <CreateRemoteThread onmatch='exclude'>",n:""},
          {c:"        <SourceImage condition='is'>C:\\Windows\\System32\\wbem\\WmiPrvSE.exe</SourceImage>",n:"WMI creating threads is normal."},
          {c:"      </CreateRemoteThread>",n:"Log ALL remote thread creation except WMI. CreateRemoteThread = classic injection."},
          {c:"    </RuleGroup>",n:""},
          {c:"",n:""},
          {c:"    <!-- EVENT 10: Process Access (LSASS protection) -->",n:""},
          {c:"    <RuleGroup name='ProcessAccess' groupRelation='or'>",n:""},
          {c:"      <ProcessAccess onmatch='include'>",n:""},
          {c:"        <TargetImage condition='end with'>lsass.exe</TargetImage>",n:"ANY process accessing lsass.exe = potential credential dump. Log all."},
          {c:"        <GrantedAccess condition='contains'>0x1fffff</GrantedAccess>",n:"PROCESS_ALL_ACCESS = Mimikatz/procdump. Always alert on this."},
          {c:"      </ProcessAccess>",n:""},
          {c:"    </RuleGroup>",n:""},
          {c:"",n:""},
          {c:"    <!-- EVENT 17/18: Named Pipe Create/Connect -->",n:"CobaltStrike SMB beacon uses default pipe names. Event 17 catches pipe creation."},
          {c:"    <!-- EVENT 22: DNS Query -->",n:"Critical for DGA detection and C2 domain hunting."},
          {c:"",n:""},
          {c:"  </EventFiltering>",n:""},
          {c:"</Sysmon>",n:""},
        ]},
        {type:"code", lang:"bash", label:"Sysmon Critical Event ID Reference", lines:[
          {c:"ID  │ EVENT NAME            │ KEY FIELDS           │ ATTACK USE CASE",n:""},
          {c:"────┼───────────────────────┼──────────────────────┼──────────────────────────────",n:""},
          {c:"1   │ Process Creation      │ Image,ParentImage,   │ ALL execution detection",n:"Most important event. CommandLine + ParentImage = core of most detections."},
          {c:"    │                       │ CommandLine,Hashes   │",n:""},
          {c:"3   │ Network Connection    │ Image,DestIP,DstPort │ C2, lateral movement",n:""},
          {c:"5   │ Process Terminated    │ Image, ProcessId     │ Short-lived dropper detection",n:"Process lived < 5 seconds = suspicious dropper pattern."},
          {c:"6   │ Driver Loaded         │ ImageLoaded, Signed  │ BYOVD, rootkit driver",n:"Unsigned driver = almost always malicious."},
          {c:"7   │ Image/DLL Loaded      │ ImageLoaded, Signed  │ DLL hijacking, injection",n:""},
          {c:"8   │ CreateRemoteThread    │ SourceImage, Target  │ Process injection",n:""},
          {c:"9   │ RawAccess Read        │ Device, Image        │ MBR read, disk forensics",n:""},
          {c:"10  │ Process Access        │ TargetImage, Access  │ LSASS dump, credential theft",n:""},
          {c:"11  │ File Created          │ TargetFilename       │ Dropper, ransomware extension",n:""},
          {c:"12  │ Registry Object Create│ TargetObject         │ Persistence setup",n:""},
          {c:"13  │ Registry Value Set    │ TargetObject,Details │ Run key persistence",n:"Watch: CurrentVersion\\Run, Winlogon, AppInit_DLLs"},
          {c:"16  │ Sysmon Config Change  │                      │ Attacker disabling Sysmon",n:"If attacker changes Sysmon config = critical. They are trying to go blind."},
          {c:"17  │ Pipe Created          │ PipeName             │ CobaltStrike SMB C2",n:"CS default pipes: msagent_, status_. Alert on unknown pipe names."},
          {c:"22  │ DNS Query             │ QueryName            │ DGA, C2 domain hunting",n:"Log all DNS. High entropy subdomains + NXDomain storms = DGA."},
          {c:"25  │ Process Tampering     │ Image, Type          │ Process hollowing",n:"Sysmon 4.50+: detects process hollowing and herpaderping techniques."},
          {c:"",n:""},
          {c:"# Install Sysmon (Windows VM):",n:""},
          {c:"# sysmon64.exe -accepteula -i sysmonconfig.xml",n:""},
          {c:"# Verify: Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -MaxEvents 5",n:""},
          {c:"",n:""},
          {c:"# Linux equivalent: auditd",n:""},
          {c:"sudo apt install auditd -y",n:""},
          {c:"sudo auditctl -w /etc/passwd -p wa -k passwd_changes",n:"-w: watch file. -p wa: write+attribute changes. -k: key label for filtering."},
          {c:"sudo auditctl -a always,exit -F arch=b64 -S execve -k process_exec",n:"-S execve: watch execve syscall = every process execution on Linux."},
          {c:"sudo auditctl -a always,exit -F arch=b64 -S connect -k network_connect",n:"Watch all outbound connect() calls."},
          {c:"sudo ausearch -k passwd_changes",n:"Search audit log by key label."},
        ]},
      ]},
    ],
  },

  ir: {
    label:"INCIDENT RESPONSE", icon:"🚨", color:C.orange,
    lessons:[
      { title:"IR Playbooks — Step by Step", tag:"OPERATIONAL", tagColor:C.orange, content:[
        {type:"h2", text:"Incident Response Playbooks"},
        {type:"p",   text:"IR playbooks are pre-defined response procedures for specific attack scenarios. Having them ready means analysts respond correctly under pressure. These are the four most critical scenarios."},
        {type:"playbook", plays:[
          { name:"RANSOMWARE", icon:"🔐", color:C.amber, severity:"CRITICAL",
            trigger:"EDR: vssadmin delete shadows | Mass file rename | Canary file modified",
            phases:[
              { name:"DETECTION (0-5 min)", steps:[
                "Confirm: check EDR alert for vssadmin, bcdedit, or mass file extension changes",
                "Identify: which host(s) triggered? Single machine or already spreading?",
                "Check: shadow copies already deleted? Affects recovery options critically",
                "Alert: page IR lead, CISO, legal if PII may be involved",
              ]},
              { name:"CONTAINMENT (5-30 min)", steps:[
                "ISOLATE host immediately via EDR network quarantine — before it spreads further",
                "Block C2: extract IPs/domains from EDR alert → push to firewall blocklist",
                "Disable user account associated with the infected host",
                "Check lateral spread: search EDR for same IOCs on all other endpoints",
                "PRESERVE: take memory dump BEFORE shutting down — volatile evidence",
                "DO NOT REBOOT: ransomware may resume via persistence on next boot",
              ]},
              { name:"ERADICATION (30min - 4hr)", steps:[
                "Identify patient zero: who was infected first? Check authentication logs",
                "Determine initial access: phishing? RDP? Exploit? VPN credential stuffing?",
                "Timeline reconstruction: work backward from first IOC in logs",
                "Scan all hosts: deploy YARA rule for this family via EDR console",
                "Remove persistence: scheduled tasks, Run keys, services created by malware",
              ]},
              { name:"RECOVERY (4hr - days)", steps:[
                "Verify backups: are they intact? Were backup systems connected during infection?",
                "Test restore: restore one non-critical system first, verify functionality",
                "Restore from last clean backup (pre-infection timestamp)",
                "Change ALL credentials: assume all domain creds are compromised",
                "Patch the initial access vector before reconnecting to network",
                "Monitor intensively for 72h post-recovery: watch for re-infection attempt",
              ]},
              { name:"POST-INCIDENT", steps:[
                "Timeline document: exact sequence of attacker actions from logs",
                "IOC extraction: all hashes, IPs, domains, mutex names, file paths",
                "Share IOCs: ISAC, MISP instance, partner organisations",
                "Gap analysis: what detection fired? What didn't? Why not?",
                "Update playbook and SIEM rules based on lessons learned",
              ]},
            ]
          },
          { name:"CREDENTIAL THEFT", icon:"🔑", color:C.red, severity:"HIGH",
            trigger:"Sysmon Event 10: lsass.exe accessed with 0x1fffff | procdump targeting lsass",
            phases:[
              { name:"IMMEDIATE (0-15 min)", steps:[
                "Identify: which process accessed LSASS? What GrantedAccess mask?",
                "Check: is it a known legitimate tool (EDR, AV)? If not — escalate immediately",
                "Scope: has attacker moved laterally already? Check auth logs (Event 4624/4625)",
                "Alert: if domain controller targeted — treat as full domain compromise",
              ]},
              { name:"INVESTIGATION (15-60 min)", steps:[
                "Determine: which credentials were in LSASS at time of dump?",
                "Identify: which users were logged in to that host? All are compromised",
                "Check: Kerberos tickets — any golden/silver ticket indicators in event logs?",
                "Timeline: when did attacker land? What was the initial access vector?",
                "Hunt: search for lateral movement FROM that host (Event 4624 type 3)",
              ]},
              { name:"RESET & HARDEN", steps:[
                "Reset ALL passwords for accounts that had sessions on infected host",
                "KRBTGT reset (twice, 10hr apart) if domain controller was involved",
                "Enable Protected Users group for all privileged accounts",
                "Enable Credential Guard: virtualises LSASS inside hypervisor",
                "Enable PPL (Protected Process Light) for LSASS: RunAsPPL=1 in registry",
                "Block known dumping tools via AppLocker / WDAC policies",
              ]},
            ]
          },
          { name:"WEBSHELL", icon:"🐚", color:C.purple, severity:"HIGH",
            trigger:"Web server spawning cmd.exe/bash | Sysmon Event 1: apache2/nginx → shell process",
            phases:[
              { name:"CONFIRM & SCOPE (0-20 min)", steps:[
                "Confirm: check process tree — did web server spawn an interactive shell?",
                "Identify: which web application? URL path of the webshell request?",
                "Check: how long present? Git blame, access log timestamps, file mtime",
                "What commands ran? Check bash_history, audit logs, web access logs",
              ]},
              { name:"CONTAIN (20-40 min)", steps:[
                "Take web server offline or restrict public access with maintenance page",
                "Preserve webshell file as evidence before deletion",
                "Memory dump of web server process — commands may be in memory",
                "Block attacker source IP at WAF/firewall (buys time, attacker may pivot)",
              ]},
              { name:"FORENSICS (40min - 3hr)", steps:[
                "Web access logs: find all requests to the webshell URL path",
                "Find uploaded files: check /tmp, /uploads, all new files in webroot",
                "Hunt additional webshells: find all PHP/ASP files newer than expected",
                "Database audit: did attacker query DB? Check DB query logs",
                "Network: did server reach out to C2? Review outbound connection logs",
              ]},
              { name:"REMEDIATE", steps:[
                "Remove webshell and all backdoors found during investigation",
                "Identify root vulnerability: file upload? RCE? SQLi? Patch it",
                "Reset web application service account credentials",
                "Deploy WAF rules to block webshell request patterns",
                "Code review: how was shell uploaded? Fix the vulnerability class entirely",
              ]},
            ]
          },
          { name:"LATERAL MOVEMENT", icon:"↔", color:C.cyan, severity:"HIGH",
            trigger:"Event 4624 type 3 from unexpected source | Service install Event 7045",
            phases:[
              { name:"DETECT & SCOPE (0-20 min)", steps:[
                "Map movement: which hosts did attacker traverse? (Event 4624 type 3 chain)",
                "Identify accounts used: NTLM? Kerberos? Which credential was abused?",
                "Check: did they reach domain controller? Critical escalation if yes",
                "Timeline: when did each hop occur? How quickly did they move?",
              ]},
              { name:"CONTAIN", steps:[
                "Isolate all hosts attacker touched via EDR network quarantine",
                "Disable compromised accounts immediately",
                "Block known-bad source IPs in internal firewall segmentation",
                "Rotate KRBTGT if Kerberos tickets are suspected compromised",
              ]},
              { name:"ERADICATE & HARDEN", steps:[
                "Reset passwords for ALL accounts used during the movement chain",
                "Enforce LAPS: unique local admin password per host (blocks hash reuse)",
                "Enable SMB signing: prevents relay attacks feeding pass-the-hash",
                "Disable NTLM where possible: enforce Kerberos across the domain",
                "Implement admin tiering: tier 0 (DC) isolated from tier 1 (servers)",
                "Network segmentation: prevent direct east-west workstation traffic",
              ]},
            ]
          },
        ]},
      ]},
      { title:"Digital Forensics Investigation", tag:"FORENSICS", tagColor:C.cyan, content:[
        {type:"h2", text:"Digital Forensics — Evidence Collection & Timeline"},
        {type:"p",   text:"Forensic investigation collects, preserves, and analyses digital evidence. Proper handling ensures chain of custody. Always follow the order of volatility — most ephemeral evidence first."},
        {type:"code", lang:"analysis", label:"ORDER OF VOLATILITY — What to Collect First", lines:[
          {c:"ORDER OF VOLATILITY (most volatile → least volatile)",n:""},
          {c:"════════════════════════════════════════════════════════════",n:""},
          {c:"",n:""},
          {c:"1. CPU REGISTERS & CACHE      (lost on any context switch)",n:"Captured by debugger only. Rarely practical in IR. For live analysis of running malware only."},
          {c:"2. ROUTING TABLE / ARP CACHE  (seconds to minutes)",n:"ip route show; arp -n — recently contacted hosts on local subnet."},
          {c:"3. PROCESS TABLE              (changes every seconds)",n:"ps aux — capture before any process is terminated."},
          {c:"4. NETWORK CONNECTIONS        (seconds to hours)",n:"ss -antp — active C2 connections visible only in this window."},
          {c:"5. MEMORY (RAM)               (lost on power-off)",n:"PRIMARY TARGET. Contains: decrypted payloads, injected code, cleartext keys, C2 config."},
          {c:"6. TEMPORARY FILE SYSTEM      (/tmp, %TEMP%)",n:"Droppers often write here. Cleared on reboot."},
          {c:"7. DISK                        (persistent — collect last)",n:"Survives reboots. Largest volume. Collect: MFT, event logs, prefetch, registry hives."},
          {c:"8. REMOTE LOGGING             (syslog, SIEM)",n:"Already preserved remotely. Least urgent to capture from endpoint."},
          {c:"",n:""},
          {c:"RULE: Capture high-volatility evidence FIRST, then persistent",n:""},
          {c:"      Never shut down a live system before capturing RAM",n:"Shutdown destroys all volatile evidence. Power loss = gone permanently."},
        ]},
        {type:"code", lang:"bash", label:"Evidence Collection Script — Linux IR", lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"# ir_collect.sh — Live Linux forensic evidence collection",n:""},
          {c:"# Run as root. Write output to EXTERNAL media only.",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"",n:""},
          {c:"CASE_DIR=\"/mnt/external/case_$(date +%Y%m%d_%H%M%S)\"",n:"External media. NEVER write to suspect disk — overwrites potential artefacts."},
          {c:"mkdir -p \"$CASE_DIR\"/{volatile,memory,disk,network,logs}",n:""},
          {c:"",n:""},
          {c:"log() { echo \"[$(date +%H:%M:%S)] $*\" | tee -a \"$CASE_DIR/collection.log\"; }",n:"Log every step with timestamp. Establishes chain of custody documentation."},
          {c:"",n:""},
          {c:"log '=== PHASE 1: VOLATILE DATA ==='",n:""},
          {c:"date -u > \"$CASE_DIR/volatile/timestamp.txt\"",n:"Record exact collection time in UTC. Critical for timeline reconstruction."},
          {c:"hostname -f >> \"$CASE_DIR/volatile/timestamp.txt\"",n:""},
          {c:"uptime >> \"$CASE_DIR/volatile/timestamp.txt\"",n:""},
          {c:"",n:""},
          {c:"# Full process snapshot with environment",n:""},
          {c:"ps auxwwef > \"$CASE_DIR/volatile/processes.txt\"",n:"-e: environment vars. -ww: no line truncation. Captures full command lines including long args."},
          {c:"ls -la /proc/[0-9]*/exe 2>/dev/null > \"$CASE_DIR/volatile/proc_exe.txt\"",n:"'(deleted)' in output = binary executed then removed. Classic fileless/dropper indicator."},
          {c:"for pid in /proc/[0-9]*/; do",n:""},
          {c:"    p=$(basename \"$pid\")",n:""},
          {c:"    cmdline=$(tr '\\0' ' ' < \"$pid/cmdline\" 2>/dev/null || echo '')",n:""},
          {c:"    ppid=$(awk '/PPid/{print $2}' \"$pid/status\" 2>/dev/null || echo 0)",n:""},
          {c:"    echo \"PID:$p PPID:$ppid CMD:$cmdline\"",n:""},
          {c:"done >> \"$CASE_DIR/volatile/proc_tree.txt\"",n:"Process tree with full command lines. Core IR artefact for attack chain reconstruction."},
          {c:"",n:""},
          {c:"# Network state at time of collection",n:""},
          {c:"ss -antp > \"$CASE_DIR/network/connections.txt\"",n:"All TCP connections with associated process. Active C2 connections visible here."},
          {c:"ip route show > \"$CASE_DIR/network/routes.txt\"",n:""},
          {c:"arp -n > \"$CASE_DIR/network/arp.txt\"",n:"ARP cache: recently contacted hosts on local subnet. Lateral movement evidence."},
          {c:"cat /proc/net/tcp > \"$CASE_DIR/network/proc_net_tcp.txt\"",n:"Raw kernel TCP table. Compare with ss output — discrepancy = rootkit hiding connections."},
          {c:"",n:""},
          {c:"# Currently logged-in users",n:""},
          {c:"who > \"$CASE_DIR/volatile/logged_in_users.txt\"",n:"Active sessions. Attacker's live session may appear here."},
          {c:"last -20 > \"$CASE_DIR/volatile/recent_logins.txt\"",n:"Last 20 login events from /var/log/wtmp."},
          {c:"",n:""},
          {c:"log '=== PHASE 2: MEMORY CAPTURE ==='",n:""},
          {c:"if command -v avml &>/dev/null; then",n:""},
          {c:"    avml \"$CASE_DIR/memory/memdump.raw\"",n:"AVML: Microsoft tool. No kernel module needed. github.com/microsoft/avml"},
          {c:"    sha256sum \"$CASE_DIR/memory/memdump.raw\" > \"$CASE_DIR/memory/memdump.sha256\"",n:"Hash the dump. Proves integrity — essential for legal chain of custody."},
          {c:"    log \"Memory captured: $(du -sh \"$CASE_DIR/memory/memdump.raw\" | cut -f1)\"",n:""},
          {c:"else",n:""},
          {c:"    log 'AVML not found. Install: https://github.com/microsoft/avml'",n:""},
          {c:"fi",n:""},
          {c:"",n:""},
          {c:"log '=== PHASE 3: DISK ARTEFACTS ==='",n:""},
          {c:"crontab -l -u root 2>/dev/null > \"$CASE_DIR/disk/root_cron.txt\" || true",n:""},
          {c:"cat /etc/crontab /etc/cron.d/* 2>/dev/null > \"$CASE_DIR/disk/system_cron.txt\" || true",n:""},
          {c:"systemctl list-units --type=service --state=active > \"$CASE_DIR/disk/active_services.txt\"",n:""},
          {c:"find /tmp /dev/shm /var/tmp /run -type f 2>/dev/null > \"$CASE_DIR/disk/temp_files.txt\"",n:"All files in world-writable directories. Dropper and implant locations."},
          {c:"",n:""},
          {c:"# Preserve all logs",n:""},
          {c:"cp -a /var/log/ \"$CASE_DIR/logs/var_log/\" 2>/dev/null || true",n:"-a: archive mode preserves timestamps. Copying before they rotate."},
          {c:"journalctl --no-pager > \"$CASE_DIR/logs/journal_full.txt\" 2>/dev/null || true",n:"Full systemd journal: all service logs, kernel messages, auth events."},
          {c:"",n:""},
          {c:"log '=== COLLECTION COMPLETE ==='",n:""},
          {c:"sha256sum \"$CASE_DIR\"/**/* 2>/dev/null > \"$CASE_DIR/manifest.sha256\" || true",n:"Hash all collected files. Integrity manifest for legal proceedings."},
        ]},
      ]},
    ],
  },

  detection: {
    label:"DETECTION ENGINEERING", icon:"⚡", color:C.purple,
    lessons:[
      { title:"Building a Detection Pipeline", tag:"ENGINEERING", tagColor:C.purple, content:[
        {type:"h2", text:"Detection Engineering — Building Production Detections"},
        {type:"p",   text:"Detection engineering is the discipline of systematically building, testing, and maintaining detections. Not ad-hoc rule writing — a repeatable engineering process with coverage metrics."},
        {type:"code", lang:"analysis", label:"DETECTION ENGINEERING LIFECYCLE", lines:[
          {c:"DETECTION ENGINEERING LIFECYCLE",n:""},
          {c:"════════════════════════════════════════════════════════════",n:""},
          {c:"",n:""},
          {c:"1. IDENTIFY THREAT",n:""},
          {c:"   → Threat intel: new malware family or TTP from CTI report",n:""},
          {c:"   → Red team finding: technique that evaded existing detection",n:""},
          {c:"   → Incident post-mortem: attacker technique we missed",n:"Detection gap from real incident: most valuable input possible."},
          {c:"   → ATT&CK gap analysis: techniques with zero detection coverage",n:"ATT&CK Navigator heatmap shows which techniques you cover visually."},
          {c:"",n:""},
          {c:"2. RESEARCH THE TECHNIQUE",n:""},
          {c:"   → Understand exactly how the attack works (MOD-02/03 content)",n:""},
          {c:"   → What artefacts does it leave? (process, file, network, registry)",n:""},
          {c:"   → What data sources capture those artefacts?",n:""},
          {c:"   → Are those data sources available in our environment?",n:""},
          {c:"",n:""},
          {c:"3. REPRODUCE IN LAB",n:""},
          {c:"   → Replicate the technique in isolated VM",n:""},
          {c:"   → Capture all artefacts produced",n:""},
          {c:"   → Identify the MINIMUM distinguishing artefact",n:"Minimum = fewest conditions that separate malicious from benign. Less = fewer false positives."},
          {c:"",n:""},
          {c:"4. WRITE DETECTION RULE",n:""},
          {c:"   → YARA: for file-level detection",n:""},
          {c:"   → SIGMA: for log-level detection (SIEM-agnostic)",n:""},
          {c:"   → Custom script: for complex behavioural/statistical detection",n:""},
          {c:"",n:""},
          {c:"5. TEST AGAINST KNOWN-GOOD",n:""},
          {c:"   → Run detection against 30 days of production logs",n:""},
          {c:"   → Count false positives: >5/day = tune the rule",n:"Alert fatigue: analysts ignore all alerts when FP rate is high. Death of a detection program."},
          {c:"",n:""},
          {c:"6. TEST AGAINST KNOWN-BAD",n:""},
          {c:"   → Run detection against malware samples in lab",n:""},
          {c:"   → Verify it fires on the intended technique",n:""},
          {c:"   → Test variants: different tools doing the same TTP",n:"Good detection: fires on T1059.001 regardless of tool. Bad: fires only on specific binary name."},
          {c:"",n:""},
          {c:"7. DEPLOY & MONITOR",n:""},
          {c:"   → Deploy in detection-only mode first",n:""},
          {c:"   → Monitor FP rate for 2 weeks in production",n:""},
          {c:"   → Tune: add exclusions, raise threshold, add context",n:""},
          {c:"   → Promote: detection → alert → optionally block",n:""},
          {c:"",n:""},
          {c:"8. MAINTAIN",n:""},
          {c:"   → Review monthly: still relevant? OS update changed behaviour?",n:""},
          {c:"   → Retire stale rules: outdated technique, removed software",n:""},
          {c:"   → Track coverage: ATT&CK heatmap of all detections",n:""},
        ]},
        {type:"code", lang:"python", label:"Alert Enrichment Script — SIEM Pipeline", lines:[
          {c:"#!/usr/bin/env python3",n:""},
          {c:"\"\"\"alert_enricher.py — Enrich SIEM alerts with threat intel and context\"\"\"",n:""},
          {c:"import json, os, sys, re",n:""},
          {c:"from urllib.request import urlopen, Request",n:""},
          {c:"from urllib.error import URLError",n:""},
          {c:"from datetime import datetime, timezone",n:""},
          {c:"from dataclasses import dataclass, field",n:""},
          {c:"",n:""},
          {c:"VT_KEY    = os.environ.get('VT_API_KEY', '')",n:"Never hardcode API keys. Read from environment."},
          {c:"ABUSEIPDB = os.environ.get('ABUSEIPDB_KEY', '')",n:"AbuseIPDB: reports of malicious IP activity. Free 1000 checks/day."},
          {c:"",n:""},
          {c:"@dataclass",n:""},
          {c:"class EnrichedAlert:",n:""},
          {c:"    alert_id:   str",n:""},
          {c:"    rule_name:  str",n:""},
          {c:"    severity:   str",n:""},
          {c:"    host:       str",n:""},
          {c:"    user:       str  = ''",n:""},
          {c:"    cmdline:    str  = ''",n:""},
          {c:"    iocs:       dict = field(default_factory=dict)",n:""},
          {c:"    enrichment: dict = field(default_factory=dict)",n:""},
          {c:"    risk_score: int  = 0",n:""},
          {c:"    actions:    list = field(default_factory=list)",n:"Recommended analyst actions based on rule and enrichment."},
          {c:"    ts:         str  = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())",n:""},
          {c:"",n:""},
          {c:"def check_abuseipdb(ip: str) -> dict:",n:""},
          {c:"    if not ABUSEIPDB: return {}",n:""},
          {c:"    url = f'https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90'",n:""},
          {c:"    try:",n:""},
          {c:"        req = Request(url, headers={'Key': ABUSEIPDB, 'Accept': 'application/json'})",n:""},
          {c:"        with urlopen(req, timeout=10) as r:",n:""},
          {c:"            d = json.loads(r.read())['data']",n:""},
          {c:"            return {'abuse_score': d.get('abuseConfidenceScore',0),",n:"abuseConfidenceScore 0-100. >75 = high confidence malicious."},
          {c:"                    'country': d.get('countryCode',''),",n:""},
          {c:"                    'reports': d.get('totalReports',0)}",n:""},
          {c:"    except (URLError, KeyError): return {}",n:""},
          {c:"",n:""},
          {c:"def extract_iocs(cmdline: str) -> dict:",n:""},
          {c:"    iocs = {}",n:""},
          {c:"    if ips := re.findall(r'\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', cmdline): iocs['ips'] = ips",n:"Walrus operator :=  — assign and check in one step. Python 3.8+."},
          {c:"    if urls := re.findall(r'https?://[\\S]+', cmdline):               iocs['urls'] = urls",n:""},
          {c:"    if b64  := re.findall(r'[A-Za-z0-9+/]{50,}={0,2}', cmdline):     iocs['b64'] = [x[:40]+'...' for x in b64]",n:"Base64 50+ chars = likely encoded payload."},
          {c:"    if '-EncodedCommand' in cmdline or ' -enc ' in cmdline.lower():",n:""},
          {c:"        iocs['obfuscated_ps'] = True",n:"PowerShell encoded command = obfuscation. High-risk indicator."},
          {c:"    return iocs",n:""},
          {c:"",n:""},
          {c:"RULE_ACTIONS = {",n:"Map rule names to recommended analyst actions."},
          {c:"    'LSASS_Dump':        ['Isolate host', 'Reset all creds on host', 'Hunt lateral movement'],",n:""},
          {c:"    'Shadow_Deletion':   ['RANSOMWARE IR', 'Check encryption status', 'Network isolate NOW'],",n:""},
          {c:"    'PowerShell_Download':['Check child processes', 'Extract decoded payload', 'Hunt similar hosts'],",n:""},
          {c:"    'Webshell_Detected': ['Take web server offline', 'Preserve webshell', 'Check DB access'],",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"def enrich_alert(raw: dict) -> EnrichedAlert:",n:""},
          {c:"    a = EnrichedAlert(alert_id=raw.get('id',''), rule_name=raw.get('rule',''),",n:""},
          {c:"                      severity=raw.get('severity','medium'), host=raw.get('host',''),",n:""},
          {c:"                      user=raw.get('user',''), cmdline=raw.get('cmdline',''))",n:""},
          {c:"    a.iocs    = extract_iocs(a.cmdline)",n:""},
          {c:"    a.actions = RULE_ACTIONS.get(a.rule_name, ['Investigate manually'])",n:""},
          {c:"    score = {'critical':90,'high':70,'medium':40,'low':10}.get(a.severity.lower(), 30)",n:""},
          {c:"    if a.iocs.get('obfuscated_ps'): score += 15",n:""},
          {c:"    if 'lsass' in a.cmdline.lower():  score += 20",n:""},
          {c:"    a.risk_score = min(score, 100)",n:""},
          {c:"    for ip in a.iocs.get('ips', [])[:3]:",n:"Limit to 3 IPs to avoid burning API quota on noisy alerts."},
          {c:"        abuse = check_abuseipdb(ip)",n:""},
          {c:"        if abuse: a.enrichment[ip] = abuse",n:""},
          {c:"        if abuse.get('abuse_score',0) > 75: a.risk_score = min(a.risk_score+15, 100)",n:""},
          {c:"    return a",n:""},
          {c:"",n:""},
          {c:"if __name__ == '__main__':",n:""},
          {c:"    raw = json.loads(sys.stdin.read())",n:"Read alert JSON from stdin. Pipe-friendly: cat alert.json | python3 alert_enricher.py"},
          {c:"    from dataclasses import asdict",n:""},
          {c:"    print(json.dumps(asdict(enrich_alert(raw)), indent=2))",n:""},
        ]},
      ]},
      { title:"Monitoring Scripts & SIGMA Rules", tag:"PRACTICAL", tagColor:C.green, content:[
        {type:"h2", text:"Security Monitoring & SIGMA Rule Writing"},
        {type:"code", lang:"yaml", label:"SIGMA Rules — Production Examples", lines:[
          {c:"# ── SIGMA RULE ANATOMY ────────────────────────────────────────",n:""},
          {c:"title: LSASS Memory Access by Non-Legitimate Process",n:"Title used in SIEM alert names. Be specific — not 'Suspicious Activity'."},
          {c:"id: a1b2c3d4-e5f6-7890-abcd-ef1234567890",n:"UUID v4. Generate: python3 -c 'import uuid; print(uuid.uuid4())'"},
          {c:"status: stable",n:"stable | test | experimental | deprecated"},
          {c:"description: Detects LSASS memory access attempts for credential dumping.",n:""},
          {c:"references:",n:""},
          {c:"    - https://attack.mitre.org/techniques/T1003/001/",n:""},
          {c:"author: sac14",n:""},
          {c:"date: 2024/01/15",n:""},
          {c:"tags:",n:""},
          {c:"    - attack.credential_access",n:"ATT&CK tactic: lowercase with underscores."},
          {c:"    - attack.t1003.001",n:"ATT&CK technique ID."},
          {c:"logsource:",n:""},
          {c:"    category: process_access",n:"Sysmon Event 10 (ProcessAccess)."},
          {c:"    product: windows",n:""},
          {c:"detection:",n:""},
          {c:"    selection:",n:""},
          {c:"        TargetImage|endswith: '\\lsass.exe'",n:"endswith: field modifier. Match path suffix."},
          {c:"        GrantedAccess|contains:",n:"contains: any of these values."},
          {c:"            - '0x1fffff'",n:"PROCESS_ALL_ACCESS: definitive dump indicator."},
          {c:"            - '0x1010'",n:"PROCESS_VM_READ + PROCESS_QUERY_INFORMATION: minimum for credential dump."},
          {c:"            - '0x143a'",n:"Common procdump access mask."},
          {c:"    filter_legit:",n:""},
          {c:"        SourceImage|contains:",n:""},
          {c:"            - 'MsMpEng.exe'",n:"Windows Defender — legitimately accesses LSASS."},
          {c:"            - 'werfault.exe'",n:"Windows Error Reporting."},
          {c:"    condition: selection and not filter_legit",n:"Boolean: selection AND NOT filter. Core SIGMA logic pattern."},
          {c:"falsepositives:",n:""},
          {c:"    - EDR and AV products accessing LSASS for monitoring",n:""},
          {c:"level: high",n:"informational | low | medium | high | critical"},
          {c:"",n:""},
          {c:"---",n:""},
          {c:"",n:""},
          {c:"# ── PRODUCTION RULE 2: Ransomware Shadow Copy Deletion ────────",n:""},
          {c:"title: Ransomware Shadow Copy Deletion Command",n:""},
          {c:"id: f2a3b4c5-d6e7-8901-bcde-f23456789012",n:""},
          {c:"status: stable",n:""},
          {c:"logsource:",n:""},
          {c:"    category: process_creation",n:"Sysmon Event 1 OR Windows Event 4688."},
          {c:"    product: windows",n:""},
          {c:"detection:",n:""},
          {c:"    selection_vss:",n:""},
          {c:"        CommandLine|contains|all:",n:"|contains|all: ALL of these strings must be in CommandLine."},
          {c:"            - 'vssadmin'",n:""},
          {c:"            - 'delete'",n:""},
          {c:"            - 'shadows'",n:"All three = shadow copy deletion. No legitimate admin use case."},
          {c:"    selection_wmic:",n:""},
          {c:"        CommandLine|contains|all:",n:""},
          {c:"            - 'wmic'",n:""},
          {c:"            - 'shadowcopy'",n:""},
          {c:"            - 'delete'",n:""},
          {c:"    selection_bcde:",n:""},
          {c:"        CommandLine|contains|all:",n:""},
          {c:"            - 'bcdedit'",n:""},
          {c:"            - 'recoveryenabled'",n:""},
          {c:"            - 'no'",n:""},
          {c:"    condition: 1 of selection_*",n:"1 of selection_*: ANY one of the named groups matches. OR logic across groups."},
          {c:"level: critical",n:"Critical: page on-call analyst immediately."},
          {c:"",n:""},
          {c:"# ── SIGMA CONVERSION ─────────────────────────────────────────",n:""},
          {c:"# pip install pySigma pySigma-backend-splunk pySigma-backend-elasticsearch",n:""},
          {c:"# sigma convert -t splunk       -p windows-sysmon rule.yml",n:"Output: Splunk SPL search string, paste into saved search."},
          {c:"# sigma convert -t elasticsearch-eql -p windows-sysmon rule.yml",n:""},
          {c:"# sigma convert -t kusto        -p windows-sysmon rule.yml",n:"Azure Sentinel KQL query."},
          {c:"# sigma check rule.yml",n:"Validate rule syntax: required fields, valid modifiers, condition logic."},
        ]},
        {type:"code", lang:"bash", label:"Real-Time Security Monitoring Pipeline (Linux)", lines:[
          {c:"#!/usr/bin/env bash",n:""},
          {c:"# monitor.sh — Unified security monitoring daemon",n:""},
          {c:"set -euo pipefail",n:""},
          {c:"",n:""},
          {c:"readonly ALERT_LOG='/var/log/security/threats.jsonl'",n:".jsonl = JSON Lines: one JSON object per line. Streamable and appendable."},
          {c:"readonly WEBHOOK=\"${SLACK_WEBHOOK:-}\"",n:"Optional Slack. Set: export SLACK_WEBHOOK='https://hooks.slack.com/...'"},
          {c:"mkdir -p \"$(dirname \"$ALERT_LOG\")\"",n:""},
          {c:"",n:""},
          {c:"alert() {",n:""},
          {c:"    local sev=\"$1\" rule=\"$2\" detail=\"$3\"",n:""},
          {c:"    local ts; ts=$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")",n:""},
          {c:"    local json; json=$(printf '{\"ts\":\"%s\",\"host\":\"%s\",\"severity\":\"%s\",\"rule\":\"%s\",\"detail\":\"%s\"}' \\",n:""},
          {c:"        \"$ts\" \"$(hostname -f)\" \"$sev\" \"$rule\" \"$detail\")",n:""},
          {c:"    echo \"$json\" | tee -a \"$ALERT_LOG\"",n:""},
          {c:"    [[ -n \"$WEBHOOK\" ]] && curl -s -X POST \"$WEBHOOK\" \\",n:""},
          {c:"        -H 'Content-type: application/json' \\",n:""},
          {c:"        -d \"{\\\"text\\\":\\\"[$sev] $rule: $detail\\\"}\" &>/dev/null &",n:"& = background: async Slack notify. Does not block monitoring loop."},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"watch_auth() {",n:""},
          {c:"    declare -A counts",n:""},
          {c:"    tail -F /var/log/auth.log 2>/dev/null | grep --line-buffered 'Failed password' | \\",n:"tail -F: follows file and reopens on rotation. --line-buffered: flush each line immediately."},
          {c:"    while IFS= read -r line; do",n:""},
          {c:"        ip=$(echo \"$line\" | grep -oE '[0-9]{1,3}(\\.[0-9]{1,3}){3}' | tail -1)",n:""},
          {c:"        [[ -z \"$ip\" ]] && continue",n:""},
          {c:"        (( counts[$ip]++ )) || true",n:""},
          {c:"        if (( ${counts[$ip]} >= 10 )); then",n:""},
          {c:"            alert 'HIGH' 'BRUTE_FORCE' \"IP $ip: ${counts[$ip]} SSH failures\"",n:""},
          {c:"            unset counts[$ip]",n:"Reset counter to avoid alert storm on same IP."},
          {c:"        fi",n:""},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"watch_drops() {",n:""},
          {c:"    inotifywait -m -r -e create,moved_to \\",n:""},
          {c:"        /tmp /dev/shm /var/tmp /run --format '%w%f' 2>/dev/null | \\",n:""},
          {c:"    while IFS= read -r fp; do",n:""},
          {c:"        [[ -f \"$fp\" && -x \"$fp\" ]] && alert 'HIGH' 'EXEC_DROP' \"Executable: $fp\"",n:"Executable dropped in world-writable temp dir = dropper stage."},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"watch_shells() {",n:""},
          {c:"    local -A seen",n:""},
          {c:"    while true; do",n:""},
          {c:"        while IFS= read -r line; do",n:""},
          {c:"            pid=$(echo \"$line\" | grep -oE 'pid=([0-9]+)' | cut -d= -f2)",n:""},
          {c:"            [[ -z \"$pid\" || -n \"${seen[$pid]:-}\" ]] && continue",n:""},
          {c:"            seen[$pid]=1",n:""},
          {c:"            comm=$(cat \"/proc/$pid/comm\" 2>/dev/null || echo '')",n:""},
          {c:"            ppid=$(awk '/PPid/{print $2}' \"/proc/$pid/status\" 2>/dev/null || echo 0)",n:""},
          {c:"            parent=$(cat \"/proc/$ppid/comm\" 2>/dev/null || echo 'unknown')",n:""},
          {c:"            if [[ \"$parent\" =~ ^(apache2|nginx|php-fpm|node|java)$ ]] \\",n:""},
          {c:"               && [[ \"$comm\" =~ ^(bash|sh|python3?|nc|curl|wget)$ ]]; then",n:""},
          {c:"                cmd=$(tr '\\0' ' ' < \"/proc/$pid/cmdline\" 2>/dev/null | head -c 200)",n:""},
          {c:"                alert 'CRITICAL' 'WEBSHELL' \"$parent($ppid)→$comm($pid): $cmd\"",n:"Web server spawning shell = webshell or RCE exploit. Critical alert."},
          {c:"            fi",n:""},
          {c:"        done < <(ss -Htp state established 2>/dev/null)",n:""},
          {c:"        sleep 3",n:""},
          {c:"    done",n:""},
          {c:"}",n:""},
          {c:"",n:""},
          {c:"echo \"[*] Monitor starting: $(date)\"",n:""},
          {c:"watch_auth  &",n:""},
          {c:"watch_drops &",n:""},
          {c:"watch_shells &",n:""},
          {c:"trap 'kill %1 %2 %3 2>/dev/null' EXIT INT TERM",n:"Kill all background watchers on exit."},
          {c:"wait",n:"Block until killed."},
        ]},
      ]},
    ],
  },

  hunting: {
    label:"THREAT HUNTING", icon:"🎯", color:C.cyan,
    lessons:[
      { title:"Hunt Queries & Beaconing Detector", tag:"PRACTICAL", tagColor:C.cyan, content:[
        {type:"h2", text:"Threat Hunting — Queries & Statistical Detection"},
        {type:"code", lang:"analysis", label:"HUNT LIBRARY — Splunk SPL Queries", lines:[
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"HUNT: PowerShell Encoded Command (T1059.001)",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"index=windows (EventCode=4688 OR source=sysmon EventCode=1)",n:""},
          {c:"| where match(CommandLine, '(?i)(-EncodedCommand|-Enc|-e[nc]* )')",n:""},
          {c:"| where NOT match(ParentImage, '(?i)(sccm|ccmexec|wsus)')",n:"Exclude known-legitimate encoded PS from config management tools."},
          {c:"| table _time, ComputerName, User, ParentImage, CommandLine",n:""},
          {c:"| sort -_time",n:""},
          {c:"WHY: PowerShell -EncodedCommand base64-encodes payload to evade logging.",n:""},
          {c:"",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"HUNT: LSASS Access for Credential Dumping (T1003.001)",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"index=windows source=sysmon EventCode=10",n:"Sysmon Event 10: ProcessAccess"},
          {c:"| where TargetImage LIKE '%lsass.exe'",n:""},
          {c:"| where NOT match(SourceImage, '(?i)(MsMpEng|svchost|werfault|csrss)')",n:"Exclude known-legitimate LSASS accessors."},
          {c:"| eval risk = case(GrantedAccess=='0x1fffff','CRITICAL-ALL_ACCESS',",n:""},
          {c:"                   GrantedAccess=='0x1010','HIGH-MIMIKATZ',1==1,'MEDIUM')",n:""},
          {c:"| table _time, ComputerName, SourceImage, GrantedAccess, risk",n:""},
          {c:"| sort -_time",n:""},
          {c:"",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"HUNT: Scheduled Task Creation (T1053.005)",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"index=windows EventCode=4698",n:"Event 4698: scheduled task created. Requires auditing enabled."},
          {c:"| rex field=TaskContent '<Command>(?<cmd>[^<]+)</Command>'",n:"rex: extract via regex from XML task definition."},
          {c:"| rex field=TaskContent '<Arguments>(?<args>[^<]+)</Arguments>'",n:""},
          {c:"| eval full_cmd = cmd . ' ' . coalesce(args,'')",n:""},
          {c:"| where match(full_cmd, '(?i)(temp|appdata|[0-9a-f]{8}|powershell.*-enc|mshta|wscript)')",n:""},
          {c:"| table _time, ComputerName, SubjectUserName, TaskName, full_cmd",n:""},
          {c:"",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"HUNT: Statistical Beaconing Detection",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"index=proxy",n:""},
          {c:"| bucket span=1h _time",n:""},
          {c:"| stats count by _time, src_ip, dest_host",n:""},
          {c:"| stats avg(count) as avg_conn, stdev(count) as std_conn",n:""},
          {c:"      values(dest_host) as dests by src_ip",n:""},
          {c:"| where std_conn < 2.0 AND avg_conn > 3",n:"Low std deviation = regular timing = beaconing pattern."},
          {c:"| table src_ip, avg_conn, std_conn, dests",n:""},
          {c:"| sort std_conn",n:"Sort ascending: most regular (most suspicious) first."},
          {c:"",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"HUNT: DGA Domain Detection (High Entropy DNS)",n:""},
          {c:"══════════════════════════════════════════════════════",n:""},
          {c:"index=dns QueryStatus=NXDOMAIN",n:"NXDOMAIN: query returned no answer. DGA = many NXDomains, few successes."},
          {c:"| stats count by src_ip, QueryName",n:""},
          {c:"| eval domain_len = len(QueryName)",n:""},
          {c:"| where domain_len > 20 AND count < 3",n:"Long subdomain + few queries = DGA pattern (not cached, rarely repeated)."},
          {c:"| table _time, src_ip, QueryName, domain_len, count",n:""},
          {c:"| sort -domain_len",n:""},
        ]},
        {type:"code", lang:"python", label:"Statistical Beaconing Detector (Python)", lines:[
          {c:"#!/usr/bin/env python3",n:""},
          {c:"\"\"\"beacon_detector.py — Detect C2 beaconing via connection timing analysis\"\"\"",n:""},
          {c:"import csv, sys, math",n:""},
          {c:"from collections import defaultdict",n:""},
          {c:"from datetime import datetime",n:""},
          {c:"",n:""},
          {c:"def parse_ts(ts: str) -> float:",n:""},
          {c:"    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%SZ']:",n:""},
          {c:"        try: return datetime.strptime(ts.strip(), fmt).timestamp()",n:""},
          {c:"        except ValueError: continue",n:""},
          {c:"    return 0.0",n:""},
          {c:"",n:""},
          {c:"def stats(vals: list) -> dict:",n:""},
          {c:"    if len(vals) < 3: return {}",n:"Need minimum 3 data points for meaningful statistics."},
          {c:"    n    = len(vals)",n:""},
          {c:"    mean = sum(vals) / n",n:"Arithmetic mean interval."},
          {c:"    var  = sum((x - mean)**2 for x in vals) / (n - 1)",n:"Sample variance. Bessel correction: n-1 instead of n."},
          {c:"    sd   = math.sqrt(var)",n:"Standard deviation."},
          {c:"    cv   = (sd / mean * 100) if mean > 0 else 999",n:"Coefficient of Variation: stddev/mean * 100. CV < 15% = very regular."},
          {c:"    return {'count':n, 'mean':round(mean,1), 'sd':round(sd,1), 'cv':round(cv,1)}",n:""},
          {c:"",n:""},
          {c:"def load(path: str) -> dict:",n:""},
          {c:"    conns = defaultdict(list)",n:"Key: (src, dst, port). Value: list of Unix timestamps."},
          {c:"    with open(path) as f:",n:""},
          {c:"        for row in csv.DictReader(f):",n:"DictReader: access CSV columns by name."},
          {c:"            ts = parse_ts(row.get('timestamp',''))",n:""},
          {c:"            if ts == 0.0: continue",n:""},
          {c:"            key = (row.get('src_ip',''), row.get('dst_ip',''), row.get('dst_port',''))",n:""},
          {c:"            conns[key].append(ts)",n:""},
          {c:"    return conns",n:""},
          {c:"",n:""},
          {c:"def detect(conns: dict, min_n: int = 5, max_cv: float = 25.0) -> list:",n:"min_n=5: filter out noise. max_cv=25: allow up to 25% jitter."},
          {c:"    suspects = []",n:""},
          {c:"    for (src,dst,port), ts_list in conns.items():",n:""},
          {c:"        if len(ts_list) < min_n: continue",n:""},
          {c:"        ts_list.sort()",n:""},
          {c:"        intervals = [ts_list[i+1]-ts_list[i] for i in range(len(ts_list)-1)]",n:"Inter-connection intervals."},
          {c:"        intervals = [x for x in intervals if 10 < x < 7200]",n:"Keep intervals 10s-2hr. Filters retries and long gaps."},
          {c:"        s = stats(intervals)",n:""},
          {c:"        if not s or s['cv'] > max_cv: continue",n:""},
          {c:"        suspects.append({",n:""},
          {c:"            'src':src, 'dst':dst, 'port':port,",n:""},
          {c:"            'cv':s['cv'], 'mean_s':s['mean'], 'count':s['count'],",n:""},
          {c:"            'risk': 'HIGH' if s['cv'] < 10 else 'MEDIUM',",n:"CV < 10% = very regular = high suspicion."},
          {c:"        })",n:""},
          {c:"    return sorted(suspects, key=lambda x: x['cv'])",n:"Sort by CV ascending: most regular (suspicious) first."},
          {c:"",n:""},
          {c:"if __name__ == '__main__':",n:""},
          {c:"    if len(sys.argv) < 2: print('Usage: beacon_detector.py <log.csv>'); sys.exit(1)",n:""},
          {c:"    conns    = load(sys.argv[1])",n:""},
          {c:"    suspects = detect(conns)",n:""},
          {c:"    print(f'Analysed {len(conns)} src+dst+port pairs | Suspected beacons: {len(suspects)}')",n:""},
          {c:"    for s in suspects[:20]:",n:"Show top 20."},
          {c:"        print(f\"[{s['risk']:6}] {s['src']:15} → {s['dst']:15}:{s['port']:5}  CV={s['cv']:5.1f}%  interval={s['mean_s']:6.0f}s  count={s['count']}\")",n:""},
        ]},
      ]},
    ],
  },

  labs: {
    label:"LABS", icon:"🧪", color:C.green,
    lessons:[
      { title:"MOD-04 Practical Labs", tag:"HANDS-ON", tagColor:C.green, content:[
        {type:"h2", text:"Detection & Defense Labs"},
        {type:"p",   text:"These labs build real detection infrastructure on your Ubuntu system and Windows VM. Each produces a working artefact you can keep and extend."},
        {type:"lab", entries:[
          { num:"LAB 01", title:"Deploy Sysmon & Validate Telemetry", difficulty:"BEGINNER",
            objective:"Deploy Sysmon on Windows analysis VM with production config. Verify events appear for common attack simulations.",
            steps:[
              "Download Sysmon64 from Microsoft Sysinternals into your Windows VM",
              "Save the sysmonconfig.xml from this module to Desktop",
              "Install: .\\sysmon64.exe -accepteula -i sysmonconfig.xml",
              "Verify: Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -MaxEvents 10",
              "Trigger Event 1: open cmd.exe → Sysmon should log process creation",
              "Trigger Event 3: curl.exe https://google.com → Sysmon logs network connection",
              "Trigger Event 10: powershell Get-Process lsass → Sysmon logs process access",
              "View all events: Event Viewer > Applications and Services > Microsoft > Windows > Sysmon",
              "Count by type: Get-WinEvent -LogName '...Sysmon/Operational' | Group-Object Id | Sort Count -Desc",
            ],
            expected:"Sysmon events visible in Event Viewer. Event IDs 1, 3, and 10 all appear after each trigger.",
            tips:"SwiftOnSecurity/sysmon-config on GitHub is the gold-standard production config. Study its exclusions to understand what generates noise in large environments."
          },
          { num:"LAB 02", title:"Write & Test YARA Detection Rule", difficulty:"BEGINNER",
            objective:"Write a YARA rule that detects a synthetic malware indicator without false-positives on clean files.",
            steps:[
              "Create synthetic malware string: echo 'vssadmin delete shadows HOW TO DECRYPT bitcoin' > /tmp/fake_ransom.txt",
              "Create clean file: echo 'shadow puppets are a form of traditional art' > /tmp/clean.txt",
              "Write ransomware.yar (use rule from MOD-03 as template)",
              "Test on malware: yara -s ransomware.yar /tmp/fake_ransom.txt → should match",
              "Test on clean: yara -s ransomware.yar /tmp/clean.txt → should NOT match",
              "Test on system: yara -r ransomware.yar /usr/bin/ → verify zero false positives",
              "If FPs found: add fullword modifier or tighten the condition logic",
              "Scan /tmp: yara -r ransomware.yar /tmp/",
            ],
            expected:"Rule matches fake_ransom.txt, does NOT match clean.txt or /usr/bin binaries.",
            tips:"Use 'yara -s' (show strings) to see exactly which patterns triggered. Essential for debugging rule specificity."
          },
          { num:"LAB 03", title:"Deploy Monitor Pipeline & Trigger Alerts", difficulty:"INTERMEDIATE",
            objective:"Deploy monitor.sh and trigger each of its three detection rules with simulated attacks.",
            steps:[
              "Save monitor.sh from this module. chmod +x monitor.sh",
              "Install inotify-tools: sudo apt install inotify-tools -y",
              "Create log dir: sudo mkdir -p /var/log/security && sudo chmod 777 /var/log/security",
              "Launch monitor: sudo ./monitor.sh &",
              "Trigger EXEC_DROP: cp /bin/ls /tmp/evil_exec && chmod +x /tmp/evil_exec",
              "Verify: tail /var/log/security/threats.jsonl | python3 -m json.tool",
              "Trigger BRUTE_FORCE: install hydra → run 10 SSH failures against 127.0.0.1",
              "Verify BRUTE_FORCE alert appears in threats.jsonl",
              "Optional: set SLACK_WEBHOOK env var, verify notification arrives in Slack",
            ],
            expected:"threats.jsonl contains EXEC_DROP with /tmp/evil_exec path and BRUTE_FORCE with 127.0.0.1.",
            tips:"Watch live: tail -f /var/log/security/threats.jsonl | python3 -c \"import sys,json; [print(json.dumps(json.loads(l),indent=2)) for l in sys.stdin]\""
          },
          { num:"LAB 04", title:"Run Alert Enrichment Pipeline", difficulty:"INTERMEDIATE",
            objective:"Build and test the alert enrichment pipeline against a synthetic SIEM alert JSON.",
            steps:[
              "Save alert_enricher.py from this module",
              "Create test alert: cat > /tmp/alert.json << EOF",
              "  {\"id\":\"001\",\"rule\":\"PowerShell_Download\",\"severity\":\"high\",",
              "   \"host\":\"WORKSTATION-01\",\"user\":\"jsmith\",",
              "   \"cmdline\":\"powershell -EncodedCommand aGVsbG8gd29ybGQ=\"}",
              "  EOF",
              "Run: python3 alert_enricher.py < /tmp/alert.json",
              "Verify: actions array populated, risk_score > 40, iocs.obfuscated_ps = true",
              "Optional: set VT_API_KEY env and add a real SHA-256 hash to cmdline field",
              "Extend: add a new rule to RULE_ACTIONS dict and test it",
            ],
            expected:"JSON output with actions=[Check child processes...], risk_score >= 55, iocs.obfuscated_ps=true",
            tips:"Decode the test base64: echo 'aGVsbG8gd29ybGQ=' | base64 -d → 'hello world'. Real encoded PS commands are much longer."
          },
          { num:"LAB 05", title:"Beaconing Detection on Synthetic Log", difficulty:"INTERMEDIATE",
            objective:"Generate a proxy log with embedded C2 beaconing and detect it with beacon_detector.py.",
            steps:[
              "Save beacon_detector.py from this module",
              "Generate synthetic log with python3:",
              "  import csv,time,random,sys; w=csv.writer(sys.stdout)",
              "  w.writerow(['timestamp','src_ip','dst_ip','dst_port','bytes'])",
              "  # Normal random traffic: 200 rows to random destinations",
              "  # Beaconing: 60 rows to 198.51.100.1, every 60s ±5s",
              "  Save output: python3 gen_log.py > /tmp/proxy.csv",
              "Run detector: python3 beacon_detector.py /tmp/proxy.csv",
              "Verify: 10.0.0.42 → 198.51.100.1:443 at top with CV < 15%",
              "Tune: change max_cv parameter and observe sensitivity change",
            ],
            expected:"Beaconing host detected at top of results with CV < 15%, mean_interval ≈ 60 seconds.",
            tips:"Real C2 jitter is typically 10-30% of beacon interval. CobaltStrike default: 60s with 20% jitter → CV ≈ 8-12%."
          },
          { num:"LAB 06", title:"CAPSTONE: Full Detection & Response Chain", difficulty:"ADVANCED",
            objective:"Simulate a multi-stage attack chain and catch every phase with the monitoring pipeline, SIGMA rules, and alert enrichment.",
            steps:[
              "Run monitor.sh in background (from Lab 03)",
              "Stage 1 — Brute force: run hydra 10 SSH failures → verify BRUTE_FORCE alert",
              "Stage 2 — Dropper: copy /bin/python3 to /tmp/update_daemon && chmod +x",
              "Verify EXEC_DROP alert fires in threats.jsonl",
              "Stage 3 — Webshell sim: start bash -c 'nc -l 9999' from /tmp directory",
              "Verify WEBSHELL alert (shell from suspicious parent or CWD)",
              "Stage 4 — Run ir_collect.sh to collect forensic evidence for all stages",
              "Stage 5 — Pass each alert JSON through alert_enricher.py",
              "Stage 6 — Write a 1-page incident report: Timeline, IOCs, Root Cause, Remediation",
              "Kill test processes and clean up: rm /tmp/update_daemon",
            ],
            expected:"3+ distinct alerts in threats.jsonl + enriched alert JSON + forensic collection + written incident report.",
            tips:"The incident report is the final deliverable of every IR engagement. Format: Executive Summary → Timeline → IOCs → Root Cause → Remediation → Lessons Learned."
          },
        ]},
      ]},
    ],
  },
};

/* ── COMPONENTS ── */
function CodeBlock({ lines, label, lang }) {
  const [hov, setHov] = useState(null);
  const lc = {python:C.purple,bash:C.green,analysis:C.cyan,xml:C.orange,yaml:C.amber}[lang]||C.cyan;
  return (
    <div style={{margin:"14px 0",border:`1px solid ${C.border}`,borderRadius:4}}>
      <div style={{background:"#0c0408",borderBottom:`1px solid ${C.border}`,padding:"4px 12px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:lc,fontSize:9,fontWeight:700,letterSpacing:"0.1em"}}>{lang.toUpperCase()}</span>
        <span style={{color:C.dim,fontSize:10}}>{label}</span>
        <span style={{marginLeft:"auto",color:"#2a0810",fontSize:9}}>hover line → annotation</span>
      </div>
      <div style={{background:C.bg,fontFamily:"'Fira Code','Courier New',monospace",fontSize:11}}>
        {lines.map((ln,i)=>(
          <div key={i} onMouseEnter={()=>ln.n&&setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{display:"grid",gridTemplateColumns:"32px 1fr",
              background:hov===i?"#150510":"transparent",
              borderLeft:hov===i?`2px solid ${lc}`:"2px solid transparent",
              cursor:ln.n?"pointer":"default"}}>
            <span style={{color:"#2a0810",padding:"0 6px",textAlign:"right",fontSize:10,userSelect:"none",lineHeight:"1.7"}}>{ln.c&&ln.c.trim()?i+1:""}</span>
            <div style={{padding:"0 10px 0 4px",lineHeight:"1.7"}}>
              <span style={{color:
                ln.c.startsWith('#')||ln.c.startsWith('//')||ln.c.startsWith('<!--')?C.dim:
                ln.c.startsWith('══')||ln.c.startsWith('HUNT:')||ln.c.startsWith('WHY:')||ln.c.startsWith('ORDER')||ln.c.startsWith('RULE:')?C.orange:
                ln.c.startsWith('EDR')||ln.c.startsWith('USER')||ln.c.startsWith('KERNEL')||ln.c.startsWith('EVENT')?C.amber:
                C.bright}}>{ln.c}</span>
              {hov===i&&ln.n&&(
                <div style={{marginTop:3,padding:"5px 10px",background:"#0c0408",border:`1px solid ${lc}33`,borderLeft:`3px solid ${lc}`,borderRadius:3,color:C.cyan,fontSize:11,lineHeight:1.5}}>▸ {ln.n}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareBlock({ title, left, right }) {
  return (
    <div style={{margin:"14px 0"}}>
      <div style={{color:C.orange,fontSize:10,letterSpacing:"0.1em",marginBottom:8}}>{title}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[left,right].map((side,si)=>(
          <div key={si} style={{border:`1px solid ${side.color}44`,borderRadius:4}}>
            <div style={{background:side.color+"11",padding:"7px 12px",borderBottom:`1px solid ${side.color}22`}}>
              <span style={{color:side.color,fontSize:10,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{side.label}</span>
            </div>
            <div style={{padding:"10px 12px",background:C.bg}}>
              {side.items.map((item,i)=>(
                <div key={i} style={{marginBottom:9}}>
                  <div style={{color:side.color,fontSize:9,letterSpacing:"0.08em",marginBottom:3}}>{item.head}</div>
                  <div style={{color:C.dim,fontSize:11,lineHeight:1.6,fontFamily:"'Courier New',monospace",whiteSpace:"pre-wrap"}}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaybookView({ plays }) {
  const [active, setActive] = useState(0);
  const [openPh, setOpenPh] = useState(0);
  const sev={CRITICAL:C.red,HIGH:C.orange,MEDIUM:C.amber};
  return (
    <div style={{margin:"14px 0"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {plays.map((p,i)=>(
          <button key={i} onClick={()=>{setActive(i);setOpenPh(0);}} style={{
            background:active===i?p.color+"22":C.bg2,border:`1px solid ${active===i?p.color:C.border}`,
            borderRadius:3,padding:"6px 12px",cursor:"pointer",
            color:active===i?p.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",fontWeight:700,
            display:"flex",alignItems:"center",gap:6}}>
            {p.icon} {p.name}
            <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:sev[p.severity]+"22",color:sev[p.severity]}}>{p.severity}</span>
          </button>
        ))}
      </div>
      {(()=>{
        const p=plays[active];
        return (
          <div style={{border:`1px solid ${p.color}44`,borderRadius:4}}>
            <div style={{background:p.color+"11",padding:"8px 14px",borderBottom:`1px solid ${p.color}22`}}>
              <span style={{color:p.color,fontSize:12,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{p.icon} {p.name} IR PLAYBOOK</span>
              <div style={{color:C.dim,fontSize:10,marginTop:3,fontFamily:"'Courier New',monospace"}}>TRIGGER: {p.trigger}</div>
            </div>
            <div style={{padding:"10px 14px",background:C.bg}}>
              {p.phases.map((ph,pi)=>(
                <div key={pi} style={{marginBottom:6,border:`1px solid ${openPh===pi?p.color+"44":C.border}`,borderRadius:3}}>
                  <div onClick={()=>setOpenPh(openPh===pi?-1:pi)}
                    style={{padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:openPh===pi?p.color+"0a":C.bg2}}>
                    <span style={{color:p.color,fontSize:9,fontWeight:700,minWidth:24}}>{pi+1}.</span>
                    <span style={{color:C.bright,fontSize:11}}>{ph.name}</span>
                    <span style={{marginLeft:"auto",color:C.dim}}>{openPh===pi?"▲":"▼"}</span>
                  </div>
                  {openPh===pi&&(
                    <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`}}>
                      {ph.steps.map((step,si)=>(
                        <div key={si} style={{display:"flex",gap:8,marginBottom:5}}>
                          <span style={{color:p.color,fontSize:10,minWidth:18}}>{si+1}.</span>
                          <span style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.5}}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function LabBlock({ entries }) {
  const [open,setOpen]=useState(0);
  const dc={BEGINNER:C.green,INTERMEDIATE:C.amber,ADVANCED:C.red};
  return (
    <div style={{margin:"12px 0"}}>
      {entries.map((e,i)=>(
        <div key={i} style={{marginBottom:8,border:`1px solid ${open===i?C.purple+"44":C.border}`,borderRadius:4}}>
          <div onClick={()=>setOpen(open===i?-1:i)} style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:open===i?"#100508":C.bg2}}>
            <span style={{color:C.dim,fontSize:9,minWidth:48}}>{e.num}</span>
            <span style={{color:C.bright,fontSize:12}}>{e.title}</span>
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:dc[e.difficulty],fontSize:9,background:dc[e.difficulty]+"22",padding:"1px 6px",borderRadius:2}}>{e.difficulty}</span>
              <span style={{color:C.dim}}>{open===i?"▲":"▼"}</span>
            </span>
          </div>
          {open===i&&(
            <div style={{padding:"12px 16px",background:"#080306"}}>
              <div style={{color:C.dim,fontSize:11,marginBottom:10,lineHeight:1.6}}>{e.objective}</div>
              <div style={{color:C.orange,fontSize:9,letterSpacing:"0.1em",marginBottom:7}}>STEPS</div>
              {e.steps.map((s,si)=>(
                <div key={si} style={{display:"flex",gap:8,marginBottom:4}}>
                  <span style={{color:C.orange,minWidth:18,fontSize:11}}>{si+1}.</span>
                  <span style={{color:"#aa7788",fontSize:11,fontFamily:"'Fira Code','Courier New',monospace"}}>{s}</span>
                </div>
              ))}
              <div style={{padding:"7px 10px",background:"#100508",border:`1px solid ${C.purple}33`,borderRadius:3,margin:"8px 0"}}>
                <span style={{color:C.purple,fontSize:9}}>EXPECTED: </span>
                <span style={{color:C.bright,fontSize:11}}>{e.expected}</span>
              </div>
              <div style={{padding:"5px 10px",background:"#0c0408",borderLeft:`2px solid ${C.orange}`,color:C.dim,fontSize:11}}>💡 {e.tips}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function renderBlock(block, i) {
  switch(block.type) {
    case"h2":     return <h2 key={i} style={{color:C.red,fontSize:15,fontFamily:"'Courier New',monospace",fontWeight:700,margin:"18px 0 8px",borderBottom:`1px solid ${C.border}`,paddingBottom:6}}>{block.text}</h2>;
    case"h3":     return <h3 key={i} style={{color:C.orange,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:600,margin:"14px 0 5px"}}>{block.text}</h3>;
    case"p":      return <p  key={i} style={{color:C.dim,fontSize:12,lineHeight:1.7,margin:"5px 0",fontFamily:"'Courier New',monospace"}}>{block.text}</p>;
    case"code":    return <CodeBlock    key={i} lines={block.lines} label={block.label} lang={block.lang}/>;
    case"compare": return <CompareBlock key={i} title={block.title} left={block.left} right={block.right}/>;
    case"playbook":return <PlaybookView key={i} plays={block.plays}/>;
    case"lab":     return <LabBlock     key={i} entries={block.entries}/>;
    default: return null;
  }
}

export default function Mod04() {
  const [activeSec, setActiveSec] = useState("edr");
  const [activeLi,  setActiveLi]  = useState(0);
  const ref = useRef(null);

  const sec    = SECTIONS[activeSec];
  const lesson = sec.lessons[activeLi];

  const goSec = (k) => { setActiveSec(k); setActiveLi(0); ref.current?.scrollTo(0,0); };
  const goLi  = (i) => { setActiveLi(i);                  ref.current?.scrollTo(0,0); };

  const allLessons = Object.entries(SECTIONS).flatMap(([sk,s])=>s.lessons.map((_,li)=>({sk,li})));
  const flat = allLessons.findIndex(x=>x.sk===activeSec&&x.li===activeLi);
  const prev = ()=>{ if(flat>0){ const p=allLessons[flat-1]; setActiveSec(p.sk); setTimeout(()=>setActiveLi(p.li),0); }};
  const next = ()=>{ if(flat<allLessons.length-1){ const n=allLessons[flat+1]; setActiveSec(n.sk); setTimeout(()=>setActiveLi(n.li),0); }};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(40,0,10,0.04) 3px,rgba(40,0,10,0.04) 4px)"}}>

      <div style={{background:"#000",borderBottom:`2px solid ${C.red}33`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.red+"22",border:`1px solid ${C.red}55`,borderRadius:3,padding:"4px 10px",color:C.red,fontSize:12,fontWeight:700,letterSpacing:"0.12em"}}>MOD-04</div>
        <div>
          <div style={{color:C.bright,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>DETECTION & DEFENSE</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.1em"}}>AV/EDR · SYSMON · IR PLAYBOOKS · FORENSICS · DETECTION ENGINEERING · SIGMA · THREAT HUNTING</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {[C.red,C.orange,C.purple,C.cyan,C.green].map((c,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:c,opacity:0.8}}/>)}
        </div>
      </div>

      <div style={{background:"#000",borderBottom:`1px solid ${C.border}`,display:"flex",overflowX:"auto"}}>
        {Object.entries(SECTIONS).map(([key,s])=>(
          <button key={key} onClick={()=>goSec(key)} style={{
            background:activeSec===key?C.bg3:"transparent",border:"none",
            borderBottom:activeSec===key?`2px solid ${s.color}`:"2px solid transparent",
            borderTop:"2px solid transparent",
            color:activeSec===key?s.color:"#441122",
            padding:"9px 14px",cursor:"pointer",fontSize:10,letterSpacing:"0.07em",
            fontFamily:"'Courier New',monospace",fontWeight:700,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            <span>{s.icon}</span>{s.label}
            <span style={{color:activeSec===key?s.color+"55":"#1a0508",fontSize:8}}>{s.lessons.length}</span>
          </button>
        ))}
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:200,minWidth:200,background:"#060205",borderRight:`1px solid ${C.border}`,padding:"14px 10px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
          <div style={{color:sec.color,fontSize:9,letterSpacing:"0.12em",marginBottom:10,paddingBottom:7,borderBottom:`1px solid ${C.border}`}}>
            {sec.icon} {sec.label}
          </div>
          {sec.lessons.map((l,i)=>(
            <button key={i} onClick={()=>goLi(i)} style={{background:activeLi===i?C.bg3:"transparent",border:activeLi===i?`1px solid ${sec.color}33`:"1px solid transparent",borderRadius:3,padding:"7px 9px",cursor:"pointer",textAlign:"left"}}>
              <div style={{color:activeLi===i?C.bright:"#553344",fontSize:11,marginBottom:3,lineHeight:1.4}}>{l.title}</div>
              <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:l.tagColor+"22",color:l.tagColor}}>{l.tag}</span>
            </button>
          ))}
          <div style={{marginTop:"auto",paddingTop:14,borderTop:`1px solid ${C.border}`}}>
            <div style={{color:"#1a0508",fontSize:9,marginBottom:7}}>ALL SECTIONS</div>
            {Object.entries(SECTIONS).map(([key,s])=>(
              <button key={key} onClick={()=>goSec(key)} style={{display:"flex",alignItems:"center",gap:6,width:"100%",background:activeSec===key?"#110509":"transparent",border:"none",color:activeSec===key?s.color:"#1a0508",padding:"4px 6px",cursor:"pointer",fontSize:9,textAlign:"left",borderRadius:2,fontFamily:"'Courier New',monospace"}}>
                <span>{s.icon}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={ref} style={{flex:1,padding:"24px 28px",overflowY:"auto",background:C.bg}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,fontSize:10}}>
            <span style={{color:sec.color}}>{sec.icon} {sec.label}</span>
            <span style={{color:"#1a0508"}}>›</span>
            <span style={{color:C.dim}}>{lesson.title}</span>
            <span style={{marginLeft:"auto"}}>
              <span style={{background:lesson.tagColor+"11",border:`1px solid ${lesson.tagColor}44`,color:lesson.tagColor,padding:"2px 8px",borderRadius:3,fontSize:9}}>{lesson.tag}</span>
            </span>
          </div>
          {lesson.content.map((block,i)=>renderBlock(block,i))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:36,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
            <button onClick={prev} disabled={flat===0} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,color:flat===0?C.dim:C.red,padding:"7px 16px",cursor:flat===0?"default":"pointer",fontSize:10}}>← PREV</button>
            <span style={{color:C.dim,fontSize:10,alignSelf:"center"}}>{flat+1} / {allLessons.length}</span>
            <button onClick={next} disabled={flat===allLessons.length-1} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,color:flat===allLessons.length-1?C.dim:C.red,padding:"7px 16px",cursor:flat===allLessons.length-1?"default":"pointer",fontSize:10}}>NEXT →</button>
          </div>
        </div>
      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 20px",display:"flex",justifyContent:"space-between",fontSize:9,color:"#1a0508"}}>
        <span>MOD-04 :: DETECTION & DEFENSE — BLUE TEAM OPERATIONS</span>
        <span style={{color:C.red+"44"}}>{sec.label} · {lesson.title.toUpperCase()}</span>
      </div>
    </div>
  );
}
