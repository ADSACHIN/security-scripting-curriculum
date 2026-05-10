import { useState, useRef } from "react";

const C = {
  bg:"#020508", bg2:"#040b12", bg3:"#071020",
  border:"#0a1e35", dim:"#2a5070", bright:"#b8d8f8",
  blue:"#00aaff", cyan:"#00ffcc", green:"#44ff88",
  amber:"#ffaa00", red:"#ff3355", purple:"#aa66ff",
  orange:"#ff7700", white:"#ddeeff",
};

/* ═══════════════════════════════════════════════════════
   LAB SETUP + ENVIRONMENT BOOTSTRAP + CURRICULUM CONT.
   ═══════════════════════════════════════════════════════ */

const TABS = [
  {id:"setup",    label:"LAB SETUP",      icon:"🔧"},
  {id:"workspace",label:"WORKSPACE",      icon:"📁"},
  {id:"tools",    label:"TOOL INSTALLS",  icon:"⚙"},
  {id:"vscode",   label:"VS CODE CONFIG", icon:"📝"},
  {id:"weeks",    label:"WEEKS 3-8",      icon:"📅"},
  {id:"month2",   label:"MONTH 2 DETAIL", icon:"🛡"},
  {id:"month3",   label:"MONTH 3 DETAIL", icon:"🔬"},
  {id:"checklist",label:"PROGRESS",       icon:"✅"},
];

/* ── Lab Architecture ── */
const LAB_ARCH = `
┌──────────────────────────────────────────────────────────────────────────┐
│                    YOUR SECURITY SCRIPTING LAB                           │
│                MSI GF63 Thin — Ubuntu 24.04 (Primary OS)                │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │  KALI 2025 VM        │  │  WINDOWS 10 VM       │  │  UBUNTU TARGET  │ │
│  │  (KVM/QEMU)         │  │  (KVM/QEMU)          │  │  VM (KVM/QEMU) │ │
│  │                     │  │                      │  │                 │ │
│  │  Red Team Tools:    │  │  Blue Team Tools:    │  │  Vulnerable     │ │
│  │  • nmap, masscan    │  │  • Sysmon            │  │  Services:      │ │
│  │  • metasploit       │  │  • Winlogbeat        │  │  • DVWA         │ │
│  │  • impacket         │  │  • PowerShell 7      │  │  • SSSD         │ │
│  │  • bloodhound       │  │  • Process Monitor   │  │  • vsftpd       │ │
│  │  • crackmapexec     │  │  • Wireshark         │  │  • nginx        │ │
│  │                     │  │  • x64dbg            │  │  • ssh          │ │
│  │  ⚠ HOST-ONLY NET    │  │  ⚠ HOST-ONLY NET     │  │  ⚠ HOST-ONLY   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
│                                                                          │
│  UBUNTU HOST:                                                            │
│  ~/workspace/security-toolkit/  ← your code lives here                 │
│  ~/tools/                       ← third-party tools                     │
│  ~/.venvs/security/             ← Python venv                           │
│  /var/log/security/             ← tool output logs                      │
└──────────────────────────────────────────────────────────────────────────┘
  HOST-ONLY NETWORK: 192.168.100.0/24
  Ubuntu Host:    192.168.100.1
  Kali VM:        192.168.100.10
  Windows VM:     192.168.100.20
  Target VM:      192.168.100.30
`;

