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
    const code = codeMatch ? codeMatch[1].toUpperCase() : countryCode.toUpperCase();
    if (code === 'EU') {
      return `https://p.qrsim.net/img/flags/eu-42.png`;
    }
    
    const countryCode_lower = code.substring(0, 2).toLowerCase();
    return `https://p.qrsim.net/img/flags/${countryCode_lower}.png`;
  }, [countryCode]);

  if (!flagUrl) {
    return <span className={className}>Globe</span>;
  }

  return (
    <Image
      src={flagUrl}
      alt={`${countryCode} flag`}
      width={size}
      height={size}
      className={`rounded-sm ${className}`}
    />
  );
};

export default CountryFlagIcon;
