import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const STAFF = {
  manifest: "/manifest.webmanifest",
  touchIcon: "/apple-touch-icon.png",
  title: "Mukut Hotels",
  themeColor: "#f8d8d9",
};

const ADMIN = {
  manifest: "/admin-manifest.webmanifest",
  touchIcon: "/admin-apple-touch-icon.png",
  title: "Mukut Admin",
  themeColor: "#205933",
};

function setLinkHref(rel: string, href: string) {
  const el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (el) el.href = href;
}

function setMetaContent(name: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) el.content = content;
}

/**
 * The admin panel is a distinct enough surface (own theme, own audience) that
 * staff installing it to their home screen should get a separate app identity
 * from the main staff-facing PWA - different name, icon, and start_url/scope,
 * so both can be installed side by side and told apart at a glance.
 */
export function PwaManifestSwitcher() {
  const location = useLocation();

  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");
    const config = isAdmin ? ADMIN : STAFF;

    setLinkHref("manifest", config.manifest);
    setLinkHref("apple-touch-icon", config.touchIcon);
    setMetaContent("apple-mobile-web-app-title", config.title);
    setMetaContent("theme-color", config.themeColor);
  }, [location.pathname]);

  return null;
}