/* ── Install scripts ── */
const INSTALL_SCRIPTS = [
  {
    name:"Ubuntu Base Setup",
    file:"01_ubuntu_base.sh",
    color:C.blue,
    desc:"Core OS packages, Python environment, security tools",
    code:`#!/usr/bin/env bash
# 01_ubuntu_base.sh — Ubuntu 24.04 base setup for security scripting
set -euo pipefail
echo "[*] Updating system..."
sudo apt update && sudo apt upgrade -y

echo "[*] Installing core packages..."
sudo apt install -y \\
    # Build tools
    build-essential gcc g++ make cmake git curl wget \\
    # Python
    python3 python3-pip python3-venv python3-dev \\
    # Security tools
    nmap netcat-openbsd tcpdump wireshark-common tshark \\
    ncat masscan hping3 iptables nftables ufw \\
    # Analysis tools
    binwalk foremost hexdump xxd file strace ltrace \\
    strings patchelf readelf objdump gdb \\
    # Log/text processing
    jq xmlstarlet yq awk gawk sed grep ripgrep \\
    # Monitoring
    inotify-tools auditd audispd-plugins procps \\
    sysstat iotop htop nethogs \\
    # Crypto/hashing
    openssl gnupg hashdeep ssdeep \\
    # Network analysis
    dnsutils whois traceroute netstat-nat \\
    # Scripting helpers
    shellcheck parallel expect socat \\
    # Container
    docker.io docker-compose containerd \\
    # Editors
    vim neovim tmux \\
    # Git
    git git-lfs gh

echo "[*] Installing Python security venv..."
python3 -m venv ~/.venvs/security
source ~/.venvs/security/bin/activate

pip install --upgrade pip setuptools wheel

# Core security libraries
pip install \\
    pefile \\
    yara-python \\
    capstone \\
    scapy \\
    impacket \\
    pyOpenSSL \\
    cryptography \\
    requests \\
    httpx \\
    aiohttp \\
    fastapi \\
    uvicorn \\
    pydantic \\
    sqlalchemy \\
    pySigma \\
    pySigma-backend-splunk \\
    pySigma-backend-elasticsearch \\
    pySigma-backend-microsoft365defender \\
    yara-python \\
    python-magic \\
    colorama \\
    rich \\
    click \\
    typer \\
    jinja2 \\
    pyyaml \\
    toml \\
    paramiko \\
    netaddr \\
    dpkt \\
    pyshark \\
    pandas \\
    matplotlib \\
    scikit-learn \\
    numpy \\
    scipy \\
    pytest \\
    pytest-cov \\
    pytest-asyncio \\
    bandit \\
    safety \\
    semgrep \\
    black \\
    ruff \\
    mypy \\
    pre-commit \\
    mkdocs \\
    mkdocs-material \\
    mkdocstrings

echo "[*] Adding venv activation to .bashrc..."
echo 'source ~/.venvs/security/bin/activate' >> ~/.bashrc

echo "[+] Base setup complete!"`,
  },
  {
    name:"Security Tools Install",
    file:"02_security_tools.sh",
    color:C.green,
    desc:"Volatility3, Ghidra, YARA rules, capa, ELK stack",
    code:`#!/usr/bin/env bash
# 02_security_tools.sh — Security analysis tools
set -euo pipefail
TOOLS_DIR="$HOME/tools"
mkdir -p "$TOOLS_DIR"
cd "$TOOLS_DIR"

echo "[*] Installing Volatility 3..."
if [ ! -d "volatility3" ]; then
    git clone https://github.com/volatilityfoundation/volatility3
    cd volatility3
    pip install -r requirements.txt
    cd ..
fi
echo "alias vol='python3 ~/tools/volatility3/vol.py'" >> ~/.bash_aliases

echo "[*] Installing capa (Mandiant)..."
CAPA_VER="7.0.1"
CAPA_URL="https://github.com/mandiant/capa/releases/download/v${CAPA_VER}/capa-v${CAPA_VER}-linux.zip"
wget -q "$CAPA_URL" -O /tmp/capa.zip
unzip -q /tmp/capa.zip -d "$TOOLS_DIR/capa/"
chmod +x "$TOOLS_DIR/capa/capa"
sudo ln -sf "$TOOLS_DIR/capa/capa" /usr/local/bin/capa

echo "[*] Installing AVML (memory acquisition)..."
AVML_URL="https://github.com/microsoft/avml/releases/latest/download/avml"
wget -q "$AVML_URL" -O "$TOOLS_DIR/avml"
chmod +x "$TOOLS_DIR/avml"
sudo ln -sf "$TOOLS_DIR/avml" /usr/local/bin/avml

echo "[*] Installing Ghidra..."
GHIDRA_VER="11.1_PUBLIC"
GHIDRA_URL="https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_11.1_build/ghidra_${GHIDRA_VER}_20240607.zip"
if [ ! -d "$TOOLS_DIR/ghidra" ]; then
    wget -q "$GHIDRA_URL" -O /tmp/ghidra.zip
    unzip -q /tmp/ghidra.zip -d "$TOOLS_DIR/"
    mv "$TOOLS_DIR/ghidra_${GHIDRA_VER}" "$TOOLS_DIR/ghidra"
    echo "alias ghidra='$TOOLS_DIR/ghidra/ghidraRun'" >> ~/.bash_aliases
fi

echo "[*] Installing FakeNet-NG..."
pip install flare-fakenet-ng

echo "[*] Cloning SIGMA rules..."
if [ ! -d "$TOOLS_DIR/sigma" ]; then
    git clone https://github.com/SigmaHQ/sigma "$TOOLS_DIR/sigma"
fi

echo "[*] Installing ELK stack via Docker..."
mkdir -p "$TOOLS_DIR/elk"
cat > "$TOOLS_DIR/elk/docker-compose.yml" << 'EOF'
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports: ["9200:9200"]
    volumes: [es_data:/usr/share/elasticsearch/data]
  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    ports: ["5601:5601"]
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on: [elasticsearch]
  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    ports: ["5044:5044","9600:9600"]
    depends_on: [elasticsearch]
volumes:
  es_data:
EOF
echo "Run ELK: cd ~/tools/elk && docker-compose up -d"

echo "[*] Installing YARA rules collections..."
git clone https://github.com/elastic/protections-artifacts "$TOOLS_DIR/yara-elastic" 2>/dev/null || true
git clone https://github.com/Neo23x0/signature-base "$TOOLS_DIR/yara-neo23x0" 2>/dev/null || true

echo "[+] Security tools installed!"
echo "    Volatility: vol -h"
echo "    capa:       capa --help"
echo "    Ghidra:     ghidra"
echo "    AVML:       sudo avml /tmp/memdump.raw"`,
  },
  {
    name:"Workspace Structure",
    file:"03_workspace_setup.sh",
    color:C.amber,
    desc:"Create the full ~/workspace/ directory structure",
    code:`#!/usr/bin/env bash
# 03_workspace_setup.sh — Create security toolkit workspace
set -euo pipefail

echo "[*] Creating workspace structure..."

WORKSPACE="$HOME/workspace"

mkdir -p "$WORKSPACE"/{security-toolkit,labs,samples,reports,configs}

# Security toolkit structure
mkdir -p "$WORKSPACE/security-toolkit"/{src,tests,docs,config,scripts,rules}
mkdir -p "$WORKSPACE/security-toolkit/src"/{scanner,extractor,fim,analyzer,enricher,detection,api,dashboard}
mkdir -p "$WORKSPACE/security-toolkit/scripts"/{bash,powershell}
mkdir -p "$WORKSPACE/security-toolkit/rules"/{sigma,yara}

# Lab environments
mkdir -p "$WORKSPACE/labs"/{week{1..13},capstone}

# Sample storage (for malware analysis labs)
mkdir -p "$WORKSPACE/samples"/{malware/{packed,unpacked,pcap,memory},benign,reports}
chmod 700 "$WORKSPACE/samples/malware"  # Restrict access

# Output directories
mkdir -p /var/log/security 2>/dev/null || mkdir -p "$HOME/.local/log/security"
mkdir -p /var/lib/fim       2>/dev/null || mkdir -p "$HOME/.local/lib/fim"

echo "[*] Creating Python package structure..."
cat > "$WORKSPACE/security-toolkit/pyproject.toml" << 'TOML'
[project]
name = "security-toolkit"
version = "0.1.0"
description = "Professional security automation toolkit"
requires-python = ">=3.11"
dependencies = [
    "pefile", "yara-python", "scapy", "aiohttp",
    "fastapi", "uvicorn", "pydantic", "sqlalchemy",
    "pySigma", "rich", "typer", "pyyaml", "jinja2",
    "pytest", "pytest-cov", "bandit",
]

[project.scripts]
sct = "security_toolkit.__main__:app"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends.legacy:build"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=src --cov-report=term-missing"

[tool.bandit]
exclude_dirs = ["tests"]
TOML

echo "[*] Creating src/__init__.py files..."
touch "$WORKSPACE/security-toolkit/src/__init__.py"
for mod in scanner extractor fim analyzer enricher detection api; do
    touch "$WORKSPACE/security-toolkit/src/$mod/__init__.py"
done

echo "[*] Creating seclib.py (shared library)..."
cat > "$WORKSPACE/security-toolkit/src/seclib.py" << 'PYTHON'
"""
seclib.py — Shared security library
Used by all toolkit modules
"""
from __future__ import annotations
import re, json, hashlib, logging, os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Colours ──────────────────────────────────────────
class Colours:
    RED    = '\\033[0;31m'
    GREEN  = '\\033[0;32m'
    YELLOW = '\\033[1;33m'
    BLUE   = '\\033[0;34m'
    CYAN   = '\\033[0;36m'
    BOLD   = '\\033[1m'
    NC     = '\\033[0m'

# ── Logging ───────────────────────────────────────────
def setup_logging(name: str, level: str = 'INFO',
                  log_file: Optional[str] = None) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    formatter = logging.Formatter(
        '{"ts":"%(asctime)s","name":"%(name)s",'
        '"level":"%(levelname)s","msg":"%(message)s"}',
        datefmt='%Y-%m-%dT%H:%M:%SZ'
    )
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    if log_file:
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    return logger

# ── Validation ────────────────────────────────────────
IPV4_RE = re.compile(
    r'\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}'
    r'(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b'
)
PRIVATE_RE = re.compile(
    r'^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|127\\.)'
)

def validate_ip(ip: str) -> bool:
    return bool(IPV4_RE.match(ip))

def is_private_ip(ip: str) -> bool:
    return bool(PRIVATE_RE.match(ip))

# ── Hashing ───────────────────────────────────────────
def hash_file(path: str | Path, algo: str = 'sha256') -> str:
    h = hashlib.new(algo)
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

# ── Alert output ──────────────────────────────────────
def alert_json(severity: str, rule: str, detail: str,
               extra: dict | None = None) -> str:
    record = {
        'ts':       datetime.now(timezone.utc).isoformat(),
        'severity': severity.upper(),
        'rule':     rule,
        'detail':   detail,
        'host':     os.uname().nodename,
        'pid':      os.getpid(),
    }
    if extra:
        record.update(extra)
    return json.dumps(record)
PYTHON

echo "[*] Setting up git..."
cd "$WORKSPACE/security-toolkit"
git init
cat > .gitignore << 'GIT'
__pycache__/
*.pyc
*.pyo
.venv/
*.egg-info/
dist/
build/
.coverage
htmlcov/
*.log
*.db
*.db-wal
*.db-shm
config/secrets.yaml
.env
*.pem
*.key
samples/malware/
GIT

git add .
git commit -m "feat: initial security toolkit structure"

echo "[+] Workspace ready!"
echo "    Toolkit: $WORKSPACE/security-toolkit"
echo "    Labs:    $WORKSPACE/labs"
echo "    Install: cd $WORKSPACE/security-toolkit && pip install -e ."`,
  },
  {
    name:"KVM Lab VMs",
    file:"04_kvm_vms.sh",
    color:C.purple,
    desc:"Create Windows and target Ubuntu VMs with host-only networking",
    code:`#!/usr/bin/env bash
# 04_kvm_vms.sh — Set up KVM lab VMs
set -euo pipefail

echo "[*] Installing KVM/QEMU/libvirt..."
sudo apt install -y \\
    qemu-kvm libvirt-daemon-system libvirt-clients \\
    virt-manager ovmf bridge-utils virtinst \\
    qemu-utils libguestfs-tools

sudo usermod -aG libvirt,kvm "$USER"
sudo systemctl enable --now libvirtd

echo "[*] Creating host-only network (192.168.100.0/24)..."
cat > /tmp/lab-network.xml << 'XML'
<network>
  <name>lab-network</name>
  <forward mode='route'/>
  <ip address='192.168.100.1' netmask='255.255.255.0'>
    <dhcp>
      <range start='192.168.100.10' end='192.168.100.50'/>
    </dhcp>
  </ip>
</network>
XML

sudo virsh net-define /tmp/lab-network.xml
sudo virsh net-start lab-network
sudo virsh net-autostart lab-network

echo "[*] Lab network created: 192.168.100.0/24"
echo ""
echo "VM SETUP GUIDE:"
echo "════════════════════════════════════════"
echo ""
echo "1. UBUNTU TARGET VM (for labs):"
echo "   virt-install \\"
echo "     --name ubuntu-target \\"
echo "     --memory 2048 \\"
echo "     --vcpus 2 \\"
echo "     --disk size=20 \\"
echo "     --cdrom ~/Downloads/ubuntu-24.04.4-desktop-amd64.iso \\"
echo "     --network network=lab-network \\"
echo "     --os-variant ubuntu24.04"
echo ""
echo "2. WINDOWS 10 VM (for PS + EDR labs):"
echo "   virt-install \\"
echo "     --name windows-lab \\"
echo "     --memory 4096 \\"
echo "     --vcpus 2 \\"
echo "     --disk size=60 \\"
echo "     --cdrom ~/Downloads/Win10_22H2_English_x64.iso \\"
echo "     --network network=lab-network \\"
echo "     --os-variant win10"
echo ""
echo "3. After VM creation, install guest agents:"
echo "   Ubuntu: sudo apt install qemu-guest-agent"
echo "   Windows: Install VirtIO drivers from virtio-win.iso"
echo ""
echo "4. Take snapshots before each lab session:"
echo "   virsh snapshot-create-as ubuntu-target clean-state"
echo "   virsh snapshot-revert ubuntu-target clean-state"`,
  },
  {
    name:"Monitoring & Alerting",
    file:"05_monitoring.sh",
    color:C.red,
    desc:"Set up auditd, syslog forwarding, and the security monitoring stack",
    code:`#!/usr/bin/env bash
# 05_monitoring.sh — Security monitoring stack setup
set -euo pipefail

echo "[*] Configuring auditd..."
sudo tee /etc/audit/rules.d/security-toolkit.rules << 'AUDITD'
# Process execution
-a always,exit -F arch=b64 -S execve -k process_exec
-a always,exit -F arch=b32 -S execve -k process_exec

# Network connections
-a always,exit -F arch=b64 -S connect -k network_connect
-a always,exit -F arch=b64 -S bind -k network_bind

# File integrity watched paths
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/crontab -p wa -k cron_changes
-w /etc/cron.d/ -p wa -k cron_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /usr/bin/ -p wa -k bin_changes
-w /usr/sbin/ -p wa -k sbin_changes
-w /bin/ -p wa -k bin_changes
-w /sbin/ -p wa -k bin_changes

# Privilege escalation
-a always,exit -F arch=b64 -S ptrace -k ptrace_use
-w /usr/bin/sudo -p x -k sudo_exec
-w /usr/bin/su -p x -k su_exec

# Temp directory executable creation
-w /tmp -p x -k tmp_exec
-w /dev/shm -p x -k shm_exec
AUDITD

sudo augenrules --load
sudo systemctl enable --now auditd

echo "[*] Setting up syslog forwarding to ELK..."
sudo tee /etc/rsyslog.d/50-elk.conf << 'RSYSLOG'
# Forward to local Logstash (ELK stack)
*.* @@127.0.0.1:5044
RSYSLOG
sudo systemctl restart rsyslog

echo "[*] Creating log directories..."
sudo mkdir -p /var/log/security
sudo chown "$USER:$USER" /var/log/security
chmod 750 /var/log/security

echo "[*] Setting up Prometheus + Grafana..."
mkdir -p ~/tools/monitoring
cat > ~/tools/monitoring/docker-compose.yml << 'DOCKER'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=seclab123
    volumes: ["grafana_data:/var/lib/grafana"]
  node_exporter:
    image: prom/node-exporter:latest
    ports: ["9100:9100"]
volumes:
  grafana_data:
DOCKER

cat > ~/tools/monitoring/prometheus.yml << 'PROM'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node_exporter:9100']
  - job_name: 'security_toolkit'
    static_configs:
      - targets: ['host.docker.internal:8000']
PROM

echo "[+] Monitoring stack configured!"
echo "    auditd:     sudo ausearch -k process_exec | tail -20"
echo "    Prometheus: http://localhost:9090"
echo "    Grafana:    http://localhost:3000  admin/seclab123"
echo "    ELK:        http://localhost:5601"`,
  },
];

