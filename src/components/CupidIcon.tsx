export const CupidIcon = ({ size = 64, className = '' }: { size?: number; className?: string }) => (
  <img
    src="/cupid_converted.svg"
    alt="EROS Cupid"
    width={size}
    height={size}
    className={className}
    style={{ width: size, height: size }}
  />
);
