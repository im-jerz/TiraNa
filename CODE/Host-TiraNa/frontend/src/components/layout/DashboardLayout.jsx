import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileTabBar from "./MobileTabBar";
import { getHostIdentity, HOST_IDENTITY_EVENT } from "../../lib/hostIdentity";

const PAGE_META = {
  "/dashboard": { eyebrow: "Overview", title: "Dashboard" },
  "/dashboard/properties": { eyebrow: "Operations", title: "Property Management" },
  "/dashboard/properties/new": { eyebrow: "Property Management", title: "List a New Property" },
  "/dashboard/bookings": { eyebrow: "Operations", title: "Bookings" },
  "/dashboard/guests": { eyebrow: "Operations", title: "Guests" },
  "/dashboard/revenue": { eyebrow: "Earnings", title: "Revenue" },
  "/dashboard/wallet": { eyebrow: "Earnings", title: "Wallet & Payouts" },
  "/dashboard/reviews": { eyebrow: "Engagement", title: "Reviews" },
  "/dashboard/messages": { eyebrow: "Engagement", title: "Messages" },
  "/dashboard/support": { eyebrow: "Account", title: "Support & Disputes" },
  "/dashboard/settings": { eyebrow: "Account", title: "Settings" },
};

function resolveMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/dashboard/properties/")) {
    return { eyebrow: "Property Management", title: "Edit Property" };
  }
  return { eyebrow: "", title: "Dashboard" };
}

export default function DashboardLayout() {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const meta = resolveMeta(location.pathname);

  const [host, setHost] = useState(() => getHostIdentity());

  useEffect(() => {
    // Settings page dispatches this after a profile save / avatar upload
    // so the topbar updates instantly without a route change or reload.
    function handleIdentityUpdate(e) {
      setHost(e.detail ?? getHostIdentity());
    }
    // Also covers the identity being updated from another tab.
    function handleStorage(e) {
      if (e.key === "host") setHost(getHostIdentity());
    }
    window.addEventListener(HOST_IDENTITY_EVENT, handleIdentityUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(HOST_IDENTITY_EVENT, handleIdentityUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const fullName = host?.full_name || "Host";
  const hostInitial = fullName.charAt(0).toUpperCase();

  return (
    <div className="shell">
      <Sidebar expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      <div className="shell-main">
        <Topbar
          eyebrow={meta.eyebrow}
          title={meta.title}
          onMenuClick={() => setExpanded((v) => !v)}
          hostInitial={hostInitial}
          hostName={fullName}
          hostAvatarUrl={host?.avatar_url}
        />

        <main className="page-frame">
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}