/* ── VS Code config ── */
const VSCODE_CONFIG = {
  settings: `{
  "editor.fontSize": 13,
  "editor.fontFamily": "'Fira Code', 'Courier New', monospace",
  "editor.fontLigatures": true,
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.rulers": [88, 120],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll": "explicit"
  },
  "editor.defaultFormatter": "ms-python.black-formatter",
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.fontFamily": "'Fira Code Mono'",
  "python.defaultInterpreterPath": "~/.venvs/security/bin/python3",
  "python.analysis.typeCheckingMode": "basic",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.ruffEnabled": true,
  "files.associations": {
    "*.yar": "yara",
    "*.rules": "yara",
    "*.sigma": "yaml",
    "*.sh": "shellscript"
  },
  "shellcheck.run": "onSave",
  "shellcheck.enable": true,
  "git.autofetch": true,
  "workbench.colorTheme": "One Dark Pro",
  "workbench.iconTheme": "material-icon-theme"
}`,
  extensions: [
    {id:"ms-python.python",              name:"Python",              reason:"Core Python support"},
    {id:"ms-python.black-formatter",     name:"Black Formatter",     reason:"Code formatting"},
    {id:"charliermarsh.ruff",            name:"Ruff",                reason:"Fast Python linter"},
    {id:"ms-python.mypy-type-checker",  name:"Mypy",                reason:"Type checking"},
    {id:"timonwong.shellcheck",          name:"ShellCheck",          reason:"Bash lint (critical for security scripts)"},
    {id:"foxundermoon.shell-format",     name:"Shell Format",        reason:"Bash auto-formatting"},
    {id:"ms-vscode.powershell",          name:"PowerShell",          reason:"PS syntax + debugging"},
    {id:"redhat.vscode-yaml",            name:"YAML",                reason:"SIGMA rule editing"},
    {id:"eamodio.gitlens",              name:"GitLens",             reason:"Git history for code review"},
    {id:"mhutchie.git-graph",           name:"Git Graph",           reason:"Visual commit history"},
    {id:"bierner.github-markdown-preview",name:"Markdown Preview",  reason:"README preview"},
    {id:"zxh404.vscode-proto3",         name:"Proto3",              reason:"Protobuf for API design"},
    {id:"zhuangtongfa.material-theme",  name:"One Dark Pro",        reason:"Dark theme for long sessions"},
    {id:"PKief.material-icon-theme",    name:"Material Icons",      reason:"File type icons"},
    {id:"streetsidesoftware.code-spell-checker",name:"Spell Check", reason:"Comments + docs quality"},
  ],
  launch: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Security Tool",
      "type": "python",
      "request": "launch",
      "program": "\${file}",
      "args": ["--verbose", "--help"],
      "console": "integratedTerminal",
      "justMyCode": false
    },
    {
      "name": "Python: Pytest",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": ["-v", "--tb=short"],
      "console": "integratedTerminal"
    },
    {
      "name": "Python: FastAPI Server",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.api.main:app", "--reload", "--port", "8000"],
      "console": "integratedTerminal"
    },
    {
      "name": "Bash: Current Script",
      "type": "bashdb",
      "request": "launch",
      "program": "\${file}",
      "args": [],
      "console": "integratedTerminal"
    }
  ]
}`,
};

/* ── Week detail content (weeks 3-8 not fully covered) ── */
const WEEK_DETAIL = [
  {
    week:3, title:"Intermediate Bash + Python Automation", color:C.amber,
    days:[
      {day:15, lang:"BASH", title:"Parallel Execution — xargs, GNU parallel, Job Control",
        concepts:["Background jobs (&), wait -n, job arrays","xargs -P N for parallel processing","GNU parallel for complex parallel workflows","Job limiting to avoid overwhelming targets","mkfifo named pipes for parallel pipelines"],
        lab:"parallel_sweep.sh: scan /24 subnet in < 5s using xargs -P50. Implement job-limited parallel banner grabbing. Benchmark vs sequential.",
        code:`# Pattern: job-limited parallel with result collection
LIVE=$(mktemp); trap 'rm -f "$LIVE"' EXIT
ping_host() { ping -c1 -W1 -q "$1" &>/dev/null && echo "$1" >> "$2"; }
export -f ping_host
printf '192.168.1.%d\\n' {1..254} | xargs -P50 -I{} bash -c 'ping_host "$@"' _ {} "$LIVE"
wait; sort -t. -k4 -n "$LIVE"`,
        debug:"Race condition: two jobs write to same temp file simultaneously. Show data corruption. Fix with flock or per-job temp files merged at end.",
        redblue:"Red: parallel scanners leave IDS-visible traffic bursts. Blue: detect with connection-count-per-second threshold. Tune: add random sleep jitter.",
      },
      {day:16, lang:"BASH", title:"inotify + systemd Timers for Production Deployment",
        concepts:["inotifywait event types and filtering","systemd .service vs .timer units","Persistent timers (run missed jobs after downtime)","journald logging integration","Service dependencies and ordering"],
        lab:"Deploy fim.sh as systemd timer. Watch for file changes with inotify. Verify it survives reboot. Check journald for logs.",
        code:`# systemd timer unit
[Timer]
OnCalendar=*:0/5
Persistent=true
RandomizedDelaySec=30  # Avoid thundering herd if multiple timers

