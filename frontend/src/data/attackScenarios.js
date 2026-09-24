// Master Scenarios Engine aligned with SIH 2026 PS 26153 Dossier (NTRO & NCIIPC)
// Telemetry benchmarks derived from CSE-CIC-IDS2018, CTU-13, and UNSW-NB15

export const BENCHMARK_DATASETS = [
  { id: 'CSE-CIC-IDS2018', name: 'CSE-CIC-IDS2018 (Primary)', flows: '2.8M flows', source: 'Univ. of New Brunswick', role: 'Supervised transition-dynamics training' },
  { id: 'CTU-13', name: 'CTU-13 Botnet (Generalisation)', flows: '13 scenarios / 76.8M pkts', source: 'CTU University Prague', role: 'Held-out cross-dataset generalisation' },
  { id: 'UNSW-NB15', name: 'UNSW-NB15 (Synthetic)', flows: '257k flows / 49 features', source: 'ACCS Cyber Lab', role: 'Multi-family structural test' }
];

export const NCIIPC_SECTORS = [
  {
    id: 'power',
    name: 'Power & Energy',
    icon: 'Zap',
    threatExposure: 'High',
    leadTimeAdvantage: '+4.8 mins',
    impactDesc: 'Pre-empts SCADA/OT network infiltration before PLC control commands are reached. Directly addresses documented Mumbai (2020) & Ladakh (2022) power-grid targeting patterns.',
    primaryAssets: 'IEC-60870-5-104 / Modbus RTUs, Substation Gateways'
  },
  {
    id: 'bfsi',
    name: 'Banking & Financial (BFSI)',
    icon: 'Building2',
    threatExposure: 'Critical',
    leadTimeAdvantage: '+6.2 mins',
    impactDesc: 'Early isolation of credential stuffing and Kerberoasting chains prior to SWIFT / core banking database exfiltration, feeding CERT-In CSIRT-Fin situational feeds.',
    primaryAssets: 'Core Banking API, Payment Switches, Active Directory'
  },
  {
    id: 'telecom',
    name: 'Telecommunications',
    icon: 'Radio',
    threatExposure: 'High',
    leadTimeAdvantage: '+3.5 mins',
    impactDesc: 'Halts multi-vector volumetric DDoS & BGP hijack vectors before carrier-grade peering links saturate and cascade into dependent economic sectors.',
    primaryAssets: 'SS7 / Diameter Core, Edge Routers, DNS Authoritative'
  },
  {
    id: 'transport',
    name: 'Transport & Logistics',
    icon: 'Truck',
    threatExposure: 'Medium',
    leadTimeAdvantage: '+5.1 mins',
    impactDesc: 'Protects networked railway signalling, port cargo automation, and air traffic telemetry from ransomware disruptions.',
    primaryAssets: 'Rail Interlocking, Vessel Traffic Systems, Ticketing DB'
  },
  {
    id: 'government',
    name: 'Government & E-Governance',
    icon: 'Landmark',
    threatExposure: 'Critical',
    leadTimeAdvantage: '+7.4 mins',
    impactDesc: 'Enforces compliance with CERT-In June 2023 directives, shielding national digital identity and state registry servers from lateral exfiltration.',
    primaryAssets: 'UIDAI/DigiLocker Enclaves, NIC State Data Centers'
  },
  {
    id: 'strategic',
    name: 'Strategic & Public Enterprises',
    icon: 'Shield',
    threatExposure: 'High',
    leadTimeAdvantage: '+4.2 mins',
    impactDesc: 'Defence-in-depth for defence PSUs, nuclear/space research networks requiring strict offline air-gap telemetry analysis with zero cloud reliance.',
    primaryAssets: 'Air-Gapped CAD Repositories, Telemetry Servers'
  }
];

