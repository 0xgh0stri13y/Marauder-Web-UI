let port = null;
let reader = null;
let writer = null;
let readLoopRunning = false;
let autoScroll = true;
let commandHistory = [];
let historyIndex = -1;
const textEncoder = new TextEncoder();
const bleDevices = new Set();

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const statusEl = document.getElementById('status');
const statusWrapper = document.getElementById('status-wrapper');
const terminalEl = document.getElementById('terminal');
const commandInput = document.getElementById('command-input');
const bleTableBody = document.getElementById('ble-table-body');
const clearTerminalBtn = document.getElementById('clear-terminal-btn');
const autoscrollBtn = document.getElementById('autoscroll-btn');
const clearBleBtn = document.getElementById('clear-ble-btn');
const deviceCountEl = document.getElementById('device-count');

function log(text) {
    terminalEl.textContent += text;
    if (terminalEl.textContent.length > 100000) {
        terminalEl.textContent = terminalEl.textContent.slice(-80000);
    }
    if (autoScroll) {
        terminalEl.scrollTop = terminalEl.scrollHeight;
    }
}

function logLine(text) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    log(`[${timestamp}] ${text}\n`);
    parseLine(text);
}

function clearTerminal() {
    terminalEl.textContent = '';
}

function setStatus(text, connected = false) {
    statusEl.textContent = text;
    if (connected) {
        statusWrapper.classList.add('connected');
    } else {
        statusWrapper.classList.remove('connected');
    }
}

async function connectSerial() {
    if (!('serial' in navigator)) {
        alert('⚠️ Web Serial API not supported.\n\nPlease use Chrome, Edge, or Opera.');
        return;
    }
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        const textStream = port.readable.pipeThrough(new TextDecoderStream());
        reader = textStream.getReader();
        writer = port.writable.getWriter();
        readLoopRunning = true;
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        setStatus('Connected', true);
        logLine('✓ Connected to ESP32 Marauder');
        readLoop();
    } catch (err) {
        console.error(err);
        alert('❌ Failed to connect:\n' + err.message);
    }
}

async function disconnectSerial() {
    readLoopRunning = false;
    try {
        if (reader) { await reader.cancel(); reader.releaseLock(); }
        if (writer) { writer.releaseLock(); }
        if (port) { await port.close(); }
    } catch (e) { console.error(e); }
    port = reader = writer = null;
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    setStatus('Not connected', false);
    logLine('✗ Disconnected from device');
}

async function readLoop() {
    let buffer = '';
    while (readLoopRunning && reader) {
        try {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
                buffer += value;
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop();
                lines.forEach(line => {
                    if (line.trim().length > 0) logLine(line);
                });
            }
        } catch (e) {
            console.error('Read error:', e);
            logLine('⚠ Read error: ' + e.message);
            break;
        }
    }
    if (readLoopRunning) {
        disconnectSerial();
    }
}

async function sendCommand(cmd) {
    if (!writer) { alert('⚠️ Not connected to device'); return; }
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    if (commandHistory[commandHistory.length - 1] !== trimmedCmd) {
        commandHistory.push(trimmedCmd);
        if (commandHistory.length > 50) commandHistory.shift();
    }
    historyIndex = commandHistory.length;

    const line = trimmedCmd + "\n";
    log(`\n> ${trimmedCmd}\n`);
    try { await writer.write(textEncoder.encode(line)); }
    catch (e) { logLine('⚠ Send error: ' + e.message); }
}