# Check: systemctl list-timers
# Logs: journalctl -u security-fim.service --since today`,
        debug:"Broken systemd unit: wrong ExecStart path, missing After=network.target for network tools, wrong User= causing permission errors.",
        redblue:"Red: attackers kill security services. Alert on: service stop events, systemd unit file modification. Blue: monitor service with watchdog timeout.",
      },
      {day:17, lang:"PYTHON", title:"asyncio Deep Dive — Event Loop, Tasks, Cancellation",
        concepts:["asyncio event loop internals (epoll/kqueue)","asyncio.Task vs coroutine — when each is used","Structured concurrency with TaskGroup (Python 3.11+)","Cancellation and CancelledError handling","asyncio.Queue for producer/consumer pipelines"],
        lab:"Rewrite port scanner using asyncio. Compare memory usage: 100 threads (800MB) vs asyncio (< 50MB) for same concurrency.",
        code:`async def scan(host, ports, max_concurrent=500):
    sem = asyncio.Semaphore(max_concurrent)
    async def probe(port):
        async with sem:
            try:
                _, writer = await asyncio.wait_for(
                    asyncio.open_connection(host, port), timeout=1.0)
                writer.close()
                return port, 'open'
            except: return port, 'closed'
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(probe(p)) for p in ports]
    return [t.result() for t in tasks]`,
        debug:"Blocking call inside coroutine: time.sleep() blocks entire event loop. Show: asyncio.sleep(0) for yielding. run_in_executor() for truly blocking calls.",
        redblue:"Red: async tools are harder to fingerprint (non-sequential conn patterns). Blue: statistical beaconing detection still works regardless of async vs sync.",
      },
      {day:18, lang:"PYTHON", title:"OOP for Security Tools — Classes, Protocols, Plugins",
        concepts:["Abstract Base Classes for plugin interfaces","Protocol for structural subtyping (duck typing)","Context managers (__enter__/__exit__) for resources","Dataclasses vs NamedTuples vs TypedDicts","Class-based detection rules vs function-based"],
        lab:"Refactor IOC extractor as class hierarchy. Add plugin for new IOC type without changing existing code. Write tests for each class.",
        code:`from abc import ABC, abstractmethod
from typing import Protocol

class ExtractorPlugin(Protocol):
    name: str
    def extract(self, text: str) -> set[str]: ...

class IPv4Extractor:
    name = "ipv4"
    _pat = re.compile(r'\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}...')
    def extract(self, text: str) -> set[str]:
        found = set(self._pat.findall(text))
        return {ip for ip in found if not PRIVATE_RE.match(ip)}

class IOCEngine:
    def __init__(self, plugins: list[ExtractorPlugin]):
        self.plugins = plugins
    def run(self, text: str) -> dict[str, set]:
        return {p.name: p.extract(text) for p in self.plugins}`,
        debug:"Circular import between extractor.py and database.py. Shared mutable class-level state causing test interference. Fix with dependency injection.",
        redblue:"Red: plugin architecture means malware can be extended with new capabilities by dropping a file. Blue: detect new Python file in tool directories.",
      },
      {day:19, lang:"BASH+PYTHON", title:"Unix Pipeline Philosophy — stdin/stdout Security Tools",
        concepts:["Unix philosophy: one tool, one job, composable","Python stdin reading for pipeline integration","Named pipes (mkfifo) for parallel pipelines","tee for branching pipelines","Process substitution <() and >()"],
        lab:"Build a 4-stage detection pipeline: tail_agent.sh | ioc_extractor.py | enricher.py | alerter.py. Each stage reads JSONL from stdin, writes JSONL to stdout.",
        code:`# tail_agent.sh
tail -F /var/log/auth.log | while IFS= read -r line; do
    printf '{"ts":"%s","source":"auth","raw":"%s"}\\n' \\
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(echo "$line" | sed 's/"/\\\\"/g')"
done

# ioc_extractor.py
import sys, json
for line in sys.stdin:
    event = json.loads(line)
    iocs = extract_iocs(event['raw'])
    event['iocs'] = iocs
    print(json.dumps(event))`,
        debug:"Broken pipeline: wrong JSONL format breaks downstream stage. Buffering issue: Python stdout not flushed in real-time. Fix: sys.stdout.flush() or PYTHONUNBUFFERED=1.",
        redblue:"Red: pipelines are powerful attack automation tools. Blue: detect unusual pipe usage (shell spawning multiple connected processes) via process tree analysis.",
      },
      {day:20, lang:"POWERSHELL", title:"PowerShell Advanced — CIM, WMI, AD Security",
        concepts:["Get-CimInstance vs Get-WmiObject (performance)","WMI event subscriptions for persistence detection","Active Directory PowerShell module basics","LDAP filter syntax for AD queries","PowerShell Remoting with constrained endpoints"],
        lab:"windows_recon.ps1: enumerate AD users with stale passwords, kerberoastable SPNs, computers without EDR, privileged group members.",
        code:`# CIM is faster than WMI for local queries
$procs = Get-CimInstance Win32_Process |
    Select-Object ProcessId, ParentProcessId, Name, CommandLine

# Find suspicious parent-child chains
$procs | ForEach-Object {
    $parent = $procs | Where-Object ProcessId -eq $_.ParentProcessId
    if ($parent -and $parent.Name -in @('WINWORD','EXCEL','chrome') -and
        $_.Name -in @('cmd','powershell','wscript')) {
        [PSCustomObject]@{
            Alert = 'SUSPICIOUS_SPAWN'
            Parent = $parent.Name
            Child  = $_.Name
            CmdLine = $_.CommandLine
        }
    }
}`,
        debug:"PS remoting authentication failure (CredSSP vs Kerberos). WMI filter wrong namespace causing no results. CIM type mismatch in comparison.",
        redblue:"Red: WMI used for fileless persistence (EventFilter+Consumer). Blue: audit WMI subscriptions daily. Alert on new WMI event consumer creation.",
      },
      {day:21, lang:"ALL", title:"Week 3 Project — End-to-End Detection Pipeline",
        concepts:["Integrate bash agents + Python pipeline + PS collectors","JSONL as universal inter-process format","Backpressure in async pipelines","Error handling across process boundaries","Pipeline monitoring and health checks"],
        lab:"detection_pipeline/: 3-stage pipeline running as systemd services. Monitors auth.log, /proc, and Windows events. Unified JSONL output. Slack alerting.",
        code:`# docker-compose.yml for the detection pipeline
version: '3.8'
services:
  linux_agent:   {build: ./agents/linux,   restart: unless-stopped}
  normaliser:    {build: ./normaliser,      restart: unless-stopped}
  detector:      {build: ./detector,        restart: unless-stopped}
  alerter:       {build: ./alerter,         restart: unless-stopped}`,
        debug:"End-to-end: inject a bug in each stage. Stage 1: log line with special chars breaks JSON. Stage 2: IOC regex catastrophic backtracking on crafted input. Stage 3: async deadlock.",
        redblue:"Red: detection pipeline is a high-value target. Kill it → go blind. Blue: monitor pipeline health, alert on: event count drops, stage restarts, queue backlog growth.",
      },
    ]
  },
  {
    week:4, title:"Production Engineering & Testing", color:C.purple,
    days:[
      {day:22, lang:"PYTHON", title:"Testing Security Tools — pytest, Mocking, Coverage",
        concepts:["pytest fixtures and parametrize","unittest.mock for API/network mocking","Coverage measurement and target thresholds","Property-based testing with hypothesis","Integration tests vs unit tests for security tools"],
        lab:"Write 30 tests for IOC extractor. Mock VT API. Test edge cases: binary files, very long strings, all-private IPs, unicode domains. Achieve 90% coverage.",
        code:`import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def extractor():
    return IOCExtractor(vt_key="fake_key")

@pytest.mark.parametrize("text,expected_ips", [
    ("attack from 198.51.100.1",  ["198.51.100.1"]),
    ("internal 192.168.1.1",      []),  # private filtered
    ("bad 999.999.0.0",           []),  # invalid
    ("two: 1.2.3.4 and 5.6.7.8", ["1.2.3.4","5.6.7.8"]),
])
def test_ipv4_extraction(extractor, text, expected_ips):
    result = extractor.extract(text)
    assert sorted(result.get('ipv4',[])) == sorted(expected_ips)

@patch('ioc_extractor.urlopen')
def test_vt_enrichment(mock_urlopen, extractor):
    mock_resp = MagicMock()
    mock_resp.read.return_value = b'{"data":{"attributes":{"last_analysis_stats":{"malicious":5,"harmless":60}}}}'
    mock_urlopen.return_value.__enter__.return_value = mock_resp
    result = extractor.enrich_vt('198.51.100.1', 'ipv4')
    assert result['malicious'] == 5`,
        debug:"Test that modifies global state affects other tests (test isolation failure). Async test missing @pytest.mark.asyncio. Coverage missing branches vs lines.",
        redblue:"Red: untested security tools have bugs that cause blind spots. Blue: test coverage is a security metric — untested code paths = potential vulnerability.",
      },
      {day:23, lang:"PYTHON", title:"Configuration Management — YAML, Env Vars, Secrets",
        concepts:["YAML config with pyyaml + schema validation","Priority: defaults < config file < env vars < CLI args","python-dotenv for .env files","Secret management: never in code, never in git","Config validation with pydantic BaseSettings"],
        lab:"Add config system to toolkit: config.yaml with all settings, .env for secrets, CLI args override. Validate with pydantic. Secret scanning in pre-commit.",
        code:`from pydantic import BaseSettings, SecretStr
from pathlib import Path
import yaml

class SecurityToolConfig(BaseSettings):
    # Secrets — loaded from env vars, never from config file
    vt_api_key:       SecretStr = SecretStr('')
    abuseipdb_key:    SecretStr = SecretStr('')
    slack_webhook:    SecretStr = SecretStr('')

    # Settings — loaded from config.yaml
    scan_timeout:     float = 1.0
    scan_workers:     int   = 100
    log_level:        str   = 'INFO'
    alert_threshold:  int   = 5

    class Config:
        env_file = '.env'           # Loads .env file
        env_prefix = 'STK_'        # STK_VT_API_KEY etc
        secrets_dir = '/run/secrets' # Docker secrets

config = SecurityToolConfig()
# vt_api_key never appears in logs — SecretStr.get_secret_value() required`,
        debug:"Secrets committed to git (scan with gitleaks). Config file loaded after CLI args (wrong priority). YAML injection: yaml.load() vs yaml.safe_load().",
        redblue:"Red: find config files with API keys → free API access. Blue: pre-commit hook blocks secret commits. Rotate any exposed keys immediately.",
      },
      {day:24, lang:"BASH", title:"Advanced jq, awk, sed — JSON Processing Pipelines",
        concepts:["jq filters: select, map, group_by, sort_by, reduce","awk multi-file processing and FILENAME variable","sed ranges and hold space for multi-line processing","Combining jq+awk+sed in security pipelines","Performance: jq vs Python json for large datasets"],
        lab:"Build a JSONL processing toolkit: filter by severity, extract fields, group by host, generate statistics, transform formats — all with jq one-liners.",
        code:`# Extract all HIGH+ alerts for specific host, last 24h
jq -r 'select(.severity == ("HIGH","CRITICAL")[] and
              .host == "webserver01" and
              .ts >= "2024-01-15T00:00:00Z")
       | [.ts, .rule, .detail]
       | @tsv' alerts.jsonl | sort

# Group alerts by rule, count each
jq -s 'group_by(.rule) | map({rule: .[0].rule, count: length})
       | sort_by(.count) | reverse' alerts.jsonl

# Alert → SIGMA-compatible format
jq '{title: .rule, detection: {keywords: [.detail]},
     level: (.severity | ascii_downcase)}' alert.json`,
        debug:"jq select filter syntax error. awk NR==FNR trick broken on empty first file. sed hold space not cleared between files.",
        redblue:"Red: jq used to extract valuable data from captured API responses and log files. Blue: detect jq processing of sensitive file paths in audit logs.",
      },
      {day:25, lang:"POWERSHELL", title:"PowerShell Persistence & Registry Forensics",
        concepts:["Registry as PSDrive (HKLM:, HKCU:, HKCR:)","WMI event subscriptions (most stealthy persistence)","Scheduled task XML format and manipulation","Service binary path hijacking detection","PowerShell transcription and logging archaeology"],
        lab:"Full persistence_hunter.ps1: enumerate all persistence mechanisms, score each by suspiciousness, generate HTML report. Test with planted test entries.",
        code:`function Get-WMIPersistence {
    Get-CimInstance -Namespace root\\subscription -ClassName __EventFilter |
    ForEach-Object {
        $filter = $_
        $consumer = Get-CimInstance -Namespace root\\subscription \\
                        -ClassName __EventConsumer |
                    Where-Object Name -eq $filter.Name
        [PSCustomObject]@{
            Type     = 'WMI_EventSubscription'
            Name     = $filter.Name
            Query    = $filter.Query
            Consumer = $consumer.CommandLineTemplate ?? $consumer.ScriptText
            Suspicious = ($consumer.CommandLineTemplate -match '(?i)(powershell|cmd|mshta|wscript)')
        }
    }
}`,
        debug:"WMI namespace wrong → no results silently. Registry path syntax (HKLM: vs HKLM:/) differs. COM object instantiation fails in Constrained Language Mode.",
        redblue:"Red: WMI subscriptions survive reboots, invisible to Autoruns unless specifically checked. Blue: daily scheduled task to enumerate all WMI subscriptions and alert on new ones.",
      },
      {day:26, lang:"PYTHON", title:"Packaging, Distribution & CLI Tool Design",
        concepts:["pyproject.toml and PEP 517/518","entry_points for CLI commands","typer for modern CLI design (vs argparse)","Rich for terminal output formatting","Python package versioning (semver)"],
        lab:"Package security-toolkit as installable tool: pip install → sct command. Version bump script. Release GitHub Action.",
        code:`# pyproject.toml
[project.scripts]
sct         = "security_toolkit.__main__:app"
sct-scan    = "security_toolkit.scanner.__main__:app"
sct-extract = "security_toolkit.extractor.__main__:app"

# __main__.py using typer
import typer
from rich.console import Console

app = typer.Typer(help="Security Toolkit CLI")
console = Console()

@app.command()
def scan(
    target: str = typer.Argument(..., help="IP, hostname, or CIDR"),
    ports:  str = typer.Option("1-1024", help="Port range"),
    output: str = typer.Option("table", help="Output format: table|json|csv"),
):
    """Perform TCP port scan with service detection."""
    console.print(f"[cyan]Scanning {target}...[/cyan]")`,
        debug:"Entry point not found after pip install (wrong module path). typer/click conflict (both installed). Console output breaks JSON pipeline (use stderr for status).",
        redblue:"Red: packaged tools are easy to deploy post-exploitation. Blue: monitor pip install events (Python package installation logged by auditd).",
      },
      {day:27, lang:"ALL", title:"Git Workflows, CI/CD & Secret Scanning",
        concepts:["Git branching strategy for security tools","pre-commit hooks: secret scanning, linting, testing","GitHub Actions for CI/CD","Signing commits with GPG","gitleaks for secret detection in history"],
        lab:"Set up complete CI/CD: pre-commit hooks + GitHub Actions pipeline. Push SIGMA rule, watch CI validate, convert, and deploy to ELK automatically.",
        code:`# .github/workflows/security-toolkit.yml
name: Security Toolkit CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - run: pip install -e ".[dev]"
      - run: bandit -r src/ -ll          # Security lint
      - run: safety check                # Dep vulnerabilities
      - run: pytest tests/ --cov=src     # Tests + coverage
      - run: sigma check rules/**/*.yml  # SIGMA validation
      - run: sigma convert -t elasticsearch rules/ > /tmp/es_rules.json
      - name: Deploy to ELK
        if: github.ref == 'refs/heads/main'
        run: python deploy/push_to_elk.py /tmp/es_rules.json`,
        debug:"GitHub Actions secret not available in fork PRs. Pre-commit hook not executable. Safety check fails on outdated lock file.",
        redblue:"Red: CI/CD pipelines are attack surface (supply chain). Supply chain compromises inject malicious code in CI steps. Blue: pin all actions to specific SHA, not tag.",
      },
      {day:28, lang:"ALL", title:"Month 1 Synthesis — Security Toolkit v1.0 Release",
        concepts:["Integration testing across all modules","Performance profiling and optimisation","Security review with bandit + semgrep","Documentation with MkDocs","Docker multi-stage build for production"],
        lab:"Full integration test: scan LAN → extract IOCs from 5 threat reports → check FIM → analyse auth log → all via single command. < 5 minutes total.",
        code:`# Complete integration test script
#!/usr/bin/env bash
set -euo pipefail
START=$(date +%s)

echo "[1/5] Port scanning lab network..."
python3 -m security_toolkit scan 192.168.100.0/24 --format json > /tmp/scan.json

echo "[2/5] Extracting IOCs from threat reports..."
for report in ~/workspace/labs/threat-reports/*.pdf; do
    python3 -m security_toolkit extract --file "$report"
done > /tmp/iocs.jsonl

echo "[3/5] File integrity check..."
python3 -m security_toolkit fim check --output json >> /tmp/fim.json

echo "[4/5] Auth log analysis..."
python3 -m security_toolkit analyze --log /var/log/auth.log > /tmp/auth.json

echo "[5/5] Generating unified report..."
python3 -m security_toolkit report --inputs /tmp/*.json --format html

echo "[+] Complete in $(($(date +%s)-START))s"`,
        debug:"Module import conflicts in integrated environment. SQLite locked by multiple modules simultaneously. Logging output interleaved from concurrent modules.",
        redblue:"Red: your toolkit is now a real tool. Could be found on a compromised system and used against you. Lock it down: 700 permissions, no world-readable config. Blue: your toolkit IS your blue team.",
      },
    ]
  },
];

