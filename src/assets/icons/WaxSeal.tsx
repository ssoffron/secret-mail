import React from 'react';

interface IconProps {
  className?: string;
}

export const WaxSeal: React.FC<IconProps> = ({ className = 'h-6 w-6' }) => (
  <svg xmlns='http://www.w3.org/2000/svg' className={className} viewBox='0 0 24 24'>
    <path fill='#B91C1C' d='M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z' />
    <path
      fill='#DC2626'
      d='M13.2,3.3C10.1,2,6.4,3.1,4.1,5.9C2.1,8.4,2.3,12,4.4,14.8c2.6,3.4,6.9,4.8,10.6,3.6 c3.6-1.2,5.9-4.7,5.7-8.3C20.5,6.2,17.1,3.1,13.2,3.3z'
    />
    <path
      fill='#F87171'
      opacity='0.8'
      d='M14.6,4.6c-2.4-1-5.2-0.5-7,1.2C6,7.3,5.8,9.9,6.9,12.1c1.3,2.6,4.1,4,6.9,3.5 c2.8-0.5,4.8-2.9,4.9-5.7C18.8,6.8,17.1,5.1,14.6,4.6z'
    />
  </svg>
);

export default WaxSeal;
