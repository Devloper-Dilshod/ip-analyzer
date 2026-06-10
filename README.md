# IP Inspector

A lightweight, clean, and fast IP address lookup tool that inspects IPv4 and IPv6 addresses. It fetches detailed geolocation, network routing details, and integrates with public APIs to provide comprehensive country-level data.

**Live Demo:** [ip-analyzer.wwwi.uz](https://ip-analyzer.wwwi.uz)

---

## What it does

- **IP Lookup:** Instant queries for IPv4 and IPv6 addresses.
- **Geo-Location:** Displays the city, region, country, coordinates, and timezone of any target IP.
- **Network Data:** Inspects Autonomous System Numbers (ASN), Internet Service Providers (ISP), and CIDR ranges.
- **Country Facts Modal:** Fetches official names, languages spoken, national currencies, timezones, borders, and driving sides for any lookup country.
- **One-Click Detection:** Instantly fetches and analyzes your current public IP address.
- **Modern UI:** Features a unified, spotlight-style search bar and responsive design that fits all desktop and mobile screens perfectly.

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (using custom properties, grid/flex layouts, and smooth animations), and pure JavaScript. No bulky frameworks.
- **Backend:** A lightweight PHP script (`backend/api.php`) serving as a CORS-safe proxy to interface with:
  - [ipwho.is](https://ipwho.is/) for network and location lookups.
  - [restcountries.com](https://restcountries.com/) for detailed national metrics.

---

## Running Locally

To run this project on your machine, you just need a local PHP environment.

1. **Clone the project:**
   ```bash
   git clone <repo-url>
   cd <project-folder>
   ```

2. **Start the PHP server:**
   ```bash
   php -S localhost:3000
   ```

3. **Open the browser:**
   Go to [http://localhost:3000](http://localhost:3000).

---

## File Structure

```
.
├── backend/
│   └── api.php       # PHP proxy & backend resolver
├── index.html        # UI structure and components
├── script.js         # Fetch logic, state, and modal controller
├── style.css         # Custom stylesheet and layout system
└── README.md         # Documentation
```