/* ── Month 2 detail ── */
const MONTH2_WEEKS = [
  {
    week:5, title:"Blue Team — Detection Engineering", color:C.cyan,
    overview:"SIGMA writing, ELK stack deployment, detection pipeline, threat hunting fundamentals",
    keyProjects:["SIGMA automation platform","Detection pipeline v1","ATT&CK coverage map"],
    criticalConcepts:[
      {concept:"Detection-as-Code", why:"Treat detection rules like software: version control, tests, CI/CD, review", example:"Git repo with SIGMA rules, GitHub Actions auto-tests for FPs, auto-deploys to SIEM"},
      {concept:"Alert Quality vs Quantity", why:"Alert fatigue kills SOC effectiveness. 1000 alerts/day with 1% TP rate = analyst ignores everything", example:"Tune rules until FP rate < 5/day. Track: TP rate, FP rate, MTTD, MTTR"},
      {concept:"Baseline Behaviour", why:"Anomaly detection requires knowing what 'normal' is for YOUR environment", example:"Run 30 days of collection before turning on anomaly detection alerts"},
    ],
    dailyFocus:[
      {day:"29-30", focus:"SIGMA rule writing + pySigma automation + multi-backend conversion"},
      {day:"31-32", focus:"ELK stack deployment + index management + Kibana dashboards"},
      {day:"33-34", focus:"Sysmon deployment + event log analysis + detection from telemetry"},
      {day:"35",    focus:"Week 5 project: SIGMA platform with 10 rules, ELK deployment, coverage map"},
    ],
  },
  {
    week:6, title:"Red Team Scripting (Authorised Lab Only)", color:C.red,
    overview:"Recon automation, service enumeration, post-exploitation scripting for lab environments only",
    keyProjects:["Recon automation suite","Service fingerprinting tool","Pentest report generator"],
    criticalConcepts:[
      {concept:"Dual Use Tooling", why:"Every offensive tool teaches you what to detect. Writing a port scanner teaches you what port scans look like in logs", example:"After writing scanner: write SIGMA rule to detect it. After writing persistence: write detection for that persistence mechanism"},
      {concept:"Operational Security of Tools", why:"Your tools leave traces. Understanding what traces = understanding evasion = understanding better detection", example:"Run your recon tool, then analyse: what did it look like in Zeek logs, Sysmon, firewall? Write detection for it"},
      {concept:"Scope and Authorisation", why:"Critical: only run offensive tools on systems you own or have explicit written permission to test", example:"Lab VMs: 192.168.100.0/24. NEVER on external targets without written engagement authorisation"},
    ],
    dailyFocus:[
      {day:"36-37", focus:"OSINT automation (CT logs, DNS enum, WHOIS) + passive recon scripting"},
      {day:"38-39", focus:"Service enumeration scripting + vulnerability hint lookup + CVE database"},
      {day:"40-41", focus:"Post-exploitation recon scripts (privesc check, persistence for detection)"},
      {day:"42",    focus:"Week 6 project: full recon suite + pentest report generator"},
    ],
  },
  {
    week:7, title:"Malware Analysis Automation", color:C.purple,
    overview:"PE analysis, YARA development, dynamic analysis automation, Volatility scripting",
    keyProjects:["PE analyzer","YARA rule framework","Malware triage tool"],
    criticalConcepts:[
      {concept:"Static Before Dynamic", why:"Never execute unknown malware on non-isolated system. Always static first — understand capabilities before running", example:"PE analysis → YARA scan → strings → THEN sandbox in isolated VM with monitoring"},
      {concept:"IMPHASH for Clustering", why:"Same malware family has same imports. IMPHASH = fast family identification without full analysis", example:"Cluster 100 samples by IMPHASH. 95 will group into < 5 families. Only 5 need full analysis"},
      {concept:"YARA Quality Metrics", why:"A YARA rule that matches 1000 legitimate files is worse than no rule at all", example:"Test every rule: TP rate on positive samples, FP rate on clean Windows system. Minimum: 90% TP, < 0.1% FP"},
    ],
    dailyFocus:[
      {day:"43-44", focus:"PE format deep dive + pefile automation + IMPHASH clustering"},
      {day:"45-46", focus:"YARA rule writing + testing framework + ATT&CK technique mapping"},
      {day:"47-48", focus:"Volatility 3 automation + memory forensics scripting + capa integration"},
      {day:"49",    focus:"Week 7 project: complete malware triage tool (static + dynamic + report)"},
    ],
  },
  {
    week:8, title:"Advanced Detection Engineering", color:C.green,
    overview:"Statistical anomaly detection, ML-assisted detection, detection-as-code pipeline",
    keyProjects:["Statistical beaconing detector","Detection-as-code CI/CD","ATT&CK heatmap generator"],
    criticalConcepts:[
      {concept:"Statistical vs Signature Detection", why:"Signatures miss novel attacks. Statistics detect behavioural anomalies regardless of specific tool", example:"Beaconing detector catches unknown C2 frameworks because it detects TIMING patterns, not specific domains"},
      {concept:"Detection Coverage Metrics", why:"Without measuring coverage, you don't know your blind spots", example:"ATT&CK Navigator heatmap: green=detected, yellow=partial, red=no coverage. Board-level metric."},
      {concept:"ML in Security: Calibration", why:"High precision (few FPs) often more important than high recall (few FNs) in security ML", example:"A model with 99% recall but 50% precision generates 50 alerts for every real detection — unusable"},
    ],
    dailyFocus:[
      {day:"50-51", focus:"Statistical anomaly detection: beaconing, DGA, rare process, time-of-day"},
      {day:"52-53", focus:"ML basics for security: feature engineering, Random Forest, evaluation metrics"},
      {day:"54-55", focus:"Detection-as-code: CI/CD pipeline, automated FP testing, rule deployment"},
      {day:"56",    focus:"Week 8 project: complete detection platform with ATT&CK coverage report"},
    ],
  },
];

