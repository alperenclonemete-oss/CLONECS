# Steam / CS2 otomatik maç takibi

Bu sürüm web ekranı, şifreli bağlantı kaydı, maç keşfi, kalıcı kuyruk,
Valve Game Coordinator demo adresi çözümü ve ayrı süreçte demo analizini içerir.
Steam worker oturumu ve hizmet yapılandırması olmadan otomatik toplama çalışmaz.

## Kurulum

1. Web servisi mevcut requirements.txt ile çalışır. Python çözümleyicisini web
   servisine kurmak gerekmez. DATABASE_URL web ve worker için aynı PostgreSQL
   veritabanını göstermeli; SQLite yalnızca yerel test içindir.
2. `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
   ile kendiniz bir anahtar oluşturun. Aynı MATCH_TRACKING_KEY değerini web ve
   worker ortamına gizli değişken olarak ekleyin. Kaybetmek kayıtlı erişim kodlarını
   okunamaz yapar. Anahtarı sohbete/Git'e koymayın.
3. Ayrı, CS2 erişimi olan Steam işleyici hesabı kullanın. Yerelde
   `cd worker`, `npm install`, `node connect-steam.cjs` çalıştırın. Parola ve Steam
   Guard kodu terminalde gizli girilir, parola saklanmaz. Oturum anahtarı gitignore
   kapsamındaki `.env.worker` dosyasına yazılır. Dosyadaki
   STEAM_WORKER_REFRESH_TOKEN değerini worker'ın gizli ortam değişkenine aktarın.
   Oturum sona ererse yeniden yetkilendirin. Ana oyuncu hesabını kullanmayın.
4. Ayrı bir Docker arka plan işleyicisi için `Dockerfile.worker` kullanın.
   DATABASE_URL, MATCH_TRACKING_KEY, STEAM_API_KEY ve STEAM_WORKER_REFRESH_TOKEN
   değişkenlerini tanımlayın. Tek worker örneği çalıştırın. Büyük demolar için
   bellek gereksinimini gerçek iş yüküyle ölçün; ücretsiz web servisine bu işi
   sıkıştırmayın. Bu değişiklik kendiliğinden ücretli hizmet oluşturmaz.
5. Kullanıcı Steam hesabıyla giriş yaptıktan sonra Steam / CS2 ekranında Steam'in
   maç geçmişi erişim kodunu ve bir başlangıç maç paylaşım kodunu girer. Kodlar
   doğrulanana kadar durum "ilk kontrol bekleniyor" olarak görünür.

## İşleyiş ve sınırlar

- Maç geçmişi 5 dakikalık aralıklarla sorgulanır. Başlangıç demosu ve sonraki maçlar
  kuyruğa alınır. Daha eski bütün geçmişin alınabileceği vaat edilmez.
- İndirme yalnızca `replay*.valve.net` demo adreslerine izin verir; yönlendirme
  takip edilmez. Sıkıştırılmış/açılmış dosya sınırı 512 MiB, analiz süresi 180 sn.
- İşler en fazla beş kez denenir. Yeniden başlama sonrası süreli iş kilidi çözülür.
  Demo geçici dosyası işlem bitince silinir; özetler veritabanında kalır.
- Analiz yalnızca bağlı Steam ID'sini içeren son skor tablosunu kabul eder.
  K/D/A, HS%, hasar ve round başına hasar gösterilir. Kesik demo tam maç değildir.
- Premier Rating, rekabetçi rank, açılış düelloları ve gelişim grafikleri henüz bu
  sürümün çıktısı değildir. Steam profilinden rank tahmin edilmez.
- "Takibi durdur" erişim kodunu ve bekleyen işleri siler; işlenmiş maç özetlerini
  korur. Steam'den de erişim kodunu iptal edebilirsiniz.
- Game Coordinator üçüncü taraf kütüphaneyle kullanılır; Valve değişiklikleri ve
  erişim kısıtları bu parçayı etkileyebilir. Canlı uçtan uca test gereklidir.

## Doğrulama

Yerel SQLite ile oturum kontrolü, hesap ayrımı, şifreli saklama, tekrar kayıt,
kuyruk/cursor ilerlemesi, yeniden deneme ve indirme adresi kısıtı test edilir.
demoparser2'nin resmi `src/parser/test_demo.dem` dosyasıyla gerçek çözümleme
doğrulandı: örnek oyuncu 11 kill / 4 death / 1 assist, %72.73 HS, 116.3 ADR.
Bu örnek kullanıcı CLONE'un maçı değildir. CLONE'un ID'sinin bu demoda olmadığı
doğrulandı ve analiz reddedildi. Steam oturumu olmadan canlı GC testi yapılmadı.

Kaynaklar: https://github.com/LaihoE/demoparser,
https://github.com/DoctorMcKay/node-globaloffensive,
https://leetify.com/blog/share-codes/
