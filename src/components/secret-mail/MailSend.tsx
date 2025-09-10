import React, { useState } from 'react';
import Input from './Input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Check, Eraser, Plus } from 'lucide-react';
import WaxSeal from '@/assets/icons/WaxSeal';
import { encryptParagraphs, encodeDataForURL, type Paragraph } from '@/lib/crypto';

const linedPaperStyle = {
  lineHeight: '2.1em',
  backgroundImage: 'linear-gradient(transparent 2.05em, #eaddc7 2.05em)', // cream-300
  backgroundSize: '100% 2.1em',
};

const MailSend: React.FC = () => {
  const firstParagraphId = crypto.randomUUID();
  const [title, setTitle] = useState<string>('');
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([
    { id: firstParagraphId, message: '', password: '', hint: '' },
  ]);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleParagraphChange = (id: string, field: keyof Omit<Paragraph, 'id'>, value: string) => {
    setParagraphs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddParagraph = () => {
    const newId = crypto.randomUUID();
    setParagraphs((prev) => [...prev, { id: newId, message: '', password: '', hint: '' }]);
  };

  const handleRemoveParagraph = (id: string) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEncrypt = async () => {
    setError('');
    setWarning('');
    setIsCopied(false);

    const isInvalid = paragraphs.some((p) => !p.message.trim() || !p.password.trim());
    if (isInvalid) {
      setError('All message and password fields are required for each paragraph.');
      return;
    }

    setIsEncrypting(true);
    try {
      const encryptedLetter = await encryptParagraphs(title || '', paragraphs);

      // Generate shareable URL
      const compressed = encodeDataForURL(encryptedLetter);
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/secret-mail/receive?d=${compressed}`;

      // Copy to clipboard immediately
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);

      // Check URL length and warn if too long
      if (url.length > 8000) {
        setWarning(
          'Warning: The generated URL is very long and may not work in some browsers (especially Firefox). Consider shortening your message.',
        );
      }
    } catch (e) {
      setError('An unexpected error occurred during encryption.');
      console.error(e);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Input
        id='letter-title'
        label='Letter Title (optional)'
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Enter a title for your letter...'
      />

      <div className='space-y-2'>
        {paragraphs.map((p, index) => (
          <ParagraphInput
            key={p.id}
            paragraphId={p.id}
            paragraphText={p.message}
            onParagraphTextChange={(text) => handleParagraphChange(p.id, 'message', text)}
          >
            {index > 0 && <DeleteParagraphButton onClick={() => handleRemoveParagraph(p.id)} />}
            <Popover>
              <PopoverTrigger asChild>
                <PasswordBalloonTrigger />
              </PopoverTrigger>
              <PopoverContent
                className='relative bg-amber-100 rounded-lg p-4 shadow-md space-y-4 z-10'
                side='right'
                align='start'
                sideOffset={4}
              >
                <Input
                  id={`password-${p.id}`}
                  label='Password'
                  type='password'
                  value={p.password}
                  onChange={(e) => handleParagraphChange(p.id, 'password', e.target.value)}
                  placeholder='Enter a password for this paragraph'
                />
                <Input
                  id={`hint-${p.id}`}
                  label='Password Hint (optional)'
                  type='text'
                  value={p.hint}
                  onChange={(e) => handleParagraphChange(p.id, 'hint', e.target.value)}
                  placeholder="e.g., 'Our anniversary date'"
                />
              </PopoverContent>
            </Popover>
          </ParagraphInput>
        ))}
      </div>

      <AddParagraphButton className='mx-auto' onClick={handleAddParagraph} />

      {error && <p className='text-red-700 text-sm text-center'>{error}</p>}

      <Button onClick={handleEncrypt} disabled={isEncrypting} className='w-full'>
        {isEncrypting ? (
          <>
            <WaxSeal />
            Encrypting...
          </>
        ) : isCopied ? (
          <>
            <Check className='h-5 w-5 mr-2' />
            Link Copied!
          </>
        ) : (
          <>
            <WaxSeal />
            Share Sealed & Encrypted Letter
          </>
        )}
      </Button>

      {warning && (
        <p className='text-amber-700 text-sm text-center bg-amber-50 p-2 rounded'>{warning}</p>
      )}
    </div>
  );
};

export default MailSend;

/** -------------------------------------------------------------
 *  Components
 *  ------------------------------------------------------------- */

interface ParagraphInputProps extends React.HTMLAttributes<HTMLInputElement> {
  paragraphId: string;
  paragraphText: string;
  onParagraphTextChange: (text: string) => void;
}

const ParagraphInput = ({
  className,
  paragraphId,
  paragraphText,
  onParagraphTextChange,
  children,
  ...props
}: ParagraphInputProps) => {
  return (
    <div className='relative flex items-start justify-between space-x-6 pt-4 first:pt-0' {...props}>
      <Input
        id={`message-${paragraphId}`}
        label='Message'
        labelClassName='sr-only'
        isTextArea
        value={paragraphText}
        onChange={(e) => onParagraphTextChange(e.target.value)}
        placeholder='Write your paragraph here...'
      />
      {children}
    </div>
  );
};

interface AddParagraphButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AddParagraphButton = ({ className, ...props }: AddParagraphButtonProps) => {
  return (
    <Button
      variant='outline'
      className={cn(
        'flex items-center px-4 py-2 border border-transparent rounded-md transition-colors text-sm font-medium text-stone-700 bg-amber-200',
        'hover:bg-amber-200/80 hover:border-stone-400',
        className,
      )}
      {...props}
    >
      <Plus className='h-5 w-5 mr-2' />
      Add Paragraph
    </Button>
  );
};

interface DeleteParagraphButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DeleteParagraphButton = ({ className, ...props }: DeleteParagraphButtonProps) => {
  return (
    <Button
      className='absolute top-0 right-12 bg-red-600 hover:bg-red-700 text-amber-50 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-red-600 z-10 transition-colors'
      aria-label='Remove paragraph'
      {...props}
    >
      <Eraser className='h-4 w-4' />
    </Button>
  );
};

interface PasswordBalloonTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}

const PasswordBalloonTrigger = ({ className, ...props }: PasswordBalloonTriggerProps) => {
  return (
    <Button
      className={cn(
        'mt-1 flex items-center p-3 text-sm font-medium rounded-full transition-colors bg-amber-200 text-stone-700 hover:bg-amber-200/80',
        'data-[state=open]:bg-red-600 data-[state=open]:text-amber-50',
      )}
      aria-label='Set password for this paragraph'
      {...props}
    >
      <WaxSeal className='h-5 w-5' />
    </Button>
  );
};
