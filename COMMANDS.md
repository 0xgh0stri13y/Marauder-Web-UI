# ESP32 Marauder Command Reference

Quick reference for all commands supported by the ESP32 Marauder. Use these in the terminal input or click the corresponding buttons in the Web UI.

## Table of Contents
- [WiFi Scanning](#wifi-scanning)
- [WiFi Attacks](#wifi-attacks)
- [Bluetooth Operations](#bluetooth-operations)
- [Target Selection](#target-selection)
- [SSID Management](#ssid-management)
- [System Commands](#system-commands)

---

## WiFi Scanning

### Scan Commands
```bash
scanap              # Scan for Access Points
scansta             # Scan for Stations (clients)
scanall             # Scan for both APs and Stations
stopscan            # Stop current scan
```

### Sniffing Commands
```bash
sniffbeacon         # Sniff beacon frames
sniffdeauth         # Sniff deauth packets
sniffpmkid          # Sniff PMKID handshakes (for hashcat)
sniffpwn            # Sniff PWN packets
sniffesp            # Sniff ESP-NOW packets
```

### List Commands
```bash
list -a             # List scanned Access Points
list -s             # List scanned Stations
list -c             # List captured handshakes/PCAPs
```

---

## WiFi Attacks

### Beacon Spam
```bash
# Prerequisites: Generate or add SSIDs first

attack -t beacon -l      # Spam SSIDs from your custom list
attack -t beacon -r      # Spam random SSIDs
attack -t beacon -a      # Create fake copies of scanned APs
```

### Deauthentication
```bash
# Prerequisites: Scan and select targets first

attack -t deauth         # Deauth flood - disconnect everyone
attack -t deauth -c      # Targeted deauth - selected APs & Stations
attack -t deauth -s AA:BB:CC:DD:EE:FF -d 11:22:33:44:55:66
                        # Manual deauth with specific MACs
```

### Other Attacks
```bash
attack -t probe         # Probe request flood
attack -t rickroll      # Rickroll attack 🎵
attack -t badmsg        # Bad message attack
attack -t sleep         # Association sleep attack
```

### Stop Attacks
```bash
stopscan               # Stop any running attack
```

---

## Bluetooth Operations

### BLE Sniffing
```bash
sniffbt -t all         # Sniff all BLE devices
sniffbt -t airtag      # Detect Apple AirTags
sniffbt -t flipper     # Detect Flipper Zero devices
sniffskim              # Detect credit card skimmers
```

### BLE Spam Attacks
```bash
blespam -t all         # Spam all BLE types
blespam -t ios         # Spam iOS devices (AirPods popup)
blespam -t android     # Spam Android Fast Pair
blespam -t samsung     # Spam Samsung Buds
blespam -t windows     # Spam Windows Swift Pair
blespam -t google      # Spam Google Fast Pair
```

### Bluetooth Wardriving
```bash
btwardrive             # Start Bluetooth wardriving (requires GPS)
```

---

## Target Selection

### Select Access Points
```bash
select -a              # Select ALL Access Points
select -a 0,1,2,5      # Select specific APs by ID
select -a 0-10         # Select range of APs
```

### Select Stations
```bash
select -s              # Select ALL Stations
select -s 0,1,3        # Select specific Stations by ID
select -s 0-5          # Select range of Stations
```

### Clear Selections
```bash
clearlist -a           # Clear AP selections
clearlist -s           # Clear Station selections
```

---

## SSID Management

### Generate SSIDs
```bash
ssid -a -g -n 20       # Generate 20 random SSIDs
ssid -a -g -n 50       # Generate 50 random SSIDs
ssid -a -g -n 100      # Generate 100 random SSIDs
```

Generated SSIDs include templates like:
- FBI_VAN_####
- NSA_SURVEILLANCE_####
- WiFi Security Test ####
- Free Public WiFi
- ...and more!

### Add Custom SSID
```bash
ssid -a -n "MyCustomSSID"          # Add single SSID
ssid -a -n "Test Network"          # Spaces are OK
```

### Remove SSIDs
```bash
ssid -r                # Remove all SSIDs from list
```

---

## System Commands

### Information
```bash
help                   # Show all available commands
info                   # Show device information
version                # Show firmware version
```

### Settings
```bash
settings               # Show current settings
channel -s 1           # Set WiFi channel (1-14)
channel -g             # Get current channel
```

### File Operations
```bash
pcap list              # List saved PCAP files
pcap save              # Save current capture
pcap delete            # Delete PCAP files
```

### LED Control
```bash
led -s                 # Turn LED on
led -r                 # Turn LED off
led -r g b             # Set custom RGB color (0-255)
```

### Other
```bash
reboot                 # Reboot the ESP32
update                 # Check for firmware updates
```

---

## Advanced Examples

### Full Deauth Attack Workflow
```bash
scanap                 # 1. Scan for networks
list -a                # 2. See discovered APs
select -a 0,1,2        # 3. Select targets by ID
attack -t deauth       # 4. Launch deauth flood
# Wait for desired duration...
stopscan               # 5. Stop attack
```

### Beacon Spam with Custom Names
```bash
ssid -a -n "FBI Surveillance Van #4"
ssid -a -n "WiFi Security Test - Do Not Connect"
ssid -a -n "Free Public WiFi - No Password"
ssid -a -n "Martin Router King"
attack -t beacon -l    # Start spamming your custom list
stopscan               # Stop when done
```

### PMKID Capture for Offline Cracking
```bash
scanap                 # 1. Find target network
sniffpmkid             # 2. Start capturing handshakes
# Wait 1-5 minutes for handshake capture
stopscan               # 3. Stop sniffing
list -c                # 4. Check captured files
pcap save              # 5. Save to file
# Transfer PCAP to computer and crack with hashcat
```

### BLE Device Discovery
```bash
sniffbt -t all         # Start BLE scanning
# Devices will appear in the Web UI table automatically
# Let it run for 30+ seconds to discover nearby devices
stopscan               # Stop scanning
```

### iOS BLE Spam Shenanigans
```bash
blespam -t ios         # Spam iOS devices
# Nearby iPhones will get constant AirPod pairing popups 😈
# Press Ctrl+C or click Stop to end
```

---

## Tips & Tricks

### Command Shortcuts
- Press **↑** (Up Arrow) to recall previous commands
- Press **↓** (Down Arrow) to navigate command history
- Press **Enter** to execute command
- Use buttons for quick access to common commands

### Best Practices
1. **Always scan first** before attacking
2. **Select targets** to focus your attacks
3. **One attack at a time** - don't run multiple simultaneously
4. **Stop before switching** - always `stopscan` before new attack
5. **Monitor the terminal** - watch for errors or warnings

### Efficiency
- Use `-a` flag to select all instead of typing IDs
- Chain SSIDs: add multiple before beacon spam
- Save PCAPs regularly if capturing data
- Clear selections when switching attack types

### Safety
- ⚠️ **Test in isolated environment** - Use Faraday cage or isolated area
- ⚠️ **Get permission first** - Only test on networks you own
- ⚠️ **Document your tests** - Keep logs for authorized assessments
- ⚠️ **Stop when done** - Don't leave attacks running unattended

---

## Command Line Flags Reference

| Flag | Description | Example |
|------|-------------|---------|
| `-t` | Type/Target | `attack -t deauth` |
| `-a` | All/Add | `select -a` or `ssid -a` |
| `-s` | Source/Station | `select -s` or `attack -t deauth -s MAC` |
| `-d` | Destination | `attack -t deauth -d MAC` |
| `-c` | Combined/Captures | `attack -t deauth -c` or `list -c` |
| `-n` | Name/Number | `ssid -a -n "Name"` or `ssid -a -g -n 50` |
| `-g` | Generate/Get | `ssid -a -g` or `channel -g` |
| `-r` | Remove/Random | `ssid -r` or `attack -t beacon -r` |
| `-l` | List | `attack -t beacon -l` |

---

**For more detailed documentation, visit:**
- ESP32 Marauder Wiki: https://github.com/justcallmekoko/ESP32Marauder/wiki
- Web UI Guide: README.md

**Remember: Use responsibly and legally!** 🛡️
