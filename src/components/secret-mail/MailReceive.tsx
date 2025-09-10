import React, { useState, useEffect } from 'react';
import Input from './Input';
import { Button } from '@/components/ui/button';
import BrokenWaxSeal from '@/assets/icons/BrokenWaxSeal';
import {
  base64ToBuffer,
  getKey,
  decryptMessage,
  decodeDataFromURL,
  type EncryptedParagraph,
  type EncryptedLetter,
} from '@/lib/crypto';

interface DecryptionState extends EncryptedParagraph {
  id: string;
  passwordInput: string;
  decryptedMessage: string;
  error: string;
  isDecrypted: boolean;
}

const linedPaperStyle = {
  lineHeight: '2.1em',
  backgroundImage: 'linear-gradient(transparent 2.05em, #eaddc7 2.05em)', // cream-300
  backgroundSize: '100% 2.1em',
};

const MailReceive: React.FC = () => {
  const [letterTitle, setLetterTitle] = useState<string>('');
  const [decryptionItems, setDecryptionItems] = useState<DecryptionState[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load and decode data from URL parameter (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('d');

    if (!dataParam) {
      setIsLoaded(false);
      return;
    }

    const decoded = decodeDataFromURL(dataParam);
    if (!decoded) {
      setError('Invalid or corrupted data in URL. Please check the link.');
      setIsLoaded(false);
      return;
    }

    const items: DecryptionState[] = decoded.paragraphs.map((item: EncryptedParagraph) => ({
      ...item,
      id: crypto.randomUUID(),
      passwordInput: '',
      decryptedMessage: '',
      error: '',
      isDecrypted: false,
    }));

    setLetterTitle(decoded.title);
    setDecryptionItems(items);
    setIsLoaded(true);
  }, []);

  const handleDecryptionPasswordChange = (id: string, value: string) => {
    setDecryptionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passwordInput: value } : item)),
    );
  };

  const handleDecryptItem = async (id: string) => {
    const itemToDecrypt = decryptionItems.find((item) => item.id === id);
    if (!itemToDecrypt) return;

    if (!itemToDecrypt.passwordInput.trim()) {
      setDecryptionItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, error: 'Password required.' } : item)),
      );
      return;
    }

    try {
      const salt = new Uint8Array(base64ToBuffer(itemToDecrypt.salt));
      const iv = new Uint8Array(base64ToBuffer(itemToDecrypt.iv));
      const ciphertext = base64ToBuffer(itemToDecrypt.ciphertext);

      const key = await getKey(itemToDecrypt.passwordInput, salt);
      const decryptedText = await decryptMessage(ciphertext, key, iv);

      setDecryptionItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, decryptedMessage: decryptedText, error: '', isDecrypted: true }
            : item,
        ),
      );
    } catch (e) {
      console.error('Decryption failed:', e);
      // The Web Crypto API throws a generic error on failure, which almost always means wrong password/tampered data.
      setDecryptionItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                error: 'Incorrect password or corrupted data.',
                decryptedMessage: '',
                isDecrypted: false,
              }
            : item,
        ),
      );
    }
  };

  return (
    <div className='space-y-4'>
      {!isLoaded ? (
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-8 text-center'>
          <p className='text-stone-700 text-base mb-2'>No encrypted letter found in URL</p>
          <p className='text-stone-500 text-sm'>
            Please use a link generated from the Send page to view an encrypted letter.
          </p>
        </div>
      ) : (
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 text-center'>
          <p className='text-stone-700 text-sm'>
            Letter loaded from link. Enter the password(s) below to reveal the message.
          </p>
        </div>
      )}

      {error && <p className='text-red-700 text-sm text-center'>{error}</p>}

      {decryptionItems.length > 0 && (
        <div className='mt-6 space-y-4'>
          <h3 className='text-xl font-semibold text-stone-900 text-center'>{letterTitle}</h3>
          {decryptionItems.map((item, index) => (
            <div key={item.id} className='pt-4 border-t border-dashed border-amber-200'>
              {item.hint && <p className='text-sm text-stone-400 italic mb-2'>Hint: {item.hint}</p>}

              {item.isDecrypted ? (
                <div style={linedPaperStyle} className='p-2 min-h-[60px]'>
                  <p className='text-stone-700 whitespace-pre-wrap'>{item.decryptedMessage}</p>
                </div>
              ) : (
                <div className='flex items-start space-x-2'>
                  <div className='flex-grow'>
                    <Input
                      id={`decrypt-pass-${item.id}`}
                      label={`Password for paragraph ${index + 1}`}
                      labelClassName='sr-only'
                      type='password'
                      value={item.passwordInput}
                      onChange={(e) => handleDecryptionPasswordChange(item.id, e.target.value)}
                      placeholder='Enter password to reveal'
                    />
                    {item.error && <p className='text-red-700 text-xs mt-1'>{item.error}</p>}
                  </div>
                  <Button
                    onClick={() => handleDecryptItem(item.id)}
                    aria-label={`Unseal paragraph ${index + 1}`}
                    className='mt-1 flex items-center p-3 text-sm font-medium text-amber-50 bg-red-600 hover:bg-red-700 rounded-md transition-colors'
                  >
                    <BrokenWaxSeal className='h-5 w-5' />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MailReceive;