export const SCENARIOS = {
  slow_scan: {
    id: "slow_scan",
    name: "Low-and-Slow Recon → Lateral SMB Spread",
    badge: "APT Stealth Recon",
    category: "Recon & Lateral",
    benchmarkDataset: "CSE-CIC-IDS2018",
    description: "Low-frequency stealth TCP SYN reconnaissance designed to evade static thresholds, transitioning to SMB lateral movement and Pass-the-Hash.",
    initialStep: 5,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1595.001", name: "Port Scanning (Low-and-Slow)", stage: 0, detail: "Low-rate SYN probes (1 pkt/5s) across ports 22, 80, 445, 3389 with random IAT jitter", port: "Multi-Port", tti: "Completed" },
      { id: "T1190", name: "Exploit Public-Facing App", stage: 1, detail: "CVE-2023-38831 Web App remote code execution payload execution", port: "443/TCP", tti: "Active (Now)" },
      { id: "T1021.002", name: "SMB/Windows Admin Shares", stage: 2, detail: "Pass-the-Hash & PsExec lateral movement targeting internal SQL server", port: "445/TCP", tti: "Predicted (T+2.5m)" },
      { id: "T1071.001", name: "Encrypted DNS/DoH C2", stage: 3, detail: "DNS-over-HTTPS beaconing with high entropy payload to external IP 185.220.101.4", port: "53/UDP", tti: "Predicted (T+5.0m)" },
      { id: "T1041", name: "Exfiltration Over C2 Channel", stage: 4, detail: "Staged database archive exfiltration chunked to evade flow volume alarms", port: "443/TCP", tti: "Dormant (T+8.0m)" }
    ]
  },
  syn_flood: {
    id: "syn_flood",
    name: "SYN Surge Reconnaissance & Volumetric Cover",
    badge: "High-Volume Volumetric",
    category: "DDoS & Evasion",
    benchmarkDataset: "CSE-CIC-IDS2018",
    description: "High-volume TCP SYN flood saturating edge firewall state tables to cloak concurrent RDP brute-force credential attacks.",
    initialStep: 8,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1595.002", name: "Vulnerability Scanning", stage: 0, detail: "Automated banner grabbing across edge gateway IP range", port: "80, 443", tti: "Completed" },
      { id: "T1498.001", name: "Direct Network SYN Flood", stage: 1, detail: "Spoofed source IPs exhausting connection state tables (>120k pps)", port: "80/TCP", tti: "Active (Now)" },
      { id: "T1110.003", name: "Password Spraying via RDP", stage: 2, detail: "Distributed credential attempts against Admin workstation during DDoS storm", port: "3389/TCP", tti: "Predicted (T+1.5m)" },
      { id: "T1090.003", name: "Multi-hop Proxy C2", stage: 3, detail: "TOR routing tunnel initialization from compromised host", port: "9001/TCP", tti: "Predicted (T+4.0m)" },
      { id: "T1567.002", name: "Exfiltration to Cloud Storage", stage: 4, detail: "Scripted multi-part upload of corporate tokens to external S3 endpoint", port: "443/TCP", tti: "Dormant" }
    ]
  },
  held_out_botnet: {
    id: "held_out_botnet",
    name: "Held-Out Zero-Day Botnet (CTU-13 Neris)",
    badge: "Generalisation Test (Unseen)",
    category: "Zero-Day Botnet",
    benchmarkDataset: "CTU-13 (Held-out family)",
    description: "Evaluates model generalisation on an attack family deliberately withheld during training: real Neris botnet C2 beaconing & IRC coordination.",
    initialStep: 7,
    maxSteps: 20,
    heldOutFamily: true,
    mitreTechniques: [
      { id: "T1590", name: "Gather Network Info", stage: 0, detail: "Quiet ICMP sweep and NetBIOS name resolution query bursts", port: "137/UDP", tti: "Completed" },
      { id: "T1078", name: "Valid Accounts Infiltration", stage: 1, detail: "Stolen credential replay over SMB without brute-force signature", port: "445/TCP", tti: "Active (Now)" },
      { id: "T1059.001", name: "PowerShell Staging", stage: 2, detail: "In-memory dropper script communicating over non-standard port 6667 (IRC)", port: "6667/TCP", tti: "Predicted (T+2.0m)" },
      { id: "T1071.004", name: "DNS/IRC Botnet C2", stage: 3, detail: "Fast-flux domain generation algorithm (DGA) heartbeat signals", port: "53/UDP", tti: "Predicted (T+4.5m)" },
      { id: "T1485", name: "Data Destruction / DDoS Relay", stage: 4, detail: "Slave node activation for outbound synchronized packet reflection", port: "ANY", tti: "Dormant" }
    ]
  },
  ransomware: {
    id: "ransomware",
    name: "Multi-Stage Ransomware Kill-Chain (MS17-010)",
    badge: "Critical APT Infiltration",
    category: "Ransomware & Kill-Chain",
    benchmarkDataset: "CSE-CIC-IDS2018",
    description: "Replicating the quiet multi-day build-up behind major hospital/enterprise incidents: EternalBlue SMB exploit followed by shadow copy deletion and staging.",
    initialStep: 11,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1046", name: "Service Discovery", stage: 0, detail: "Null-session SMB querying across RFC1918 subnets", port: "445/TCP", tti: "Completed" },
      { id: "T1210", name: "Exploitation of Remote Services", stage: 1, detail: "MS17-010 EternalBlue buffer overflow on internal DB server", port: "445/TCP", tti: "Completed" },
      { id: "T1021.002", name: "Lateral Spread across Subnets", stage: 2, detail: "Spreading DoublePulsar backdoor to Domain Controller", port: "445/TCP", tti: "Active (Now)" },
      { id: "T1486", name: "Data Encrypted for Impact", stage: 3, detail: "AES-256 batch file encryption targeting SQL database and user directories", port: "Local", tti: "Predicted (T+1.2m)" },
      { id: "T1048", name: "Exfiltration Over Alternate Protocol", stage: 4, detail: "FTP transfer of encryption keys to offshore server", port: "21/TCP", tti: "Predicted (T+3.0m)" }
    ]
  },
  scada_intrusion: {
    id: "scada_intrusion",
    name: "Power Grid SCADA / Modbus OT Infiltration",
    badge: "Critical Infrastructure",
    category: "ICS / SCADA / OT",
    benchmarkDataset: "CSE-CIC-IDS2018 + Modbus-PCAP",
    description: "Targeted reconnaissance against electrical substation RTUs and Modbus TCP controllers. Pre-empts malicious coil overrides before grid disconnection.",
    initialStep: 6,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T0885", name: "Common Industrial Protocol Discovery", stage: 0, detail: "Querying Modbus TCP Port 502 Unit Identifiers and holding register maps", port: "502/TCP", tti: "Completed" },
      { id: "T0886", name: "Remote System Discovery (SCADA HMI)", stage: 1, detail: "Probing engineering workstation for default vendor web interfaces", port: "8080/TCP", tti: "Active (Now)" },
      { id: "T0843", name: "Program Download / Firmware Flash", stage: 2, detail: "Unauthenticated write command execution (Function 16) to substation PLC", port: "502/TCP", tti: "Predicted (T+2.1m)" },
      { id: "T0855", name: "Unauthorized Command Message", stage: 3, detail: "Tripping transmission circuit breaker coils to induce regional grid imbalance", port: "502/TCP", tti: "Predicted (T+4.8m)" },
      { id: "T0831", name: "Manipulation of View", stage: 4, detail: "False state spoofing on HMI screens to blind human grid operators", port: "102/TCP", tti: "Dormant" }
    ]
  },
  cloud_credential_api: {
    id: "cloud_credential_api",
    name: "BFSI API Gateway Token Forgery & Exfiltration",
    badge: "BFSI Core Banking",
    category: "API & Identity",
    benchmarkDataset: "UNSW-NB15 Synthetic Feeds",
    description: "Stealthy credential stuffing against Open Banking OAuth endpoints, JWT token forgery, and low-volume encrypted micro-chunk data exfiltration.",
    initialStep: 9,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1110.004", name: "Credential Stuffing on Auth APIs", stage: 0, detail: "Rotating residential proxy pool hitting /oauth/v2/token at 3 req/sec", port: "443/TCP", tti: "Completed" },
      { id: "T1552.001", name: "Credentials In Files & Key Vaults", stage: 1, detail: "Harvesting RS256 private keys from misconfigured staging bucket", port: "443/TCP", tti: "Active (Now)" },
      { id: "T1606.002", name: "SAML/JWT Token Forgery (Golden SAML)", stage: 2, detail: "Minting administrative access tokens for internal Core Banking switch", port: "Internal API", tti: "Predicted (T+1.8m)" },
      { id: "T1213", name: "Data from Information Repositories", stage: 3, detail: "Batch query export of transaction ledger and customer PII records", port: "5432/TCP", tti: "Predicted (T+4.2m)" },
      { id: "T1567.001", name: "Exfiltration to Web Service", stage: 4, detail: "Encrypted micro-burst transfers disguised as normal cloud webhook calls", port: "443/TCP", tti: "Dormant" }
    ]
  },
  supply_chain_dll: {
    id: "supply_chain_dll",
    name: "SolarWinds-Style Supply Chain & DLL Hijack",
    badge: "Strategic Enterprises",
    category: "Supply Chain",
    benchmarkDataset: "CSE-CIC-IDS2018",
    description: "Compromised third-party network monitoring package initiating dormant DLL sideloading and delayed DGA C2 check-ins.",
    initialStep: 8,
    maxSteps: 20,
    heldOutFamily: true,
    mitreTechniques: [
      { id: "T1195.002", name: "Compromise Software Supply Chain", stage: 0, detail: "Digitally signed malicious update deployed via vendor orchestration agent", port: "443/TCP", tti: "Completed" },
      { id: "T1574.002", name: "DLL Side-Loading (SolarOrion)", stage: 1, detail: "Legitimate service binary loading malicious companion DLL in memory", port: "Local", tti: "Active (Now)" },
      { id: "T1071.004", name: "DNS Dynamic Domain DGA Beaconing", stage: 2, detail: "Pseudo-random subdomains queried at 12-minute intervals to evade threshold IDS", port: "53/UDP", tti: "Predicted (T+3.0m)" },
      { id: "T1087.002", name: "Domain Account Enumeration", stage: 3, detail: "Stealthy LDAP enumeration queries for Enterprise Admin security groups", port: "389/TCP", tti: "Predicted (T+5.5m)" },
      { id: "T1048", name: "Covert Tunneling Over WebDAV", stage: 4, detail: "Packaging architecture schematics into encrypted multipart HTTP PUTs", port: "80/TCP", tti: "Dormant" }
    ]
  },
  telecom_bgp_hijack: {
    id: "telecom_bgp_hijack",
    name: "Telecom Peering BGP Route Hijack & Mirai Wave",
    badge: "Telecommunications",
    category: "Carrier Infrastructure",
    benchmarkDataset: "CTU-13 Mirai Scenarios",
    description: "Malicious BGP route announcements combined with synchronized Mirai botnet reflection floods overwhelming carrier gateway transit links.",
    initialStep: 10,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1596", name: "Search Open Technical Databases", stage: 0, detail: "Scraping peering DB and looking glass routers for vulnerable ASN peers", port: "179/TCP", tti: "Completed" },
      { id: "T1499.004", name: "BGP Route Poisoning / Hijack", stage: 1, detail: "Unauthorized /24 prefix announcement intercepting upstream DNS traffic", port: "179/TCP", tti: "Active (Now)" },
      { id: "T1498.002", name: "Reflection Amplification (NTP/SSDP)", stage: 2, detail: "Coordinated Mirai botnet firing monlist amplification at 180 Gbps", port: "123/UDP", tti: "Predicted (T+1.5m)" },
      { id: "T1557", name: "Adversary-in-the-Middle (AitM)", stage: 3, detail: "Diverting re-routed core banking and government traffic through adversary tap", port: "Edge", tti: "Predicted (T+3.8m)" },
      { id: "T1499", name: "Endpoint Denial of Service", stage: 4, detail: "Border gateway router CPU exhaustion causing routing table flap across region", port: "Core", tti: "Dormant" }
    ]
  },
  normal: {
    id: "normal",
    name: "Clean Baseline Normal Network Telemetry",
    badge: "Baseline Normal",
    category: "Benign Enterprise",
    benchmarkDataset: "CSE-CIC-IDS2018 Benign Slices",
    description: "Normal enterprise operations: TLS 1.3 HTTPS browsing, DNS queries, Active Directory Kerberos auth, NTP synchronization.",
    initialStep: 4,
    maxSteps: 20,
    heldOutFamily: false,
    mitreTechniques: [
      { id: "T1046", name: "Health Discovery Check", stage: 0, detail: "Internal Nagios / Prometheus network monitoring probes", port: "80/TCP", tti: "Dormant" },
      { id: "T1190", name: "Legitimate Web Traffic", stage: 1, detail: "Standard HTTPS browsing to verified corporate portals", port: "443/TCP", tti: "Dormant" },
      { id: "T1021", name: "Authorized RDP Maintenance", stage: 2, detail: "Scheduled SysAdmin maintenance via bastion host with MFA", port: "3389/TCP", tti: "Dormant" },
      { id: "T1071", name: "Cloud API Telemetry", stage: 3, detail: "Encrypted metrics push to internal monitoring nodes", port: "443/TCP", tti: "Dormant" },
      { id: "T1041", name: "Routine Scheduled Backup", stage: 4, detail: "Nightly incremental database snapshot transfer", port: "443/TCP", tti: "Dormant" }
    ]
  }
};

