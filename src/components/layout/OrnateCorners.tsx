export function OrnateCorners() {
  return (
    <>
      <div className="ornate-corner top-left" aria-hidden="true">
        <CornerSvg />
      </div>
      <div className="ornate-corner top-right" aria-hidden="true">
        <CornerSvg />
      </div>
      <div className="ornate-corner bottom-left" aria-hidden="true">
        <CornerSvg />
      </div>
      <div className="ornate-corner bottom-right" aria-hidden="true">
        <CornerSvg />
      </div>
    </>
  );
}

function CornerSvg() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 100 100">
      <path d="M10 10 C 30 10, 10 30, 40 40 C 60 50, 40 80, 10 90" />
      <path d="M10 10 C 10 40, 40 40, 50 10" />
      <circle cx="10" cy="10" fill="currentColor" r="2" />
    </svg>
  );
}
