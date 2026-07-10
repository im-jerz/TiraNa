import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import {
  IconHome,
  IconBuilding,
  IconCalendar,
  IconWallet,
  IconMenu,
  IconX,
  IconUsers,
  IconChart,
  IconStar,
  IconMessage,
  IconBell,
  IconLifeBuoy,
  IconSettings,
  IconPower,
} from "../icons";

const PRIMARY_TABS = [
  { to: "/dashboard", label: "Home", icon: IconHome, end: true },
  { to: "/dashboard/properties", label: "Properties", icon: IconBuilding },
  { to: "/dashboard/bookings", label: "Bookings", icon: IconCalendar },
  { to: "/dashboard/wallet", label: "Wallet", icon: IconWallet },
];

const MORE_LINKS = [
  { to: "/dashboard/guests", label: "Guests", icon: IconUsers },
  { to: "/dashboard/revenue", label: "Revenue", icon: IconChart },
  { to: "/dashboard/reviews", label: "Reviews", icon: IconStar },
  { to: "/dashboard/messages", label: "Messages", icon: IconMessage },
  { to: "/dashboard/notifications", label: "Notifications", icon: IconBell },
  { to: "/dashboard/support", label: "Support & Disputes", icon: IconLifeBuoy },
  { to: "/dashboard/settings", label: "Settings", icon: IconSettings },
];

export default function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const popRef = useRef(null);
  const moreBtnRef = useRef(null);
  const navigate = useNavigate();

  async function handleSignOut() {
    setMoreOpen(false);
    await logout();
    navigate("/signin", { replace: true });
  }

  useEffect(() => {
    function onClick(e) {
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        moreBtnRef.current &&
        !moreBtnRef.current.contains(e.target)
      ) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="mobile-tab-more" ref={popRef}>
          {MORE_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} className="mobile-more-link" onClick={() => setMoreOpen(false)}>
              <item.icon />
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="mobile-more-link" onClick={handleSignOut} style={{ width: "100%", textAlign: "left" }}>
            <IconPower />
            Sign out
          </button>
        </div>
      )}
      <nav className="mobile-tabbar">
        {PRIMARY_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `mobile-tab${isActive ? " active" : ""}`}
            onClick={() => setMoreOpen(false)}
          >
            <span className="mobile-tab-icon">
              <tab.icon />
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button
          ref={moreBtnRef}
          type="button"
          className={`mobile-tab-more-btn${moreOpen ? " open" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label={moreOpen ? "Close menu" : "More options"}
        >
          <span className="icon-swap">
            <IconMenu className="icon-menu" />
            <IconX className="icon-close" />
          </span>
          <span>{moreOpen ? "Close" : "More"}</span>
        </button>
      </nav>
    </>
  );
}