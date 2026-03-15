# Mobile Security — Knowledge Base Summary

**Kategorie:** Application Security
**Subcategory:** Mobile
**Dokumente:** 6
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Mobile Application Security umfasst die Sicherheitsanalyse von Android- und iOS-Anwendungen — von statischer APK/IPA-Analyse bis zu dynamischer Laufzeitinstrumentierung.

## OWASP Mobile Top 10

| # | Kategorie |
|---|-----------|
| M1 | Improper Credential Usage |
| M2 | Inadequate Supply Chain Security |
| M3 | Insecure Authentication/Authorization |
| M4 | Insufficient Input/Output Validation |
| M5 | Insecure Communication |
| M6 | Inadequate Privacy Controls |
| M7 | Insufficient Binary Protections |
| M8 | Security Misconfiguration |
| M9 | Insecure Data Storage |
| M10 | Insufficient Cryptography |

## Android Security

### Statische Analyse
```bash
# APK dekompilieren
apktool d app.apk
jadx-gui app.apk

# Hardcoded Secrets suchen
grep -r "api_key\|password\|secret" smali/
grep -r "http://" smali/
```

### Dynamische Analyse
- **ADB** — Android Debug Bridge für Shell-Zugriff
- **Burp Suite + Android Proxy** — Traffic Interception
- **Frida** — JavaScript-basierte Laufzeitinstrumentierung

### Häufige Schwachstellen
- **Insecure Data Storage** — Klartextdaten in SharedPreferences/SQLite
- **Exported Activities** — Ungeschützte Activity-Exports im Manifest
- **Backup Enabled** — `android:allowBackup="true"` in AndroidManifest.xml
- **Weak Crypto** — MD5, ECB-Modus, hardcoded Keys

## iOS Security

### Statische Analyse
```bash
# IPA entpacken
unzip app.ipa

# Binary analysieren
otool -L Payload/App.app/App
class-dump Payload/App.app/App
```

### Dynamische Analyse
- **Objection** — Runtime Mobile Exploration (Frida-basiert)
- **Frida iOS** — Hook Swift/ObjC Methoden
- **Burp Suite + iOS Proxy** — Traffic Interception (SSL Pinning Bypass)

### SSL Pinning Bypass
```javascript
// Frida Script für iOS
ObjC.classes.NSURLSession.setDelegate_({...})
// oder mit objection:
objection -g App explore
ios sslpinning disable
```

## Frida — Universelles Instrumentierungsframework

```javascript
// Android: Hook Methode
Java.perform(function() {
    var Activity = Java.use('com.example.app.LoginActivity');
    Activity.checkPassword.implementation = function(pwd) {
        console.log('Password: ' + pwd);
        return true; // Bypass
    };
});
```

## Verwandte Dokumente

- `appsec/mobile/Android Application Penetration Testing.pdf`
- `appsec/mobile/Frida Instrumentation for Mobile Apps.pdf`
- `appsec/mobile/OWASP Mobile Top 10 Guide.pdf`
