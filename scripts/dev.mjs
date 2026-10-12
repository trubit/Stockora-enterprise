#!/usr/bin/env node
/**
 * dev.mjs — Stockora Enterprise Resilient Dev Runner
 *
 * High-performance, cross-platform runner that concurrently spawns:
 *  1. Express API backend (via tsx watch)
 *  2. Vite frontend client
 *
 * Security & Reliability Highlights:
 *  - Non-blocking concurrent startup (frontend is not blocked behind healthcheck).
 *  - Resilient port clearance using native `netstat` on Windows with strict 2.5s timeouts.
 *  - No PowerShell dependency to avoid MinGW/Git Bash PTY deadlocks and security policy blocks.
 *  - Strict PID filtering to protect system processes (PID <= 4) and prevent command injection.
 *  - Clean process-tree cleanup across Windows, macOS, and Linux on SIGINT/SIGTERM.
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Resolve verified JS entry points for tsx and vite
const TSX_BIN = path.resolve(ROOT_DIR, 'node_modules/tsx/dist/cli.mjs');
const VITE_BIN = path.resolve(ROOT_DIR, 'node_modules/vite/bin/vite.js');
const NODE = process.execPath;

const children = [];
let isTerminating = false;

/**
 * Safely terminates a process and its children.
 */
function killProcessTree(proc) {
  if (!proc || !proc.pid || proc.killed) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${proc.pid}`, {
        stdio: 'ignore',
        timeout: 2000,
        windowsHide: true,
      });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    try {
      proc.kill('SIGKILL');
    } catch {
      // Process already terminated
    }
  }
}

/**
 * Graceful termination handler for all child processes.
 */
function cleanupAndExit(code = 0) {
  if (isTerminating) return;
  isTerminating = true;

  for (const proc of children) {
    killProcessTree(proc);
  }
  process.exit(code);
}

/**
 * Clears stale processes holding a specified port without hanging.
 * Uses fast native `netstat` on Windows with hard timeouts and strict PID validation.
 */
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      // Fast, native Windows netstat with hard 2500ms timeout
      const rawOutput = execSync('netstat -ano -p tcp', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 2500,
        windowsHide: true,
      });

      // Match TCP connections on the specified port in LISTENING state:
      // Format: TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       12345
      const regex = new RegExp(
        `(?:0\\.0\\.0\\.0|127\\.0\\.0\\.1|\\[::\\]):${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`,
        'gi'
      );

      const pids = new Set();
      let match;
      while ((match = regex.exec(rawOutput)) !== null) {
        const pidNum = parseInt(match[1], 10);
        // Protect system PIDs (0, 4) and our own running process
        if (pidNum > 4 && pidNum !== process.pid) {
          pids.add(pidNum);
        }
      }

      for (const pid of pids) {
        console.log(`[Stockora Dev] Port ${port} occupied by PID ${pid}. Terminating stale process...`);
        try {
          execSync(`taskkill /F /T /PID ${pid}`, {
            stdio: 'ignore',
            timeout: 2000,
            windowsHide: true,
          });
        } catch {
          // Process might have terminated already
        }
      }
    } else {
      // POSIX fallback using lsof with strict timeout
      try {
        const lsofOut = execSync(`lsof -ti tcp:${port}`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 2000,
        }).trim();

        const pids = lsofOut.split(/\s+/).map((p) => parseInt(p, 10)).filter((p) => p > 1 && p !== process.pid);
        for (const pid of pids) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {}
        }
      } catch {
        // Port free or lsof unavailable
      }
    }
  } catch {
    // Port clearance is non-blocking; proceed even if query timed out or failed
  }
}

/**
 * Spawns a child process with inherited stdio.
 */
function spawnService(args, label) {
  console.log(`[Stockora Dev] Spawning ${label}...`);
  const proc = spawn(NODE, args, {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    windowsHide: false,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  children.push(proc);

  proc.on('error', (err) => {
    console.error(`[Stockora Dev] ${label} error:`, err.message);
    cleanupAndExit(1);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null && !isTerminating) {
      console.error(`[Stockora Dev] ${label} exited with code ${code}`);
      cleanupAndExit(code ?? 1);
    }
  });

  return proc;
}

function main() {
  console.log('\n============================================================');
  console.log('  Stockora Enterprise — Development Environment Starting');
  console.log('============================================================\n');

  // 1. Clear any stale listeners on ports 8080 and 3000 non-blockingly
  freePort(8080);
  freePort(3000);

  // 2. Register lifecycle termination hooks
  process.on('SIGINT', () => {
    console.log('\n[Stockora Dev] Received SIGINT. Shutting down all services...');
    cleanupAndExit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Stockora Dev] Received SIGTERM. Terminating all services...');
    cleanupAndExit(0);
  });

  process.on('exit', () => {
    for (const proc of children) {
      killProcessTree(proc);
    }
  });

  // 3. Concurrently launch server and client
  console.log('[Stockora Dev] Starting API Backend & Vite Frontend concurrently...\n');
  spawnService([TSX_BIN, 'watch', 'src/server/index.ts'], 'Server (Express / Port 8080)');
  spawnService([VITE_BIN], 'Client (Vite / Port 3000)');
}

main();
