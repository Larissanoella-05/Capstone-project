import { Link } from 'react-router-dom';

export function Bolt({ size = 30, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      aria-hidden="true"
      style={{ fill: 'var(--y)' }}
      {...rest}
    >
      <path d="M17.5 1.5L5 17h7.5l-2 11.5L23 13h-7.5z" />
    </svg>
  );
}

export function ArrowUpRight({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 10L10 2M4 2h6v6" />
    </svg>
  );
}

export function ChevronDown({ size = 14, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 5l5 5 5-5" />
    </svg>
  );
}

export function PhoneIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 3h3l2 5-2 1a9 9 0 004 4l1-2 5 2v3a2 2 0 01-2 2A14 14 0 012 5a2 2 0 012-2z" />
    </svg>
  );
}

export function LoginLink({ link, children, ...rest }) {
  return (
    <Link to={link.to} state={link.state} {...rest}>
      {children}
    </Link>
  );
}

export function PathIcon({ path, size = 22, viewBox = 22, stroke = '#555', strokeWidth = 1.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
