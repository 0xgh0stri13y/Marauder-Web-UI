# Changelog

All notable changes to the Marauder Web UI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-11

### Added
- Integrated **Firmware Flasher** for multiple devices (Marauder, Bruce, nRFBox, ESP32-DIV, RF-Clown, Biscuit).
- Support for flashing directly from the browser using Web Serial.
- New clean directory structure (`/css/`, `/js/`, `/espflasher/`).
- Shared **Neon Obsidian** design system across all pages.
- Navigation links updated to use directory-based routing (clean URLs without `.html`).

### Changed
- Refactored entire codebase into modular CSS and JS files for better performance and maintainability.
- Updated Marauder v6.1 to v6 in the flasher manifest.
- Consolidated all firmware files into `/espflasher/firmware/`.
- Moved flasher interface to `/espflasher/index.html`.

### Removed
- Legacy single-file `flasher.html` and `espflasher.html`.
- Inline styles and scripts from main HTML files.

## [1.0.0] - 2025-12-15

### Added
- Initial release of ESP32 Marauder Web Control Interface
- Beautiful glassmorphic UI with purple gradient theme
- Web Serial API integration for direct browser-to-device communication
- Real-time terminal with auto-scroll and command history
- WiFi operations panel with quick-access buttons
- Bluetooth operations panel with BLE sniffing and spam attacks
- Attack commands panel with beacon spam, deauth, and probe flooding
- Helper commands for AP/Station selection and SSID management
- Auto-parsing BLE devices into interactive table
- RSSI color-coded indicators
- Responsive design for mobile and desktop
- Keyboard shortcuts for command history navigation
- Tooltips on all interactive elements
- One-click emergency stop button
- Terminal controls (clear, auto-scroll toggle)
- Custom SSID generator with user input
- Manual deauth attack with MAC address prompts
- BLE device table with clear functionality

### Features
- 50+ pre-configured command buttons
- Support for all ESP32 Marauder commands
- Real-time device discovery and listing
- Command history (stores last 50 commands)
- Auto-scroll terminal output
- Connection status indicator
- Cross-browser compatibility (Chrome, Edge, Opera)

## [Unreleased]

### Planned Features
- Screenshot capture for demonstration
- Export terminal logs to file
- Save/load custom SSID lists
- Attack presets and macros
- Dark/light theme toggle
- Statistics dashboard
- PCAP file management
- GPS coordinate display for wardrive mode

---

**Note**: This is the initial release. Future versions will be documented here as features are added and bugs are fixed.