// Generate realistic step data dynamically based on step index t, scenario ID, and mitigation state
export function getStepData(scenarioId, stepIndex, isMitigated = false) {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.slow_scan;
  const t = Math.min(Math.max(0, stepIndex), scenario.maxSteps);

  // Baseline multiplier according to step trajectory
  let baseRisk = 0;
  if (scenarioId === 'slow_scan') {
    baseRisk = Math.min(96, 18 + t * 4.9);
  } else if (scenarioId === 'syn_flood') {
    baseRisk = Math.min(99, 14 + Math.pow(t, 1.4) * 2.3);
  } else if (scenarioId === 'held_out_botnet') {
    baseRisk = Math.min(94, 22 + t * 4.6);
  } else if (scenarioId === 'ransomware') {
    baseRisk = Math.min(99.5, 28 + Math.pow(t, 1.5) * 2.9);
  } else if (scenarioId === 'scada_intrusion') {
    baseRisk = Math.min(98.8, 20 + t * 5.2);
  } else if (scenarioId === 'cloud_credential_api') {
    baseRisk = Math.min(97.2, 16 + t * 4.8);
  } else if (scenarioId === 'supply_chain_dll') {
    baseRisk = Math.min(95.5, 12 + t * 4.4);
  } else if (scenarioId === 'telecom_bgp_hijack') {
    baseRisk = Math.min(99.9, 25 + Math.pow(t, 1.3) * 3.1);
  } else {
    // Normal traffic
    baseRisk = 6 + Math.sin(t * 0.5) * 3;
  }

  // Apply zero-trust mitigation containment effect if user engaged isolation protocol
  if (isMitigated) {
    baseRisk = Math.max(4, baseRisk * 0.16 - 3);
  }

  // Mandatory Logistic Regression baseline comparison value at this step
  // Per Part 4.5 of Dossier: Baseline is static per-flow and completely misses early low-and-slow recon!
  let baselineRisk = 0;
  if (scenarioId === 'normal') {
    baselineRisk = 4 + Math.random() * 2;
  } else if (t < 7) {
    baselineRisk = 8 + t * 1.5;
  } else if (t < 13) {
    baselineRisk = 45 + (t - 7) * 6.5;
  } else {
    baselineRisk = 88 + (t - 13) * 1.2;
  }
  if (isMitigated) baselineRisk = Math.max(5, baselineRisk * 0.3);

  // Historical Risk curve (last 10 windows: T-9 to T-0)
  const historical = [];
  const attentionWeights = [];
  for (let i = 9; i >= 0; i--) {
    const historicalT = Math.max(0, t - i);
    let hRisk = 0;
    if (scenarioId === 'slow_scan') {
      hRisk = Math.min(96, 18 + historicalT * 4.9);
    } else if (scenarioId === 'syn_flood') {
      hRisk = Math.min(99, 14 + Math.pow(historicalT, 1.4) * 2.3);
    } else if (scenarioId === 'held_out_botnet') {
      hRisk = Math.min(94, 22 + historicalT * 4.6);
    } else if (scenarioId === 'ransomware') {
      hRisk = Math.min(99.5, 28 + Math.pow(historicalT, 1.5) * 2.9);
    } else if (scenarioId === 'scada_intrusion') {
      hRisk = Math.min(98.8, 20 + historicalT * 5.2);
    } else if (scenarioId === 'cloud_credential_api') {
      hRisk = Math.min(97.2, 16 + historicalT * 4.8);
    } else if (scenarioId === 'supply_chain_dll') {
      hRisk = Math.min(95.5, 12 + historicalT * 4.4);
    } else if (scenarioId === 'telecom_bgp_hijack') {
      hRisk = Math.min(99.9, 25 + Math.pow(historicalT, 1.3) * 3.1);
    } else {
      hRisk = 6 + Math.sin(historicalT * 0.5) * 3;
    }
    if (isMitigated && i < 3) {
      hRisk = hRisk * 0.25;
    }

    const attWeight = Number((0.04 + (i === 0 ? 0.32 : i === 1 ? 0.22 : i === 2 ? 0.14 : (9 - i) * 0.03)).toFixed(3));
    attentionWeights.push({ window: `W(t-${i})`, weight: attWeight, label: `T-${i}` });

    historical.push({
      time: `T-${i}`,
      risk: Number(hRisk.toFixed(1)),
      baselineRisk: Number(Math.max(2, (hRisk * (i > 4 ? 0.3 : 0.8))).toFixed(1)),
      confidenceLower: Number(Math.max(0, hRisk - 3.2 - Math.random() * 1.5).toFixed(1)),
      confidenceUpper: Number(Math.min(100, hRisk + 3.2 + Math.random() * 1.5).toFixed(1))
    });
  }

  // Forecast Risk curve (future K=5 windows: T+1 to T+5)
  const forecast = [];
  for (let f = 1; f <= 5; f++) {
    const futureT = t + f;
    let fRisk = 0;
    if (isMitigated) {
      fRisk = Math.max(3, baseRisk * (1 - f * 0.14));
    } else if (scenarioId === 'slow_scan') {
      fRisk = Math.min(98, baseRisk + f * 5.4);
    } else if (scenarioId === 'syn_flood') {
      fRisk = Math.min(99.8, baseRisk + f * 6.8);
    } else if (scenarioId === 'held_out_botnet') {
      fRisk = Math.min(96, baseRisk + f * 4.8);
    } else if (scenarioId === 'ransomware') {
      fRisk = Math.min(99.9, baseRisk + f * 7.6);
    } else if (scenarioId === 'scada_intrusion') {
      fRisk = Math.min(99.4, baseRisk + f * 6.2);
    } else if (scenarioId === 'cloud_credential_api') {
      fRisk = Math.min(98.5, baseRisk + f * 5.8);
    } else if (scenarioId === 'supply_chain_dll') {
      fRisk = Math.min(97.0, baseRisk + f * 5.1);
    } else if (scenarioId === 'telecom_bgp_hijack') {
      fRisk = Math.min(100, baseRisk + f * 7.2);
    } else {
      fRisk = 6 + Math.sin(futureT * 0.5) * 2.5;
    }

    const bandWidth = isMitigated ? 2.5 + f * 0.8 : 3.8 + f * 2.2;
    forecast.push({
      time: `T+${f}`,
      predictedRisk: Number(fRisk.toFixed(1)),
      baselineRisk: null,
      ciLower: Number(Math.max(0, fRisk - bandWidth).toFixed(1)),
      ciUpper: Number(Math.min(100, fRisk + bandWidth).toFixed(1))
    });
  }

  // Infiltration probability score & status badge
  const infiltrationProb = isMitigated 
    ? Number((baseRisk * 0.75).toFixed(1))
    : Number(Math.min(99.4, baseRisk * 1.04).toFixed(1));

  let riskTier = 'Low';
  if (infiltrationProb > 72) riskTier = 'Critical';
  else if (infiltrationProb > 42) riskTier = 'Warning';

  // Lead-time gain in minutes before breach completion
  const leadTimeMinutes = scenarioId === 'normal' 
    ? '0.0m (Nominal)' 
    : isMitigated 
      ? 'Contained' 
      : `+${(Math.max(1.2, 5.8 - (t / 20) * 4.2)).toFixed(1)} mins`;

  // MITRE 5-Stage Progression
  let mitreStages = [];
  if (scenarioId === 'normal') {
    mitreStages = [
      { name: "Reconnaissance", status: "Dormant", percent: 4 },
      { name: "Initial Access", status: "Dormant", percent: 2 },
      { name: "Lateral Movement", status: "Dormant", percent: 1 },
      { name: "Command & Control", status: "Dormant", percent: 0 },
      { name: "Exfiltration", status: "Dormant", percent: 0 }
    ];
  } else if (isMitigated) {
    mitreStages = [
      { name: "Reconnaissance", status: "Completed", percent: 100 },
      { name: "Initial Access", status: "Contained", percent: 38 },
      { name: "Lateral Movement", status: "Blocked", percent: 8 },
      { name: "Command & Control", status: "Blocked", percent: 0 },
      { name: "Exfiltration", status: "Blocked", percent: 0 }
    ];
  } else {
    const p1 = Math.min(100, Math.round(t * 13));
    const p2 = Math.min(100, Math.max(0, Math.round((t - 3) * 11)));
    const p3 = Math.min(100, Math.max(0, Math.round((t - 6) * 10)));
    const p4 = Math.min(100, Math.max(0, Math.round((t - 9) * 9)));
    const p5 = Math.min(100, Math.max(0, Math.round((t - 12) * 8)));

    mitreStages = [
      { name: "Reconnaissance", status: p1 >= 100 ? "Completed" : "Active", percent: p1 },
      { name: "Initial Access", status: p2 >= 100 ? "Completed" : p2 > 0 ? "Active" : "Predicted", percent: p2 },
      { name: "Lateral Movement", status: p3 >= 100 ? "Completed" : p3 > 0 ? "Active" : p2 > 50 ? "Predicted" : "Dormant", percent: p3 },
      { name: "Command & Control", status: p4 >= 100 ? "Completed" : p4 > 0 ? "Active" : p3 > 40 ? "Predicted" : "Dormant", percent: p4 },
      { name: "Exfiltration", status: p5 >= 100 ? "Completed" : p5 > 0 ? "Active" : p4 > 30 ? "Predicted" : "Dormant", percent: p5 }
    ];
  }

  // Dual-Level SHAP Feature Attributions (Flow-level + Packet-level)
  let shapFeatures = [];
  if (scenarioId === 'slow_scan') {
    shapFeatures = [
      { feature: "Port 445/3389 Sweep Rate", tier: "Flow-Level", impact: isMitigated ? 7 : Math.min(42, 16 + t * 1.5), value: `${(12 + t * 3.4).toFixed(1)} flows/min`, category: "Recon" },
      { feature: "SYN Flag Variance Δ", tier: "Flow-Level", impact: isMitigated ? 5 : Math.min(38, 11 + t * 1.3), value: "+38.4% Δ", category: "TCP Flags" },
      { feature: "Packet IAT Deviation (ms)", tier: "Packet-Level", impact: isMitigated ? 4 : Math.min(31, 14 + t * 1.0), value: "148.6 ms", category: "Timing/Jitter" },
      { feature: "TTL Jitter / Variance", tier: "Packet-Level", impact: isMitigated ? 3 : Math.min(22, 8 + t * 0.7), value: "0.86 Score", category: "Headers" },
      { feature: "TCP Window Size Dispersion", tier: "Packet-Level", impact: isMitigated ? 2 : Math.min(16, 5 + t * 0.5), value: "1,024 Bytes std", category: "Buffer" }
    ];
  } else if (scenarioId === 'syn_flood') {
    shapFeatures = [
      { feature: "SYN / Total Packet Ratio", tier: "Flow-Level", impact: isMitigated ? 9 : Math.min(49, 24 + t * 1.6), value: "98.7% SYN", category: "TCP Flags" },
      { feature: "Ingest Rate Spike (pps)", tier: "Flow-Level", impact: isMitigated ? 6 : Math.min(37, 16 + t * 1.2), value: "62,400 pps", category: "Volume" },
      { feature: "Subnet IP Entropy", tier: "Flow-Level", impact: isMitigated ? 4 : Math.min(26, 11 + t * 0.8), value: "7.94 Bits", category: "Anonymity" },
      { feature: "Zero Window Flag Burst", tier: "Packet-Level", impact: isMitigated ? 3 : Math.min(20, 8 + t * 0.6), value: "88.2%", category: "TCP Flow" },
      { feature: "ACK Dropped Count", tier: "Packet-Level", impact: isMitigated ? 1 : Math.min(14, 5 + t * 0.4), value: "94.6%", category: "Loss" }
    ];
  } else if (scenarioId === 'held_out_botnet') {
    shapFeatures = [
      { feature: "IRC / DGA Query Periodicity", tier: "Packet-Level", impact: isMitigated ? 8 : Math.min(44, 20 + t * 1.4), value: "30.0s Beacons", category: "C2 Timing" },
      { feature: "NetBIOS Name Sweep Freq", tier: "Flow-Level", impact: isMitigated ? 6 : Math.min(34, 15 + t * 1.1), value: "Port 137 UDP", category: "Discovery" },
      { feature: "Payload Entropy Jump", tier: "Packet-Level", impact: isMitigated ? 4 : Math.min(25, 10 + t * 0.8), value: "7.61 Bits", category: "Encrypted" },
      { feature: "Inter-Arrival Packet Jitter", tier: "Packet-Level", impact: isMitigated ? 3 : Math.min(19, 7 + t * 0.6), value: "12.4 ms", category: "Beaconing" },
      { feature: "Outbound Host Fanout", tier: "Flow-Level", impact: isMitigated ? 2 : Math.min(15, 5 + t * 0.5), value: "28 Endpoints", category: "Spread" }
    ];
  } else if (scenarioId === 'ransomware') {
    shapFeatures = [
      { feature: "SMB Port 445 Burst Rate", tier: "Flow-Level", impact: isMitigated ? 8 : Math.min(46, 23 + t * 1.5), value: "4.8 GB/s", category: "Exploit" },
      { feature: "PsExec Remote IPC$ Calls", tier: "Flow-Level", impact: isMitigated ? 6 : Math.min(36, 16 + t * 1.1), value: "ADMIN$ Share", category: "Lateral" },
      { feature: "TCP Window Starvation", tier: "Packet-Level", impact: isMitigated ? 4 : Math.min(26, 10 + t * 0.8), value: "0 bytes advertised", category: "Buffer" },
      { feature: "Encrypted Blob Chunk Entropy", tier: "Packet-Level", impact: isMitigated ? 3 : Math.min(21, 8 + t * 0.7), value: "7.98 Bits (AES)", category: "Crypto" },
      { feature: "VSSAdmin Process Probes", tier: "Packet-Level", impact: isMitigated ? 2 : Math.min(16, 6 + t * 0.5), value: "Shadow Deletion", category: "Impact" }
    ];
  } else if (scenarioId === 'scada_intrusion') {
    shapFeatures = [
      { feature: "Modbus Function 16 Burst Rate", tier: "Flow-Level", impact: isMitigated ? 8 : Math.min(48, 22 + t * 1.6), value: "Holding Register Write", category: "ICS Protocol" },
      { feature: "Unit ID Scan Dispersion", tier: "Packet-Level", impact: isMitigated ? 6 : Math.min(36, 15 + t * 1.2), value: "Port 502/TCP", category: "OT Discovery" },
      { feature: "PLC Response Latency Spike", tier: "Packet-Level", impact: isMitigated ? 4 : Math.min(28, 11 + t * 0.9), value: "+420 ms RTT", category: "Controller Health" },
      { feature: "IEC-60870 APDU Length Anomaly", tier: "Flow-Level", impact: isMitigated ? 3 : Math.min(22, 8 + t * 0.7), value: "Malformed Header", category: "Protocol Anomaly" },
      { feature: "Engineering Station RDP Rate", tier: "Flow-Level", impact: isMitigated ? 2 : Math.min(16, 6 + t * 0.5), value: "3389 Active", category: "HMI Access" }
    ];
  } else if (scenarioId === 'cloud_credential_api') {
    shapFeatures = [
      { feature: "OAuth /token Velocity Spike", tier: "Flow-Level", impact: isMitigated ? 7 : Math.min(45, 19 + t * 1.5), value: "184 req/min", category: "API Abuse" },
      { feature: "JWT Signature Mismatch Δ", tier: "Packet-Level", impact: isMitigated ? 6 : Math.min(38, 14 + t * 1.2), value: "Forged Key ID", category: "Auth" },
      { feature: "Payload Base64 Entropy", tier: "Packet-Level", impact: isMitigated ? 5 : Math.min(30, 12 + t * 0.9), value: "7.88 Bits", category: "Exfil" },
      { feature: "Core Banking SQL Fan-out", tier: "Flow-Level", impact: isMitigated ? 3 : Math.min(21, 7 + t * 0.7), value: "Port 5432 Queries", category: "Database" },
      { feature: "Client IP Geo-Dispersion", tier: "Flow-Level", impact: isMitigated ? 2 : Math.min(15, 5 + t * 0.5), value: "Residential Pool", category: "Proxy" }
    ];
  } else if (scenarioId === 'supply_chain_dll') {
    shapFeatures = [
      { feature: "DLL Side-Load Memory Ingestion", tier: "Flow-Level", impact: isMitigated ? 8 : Math.min(43, 17 + t * 1.4), value: "SolarOrion.dll", category: "Execution" },
      { feature: "DGA Subdomain Entropy Ratio", tier: "Packet-Level", impact: isMitigated ? 6 : Math.min(37, 15 + t * 1.1), value: "Random Subdomains", category: "DNS C2" },
      { feature: "Inter-Beacon Sleep Jitter", tier: "Packet-Level", impact: isMitigated ? 4 : Math.min(27, 10 + t * 0.8), value: "720s Jitter Cycle", category: "Stealth" },
      { feature: "LDAP Admin Query Volume", tier: "Flow-Level", impact: isMitigated ? 3 : Math.min(20, 8 + t * 0.6), value: "Port 389 Bursts", category: "Enumeration" },
      { feature: "Outbound WebDAV PUT Traffic", tier: "Flow-Level", impact: isMitigated ? 2 : Math.min(14, 5 + t * 0.4), value: "Chunked Schematics", category: "Exfiltration" }
    ];
  } else if (scenarioId === 'telecom_bgp_hijack') {
    shapFeatures = [
      { feature: "BGP Prefix Announce Anomaly", tier: "Flow-Level", impact: isMitigated ? 9 : Math.min(50, 26 + t * 1.7), value: "Port 179 BGP", category: "Routing" },
      { feature: "UDP Reflection Flood Volume", tier: "Flow-Level", impact: isMitigated ? 7 : Math.min(42, 20 + t * 1.3), value: "180 Gbps / NTP", category: "Volumetric" },
      { feature: "TTL Decrement Inconsistency", tier: "Packet-Level", impact: isMitigated ? 5 : Math.min(32, 12 + t * 1.0), value: "Multi-Path AitM", category: "Transit" },
      { feature: "DNS Resolution Reroute Δ", tier: "Packet-Level", impact: isMitigated ? 3 : Math.min(22, 8 + t * 0.7), value: "Poisoned Cache", category: "DNS AitM" },
      { feature: "Carrier Gateway Queue Drops", tier: "Flow-Level", impact: isMitigated ? 2 : Math.min(16, 6 + t * 0.5), value: "Buffer Full", category: "Congestion" }
    ];
  } else {
    shapFeatures = [
      { feature: "HTTPS TLS 1.3 Handshakes", tier: "Flow-Level", impact: 4, value: "Nominal (0.99)", category: "Standard" },
      { feature: "DNS Resolution Flow Rate", tier: "Flow-Level", impact: 3, value: "14 req/s", category: "Standard" },
      { feature: "NTP Jitter Deviation", tier: "Packet-Level", impact: 2, value: "0.18 ms", category: "Timing" },
      { feature: "TCP ACK Normal Ratio", tier: "Flow-Level", impact: 2, value: "99.4%", category: "TCP Flow" },
      { feature: "Idle Flow Keepalive Rate", tier: "Packet-Level", impact: 1, value: "Standard", category: "Standard" }
    ];
  }

  // Live Packet Ingest Rate
  const ingestRate = isMitigated 
    ? Math.round(380 + Math.random() * 60)
    : scenarioId === 'syn_flood' || scenarioId === 'telecom_bgp_hijack'
      ? Math.round(18500 + t * 2200 + Math.random() * 800)
      : Math.round(1400 + t * 130 + Math.random() * 120);

  // Packet Log Stream for Live Terminal
  const packetLogs = generatePacketLogs(scenarioId, t, isMitigated);

  // Topology Nodes & Active Infected Vectors with GNN Attention Weights
  const nodes = [
    { id: "ext_gw", label: "Edge Gateway (FW-01)", role: "Firewall / Perimeter", ip: "192.168.1.1", status: isMitigated ? "normal" : t > 2 ? ((scenarioId === 'syn_flood' || scenarioId === 'telecom_bgp_hijack') ? "critical" : "warning") : "normal", type: "gateway", gnnWeight: 0.88 },
    { id: "web_srv", label: "DMZ Web Server (SRV-01)", role: "Public Portal (IIS/Nginx)", ip: "192.168.1.50", status: isMitigated ? "normal" : t > 4 ? "critical" : t > 1 ? "warning" : "normal", type: "server", gnnWeight: 0.94 },
    { id: "db_srv", label: "Core DB Cluster (SQL-01)", role: "PostgreSQL Production", ip: "10.0.4.12", status: isMitigated ? "normal" : t > 8 ? "critical" : t > 5 ? "warning" : "normal", type: "database", gnnWeight: 0.76 },
    { id: "admin_pc", label: "SecOps Admin (WS-ADMIN)", role: "SOC Analyst Bastion", ip: "10.0.2.88", status: isMitigated ? "normal" : t > 11 ? "compromised" : t > 7 ? "warning" : "normal", type: "workstation", gnnWeight: 0.62 },
    { id: "domain_ctrl", label: "Primary DC (AD-ROOT)", role: "Active Directory Key Master", ip: "10.0.1.5", status: isMitigated ? "normal" : t > 14 ? "compromised" : t > 10 ? "critical" : "normal", type: "dc", gnnWeight: 0.54 }
  ];

  const activeLinks = [
    { source: "ext_gw", target: "web_srv", threat: !isMitigated && t > 2, edgeWeight: 0.92, protocol: scenarioId === 'scada_intrusion' ? "TCP 502 Modbus" : "TCP 80/443" },
    { source: "web_srv", target: "db_srv", threat: !isMitigated && t > 5, edgeWeight: 0.85, protocol: "TCP 5432" },
    { source: "db_srv", target: "admin_pc", threat: !isMitigated && t > 8, edgeWeight: 0.74, protocol: "TCP 445 SMB" },
    { source: "admin_pc", target: "domain_ctrl", threat: !isMitigated && t > 11, edgeWeight: 0.96, protocol: "TCP 389 LDAP / Kerberos" }
  ];

  return {
    scenario,
    step: t,
    maxSteps: scenario.maxSteps,
    ingestRate,
    historical,
    forecast,
    attentionWeights,
    infiltrationProb,
    baselineRisk: Number(baselineRisk.toFixed(1)),
    riskTier,
    leadTimeMinutes,
    mitreStages,
    shapFeatures,
    packetLogs,
    nodes,
    activeLinks,
    isMitigated
  };
}

