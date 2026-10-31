# Oracle Always Free: yalnızca maç işleyicisi

Site Render'da ve kayıtlar Supabase'te kalır. Yerel bilgisayarın çalışması gerekmez.
Bu yapılandırma hiçbir bulut kaynağını kendiliğinden oluşturmaz.

## Hesap ve sunucu

1. https://signup.cloud.oracle.com/ üzerinden hesap açın. Kart doğrulaması
   istenebilir. Ücretli plana yükseltmeyin; 30 günlük deneme kredisini kalıcı
   ücretsiz kapasiteyle karıştırmayın.
2. Ana bölgede Always Free kapsamındaki Ubuntu ARM sunucusu oluşturun:
   VM.Standard.A1.Flex, toplam en fazla 2 OCPU / 12 GB RAM, 50 GB boot disk.
   Mevcut hesap kaynaklarını da toplam limite dahil edin. Konsoldaki güncel
   Always Free uygunluğunu ve maliyet özetini kontrol edin.
3. Kapasite yoksa ücretli şekil seçmeyin. Başka uygun availability domain
   deneyin veya kapasite bekleyin. Düşük kullanımlı sunucular geri alınabilir;
   ücretsiz hizmetin kesintisiz çalışma garantisi yoktur.
4. SSH anahtarını güvenli saklayın. SSH erişimini kendi IP'nizle sınırlandırın.
   Bu işleyici için HTTP/HTTPS giriş portu açılması gerekmez; dışarıya Steam,
   demo sunucuları ve Supabase erişimi gerekir.

## Sunucuda kurulum

Docker Engine ve Compose eklentisini Ubuntu için resmi Docker yönergelerinden
kurun: https://docs.docker.com/engine/install/ubuntu/

```sh
git clone https://github.com/alperenclonemete-oss/CLONECS.git
cd CLONECS
umask 077
touch .env.worker
chmod 600 .env.worker
```

`.env.worker` dosyasını sunucuda düzenleyip şu dört değeri ekleyin:

```dotenv
DATABASE_URL=
STEAM_API_KEY=
MATCH_TRACKING_KEY=
STEAM_WORKER_REFRESH_TOKEN=
```

Yerel kurulumdaki aynı değerleri kullanın; MATCH_TRACKING_KEY web servisiyle
birebir aynı olmalı. NODE_BINARY için Windows yolunu sunucuya taşımayın;
compose dosyası Linux yolunu belirler. Dosyayı Git'e veya sohbete göndermeyin.

```sh
sudo docker compose -f compose.worker.yaml up -d --build
sudo docker compose -f compose.worker.yaml ps
sudo docker compose -f compose.worker.yaml logs --tail 50
sudo docker stats --no-stream
```

Başlatma sonrası sitedeki takip kontrol zamanının ilerlediğini ve bir gerçek
maçın `complete` durumuna ulaştığını doğrulayın. Bu sunucuda canlı test henüz
yapılmadı. Aynı Steam işleyici hesabıyla iki bilgisayarda işleyici çalıştırmayın.

Sunucu yeniden başlayınca Docker hizmeti etkinse kapsayıcı otomatik başlar.
Güncelleme: `git pull --ff-only`, ardından yukarıdaki `up -d --build` komutu.
Durdurma: `sudo docker compose -f compose.worker.yaml down`.

Kaynaklar (31 Ekim 2026 kontrolü):
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://www.oracle.com/cloud/free/faq/
