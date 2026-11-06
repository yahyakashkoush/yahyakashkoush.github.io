/** Timeline, narrative and capability taxonomy. All of it from _source/cv.txt. */

export const about = [
  "Computer Science and Artificial Intelligence graduate. I started on a software and mobile path, moved into applied AI, and now build AI SaaS, automation and backend systems end to end.",
  "My interest sits in architecture and production engineering, not only in using AI models. The question that holds my attention is how a system behaves once it is carrying real traffic, real data and real money.",
];

export type TimelineEntry = {
  period: string;
  title: string;
  org?: string;
  body: string[];
};

export const timeline: TimelineEntry[] = [
  {
    period: "2023 - Present",
    title: "Independent Applied AI Engineer",
    body: [
      "Building AI products, SaaS platforms and automation systems end to end, from architecture through to production deployment.",
    ],
  },
  {
    period: "2021 / 2022 - 2023",
    title: "iOS Developer",
    body: [
      "Started as an iOS developer, building mobile applications independently.",
      "Worked on real-time applications and Firebase, covering the full product cycle from architecture to UI to deployment.",
    ],
  },
  {
    period: "2022",
    title: "Training, iOS",
    org: "Information Technology Institute (ITI)",
    body: ["Three-month iOS training programme."],
  },
  {
    period: "2021 - 2025",
    title: "B.Sc. Computer Science & Artificial Intelligence",
    org: "MTI University",
    body: [],
  },
];

export type CapabilityGroup = { title: string; items: string[] };

export const capabilities: CapabilityGroup[] = [
  {
    title: "AI Engineering & Agents",
    items: [
      "AI Model Integration",
      "AI Tools, Agents & Integrations",
      "AI Agent Development",
      "Data & RAG Agents",
      "Multi-Agent Workflows",
      "Knowledge Bases",
      "Chatbot Development",
      "CrewAI",
      "OpenRouter",
      "Hugging Face",
      "Claude",
      "Codex",
    ],
  },
  {
    title: "Automation & Browser Automation",
    items: [
      "Browser Automation",
      "Playwright",
      "Selenium",
      "Chromium",
      "Browser Use",
      "Requests",
      "HTTPX",
      "Web Crawling",
      "Web Scraping",
      "Scrapy",
      "Background Workers",
      "Cron Jobs",
      "Workflow Automation",
      "n8n",
      "Make",
      "BullMQ",
      "Redis",
      "Message Queues",
    ],
  },
  {
    title: "Web Intelligence, Search & Data Acquisition",
    items: [
      "Search Engine Intelligence",
      "Google Advanced Search",
      "Google Dorking",
      "DuckDuckGo Search",
      "S3 Bucket Search",
      "Google Drive Search",
      "Web Data Extraction",
      "Google Maps",
      "Bing",
      "Yandex",
      "X",
      "LinkedIn",
      "Facebook",
      "Instagram",
      "TikTok",
      "GitHub",
    ],
  },
  {
    title: "Data Engineering & Processing",
    items: [
      "Big Data Search & Processing",
      "Data Cleaning",
      "Data Analysis",
      "On-Site Data Processing",
      "DuckDB",
      "Apache Parquet",
      "SQLite",
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Firebase",
      "Firestore",
      "Caching",
    ],
  },
  {
    title: "Backend & API Engineering",
    items: [
      "FastAPI",
      "Node.js",
      "REST APIs",
      "GraphQL",
      "Webhooks",
      "OAuth Flows",
      "JWT Authentication",
      "API Security",
      "Secure API Design",
      "Rate Limiting",
      "SDK Integration",
      "Payment Gateway APIs",
      "Meta APIs",
      "API Architecture",
      "Backend Integrations",
      "System & Service Bridges",
    ],
  },
  {
    title: "SaaS & Business Systems",
    items: [
      "SaaS Architecture",
      "CRM Systems",
      "ERP Systems",
      "AI-Powered Business Automation",
      "Third-Party Integrations",
      "Payment Integrations",
      "CRM/ERP Integrations",
      "API-Based System Integration",
      "Automation Pipelines",
    ],
  },
  {
    title: "Cloud, DevOps & Infrastructure",
    items: [
      "AWS",
      "Docker",
      "SSH",
      "Environment Management",
      "Production Deployment",
      "Background Processing",
      "Redis",
      "BullMQ",
      "S3",
    ],
  },
  {
    title: "Security",
    items: [
      "Web Security Testing",
      "Web Application Security",
      "API Security",
      "Secure API Design",
      "Authentication & Authorization",
      "JWT",
      "OAuth",
      "Rate Limiting",
      "Security Testing & Vulnerability Resolution",
    ],
  },
  {
    title: "Languages & Frontend",
    items: [
      "Python",
      "Node.js",
      "JavaScript",
      "C++",
      "Java",
      "Swift",
      "React",
      "Tailwind CSS",
      "HTML",
      "CSS",
      "GSAP",
      "Git",
      "GitHub",
      "VS Code",
    ],
  },
];