/* ── Month 3 detail ── */
const MONTH3_WEEKS = [
  {
    week:9,  title:"Async Architecture & High-Performance Pipelines", color:C.purple,
    days_summary:"asyncio producer/consumer, token bucket rate limiting, TTL caching, retry-with-backoff, 10k IOC/min pipeline",
    project:"Async IOC enrichment engine — processes 10,000 IOCs/minute respecting API rate limits",
    architecture:`IOC List → asyncio.Queue(maxsize=100) [backpressure]
    ↓
N Workers (asyncio tasks, Semaphore-limited)
    ↓ each worker:
    1. Dequeue IOC
    2. Check TTL cache (SQLite, asyncio.Lock)
    3. If miss: token bucket rate limiter → API call
    4. Store result in cache
    5. Output enriched IOC to output queue
    ↓
Output writer → JSONL file + Prometheus metrics`,
  },
  {
    week:10, title:"Plugin Architecture & REST API", color:C.blue,
    days_summary:"Abstract plugin base classes, dynamic loading, FastAPI endpoints, JWT auth, rate limiting, OpenAPI docs",
    project:"Security Toolkit REST API — all tools accessible via documented API with auth",
    architecture:`FastAPI app:
  POST /v1/scan         → scanner plugin
  POST /v1/extract      → extractor plugin
  GET  /v1/alerts       → alert store
  POST /v1/hunt         → threat hunting query
  GET  /v1/stats        → pipeline metrics
  GET  /docs            → auto-generated OpenAPI docs

Auth: JWT Bearer tokens
Rate: 100 req/min per token (token bucket)
Metrics: Prometheus at /metrics`,
  },
  {
    week:11, title:"CAPSTONE Week 1 — SENTRY Collection + Normalisation", color:C.cyan,
    days_summary:"Agent deployment (Linux bash + Windows PS), ECS normalisation, asyncio event queue, unit tests, Docker Compose",
    project:"SENTRY v0.1: collection layer with 3 agent types, unified JSONL stream",
    architecture:`Agents (independent processes):
  syslog_agent.sh    → reads /var/log/*.log → JSONL → stdout
  windows_agent.ps1  → reads EventLog → JSONL → HTTP POST
  endpoint_agent.sh  → reads /proc → JSONL → stdout

Normaliser (Python async):
  Reads from all agent streams
  Maps to ECS fields
  Validates schema
  Writes to asyncio.Queue(maxsize=10000)

Storage:
  SQLite for events + alerts
  Retention: 90 days rolling`,
  },
  {
    week:12, title:"CAPSTONE Week 2 — Detection + API + Dashboard", color:C.amber,
    days_summary:"SIGMA runner + YARA scanner + anomaly detector + FastAPI REST API + real-time WebSocket dashboard",
    project:"SENTRY v0.2: full detection engine + REST API + real-time dashboard",
    architecture:`Detection Engine (async):
  SIGMARunner:    applies 25 rules per event
  YARAScanner:    scans file paths extracted from events
  AnomalyDetect:  statistical models per metric
  MLClassifier:   sklearn IsolationForest for outliers

All detectors run concurrently:
  asyncio.gather(*[sigma.run(e), yara.scan(e), anomaly.score(e)])

REST API:
  Alerts: GET /alerts?severity=HIGH&since=2024-01-15
  Search: POST /search with Elastic-style query
  Hunt:   POST /hunt with SIGMA rule → ad-hoc search`,
  },
  {
    week:13, title:"CAPSTONE Week 3 — IR Automation + Deployment + Docs", color:C.green,
    days_summary:"4 IR playbooks, Docker Compose production, GitHub Actions CI/CD, MkDocs site, demo video, blog post",
    project:"SENTRY v1.0: fully deployed, documented, CI/CD running, publicly released",
    architecture:`IR Automation:
  Trigger: alert severity=CRITICAL
  Actions (playbook-based):
    ransomware:    isolate → memory dump → collect IOCs → notify
    credential:    reset passwords → hunt lateral → notify
    webshell:      preserve → capture → analyse → notify
    lateral_move:  map hops → contain → reset → notify

Deployment:
  docker-compose.yml: all services
  systemd units for: agents, normaliser, detector
  GitHub Actions: test → lint → build → deploy

Monitoring:
  Prometheus metrics for all components
  Grafana dashboard: 6 panels
  Alert on: pipeline stops, detection engine slow, storage full`,
  },
];

/* ── Progress checklist ── */
const CHECKLIST = [
  {phase:"Environment", items:[
    "Ubuntu 24.04 as primary OS",
    "KVM/QEMU installed and running",
    "Kali VM created (lab-network)",
    "Windows 10 VM created (lab-network)",
    "Ubuntu target VM created",
    "Python venv ~/.venvs/security active",
    "All pip packages installed",
    "Volatility 3 installed and working",
    "capa installed and working",
    "ELK stack running via Docker",
    "VS Code with all extensions",
    "pre-commit hooks installed",
    "Git configured with GPG signing",
    "GitHub repo created",
    "Workspace structure created",
  ]},
  {phase:"Month 1 Milestones", items:[
    "D7:  auth_analyzer.sh complete and deployed",
    "D14: port_scanner.py with asyncio benchmarked",
    "D14: IOC extractor with VT enrichment working",
    "D14: FIM with SQLite backend deployed",
    "D14: Process monitor running as service",
    "D21: End-to-end detection pipeline running",
    "D28: security-toolkit v1.0 tagged on GitHub",
    "D28: CI/CD passing (bandit, pytest, sigma check)",
    "D28: Docker image builds successfully",
    "D28: MkDocs docs site deployed",
  ]},
  {phase:"Month 2 Milestones", items:[
    "D35: 10 SIGMA rules written, validated, deployed to ELK",
    "D35: ATT&CK coverage heatmap generated",
    "D42: Recon suite: passive OSINT + active scan + report",
    "D49: Malware triage tool: PE+YARA+capa in 60s",
    "D49: YARA rules tested with TP>90% / FP<1%",
    "D56: Beaconing detector tested on synthetic data",
    "D56: Detection-as-code CI/CD pipeline working",
    "D56: ML classifier accuracy > 90% on test set",
  ]},
  {phase:"Month 3 Milestones", items:[
    "D63: Async IOC platform: 1000 IOCs/min throughput",
    "D63: REST API with auth, rate limiting, OpenAPI docs",
    "D70: CIS compliance checker for Ubuntu",
    "D70: Cross-platform endpoint audit tool",
    "D77: SENTRY: 3 collection agents running",
    "D84: SENTRY: detection engine + API deployed",
    "D90: SENTRY v1.0 public release on GitHub",
    "D90: Demo video recorded (5 min)",
    "D90: Technical blog post published",
  ]},
];

/* ── UI ── */
function Code({ code, lang }) {
  const lc = {BASH:C.cyan,PYTHON:C.green,POWERSHELL:C.purple,ALL:C.blue,"BASH+PYTHON":C.amber}[lang]||C.blue;
  return (
    <pre style={{background:"#020810",border:`1px solid ${C.border}`,borderLeft:`3px solid ${lc}`,
      borderRadius:3,padding:"10px 12px",color:lc,fontSize:10,
      fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",
      wordBreak:"break-word",margin:"8px 0",lineHeight:1.6}}>{code}</pre>
  );
}

function DayRow({ d }) {
  const [open, setOpen] = useState(false);
  const lc = {BASH:C.cyan,PYTHON:C.green,"PYTHON+BASH":C.amber,POWERSHELL:C.purple,ALL:C.blue}[d.lang]||C.blue;
  return (
    <div style={{border:`1px solid ${open?lc+"44":C.border}`,borderRadius:4,marginBottom:5}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:open?lc+"08":C.bg2}}>
        <span style={{background:lc+"22",color:lc,fontSize:8,padding:"1px 5px",borderRadius:2,minWidth:56,textAlign:"center",fontFamily:"'Courier New',monospace",fontWeight:700}}>{d.lang}</span>
        <span style={{color:"#1a4060",fontSize:9,minWidth:40,fontFamily:"'Courier New',monospace"}}>DAY {d.day}</span>
        <span style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",flex:1}}>{d.title}</span>
        <span style={{color:C.dim}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"12px 14px",background:"#020810",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <div style={{color:lc,fontSize:8,letterSpacing:"0.1em",marginBottom:4}}>CONCEPTS</div>
              {d.concepts.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:6,marginBottom:3}}>
                  <span style={{color:lc,fontSize:10}}>▸</span>
                  <span style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{c}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{color:C.green,fontSize:8,letterSpacing:"0.1em",marginBottom:4}}>LAB</div>
              <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{d.lab}</div>
              <div style={{color:C.red,fontSize:8,letterSpacing:"0.1em",marginTop:8,marginBottom:4}}>DEBUG EXERCISE</div>
              <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{d.debug}</div>
              <div style={{color:C.amber,fontSize:8,letterSpacing:"0.1em",marginTop:8,marginBottom:4}}>RED ↔ BLUE</div>
              <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{d.redblue}</div>
            </div>
          </div>
          <Code code={d.code} lang={d.lang}/>
        </div>
      )}
    </div>
  );
}

