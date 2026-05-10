import { useState, useRef } from "react";

const C = {
  bg:"#030a04", bg2:"#050f07", bg3:"#07160a",
  border:"#0a2a12", dim:"#336644", bright:"#aaffcc",
  green:"#00ff66", green2:"#44ff88", cyan:"#00ddaa",
  amber:"#ffaa00", red:"#ff3355", purple:"#aa66ff",
  blue:"#44aaff", lime:"#bbff44", white:"#ccffdd",
};

/* ═══════════════════════════════════════════════════
   MONTH 3 — ADVANCED TOOLING + MALWARE + CAPSTONE
   Days 57-90 | Full 22-component daily format
   ═══════════════════════════════════════════════════ */

const WEEKS = [
  {
    id:"w9", week:9, color:C.purple,
    title:"Async Architecture & High-Performance Pipelines",
    theme:"asyncio is not just faster — it changes how you think about tool design. Every I/O-bound security tool should be async.",
    challenge:"Async IOC enrichment engine: 1,000 IOCs enriched in < 5 minutes respecting VT rate limit (4/min). Zero duplicate API calls. Zero data loss on errors.",
    projects:["Async IOC enrichment engine","Token bucket rate limiter","TTL SQLite cache layer"],
    days:[
      {
        day:57, lang:"PYTHON", title:"asyncio Event Loop, Tasks & Structured Concurrency",
        obj:"Master asyncio at the internals level. Build production-grade async pipelines with proper cancellation, timeouts, and error handling.",
        tech:`asyncio event loop: single-threaded coroutine scheduler backed by epoll (Linux)/kqueue (macOS)/IOCP (Windows).
asyncio.get_event_loop().run_until_complete() → loop.run_forever() internally calls epoll_wait() repeatedly.
coroutine: function defined with 'async def'. Calling it returns a coroutine object — not yet executing.
Task: wraps a coroutine, scheduled to run by the event loop. asyncio.create_task() → schedules immediately.
await: suspends current coroutine, hands control to event loop. Event loop runs other tasks.
asyncio.sleep(0): yield control to event loop without actual sleep — cooperative multitasking.
TaskGroup (Python 3.11+): structured concurrency — all tasks cancelled if any raises exception.
asyncio.timeout(N): context manager replacing wait_for for cleaner cancellation semantics.
Event loop blocking: time.sleep(1) in a coroutine → blocks ALL tasks. Use asyncio.sleep(1) instead.`,
        commands:["asyncio.create_task(coro())", "asyncio.gather(*tasks, return_exceptions=True)", "async with asyncio.TaskGroup() as tg:", "asyncio.wait_for(coro(), timeout=5.0)", "loop.run_in_executor(None, blocking_func)"],
        walkthrough:`async_pipeline.py — production async architecture:
1. Producer coroutine: reads items from source, puts into asyncio.Queue(maxsize=N)
   maxsize creates backpressure: producer blocks when queue full → avoids OOM
2. Worker pool: N coroutines pulling from queue
   asyncio.Semaphore(N) limits concurrent operations independently
3. Rate limiter: token bucket shared across all workers
   asyncio.Lock protects token bucket state
4. Error handler: CancelledError propagation, dead-letter queue for retries
5. Consumer: reads from output queue, writes results
6. Metrics: Prometheus counters updated per operation

Key pattern:
async def worker(in_q, out_q, sem, limiter):
    while True:
        item = await in_q.get()
        async with sem:
            await limiter.acquire()
            result = await process(item)
            await out_q.put(result)
        in_q.task_done()`,
        scratch:`# From scratch: async_enricher.py
# Stage 1: read IOC list → asyncio.Queue
# Stage 2: N worker coroutines → each: check cache → rate limit → API call → cache result
# Stage 3: write enriched IOCs to output JSONL
# Rate: 4 VT calls/min (1 token per 15 seconds)

import asyncio, aiohttp, json, time
from pathlib import Path

class TokenBucket:
    """Rate limiter: tokens added at rate R/sec, max burst = capacity."""
    def __init__(self, rate: float, capacity: float):
        self.rate     = rate      # tokens/second
        self.capacity = capacity  # max tokens
        self.tokens   = capacity  # current tokens
        self.last_refill = time.monotonic()
        self._lock    = asyncio.Lock()
    
    async def acquire(self, tokens: float = 1.0):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_refill = now
            if self.tokens < tokens:
                wait = (tokens - self.tokens) / self.rate
                await asyncio.sleep(wait)
                self.tokens = 0.0
            else:
                self.tokens -= tokens

async def main():
    iocs = Path('iocs.txt').read_text().splitlines()
    q_in  = asyncio.Queue(maxsize=100)
    q_out = asyncio.Queue()
    bucket = TokenBucket(rate=4/60, capacity=4)  # 4/min VT limit
    
    async def producer():
        for ioc in iocs: await q_in.put(ioc)
        for _ in range(WORKERS): await q_in.put(None)  # sentinel
    
    async def worker():
        async with aiohttp.ClientSession() as session:
            while True:
                ioc = await q_in.get()
                if ioc is None: break
                await bucket.acquire()
                # ... API call, cache check, result to q_out
    
    WORKERS = 4
    await asyncio.gather(producer(), *[worker() for _ in range(WORKERS)])`,
        debug:`import asyncio

async def fetch_all(urls):
    results = []
    for url in urls:
        r = await fetch(url)      # BUG 1: sequential! not concurrent — await in loop
        results.append(r)
    return results

async def fetch(url):
    import time
    time.sleep(1)                 # BUG 2: blocks event loop — use asyncio.sleep(1)
    return url

async def main():
    tasks = [asyncio.create_task(fetch(u)) for u in urls]
    done, pending = await asyncio.wait(tasks)  # BUG 3: doesn't handle exceptions
    # BUG 4: pending tasks not cancelled on completion
    # BUG 5: return_exceptions not handled — first failure kills gather`,
        analysis:`Profile your async enricher:
1. asyncio.get_event_loop().set_debug(True) — shows: coroutines taking > 0.1s (blocking)
2. import uvloop; asyncio.set_event_loop_policy(uvloop.EventLoopPolicy()) — 2x faster event loop
3. Use yappi profiler for async-aware profiling
4. Measure: queue backlog (in_q.qsize()), worker idle time, API call latency p50/p99
Target: 0% time workers are blocked waiting for each other.`,
        usecase:"Every security tool that makes API calls benefits from asyncio: IOC enrichment, threat intel pulls, SIEM ingestion, alert triage. 10x throughput improvement over sequential.",
        red:"Async request tools can generate bursts that look like DDoS. Red teams use async for: fast credential stuffing, rapid enumeration, concurrent exploit attempts. Each async worker = one concurrent connection.",
        blue:"Detect async tools: many concurrent connections from single source/process. Unusual connection timing patterns (no human delays). Monitor: connections per second per process.",
        detect:"Sysmon Event 3 (network connection): single process making 50+ connections in 1 second = tool, not human. Alert threshold: > 20 connections/min from single process to external hosts.",
        mistakes:[
          "await in a for loop (sequential, not concurrent — defeats the purpose)",
          "time.sleep() in coroutine (blocks entire event loop)",
          "asyncio.Queue(maxsize=0) = unlimited, can OOM on fast producers",
          "Not handling CancelledError — tasks leave resources open on cancellation",
          "asyncio.gather without return_exceptions=True — first failure cancels all",
          "Forgetting task_done() on Queue.get() — queue.join() hangs forever",
        ],
        perf:"asyncio vs threading for I/O-bound: asyncio wins above 100 concurrent operations (less overhead per task). Below 10: threading is simpler and similar performance. asyncio: 1 thread, N tasks. Threading: N threads, OS-level scheduling.",
        logging:"Async logging: use standard logging (thread-safe). Include: task_name, correlation_id, operation, duration. asyncio.current_task().get_name() gives task name.",
        secure:"Async tools make many connections — easier to accidentally DoS targets. Always apply rate limiting BEFORE scaling workers. Validate every API response before processing.",
        lab:"async_enricher.py: enrich 100 IOCs against mock VT server (flask-based). Measure: total time, API calls made, cache hit rate. Verify: no duplicate API calls, no data loss on network error.",
        project:"ioc_enrichment_engine.py: production async enricher. Features: token bucket rate limiting, SQLite TTL cache, dead-letter queue for retries, Prometheus metrics (throughput, error rate, cache hit rate), progress bar.",
        output:"1000 IOCs enriched in < 5 minutes with 4/min rate limit. Cache hit rate > 50% on repeated runs. Zero duplicate API calls verified. Prometheus metrics scraping.",
        stretch:"Implement adaptive concurrency: start with 4 workers. If queue backlog grows, add workers (up to max). If queue empty, reduce workers. Stabilises at optimal concurrency for current load.",
        hw:"Read Python asyncio documentation on 'Synchronisation Primitives': Lock, Event, Condition, Semaphore, BoundedSemaphore, Barrier. Write examples showing when you'd use each in a security tool.",
        research:"What is uvloop? How does it achieve 2x speedup over asyncio's default event loop? What is the Proactor event loop (Windows)? When would you use multiprocessing vs asyncio for a security tool?"
      },
      {
        day:58, lang:"PYTHON", title:"Plugin Architecture & Dynamic Loading",
        obj:"Build extensible plugin system. Add new detection sources or enrichment providers without modifying core code.",
        tech:`Python import system: importlib.import_module() → calls __import__() → searches sys.path → compiles .py to .pyc → loads module object.
pkgutil.iter_modules(): walks a directory, yields (finder, name, ispkg) for each module found.
ABC (Abstract Base Class): enforces interface contract at class definition time (not at call time like duck typing).
Protocol (typing): structural subtyping — class matches Protocol if it has required methods (no inheritance needed).
Entry points (pyproject.toml): register plugins by package name → discover with importlib.metadata.entry_points().
importlib.util.spec_from_file_location(): load module from arbitrary file path (not on sys.path).
Plugin hot-reload: call importlib.reload(module) to reload modified plugin without restarting service.
Dependency injection: pass dependencies (DB, logger, config) into plugin __init__ rather than letting plugin create them.`,
        commands:["importlib.import_module('plugins.vt_enricher')", "pkgutil.iter_modules(['plugins/'])", "importlib.util.spec_from_file_location()", "importlib.metadata.entry_points(group='sct.enrichers')"],
        walkthrough:`plugin_engine.py — Extensible plugin system:
1. PluginBase ABC: defines interface contract
   abstract methods: name, version, enrich(ioc) → dict | None
2. PluginLoader: scans plugins/ directory, loads all subclasses of PluginBase
3. PluginRegistry: {name: plugin_instance} — O(1) lookup
4. PluginRunner: execute all registered plugins for each IOC, merge results
5. PluginMonitor: watch plugins/ with inotify, hot-reload modified plugins

Adding new enrichment source:
1. Create plugins/new_source.py
2. Define class MySource(EnricherPlugin):
3. Implement enrich() method
4. Drop file in plugins/ directory
5. Plugin automatically discovered on next request (or hot-reload)`,
        scratch:`# plugin_system.py from scratch
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable
import importlib, pkgutil
from pathlib import Path

@runtime_checkable
class EnricherPlugin(Protocol):
    name: str
    version: str
    def enrich(self, ioc: str, ioc_type: str) -> dict | None: ...
    def health_check(self) -> bool: ...

class BaseEnricher(ABC):
    """Inherit from this for IDE support and default implementations."""
    
    @property
    @abstractmethod
    def name(self) -> str: ...
    
    @property
    def version(self) -> str: return "1.0.0"
    
    @abstractmethod
    def enrich(self, ioc: str, ioc_type: str) -> dict | None: ...
    
    def health_check(self) -> bool:
        """Override to check if this enricher is available."""
        return True

class PluginRegistry:
    def __init__(self, plugins_dir: str):
        self._plugins: dict[str, BaseEnricher] = {}
        self._dir = Path(plugins_dir)
    
    def load_all(self, config: dict, logger) -> int:
        """Load all plugins from plugins_dir. Returns count loaded."""
        count = 0
        for finder, name, _ in pkgutil.iter_modules([str(self._dir)]):
            try:
                mod = importlib.import_module(f'plugins.{name}')
                for attr_name in dir(mod):
                    obj = getattr(mod, attr_name)
                    if (isinstance(obj, type) and issubclass(obj, BaseEnricher)
                            and obj is not BaseEnricher):
                        instance = obj(config=config, logger=logger)
                        self._plugins[instance.name] = instance
                        count += 1
                        logger.info("Loaded plugin: %s v%s", instance.name, instance.version)
            except Exception as e:
                logger.error("Failed to load plugin %s: %s", name, e)
        return count`,
        debug:`import importlib, pkgutil

class PluginLoader:
    def __init__(self):
        self.plugins = []
    
    def load(self, directory):
        for name in pkgutil.iter_modules([directory]):  # BUG 1: iter_modules yields tuples, not strings
            module = importlib.import_module(name)      # BUG 2: name needs prefix, not standalone
            for cls in module.__dict__.values():        # BUG 3: includes non-class objects
                if issubclass(cls, BasePlugin):         # BUG 4: TypeError if cls is not a class
                    self.plugins.append(cls)            # BUG 5: appends class not instance (no config injected)`,
        analysis:"Take your IOC enricher from Month 1. Refactor: VT enricher → plugin, AbuseIPDB enricher → plugin, MISP enricher → plugin. Core engine unchanged. Add new plugin by creating one file.",
        usecase:"Enterprise security tools evolve constantly. New threat intel sources, new detection techniques, new output formats. Plugin architecture means: security engineers add sources without touching core.",
        red:"Plugin architectures are targets: if attacker can drop a file in plugins/ directory, they add their own 'plugin' (backdoor). Protect: signed plugins, hash verification, read-only plugin directory.",
        blue:"Audit all loaded plugins: log plugin name, version, hash on load. Alert on: new plugin file appearing, plugin file hash changing, plugin load errors (possibly broken/malicious plugin).",
        detect:"File creation in plugins/ directory: inotify alert. Plugin that makes unexpected outbound connections (network monitoring). Plugin causing unusual system calls (auditd).",
        mistakes:["Not validating plugin interface before loading (crashes at runtime)", "Loading plugins as root (plugin code runs as root)", "No plugin isolation (buggy plugin crashes entire process)", "Hot-reload without clearing old plugin state"],
        perf:"Plugin loading: one-time cost at startup. Plugin execution: depends on plugin. Profile each plugin independently. Timeout plugins: don't let slow plugin block the pipeline.",
        logging:"Log: plugin loaded (name, version, path, hash), plugin executed (name, ioc, duration, result), plugin error (name, ioc, exception). Never log: plugin results containing credentials.",
        secure:"Plugin signing: hash each plugin file at load time, verify against allowlist. Run plugins in subprocess with limited permissions. Never load plugins from user-writable directories.",
        lab:"Refactor security toolkit enricher as plugin system. 3 plugins: VT, AbuseIPDB, local threat intel DB. Add 4th plugin (Shodan) without touching core. Verify: zero core changes needed.",
        project:"plugin_engine.py: full plugin system with: ABC interface, dynamic loader, registry, hot-reload, health checks, dependency injection, signed plugin verification.",
        output:"4 plugins loaded automatically. New plugin added by dropping .py file. Hot-reload works. Health check dashboard shows plugin status.",
        stretch:"Plugin sandboxing: run each plugin in a separate process via multiprocessing.Process. Communication via Queue. Plugin crash doesn't affect core engine.",
        hw:"Study Python's import system internals: sys.meta_path, importlib.abc.MetaPathFinder. How does pip's editable install work? How does the import system find packages?",
        research:"How do major security platforms (Splunk apps, Elastic integrations) implement their extension systems? Compare Python plugin patterns to Golang plugin system. What are the tradeoffs?"
      },
      {
        day:59, lang:"PYTHON", title:"FastAPI Security Tool REST API",
        obj:"Build production REST API for security toolkit. JWT auth, rate limiting, OpenAPI docs, background tasks, webhooks.",
        tech:`FastAPI: ASGI framework. Routes compile to a regex router at startup. Each route = decorated function.
Pydantic models: request/response validation at runtime using Python type annotations.
Dependency injection: FastAPI resolves dependencies (Depends()) recursively before calling route handler.
JWT (JSON Web Token): header.payload.signature. Payload: {'sub': 'user_id', 'exp': timestamp}.
python-jose: JWT encoding/decoding. Algorithm: HS256 (HMAC-SHA256) for symmetric, RS256 for asymmetric.
OAuth2PasswordBearer: extracts Bearer token from Authorization header. Not full OAuth2.
BackgroundTasks: runs tasks after response sent. For: alerting, logging, async enrichment triggers.
HTTPException: FastAPI converts to HTTP error response with proper status code and JSON body.
Starlette (underlying ASGI): middleware stack, request lifecycle, websockets.`,
        commands:["uvicorn src.api.main:app --reload --port 8000", "from fastapi import FastAPI, Depends, HTTPException, Header", "from fastapi.security import OAuth2PasswordBearer", "pip install fastapi uvicorn python-jose passlib"],
        walkthrough:`security_api.py — Production security tool API:
1. Auth: /v1/auth/token → POST username+password → JWT access token (1h exp)
2. API key auth: X-API-Key header checked against hashed keys in DB
3. Rate limiter: per-IP rate limiting with redis-backed counter (or in-memory for small scale)
4. Endpoints:
   POST /v1/scan           → async port scan (background task)
   POST /v1/extract        → IOC extraction from uploaded file
   POST /v1/enrich         → IOC enrichment
   GET  /v1/alerts         → paginated alert query
   POST /v1/hunt           → threat hunting query
   GET  /v1/health         → service health check
   GET  /v1/metrics        → Prometheus metrics
5. Background tasks: scans run async, results polled via GET /v1/tasks/{id}
6. Webhooks: POST to configured URL on alert creation`,
        scratch:`# api/main.py from scratch
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, IPvAnyAddress
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets, time

app = FastAPI(
    title="Security Toolkit API",
    version="1.0.0",
    description="Professional security automation REST API",
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc",    # ReDoc UI
)

# Auth
SECRET_KEY = secrets.token_hex(32)  # In production: from environment
ALGORITHM  = "HS256"
TOKEN_TTL  = 3600  # 1 hour

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2   = OAuth2PasswordBearer(tokenUrl="/v1/auth/token")

def create_token(data: dict) -> str:
    payload = data | {"exp": time.time() + TOKEN_TTL}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("exp", 0) < time.time():
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
        return payload
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

class ScanRequest(BaseModel):
    target:   str
    ports:    str = "1-1024"
    timeout:  float = 1.0

@app.post("/v1/scan", dependencies=[Depends(get_current_user)])
async def scan(req: ScanRequest, bg: BackgroundTasks):
    task_id = secrets.token_hex(8)
    bg.add_task(run_scan, task_id, req.target, req.ports)
    return {"task_id": task_id, "status": "queued"}`,
        debug:`from fastapi import FastAPI

app = FastAPI()

# BUG 1: no auth — any unauthenticated user can call this
@app.post('/scan')
async def scan(target: str):                    # BUG 2: no Pydantic model — no validation
    import subprocess
    result = subprocess.run(f'nmap {target}',   # BUG 3: shell injection via target parameter
                           shell=True,           # BUG 4: shell=True with user input
                           capture_output=True)
    return result.stdout                        # BUG 5: returning bytes, not str — serialisation error`,
        analysis:"Deploy your API and run security assessment against it: test for: SQL injection (via ORM? no, but check), command injection in query params, JWT algorithm confusion (alg:none), rate limit bypass, IDOR on task IDs.",
        usecase:"Expose security tools as APIs: integrate with SOAR platforms, provide access to team without SSH, webhook receiver for external systems, mobile app integration for on-call analysts.",
        red:"REST APIs are common attack targets: JWT confusion attacks, IDOR (sequential task IDs), missing auth on internal endpoints, rate limit bypass via header manipulation. Test your own API.",
        blue:"API security: JWT with short TTL + refresh tokens, rate limit per API key not IP (proxied clients share IP), log every authenticated request with: user, endpoint, parameters (sanitised), response code.",
        detect:"Alert on: 401/403 rate spike (brute force), sequential resource ID enumeration, unusual endpoints (404 spike = scanner), request body size anomalies.",
        mistakes:["JWT without expiration (forever tokens)", "Hardcoded SECRET_KEY (rotate regularly)", "Returning internal errors to API consumers (information disclosure)", "No rate limiting (DoS vulnerable)", "Task IDs that are sequential integers (IDOR)"],
        perf:"FastAPI: ~30,000 req/sec for simple routes (measured). I/O-bound (DB, external API): use async routes. CPU-bound (parsing, hashing): use BackgroundTasks + ProcessPoolExecutor.",
        logging:"Every API request: {method, path, status_code, duration_ms, user_id, ip, request_id}. Structured JSON. Never log: request bodies containing sensitive data (IOCs, credentials, file content).",
        secure:"Security headers middleware: HSTS, X-Content-Type-Options, X-Frame-Options, CSP. Input validation: Pydantic rejects unexpected fields. No shell=True. Sanitise all query parameters.",
        lab:"Deploy API (uvicorn). Test all endpoints. Run automated API security scan (OWASP ZAP). Fix: any auth bypass, injection vulnerabilities, information disclosure.",
        project:"security_api/: production FastAPI app. Features: JWT + API key auth, rate limiting, all toolkit functions exposed, background task queue, webhook on alert, Prometheus metrics, OpenAPI docs.",
        output:"API running at localhost:8000. /docs shows all 10 endpoints. Auth working. Rate limiting (100/min) enforced. Background scan task completes and result retrievable.",
        stretch:"Add WebSocket endpoint /v1/alerts/stream: push new alerts to connected clients in real-time. Implement SSE (Server-Sent Events) as fallback for clients that don't support WebSocket.",
        hw:"Study OWASP API Security Top 10 (2023 version). For each vulnerability: how does FastAPI help prevent it? What do you need to implement yourself? Write example vulnerable + fixed code for each.",
        research:"What is ASGI vs WSGI? Why does FastAPI require ASGI? How does uvicorn handle concurrent requests vs gunicorn? When would you use gunicorn+uvicorn workers in production?"
      },
      {
        day:60, lang:"PYTHON", title:"SQLite Advanced — Caching, FTS5, WAL & Performance",
        obj:"Master production SQLite patterns for security tools: WAL mode, FTS5 full-text search, parameterised queries, connection pooling.",
        tech:`SQLite WAL (Write-Ahead Log): writes go to WAL file, checkpoint to main DB. Allows: concurrent reads+writes.
Default journal mode (DELETE): writer holds exclusive lock — blocks all readers during write.
WAL mode: readers never blocked by writers. Multiple concurrent readers. One writer at a time.
FTS5 (Full-Text Search v5): inverted index for full-text search. SQLite extension, usually included.
FTS5 query syntax: MATCH 'token1 token2' (AND), 'token1 OR token2', '"exact phrase"', 'pref*' (prefix).
Connection pool: multiple threads each need their own connection (SQLite connections not thread-safe).
check_same_thread=False: disable thread check — safe only if you use locking (threading.Lock).
ANALYZE: updates sqlite_stat tables → query planner uses statistics → better query plans.
VACUUM: defragments database, reclaims deleted space. WAL: also checkpoints WAL.`,
        commands:["PRAGMA journal_mode=WAL", "PRAGMA wal_checkpoint(TRUNCATE)", "CREATE VIRTUAL TABLE fts USING fts5(content)", "SELECT * FROM fts WHERE fts MATCH 'ransomware'", "EXPLAIN QUERY PLAN SELECT"],
        walkthrough:`security_db.py — Production SQLite for security tools:
1. DatabaseManager: connection pool (threading.local for thread-safe connections)
2. WAL mode + synchronous=NORMAL: safe + fast for security tools
3. IOC table: IP, domain, hash, seen_count, first_seen, last_seen, tags (JSON)
4. Events table: with FTS5 virtual table on message field
5. Alerts table: with indexes on severity, ts, rule
6. TTLCache: built on SQLite. expires column, automatic cleanup.
7. Migration system: schema versioning, safe upgrades`,
        scratch:`# security_db.py from scratch
import sqlite3, json, threading, time, hashlib
from pathlib import Path
from contextlib import contextmanager
from typing import Optional

class SecurityDatabase:
    def __init__(self, db_path: str):
        self._path = db_path
        self._local = threading.local()  # Thread-local connection
        self._init_schema()
    
    @property
    def conn(self) -> sqlite3.Connection:
        """Get thread-local connection (each thread gets its own)."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(
                self._path,
                detect_types=sqlite3.PARSE_DECLTYPES,
                check_same_thread=False  # We manage locking ourselves
            )
            self._local.conn.row_factory = sqlite3.Row  # dict-like access
            self._local.conn.execute("PRAGMA journal_mode=WAL")
            self._local.conn.execute("PRAGMA synchronous=NORMAL")
            self._local.conn.execute("PRAGMA foreign_keys=ON")
        return self._local.conn
    
    def _init_schema(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS iocs (
                id        INTEGER PRIMARY KEY,
                type      TEXT    NOT NULL,
                value     TEXT    NOT NULL UNIQUE,
                first_seen TEXT   DEFAULT (datetime('now')),
                last_seen  TEXT   DEFAULT (datetime('now')),
                hit_count  INTEGER DEFAULT 1,
                confidence INTEGER DEFAULT 50,
                tags      TEXT    DEFAULT '[]',  -- JSON array
                expires   REAL    -- NULL = never expires
            );
            CREATE INDEX IF NOT EXISTS idx_iocs_value ON iocs(value);
            CREATE INDEX IF NOT EXISTS idx_iocs_type_confidence ON iocs(type, confidence);
            
            CREATE TABLE IF NOT EXISTS events (
                id      INTEGER PRIMARY KEY,
                ts      TEXT    DEFAULT (datetime('now')),
                source  TEXT,
                level   TEXT,
                message TEXT,
                data    TEXT    -- JSON
            );
            CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
                message, source, content=events, content_rowid=id
            );
            CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
            
            CREATE TABLE IF NOT EXISTS alerts (
                id       INTEGER PRIMARY KEY,
                ts       TEXT DEFAULT (datetime('now')),
                severity TEXT,
                rule     TEXT,
                host     TEXT,
                detail   TEXT,
                status   TEXT DEFAULT 'new',
                data     TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_alerts_severity_ts ON alerts(severity, ts);
        """)
        self.conn.commit()`,
        debug:`import sqlite3

conn = sqlite3.connect('security.db')

# Security hole + bugs
user_input = "'; DROP TABLE iocs; --"
conn.execute(f"SELECT * FROM iocs WHERE value='{user_input}'")  # BUG 1: SQL injection

# Performance bug
conn.execute("CREATE TABLE alerts (ts TEXT, rule TEXT, severity TEXT, host TEXT)")
# BUG 2: no index on severity — full table scan for every query
results = conn.execute("SELECT * FROM alerts WHERE severity='CRITICAL'").fetchall()

# Thread safety bug
import threading
def worker():
    conn.execute("INSERT INTO alerts VALUES (?, ?, ?, ?)", (...))  # BUG 3: shared connection across threads
    # SQLite connections are NOT thread-safe by default

# BUG 4: no WAL mode — readers block during writes
# BUG 5: no connection.commit() — data lost on process crash`,
        analysis:`Performance test your security_db.py:
1. Insert 100,000 IOCs: time with/without transaction (expect 100x difference)
2. Query by value (with/without index): expect 1000x difference
3. FTS5 search 'ransomware' across 100k events: should be < 10ms
4. Concurrent read+write (5 reader threads + 1 writer): WAL should allow this without blocking
5. Size: 100k IOCs → how many MB? How does VACUUM change it?`,
        usecase:"Every production security tool needs persistence: IOC databases, alert stores, FIM baselines, scan results, threat intel cache. SQLite handles single-node security tools perfectly.",
        red:"SQLite files left in accessible locations expose all your intel. Attackers specifically look for .db files after gaining access. Common paths: /var/lib/security/, /opt/tools/, ~/.local/share/.",
        blue:"Protect SQLite databases: mode 600, root ownership, encrypted filesystem. Monitor file access: auditd watch on all .db files in security tool paths. Regular backups to separate location.",
        detect:"Unusual access to security tool databases: process reading /var/lib/security/iocs.db should only be security_toolkit. Any other process = possible exfiltration attempt.",
        mistakes:["Sharing connection across threads without locking", "No WAL mode → readers block writers", "f-string SQL injection (always parameterised queries)", "No indexes → full table scans on large tables", "VACUUM without ANALYZE → planner uses stale statistics"],
        perf:"Bulk insert: use executemany() inside single transaction. 10,000 rows: 50ms (transaction) vs 50,000ms (autocommit). WAL + synchronous=NORMAL: 3x faster than default with same durability.",
        logging:"Database operations: log query type, table, row count, duration_ms. Alert on: query > 1 second (missing index?), error rate spike, disk space warning.",
        secure:"Always parameterised queries. Encrypt sensitive fields in application layer (not SQLite encryption which is proprietary). SQLite encryption extensions: SQLCipher (open source).",
        lab:"security_db.py: implement all tables, indexes, FTS5. Benchmark: 100k IOC insert time, query by value time, FTS5 search time. Verify WAL allows concurrent access.",
        project:"unified_store.py: all security tool data in one SQLite DB. IOCs, events, alerts, FIM baseline, scan results. Migration system for schema changes. Backup script.",
        output:"100k IOC insert: < 2 seconds. Query by exact value: < 1ms. FTS5 search: < 10ms. Concurrent read+write: no blocking. 100k events: < 50MB on disk.",
        stretch:"Implement change data capture: SQLite triggers that log every INSERT/UPDATE/DELETE to a separate audit table. Enable audit trail for compliance requirements.",
        hw:"Study SQLite's query planner: run EXPLAIN QUERY PLAN on 5 different queries. Understand: SCAN vs SEARCH, how indexes are selected, when indexes help and when they don't.",
        research:"When should you graduate from SQLite to PostgreSQL for a security tool? What are the exact limits? How does TimescaleDB (PostgreSQL extension) compare to SQLite for time-series security event storage?"
      },
    ]
  },
  {
    id:"w10", week:10, color:C.blue,
    title:"Enterprise Deployment — Docker, systemd, CI/CD",
    theme:"A tool that only runs on your machine is not a tool — it's a prototype. Production means: reproducible, monitored, automated.",
    challenge:"Complete deployment pipeline: code change → GitHub Actions → build Docker image → push to registry → deploy → health check. Zero manual steps.",
    projects:["Docker multi-stage build","GitHub Actions CI/CD","systemd + monitoring stack"],
    days:[
      {
        day:64, lang:"ALL", title:"Docker Multi-Stage Builds for Security Tools",
        obj:"Package security toolkit as production Docker images. Multi-stage builds for minimal attack surface. Security hardening.",
        tech:`Docker multi-stage build: multiple FROM statements, COPY --from=stage_name to copy artefacts.
Builder stage: has build tools (gcc, git, pip) — fat image for compilation.
Runtime stage: only runtime dependencies — minimal attack surface.
Alpine Linux: musl libc, busybox. 5MB base image vs Ubuntu 75MB. Fewer packages = smaller attack surface.
Distroless images: Google's minimal images (no shell, no package manager). Hardest to exploit.
Non-root user: USER nobody:nobody in Dockerfile. Prevents: container escape → root on host.
Read-only filesystem: --read-only flag. Forces explicit volume mounts. Prevents malware persistence.
.dockerignore: exclude from build context: .git/, tests/, *.pyc, secrets.
HEALTHCHECK: Docker polls this command. Container marked 'unhealthy' if it fails.
Docker secrets: mounted as files in /run/secrets/. Not visible in docker inspect or history.`,
        commands:["docker build --target production -t security-toolkit:1.0 .", "docker run --read-only --user 1000:1000 --cap-drop=ALL", "docker scan security-toolkit:1.0 (Snyk)", "dive security-toolkit:1.0 (layer analysis)", "trivy image security-toolkit:1.0"],
        walkthrough:`Dockerfile — Production multi-stage build:
# Stage 1: builder
FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: production
FROM python:3.11-slim AS production
# Non-root user
RUN groupadd -r sct && useradd -r -g sct sct
# Copy only installed packages
COPY --from=builder /root/.local /home/sct/.local
# Copy application code
COPY --chown=sct:sct src/ /app/src/
COPY --chown=sct:sct config/ /app/config/
WORKDIR /app
USER sct
HEALTHCHECK --interval=30s --timeout=5s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
ENTRYPOINT ["python3", "-m", "security_toolkit"]`,
        scratch:`# docker-compose.yml for complete stack
version: '3.8'
services:
  # Security Toolkit API
  api:
    build: {target: production}
    image: security-toolkit:latest
    restart: unless-stopped
    read_only: true
    user: "1000:1000"
    cap_drop: [ALL]
    environment:
      - STK_LOG_LEVEL=INFO
    secrets: [vt_api_key, slack_webhook]
    volumes:
      - sct_data:/app/data:rw
      - /var/log/security:/var/log/security:rw
    ports: ["8000:8000"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s; timeout: 5s; retries: 3
    depends_on: [elasticsearch]
  
  # ELK Stack
  elasticsearch:
    image: elasticsearch:8.12.0
    environment: [discovery.type=single-node, xpack.security.enabled=false]
    volumes: [es_data:/usr/share/elasticsearch/data]
  
  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]
  
  grafana:
    image: grafana/grafana:latest
    environment: [GF_SECURITY_ADMIN_PASSWORD__FILE=/run/secrets/grafana_pwd]
    secrets: [grafana_pwd]

secrets:
  vt_api_key:   {file: ./secrets/vt_api_key.txt}
  slack_webhook: {file: ./secrets/slack_webhook.txt}
  grafana_pwd:  {file: ./secrets/grafana_pwd.txt}
volumes:
  sct_data:; es_data:`,
        debug:`# Insecure Dockerfile with 8 issues
FROM ubuntu:latest             # BUG 1: 'latest' tag not pinned — build non-reproducible

RUN apt-get update && apt-get install -y python3 nmap curl wget
COPY . /app                    # BUG 2: copies everything including .env, .git, tests
WORKDIR /app

RUN pip3 install -r requirements.txt
# BUG 3: no --no-cache-dir → cache stored in image layer (bloat)
# BUG 4: no separate builder stage → build tools in production image

ENV VT_API_KEY=sk-actual-key-here  # BUG 5: secret in ENV → visible in docker inspect/history

RUN chmod 777 /app             # BUG 6: world-writable application directory
# BUG 7: no USER instruction → runs as root
# BUG 8: no HEALTHCHECK → Docker can't detect unhealthy container`,
        analysis:"Run security scan on your Docker image: trivy image security-toolkit:latest. Count: critical/high CVEs. Identify: which packages cause them. Upgrade or replace.",
        usecase:"Docker enables: consistent deployment across environments, easy scaling, isolation from host OS, reproducible builds. Essential for enterprise security tool distribution.",
        red:"Docker escape vulnerabilities exist (privileged containers, mounted docker.sock, etc). Understanding Docker security helps defend containerised environments.",
        blue:"Container security monitoring: Docker events API (docker events), container health status, resource usage anomalies (unexpected CPU/network = compromise or bug).",
        detect:"Monitor Docker daemon: container start/stop events, new image pulls, volume mounts, network creation. Alert on: privileged container creation, host network mode, docker.sock mount.",
        mistakes:["Running as root in container", "Using :latest tag (not reproducible)", "Secrets in ENV variables or image layers", "No HEALTHCHECK", "Copying .git and .env into image", "No read-only filesystem"],
        perf:"Multi-stage build: reduces image size 3-5x. Smaller image = faster pull = faster deployment. Layer caching: put infrequently-changing layers (apt install) before frequently-changing (COPY src/).",
        logging:"Container logs: stdout/stderr captured by Docker. Use: docker logs --follow container. Ship to ELK via: logging driver: gelf or filebeat sidecar. Never log to files inside container (ephemeral).",
        secure:"Scan images in CI with trivy before pushing. Never push images with: critical CVEs, secrets in history, running as root. Verify: image digests, not tags (tags can be overwritten).",
        lab:"Package security-toolkit as Docker image. Multi-stage build. Non-root user. Read-only filesystem. HEALTHCHECK. Scan with trivy. Start with docker-compose. Verify API accessible.",
        project:"docker-compose.yml: complete stack — API, ELK, Prometheus, Grafana. All with proper secrets management, non-root users, health checks, restart policies.",
        output:"Docker image < 200MB. Trivy scan: 0 critical CVEs. All services start with docker-compose up -d. Health checks passing. Grafana dashboard shows metrics.",
        stretch:"Implement multi-architecture builds (amd64 + arm64) using docker buildx. Test: arm64 build runs correctly on Raspberry Pi or M-series Mac.",
        hw:"Study Docker's Linux implementation: namespaces (PID, network, mount, UTS, IPC), cgroups (CPU, memory limits), seccomp profiles (syscall filtering). How do these provide isolation?",
        research:"Compare: Docker vs Podman vs containerd for security tool deployment. What is rootless containers? How does Podman's daemonless architecture improve security vs Docker daemon?"
      },
      {
        day:65, lang:"ALL", title:"GitHub Actions CI/CD for Detection Engineering",
        obj:"Build complete CI/CD pipeline: code → test → lint → security scan → Docker build → deploy → validate.",
        tech:`GitHub Actions: YAML-defined workflows triggered by events (push, PR, schedule, webhook).
Workflow: .github/workflows/*.yml. Jobs run in parallel by default. Steps run sequentially.
Runner: GitHub-hosted (ubuntu-latest = Ubuntu 22.04) or self-hosted.
Actions: reusable workflow steps. actions/checkout, actions/setup-python, docker/build-push-action.
Secrets: GitHub repository secrets → available as ${{ secrets.SECRET_NAME }} in workflows.
OIDC (OpenID Connect): GitHub Actions can authenticate to AWS/GCP/Azure without static secrets.
Matrix builds: test across multiple Python versions, OS, configurations in parallel.
Environments: production, staging — with required reviewers and deployment rules.
GitHub Container Registry (ghcr.io): built-in Docker registry. Images tagged with commit SHA.`,
        commands:["gh workflow run deploy.yml", "gh run list --workflow=deploy.yml", "act -j test (run locally with act)", "docker pull ghcr.io/username/security-toolkit:sha-abc123"],
        walkthrough:`.github/workflows/security-toolkit.yml — Complete CI/CD:
name: Security Toolkit CI/CD

on:
  push:    {branches: [main, develop]}
  pull_request: {branches: [main]}

jobs:
  # Job 1: Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - run: pip install -e ".[dev]"
      - run: ruff check src/                    # Fast linter
      - run: mypy src/ --strict                 # Type checking
      - run: bandit -r src/ -ll                 # Security lint
      - run: safety check                       # Dependency CVEs

  # Job 2: Tests
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix: {python-version: ['3.11', '3.12']}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '${{ matrix.python-version }}'}
      - run: pip install -e ".[dev]"
      - run: pytest tests/ --cov=src --cov-report=xml
      - uses: codecov/codecov-action@v4

  # Job 3: SIGMA Rules
  sigma:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install pySigma
      - run: sigma check rules/**/*.yml          # Validate all rules
      - run: sigma convert -t elasticsearch-eql rules/ > /tmp/rules.json
      - run: python3 tests/test_sigma_fp.py      # FP testing

  # Job 4: Docker Build
  docker:
    needs: [quality, test]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: {registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }}}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
      - uses: aquasecurity/trivy-action@master  # Scan built image
        with: {image-ref: 'ghcr.io/${{ github.repository }}:${{ github.sha }}', exit-code: '1', severity: 'CRITICAL'}

  # Job 5: Deploy (main branch only)
  deploy:
    needs: docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - run: |
          # Deploy to production server via SSH
          ssh deploy@prod "docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}"
          ssh deploy@prod "docker-compose up -d --no-deps api"`,
        scratch:`# Create complete CI/CD for your security toolkit:
# .github/workflows/
#   ci.yml          (quality + test + sigma on every push)
#   cd.yml          (docker build + deploy on main merge)
#   weekly-scan.yml (scheduled dependency + CVE scan)
#   sigma-deploy.yml (auto-deploy SIGMA rules to ELK on rules/ change)

# Key workflow file structure:
# 1. Trigger: push, PR, schedule
# 2. Permission: minimal (contents:read, packages:write only what needed)
# 3. Jobs: parallel where possible, serial where dependent
# 4. Cache: pip cache, Docker layer cache (buildx cache)
# 5. Secrets: never echo, always mask in logs`,
        debug:`# Broken GitHub Actions workflow
name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pip install pytest           # BUG 1: no checkout or setup-python first
      - run: pytest tests/                # BUG 2: no source code available (no checkout)
      
  deploy:
    runs-on: ubuntu-latest               # BUG 3: deploy runs in parallel with test (not after)
    steps:
      - run: echo ${{ secrets.SSH_KEY }} > key.pem  # BUG 4: secret echoed to logs
      - run: scp -i key.pem app.py server:/app/   # BUG 5: key.pem not secured (mode 644)`,
        analysis:"Audit your GitHub Actions workflows: are all secrets properly masked? Are Docker images scanned before deployment? Is deployment blocked if tests fail? Does any step run arbitrary user input?",
        usecase:"Detection-as-code: SIGMA rule committed → CI validates syntax → FP test runs → converts to ELK query → auto-deploys → analyst receives Slack confirmation. Zero manual steps.",
        red:"CI/CD pipeline attacks: inject malicious code via PR → CI executes it with deployment permissions. Supply chain: compromise a GitHub Action dependency. Actions pinned to SHA not tag.",
        blue:"Secure CI/CD: pin all Actions to specific commit SHA (not tag). Use GitHub OIDC for cloud auth (no static secrets). Review all third-party Actions. Monitor: unusual workflow runs, secret access.",
        detect:"GitHub audit log: track all workflow runs, secret access, permission changes. Alert on: new workflow file created, existing workflow modified, unusual workflow run duration.",
        mistakes:["Actions not pinned to SHA (actions/checkout@v4 vs @sha)", "GITHUB_TOKEN permissions too broad", "Secrets echoed in debug steps", "Deploy job not waiting for tests to pass", "No image scan before deployment"],
        perf:"Cache pip packages: actions/cache. Cache Docker layers: docker/build-push-action cache-from/cache-to. Expected: first run 5min, cached run 1min for typical security toolkit.",
        logging:"Workflow logs: GitHub stores 30 days. For audit: use workflow_run webhook to ship logs to your SIEM. Log: workflow name, trigger, duration, outcome, committer.",
        secure:"Minimum permissions: permissions: { contents: read } at top level, expand only for specific jobs. Never: write permissions on all repos. Review: what can GITHUB_TOKEN do?",
        lab:"Set up full CI/CD for your security-toolkit repository. Verify: push to main triggers all jobs, PR blocks merge if tests fail, Docker image pushed to ghcr.io, SIGMA rules deployed to ELK.",
        project:"Complete .github/workflows/: ci.yml (every push), cd.yml (main deploy), weekly-scan.yml (scheduled security scan), sigma-deploy.yml (SIGMA auto-deploy).",
        output:"Green CI on main branch. PR blocked if tests fail. Docker image in ghcr.io with SHA tag. SIGMA rules deployed to ELK automatically on rules/ change.",
        stretch:"Set up branch protection rules: require CI passing, require 1 reviewer approval, require signed commits. Test: attempt to bypass protection — verify it's blocked.",
        hw:"Study GitHub Actions security hardening guide (docs.github.com). Specifically: script injection via user inputs, using environments for deployment gates, OIDC for cloud authentication.",
        research:"Compare GitHub Actions to: GitLab CI, Jenkins, Drone CI, ArgoCD for security tooling deployment. What does GitOps mean? How does Flux or ArgoCD implement continuous deployment differently?"
      },
      {
        day:66, lang:"PYTHON", title:"Automated CIS Benchmark Compliance Checking",
        obj:"Build CIS Level 1 automated checker. 50 controls tested programmatically. Evidence collected. Remediation scripts generated.",
        tech:`CIS Benchmarks: Center for Internet Security hardening guidelines. Level 1 = basic, practical controls.
Control structure: each control has: ID, title, description, rationale, audit procedure, remediation.
Audit procedure: shell commands that return pass/fail based on system configuration.
Evidence collection: capture exact command output + timestamp for compliance evidence.
Remediation: shell commands to fix failing controls (test in lab before production!).
Control categories: filesystem, network, logging, authentication, process isolation, services.
SCAP (Security Content Automation Protocol): XML-based standard for expressing CIS controls.
OpenSCAP: open-source SCAP scanner. Can audit CIS benchmarks automatically.`,
        commands:["oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis_level1_server", "auditctl -l (list audit rules)", "sshd -T (test SSH config)", "systemctl is-enabled service"],
        walkthrough:`cis_checker.py — CIS Ubuntu 24.04 L1 compliance:
Check structure:
  {
    'id': '1.1.1.1',
    'title': 'Ensure cramfs filesystem is disabled',
    'category': 'filesystem',
    'level': 1,
    'check': lambda: _check_module_disabled('cramfs'),
    'remediate': 'echo "install cramfs /bin/true" >> /etc/modprobe.d/cramfs.conf',
    'evidence': lambda: run('modprobe -n -v cramfs'),
  }

50 controls across categories:
  - Filesystem (1.x): cramfs, freevxfs, jffs2, hfs, hfsplus, squashfs, udf, vfat
  - Services (2.x): disable unnecessary services (cups, avahi, rpcbind, nfs)
  - Network (3.x): disable IP forwarding, ICMP redirects, source routing
  - Logging (4.x): auditd enabled, log file permissions, systemd journal
  - Authentication (5.x): password complexity, sudo timeout, SSH hardening
  - File permissions (6.x): /etc/passwd, /etc/shadow, /etc/group permissions`,
        scratch:`# cis_checker.py — 50 automated CIS controls
import subprocess, os, re, json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

@dataclass
class CISControl:
    id:         str
    title:      str
    category:   str
    level:      int
    check:      Callable[[], bool]
    remediate:  str
    evidence:   Callable[[], str]
    result:     Optional[bool] = None
    evidence_output: str = ""
    
    def run(self) -> bool:
        try:
            self.evidence_output = self.evidence()
            self.result = self.check()
        except Exception as e:
            self.result = False
            self.evidence_output = f"ERROR: {e}"
        return self.result

def _run_cmd(cmd: str) -> tuple[str, int]:
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
    return r.stdout + r.stderr, r.returncode

def _file_contains(path: str, pattern: str) -> bool:
    try:
        content = Path(path).read_text()
        return bool(re.search(pattern, content))
    except FileNotFoundError:
        return False

# Example controls:
CONTROLS = [
    CISControl(
        id='1.1.1.1', title='cramfs disabled', category='filesystem', level=1,
        check=lambda: _run_cmd('modprobe -n -v cramfs')[0].strip() == 'install /bin/true',
        remediate='echo "install cramfs /bin/true" >> /etc/modprobe.d/cramfs.conf',
        evidence=lambda: _run_cmd('modprobe -n -v cramfs')[0],
    ),
    CISControl(
        id='5.2.4', title='SSH root login disabled', category='ssh', level=1,
        check=lambda: _file_contains('/etc/ssh/sshd_config', r'^PermitRootLogin\\s+no'),
        remediate='sed -i "s/^#*PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config && systemctl reload sshd',
        evidence=lambda: _run_cmd('sshd -T | grep permitrootlogin')[0],
    ),
    CISControl(
        id='5.2.6', title='SSH PermitEmptyPasswords disabled', category='ssh', level=1,
        check=lambda: _file_contains('/etc/ssh/sshd_config', r'^PermitEmptyPasswords\\s+no'),
        remediate='sed -i "s/^#*PermitEmptyPasswords.*/PermitEmptyPasswords no/" /etc/ssh/sshd_config',
        evidence=lambda: _run_cmd('sshd -T | grep permitemptypasswords')[0],
    ),
    # ... 47 more controls
]`,
        debug:`# Broken CIS checker — 5 bugs
import subprocess

def check_ssh_config():
    result = subprocess.run('cat /etc/ssh/sshd_config',
                           shell=True, capture_output=True)  # BUG 1: no text=True — result.stdout is bytes
    if 'PermitRootLogin no' in result.stdout:   # BUG 2: bytes vs str comparison
        return True
    return False  # BUG 3: also matches commented line '# PermitRootLogin no'

def run_all_checks():
    controls = [check_ssh_config, check_firewall]  # BUG 4: no result collection
    for check in controls:
        check()  # BUG 5: no evidence collected, no report generated`,
        analysis:"Run cis_checker.py on your Ubuntu system. For each failing control: understand WHY it fails. Is it a legitimate finding or a false positive? For 5 failing controls: implement the remediation.",
        usecase:"Compliance automation: PCI-DSS requires CIS L1 for cardholder data systems. HIPAA: similar for healthcare. NIST: maps CIS controls to SP 800-53. Automate assessment → compliance reports → audit evidence.",
        red:"CIS hardening makes exploitation harder: no unnecessary services to exploit, SSH hardened, filesystem properly mounted. Red team finds: controls implemented but not verified (checkbox compliance).",
        blue:"Run CIS checker monthly on all systems. Alert on: new failing controls (regression), score drop. Track trend: compliance score should increase over time. Never deploy untested systems.",
        detect:"CIS checker itself modifies audit rules (auditd) and reads sensitive config files. Alert if: CIS checker runs at unexpected time (adversary assessing your hardening before exploit).",
        mistakes:["Checking for commented-out config lines (grep matches # PermitRootLogin no)", "Assuming control passes if file exists (content matters)", "Running remediation without testing in lab first", "Checking old control IDs (CIS benchmarks version matters)"],
        perf:"50 controls: ~2 seconds (mostly subprocess calls). For 100 hosts: parallel via SSH (asyncio + asyncssh or paramiko). Evidence collection is the bottleneck — minimize subprocess calls.",
        logging:"Each control: {id, title, result, evidence, timestamp}. Full run: {host, cis_version, timestamp, score, passing, failing}. Store historically: track compliance trend.",
        secure:"Remediation scripts: test in lab VM before production. Some remediations break functionality (disabling services, changing configs). Always have rollback plan. Never auto-remediate in production.",
        lab:"Run cis_checker.py on your Ubuntu target VM. Score it. Fix 10 failing controls. Re-run. Verify score improved. Document: which controls you chose NOT to implement and why.",
        project:"cis_platform.py: CIS checker + HTML report with evidence + remediation scripts + trend tracking + multi-host via SSH. Weekly scheduled run via systemd timer.",
        output:"50 controls tested. HTML report with pass/fail/evidence. Score: X/50. Remediation scripts generated for failing controls.",
        stretch:"Map your CIS controls to MITRE ATT&CK: which ATT&CK techniques does each control mitigate? Generate ATT&CK Navigator layer showing which techniques your hardening addresses.",
        hw:"Read CIS Ubuntu 24.04 benchmark (free from cisecurity.org). For 10 controls you find interesting: understand the rationale, what attack does it prevent, and write the check from scratch.",
        research:"What is DISA STIG? How does it compare to CIS benchmarks? For the same control (e.g., SSH root login), how do CIS and DISA STIG differ in their requirements and rationale?"
      },
    ]
  },
  {
    id:"w11", week:11, color:C.cyan,
    title:"CAPSTONE Week 1 — SENTRY Collection + Normalisation",
    theme:"Production code: tested, documented, monitored, deployable. Every component independently deployable.",
    challenge:"Collection agents running on 3 hosts (Ubuntu × 2, Windows × 1). Unified ECS JSONL stream. End-to-end latency < 500ms. Zero event loss on agent restart.",
    projects:["syslog_agent.sh (Linux)","windows_agent.ps1","normaliser.py ECS pipeline","Docker Compose skeleton"],
    days:[
      {
        day:71, lang:"BASH", title:"Linux Collection Agent — Production syslog_agent.sh",
        obj:"Build production Linux log collection agent. Handles: log rotation, multiple sources, filtering, ECS output. Deploys as systemd service.",
        tech:`Log collection challenges: log rotation (tail -F handles this), large files (streaming required), binary logs (journald), structured logs (already JSON), rate limiting (don't flood collector).
rsyslog: high-performance syslog daemon. Modules: imfile (file input), omelasticsearch (output).
systemd journal: binary format. journalctl --output=json streams as JSONL.
auditd logs: /var/log/audit/audit.log. Binary format unless using audisp.
Log tagging: add metadata (hostname, agent_version, source) to every event for SIEM correlation.
Checkpoint: track file position for crash recovery. On restart: resume from last position.
Buffering: local buffer for when collector is unavailable. Forward on recovery.`,
        commands:["journalctl --output=json --follow", "tail -F /var/log/auth.log", "auditctl -l", "rsyslogd -N1 (config test)", "systemd-cat (write to journal)"],
        walkthrough:`syslog_agent.sh — Production Linux collection agent:
Architecture:
  Parallel collection coroutines (bash jobs):
    auth_reader():     tail -F /var/log/auth.log → parse → normalise → queue
    syslog_reader():   tail -F /var/log/syslog → filter → normalise → queue
    journal_reader():  journalctl --follow --output=json → parse → queue
    audit_reader():    tail -F /var/log/audit/audit.log → parse → queue
  
  Queue writer (single writer):
    Reads from named pipe
    Batches events (100 at a time, max 5s wait)
    Sends to collector via HTTP POST or writes to output file
    On failure: buffer locally, retry with backoff
  
  Health reporter:
    Every 60s: POST to collector {events_sent, errors, lag, agent_version}`,
        scratch:`#!/usr/bin/env bash
# syslog_agent.sh — Production Linux log collection agent
set -euo pipefail

readonly AGENT_VERSION="1.0.0"
readonly COLLECTOR_URL="${SENTRY_COLLECTOR:-http://localhost:9000/events}"
readonly BUFFER_DIR="${SENTRY_BUFFER:-/var/lib/sentry/buffer}"
readonly LOG_SOURCES=("/var/log/auth.log" "/var/log/syslog")
readonly FIFO=$(mktemp -u /tmp/sentry_XXXXXX)

mkdir -p "$BUFFER_DIR"
mkfifo "$FIFO"
trap 'rm -f "$FIFO"' EXIT

normalise_auth() {
    local line="$1"
    local ts host proc pid msg
    # Parse: Jan 15 22:01:43 hostname sshd[1234]: message
    if [[ "$line" =~ ^([A-Za-z]+ +[0-9]+ [0-9:]+) ([^ ]+) ([^\\[]+)\\[([0-9]+)\\]: (.+)$ ]]; then
        ts="${BASH_REMATCH[1]}"
        host="${BASH_REMATCH[2]}"
        proc="${BASH_REMATCH[3]}"
        pid="${BASH_REMATCH[4]}"
        msg="${BASH_REMATCH[5]}"
        printf '{"@timestamp":"%s","host.name":"%s","process.name":"%s","process.pid":%s,"message":%s,"event.dataset":"auth","agent.version":"%s"}\\n' \\
            "$(date -d "$ts $(date +%Y)" -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)" \\
            "$host" "$proc" "$pid" "$(echo "$msg" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')" \\
            "$AGENT_VERSION"
    fi
}

# Tail auth.log, normalise each line, write to FIFO
tail_source() {
    local source="$1" normaliser="$2"
    tail -F "$source" 2>/dev/null | while IFS= read -r line; do
        "$normaliser" "$line" > "$FIFO"
    done
}

# Start all collectors in background
tail_source /var/log/auth.log normalise_auth &

# FIFO reader: batch and send to collector
while IFS= read -r event; do
    # Batch: collect up to 100 events or 5s, then POST
    echo "$event"
done < "$FIFO" | python3 -c "
import sys, json, urllib.request, time
batch = []; last_send = time.monotonic()
for line in sys.stdin:
    batch.append(line.strip())
    if len(batch) >= 100 or (time.monotonic() - last_send) > 5:
        data = '\\n'.join(batch).encode()
        try:
            urllib.request.urlopen('${COLLECTOR_URL}', data=data, timeout=5)
        except Exception as e:
            open('${BUFFER_DIR}/buffer_\$(date +%s).jsonl','a').write('\\n'.join(batch)+'\\n')
        batch = []; last_send = time.monotonic()
"`,
        debug:`#!/bin/bash
# Broken agent — 6 bugs
LOGFILE=/var/log/auth.log

tail -f $LOGFILE | while read line; do          # BUG 1: -f not -F (stops at log rotation)
    ts=$(echo $line | awk '{print $1,$2,$3}')   # BUG 2: unquoted — word splits
    host=$(echo $line | awk '{print $4}')
    msg=$(echo $line | awk '{print $6-}')       # BUG 3: wrong awk syntax for rest of line
    
    json="{ts: $ts, host: $host, msg: $msg}"    # BUG 4: not valid JSON (no quotes on keys/values)
    
    curl -X POST http://collector/events \\
         -d $json                               # BUG 5: unquoted $json — word splits on spaces
done`,
        analysis:"Deploy syslog_agent.sh on your Ubuntu VM. Simulate log rotation (logrotate /etc/logrotate.d/syslog). Verify agent continues collecting after rotation. Measure: events collected vs events in log file.",
        usecase:"Every SIEM needs a collection agent. Understanding agent design helps when: agents fail (debugging), agents are compromised (forensics), deploying at scale (performance tuning).",
        red:"Log agents are high-value targets: compromise agent → control what logs reach SIEM → go blind. Privilege: agents often need elevated access (read /var/log/auth.log). Attack: poison FIFO, modify agent binary.",
        blue:"Agent hardening: signed binary, read-only deployment (immutable container), agent health monitoring (heartbeat), agent-to-collector mutual TLS, alert if agent stops sending.",
        detect:"Collector-side: alert when agent stops sending heartbeat (agent killed or crashed). Alert when event rate drops 80% below baseline (agent filtering too aggressively or attack in progress).",
        mistakes:["tail -f stops at log rotation (use tail -F)", "Not tracking file position (events lost on restart)", "FIFO without reader → writer blocks", "Not handling auth.log permission errors (need adm group)"],
        perf:"tail -F: kernel-efficient (inotify-based on Linux). 10,000 events/min typical auth.log: < 1% CPU. Batching 100 events per HTTP POST: 99% fewer HTTP requests vs one per event.",
        logging:"Agent operational log (separate from collected events): events_sent, events_dropped, errors, file_position, rotation_count, uptime. Ship to collector as separate stream.",
        secure:"Agent process: adm group (read /var/log/), no write access except buffer dir. Buffer dir: 700, owned by agent user. Collector URL: TLS, agent certificate auth.",
        lab:"Deploy syslog_agent.sh on Ubuntu VM. Generate 100 auth events (SSH login attempts). Verify all 100 appear in collector. Simulate agent crash+restart. Verify no events lost (checkpoint).",
        project:"syslog_agent.sh: production agent. Sources: auth.log, syslog, audit.log, journal. Checkpoint for crash recovery. Buffer for offline collector. Health heartbeat. systemd service.",
        output:"Agent collecting from 4 sources. Checkpoint surviving restart (no duplicate/lost events). Buffer working when collector unavailable. Health heartbeat every 60s.",
        stretch:"Add push-based collection using auditd's audisp plugin: events pushed to agent immediately on creation rather than polling log file. Lower latency, fewer file reads.",
        hw:"Study the rsyslog configuration language: input modules (imfile, imjournal), filter rules, output modules (omelasticsearch, omfile). Write rsyslog config that replaces your bash agent.",
        research:"Compare: custom bash agent vs Elastic Beats (Filebeat) vs Vector vs Fluent Bit for Linux log collection. Performance benchmarks: throughput, CPU, memory. When would you write a custom agent?"
      },
      {
        day:77, lang:"ALL", title:"SENTRY v0.1 — Complete Collection Layer",
        obj:"All 3 collection agents running. Unified normalised JSONL stream. End-to-end verified. Unit tests for normaliser.",
        tech:"Integration: 3 agents (Linux bash × 2, Windows PS × 1) → HTTP POST to central Python collector → normaliser.py → asyncio.Queue → ELK. Health dashboard shows all agents.",
        commands:["docker-compose up -d", "curl localhost:9000/health", "pytest tests/normaliser/ -v", "python3 -m pytest tests/ --cov=src"],
        walkthrough:`SENTRY v0.1 architecture integration test:
1. Start collector: python3 -m sentry.collector (HTTP server accepting agent POSTs)
2. Start normaliser: python3 -m sentry.normaliser (reads from collector queue, writes to ELK)
3. Start Linux agents: systemctl start sentry-agent on both Linux VMs
4. Start Windows agent: Start-Service SentryAgent on Windows VM
5. Verify Kibana: events from all 3 sources visible, correctly normalised
6. Failure mode test: stop one agent, verify others continue, verify heartbeat alert fires`,
        scratch:"Write end-to-end integration test: simulate agent event → verify appears in ELK with correct ECS fields → verify FIM detects the test → verify alert generated. Full pipeline in 1 test.",
        debug:"End-to-end: introduce 3 bugs (timestamp parsing, missing ECS field, collector authentication). Verify CI catches all 3. Fix. Verify CI green.",
        analysis:"Measure SENTRY v0.1 performance: max throughput (events/sec), end-to-end latency (agent log write → ELK indexed), memory usage per component, disk usage rate (events/day).",
        usecase:"Collection layer is the foundation. Every detection, every hunt, every forensic investigation depends on complete, accurate, timely log collection. Getting this right is the most important thing.",
        red:"Collection layer attack surface: agent binaries (replace with malicious agent), collector (DoS or inject false events), ELK (compromise or destroy). Any of these = blinding the SOC.",
        blue:"Collection reliability: N+1 redundancy (if one collector fails, agents failover to secondary). Agent self-monitoring: if agent misses its own heartbeat = alert. Data integrity: checksums on events.",
        detect:"Collection meta-monitoring: alert when events_per_minute from host X drops 80% below baseline. Alert when agent version doesn't match expected (outdated or compromised agent).",
        mistakes:["Not testing agent failure scenarios", "ELK not sized for event volume → disk fills", "No collector redundancy → single point of failure", "Missing events during collector restart"],
        perf:"Target: < 500ms end-to-end latency (event occurs → indexed in ELK). Measure: timestamp in event vs @timestamp in ELK. Bottlenecks: agent batch interval, normaliser throughput, ELK indexing speed.",
        logging:"Operational dashboard: events/minute per source (all should be stable), agent heartbeat status (all should be green), collector queue depth (should be near 0), normaliser errors (should be 0).",
        secure:"Complete security review: agent binary hashes verified? Collector TLS enabled? ELK auth enabled? Buffer dirs secure? Agent running as minimum required user?",
        lab:"Full SENTRY v0.1 deployment: all 3 agents + collector + normaliser + ELK. Run 30 minutes. Check Kibana: events from all sources, correct fields, no gaps. Verify health dashboard.",
        project:"SENTRY v0.1 GitHub release: tag, docker-compose, agent install scripts, README with architecture diagram, CI badge.",
        output:"3 agents running. Events flowing to ELK from all sources. < 500ms latency verified. All 30 unit tests passing. Docker Compose one-liner deployment.",
        stretch:"Add event deduplication: if same event appears from multiple sources (possible with syslog forwarding), deduplicate before indexing using event hash.",
        hw:"Draw the complete SENTRY v0.1 data flow diagram: every component, every data flow, every storage location. Include: failure modes and recovery for each component.",
        research:"How do commercial SIEM vendors (Splunk, Elastic, Microsoft Sentinel) handle collection at scale (100,000+ events/second)? What architectural patterns do they use that differ from your design?"
      },
    ]
  },
  {
    id:"w12", week:12, color:C.amber,
    title:"CAPSTONE Week 2 — Detection Engine + REST API + Dashboard",
    theme:"Detection engine integrated. Every event evaluated by SIGMA + YARA + anomaly in < 100ms.",
    challenge:"Run 10 attack simulations. All 10 detected within 30 seconds. Zero false positives in 24-hour baseline run. REST API serving all alerts.",
    projects:["SENTRY detection engine","FastAPI REST API v1","Real-time WebSocket dashboard"],
    days:[
      {
        day:84, lang:"PYTHON", title:"SENTRY Detection Engine — Integration",
        obj:"Integrate SIGMA runner + YARA scanner + statistical anomaly + ML classifier into unified detection engine. Async pipeline.",
        tech:`Detection engine async architecture:
asyncio.Queue(maxsize=1000): events flow through detection pipeline
Each detector runs as separate asyncio.Task, reads from shared queue
asyncio.gather: all detectors run concurrently on same event
SIGMA runner: pySigma query against event dict (no SIEM needed — in-memory evaluation)
YARA scanner: scan file paths extracted from events, not event content
ML classifier: scikit-learn IsolationForest for unsupervised anomaly detection
Alert deduplication: same rule + same host within 5min window → suppress (keep first)
Risk aggregator: if multiple rules fire on same event → combined risk score`,
        commands:["from sigma.processing.pipeline import ProcessingPipeline", "import yara; rules = yara.compile(filepaths={'main': 'rules/all.yar'})", "from sklearn.ensemble import IsolationForest"],
        walkthrough:`detection_engine.py — Async detection integration:
async def detection_pipeline(event_queue, alert_queue):
    # Load detectors once at startup
    sigma_runner    = SIGMARunner(rules_dir='rules/sigma/')
    yara_scanner    = YARAScanner(rules_dir='rules/yara/')
    anomaly_engine  = StatisticalAnomalyDetector(baseline_days=7)
    ml_classifier   = MLClassifier(model_path='models/isolation_forest.pkl')
    deduplicator    = AlertDeduplicator(window_seconds=300)
    
    while True:
        event = await event_queue.get()
        
        # All detectors run concurrently
        sigma_alerts, yara_alerts, anomaly_alerts, ml_score = await asyncio.gather(
            sigma_runner.evaluate(event),
            yara_scanner.scan_paths(event),
            anomaly_engine.score(event),
            ml_classifier.predict(event),
            return_exceptions=True
        )
        
        # Aggregate alerts
        all_alerts = []
        for alerts in [sigma_alerts, yara_alerts, anomaly_alerts]:
            if isinstance(alerts, list):
                all_alerts.extend(alerts)
        
        # Enrich with ML score, deduplicate, push to alert_queue
        for alert in all_alerts:
            alert['ml_anomaly_score'] = ml_score if not isinstance(ml_score, Exception) else None
            if not deduplicator.is_duplicate(alert):
                await alert_queue.put(alert)
        
        event_queue.task_done()`,
        scratch:`# detection_engine.py — integrate all detection components
# Connect to: SENTRY event stream from Week 11
# Output: alerts to: SQLite, Slack webhook, FastAPI alert endpoint

Key integration test:
  1. Simulate: 'vssadmin delete shadows' command execution on Windows VM
  2. Expect: Sysmon Event 1 → agent → collector → normaliser → ELK
  3. Expect: SIGMA rule 'Shadow Copy Deletion' fires → alert in < 30s
  4. Expect: alert appears in /v1/alerts API endpoint
  5. Expect: Slack notification sent

Write this as an automated test: runs the simulation, checks all 5 expectations.`,
        debug:"Integration bug: SIGMA rule evaluating process_creation events but Sysmon events have field 'process.executable' not 'Image'. Fix field mapping in normaliser. Verify rule fires after fix.",
        analysis:"Detection accuracy test: run all 10 ATT&CK technique simulations from your test suite. For each: which detector caught it (SIGMA? YARA? anomaly? ML?), how quickly, what was the alert quality?",
        usecase:"Production SOC: every event evaluated by all detectors in < 100ms. Novel attacks caught by anomaly/ML even without signature. Signature updates deploy without restart.",
        red:"Detection engine evasion: SIGMA rules are public — study them and evade them. Anomaly detection: stay within baseline (slow and low). ML: adversarial inputs that score as normal.",
        blue:"Detection depth: if SIGMA misses it, anomaly catches it. If anomaly misses it, ML might. Layered detection = higher assurance. Track: what % of true positives caught by each layer.",
        detect:"Detection engine self-monitoring: alert when: event queue backup (> 10,000 events), detection latency > 5 seconds, SIGMA compilation failure, YARA scan error rate > 1%.",
        mistakes:["SIGMA in-memory eval: field names must match normalised event fields exactly", "YARA scanning event content vs file paths (different use cases)", "ML model trained on attack data (needs clean baseline)", "Deduplication too aggressive (suppresses related alerts that need correlation)"],
        perf:"Target: < 100ms per event through all detectors. SIGMA: ~1ms (dict comparison). YARA: ~5ms per file scan. Anomaly: ~0.1ms (in-memory stat). ML: ~5ms (sklearn predict). Total: < 20ms.",
        logging:"Detection decisions: event_id, rule_id, detector_type, confidence, duration_ms. Essential for: detection quality metrics, debugging missed detections, compliance evidence.",
        secure:"Detection rules are sensitive: contain detection logic that reveals what you're monitoring. Store in signed, access-controlled location. Verify rule integrity on load.",
        lab:"Full detection pipeline: events → detectors → alerts. Run 5 attack simulations. Verify all detected. Measure: detection latency, false positive rate (24h clean baseline).",
        project:"SENTRY v0.2: detection engine integrated. REST API serving alerts. WebSocket pushing real-time alerts to dashboard. Prometheus metrics.",
        output:"All 10 attack simulations detected in < 30 seconds. 24-hour FP rate: < 5 alerts. REST API /v1/alerts returning correct results. Real-time dashboard updating.",
        stretch:"Add alert correlation: if 3+ alerts from same host in 5 minutes → create 'incident' grouping all related alerts. Incident view in dashboard showing full attack chain.",
        hw:"Design the alert correlation algorithm: how do you decide which alerts are related? Time window? Same host? Same user? Related ATT&CK techniques? Write pseudocode.",
        research:"How do commercial SIEMs (Splunk ES, Microsoft Sentinel) implement detection correlation? What is 'Notable Event' in Splunk? What is 'Incident' in Sentinel? How do they differ from individual alerts?"
      },
    ]
  },
  {
    id:"w13", week:13, color:C.green,
    title:"CAPSTONE Week 3 — IR Automation + Deploy + Docs + Release",
    theme:"A tool that exists only on your laptop is a prototype. SENTRY v1.0 is deployed, documented, monitored, and released.",
    challenge:"SENTRY v1.0 fully deployed from scratch in < 30 minutes using only the README. Demo video recorded. Blog post published.",
    projects:["4 IR playbooks automated","Docker production deploy","MkDocs site","Demo video","Technical blog post"],
    days:[
      {
        day:85, lang:"PYTHON", title:"IR Automation Playbooks",
        obj:"Automate 4 IR playbooks: ransomware, credential dump, webshell, lateral movement. Each triggered by alert, executes containment actions.",
        tech:`Playbook architecture: trigger (alert type) → decision tree → sequential actions.
Actions: isolate host (EDR API/iptables), reset credentials (AD API/passwd), collect evidence (forensics scripts), notify (Slack/email/PagerDuty).
Idempotent actions: can run multiple times safely (same result). Critical for retries.
State machine: playbook tracks state (new → triaging → contained → eradicating → recovered).
Rollback: if action fails, undo previous actions. Don't leave system in half-contained state.
Audit trail: every action logged with: timestamp, action name, target, result, analyst (if manual step).
Semi-automation: some actions require analyst approval before executing (high-risk steps).`,
        commands:["requests.post(edr_api, json={'action':'isolate','host':host})", "paramiko.SSHClient() for remote execution", "subprocess.run(['iptables','-I','INPUT','-s',ip,'-j','DROP'])"],
        walkthrough:`playbook_engine.py — IR playbook framework:
class PlaybookStep:
    name: str
    action: Callable
    requires_approval: bool = False
    rollback: Optional[Callable] = None
    timeout: int = 30

class Playbook:
    name: str
    trigger_rules: list[str]  # SIGMA rule IDs that trigger this
    steps: list[PlaybookStep]
    
    async def execute(self, alert: dict, dry_run=False) -> PlaybookResult:
        executed = []
        for step in self.steps:
            if step.requires_approval and not dry_run:
                await self.request_approval(step, alert)
            result = await step.action(alert, dry_run=dry_run)
            executed.append((step, result))
            if not result.success:
                await self.rollback(executed)
                break
        return PlaybookResult(alert, executed)

PLAYBOOKS = {
    'ransomware': Playbook(
        trigger_rules=['shadow_copy_deletion', 'mass_file_rename'],
        steps=[
            PlaybookStep('isolate_host',      isolate_via_iptables),
            PlaybookStep('capture_memory',    run_avml, requires_approval=True),
            PlaybookStep('collect_iocs',      extract_iocs_from_host),
            PlaybookStep('notify_ir_team',    send_pagerduty_alert),
            PlaybookStep('create_ticket',     create_jira_incident),
        ]
    ),
}`,
        scratch:`# IR playbook from scratch — implement ransomware playbook
# 1. Trigger: SIGMA rule 'Shadow Copy Deletion' fires
# 2. Action 1: network isolate host (iptables or EDR API)
# 3. Action 2: preserve evidence (memory dump via AVML, running processes, network state)
# 4. Action 3: extract IOCs from isolated host (file hashes, network connections)
# 5. Action 4: notify SOC team (Slack, PagerDuty)
# 6. Action 5: create incident ticket (Jira/ServiceNow)
# All actions: async, idempotent, with rollback
# Dry-run mode: show what WOULD happen without executing`,
        debug:"Playbook bug: isolation step succeeds but evidence collection fails because host is now isolated (can't SSH in). Fix: collect evidence BEFORE isolating, or use out-of-band management channel.",
        analysis:"Run each playbook in dry-run mode against a test alert. Verify: all steps shown in correct order, approval gates in right place, rollback logic correct. Then run live in lab.",
        usecase:"SOAR (Security Orchestration, Automation, Response): this IS a lightweight SOAR platform. Commercial SOAR: Splunk SOAR, Palo Alto XSOAR, ServiceNow SecOps. Your playbook engine has the same architecture.",
        red:"IR playbooks are attackers' roadmap: if they know your playbook, they know what you'll do. Red team value: test if your isolation actually blocks exfiltration, or if alternate path exists.",
        blue:"Playbook testing: simulate attack → trigger playbook → verify each action succeeded. Test quarterly. Update playbooks after each real incident (lessons learned).",
        detect:"Playbook execution should itself be logged: every action, every decision, every result. This IS your incident timeline. Audit requirement for compliance.",
        mistakes:["Not testing playbooks before incident", "Playbook isolates host before evidence collection (can't collect after)", "No rollback on partial failure", "No approval gate for destructive actions", "Playbook not idempotent (fails if run twice)"],
        perf:"Playbook execution time target: < 2 minutes for automated steps. Human approval steps: SLA of 15 minutes. Track: mean time from alert to containment (MTTC).",
        logging:"Full audit trail: playbook_name, alert_id, step_name, timestamp_start, timestamp_end, action_result, analyst_id (for manual steps). Non-repudiation for incident timeline.",
        secure:"Playbook automation: high privilege (can isolate hosts, access credentials). Protect playbook engine access: only SOC platform can invoke. All actions logged. Require MFA for destructive actions.",
        lab:"Implement ransomware playbook. Simulate attack on lab Windows VM. Trigger playbook. Verify: host isolated within 60s, memory dump collected, Slack alert sent, ticket created.",
        project:"playbook_engine.py: 4 playbooks (ransomware, credential dump, webshell, lateral movement). dry_run mode. approval gates. audit trail. rollback. Prometheus metrics.",
        output:"4 playbooks implemented. All tested in lab. Ransomware playbook: isolation in < 60s, evidence collected, alerts sent. Full audit trail in JSONL.",
        stretch:"Add playbook versioning: each playbook has a version number. When playbook is updated, in-flight executions continue with old version. New executions use new version.",
        hw:"Study OASIS CACAO (Collaborative Automated Course of Action Operations) specification: the standard format for sharing security playbooks. Can your playbook engine parse CACAO playbooks?",
        research:"Compare commercial SOAR platforms: Splunk SOAR, Palo Alto XSOAR, IBM QRadar SOAR. What are the differentiating capabilities? What is the pricing model? When would a custom playbook engine be better?"
      },
      {
        day:90, lang:"ALL", title:"SENTRY v1.0 — Production Release",
        obj:"SENTRY v1.0 fully deployed, documented, tested, CI/CD running. Demo recorded. Blog post published. Portfolio complete.",
        tech:"Full platform integration: 3 agents → normaliser → ELK → detection engine → enrichment → API → dashboard → IR playbooks. Docker Compose + GitHub Actions. MkDocs documentation.",
        commands:["docker-compose -f docker-compose.prod.yml up -d", "mkdocs gh-deploy", "pytest tests/ --cov=src --cov-report=html", "git tag v1.0.0 && git push origin v1.0.0"],
        walkthrough:`SENTRY v1.0 final architecture:
┌─────────────────────────────────────────────────────────────────────┐
│ DEPLOYED: docker-compose.prod.yml  (all services)                   │
│ MONITORED: Prometheus + Grafana    (6 dashboard panels)             │
│ TESTED:    pytest 50+ tests        (> 85% coverage)                 │
│ CI/CD:     GitHub Actions          (green on main)                  │
│ DOCS:      MkDocs → GitHub Pages  (architecture + runbook + API)   │
│ DEMO:      5-min video             (YouTube/Loom)                   │
│ BLOG:      Technical post          (LinkedIn/Medium)                │
└─────────────────────────────────────────────────────────────────────┘

Final deployment checklist:
  □ All services start with one command (docker-compose up -d)
  □ Health checks passing for all services
  □ 10 attack simulations all detected
  □ REST API serving all endpoints (GET /docs shows complete API)
  □ Dashboard live with real-time updates
  □ CI/CD: push → test → build → deploy all automated
  □ Documentation site deployed at username.github.io/sentry
  □ Demo video recorded (5 minutes, shows: deploy, attack sim, detection, alert, playbook)
  □ Blog post published explaining key design decisions`,
        scratch:`# Final integration test — run BEFORE v1.0 tag
#!/usr/bin/env python3
"""SENTRY v1.0 smoke test — verifies full platform end-to-end."""
import requests, time, subprocess, sys

BASE_URL = "http://localhost:8000"
TIMEOUT  = 60  # seconds per test

def test_api_health():
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    assert r.json()['status'] == 'healthy'
    print("✓ API health check")

def test_attack_simulation():
    """Simulate vssadmin shadow deletion, verify alert appears within 60s."""
    # Trigger on Windows VM via SSH
    subprocess.run(["ssh", "windows-vm", "vssadmin delete shadows /for=C: /quiet"],
                   timeout=10, check=False)  # Will fail (no admin) but generates event
    
    # Wait for alert
    deadline = time.monotonic() + TIMEOUT
    while time.monotonic() < deadline:
        r = requests.get(f"{BASE_URL}/v1/alerts?severity=HIGH&rule=Shadow_Deletion", timeout=5)
        if r.json()['total'] > 0:
            print(f"✓ Shadow deletion detected in {TIMEOUT - (deadline-time.monotonic()):.1f}s")
            return
        time.sleep(2)
    print("✗ Shadow deletion NOT detected within timeout")
    sys.exit(1)

if __name__ == '__main__':
    test_api_health()
    test_attack_simulation()
    print("\\n✓ SENTRY v1.0 smoke test PASSED")`,
        debug:"Final deployment: 3 production issues found. Find and fix: Docker networking (services can't reach each other), ELK memory (OOM killer), detection engine startup race condition.",
        analysis:`Complete platform assessment:
Performance:
  - Events/sec throughput: [measure]
  - End-to-end latency: [measure]
  - API response time p99: [measure]
  - Detection accuracy: TP/FP rates for each detector

Security:
  - All services non-root: [verify]
  - No secrets in image: [verify with trivy]
  - API auth working: [verify with unauthenticated request]
  - ELK not publicly exposed: [verify with nmap from outside]

Coverage:
  - ATT&CK techniques detected: [count from navigator]
  - Test coverage: [pytest --cov report]
  - Documentation coverage: [mkdocs build warnings]`,
        usecase:"SENTRY v1.0 IS your portfolio. It demonstrates: security knowledge (what to detect), engineering skill (how to build), production practices (how to deploy). This is what employers want to see.",
        red:"Final red team: attack your own platform. Find 1 detection gap, 1 API vulnerability, 1 deployment weakness. Document all findings honestly in your blog post — shows security mindset.",
        blue:"SENTRY v1.0 provides: detection for 10+ ATT&CK techniques, IR automation for 4 scenarios, complete audit trail, real-time alerting. Estimate: covers 60% of common enterprise attacks.",
        detect:"Meta-monitoring: SENTRY monitoring itself. Alert when: any service goes unhealthy, event rate drops, detection engine stops processing, API error rate spikes.",
        mistakes:["Shipping without documentation (nobody can use it)", "No CI badge (can't trust code quality)", "No demo (nobody knows what it does)", "Not tagging a release (no stable version to reference)"],
        perf:"Final benchmark: 10,000 events/sec throughput? Detection latency < 30s? API < 100ms p99? These are your v1.0 performance baselines for future improvement.",
        logging:"Production logging: structured JSONL, log rotation, retention policy (90 days), log shipping to own ELK. Operational runbook: how to view logs, how to debug each component.",
        secure:"Final security review document: threat model, attack surface, security controls, known limitations, planned improvements. Honest assessment of where SENTRY is and isn't secure.",
        lab:"Full end-to-end demo: start from clean docker-compose up -d. Wait for healthy. Run 3 attack simulations. Show alerts in dashboard. Trigger ransomware playbook. Show containment. Record this as your demo video.",
        project:"SENTRY v1.0 public GitHub release: tag, changelog, Docker images, README with architecture diagram, installation guide, demo video link, MkDocs site.",
        output:`github.com/[username]/sentry:
  - Stars: 0 (for now)
  - CI badge: ✓ passing
  - Docker: one-line deploy
  - Docs: username.github.io/sentry
  - Demo: youtube.com/watch?v=...
  - Blog: linkedin.com/pulse/...`,
        stretch:`Write a 2000-word technical blog post covering:
1. Why you built SENTRY (problem it solves)
2. Key architecture decisions and tradeoffs
3. Most interesting engineering challenges
4. Performance benchmarks with real numbers
5. What you'd do differently
6. What's next (SENTRY v2.0 roadmap)
Publish: LinkedIn Article, Medium, or dev.to`,
        hw:`Present SENTRY to at least one person: colleague, mentor, or mock interviewer.
Questions to answer confidently:
- Why asyncio for the enrichment engine?
- How does your SIGMA runner work without a SIEM?
- What's your detection coverage vs ATT&CK?
- How does your deduplication algorithm work?
- What's the biggest limitation of SENTRY?
- How would you scale it to 10,000 hosts?`,
        research:`You have now built: a collection layer, a detection engine, a threat intel platform, an IR automation system, a REST API, a web dashboard, and a deployment pipeline.
Research: how does this compare to Chronicle (Google's cloud-native SIEM)?
What does Chronicle do that SENTRY can't? At what scale does SENTRY break down?
What would it take to make SENTRY handle 1M events/second?
Write a 1-page scaling plan.`
      },
    ]
  },
];

