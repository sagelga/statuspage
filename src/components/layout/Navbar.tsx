"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/types";
import "./Navbar.css";

interface NavbarProps {
  brandName: string;
  brandHref?: string;
  navbarBg: string;
  links: NavItem[];
  logo?: React.ReactNode;
  controls?: React.ReactNode;
}

export default function Navbar({
  brandName,
  brandHref = "/",
  navbarBg,
  links,
  logo,
  controls,
}: NavbarProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const ref = dropdownRefs.current[openDropdown];
      if (ref && !ref.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(
        (c) => pathname === c.href || pathname.startsWith(c.href + "/")
      );
    }
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const toggleDropdown = (label: string) =>
    setOpenDropdown((prev) => (prev === label ? null : label));

  return (
    <nav
      className="navbar"
      style={{ "--navbar-bg": navbarBg } as React.CSSProperties}
    >
      <div className="nav-top">
        <div className="nav-top-inner">
          {logo ?? (
            brandHref.startsWith("http") ? (
              <a href={brandHref} className="nav-logo-text">
                {brandName}
              </a>
            ) : (
              <Link href={brandHref} className="nav-logo-text">
                {brandName}
              </Link>
            )
          )}
          {controls && <div className="nav-top-right">{controls}</div>}
        </div>
      </div>

      <div className="nav-bottom">
        <div className="nav-bottom-inner">
          <ul className="nav-list" role="menubar">
            {links.map((item) =>
              item.children ? (
                <li key={item.label} role="none">
                  <div
                    className="nav-dropdown-container"
                    ref={(el) => {
                      dropdownRefs.current[item.label] = el;
                    }}
                  >
                    <button
                      className={`nav-link nav-dropdown-toggle${isItemActive(item) ? " active" : ""}`}
                      onClick={() => toggleDropdown(item.label)}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.label}
                      role="menuitem"
                    >
                      {item.label}
                      <svg
                        className={`nav-dropdown-arrow${openDropdown === item.label ? " open" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    <div
                      className={`nav-dropdown-menu${openDropdown === item.label ? " open" : ""}`}
                      role="menu"
                    >
                      {item.children.map((child) =>
                        child.external ? (
                          <a
                            key={child.href}
                            href={child.href}
                            className="nav-dropdown-item"
                            target="_blank"
                            rel="noopener noreferrer"
                            role="menuitem"
                          >
                            {child.label}
                          </a>
                        ) : (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`nav-dropdown-item${pathname === child.href ? " active" : ""}`}
                            role="menuitem"
                          >
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ) : item.disabled ? (
                <li key={item.label} role="none">
                  <span className="nav-link nav-link-disabled" role="menuitem" aria-disabled="true">
                    {item.label}
                  </span>
                </li>
              ) : item.external ? (
                <li key={item.label} role="none">
                  <a
                    href={item.href}
                    className="nav-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                  >
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.label} role="none">
                  <Link
                    href={item.href}
                    className={`nav-link${isItemActive(item) ? " active" : ""}`}
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
