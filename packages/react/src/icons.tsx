import type { JSX } from "react";

export type ProviderId = "openai" | "anthropic";

export function OpenAIIcon(props: { size?: number }): JSX.Element {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.28 9.82a5.99 5.99 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.5-2.9A6 6 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08Zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.5 4.5 0 0 1-4.49 4.49ZM3.6 18.3a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76c.24.14.53.14.77 0l5.84-3.37v2.33a.08.08 0 0 1-.03.07l-4.83 2.79a4.5 4.5 0 0 1-6.13-1.66Zm-1.26-10.4a4.48 4.48 0 0 1 2.35-1.97v5.68c0 .28.15.54.39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0L4.02 14a4.5 4.5 0 0 1-1.68-6.1Zm16.6 3.86-5.84-3.38 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.67a.79.79 0 0 0-.4-.68Zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.78 0L9.42 9.24V6.9a.07.07 0 0 1 .03-.07l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66ZM8.32 12.87 6.3 11.7a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.71 5.46a.79.79 0 0 0-.39.68v6.73Zm1.1-2.36L12 9.24l2.6 1.5v3l-2.6 1.5-2.6-1.5v-3Z" />
    </svg>
  );
}

export function AnthropicIcon(props: { size?: number }): JSX.Element {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M15.4 3h-3.16l5.76 18h3.16L15.4 3Zm-7.02 0L2.62 21h3.22l1.18-3.75h6.02L11.86 21h.02L8.4 3H8.38Zm-.44 11.02L9.9 7.9l1.96 6.12H7.94Z" />
    </svg>
  );
}

export function ProviderIcon(props: {
  provider: ProviderId;
  size?: number;
}): JSX.Element {
  return props.provider === "openai" ? (
    <OpenAIIcon size={props.size} />
  ) : (
    <AnthropicIcon size={props.size} />
  );
}
