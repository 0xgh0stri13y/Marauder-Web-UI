/**
 * ═══════════════════════════════════════════════════════════════
 * ESP32 Marauder — Virtual TFT Display Emulator
 * 
 * Replicates the physical Marauder TFT screen in the browser.
 * Parses commands and serial output to update the display state
 * machine, rendering the appropriate screen (boot, menu, scan,
 * attack, sniff, idle).
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    /* ── Display States ── */
    const STATE = {
        BOOT:      'boot',
        IDLE:      'idle',
        MENU:      'menu',
        SCAN_AP:   'scan_ap',
        SCAN_STA:  'scan_sta',
        SCAN_ALL:  'scan_all',
        SCAN_BT:   'scan_bt',
        SNIFF:     'sniff',
        ATTACK:    'attack',
        INFO:      'info',
        BLE_SPAM:  'ble_spam',
    };

    /* ── Current State ── */
    let currentState = STATE.BOOT;
    let isConnected = false;
    let scanCount = 0;
    let packetCount = 0;
    let sniffType = '';
    let attackType = '';
    let scanResults = [];
    let packetInterval = null;

    /* ── DOM ── */
    const screen  = document.getElementById('tft-screen');
    const content = document.getElementById('tft-content');
    const connDot = document.getElementById('tft-conn-dot');
    const statusText = document.getElementById('tft-status-text');
    const powerLed = document.getElementById('display-power-led');

    if (!screen || !content) return; // Guard if display not in DOM

    /* ══════════════════════════════════════════
       SCREEN RENDERERS
       ══════════════════════════════════════════ */

    function renderBoot() {
        content.innerHTML = `
            <div class="tft-boot">
                <div class="skull">☠️</div>
                <div class="title">MARAUDER</div>
                <div class="version">ESP32 WiFi/BT Offensive Tool</div>
                <div class="loading-bar"><div class="loading-fill"></div></div>
            </div>
        `;
        screen.classList.add('powered');
        powerLed.classList.add('on');

        // Transition to idle after boot animation
        setTimeout(() => {
            if (currentState === STATE.BOOT) {
                setState(STATE.IDLE);
            }
        }, 3000);
    }

    function renderIdle() {
        content.innerHTML = `
            <div class="tft-idle">
                <div class="idle-skull">☠️</div>
                <div class="idle-text">Ready</div>
                <div class="idle-text" style="color:#222; font-size:8px;">Awaiting command...</div>
            </div>
        `;
    }

    function renderMenu(title, items, activeIndex) {
        const itemsHtml = items.map((item, i) => `
            <div class="tft-menu-item ${i === activeIndex ? 'active' : ''}">
                <span class="mi-icon">${item.icon}</span>
                <span>${item.label}</span>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="tft-menu">
                <div class="tft-menu-title">${title}</div>
                <div class="tft-menu-items">${itemsHtml}</div>
                <div class="tft-nav-indicator">
                    ${items.map((_, i) => `<div class="tft-nav-dot ${i === activeIndex ? 'active' : ''}"></div>`).join('')}
                </div>
            </div>
        `;
    }

    function renderScan(type, count, results) {
        const typeLabels = {
            'scan_ap':  'AP Scan',
            'scan_sta': 'STA Scan',
            'scan_all': 'Full Scan',
            'scan_bt':  'BT Scan',
        };

        const resultsHtml = results.slice(-6).map(r => `
            <div class="tft-scan-result-item">
                <span class="sr-name">${r.name || r.mac || 'Unknown'}</span>
                <span class="sr-rssi">${r.rssi ? r.rssi + 'dB' : ''}</span>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="tft-scan">
                <div class="tft-scan-header">
                    <span class="tft-scan-type">${typeLabels[type] || 'Scanning'}</span>
                    <span class="tft-scan-count">${count} found</span>
                </div>
                <div class="tft-scan-animation">
                    <div class="tft-radar">
                        <div class="sweep"></div>
                    </div>
                </div>
                <div class="tft-scan-results">${resultsHtml}</div>
            </div>
        `;
    }

    function renderAttack(type) {
        const attackLabels = {
            'deauth':   { icon: '💀', label: 'DEAUTH', desc: 'Sending deauth frames...' },
            'beacon':   { icon: '📡', label: 'BEACON SPAM', desc: 'Broadcasting SSIDs...' },
            'rickroll': { icon: '🎵', label: 'RICKROLL', desc: 'Never gonna give you up...' },
            'probe':    { icon: '📨', label: 'PROBE FLOOD', desc: 'Flooding probe requests...' },
        };

        const info = attackLabels[type] || { icon: '⚡', label: type.toUpperCase(), desc: 'Attack in progress...' };

        content.innerHTML = `
            <div class="tft-attack">
                <div class="attack-icon">${info.icon}</div>
                <div class="attack-type">${info.label}</div>
                <div class="attack-status">● ACTIVE</div>
                <div class="attack-target">${info.desc}</div>
            </div>
        `;
    }

    function renderSniff(type, packets) {
        const sniffLabels = {
            'beacon':  { icon: '📶', label: 'Beacon Sniff' },
            'deauth':  { icon: '💀', label: 'Deauth Sniff' },
            'pmkid':   { icon: '🔑', label: 'PMKID Capture' },
            'pwn':     { icon: '⚡', label: 'PWN Sniff' },
            'esp':     { icon: '📻', label: 'ESP-NOW Sniff' },
            'bt':      { icon: '📶', label: 'BT Sniff' },
        };

        const info = sniffLabels[type] || { icon: '📡', label: type.toUpperCase() };

        content.innerHTML = `
            <div class="tft-sniff">
                <div class="sniff-icon">${info.icon}</div>
                <div class="sniff-type">${info.label}</div>
                <div class="sniff-status">Capturing packets...</div>
                <div class="packet-counter">${packets}</div>
                <div style="color:#444; font-size:8px;">packets captured</div>
            </div>
        `;
    }

    function renderBleSpam(type) {
        const typeLabels = {
            'all':     '📱 All Devices',
            'ios':     '🍎 iOS Spam',
            'android': '🤖 Android Spam',
            'samsung': '📱 Samsung Spam',
            'windows': '🪟 Windows Spam',
            'google':  '🔍 Google Spam',
        };

        content.innerHTML = `
            <div class="tft-attack">
                <div class="attack-icon">📡</div>
                <div class="attack-type" style="color: #b44dff;">BLE SPAM</div>
                <div class="attack-status" style="color: #d4a6ff;">● ACTIVE</div>
                <div class="attack-target">${typeLabels[type] || type}</div>
            </div>
        `;
    }

    function renderInfo(data) {
        const rows = Object.entries(data).map(([k, v]) => `
            <div class="info-row">
                <span>${k}</span>
                <span class="info-val">${v}</span>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="tft-info">
                <div class="info-title">System Info</div>
                ${rows}
            </div>
        `;
    }

    /* ══════════════════════════════════════════
       STATE MACHINE
       ══════════════════════════════════════════ */

    function setState(newState, data) {
        currentState = newState;
        clearPacketCounter();

        switch (newState) {
            case STATE.BOOT:
                renderBoot();
                break;

            case STATE.IDLE:
                renderIdle();
                break;

            case STATE.MENU:
                renderMenu(
                    data?.title || 'Main Menu',
                    data?.items || [
                        { icon: '📡', label: 'WiFi' },
                        { icon: '📶', label: 'Bluetooth' },
                        { icon: '⚙', label: 'Device' },
                        { icon: '📁', label: 'Files' },
                        { icon: '🔄', label: 'Update' },
                    ],
                    data?.active ?? 0
                );
                break;

            case STATE.SCAN_AP:
            case STATE.SCAN_STA:
            case STATE.SCAN_ALL:
            case STATE.SCAN_BT:
                scanCount = 0;
                scanResults = [];
                renderScan(newState, 0, []);
                break;

            case STATE.SNIFF:
                sniffType = data?.type || 'beacon';
                packetCount = 0;
                renderSniff(sniffType, 0);
                startPacketCounter();
                break;

            case STATE.ATTACK:
                attackType = data?.type || 'deauth';
                renderAttack(attackType);
                break;

            case STATE.BLE_SPAM:
                renderBleSpam(data?.type || 'all');
                break;

            case STATE.INFO:
                renderInfo(data || { 'Status': 'Connected', 'Device': 'ESP32 Marauder' });
                break;
        }

        updateStatusBar();
    }

    function updateStatusBar() {
        if (!statusText) return;
        const labels = {
            [STATE.BOOT]:     'Booting...',
            [STATE.IDLE]:     'Ready',
            [STATE.MENU]:     'Menu',
            [STATE.SCAN_AP]:  'Scanning APs',
            [STATE.SCAN_STA]: 'Scanning STAs',
            [STATE.SCAN_ALL]: 'Scanning All',
            [STATE.SCAN_BT]:  'Scanning BT',
            [STATE.SNIFF]:    'Sniffing',
            [STATE.ATTACK]:   'ATTACKING',
            [STATE.BLE_SPAM]: 'BLE Spam',
            [STATE.INFO]:     'System Info',
        };
        statusText.textContent = labels[currentState] || 'Ready';
    }

    function startPacketCounter() {
        clearPacketCounter();
        packetInterval = setInterval(() => {
            packetCount += Math.floor(Math.random() * 8) + 1;
            if (currentState === STATE.SNIFF) {
                renderSniff(sniffType, packetCount);
            }
        }, 800);
    }

    function clearPacketCounter() {
        if (packetInterval) {
            clearInterval(packetInterval);
            packetInterval = null;
        }
    }

    /* ══════════════════════════════════════════
       COMMAND PARSER — maps sent commands to display states
       ══════════════════════════════════════════ */

    function handleCommand(cmd) {
        const c = cmd.trim().toLowerCase();

        // ── Scans ──
        if (c === 'scanap')              return setState(STATE.SCAN_AP);
        if (c === 'scansta')             return setState(STATE.SCAN_STA);
        if (c === 'scanall')             return setState(STATE.SCAN_ALL);
        if (c === 'scanbt' || c.startsWith('sniffbt'))  return setState(STATE.SCAN_BT);

        // ── Stop ──
        if (c === 'stopscan' || c === 'stopattack') return setState(STATE.IDLE);

        // ── Sniffers ──
        if (c === 'sniffbeacon')         return setState(STATE.SNIFF, { type: 'beacon' });
        if (c === 'sniffdeauth')         return setState(STATE.SNIFF, { type: 'deauth' });
        if (c === 'sniffpmkid')          return setState(STATE.SNIFF, { type: 'pmkid' });
        if (c === 'sniffpwn')            return setState(STATE.SNIFF, { type: 'pwn' });
        if (c === 'sniffesp')            return setState(STATE.SNIFF, { type: 'esp' });
        if (c === 'sniffskim')           return setState(STATE.SNIFF, { type: 'bt' });

        // ── Attacks ──
        if (c.startsWith('attack')) {
            if (c.includes('deauth'))    return setState(STATE.ATTACK, { type: 'deauth' });
            if (c.includes('beacon'))    return setState(STATE.ATTACK, { type: 'beacon' });
            if (c.includes('rickroll'))  return setState(STATE.ATTACK, { type: 'rickroll' });
            if (c.includes('probe'))     return setState(STATE.ATTACK, { type: 'probe' });
            return setState(STATE.ATTACK, { type: 'unknown' });
        }

        // ── BLE Spam ──
        if (c.startsWith('blespam')) {
            const typeMatch = c.match(/-t\s+(\S+)/);
            return setState(STATE.BLE_SPAM, { type: typeMatch ? typeMatch[1] : 'all' });
        }

        // ── BT Wardrive ──
        if (c === 'btwardrive')          return setState(STATE.SCAN_BT);

        // ── System ──
        if (c === 'help' || c === 'info' || c === 'version' || c === 'settings') {
            return setState(STATE.INFO, {
                'Command': c,
                'Status': 'Processing...',
                'Device': 'ESP32 Marauder',
                'Serial': 'Web USB',
                'Baud': '115200',
            });
        }

        if (c === 'reboot') {
            setState(STATE.BOOT);
            return;
        }

        // ── List commands ──
        if (c.startsWith('list') || c.startsWith('select') || c.startsWith('clearlist') ||
            c.startsWith('ssid') || c.startsWith('channel') || c.startsWith('led') ||
            c.startsWith('pcap')) {
            // Brief flash of info screen, then back to idle
            setState(STATE.INFO, { 'Command': c, 'Status': 'Executed' });
            setTimeout(() => {
                if (currentState === STATE.INFO) setState(STATE.IDLE);
            }, 2000);
            return;
        }
    }

    /**
     * Parse serial output lines to update display
     * (e.g., scan results appearing, counts updating)
     */
    function handleSerialLine(line) {
        // Update scan count when we see AP/STA lines
        if (currentState === STATE.SCAN_AP || currentState === STATE.SCAN_ALL || currentState === STATE.SCAN_STA) {
            const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/);
            if (macMatch) {
                scanCount++;
                const nameMatch = line.match(/SSID[:\s]*(.+?)(?:\s*RSSI|\s*CH|\s*$)/i) ||
                                  line.match(/name[:\s=]*["']?([^"'\n\r,]+)/i);
                const rssiMatch = line.match(/RSSI[:\s=]*(-?\d+)/i) || line.match(/(-\d{2,3})\s*dBm/i);

                scanResults.push({
                    mac: macMatch[0],
                    name: nameMatch ? nameMatch[1].trim() : '',
                    rssi: rssiMatch ? rssiMatch[1] : '',
                });

                renderScan(currentState, scanCount, scanResults);
            }
        }

        // Update packet count for sniffers
        if (currentState === STATE.SNIFF) {
            if (line.length > 10) {
                packetCount++;
            }
        }
    }

    /* ══════════════════════════════════════════
       CONNECTION STATUS SYNC
       ══════════════════════════════════════════ */

    function setDisplayConnected(connected) {
        isConnected = connected;
        if (connDot) {
            connDot.classList.toggle('active', connected);
        }
        if (connected && currentState === STATE.IDLE) {
            // Show menu briefly on connect
            setState(STATE.MENU);
            setTimeout(() => {
                if (currentState === STATE.MENU) setState(STATE.IDLE);
            }, 2500);
        }
        if (!connected) {
            setState(STATE.IDLE);
        }
    }

    /* ══════════════════════════════════════════
       INIT & GLOBAL API
       ══════════════════════════════════════════ */

    // Expose API for control.js to call
    window.MarauderDisplay = {
        handleCommand,
        handleSerialLine,
        setConnected: setDisplayConnected,
    };

    // Boot sequence on load
    setState(STATE.BOOT);

})();
