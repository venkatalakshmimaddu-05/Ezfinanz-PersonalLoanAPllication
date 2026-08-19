export default function ReviewStatus() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-amber-100" />
      <p className="text-lg font-semibold text-ink-900">Under review</p>
      <p className="mt-2 text-sm text-ink-600">
        Your application and selfie are with our verification team. This usually takes 1–2
        business days. We'll notify you once there's a decision.
      </p>
    </div>
  );
}
