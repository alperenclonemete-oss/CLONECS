"""Local launcher: validate configuration without exposing secret values."""
import os
import runpy
import shutil
import sys
from pathlib import Path
from dotenv import load_dotenv

root = Path(__file__).resolve().parent
load_dotenv(root / '.env.worker')
required = ['DATABASE_URL', 'STEAM_API_KEY', 'MATCH_TRACKING_KEY', 'STEAM_WORKER_REFRESH_TOKEN']
missing = [name for name in required if not os.getenv(name, '').strip()]
if missing:
    print('Eksik ayarlar: ' + ', '.join(missing))
    print('.env.worker dosyasindaki bos alanlari doldurup kaydedin. Degerleri sohbete gondermeyin.')
    sys.exit(1)
from cryptography.fernet import Fernet
try:
    Fernet(os.environ['MATCH_TRACKING_KEY'].encode())
except Exception:
    sys.exit('MATCH_TRACKING_KEY gecersiz. Web ve isleyici ayni anahtari kullanmali.')
if not shutil.which(os.getenv('NODE_BINARY', 'node')):
    sys.exit('Node calistiricisi bulunamadi.')
print('Yerel mac isleyicisi baslatiliyor. Durdurmak icin Ctrl+C kullanin.')
try:
    runpy.run_path(str(root / 'match_worker.py'), run_name='__main__')
except KeyboardInterrupt:
    print('Isleyici durduruldu.')
except Exception:
    sys.exit('Baslatma basarisiz. Veritabani baglantisini ve isleyici kurulumunu kontrol edin.')
