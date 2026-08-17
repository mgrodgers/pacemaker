interface IconProps {
  size?: number;
}

export function PlusIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={20} strokeLinecap="round">
      <path d="M128,32 L128,224 M32,128 L224,128" />
    </svg>
  );
}

export function BackIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round">
      <path d="M168,208 L88,128 L168,48" />
    </svg>
  );
}

export function RenameIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
      <path d="M92,208 L40,216 L48,164 L172,40 L216,84 Z" />
    </svg>
  );
}

export function DuplicateIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
      <rect x="88" y="88" width="128" height="128" rx="12" />
      <path d="M168,88 L168,56 A16,16 0 0 0 152,40 L56,40 A16,16 0 0 0 40,56 L40,152 A16,16 0 0 0 56,168 L88,168" />
    </svg>
  );
}

export function DeleteIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
      <path d="M56,64 L200,64 M96,64 L96,40 A8,8 0 0 1 104,32 L152,32 A8,8 0 0 1 160,40 L160,64 M184,64 L184,208 A16,16 0 0 1 168,224 L88,224 A16,16 0 0 1 72,208 L72,64" />
    </svg>
  );
}

export function DragHandleIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
      <circle cx="92" cy="64" r="14" />
      <circle cx="164" cy="64" r="14" />
      <circle cx="92" cy="128" r="14" />
      <circle cx="164" cy="128" r="14" />
      <circle cx="92" cy="192" r="14" />
      <circle cx="164" cy="192" r="14" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round">
      <path d="M64,96 L128,160 L192,96" />
    </svg>
  );
}

export function SettingsIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="128" cy="128" r="36" />
      <path d="M144,26 L152,54 A96,96 0 0 1 172,64 L198,50 L214,66 L200,92 A96,96 0 0 1 210,112 L238,120 L238,144 L210,152 A96,96 0 0 1 200,172 L214,198 L198,214 L172,200 A96,96 0 0 1 152,210 L144,238 L120,238 L112,210 A96,96 0 0 1 92,200 L66,214 L50,198 L64,172 A96,96 0 0 1 54,152 L26,144 L26,120 L54,112 A96,96 0 0 1 64,92 L50,66 L66,50 L92,64 A96,96 0 0 1 112,54 L120,26 Z" />
    </svg>
  );
}

export function FeedbackIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
      <path d="M32,56 A16,16 0 0 1 48,40 L208,40 A16,16 0 0 1 224,56 L224,152 A16,16 0 0 1 208,168 L96,168 L56,208 L56,168 L48,168 A16,16 0 0 1 32,152 Z" />
    </svg>
  );
}

export function RouteIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="60" cy="200" r="24" />
      <circle cx="196" cy="56" r="24" />
      <path d="M60,176 L60,120 C60,90 90,90 120,90 L150,90 C180,90 196,90 196,80" />
    </svg>
  );
}

export function TotalsIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
      <path d="M48,208 L48,152 M128,208 L128,104 M208,208 L208,56" />
    </svg>
  );
}

export function HelpIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="128" cy="128" r="96" />
      <path d="M96,96 A32,32 0 1 1 140,142 C132,148 128,154 128,166" />
      <circle cx="128" cy="196" r="7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={24} strokeLinecap="round">
      <path d="M56,200 L200,56 M56,56 L200,200" />
    </svg>
  );
}
