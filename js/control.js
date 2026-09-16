/**
 * ═══════════════════════════════════════════════════════════════
 * ESP32 Marauder — Control Center JavaScript
 * Premium Web Serial interface with modals, toasts, & full
 * command coverage for ESP32 Marauder firmware.
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    /* ── Serial State ── */
    let port = null;
    let reader = null;
    let writer = null;
    let readLoopRunning = false;
    let autoScroll = true;
    const commandHistory = [];
    let historyIndex = -1;
    const textEncoder = new TextEncoder();
    const bleDevices = new Set();

    /* ── DOM References ── */
    const $ = (sel) => document.getElementById(sel);
    const connectBtn      = $('connect-btn');
    const disconnectBtn   = $('disconnect-btn');
    const statusEl        = $('status');
    const statusWrapper   = $('status-wrapper');
    const terminalEl      = $('terminal');
    const commandInput    = $('command-input');
    const bleTableBody    = $('ble-table-body');
    const clearTerminalBtn= $('clear-terminal-btn');
    const autoscrollBtn   = $('autoscroll-btn');
    const clearBleBtn     = $('clear-ble-btn');
    const deviceCountEl   = $('device-count');
    const exportTermBtn   = $('export-terminal-btn');

    /* ── Modal Elements ── */
    const modalOverlay = $('modal-overlay');
    const modalEl      = $('modal');
    const modalTitle   = $('modal-title');
    const modalDesc    = $('modal-desc');
    const modalFields  = $('modal-fields');
    const modalCancel  = $('modal-cancel');
    const modalSubmit  = $('modal-submit');

    /* ── Toast Container ── */
    const toastContainer = $('toast-container');

    /* ══════════════════════════════════════════
       TOAST NOTIFICATION SYSTEM
       ══════════════════════════════════════════ */
    const TOAST_ICONS = {
        success: '✓',
        error:   '✗',
        warning: '⚠',
        info:    'ℹ'
    };

    /**
     * Show a toast notification.
     * @param {string} message - Message text
     * @param {'success'|'error'|'warning'|'info'} type - Toast type
     * @param {number} duration - Auto-dismiss in ms (default 3500)
     */
    function showToast(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</span>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        const timer = setTimeout(() => removeToast(toast), duration);
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            removeToast(toast);
        });
    }

    function removeToast(toast) {
        if (!toast.parentNode) return;
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }

    /* ══════════════════════════════════════════
       MODAL SYSTEM (replaces prompt/alert)
       ══════════════════════════════════════════ */
    let _modalResolve = null;

    /**
     * Show a modal dialog and return a promise that resolves
     * with the field values, or null if cancelled.
     *
     * @param {object} config
     * @param {string} config.title - Modal title
     * @param {string} [config.desc] - Description text
     * @param {Array<{id:string, label:string, type:string, placeholder?:string, value?:string, options?:Array}>} config.fields
     * @returns {Promise<object|null>}
     */
    function showModal({ title, desc = '', fields = [] }) {
        return new Promise((resolve) => {
            _modalResolve = resolve;

            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            modalFields.innerHTML = '';

            fields.forEach((f) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'modal-field';

                const label = document.createElement('label');
                label.textContent = f.label;
                label.setAttribute('for', `modal-f-${f.id}`);
                wrapper.appendChild(label);

                let input;
                if (f.type === 'select' && f.options) {
                    input = document.createElement('select');
                    f.options.forEach((opt) => {
                        const o = document.createElement('option');
                        o.value = opt.value ?? opt;
                        o.textContent = opt.label ?? opt;
                        input.appendChild(o);
                    });
                } else {
                    input = document.createElement('input');
                    input.type = f.type || 'text';
                    if (f.placeholder) input.placeholder = f.placeholder;
                    if (f.value != null) input.value = f.value;
                    if (f.min != null) input.min = f.min;
                    if (f.max != null) input.max = f.max;
                }
                input.id = `modal-f-${f.id}`;
                input.dataset.fieldId = f.id;
                wrapper.appendChild(input);
                modalFields.appendChild(wrapper);
            });

            modalOverlay.classList.add('active');

            // Focus first input
            requestAnimationFrame(() => {
                const first = modalFields.querySelector('input, select');
                if (first) first.focus();
            });
        });
    }

    function closeModal(result) {
        modalOverlay.classList.remove('active');
        if (_modalResolve) {
            _modalResolve(result);
            _modalResolve = null;
        }
    }

    modalCancel.addEventListener('click', () => closeModal(null));

    modalSubmit.addEventListener('click', () => {
        const inputs = modalFields.querySelectorAll('input, select');
        const values = {};
        inputs.forEach((inp) => {
            values[inp.dataset.fieldId] = inp.value;
        });
        closeModal(values);
    });

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal(null);
    });

    // Keyboard: Escape to cancel, Enter to submit
    document.addEventListener('keydown', (e) => {
        if (!modalOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') { e.preventDefault(); closeModal(null); }
        if (e.key === 'Enter')  { e.preventDefault(); modalSubmit.click(); }
    });

    /* ══════════════════════════════════════════
       TERMINAL
       ══════════════════════════════════════════ */

    /**
     * Append raw text to the terminal.
     * @param {string} text
     */
    function log(text) {
        terminalEl.textContent += text;
        // Trim buffer if it gets too large
        if (terminalEl.textContent.length > 120000) {
            terminalEl.textContent = terminalEl.textContent.slice(-90000);
        }
        if (autoScroll) {
            terminalEl.scrollTop = terminalEl.scrollHeight;
        }
    }

    /**
     * Append a timestamped line to the terminal
     * and attempt to parse BLE device data.
     * @param {string} text
     */
    function logLine(text) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        log(`[${timestamp}] ${text}\n`);
        parseLine(text);
        // Feed serial output to display emulator
        if (window.MarauderDisplay) window.MarauderDisplay.handleSerialLine(text);
    }

    function clearTerminal() {
        terminalEl.textContent = '';
        showToast('Terminal cleared', 'info', 2000);
    }

    function exportTerminal() {
        const content = terminalEl.textContent;
        if (!content.trim()) {
            showToast('Terminal is empty', 'warning');
            return;
        }
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marauder_log_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Terminal log exported', 'success');
    }

    /* ══════════════════════════════════════════
       CONNECTION
       ══════════════════════════════════════════ */

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
            showToast('Web Serial API not supported — use Chrome, Edge, or Opera', 'error', 5000);
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
            showToast('Connected to device', 'success');
            // Sync display connection state
            if (window.MarauderDisplay) window.MarauderDisplay.setConnected(true);

            // Show port info if available
            const info = port.getInfo ? port.getInfo() : null;
            if (info && info.usbVendorId) {
                logLine(`  Vendor: 0x${info.usbVendorId.toString(16).toUpperCase()}  Product: 0x${info.usbProductId.toString(16).toUpperCase()}`);
            }

            readLoop();
        } catch (err) {
            console.error(err);
            showToast('Connection failed: ' + err.message, 'error', 5000);
        }
    }

    async function disconnectSerial() {
        readLoopRunning = false;
        try {
            if (reader) { await reader.cancel(); reader.releaseLock(); }
            if (writer) { writer.releaseLock(); }
            if (port)   { await port.close(); }
        } catch (e) {
            console.error('Disconnect error:', e);
        }
        port = reader = writer = null;
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        setStatus('Not connected', false);
        logLine('✗ Disconnected from device');
        showToast('Disconnected', 'info');
        // Sync display connection state
        if (window.MarauderDisplay) window.MarauderDisplay.setConnected(false);
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
                    lines.forEach((line) => {
                        if (line.trim().length > 0) logLine(line);
                    });
                }
            } catch (e) {
                if (readLoopRunning) {
                    console.error('Read error:', e);
                    logLine('⚠ Read error: ' + e.message);
                    showToast('Read error — device may have disconnected', 'error');
                }
                break;
            }
        }
        if (readLoopRunning) {
            disconnectSerial();
        }
    }

    /* ══════════════════════════════════════════
       COMMAND SENDING
       ══════════════════════════════════════════ */

    /**
     * Send a command string to the ESP32.
     * @param {string} cmd - Command to send
     */
    async function sendCommand(cmd) {
        if (!writer) {
            showToast('Not connected — click Connect first', 'warning');
            return;
        }
        const trimmedCmd = cmd.trim();
        if (!trimmedCmd) return;

        // Command history
        if (commandHistory[commandHistory.length - 1] !== trimmedCmd) {
            commandHistory.push(trimmedCmd);
            if (commandHistory.length > 100) commandHistory.shift();
        }
        historyIndex = commandHistory.length;

        const line = trimmedCmd + '\n';
        log(`\n> ${trimmedCmd}\n`);

        try {
            await writer.write(textEncoder.encode(line));
            // Feed command to display emulator
            if (window.MarauderDisplay) window.MarauderDisplay.handleCommand(trimmedCmd);
        } catch (e) {
            logLine('⚠ Send error: ' + e.message);
            showToast('Failed to send command', 'error');
        }
    }

    /* ══════════════════════════════════════════
       BLE DEVICE PARSING
       ══════════════════════════════════════════ */

    function parseLine(line) {
        const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/);
        if (!macMatch) return;

        const mac = macMatch[0].toUpperCase().replace(/-/g, ':');
        const rssiMatch = line.match(/RSSI[:\s=]*(-?\d+)/i)
                       || line.match(/rssi[:\s]*(-?\d+)/i)
                       || line.match(/\s(-\d{2,3})\s*dBm/i);
        const rssi = rssiMatch ? rssiMatch[1] : '';

        let name = '';
        const nameMatch = line.match(/name[:\s=]*["']?([^"'\n\r,]+)["']?/i)
                       || line.match(/\[(.*?)\]/);
        if (nameMatch && nameMatch[1].trim() && !nameMatch[1].includes(mac)) {
            name = nameMatch[1].trim();
        }
        addBleDevice(mac, name, rssi);
    }

    function addBleDevice(mac, name, rssi) {
        if (bleDevices.has(mac)) return;
        bleDevices.add(mac);

        const emptyRow = bleTableBody.querySelector('.table-empty');
        if (emptyRow) emptyRow.closest('tr').remove();

        const tr = document.createElement('tr');
        tr.style.animation = 'fadeUp 0.3s ease-out';

        const rssiVal = parseInt(rssi);
        let strength = 'weak';
        if (!isNaN(rssiVal)) {
            if (rssiVal >= -50) strength = 'strong';
            else if (rssiVal >= -70) strength = 'medium';
        }

        tr.innerHTML = `
            <td style="color: var(--accent-cyan); font-weight: 500;">${mac}</td>
            <td>${name || '<em style="color:var(--text-muted)">Unknown</em>'}</td>
            <td>
                <span class="rssi-bar ${strength}">
                    <span></span><span></span><span></span><span></span>
                </span>
                <span style="color: ${getRssiColor(rssi)};">${rssi ? rssi + ' dBm' : '—'}</span>
            </td>
        `;
        bleTableBody.appendChild(tr);
        deviceCountEl.textContent = bleDevices.size;
    }

    function getRssiColor(rssi) {
        const value = parseInt(rssi);
        if (isNaN(value)) return 'var(--text-muted)';
        if (value >= -50) return 'var(--accent-green)';
        if (value >= -70) return 'var(--accent-orange)';
        return 'var(--accent-red)';
    }

    function clearBleTable() {
        bleDevices.clear();
        bleTableBody.innerHTML = '<tr><td colspan="3" class="table-empty">No devices discovered</td></tr>';
        deviceCountEl.textContent = '0';
        showToast('BLE device list cleared', 'info', 2000);
    }

    /* ══════════════════════════════════════════
       EVENT LISTENERS
       ══════════════════════════════════════════ */

    connectBtn.addEventListener('click', connectSerial);
    disconnectBtn.addEventListener('click', disconnectSerial);
    clearTerminalBtn.addEventListener('click', clearTerminal);
    exportTermBtn.addEventListener('click', exportTerminal);
    clearBleBtn.addEventListener('click', clearBleTable);

    autoscrollBtn.addEventListener('click', () => {
        autoScroll = !autoScroll;
        autoscrollBtn.textContent = `⬇ Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
        showToast(`Auto-scroll ${autoScroll ? 'enabled' : 'disabled'}`, 'info', 2000);
    });

    /* ── Command Input (Enter / Arrow keys) ── */
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

    /* ── data-cmd buttons (generic) ── */
    document.querySelectorAll('[data-cmd]').forEach((btn) => {
        btn.addEventListener('click', () => {
            sendCommand(btn.getAttribute('data-cmd'));
        });
    });

    /* ══════════════════════════════════════════
       HELPER COMMAND MODALS
       ══════════════════════════════════════════ */

    /* Manual Deauth */
    const deauthManualBtn = $('deauth-manual-btn');
    if (deauthManualBtn) {
        deauthManualBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '🎯 Manual Deauth Attack',
                desc: 'Specify source and optional destination MAC addresses.',
                fields: [
                    { id: 'src', label: 'Source MAC', type: 'text', placeholder: 'AA:BB:CC:DD:EE:FF' },
                    { id: 'dst', label: 'Destination MAC (optional)', type: 'text', placeholder: 'Leave empty for broadcast' }
                ]
            });
            if (!result) return;
            const src = result.src.trim();
            if (!src) { showToast('Source MAC is required', 'warning'); return; }
            let cmd = `attack -t deauth -s ${src}`;
            if (result.dst && result.dst.trim()) cmd += ` -d ${result.dst.trim()}`;
            sendCommand(cmd);
        });
    }

    /* Select APs */
    const selectApBtn = $('select-ap-btn');
    if (selectApBtn) {
        selectApBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '📡 Select Access Points',
                desc: 'Enter "all" to select all APs, or specific IDs separated by commas (e.g. 0,1,2).',
                fields: [
                    { id: 'input', label: 'AP Selection', type: 'text', placeholder: 'all  or  0,1,3,5' }
                ]
            });
            if (!result) return;
            const val = result.input.trim().toLowerCase();
            if (!val) return;
            sendCommand(val === 'all' ? 'select -a' : `select -a ${val}`);
        });
    }

    /* Select Stations */
    const selectStaBtn = $('select-sta-btn');
    if (selectStaBtn) {
        selectStaBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '📱 Select Stations',
                desc: 'Enter "all" to select all stations, or specific IDs separated by commas.',
                fields: [
                    { id: 'input', label: 'Station Selection', type: 'text', placeholder: 'all  or  0,1,3' }
                ]
            });
            if (!result) return;
            const val = result.input.trim().toLowerCase();
            if (!val) return;
            sendCommand(val === 'all' ? 'select -s' : `select -s ${val}`);
        });
    }

    /* Generate SSIDs */
    const generateSsidBtn = $('generate-ssid-btn');
    if (generateSsidBtn) {
        generateSsidBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '🎲 Generate Random SSIDs',
                desc: 'How many random SSIDs should be generated?',
                fields: [
                    { id: 'count', label: 'Count', type: 'number', placeholder: '20', value: '20', min: '1', max: '1000' }
                ]
            });
            if (!result) return;
            const num = parseInt(result.count) || 20;
            if (num < 1) { showToast('Enter a valid positive number', 'warning'); return; }
            sendCommand(`ssid -a -g -n ${num}`);
            showToast(`Generating ${num} random SSIDs...`, 'info');
        });
    }

    /* Add SSID */
    const addSsidBtn = $('add-ssid-btn');
    if (addSsidBtn) {
        addSsidBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '✏️ Add Custom SSID',
                desc: 'Enter a custom SSID name (max 32 characters).',
                fields: [
                    { id: 'ssid', label: 'SSID Name', type: 'text', placeholder: 'My Custom Network' }
                ]
            });
            if (!result) return;
            const ssid = result.ssid.trim();
            if (!ssid) return;
            if (ssid.length > 32) { showToast('SSID too long — max 32 characters', 'warning'); return; }
            sendCommand(`ssid -a -n "${ssid}"`);
            showToast(`Added SSID: ${ssid}`, 'success');
        });
    }

    /* Clear All Selections */
    const clearSelectBtn = $('clear-select-btn');
    if (clearSelectBtn) {
        clearSelectBtn.addEventListener('click', () => {
            sendCommand('clearlist -a');
            sendCommand('clearlist -s');
            logLine('📋 Cleared AP and Station selections');
            showToast('All selections cleared', 'success');
        });
    }

    /* Set WiFi Channel */
    const setChannelBtn = $('set-channel-btn');
    if (setChannelBtn) {
        setChannelBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '📻 Set WiFi Channel',
                desc: 'Select the WiFi channel (1–14).',
                fields: [
                    { id: 'ch', label: 'Channel', type: 'number', placeholder: '1', value: '1', min: '1', max: '14' }
                ]
            });
            if (!result) return;
            const ch = parseInt(result.ch);
            if (isNaN(ch) || ch < 1 || ch > 14) { showToast('Invalid channel — must be 1–14', 'warning'); return; }
            sendCommand(`channel -s ${ch}`);
            showToast(`Channel set to ${ch}`, 'success');
        });
    }

    /* LED Color */
    const ledColorBtn = $('led-color-btn');
    if (ledColorBtn) {
        ledColorBtn.addEventListener('click', async () => {
            const result = await showModal({
                title: '🎨 Set LED Color',
                desc: 'Enter RGB values (0–255 each).',
                fields: [
                    { id: 'r', label: 'Red', type: 'number', placeholder: '0', value: '0', min: '0', max: '255' },
                    { id: 'g', label: 'Green', type: 'number', placeholder: '255', value: '0', min: '0', max: '255' },
                    { id: 'b', label: 'Blue', type: 'number', placeholder: '0', value: '255', min: '0', max: '255' }
                ]
            });
            if (!result) return;
            const r = Math.min(255, Math.max(0, parseInt(result.r) || 0));
            const g = Math.min(255, Math.max(0, parseInt(result.g) || 0));
            const b = Math.min(255, Math.max(0, parseInt(result.b) || 0));
            sendCommand(`led -r ${r} ${g} ${b}`);
            showToast(`LED color set to RGB(${r}, ${g}, ${b})`, 'success');
        });
    }

    /* ══════════════════════════════════════════
       INIT
       ══════════════════════════════════════════ */
    window.addEventListener('load', () => {
        commandInput.focus();
        logLine('☠️ Marauder Control Center ready');
        logLine('💡 Click "Connect" to link with your ESP32 device');
        logLine('📖 Type "help" for the full command reference');
    });

    window.addEventListener('beforeunload', () => {
        if (port) disconnectSerial();
    });

})();
