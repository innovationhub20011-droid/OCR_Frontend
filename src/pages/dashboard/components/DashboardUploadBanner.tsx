type DashboardUploadBannerProps = {
  onUpload: () => void;
};

export function DashboardUploadBanner({ onUpload }: DashboardUploadBannerProps): JSX.Element {
  return (
    <section className="dashboard-ocr-banner">
      <div className="dashboard-ocr-banner-content">
        <h2>Verify and Process Documents in Seconds</h2>
        <p>Upload PAN, Aadhaar, Bank Forms, and Loan Applications securely. Get structured data instantly.</p>
      </div>
      <div className="dashboard-ocr-banner-art">
        <button className="dashboard-upload-action" type="button" aria-label="Upload Document" onClick={onUpload}>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 11h14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6zm3 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="currentColor"/>
          </svg>
          <span>Upload Document</span>
        </button>
      </div>
    </section>
  );
}
