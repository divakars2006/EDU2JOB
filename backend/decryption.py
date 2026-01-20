import os
import binascii
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from dotenv import load_dotenv

load_dotenv()

# Key setup must match encryption.py exactly to ensure compatibility
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "12345678901234567890123456789012").encode('utf-8')

if len(ENCRYPTION_KEY) > 32:
    ENCRYPTION_KEY = ENCRYPTION_KEY[:32]
elif len(ENCRYPTION_KEY) < 32:
    ENCRYPTION_KEY = ENCRYPTION_KEY + b'\0' * (32 - len(ENCRYPTION_KEY))

def decrypt_academic_data(text):
    """
    Decrypts sensitive academic data (e.g., university name, specialization).
    Decryption is performed temporarily in memory.
    """
    if not text:
        return text
    
    try:
        parts = text.split(':')
        if len(parts) < 2:
            return text
        
        iv_hex = parts[0]
        encrypted_hex = ':'.join(parts[1:])
        
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
