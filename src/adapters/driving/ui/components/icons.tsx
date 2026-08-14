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
      <path d="M128,20 L128,52 M128,204 L128,236 M20,128 L52,128 M204,128 L236,128 M52,52 L74,74 M182,182 L204,204 M204,52 L182,74 M74,182 L52,204" />
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
