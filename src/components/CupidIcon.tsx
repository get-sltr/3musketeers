export const CupidIcon = ({ size = 64, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 240"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Head */}
    <circle cx="100" cy="60" r="35" fill="#f4a460" />

    {/* Face - simple dots */}
    <circle cx="90" cy="55" r="4" fill="#000" />
    <circle cx="110" cy="55" r="4" fill="#000" />
    <path d="M 95 65 Q 100 68 105 65" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />

    {/* Hair/curls */}
    <circle cx="70" cy="45" r="8" fill="#d4a574" />
    <circle cx="130" cy="45" r="8" fill="#d4a574" />
    <circle cx="65" cy="60" r="6" fill="#d4a574" />
    <circle cx="135" cy="60" r="6" fill="#d4a574" />

    {/* Wings - lime green */}
    <path
      d="M 70 80 Q 50 70 45 90 Q 50 85 70 90 Z"
      fill="#ccff00"
      stroke="#b3e900"
      strokeWidth="1.5"
    />
    <path
      d="M 130 80 Q 150 70 155 90 Q 150 85 130 90 Z"
      fill="#ccff00"
      stroke="#b3e900"
      strokeWidth="1.5"
    />

    {/* Wing details */}
    <path d="M 55 82 Q 58 75 62 80" stroke="#b3e900" strokeWidth="1" fill="none" strokeLinecap="round" />
    <path d="M 145 82 Q 142 75 138 80" stroke="#b3e900" strokeWidth="1" fill="none" strokeLinecap="round" />

    {/* Body/Tunic - lime green */}
    <ellipse cx="100" cy="125" rx="25" ry="35" fill="#ccff00" />

    {/* Arms */}
    <rect x="50" y="110" width="50" height="12" rx="6" fill="#f4a460" />
    <rect x="100" y="110" width="50" height="12" rx="6" fill="#f4a460" />

    {/* Bow - left arm holds bow */}
    <circle cx="45" cy="115" r="12" fill="none" stroke="#ff1493" strokeWidth="2.5" />
    <line x1="33" y1="115" x2="57" y2="115" stroke="#ff1493" strokeWidth="2" />

    {/* Arrow - right arm draws arrow */}
    <line x1="155" y1="115" x2="170" y2="100" stroke="#ff1493" strokeWidth="2.5" />
    <polygon points="170,100 165,95 168,105" fill="#ff1493" />
    {/* Arrow string */}
    <line x1="150" y1="115" x2="170" y2="100" stroke="#ff1493" strokeWidth="1.5" />

    {/* Legs */}
    <rect x="85" y="160" width="12" height="40" rx="6" fill="#f4a460" />
    <rect x="103" y="160" width="12" height="40" rx="6" fill="#f4a460" />

    {/* Feet */}
    <ellipse cx="91" cy="205" rx="8" ry="10" fill="#f4a460" />
    <ellipse cx="109" cy="205" rx="8" ry="10" fill="#f4a460" />

    {/* Heart floating near arrow */}
    <path
      d="M 180 80 Q 175 70 170 70 Q 165 70 165 75 Q 165 80 175 90 Q 185 80 185 75 Q 185 70 180 70 Z"
      fill="#ff1493"
    />
  </svg>
);
