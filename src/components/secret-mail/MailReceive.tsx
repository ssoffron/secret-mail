import React, { useState } from 'react';
import Input from './Input';
import { Button } from '@/components/ui/button';
import BrokenWaxSeal from '@/assets/icons/BrokenWaxSeal';

// --- Start of Web Crypto API Helpers ---
const PWD_ITERATIONS = 100000;

// Converts a Base64 string to an ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
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

// Decrypts a message using the derived key
async function decryptMessage(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext,
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
// --- End of Web Crypto API Helpers ---

interface EncryptedParagraph {
  hint: string;
  salt: string; // Base64
  iv: string; // Base64
  data: string; // Base64
}

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
  const [pastedInput, setPastedInput] = useState<string>('');
  const [decryptionItems, setDecryptionItems] = useState<DecryptionState[]>([]);
  const [error, setError] = useState<string>('');

  const handleLoadForDecryption = () => {
    setError('');
    setDecryptionItems([]);
    if (!pastedInput.trim()) {
      setError('Please paste the encrypted data.');
      return;
    }
    try {
      const parsedData = JSON.parse(pastedInput);
      if (
        !Array.isArray(parsedData) ||
        !parsedData.every(
          (item) => 'hint' in item && 'data' in item && 'salt' in item && 'iv' in item,
        )
      ) {
        throw new Error(
          'Invalid data structure. Make sure it was created with the current version of the app.',
        );
      }
      const items: DecryptionState[] = parsedData.map((item: EncryptedParagraph) => ({
        ...item,
        id: crypto.randomUUID(),
        passwordInput: '',
        decryptedMessage: '',
        error: '',
        isDecrypted: false,
      }));
      setDecryptionItems(items);
    } catch (e) {
      setError('Invalid or corrupt encrypted data. Please check the format.');
      console.error(e);
    }
  };

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
      const salt = base64ToBuffer(itemToDecrypt.salt);
      const iv = base64ToBuffer(itemToDecrypt.iv);
      const ciphertext = base64ToBuffer(itemToDecrypt.data);

      const key = await getKey(itemToDecrypt.passwordInput, salt as Uint8Array);
      const decryptedText = await decryptMessage(ciphertext, key, iv as Uint8Array);

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
      <div className='space-y-4'>
        <Input
          id='pastedData'
          label='Encrypted Letter Data'
          isTextArea
          value={pastedInput}
          onChange={(e) => setPastedInput(e.target.value)}
          placeholder='Paste the JSON data here...'
        />
        <Button onClick={handleLoadForDecryption} className='w-full'>
          <BrokenWaxSeal />
          Load Letter to Unseal
        </Button>
      </div>

      {error && <p className='text-red-700 text-sm text-center'>{error}</p>}

      {decryptionItems.length > 0 && (
        <div className='mt-6 space-y-4'>
          <h3 className='text-xl font-semibold text-stone-900 text-center'>Your Letter</h3>
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
