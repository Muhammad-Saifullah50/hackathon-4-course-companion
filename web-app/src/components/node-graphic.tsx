export function NodeGraphic() {
  return (
    <svg
      viewBox="0 0 520 360"
      fill="none"
      className="h-auto w-full text-[var(--emerald)]"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity=".45">
        <path d="M90 180 210 80l120 95 105-75M90 180l125 105 115-110 105 85" />
        <path d="m210 80 5 205m115-110 0 120M90 180l345 80" opacity=".35" />
      </g>
      {[
        [90, 180, 26],
        [210, 80, 18],
        [215, 285, 22],
        [330, 175, 34],
        [435, 100, 17],
        [435, 260, 24],
      ].map(([cx, cy, r], index) => (
        <g key={index}>
          <circle cx={cx} cy={cy} r={r} fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={Math.max(4, r / 4)} fill="currentColor" />
        </g>
      ))}
      <circle cx="330" cy="175" r="62" stroke="currentColor" opacity=".18" />
      <circle cx="330" cy="175" r="88" stroke="currentColor" opacity=".08" />
    </svg>
  );
}
