"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cookie, Heart, Sun } from "lucide-react";
import { FooterColumn } from "@/types";
import ThemeSettingsModal from "@/components/theme/ThemeSettingsModal";
import CookieSettingsModal from "@/components/cookies/CookieSettingsModal";
import "./Footer.css";

interface FooterProps {
  brandName: string;
  brandHref?: string;
  tagline: string;
  domain?: string;
  columns: FooterColumn[];
  author?: string;
  authorHref?: string;
  copyrightStart?: number;
}

/** Renders "Product by author" with the author part visually de-emphasised. */
function FooterTagline({ tagline }: { tagline: string }) {
  const byIndex = tagline.lastIndexOf(' by ');
  if (byIndex === -1) return <>{tagline}</>;

  return (
    <>
      <span className="footer-tagline-product">{tagline.slice(0, byIndex)}</span>{' '}
      <span className="footer-tagline-by">by {tagline.slice(byIndex + 4)}</span>
    </>
  );
}

export default function Footer({
  brandName,
  brandHref = "/",
  tagline,
  domain,
  columns,
  author,
  authorHref,
  copyrightStart = 2021,
}: FooterProps) {
  const [showTheme, setShowTheme] = useState(false);
  const [showCookies, setShowCookies] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href={brandHref} className="footer-logo-text">
              {brandName}
            </Link>
            <p className="footer-tagline">
              <FooterTagline tagline={tagline} />
            </p>
          </div>
          <div className="footer-columns">
            {columns.map((col) => (
              <div key={col.title} className="footer-col">
                <p className="footer-col-title">{col.title}</p>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href}>{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span className="footer-copyright">
            © {copyrightStart}–{new Date().getFullYear()} {author ?? brandName}
          </span>

          {domain && (
            <span className="footer-domain">{domain}</span>
          )}

          <div className="footer-bottom-right">
            {author && authorHref && (
              <span className="footer-made-with">
                Made with{" "}
                <Heart size={11} className="footer-heart" aria-hidden="true" />{" "}
                by{" "}
                <a
                  href={authorHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-author"
                >
                  @{author}
                </a>
              </span>
            )}
            <div className="footer-controls">
              <button
                className="footer-toggle-btn"
                onClick={() => setShowTheme(true)}
                aria-label="Theme settings"
              >
                <Sun size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>Theme</span>
              </button>
              <button
                className="footer-toggle-btn"
                onClick={() => setShowCookies(true)}
                aria-label="Cookie settings"
              >
                <Cookie size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>Cookies</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ThemeSettingsModal
        isOpen={showTheme}
        onClose={() => setShowTheme(false)}
      />
      <CookieSettingsModal
        isOpen={showCookies}
        onClose={() => setShowCookies(false)}
        onSave={() => setShowCookies(false)}
      />
    </footer>
  );
}
