import { formatBytes, useNetworkMonitor } from "./hooks/useNetworkMonitor";

export function PrivacyMeter() {
  const bytes = useNetworkMonitor();
  const isPrivate = bytes === 0;
  return (
    <div className="flex items-center gap-2 text-xs" title="Monitors outbound network traffic from this page">
      <span
        className={`inline-flex size-2 rounded-full ${isPrivate ? "bg-emerald-500" : "bg-rose-500"}`}
        aria-hidden
      />
      <span className={isPrivate ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
        {isPrivate ? "0 bytes uploaded" : `${formatBytes(bytes)} uploaded`}
      </span>
    </div>
  );
}
