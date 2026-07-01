import type { AnchorHTMLAttributes, CSSProperties, JSX, ReactNode } from "react";
import { ProviderIcon, type ProviderId } from "./icons.js";

const LABELS: Record<ProviderId, string> = {
  openai: "Connect with OpenAI",
  anthropic: "Connect with Claude",
};

const THEME: Record<ProviderId, { bg: string; fg: string }> = {
  openai: { bg: "#000000", fg: "#ffffff" },
  anthropic: { bg: "#d97757", fg: "#ffffff" },
};

export interface ConnectButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  provider: ProviderId;
  /**
   * Base path of your server's connect route. The provider id is appended,
   * so the button links to `${connectPath}/${provider}`.
   * @default "/api/oauth-ai/connect"
   */
  connectPath?: string;
  /** Override the full href instead of using `connectPath`. */
  href?: string;
  /** Override the default label text. */
  label?: ReactNode;
  /** Hide the provider icon. */
  hideIcon?: boolean;
  /** Use `unstyled` to drop the built-in inline styles entirely. */
  unstyled?: boolean;
}

/**
 * A "Connect with OpenAI/Claude" button rendered as an anchor. Clicking it
 * navigates to your server route, which starts the OAuth flow. Works without
 * client-side JS; pass `onClick` if you want to intercept.
 */
export function ConnectButton({
  provider,
  connectPath = "/api/oauth-ai/connect",
  href,
  label,
  hideIcon,
  unstyled,
  style,
  ...rest
}: ConnectButtonProps): JSX.Element {
  const theme = THEME[provider];
  const baseStyle: CSSProperties = unstyled
    ? {}
    : {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.625rem 1rem",
        borderRadius: "0.5rem",
        border: "none",
        background: theme.bg,
        color: theme.fg,
        font: "500 0.9375rem/1.2 system-ui, sans-serif",
        textDecoration: "none",
        cursor: "pointer",
      };

  return (
    <a
      href={href ?? `${connectPath}/${provider}`}
      style={{ ...baseStyle, ...style }}
      {...rest}
    >
      {!hideIcon && <ProviderIcon provider={provider} />}
      {label ?? LABELS[provider]}
    </a>
  );
}