export default function LabSetup() {
  const [tab, setTab] = useState("setup");
  const [activeInstall, setActiveInstall] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeM2Week, setActiveM2Week] = useState(0);
  const [activeM3Week, setActiveM3Week] = useState(0);
  const [checkState, setCheckState] = useState({});

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",
      display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,20,40,0.05) 3px,rgba(0,20,40,0.05) 4px)"}}>

      {/* HEADER */}
      <div style={{background:"#000",borderBottom:`2px solid ${C.blue}44`,padding:"10px 22px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.green+"22",border:`1px solid ${C.green}66`,borderRadius:4,padding:"4px 12px",color:C.green,fontSize:12,fontWeight:700,letterSpacing:"0.12em"}}>LAB</div>
        <div>
          <div style={{color:C.bright,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>LAB SETUP + ENVIRONMENT BOOTSTRAP + CURRICULUM CONTINUATION</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.1em",marginTop:1}}>INSTALL SCRIPTS · WORKSPACE · VS CODE · WEEKS 3-8 DETAIL · MONTH 2-3 BREAKDOWN · PROGRESS CHECKLIST</div>
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
            padding:"9px 14px",cursor:"pointer",fontSize:10,letterSpacing:"0.07em",
            fontFamily:"'Courier New',monospace",fontWeight:700,
            display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,padding:"22px 26px",overflowY:"auto",background:C.bg}}>

        {/* ── LAB SETUP ── */}
        {tab==="setup"&&(
          <div>
            <pre style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,padding:"14px",
              color:C.cyan,fontSize:10,fontFamily:"'Fira Code','Courier New',monospace",
              whiteSpace:"pre",overflowX:"auto",marginBottom:20,lineHeight:1.5}}>
              {LAB_ARCH}
            </pre>
            <div style={{color:C.blue,fontSize:9,letterSpacing:"0.1em",marginBottom:10}}>NETWORK CONFIGURATION</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:20}}>
              {[
                {host:"Ubuntu Host",   ip:"192.168.100.1",  color:C.blue,  role:"Primary workstation"},
                {host:"Kali VM",       ip:"192.168.100.10", color:C.red,   role:"Red team tools"},
                {host:"Windows VM",    ip:"192.168.100.20", color:C.purple,role:"Blue team / PS / EDR"},
                {host:"Target VM",     ip:"192.168.100.30", color:C.amber, role:"Vulnerable services"},
              ].map((n,i)=>(
                <div key={i} style={{border:`1px solid ${n.color}33`,borderRadius:4,padding:"10px 12px",background:n.color+"08"}}>
                  <div style={{color:n.color,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{n.host}</div>
                  <div style={{color:C.dim,fontSize:10,fontFamily:"'Fira Code',monospace",marginTop:2}}>{n.ip}</div>
                  <div style={{color:C.dim,fontSize:9,marginTop:3}}>{n.role}</div>
                </div>
              ))}
            </div>
            <div style={{color:C.amber,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>QUICK START — RUN IN ORDER</div>
            <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
              {["01_ubuntu_base.sh","02_security_tools.sh","03_workspace_setup.sh","04_kvm_vms.sh","05_monitoring.sh"].map((f,i)=>(
                <div key={i} style={{padding:"8px 14px",borderBottom:i<4?`1px solid ${C.border}`:"none",
                  background:i%2?C.bg2:C.bg,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{color:C.amber,fontSize:10,fontFamily:"'Courier New',monospace",minWidth:20}}>{i+1}.</span>
                  <span style={{color:C.cyan,fontFamily:"'Fira Code',monospace",fontSize:11}}>bash {f}</span>
                  <span style={{color:C.dim,fontSize:10,marginLeft:"auto"}}>{INSTALL_SCRIPTS[i]?.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WORKSPACE ── */}
        {tab==="workspace"&&(
          <div>
            <Code lang="BASH" code={`# Complete workspace structure
~/workspace/security-toolkit/
├── src/
│   ├── __init__.py
│   ├── seclib.py              # Shared library (validation, logging, hashing)
│   ├── scanner/               # Port scanner module
│   │   ├── __init__.py
│   │   └── scanner.py
│   ├── extractor/             # IOC extractor module
│   ├── fim/                   # File integrity monitor
│   ├── analyzer/              # Log analyzer
│   ├── enricher/              # Threat intel enrichment
│   ├── detection/             # Detection engine (SIGMA+YARA+stats)
│   ├── api/                   # FastAPI REST API
│   └── dashboard/             # Web dashboard
├── tests/
│   ├── unit/                  # Unit tests per module
│   ├── integration/           # End-to-end integration tests
│   └── fixtures/              # Test data: sample logs, malware strings
├── scripts/
│   ├── bash/                  # Bash scripts (fim.sh, auth_analyzer.sh, etc)
│   └── powershell/            # PS scripts (persistence_hunter.ps1, etc)
├── rules/
│   ├── sigma/                 # Your SIGMA rules (20+ by end)
│   └── yara/                  # Your YARA rules (10+ by end)
├── config/
│   ├── config.yaml            # Tool settings (NOT secrets)
│   └── .env.example           # Secret template (committed)
├── deploy/
│   ├── docker-compose.yml     # Local development stack
│   ├── docker-compose.prod.yml# Production stack
│   └── systemd/               # .service and .timer files
├── docs/
│   ├── mkdocs.yml             # Documentation config
│   └── docs/                  # Markdown documentation
├── .github/
│   └── workflows/             # CI/CD pipelines
├── .pre-commit-config.yaml    # Pre-commit hooks
├── .gitignore
└── pyproject.toml             # Package definition`}/>

            <div style={{color:C.green,fontSize:9,letterSpacing:"0.1em",marginBottom:8,marginTop:16}}>seclib.py — SHARED LIBRARY (COPY TO YOUR WORKSPACE)</div>
            <Code lang="PYTHON" code={`"""seclib.py — foundation of every script in this curriculum"""
from __future__ import annotations
import re, json, hashlib, logging, os, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from contextlib import contextmanager
import tempfile

# ── Regex patterns ────────────────────────────────────────
IPV4_PAT  = re.compile(r'\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b')
PRIV_PAT  = re.compile(r'^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|127\\.)')
SHA256_PAT= re.compile(r'\\b[a-fA-F0-9]{64}\\b')
MD5_PAT   = re.compile(r'\\b[a-fA-F0-9]{32}\\b')
DOMAIN_PAT= re.compile(r'\\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}\\b')

# ── Logging ───────────────────────────────────────────────
def make_logger(name: str, level: str = 'INFO',
                logfile: Optional[str] = None) -> logging.Logger:
    """JSON-formatted logger. Use in EVERY script."""
    log = logging.getLogger(name)
    log.setLevel(getattr(logging, level.upper(), logging.INFO))
    fmt = logging.Formatter(
        '{"ts":"%(asctime)s","logger":"%(name)s","level":"%(levelname)s","msg":%(message)s}',
        datefmt='%Y-%m-%dT%H:%M:%SZ')
    if not log.handlers:
        sh = logging.StreamHandler(sys.stderr)
        sh.setFormatter(fmt)
        log.addHandler(sh)
    if logfile:
        fh = logging.FileHandler(logfile, mode='a')
        fh.setFormatter(fmt)
        log.addHandler(fh)
    return log

# ── Validation ────────────────────────────────────────────
def is_valid_ip(ip: str) -> bool:
    return bool(IPV4_PAT.fullmatch(ip.strip()))

def is_private(ip: str) -> bool:
    return bool(PRIV_PAT.match(ip.strip()))

def is_public_ip(ip: str) -> bool:
    return is_valid_ip(ip) and not is_private(ip)

# ── Hashing ───────────────────────────────────────────────
def hash_file(path: str | Path, algo: str = 'sha256') -> str:
    """Stream-hash any file safely. Handles large files."""
    h = hashlib.new(algo)
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

def hash_str(s: str, algo: str = 'sha256') -> str:
    return hashlib.new(algo, s.encode()).hexdigest()

# ── Safe temp file ────────────────────────────────────────
@contextmanager
def safe_tempfile(suffix: str = '', prefix: str = 'sct_'):
    """Context manager for safe temp file with guaranteed cleanup."""
    fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
    try:
        os.close(fd)
        os.chmod(path, 0o600)
        yield path
    finally:
        try: os.unlink(path)
        except FileNotFoundError: pass

# ── Alert output ──────────────────────────────────────────
def make_alert(severity: str, rule: str, detail: str,
               host: Optional[str] = None, **extra) -> dict:
    return {
        'ts':       datetime.now(timezone.utc).isoformat(),
        'severity': severity.upper(),
        'rule':     rule,
        'detail':   detail,
        'host':     host or os.uname().nodename,
        'pid':      os.getpid(),
        **extra
    }

def emit_alert(severity: str, rule: str, detail: str,
               logfile: Optional[str] = None, **extra) -> str:
    """Output JSON alert to stdout and optionally to logfile."""
    alert = make_alert(severity, rule, detail, **extra)
    line  = json.dumps(alert)
    print(line)
    if logfile:
        with open(logfile, 'a') as f:
            f.write(line + '\\n')
    return line`}/>
          </div>
        )}

        {/* ── TOOL INSTALLS ── */}
        {tab==="tools"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {INSTALL_SCRIPTS.map((s,i)=>(
                <button key={i} onClick={()=>setActiveInstall(i)} style={{
                  background:activeInstall===i?s.color+"22":C.bg2,
                  border:`1px solid ${activeInstall===i?s.color:C.border}`,
                  borderRadius:3,padding:"6px 12px",cursor:"pointer",
                  color:activeInstall===i?s.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>
                  {s.name}
                </button>
              ))}
            </div>
            {INSTALL_SCRIPTS[activeInstall]&&(()=>{
              const s = INSTALL_SCRIPTS[activeInstall];
              return (
                <div style={{border:`1px solid ${s.color}33`,borderRadius:4}}>
                  <div style={{background:s.color+"11",padding:"8px 14px",borderBottom:`1px solid ${s.color}22`,display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{color:s.color,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{s.file}</span>
                    <span style={{color:C.dim,fontSize:10}}>{s.desc}</span>
                    <span style={{marginLeft:"auto",color:C.dim,fontSize:9}}>bash {s.file}</span>
                  </div>
                  <Code code={s.code} lang="BASH"/>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── VS CODE ── */}
        {tab==="vscode"&&(
          <div>
            <div style={{marginBottom:16}}>
              <div style={{color:C.blue,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>REQUIRED EXTENSIONS</div>
              <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                {VSCODE_CONFIG.extensions.map((e,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:i%2?C.bg2:C.bg,borderBottom:i<VSCODE_CONFIG.extensions.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{padding:"6px 12px",color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`}}>{e.name}</div>
                    <div style={{padding:"6px 12px",color:C.cyan,fontSize:10,fontFamily:"'Fira Code',monospace",borderRight:`1px solid ${C.border}`}}>{e.id}</div>
                    <div style={{padding:"6px 12px",color:C.dim,fontSize:10}}>{e.reason}</div>
                  </div>
                ))}
              </div>
              <Code lang="BASH" code={`# Install all extensions at once:
code --install-extension ms-python.python \\
     --install-extension ms-python.black-formatter \\
     --install-extension charliermarsh.ruff \\
     --install-extension ms-python.mypy-type-checker \\
     --install-extension timonwong.shellcheck \\
     --install-extension foxundermoon.shell-format \\
     --install-extension ms-vscode.powershell \\
     --install-extension redhat.vscode-yaml \\
     --install-extension eamodio.gitlens \\
     --install-extension mhutchie.git-graph \\
     --install-extension zhuangtongfa.material-theme \\
     --install-extension PKief.material-icon-theme`}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{color:C.green,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>settings.json (~/.config/Code/User/settings.json)</div>
              <Code lang="PYTHON" code={VSCODE_CONFIG.settings}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{color:C.amber,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>launch.json (.vscode/launch.json in workspace)</div>
              <Code lang="PYTHON" code={VSCODE_CONFIG.launch}/>
            </div>
          </div>
        )}

        {/* ── WEEKS 3-8 ── */}
        {tab==="weeks"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {WEEK_DETAIL.map((w,i)=>(
                <button key={i} onClick={()=>setActiveWeek(i)} style={{
                  background:activeWeek===i?w.color+"22":C.bg2,
                  border:`1px solid ${activeWeek===i?w.color:C.border}`,
                  borderRadius:3,padding:"6px 12px",cursor:"pointer",
                  color:activeWeek===i?w.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",fontWeight:700}}>
                  WEEK {w.week}: {w.title}
                </button>
              ))}
            </div>
            {WEEK_DETAIL[activeWeek]&&(()=>{
              const w = WEEK_DETAIL[activeWeek];
              return (
                <div>
                  <div style={{border:`1px solid ${w.color}33`,borderRadius:4,padding:"10px 14px",background:w.color+"08",marginBottom:12}}>
                    <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:4}}>WEEK {w.week} OVERVIEW</div>
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace"}}>{w.days[0]?.concepts?.join(" · ")}</div>
                  </div>
                  {w.days.map(d=><DayRow key={d.day} d={d}/>)}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── MONTH 2 DETAIL ── */}
        {tab==="month2"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {MONTH2_WEEKS.map((w,i)=>(
                <button key={i} onClick={()=>setActiveM2Week(i)} style={{
                  background:activeM2Week===i?w.color+"22":C.bg2,
                  border:`1px solid ${activeM2Week===i?w.color:C.border}`,
                  borderRadius:3,padding:"6px 12px",cursor:"pointer",
                  color:activeM2Week===i?w.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",fontWeight:700}}>
                  W{w.week}: {w.title}
                </button>
              ))}
            </div>
            {MONTH2_WEEKS[activeM2Week]&&(()=>{
              const w = MONTH2_WEEKS[activeM2Week];
              return (
                <div>
                  <div style={{border:`1px solid ${w.color}33`,borderRadius:4,padding:"12px 14px",background:w.color+"08",marginBottom:14}}>
                    <div style={{color:w.color,fontSize:12,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:6}}>WEEK {w.week}: {w.title}</div>
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:8}}>{w.overview}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {w.keyProjects.map((p,i)=>(
                        <span key={i} style={{background:w.color+"22",color:w.color,fontSize:10,padding:"2px 8px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>📦 {p}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:14}}>
                    <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>CRITICAL CONCEPTS</div>
                    {w.criticalConcepts.map((c,i)=>(
                      <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:3,padding:"10px 12px",marginBottom:7,background:C.bg2}}>
                        <div style={{color:C.bright,fontSize:11,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:3}}>{c.concept}</div>
                        <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",marginBottom:5,lineHeight:1.5}}><span style={{color:w.color}}>WHY: </span>{c.why}</div>
                        <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",lineHeight:1.5,padding:"5px 8px",background:C.bg3,borderRadius:2}}>
                          <span style={{color:C.cyan}}>EXAMPLE: </span>{c.example}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:8}}>DAILY FOCUS</div>
                    <div style={{border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                      {w.dailyFocus.map((f,i)=>(
                        <div key={i} style={{display:"grid",gridTemplateColumns:"80px 1fr",background:i%2?C.bg2:C.bg,borderBottom:i<w.dailyFocus.length-1?`1px solid ${C.border}`:"none"}}>
                          <div style={{padding:"8px 12px",color:w.color,fontSize:10,fontFamily:"'Courier New',monospace",borderRight:`1px solid ${C.border}`,fontWeight:700}}>D{f.day}</div>
                          <div style={{padding:"8px 12px",color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace"}}>{f.focus}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── MONTH 3 DETAIL ── */}
        {tab==="month3"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {MONTH3_WEEKS.map((w,i)=>(
                <button key={i} onClick={()=>setActiveM3Week(i)} style={{
                  background:activeM3Week===i?w.color+"22":C.bg2,
                  border:`1px solid ${activeM3Week===i?w.color:C.border}`,
                  borderRadius:3,padding:"6px 12px",cursor:"pointer",
                  color:activeM3Week===i?w.color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",fontWeight:700}}>
                  W{w.week}: {w.title.split("—")[0]}
                </button>
              ))}
            </div>
            {MONTH3_WEEKS[activeM3Week]&&(()=>{
              const w = MONTH3_WEEKS[activeM3Week];
              return (
                <div>
                  <div style={{border:`1px solid ${w.color}33`,borderRadius:4,padding:"12px 14px",background:w.color+"08",marginBottom:14}}>
                    <div style={{color:w.color,fontSize:12,fontWeight:700,fontFamily:"'Courier New',monospace",marginBottom:6}}>WEEK {w.week}: {w.title}</div>
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:10,lineHeight:1.5}}>{w.days_summary}</div>
                    <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:5}}>KEY PROJECT</div>
                    <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:10}}>{w.project}</div>
                    <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:5}}>ARCHITECTURE</div>
                    <pre style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,padding:"10px",color:C.cyan,fontSize:10,fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",margin:0,lineHeight:1.6}}>
                      {w.architecture}
                    </pre>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {tab==="checklist"&&(
          <div>
            <div style={{color:C.blue,fontSize:9,letterSpacing:"0.1em",marginBottom:14}}>PROGRESS CHECKLIST — TICK OFF AS YOU COMPLETE</div>
            {CHECKLIST.map((section,si)=>(
              <div key={si} style={{marginBottom:16,border:`1px solid ${C.border}`,borderRadius:5}}>
                <div style={{background:C.bg3,padding:"8px 14px",color:C.blue,fontSize:10,fontWeight:700,letterSpacing:"0.1em"}}>
                  {section.phase}
                  <span style={{marginLeft:12,color:C.dim,fontSize:9,fontWeight:400}}>
                    {section.items.filter((_,i)=>checkState[`${si}-${i}`]).length} / {section.items.length} complete
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))"}}>
                  {section.items.map((item,i)=>(
                    <div key={i}
                      onClick={()=>setCheckState(s=>({...s,[`${si}-${i}`]:!s[`${si}-${i}`]}))}
                      style={{padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,
                        background:checkState[`${si}-${i}`]?C.green+"08":C.bg2,
                        borderBottom:`1px solid ${C.border}`,
                        transition:"background 0.15s"}}>
                      <span style={{width:16,height:16,border:`1px solid ${checkState[`${si}-${i}`]?C.green:C.dim}`,
                        borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                        background:checkState[`${si}-${i}`]?C.green+"22":"transparent",fontSize:10,color:C.green}}>
                        {checkState[`${si}-${i}`]?"✓":""}
                      </span>
                      <span style={{color:checkState[`${si}-${i}`]?C.green:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 22px",display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim}}>
        <span>LAB SETUP + CONTINUATION — SECURITY SCRIPTING CURRICULUM</span>
        <span style={{color:C.blue+"55"}}>5 INSTALL SCRIPTS · WORKSPACE · VS CODE · WEEKS 3-8 · MONTHS 2-3 · CHECKLIST</span>
      </div>
    </div>
  );
}
