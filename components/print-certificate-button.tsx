"use client";

export function PrintCertificateButton() {
  return (
    <button
      className="certificate-print-button"
      type="button"
      onClick={() => window.print()}
    >
      Print certificate
    </button>
  );
}
