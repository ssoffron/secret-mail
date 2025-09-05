import React, { useState, useCallback } from 'react';
import Input from './Input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Check, Copy, Eraser, Plus } from 'lucide-react';
import WaxSeal from '@/assets/icons/WaxSeal';

// --- Start of Web Crypto API Helpers ---
const PWD_ITERATIONS = 100000;

// Converts an ArrayBuffer to a Base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Derives a key from a password and salt using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PWD_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// Encrypts a message using the derived key
async function encryptMessage(
  message: string,
  key: CryptoKey,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const enc = new TextEncoder();
  const encodedMessage = enc.encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for AES-GCM
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedMessage,
  );
  return { iv, ciphertext };
}
// --- End of Web Crypto API Helpers ---

interface Paragraph {
  id: string;
  message: string;
  password: string;
  hint: string;
}

interface EncryptedParagraph {
  hint: string;
  salt: string; // Base64
  iv: string; // Base64
  data: string; // Base64
}

const linedPaperStyle = {
  lineHeight: '2.1em',
  backgroundImage: 'linear-gradient(transparent 2.05em, #eaddc7 2.05em)', // cream-300
  backgroundSize: '100% 2.1em',
};

const MailSend: React.FC = () => {
  const firstParagraphId = crypto.randomUUID();
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([
    { id: firstParagraphId, message: '', password: '', hint: '' },
  ]);
  const [openParagraphId, setOpenParagraphId] = useState<string | null>(firstParagraphId);
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  const handleParagraphChange = (id: string, field: keyof Omit<Paragraph, 'id'>, value: string) => {
    setParagraphs((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddParagraph = () => {
    const newId = crypto.randomUUID();
    setParagraphs((prev) => [...prev, { id: newId, message: '', password: '', hint: '' }]);
    setOpenParagraphId(newId);
  };

  const handleRemoveParagraph = (id: string) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEncrypt = async () => {
    setError('');
    setEncryptedOutput('');

    const isInvalid = paragraphs.some((p) => !p.message.trim() || !p.password.trim());
    if (isInvalid) {
      setError('All message and password fields are required for each paragraph.');
      return;
    }

    setIsEncrypting(true);
    try {
      const encryptedDataPromises = paragraphs.map(async (p): Promise<EncryptedParagraph> => {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await getKey(p.password, salt);
        const { iv, ciphertext } = await encryptMessage(p.message, key);

        return {
          hint: p.hint,
          salt: bufferToBase64(salt),
          iv: bufferToBase64(iv),
          data: bufferToBase64(ciphertext),
        };
      });

      const encryptedData = await Promise.all(encryptedDataPromises);
      setEncryptedOutput(JSON.stringify(encryptedData, null, 2));
    } catch (e) {
      setError('An unexpected error occurred during encryption.');
      console.error(e);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='space-y-2'>
        {paragraphs.map((p) => (
          <ParagraphInput
            key={p.id}
            paragraphId={p.id}
            paragraphText={p.message}
            onParagraphTextChange={(text) => handleParagraphChange(p.id, 'message', text)}
          >
            <DeleteParagraphButton onClick={() => handleRemoveParagraph(p.id)} />
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
                  placeholder='Enter a strong password'
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
        <WaxSeal />
        {isEncrypting ? 'Encrypting...' : 'Seal & Encrypt Letter'}
      </Button>

      {encryptedOutput && <EncryptedOutput output={encryptedOutput} />}
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
        'flex items-center px-4 py-2 border border-transparent rounded-md cursor-pointer transition-colors text-sm font-medium text-stone-700 bg-amber-200',
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
        'mt-1 flex items-center p-3 text-sm font-medium rounded-full transition-colors cursor-pointer bg-amber-200 text-stone-700 hover:bg-amber-200/80',
        'data-[state=open]:bg-red-600 data-[state=open]:text-amber-50',
      )}
      aria-label='Set password for this paragraph'
      {...props}
    >
      <WaxSeal className='h-5 w-5' />
    </Button>
  );
};

interface EncryptedOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  output: string;
}

const EncryptedOutput = ({ className, output, ...props }: EncryptedOutputProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  }, [output]);

  return (
    <div className='mt-6' {...props}>
      <div className='flex justify-between items-center mb-2'>
        <h3 className='text-lg font-semibold text-stone-900'>Encrypted Letter</h3>
        <Button
          onClick={handleCopy}
          className='flex items-center px-3 py-1.5 text-sm font-medium text-stone-700 bg-amber-200 hover:bg-amber-200/80 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-red-600'
        >
          {isCopied ? (
            <Check className='h-4 w-4 mr-1.5 text-green-600' />
          ) : (
            <Copy className='h-4 w-4 mr-1.5' />
          )}
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre
        style={linedPaperStyle}
        className='text-stone-700 break-all p-2 font-mono text-sm select-all whitespace-pre-wrap min-h-[120px]'
      >
        <code>{output}</code>
      </pre>
    </div>
  );
};
