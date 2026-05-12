# ☠️ ESP32 Marauder Web Control Interface

A beautiful, modern web-based control center for the ESP32 Marauder WiFi/Bluetooth penetration testing tool. Control your ESP32 Marauder directly from your browser using the Web Serial API - no installation required!

🌐 **Access the Live App**: [https://0xgh0stri13y.github.io/Marauder-Web-UI/](https://0xgh0stri13y.github.io/Marauder-Web-UI/)

![ESP32 Marauder](https://img.shields.io/badge/ESP32-Marauder-purple)
![Web Serial API](https://img.shields.io/badge/Web_Serial-API-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 Modern UI/UX
- **Beautiful Glassmorphic Design** - Stunning purple gradient with smooth animations
- **Dark Mode** - Easy on the eyes for long hacking sessions
- **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- **Real-time Terminal** - Live command output with auto-scroll
- **Tooltips** - Helpful hints on every button

### 🔌 Web Serial Connection
- **No Drivers Required** - Direct browser-to-device communication
- **Plug and Play** - Just connect your ESP32 and click "Connect"
- **Auto-parsing** - Automatically detects and displays BLE devices
- **Command History** - Navigate previous commands with arrow keys

### 📡 WiFi Operations
- Scan Access Points, Stations, and All Devices
- Sniff Beacons, Deauth, PMKID, and PWN packets
- List discovered networks and captures
- Stop scans at any time

### ⚔️ Attack Commands
- **Beacon Spam** - Random, List-based, or AP Cloning
- **Deauth Attacks** - Flood, Targeted, or Manual
- **Probe Flooding** - Overwhelm APs with probe requests
- **Other Attacks** - Rickroll, BadMsg, Sleep attacks
- **One-click Stop** - Emergency stop for all attacks

### 🛰️ Bluetooth Operations
- **BLE Sniffing** - Detect AirTags, Flipper devices, credit card skimmers
- **BLE Spam** - Target iOS, Android, Samsung, Windows devices
- **Device Table** - Auto-populated with discovered BLE devices
- **Real-time RSSI** - Color-coded signal strength indicators

### 🛠️ Helper Tools
- Select specific APs/Stations or all at once
- Generate random SSIDs for beacon spam
- Add custom SSIDs to your list
- Clear all selections with one click

### 🌑 Null Loader (Standalone Flasher)
- **Zero Setup Flashing** - Flash ESP32 devices directly from your browser via Web Serial
- **Multi-Tool Support** - Instantly deploy Marauder, Bruce, nRFBox, ESP32-DIV, RF-Clown, and Biscuit
- **Smart Manifests** - Select your specific board variant and flash seamlessly
- **No Downloads** - Pulls the latest binaries directly via `esp-web-tools`
- **Access the Flasher** - Visit [null-loader.alensebastian.in](https://null-loader.alensebastian.in) to flash your devices.

## 🚀 Quick Start

### Prerequisites
- **ESP32 device** with Marauder firmware (or use our built-in flasher!)
- **Chrome, Edge, or Opera browser** (Web Serial API support required)
- **USB cable** to connect ESP32 to your computer

### Usage

1. **Open in Browser**
   - **Visit The Site:** Access the live application at [https://0xgh0stri13y.github.io/Marauder-Web-UI/](https://0xgh0stri13y.github.io/Marauder-Web-UI/)

2. **Connect Your Device**
   - Plug in your ESP32 via USB.
   - If your device is blank, click **"Null Loader"** in the navbar to install Marauder or other tools.
   - Once flashed, return to the **Control Center** and click **"Connect"**.
   - Select your device and start hacking! 🎯

## 📖 How to Use

### Basic Workflow

1. **Connect** - Click "Connect" and select your ESP32 device
2. **Scan** - Click "Scan AP" to discover nearby WiFi networks
3. **Select** - Use "Select APs" to choose targets
4. **Attack** - Choose your attack type (beacon spam, deauth, etc.)
5. **Stop** - Click "🛑 Stop Attack" when done

### Command Input

You can also type commands directly in the terminal input:
```
scanap          # Scan for access points
scansta         # Scan for stations
attack -t beacon -r    # Beacon spam with random SSIDs
attack -t deauth       # Deauth flood on selected APs
help            # Show all available commands
```

### Keyboard Shortcuts

- **Enter** - Send command
- **Arrow Up** - Previous command in history
- **Arrow Down** - Next command in history

## 🎯 Attack Examples

### Beacon Spam
```bash
# Generate 50 random SSIDs first
ssid -a -g -n 50

# Start beacon spam with your list
attack -t beacon -l

# Or spam random SSIDs
attack -t beacon -r
```

### Deauth Attack
```bash
# Scan networks first
scanap

# Select all APs
select -a

# Launch deauth flood
attack -t deauth

# Stop attack
stopscan
```

### BLE Spam
```bash
# Spam all BLE types
blespam -t all

# Target specific devices
blespam -t ios
blespam -t android
blespam -t samsung
```

## 🔧 Technical Details

- **HTML5 & CSS3** - Modern structured design
- **Vanilla JavaScript** - Clean, modular logic
- **Web Serial API** - Browser-to-device communication
- **ESP Web Tools** - Integrated firmware flashing engine

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Yes  |
| Edge    | ✅ Yes  |
| Opera   | ✅ Yes  |
| Firefox | ✅ Yes  |
| Safari  | ✅ Yes  |

*Note: Firefox and Safari don't support the Web Serial API*

### Serial Settings
- **Baud Rate**: 115200
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None

## ⚠️ Legal Disclaimer

**FOR EDUCATIONAL AND AUTHORIZED TESTING ONLY**

This tool is designed for:
- ✅ Authorized penetration testing
- ✅ Security research on your own devices
- ✅ Educational purposes

**DO NOT:**
- ❌ Attack networks you don't own or have permission to test
- ❌ Disrupt public WiFi or Bluetooth services
- ❌ Use for malicious purposes

Unauthorized use of this tool is **illegal** in most jurisdictions and may violate:
- Computer Fraud and Abuse Act (USA)
- Computer Misuse Act (UK)
- Similar laws in other countries

**The authors are NOT responsible for any misuse of this software.**

## 🐛 Troubleshooting

### "Web Serial API not supported" error
- Make sure you're using Chrome, Edge, or Opera
- Update your browser to the latest version
- Try enabling chrome://flags/#enable-experimental-web-platform-features

### Can't connect to ESP32
- Check USB cable (must support data, not just power)
- Try a different USB port
- Make sure ESP32 Marauder firmware is properly flashed
- Check that no other program (Arduino IDE, PlatformIO) is using the serial port

### No output in terminal
- Try disconnecting and reconnecting
- Press the reset button on your ESP32
- Check baud rate matches (115200)

### BLE devices not appearing in table
- Make sure you're running a BLE sniff command first
- The parser looks for MAC addresses in the output
- Check that your Marauder firmware supports BLE

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/0xgh0stri13y/marauder-web-ui/issues)

## 🌟 Acknowledgments

- **justcallmekoko** - Creator of ESP32 Marauder firmware
- **Web Serial API** - Making browser hardware access possible
- **ESP32 Community** - For all the amazing projects

## 📸 Screenshots

*Coming soon !*

---

**Made with ☠️ and 💜 by 0xgh0stri13y**

*Remember: With great power comes great responsibility. Hack responsibly!*