function parseLine(line) {
    const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/);
    if (macMatch) {
        const mac = macMatch[0].toUpperCase().replace(/-/g, ':');
        const rssiMatch = line.match(/RSSI[:\s=]*(-?\d+)/i) || line.match(/rssi[:\s]*(-?\d+)/i) || line.match(/\s(-\d{2,3})\s*dBm/i);
        const rssi = rssiMatch ? rssiMatch[1] : '';
        
        let name = '';
        const nameMatch = line.match(/name[:\s=]*["\']?([^"'\n\r,]+)["\']?/i) || line.match(/\[(.*?)\]/);
        if (nameMatch && nameMatch[1].trim() && !nameMatch[1].includes(mac)) {
            name = nameMatch[1].trim();
        }
        addBleDevice(mac, name, rssi);
    }
}

function addBleDevice(mac, name, rssi) {
    const deviceKey = mac;
    if (bleDevices.has(deviceKey)) return; 
    bleDevices.add(deviceKey);

    const emptyRow = bleTableBody.querySelector('.table-empty');
    if (emptyRow) emptyRow.remove();

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="color: var(--accent-cyan);">${mac}</td>
        <td>${name || '<em>Unknown</em>'}</td>
        <td style="color: ${getRssiColor(rssi)};">${rssi ? rssi + ' dBm' : '-'}</td>
    `;
    bleTableBody.appendChild(tr);
    deviceCountEl.textContent = bleDevices.size;
}

function getRssiColor(rssi) {
    const value = parseInt(rssi);
    if (isNaN(value)) return 'var(--text-secondary)';
    if (value >= -50) return 'var(--accent-green)'; 
    if (value >= -70) return 'var(--accent-orange)'; 
    return 'var(--accent-red)'; 
}

function clearBleTable() {
    bleDevices.clear();
    bleTableBody.innerHTML = '<tr><td colspan="3" class="table-empty">No devices</td></tr>';
    deviceCountEl.textContent = '0';
}

connectBtn.addEventListener('click', connectSerial);
disconnectBtn.addEventListener('click', disconnectSerial);
clearTerminalBtn.addEventListener('click', clearTerminal);
autoscrollBtn.addEventListener('click', () => {
    autoScroll = !autoScroll;
    autoscrollBtn.textContent = `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
});
clearBleBtn.addEventListener('click', clearBleTable);

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = commandInput.value.trim();
        if (cmd) sendCommand(cmd);
        commandInput.value = '';
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            commandInput.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            commandInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            commandInput.value = '';
        }
    }
});

document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
        sendCommand(btn.getAttribute('data-cmd'));
    });
});

const deauthManualBtn = document.getElementById('deauth-manual-btn');
if (deauthManualBtn) {
    deauthManualBtn.addEventListener('click', () => {
        const srcMac = prompt('Enter source MAC address (e.g., AA:BB:CC:DD:EE:FF):');
        if (!srcMac) return;
        const dstMac = prompt('Enter destination MAC address (optional, leave empty for broadcast):');
        let cmd = `attack -t deauth -s ${srcMac}`;
        if (dstMac && dstMac.trim()) cmd += ` -d ${dstMac}`;
        sendCommand(cmd);
    });
}

const selectApBtn = document.getElementById('select-ap-btn');
if (selectApBtn) {
    selectApBtn.addEventListener('click', () => {
        const input = prompt('Select APs:\n\n• Enter "all" to select all APs\n• Enter specific IDs separated by commas\n• Leave empty to cancel');
        if (!input) return;
        const trimmed = input.trim().toLowerCase();
        sendCommand(trimmed === 'all' ? 'select -a' : `select -a ${trimmed}`);
    });
}

const selectStaBtn = document.getElementById('select-sta-btn');
if (selectStaBtn) {
    selectStaBtn.addEventListener('click', () => {
        const input = prompt('Select Stations:\n\n• Enter "all" to select all stations\n• Enter specific IDs separated by commas\n• Leave empty to cancel');
        if (!input) return;
        const trimmed = input.trim().toLowerCase();
        sendCommand(trimmed === 'all' ? 'select -s' : `select -s ${trimmed}`);
    });
}

const generateSsidBtn = document.getElementById('generate-ssid-btn');
if (generateSsidBtn) {
    generateSsidBtn.addEventListener('click', () => {
        const count = prompt('How many random SSIDs to generate?\n\n• Enter a number\n• Default is 20 if left empty');
        if (count === null) return; 
        const trimmed = count.trim();
        if (trimmed === '') {
            sendCommand('ssid -a -g -n 20');
        } else {
            const num = parseInt(trimmed);
            if (isNaN(num) || num < 1) { alert('⚠️ Please enter a valid positive number'); return; }
            sendCommand(`ssid -a -g -n ${num}`);
        }
    });
}

const addSsidBtn = document.getElementById('add-ssid-btn');
if (addSsidBtn) {
    addSsidBtn.addEventListener('click', () => {
        const ssid = prompt('Enter custom SSID to add:\n\n• Max 32 characters');
        if (!ssid || !ssid.trim()) return;
        const trimmed = ssid.trim();
        if (trimmed.length > 32) { alert('⚠️ SSID too long! Maximum 32 characters allowed.'); return; }
        sendCommand(`ssid -a -n "${trimmed}"`);
    });
}

const clearSelectBtn = document.getElementById('clear-select-btn');
if (clearSelectBtn) {
    clearSelectBtn.addEventListener('click', () => {
        sendCommand('clearlist -a');
        sendCommand('clearlist -s');
        logLine('📋 Cleared AP and Station selections');
    });
}

window.addEventListener('load', () => {
    commandInput.focus();
    logLine('🚀 Marauder Control Center ready [Neon Obsidian]');
    logLine('💡 Click "Connect" to link with your ESP32 device');
});

window.addEventListener('beforeunload', () => {
    if (port) disconnectSerial();
});
