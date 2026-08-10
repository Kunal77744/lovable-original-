"use client";

export function PrintCertificateButton({
  label = "Print certificate",
}: {
  label?: string;
}) {
  return (
    <button
      className="certificate-print-button"
      type="button"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
