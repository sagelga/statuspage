/**
 * Icon registry for service cards, hero banners, and empty states.
 * Paths come from lucide-react so there is no raw SVG-in-JSX string injection.
 */
import {
  ArrowRight,
  Book,
  BookOpen,
  Check,
  CircleAlert,
  CircleX,
  Database,
  Globe,
  Grid3x3,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Shield,
  type LucideIcon,
} from 'lucide-react';

/** Keys must match the `icon` values in src/config.ts. */
export const Icons: Partial<Record<string, LucideIcon>> = {
  shield: Shield,
  globe: Globe,
  image: ImageIcon,
  'refresh-cw': RefreshCw,
  database: Database,
  check: Check,
  grid: Grid3x3,
  message: MessageSquare,
  book: Book,
  'arrow-right': ArrowRight,
  'book-open': BookOpen,
};

export const HeroIcons: Record<
  'operational' | 'degraded' | 'down' | 'loading' | 'error',
  LucideIcon
> = {
  operational: Check,
  degraded: CircleAlert,
  down: CircleX,
  loading: RefreshCw,
  error: CircleAlert,
};

export const StatusLabels: Record<string, string> = {
  operational: 'ใช้งานได้',
  degraded: 'มีปัญหา',
  down: 'ใช้งานไม่ได้',
  loading: 'กำลังโหลด...',
};

export const HeroTitles: Record<string, string> = {
  operational: 'ระบบทั้งหมดใช้งานได้ปกติ',
  degraded: 'บางระบบมีปัญหา',
  down: 'ระบบมีปัญหา',
};
