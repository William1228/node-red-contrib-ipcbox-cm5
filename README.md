# node-red-contrib-ipcbox-cm5

Custom Node-RED nodes for **Waveshare IPCBOX-CM5** (Raspberry Pi CM5 based Industrial Controller).  
These nodes provide high-performance, real-time monitoring and control for Digital Inputs (DI) and Digital Outputs (DO) by leveraging system-level `gpiod` tools.

## Key Features
- this noe is well-tested on **Ubuntu 24.04**
- **Real-time DI Monitoring**: Uses hardware interrupts (via `gpiomon`) for instant response.
- **Initial State Sync**: Automatically detects and outputs current DI status upon Node-RED startup.
- **Integrated Debounce**: Built-in software filtering to eliminate mechanical switch noise.
- **Zero Compilation**: No C++ build tools required, ensuring stability on modern Ubuntu/Debian kernels.

---

## 1. Prerequisites (System Tools)

Before installing this module, you must ensure that the `gpiod` library is installed on your system. Open your terminal and run:

```bash
sudo apt update
sudo apt install -y gpiod
```

---

## 2. GPIO Permission Setup (Crucial)
By default, Linux restricts hardware access to the root user. To allow Node-RED to control GPIOs, follow these steps to set up Udev Rules:
Create the GPIO group and add your user:
```bash
# 1. Create group named "gpio"
sudo groupadd -f gpio

# 2. add now user (eg.ubuntu) join to group named "gpio"
sudo usermod -aG gpio $USER

# 3. Change the group ownership of device files (Temporary, valid until next reboot)
sudo chgrp gpio /dev/gpiochip*
sudo chmod g+rw /dev/gpiochip*
```

Create a new Udev rule file:
```bash
sudo nano /etc/udev/rules.d/99-gpio.rules
```

Paste the following line into the file:
```text
SUBSYSTEM=="gpio", KERNEL=="gpiochip*", ACTION=="add", GROUP="gpio", MODE="0660"
```

Apply the changes and Reboot:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
# It is highly recommended to reboot the system
sudo reboot
```

---

## 3. Installation
Once the system is configured, you can install the nodes locally or from the Node-RED Palette Manager.
For Local Installation (using .tgz file):
```bash
cd ~/.node-red
npm install /path/to/node-red-contrib-ipcbox-cm5-1.0.0.tgz
```

---

## 4. Hardware Mapping Reference
The nodes are pre-configured for the IPCBOX-CM5 industrial board layout:
| Function | Node Label | BCM GPIO | Electrical Logic |
| :--- | :--- | :--- | :--- |
|Digital Input 1 | DI1 | 23 | Inverted (24V = 0 / Low) |
| Digital Input 2 | DI2 | 24 | Direct (24V = 1 / High) |
| Digital Output 1 | DO1 | 27 | Open-Collector |
| Digital Output 2 | DO2 | 22 | Open-Collector |
---

## 5. Usage
IPCBOX DI (Input Node)
- Debounce (ms): Set the time interval to filter out contact bounce from mechanical switches.
- Output: Returns msg.payload as true (Active/24V) or false (Inactive/Disconnected).
- Topic: Outputs as input/DI1 or input/DI2.
IPCBOX DO (Output Node)
- Input Payload: Accepts true/false, 1/0, or "ON"/"OFF".
- Hardware Action: Activating DO will pull the Open-Collector output to Ground (RGND).

---

# License
MIT License - Developed by Iden Tech.
