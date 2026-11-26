import type { ButtonHTMLAttributes, ReactNode } from "react";
import { uiSound } from "../../audio/useSound";
import styles from "./Gothic.module.css";

export function Gem({
  className = "",
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg className={`${styles.gem} ${className}`} width={size} height={size * 1.25}viewBox="0 0 20 25" aria-hidden>
      <defs>
        <linearGradient id="gemFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0a6ff" />
          <stop offset="0.5" stopColor="#a423c8" />
          <stop offset="1" stopColor="#4b0f66" />
        </linearGradient>
      </defs>
      <path d="M10 1l8 11.5L10 24 2 12.5z" fill="url(#gemFill)" stroke="#e8c777" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 1v23M2 12.5h16M10 1L6 12.5 10 24l4-11.5z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
    </svg>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg className={`${styles.corner} ${className}`} viewBox="0 0 64 64" aria-hidden>

      <path d="M3 61V26C3 12 12 3 26 3h35" />
      <path d="M11 44C11 24 24 11 44 11" />
      <path d="M17 33c-9 0-9-12 0-12 7 0 8 9 2 10" />
      <path d="M30 20c0-8 12-8 12 0" />
      <circle cx="49" cy="6" r="2.2" className={styles.fill} />
      <circle cx="6" cy="49" r="2.2" className={styles.fill} />
    </svg>
  );
}

export function GothicPanel({
  className = "",
  children,
  gems = true,
}: {
  className?: string;
  children?: ReactNode;
  gems?: boolean;
}) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <Corner className={styles.tl} />
      <Corner className={styles.tr} />
      <Corner className={styles.bl} />
      <Corner className={styles.br} />
      {gems && (
        <>
          <Gem className={styles.gemTop} />
          <Gem className={styles.gemBottom} />
        </>
      )}
      {children}
    </div>
  );
}

export function IconButton({
  children,
  label,
  shape = "round",
  className = "",
  ...rest
}: {
  children: ReactNode;
  label: string;
  shape?: "round" | "hex";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className={`${styles.iconBtn} ${shape === "hex" ? styles.hex : ""} ${className}`} {...uiSound} {...rest}>
      {children}
    </button>
  );
}

export function PlateButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${styles.plate} ${className}`}
      {...(rest.disabled ? {} : uiSound)} {...rest}>

      <Gem className={styles.plateGemTop} size={16} />
      <span>{children}</span>

      <Gem className={styles.plateGemBottom} size={16} />
    </button>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <svg className={`${styles.divider} ${className}`} viewBox="0 0 400 24" aria-hidden>

      <path d="M6 12H168M232 12H394" />
      <path d="M168 12c10-9 20-9 32 0 12-9 22-9 32 0M168 12c10 9 20 9 32 0 12 9 22 9 32 0"/>
      <path d="M200 3l5 9-5 9-5-9z" className={styles.fill}/>
    </svg>
  );
}

export function TitleLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.logo} ${className}`}>
      <Gem size={14} />
      <span className={styles.logoSmall}>The Last</span>
      <span className={styles.logoBig}>Invitation</span>
      <Divider />
    </div>
  );
}