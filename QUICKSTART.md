# Quick Setup Guide

Get started with the ESP32 Marauder Web UI in 5 minutes! ⚡

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **ESP32 device** (any variant)
- [ ] **ESP32 Marauder firmware** flashed on your device
  - Download from: https://github.com/justcallmekoko/ESP32Marauder
  - Or use: https://esp32.huhn.me/ for easy flashing
- [ ] **USB cable** that supports data (not just power)
- [ ] **Compatible browser** (Chrome, Edge, or Opera)
- [ ] **Basic WiFi/security knowledge**

## Step-by-Step Setup

### 1. Download the Web UI

**Option A: Clone the repository**
```bash
git clone https://github.com/yourusername/marauder-web-ui.git
cd marauder-web-ui
```

**Option B: Download ZIP**
- Click "Code" → "Download ZIP" on GitHub
- Extract the ZIP file to your preferred location

**Option C: Single file download**
- Download `index.html` directly
- That's all you need!

### 2. Flash ESP32 Marauder (if not already done)

**Easy Method - Web Flasher:**
1. Go to: https://esp32.huhn.me/
2. Connect your ESP32 via USB
3. Click "Flash" and follow instructions
4. Wait for completion (~2-5 minutes)

**Advanced Method - Build from source:**
```bash
git clone https://github.com/justcallmekoko/ESP32Marauder.git
cd ESP32Marauder
pio run -e marauder_v6 --target upload
```

### 3. Open the Web UI

**Simply open `index.html` in your browser:**

```bash
# On Windows
start index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

Or just **drag and drop** `index.html` into Chrome/Edge/Opera.

### 4. Connect to Your ESP32

1. **Plug in your ESP32** via USB
2. Click the **"Connect"** button (top right)
3. **Select your device** from the popup list:
   - Look for "USB Serial" or "CP210x" or "CH340"
   - If multiple devices appear, try unplugging other USB devices
4. Click **"Connect"**
5. Wait for **"Connected"** status indicator

### 5. Test Your Connection

Type or click these commands to verify everything works:

```bash
help        # Should display command list
scanap      # Should scan for WiFi networks
```

If you see output in the terminal, **you're ready to go!** 🎉

## Troubleshooting Common Issues

### "No compatible device found"

**Solutions:**
- Check USB cable (try a different one if available)
- Install USB drivers:
  - CP210x: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
  - CH340: http://www.wch-ic.com/downloads/CH341SER_ZIP.html
- Try a different USB port
- Restart your computer

### "Permission denied" or "Access denied"

**Solutions:**
- Close Arduino IDE, PlatformIO, or any serial monitor
- Close other browser tabs using Web Serial
- On Linux, add yourself to dialout group:
  ```bash
  sudo usermod -a -G dialout $USER
  # Then log out and back in
  ```

### "Web Serial API not supported"

**Solutions:**
- Use Chrome, Edge, or Opera (Firefox/Safari don't support it yet)
- Update your browser to the latest version
- Enable experimental features:
  - Chrome: `chrome://flags/#enable-experimental-web-platform-features`
  - Edge: `edge://flags/#enable-experimental-web-platform-features`

### Terminal shows gibberish characters

**Solutions:**
- Disconnect and reconnect
- Make sure baud rate is 115200 (should be automatic)
- Press the ESP32 reset button
- Try reflashing the Marauder firmware

### Commands don't execute

**Solutions:**
- Make sure you're connected (green dot in status)
- Check that terminal shows "> command" when you send commands
- Try typing `help` first to wake up the device
- Press ESP32 reset button and reconnect

## First Commands to Try

Once connected, try these commands in order:

```bash
# 1. Get help
help

# 2. Scan for WiFi networks
scanap

# 3. List discovered networks
list -a

# 4. Scan for Bluetooth devices
sniffbt -t all

# 5. Generate some fake SSIDs
ssid -a -g -n 20

# 6. Spam fake networks (ONLY ON YOUR OWN NETWORK!)
attack -t beacon -l

# 7. Stop the attack
stopscan
```

## Tips for Best Experience

### Performance
- **Close unused tabs** - Web Serial works best with fewer tabs open
- **Use USB 2.0 ports** - More reliable than USB 3.0 for some ESP32 boards
- **Disable antivirus temporarily** - Some AVs block serial communication

### Security
- **Only test on your own networks** - Seriously, it's illegal otherwise
- **Get permission in writing** - If testing for someone else
- **Use a VM for isolation** - Consider running browser in a virtual machine
- **Clear browser data** after sensitive testing

### Workflow
1. **Scan first** - Always scan before attacking
2. **Select targets** - Use "Select APs" button or `select -a` command
3. **One attack at a time** - Don't run multiple attacks simultaneously
4. **Stop before disconnect** - Always `stopscan` before disconnecting

## Next Steps

Now that you're set up:

1. 📖 Read the full [README.md](README.md) for all features
2. 🎯 Try different attack types responsibly
3. 🐛 Report bugs via GitHub Issues
4. 🤝 Contribute improvements via Pull Requests
5. ⭐ Star the repository if you find it useful!

## Need More Help?

- **GitHub Issues**: https://github.com/yourusername/marauder-web-ui/issues
- **ESP32 Marauder Docs**: https://github.com/justcallmekoko/ESP32Marauder/wiki
- **Discord Community**: [Join here]

---

**Happy hacking! Remember: With great power comes great responsibility.** 🕷️
