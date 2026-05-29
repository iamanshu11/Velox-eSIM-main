import React, { useMemo } from 'react';
import Image from 'next/image';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
  size?: number;
}

const CountryFlagIcon: React.FC<CountryFlagProps> = ({ countryCode, className = '', size = 24 }) => {
  const flagUrl = useMemo(() => {
    if (!countryCode) return null;

    const codeMatch = countryCode.match(/^([a-zA-Z]{2})/);
    const code = codeMatch ? codeMatch[1].toUpperCase() : countryCode.substring(0, 2).toUpperCase();

    if (!code || code.length < 2) return null;

    return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
  }, [countryCode]);

  if (!flagUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-gray-100 text-gray-400 text-[10px] font-bold ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }

  return (
    <Image
      src={flagUrl}
      alt={`${countryCode} flag`}
      width={size}
      height={Math.round(size * 0.75)}
      unoptimized
      className={`rounded-sm object-cover ${className}`}
    />
  );
};

export default CountryFlagIcon;