/* ── UI ── */
function Code({ code, lang }) {
  const lc={PYTHON:C.green,BASH:C.cyan,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue}[lang]||C.green;
  return (
    <pre style={{background:"#020a04",border:`1px solid ${C.border}`,borderLeft:`3px solid ${lc}`,
      borderRadius:3,padding:"10px 12px",color:lc,fontSize:10,
      fontFamily:"'Fira Code','Courier New',monospace",whiteSpace:"pre-wrap",
      wordBreak:"break-word",margin:"8px 0",lineHeight:1.6}}>{code}</pre>
  );
}

function DayView({ d }) {
  const [open, setOpen] = useState(null);
  const lc={PYTHON:C.green,BASH:C.cyan,"BASH+PYTHON":C.amber,POWERSHELL:C.purple,ALL:C.blue}[d.lang]||C.green;

  const SECTIONS=[
    {k:"tech",  label:"Technical Deep Dive",  val:d.tech,    c:C.cyan},
    {k:"cmd",   label:"Core Commands",         val:d.commands?.join("\n"),c:C.green,code:true},
    {k:"walk",  label:"Script Walkthrough",    val:d.walkthrough,c:C.blue},
    {k:"scratch",label:"Write From Scratch",   val:d.scratch, c:C.amber,code:true},
    {k:"debug", label:"Debugging Exercise",    val:d.debug,   c:C.red, code:true},
    {k:"use",   label:"Security Use Case",     val:d.usecase, c:C.cyan},
    {k:"red",   label:"Red Team Perspective",  val:d.red,     c:C.red},
    {k:"blue",  label:"Blue Team Perspective", val:d.blue,    c:C.blue},
    {k:"detect",label:"Detection Opportunities",val:d.detect, c:C.green},
    {k:"wrong", label:"Common Mistakes",       val:Array.isArray(d.mistakes)?("• "+d.mistakes.join("\n• ")):d.mistakes,c:C.amber},
    {k:"perf",  label:"Performance",           val:d.perf,    c:C.purple},
    {k:"log",   label:"Logging Considerations",val:d.logging, c:C.lime},
    {k:"sec",   label:"Secure Coding",         val:d.secure,  c:C.red},
    {k:"lab",   label:"Lab + Mini Project",    val:`LAB: ${d.lab}\n\nPROJECT: ${d.project}`,c:C.green},
    {k:"out",   label:"Expected Output",       val:d.output,  c:C.cyan},
    {k:"str",   label:"Stretch + HW + Research",val:`STRETCH:\n${d.stretch}\n\nHOMEWORK:\n${d.hw}\n\nRESEARCH:\n${d.research}`,c:C.purple},
  ];

  return (
    <div style={{marginTop:8}}>
      <div style={{padding:"8px 12px",background:lc+"08",border:`1px solid ${lc}33`,borderRadius:3,marginBottom:8}}>
        <div style={{color:lc,fontSize:8,letterSpacing:"0.1em",marginBottom:2}}>OBJECTIVE</div>
        <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{d.obj}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
        {SECTIONS.map((s)=>(
          s.val && (
            <div key={s.k} style={{border:`1px solid ${open===s.k?s.c+"55":C.border}`,borderRadius:3,
              gridColumn:open===s.k?"1/-1":"auto"}}>
              <div onClick={()=>setOpen(open===s.k?null:s.k)}
                style={{padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,
                  background:open===s.k?s.c+"0a":C.bg2}}>
                <span style={{color:open===s.k?s.c:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>{s.label}</span>
                <span style={{marginLeft:"auto",color:C.dim,fontSize:9}}>{open===s.k?"▲":"▼"}</span>
              </div>
              {open===s.k&&(
                <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`}}>
                  {s.code?<Code code={s.val} lang={d.lang}/>:
                    <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{s.val}</div>}
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
  const lc={PYTHON:C.green,BASH:C.cyan,POWERSHELL:C.purple,ALL:C.blue,"BASH+PYTHON":C.amber}[d.lang]||C.green;
  return (
    <div style={{border:`1px solid ${open?lc+"44":C.border}`,borderRadius:4,marginBottom:5}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:open?lc+"08":C.bg2}}>
        <span style={{background:lc+"22",color:lc,fontSize:8,padding:"1px 5px",borderRadius:2,minWidth:60,textAlign:"center",fontFamily:"'Courier New',monospace",fontWeight:700}}>{d.lang}</span>
        <span style={{color:"#0a3018",fontSize:9,minWidth:40,fontFamily:"'Courier New',monospace"}}>DAY {d.day}</span>
        <span style={{color:C.bright,fontSize:11,fontFamily:"'Courier New',monospace",flex:1}}>{d.title}</span>
        <span style={{color:C.dim}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<DayView d={d}/>}
    </div>
  );
}

function WeekView({ w }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{border:`1px solid ${open?w.color+"44":C.border}`,borderRadius:5,marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:open?w.color+"08":C.bg2}}>
        <span style={{background:w.color+"22",color:w.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:2,fontFamily:"'Courier New',monospace",minWidth:64,textAlign:"center"}}>WEEK {w.week}</span>
        <div>
          <div style={{color:C.bright,fontSize:12,fontFamily:"'Courier New',monospace",fontWeight:700}}>{w.title}</div>
          <div style={{color:C.dim,fontSize:9,marginTop:2}}>{w.days.length} detailed day{w.days.length>1?"s":""} · {w.challenge?.split('.')[0]}</div>
        </div>
        <span style={{marginLeft:"auto",color:C.dim}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"14px 16px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <div style={{padding:"8px 12px",background:w.color+"08",border:`1px solid ${w.color}22`,borderRadius:3,marginBottom:10}}>
            <div style={{color:w.color,fontSize:9,letterSpacing:"0.1em",marginBottom:3}}>THEME</div>
            <div style={{color:C.dim,fontSize:11,fontFamily:"'Courier New',monospace",marginBottom:6,lineHeight:1.5}}>{w.theme}</div>
            <div style={{color:C.amber,fontSize:9,letterSpacing:"0.1em",marginBottom:3}}>WEEKLY CHALLENGE 🏆</div>
            <div style={{color:C.white,fontSize:11,fontFamily:"'Courier New',monospace",lineHeight:1.5}}>{w.challenge}</div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {w.projects?.map((p,i)=>(
              <span key={i} style={{background:w.color+"11",color:w.color,fontSize:10,padding:"2px 8px",borderRadius:3,fontFamily:"'Courier New',monospace"}}>📦 {p}</span>
            ))}
          </div>
          {w.days.map(d=><DayCard key={d.day} d={d}/>)}
          {w.days.length < 7 && (
            <div style={{padding:"10px 12px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,marginTop:8}}>
              <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace"}}>
                Remaining days in Week {w.week}: apply the same 22-component structure to each topic. 
                Follow the weekly theme and challenge. Each day builds on the previous.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Month3() {
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.dim,fontFamily:"'Courier New',monospace",display:"flex",flexDirection:"column",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,40,15,0.04) 3px,rgba(0,40,15,0.04) 4px)"}}>

      <div style={{background:"#000",borderBottom:`2px solid ${C.green}44`,padding:"10px 22px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:C.green+"22",border:`1px solid ${C.green}66`,borderRadius:4,padding:"4px 12px",color:C.green,fontSize:12,fontWeight:700,letterSpacing:"0.12em"}}>M3</div>
        <div>
          <div style={{color:C.bright,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>MONTH 3 — ADVANCED TOOLING + MALWARE ANALYSIS + CAPSTONE</div>
          <div style={{color:C.dim,fontSize:9,letterSpacing:"0.1em",marginTop:1}}>DAYS 57–90 · FULL 22-COMPONENT FORMAT · ASYNC · PLUGINS · API · DOCKER · CI/CD · SENTRY PLATFORM</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {[{c:C.purple,l:"W9"},{c:C.blue,l:"W10"},{c:C.cyan,l:"W11"},{c:C.amber,l:"W12"},{c:C.green,l:"W13"}].map((w,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:w.c}}/>
              <span style={{color:w.c,fontSize:8}}>{w.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,padding:"22px 26px",overflowY:"auto",background:C.bg}}>
        <div style={{border:`1px solid ${C.green}33`,borderRadius:4,padding:"12px 16px",background:C.green+"08",marginBottom:20}}>
          <div style={{color:C.green,fontSize:10,fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>MONTH 3 — 5 WEEKS TO CAPSTONE</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
            {[
              {w:"Week 9",  topic:"Async + Plugins + API",  color:C.purple,n:"Days 57-63"},
              {w:"Week 10", topic:"Docker + CI/CD + CIS",   color:C.blue,  n:"Days 64-70"},
              {w:"Week 11", topic:"SENTRY: Collection",     color:C.cyan,  n:"Days 71-77"},
              {w:"Week 12", topic:"SENTRY: Detection+API",  color:C.amber, n:"Days 78-84"},
              {w:"Week 13", topic:"SENTRY: Release v1.0",   color:C.green, n:"Days 85-90"},
            ].map((s,i)=>(
              <div key={i} style={{border:`1px solid ${s.color}33`,borderRadius:3,padding:"8px 10px",background:s.color+"08"}}>
                <div style={{color:s.color,fontSize:10,fontWeight:700,fontFamily:"'Courier New',monospace"}}>{s.w}</div>
                <div style={{color:C.bright,fontSize:11,marginTop:2}}>{s.topic}</div>
                <div style={{color:C.dim,fontSize:9,marginTop:2}}>{s.n}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"8px 10px",background:C.bg2,borderRadius:3,border:`1px solid ${C.border}`}}>
            <div style={{color:C.green,fontSize:9,letterSpacing:"0.08em",marginBottom:4}}>CAPSTONE GOAL</div>
            <div style={{color:C.dim,fontSize:10,fontFamily:"'Courier New',monospace",lineHeight:1.6}}>
              SENTRY v1.0: production-grade security intelligence platform. 3 collection agents, detection engine, 
              enrichment pipeline, REST API, real-time dashboard, 4 IR playbooks. Docker Compose deployment. 
              GitHub Actions CI/CD. MkDocs documentation. 5-minute demo video. Technical blog post.
            </div>
          </div>
        </div>

        {WEEKS.map(w=><WeekView key={w.id} w={w}/>)}
      </div>

      <div style={{background:"#000",borderTop:`1px solid ${C.border}`,padding:"5px 22px",display:"flex",justifyContent:"space-between",fontSize:9,color:"#0a2a12"}}>
        <span>MONTH 3 — ADVANCED TOOLING + CAPSTONE: SENTRY v1.0</span>
        <span style={{color:C.green+"44"}}>WEEKS 9-13 · DAYS 57-90 · 22 COMPONENTS/DAY</span>
      </div>
    </div>
  );
}
