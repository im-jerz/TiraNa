const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9.5v-6h5v6h3a1 1 0 0 0 1-1V10" />
  </svg>
);

export const IconBuilding = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="11" height="18" rx="1" />
    <path d="M9 21v-4h2v4M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01" />
    <path d="M15 9h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4" />
  </svg>
);

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);

export const IconBookOpen = (p) => (
  <svg {...base} {...p}>
    <path d="M12 6.5c-1.6-1.3-4-2-7-2v13c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2V4.5c-3 0-5.4.7-7 2Z" />
    <path d="M12 6.5v13" />
  </svg>
);

export const IconChart = (p) => (
  <svg {...base} {...p}>
    <path d="M4 19h16" />
    <rect x="6" y="11" width="3" height="6" rx="0.5" />
    <rect x="11" y="7" width="3" height="10" rx="0.5" />
    <rect x="16" y="13" width="3" height="4" rx="0.5" />
  </svg>
);

export const IconWallet = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

export const IconMoney = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9 9.5c0-1 1.3-2 3-2s3 1 3 2-1.3 2-3 2-3 1-3 2 1.3 2 3 2 3-1 3-2" />
  </svg>
);

export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 6.3a3 3 0 0 1 0 5.8M21 20c0-2.6-1.7-4.8-4-5.6" />
  </svg>
);

export const IconStar = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z" />
  </svg>
);

export const IconMessage = (p) => (
  <svg {...base} {...p}>
    <path d="M4 18.5 6.2 17H17a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9.5Z" />
  </svg>
);

export const IconLifeBuoy = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="m5.8 5.8 3 3M18.2 5.8l-3 3M5.8 18.2l3-3M18.2 18.2l-3-3" />
  </svg>
);

export const IconSettings = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const IconBell = (p) => (
  <svg {...base} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.5a1 1 0 0 1-.9 1.5H5.4a1 1 0 0 1-.9-1.5C5 12.5 6 11 6 8Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </svg>
);

export const IconChevronLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMapPin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const IconEdit = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

export const IconCalendarCheck = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

export const IconPower = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v8" />
    <path d="M7 5.5a8 8 0 1 0 10 0" />
  </svg>
);

export const IconImage = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m3 16 4.5-4.5a2 2 0 0 1 2.8 0L13 14l3-3a2 2 0 0 1 2.8 0L21 13" />
  </svg>
);

export const IconUpload = (p) => (
  <svg {...base} {...p}>
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </svg>
);

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconAlertTriangle = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconAlertCircle = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

export const IconInfo = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const IconChevronDown = (p) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const IconX = (p) => (
  <svg {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconWifi = (p) => (
  <svg {...base} {...p}>
    <path d="M2 8.5a15 15 0 0 1 20 0" />
    <path d="M5.5 12.3a10.4 10.4 0 0 1 13 0" />
    <path d="M9 16a5.5 5.5 0 0 1 6 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconKitchen = (p) => (
  <svg {...base} {...p}>
    <path d="M5 3v18M5 3h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5" />
    <path d="M15 3v18M19 3a4 4 0 0 0-4 4v3h4M15 10v-3" />
  </svg>
);

export const IconSnowflake = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2v20M5 6l14 12M19 6 5 18" />
    <path d="M12 2 9 5M12 2l3 3M12 22l-3-3M12 22l3-3M5 6 2 7M5 6l1-3.5M19 6l3 1M19 6l-1-3.5M5 18l-3-1M5 18l1 3.5M19 18l3-1M19 18l-1 3.5" />
  </svg>
);

export const IconWaves = (p) => (
  <svg {...base} {...p}>
    <path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
    <path d="M2 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
  </svg>
);

export const IconCar = (p) => (
  <svg {...base} {...p}>
    <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
    <rect x="3" y="11" width="18" height="6" rx="2" />
    <circle cx="7.5" cy="17" r="1.4" />
    <circle cx="16.5" cy="17" r="1.4" />
  </svg>
);

export const IconWasher = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="12" cy="13" r="4.5" />
    <path d="M8 6h.01M11 6h.01" />
  </svg>
);

export const IconTv = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="13" rx="2" />
    <path d="M9 21h6M12 18v3" />
  </svg>
);

export const IconFlame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3s-5 4.5-5 9a5 5 0 0 0 10 0c0-1.3-.5-2.2-1-3 .1 1.2-.6 2-1.4 2-1 0-1.2-1-1-2 .3-1.4-.6-3-1.6-4Z" />
  </svg>
);

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3Z" />
  </svg>
);

export const IconDesk = (p) => (
  <svg {...base} {...p}>
    <path d="M3 13h18M5 13V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6" />
    <path d="M5 13v7M19 13v7M9 19v1M14 19v1" />
  </svg>
);

export const IconPaw = (p) => (
  <svg {...base} {...p}>
    <circle cx="7.5" cy="9" r="1.7" />
    <circle cx="12" cy="6.5" r="1.7" />
    <circle cx="16.5" cy="9" r="1.7" />
    <path d="M12 12c-3.3 0-5.5 2-5.5 4.3 0 1.8 1.5 3.2 3.4 3.2.9 0 1.5-.4 2.1-.4s1.2.4 2.1.4c1.9 0 3.4-1.4 3.4-3.2C17.5 14 15.3 12 12 12Z" />
  </svg>
);

export const IconArrowUp = (p) => (
  <svg {...base} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const IconArrowDown = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

export const IconDownload = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v12M8 12l4 4 4-4" />
    <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </svg>
);