function generatePacketLogs(scenarioId, step, isMitigated) {
  const logs = [];
  const count = 12;
  const now = new Date();

  const ips = ["185.220.101.4", "45.142.120.9", "192.168.1.50", "10.0.4.12", "10.0.2.88", "198.51.100.42"];
  const protocols = ["TCP", "UDP", "ICMP", "HTTP/2", "DNS"];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 750).toISOString().substring(11, 23);
    const srcIp = ips[i % ips.length];
    let dstPort = 80;
    if (scenarioId === 'scada_intrusion') dstPort = i % 2 === 0 ? 502 : 8080;
    else if (scenarioId === 'cloud_credential_api') dstPort = 443;
    else if (scenarioId === 'supply_chain_dll') dstPort = i % 2 === 0 ? 53 : 443;
    else if (scenarioId === 'telecom_bgp_hijack') dstPort = i % 2 === 0 ? 179 : 123;
    else if (scenarioId === 'ransomware') dstPort = i % 2 === 0 ? 445 : 3389;
    else if (scenarioId === 'syn_flood') dstPort = 80;
    else if (scenarioId === 'held_out_botnet') dstPort = i % 2 === 0 ? 6667 : 53;
    else dstPort = i % 3 === 0 ? 445 : 80;

    const protocol = (scenarioId === 'telecom_bgp_hijack' && dstPort === 123) ? "UDP" 
      : (scenarioId === 'supply_chain_dll' && dstPort === 53) ? "UDP" 
      : protocols[i % protocols.length];

    let flags = "[SYN]";
    let threatLabel = "BENIGN";
    let entropy = (3.1 + Math.random() * 1.4).toFixed(2);
    let ttl = Math.floor(58 + Math.random() * 6);
    let windowSize = 65535;

    if (!isMitigated && step > 3) {
      if (scenarioId === 'syn_flood') {
        flags = "[SYN, ECE, CWR]";
        threatLabel = "DoS_SYN_Surge";
        entropy = (7.5 + Math.random() * 0.4).toFixed(2);
        windowSize = 0;
        ttl = 64;
      } else if (scenarioId === 'slow_scan') {
        flags = i % 2 === 0 ? "[SYN, FIN]" : "[RST, ACK]";
        threatLabel = step > 8 ? "Lateral_Recon" : "Port_Scan";
        entropy = (6.4 + Math.random() * 0.9).toFixed(2);
        ttl = Math.floor(48 + Math.random() * 18);
      } else if (scenarioId === 'held_out_botnet') {
        flags = "[PSH, ACK]";
        threatLabel = step > 7 ? "Botnet_IRC_C2" : "DGA_Heartbeat";
        entropy = (7.62 + Math.random() * 0.3).toFixed(2);
      } else if (scenarioId === 'ransomware') {
        flags = "[PSH, ACK]";
        threatLabel = step > 10 ? "Exfil_Payload" : "SMB_EternalBlue";
        entropy = (7.92 + Math.random() * 0.08).toFixed(2);
      } else if (scenarioId === 'scada_intrusion') {
        flags = "[PSH, ACK]";
        threatLabel = step > 8 ? "Modbus_Coil_Trip" : "SCADA_Poll";
        entropy = (5.8 + Math.random() * 0.5).toFixed(2);
      } else if (scenarioId === 'cloud_credential_api') {
        flags = "[ACK]";
        threatLabel = step > 9 ? "JWT_Token_Forge" : "API_Stuffing";
        entropy = (7.84 + Math.random() * 0.2).toFixed(2);
      } else if (scenarioId === 'supply_chain_dll') {
        flags = "[PSH, ACK]";
        threatLabel = step > 8 ? "DLL_SideLoad_C2" : "DGA_DNS_Beacon";
        entropy = (7.1 + Math.random() * 0.4).toFixed(2);
      } else if (scenarioId === 'telecom_bgp_hijack') {
        flags = "[SYN, ACK]";
        threatLabel = step > 8 ? "Mirai_NTP_Flood" : "BGP_Route_Poison";
        entropy = (7.9 + Math.random() * 0.1).toFixed(2);
      }
    }

    logs.push({
      id: `FLOW-${10800 + step * 25 + i}`,
      timestamp,
      protocol,
      srcIp,
      dstPort,
      tcpFlags: flags,
      ttl,
      windowSize,
      duration: `${(10 + Math.random() * 40).toFixed(1)}ms`,
      entropy: `${entropy} bits`,
      threatLabel
    });
  }

  return logs;
}
