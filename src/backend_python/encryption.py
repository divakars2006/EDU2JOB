import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import binascii
from dotenv import load_dotenv

load_dotenv()

# Key must be 32 bytes for AES-256
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "12345678901234567890123456789012").encode('utf-8')
# Ensure key is exactly 32 bytes (truncate or pad if necessary, matching Node behavior roughly)
# In Node: Buffer.from(key) just takes bytes. If string is short/long it might behave differently depending on implementation, 
# but here user provided a 32-char string default. 
if len(ENCRYPTION_KEY) > 32:
    ENCRYPTION_KEY = ENCRYPTION_KEY[:32]
elif len(ENCRYPTION_KEY) < 32:
    # Pad with null bytes if too short (naive approach, but key should be correct)
    ENCRYPTION_KEY = ENCRYPTION_KEY + b'\0' * (32 - len(ENCRYPTION_KEY))

IV_LENGTH = 16

def encrypt(text):
    if not text:
        return text
    
    try:
        iv = os.urandom(IV_LENGTH)
        cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        # PKCS7 Padding (Node.js default)
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(text.encode('utf-8')) + padder.finalize()
        
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        
        # Format: IV:EncryptedData (Hex encoded)
        return binascii.hexlify(iv).decode('utf-8') + ':' + binascii.hexlify(encrypted).decode('utf-8')
    except Exception as e:
        print(f"Encryption error: {e}")
        return text

def decrypt(text):
    if not text:
        return text
    
    try:
        parts = text.split(':')
        if len(parts) < 2:
            return text
        
        iv_hex = parts[0]
        encrypted_hex = ':'.join(parts[1:]) # Rejoin just in case content had colons? Node logic was simpler join
        
        iv = binascii.unhexlify(iv_hex)
        encrypted_data = binascii.unhexlify(encrypted_hex)
        
        cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
        
        # Unpad
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return data.decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return text
