type CompletedLabReviewButtonProps = {
  label?: string;
  onReview: () => void;
};

export function CompletedLabReviewButton({
  label = "Review exercises",
  onReview,
}: CompletedLabReviewButtonProps) {
  return (
    <div className="completed-lab-review">
      <button type="button" onClick={onReview}>
        {label} <span aria-hidden="true">↺</span>
      </button>
      <p>Practice again in this browser. Your saved completion stays unchanged.</p>
    </div>
  );
}
