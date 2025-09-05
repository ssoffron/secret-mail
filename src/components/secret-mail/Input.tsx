import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  isTextArea = false,
  labelClassName,
  className,
  ...props
}) => {
  const commonInputClasses =
    'mt-1 block w-full px-1 py-2 bg-transparent border-0 border-b border-amber-200 rounded-none text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-0 focus:border-stone-700 transition duration-150 ease-in-out';

  const textAreaClasses =
    'mt-1 block w-full bg-transparent border-0 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-0 resize-none px-2 min-h-[120px]';

  const linedPaperStyle = {
    lineHeight: '2.1em',
    backgroundImage: 'linear-gradient(transparent 2.05em, #eaddc7 2.05em)',
    backgroundSize: '100% 2.1em',
  };

  return (
    <div className='w-full'>
      <label
        htmlFor={id}
        className={`block text-sm font-medium text-stone-700 ${labelClassName || ''}`}
      >
        {label}
      </label>
      {isTextArea ? (
        <textarea
          id={id}
          className={`${textAreaClasses} ${className || ''}`}
          style={linedPaperStyle}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          className={`${commonInputClasses} ${className || ''}`}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  );
};

export default Input;
