# IoT / OT Security — Knowledge Base Summary

**Kategorie:** IoT / OT Security
**Subcategory:** Industrial
**Dokumente:** 10
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

IoT/OT Security adressiert die Sicherheit von vernetzten Geräten (Internet of Things), industriellen Steuerungssystemen (ICS/SCADA) und Embedded Systems. Diese Systeme haben oft jahrelange Lebenszyklen und können selten gepatcht werden.

## IoT vs. OT vs. ICS/SCADA

| Begriff | Beschreibung |
|---------|-------------|
| **IoT** | Consumer/Enterprise vernetzte Geräte (Kameras, Sensoren, Router) |
| **OT** | Operational Technology: physische Prozesssteuerung |
| **ICS** | Industrial Control Systems (übergreifender Begriff) |
| **SCADA** | Supervisory Control and Data Acquisition |
| **PLC** | Programmable Logic Controller (z. B. Siemens S7) |
| **HMI** | Human-Machine Interface |
| **RTU** | Remote Terminal Unit |

## IoT Angriffsvektoren

### Firmware-Analyse
```bash
# Firmware extrahieren
binwalk -e firmware.bin

# Dateisystem mounten
mount -o loop rootfs.squashfs /mnt/fs

# Interessante Dateien suchen
grep -r "password\|admin\|root" /mnt/fs/etc/
grep -r "hard.coded\|default" /mnt/fs/
```

### Hardware-Angriffe
- **UART** — Serielle Debug-Konsole (oft root-Shell zugänglich)
- **JTAG** — Hardware-Debugging, Firmware-Dump, Memory-Analyse
- **SPI/I2C** — Flash-Speicher direkt auslesen
- **Side-Channel** — Power Analysis, Timing Attacks

### RF/Wireless
- **WiFi** — WPS, WPA2-Schwachstellen
- **Bluetooth/BLE** — Pairing-Schwachstellen, Sniffing
- **Zigbee** — Unverschlüsselte Kommunikation
- **Z-Wave** — Key Extraction
- **SDR** — Software-Defined Radio für RF-Analyse (RTL-SDR, HackRF)

## ICS/SCADA Security

### Industrielle Protokolle
| Protokoll | Port | Verwendung |
|-----------|------|-----------|
| **Modbus** | 502 | Weit verbreitet, keine Authentifizierung |
| **DNP3** | 20000 | US Energie/Wasser-Sektor |
| **PROFINET** | - | Siemens-Netzwerke |
| **EtherNet/IP** | 44818 | Allen-Bradley/Rockwell |
| **BACnet** | 47808 | Gebäudeautomation |

### Purdue-Modell (Netzwerksegmentierung)

```
Level 5: Enterprise Network
Level 4: Site Business Planning
─────────────────────────────
Level 3: Site Operations / DMZ
─────────────────────────────
Level 2: Control Network (HMI, Historian)
Level 1: Control Devices (PLC, RTU)
Level 0: Field Devices (Sensoren, Aktoren)
```

### Bekannte ICS-Malware
- **Stuxnet** — Siemens PLC, Uranzentrifugen (Iran 2010)
- **Industroyer/Crashoverride** — Ukrainisches Stromnetz 2016
- **TRITON/TRISIS** — Safety Instrumented Systems (Saudi-Arabien 2017)
- **Incontroller** — Modular ICS Attack Framework 2022

## Tools

| Tool | Zweck |
|------|-------|
| **Binwalk** | Firmware-Analyse |
| **Shodan** | IoT Device Discovery |
| **Wireshark + dissectors** | ICS-Protokoll-Analyse |
| **Modscan / Modpoll** | Modbus-Testing |
| **PLCscan** | PLC-Discovery |
| **OpenPLC** | PLC-Testumgebung |
| **GNURadio + RTL-SDR** | RF-Analyse |

## Normen

- **IEC 62443** — Industrielle Cybersecurity (Defense-in-Depth)
- **NERC CIP** — Nordamerikanische Energieinfrastruktur
- **NIST SP 800-82** — ICS Security Guide
- **OWASP IoT** — IoT Attack Surface Areas

## Verwandte Dokumente

- `iot-ot/industrial/IoT Penetration Testing Guide.pdf`
- `iot-ot/industrial/Firmware Extraction and Analysis.pdf`
- `iot-ot/industrial/SCADA and ICS Security.pdf`
- `iot-ot/industrial/UART JTAG Hardware Debugging.pdf`
