"use client";

import React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import { Theme } from "@/types";
import "./ThemeSettingsModal.css";

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    description: "Always use the light theme",
    icon: <Sun size={22} aria-hidden="true" />,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark theme",
    icon: <Moon size={22} aria-hidden="true" />,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device preference",
    icon: <Monitor size={22} aria-hidden="true" />,
  },
];

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, setTheme } = useTheme();

  const handleSelect = (value: Theme) => {
    setTheme(value);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Theme">
      <div className="theme-settings-list">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`theme-option${theme === option.value ? " active" : ""}`}
            onClick={() => handleSelect(option.value)}
          >
            <span className="theme-option-icon">{option.icon}</span>
            <span className="theme-option-content">
              <span className="theme-option-label">{option.label}</span>
              <span className="theme-option-description">
                {option.description}
              </span>
            </span>
            {theme === option.value && (
              <span className="theme-option-check">
                <Check size={18} strokeWidth={2.5} aria-hidden="true" />
              </span>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};

export default ThemeSettingsModal;
