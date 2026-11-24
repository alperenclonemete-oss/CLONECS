(() => {
  'use strict';
  // Exact UI phrases only: never translate player names, input values or commands.
  const phrases = `Antrenmanım|My practice|Моя тренировка
Taktikler|Tactics|Тактики
FACEIT profil URL veya kullanici adini gir. Analiz bu sayfada acilir.|Enter a FACEIT profile URL or username. Analysis opens on this page.|Введите ссылку на профиль FACEIT или имя пользователя. Анализ откроется здесь.
Hesabın hazır. FACEIT profilini profil menüsünden bağlayabilirsin.|Your account is ready. Connect FACEIT from your profile menu.|Аккаунт готов. Подключите FACEIT через меню профиля.
FACEIT profilin henüz bağlı değil|Your FACEIT profile is not connected yet|Профиль FACEIT пока не подключён
Steam hesabını bağlayarak CS2 verilerini eşleştir.|Connect Steam to link your CS2 data.|Подключите Steam для синхронизации данных CS2.
Herkese açık kullanıcı adını ekleyerek analiz alanını aç.|Enter your public username to open the analysis workspace.|Введите публичное имя пользователя для доступа к аналитике.
Steam profilinde görünür olan CS2 oyun süreni ve yayımlanmış istatistikleri göster.|View your publicly visible CS2 playtime and published Steam statistics.|Просмотр открытого времени игры в CS2 и опубликованной статистики Steam.
Topluluk arşivi · Kaynak kayıtları 2024 tarihli; güncel oyunda test edilmedi. Radar hedefleri yaklaşık bölgeyi gösterir. Kesin duruş ve nişan için fotoğrafları kullan.|Community archive · Source records are from 2024 and have not been tested in the current game. Radar targets are approximate. Use photos for exact positioning and aim.|Архив сообщества · Записи источника датированы 2024 годом и не проверены в текущей версии игры. Цели на радаре приблизительны. Для точной позиции и прицеливания используйте фотографии.
Haritadaki simgeye ya da aşağıdaki atış adına tıkla. Aynı bölgedeki atışları sayı rozetiyle görebilirsin.|Click a map icon or a throw below. Number badges group throws in the same area.|Нажмите значок на карте или название броска ниже. Числа обозначают броски в одной области.
Bu filtreye uygun kayıt yok. Başka harita veya bomba türü seç.|No entries match this filter. Choose another map or grenade type.|Нет подходящих записей. Выберите другую карту или тип гранаты.
CLONE LAB kişisel analiz aracıdır; FACEIT ile bağlantılı resmî bir ürün değildir. Öneriler istatistik temelli başlangıç noktalarıdır. Maç demosu incelenmeden kesin nişan, pozisyon veya karar hatası iddia edilmez. API anahtarı yalnızca sunucu tarafında tutulmalıdır.|CLONE LAB is a personal analysis tool, not an official FACEIT product. Suggestions are statistical starting points. Aim, positioning and decision errors cannot be confirmed without reviewing a demo. API keys must remain server-side.|CLONE LAB — персональный инструмент аналитики, не официальный продукт FACEIT. Рекомендации основаны на статистике. Ошибки прицеливания, позиции и решений нельзя подтвердить без просмотра демо. Ключи API должны храниться только на сервере.
Giriş Yap|Sign in|Войти
Kayıt Ol|Register|Регистрация
Giriş Yap ↗|Sign in ↗|Войти ↗
Steam ile Giriş Yap|Sign in with Steam|Войти через Steam
Hesap oluştur ↗|Create account ↗|Создать аккаунт ↗
Kullanıcı adı|Username|Имя пользователя
Kullanıcı adın|Your username|Ваше имя пользователя
Parola|Password|Пароль
Parolan|Your password|Ваш пароль
En az 8 karakter|At least 8 characters|Не менее 8 символов
3–32 karakter|3–32 characters|3–32 символа
veya kullanıcı adıyla devam et|or continue with your username|или войдите по имени пользователя
Oyuna devam et.|Get back in the game.|Вернись в игру.
FACEIT profilini bağla, kendi analiz alanını aç.|Connect your FACEIT profile to open your analysis workspace.|Подключите профиль FACEIT для анализа своей игры.
Güvenli oturum · parola sunucu tarafında korunur|Secure session · password protected on the server|Защищённый сеанс · пароль защищён на сервере
Her maçtan|Get more|Получай больше
daha fazlasını çıkar.|out of every match.|от каждого матча.
Ücretsiz başla ↗|Get started free ↗|Начать бесплатно ↗
Platformu keşfet ↓|Explore the platform ↓|Узнать о платформе ↓
Gerçek FACEIT verisi|Real FACEIT data|Реальные данные FACEIT
Kaynaklı pro ayarları|Sourced pro settings|Настройки профессионалов с источниками
Kişisel analiz alanı|Personal analysis workspace|Личный центр аналитики
Oyuncu profili|Player profile|Профиль игрока
PERFORMANS TRENDİ|PERFORMANCE TREND|ДИНАМИКА РЕЗУЛЬТАТОВ
ELO / SON MAÇLAR|ELO / RECENT MATCHES|ELO / ПОСЛЕДНИЕ МАТЧИ
örnek görünüm|sample preview|пример интерфейса
Gerçek değerler girişte FACEIT’ten yüklenir|Real stats load from FACEIT after sign-in|Данные FACEIT загружаются после входа
Oyununu anlamak için|Everything you need|Всё необходимое,
ihtiyacın olan her şey.|to understand your game.|чтобы понять свою игру.
Maç formunu incele, profesyonel ayarları karşılaştır ve sıradaki antrenmanını seç.|Review your form, compare pro settings and choose your next practice.|Оцени форму, сравни настройки профессионалов и выбери тренировку.
FACEIT maçlarını, profesyonel ayarları ve antrenman rutinlerini tek bir çalışma alanında birleştir. Verini gör, sonraki hamleni planla.|Your FACEIT matches, pro settings and training routines in one workspace. Review your data and plan your next move.|Матчи FACEIT, настройки профессионалов и тренировки в одном месте. Изучи данные и спланируй следующий шаг.
ELO, maç sonuçları, K/D, ADR ve harita performansını tek dashboard’da takip et.|Track ELO, match results, K/D, ADR and map performance in one dashboard.|Отслеживай ELO, результаты, K/D, ADR и статистику карт на одной панели.
Örnek arayüz · gerçek değerler girişte yüklenir|Sample interface · real stats load after sign-in|Пример интерфейса · данные загружаются после входа
Takımlara göre dolaş; yayımlanmış crosshair, hassasiyet ve CFG kayıtlarını kaynaklarıyla gör.|Browse teams and explore published crosshairs, sensitivities and configs with sources.|Выбирай команды и изучай прицелы, чувствительность и конфиги с источниками.
KAYNAKLI KAYITLAR|SOURCED RECORDS|ЗАПИСИ С ИСТОЧНИКАМИ
AYARLAR OYUNCU KAYNAĞIYLA GÖSTERİLİR|SETTINGS INCLUDE PLAYER SOURCES|НАСТРОЙКИ С ИСТОЧНИКАМИ ИГРОКОВ
FACEIT Analiz|FACEIT Analysis|Анализ FACEIT
Sunucular|Servers|Серверы
Ayarlar|Settings|Настройки
Oyuncu merkezi|Player center|Центр игрока
Oyuncu|Player|Игрок
Merkezi|Center|Центр
Kaydedilenler|Saved items|Сохранённое
Kaydedilenlerin|Your saved items|Ваше сохранённое
Kaydettiklerim|My saved items|Моё сохранённое
Çıkış yap|Sign out|Выйти
Steam hesabı bağlı değil|Steam account not connected|Аккаунт Steam не подключён
FACEIT profili bağlanmadı|FACEIT profile not connected|Профиль FACEIT не подключён
Hesap bağlantıları|Connected accounts|Подключённые аккаунты
Bağlantıları düzenle|Manage connections|Управлять подключениями
Bağlantılarını yönet, kaydettiklerine dön ve kişisel çalışma alanını düzenle.|Manage your connections, saved items and personal workspace.|Управляй подключениями, сохранённым и личным пространством.
Steam’i bağla|Connect Steam|Подключить Steam
Bağlı|Connected|Подключено
FACEIT kullanıcı adı|FACEIT username|Имя пользователя FACEIT
Bağlantıyı kaydet|Save connection|Сохранить подключение
Yenile|Refresh|Обновить
Aç|Open|Открыть
Pro configler|Pro configs|Конфиги профессионалов
Favori oyuncu ayarların|Your favorite player settings|Избранные настройки игроков
Kayıtlı oyun sunucuların|Your saved game servers|Сохранённые игровые серверы
Kaydettiğin smoke, flash ve molotoflar|Your saved smokes, flashes and molotovs|Сохранённые дымы, флешки и молотовы
Sunucu|Server|Сервер
bul.|finder.|поиск.
Isın, antrenman yap, oyuna katıl. Sunucunu seç ve Steam üzerinden bağlan.|Warm up, practice and play. Pick a server and connect through Steam.|Разминайся, тренируйся и играй. Выбери сервер и подключись через Steam.
Listeyi yenile|Refresh list|Обновить список
Sunucu ara|Search servers|Поиск серверов
İstanbul, Mirage, IP…|City, Mirage, IP…|Город, Mirage, IP…
Sağlayıcı|Provider|Провайдер
Mod|Mode|Режим
Konum|Location|Расположение
Tümü|All|Все
Tüm modlar|All modes|Все режимы
Tüm şehirler|All cities|Все города
Boş yer var|Available slots|Есть места
Kaydet|Save|Сохранить
Kaydedildi|Saved|Сохранено
Bağlan|Connect|Подключиться
Komutu kopyala|Copy command|Копировать команду
Önceki|Previous|Назад
Sonraki|Next|Далее
Güncelliği doğrulanamadı|Freshness not verified|Актуальность не подтверждена
Sunucu listeleri yükleniyor…|Loading server lists…|Загрузка серверов…
Bağlantı komutu kopyalandı.|Connection command copied.|Команда подключения скопирована.
Resmî listeyi aç · IP aktarımı henüz bağlı değil|Open official list · IP import not connected yet|Открыть официальный список · импорт IP пока не подключён
Tarafını seç. Başlangıcı ve hedefi haritada bul, atış talimatını incele.|Choose your side. Find the start and target on the radar and read the throw instructions.|Выбери сторону. Найди начало и цель на радаре и изучи инструкцию броска.
Atış ara: window, CT, market…|Search throws: window, CT, market…|Поиск бросков: window, CT, market…
Atış ara|Search throws|Поиск бросков
Fotoğraflı|With photos|С фотографиями
İki taraf|Both sides|Обе стороны
T · Hücum|T · Attack|T · Атака
CT · Savunma|CT · Defense|CT · Защита
Üst kat|Upper floor|Верхний этаж
Alt kat|Lower floor|Нижний этаж
1 · Nerede dur|1 · Where to stand|1 · Где стоять
2 · Nereye nişan al|2 · Where to aim|2 · Куда целиться
3 · NASIL ATILIR|3 · HOW TO THROW|3 · КАК БРОСАТЬ
Sonuç · Hedef bölgesi|Result · Target area|Результат · Область цели
Antrenmanda konuma git|Go to position in practice|Перейти на позицию в тренировке
Simge: başlangıç · Halka: hedef bölgesi · Çizgi: bağlantı, uçuş yörüngesi değil|Icon: start · Ring: target area · Line: connection, not flight path|Значок: начало · Кольцо: область цели · Линия: связь, а не траектория
Bir atış seç|Select a throw|Выбери бросок
Atış bulunamadı|No throws found|Броски не найдены
HARİTADAN KEŞFET|EXPLORE THE MAP|ИЗУЧАЙ КАРТУ
Kapat|Close|Закрыть
Kapat ×|Close ×|Закрыть ×
Uzaklaştır|Zoom out|Уменьшить
Yakınlaştır|Zoom in|Увеличить
Yakınlaştırmayı sıfırla|Reset zoom|Сбросить масштаб
Veriyi yenile|Refresh data|Обновить данные
Veriyi yenile ↻|Refresh data ↻|Обновить данные ↻
Steam hesabın bağlı değil.|Your Steam account is not connected.|Ваш аккаунт Steam не подключён.
Steam hesabını bağla ↗|Connect Steam ↗|Подключить Steam ↗
Steam verisi henüz yüklenmedi.|Steam data has not loaded yet.|Данные Steam ещё не загружены.
← Takımlara dön|← Back to teams|← К командам
← Oyunculara dön|← Back to players|← К игрокам
Favori CFG’lerim|My favorite configs|Избранные конфиги
Henüz favori oyuncu kaydetmedin.|No favorite players saved yet.|Избранных игроков пока нет.
FACEIT hesabini bagla|Connect your FACEIT account|Подключить аккаунт FACEIT
Hesabi Bagla & Analiz Et|Connect & analyze|Подключить и анализировать
Durumu yenile|Refresh status|Обновить статус
Takibi durdur|Stop tracking|Остановить отслеживание
Otomatik takibi bağla|Enable automatic tracking|Включить отслеживание
Maç geçmişi takibi açık|Match history tracking enabled|Отслеживание матчей включено
Maçlarını otomatik analiz et|Analyze your matches automatically|Автоматический анализ матчей
Maç geçmişi erişim kodu|Match history access code|Код доступа к истории матчей
Başlangıç maç paylaşım kodu|Starting match share code|Код исходного матча
Clone Lab ana sayfa|Clone Lab home|Главная страница Clone Lab
Ana sayfa menüsü|Main page navigation|Навигация главной страницы
Ana sayfa alt menüsü|Footer navigation|Навигация внизу страницы
Özellikler|Features|Возможности
Nasıl çalışır?|How it works|Как это работает
Erişim|Access|Доступ
SSS|FAQ|Частые вопросы
Counter-Strike 2 çalışma alanı|Counter-Strike 2 workspace|Рабочее пространство для Counter-Strike 2
Maçını incele.|Review your match.|Разбери свой матч.
Sonrakine hazırlan.|Prepare for the next.|Подготовься к следующему.
FACEIT ve Steam verilerini gör, haritana uygun lineupları bul, bir sonraki maç için antrenman planını seç.|Review your FACEIT and Steam stats, find lineups for your map, and choose a practice plan for your next match.|Изучи статистику FACEIT и Steam, найди раскидки для своей карты и выбери план подготовки к следующему матчу.
Ücretsiz hesap oluştur|Create a free account|Создать бесплатный аккаунт
Araçları keşfet|Explore the tools|Посмотреть инструменты
Öne çıkan özellikler|Highlights|Главные возможности
10 haritada lineuplar|Lineups on 10 maps|Раскидки на 10 картах
3 antrenman programı|3 practice plans|3 плана тренировок
Clone Lab arayüz önizlemesi|Clone Lab interface preview|Предпросмотр интерфейса Clone Lab
Arayüz örneği|Interface preview|Пример интерфейса
Arayüz örnekleri|Interface previews|Примеры интерфейса
Maç analizi|Match analysis|Анализ матча
Lineup radarı|Lineup radar|Радар раскидок
Antrenman|Practice|Тренировка
Son maç performansı|Recent match performance|Результаты последних матчей
Temsili veriler|Sample data|Пример данных
Güncel ELO|Current Elo|Текущий Elo
Hareketli galibiyet oranı|Rolling win rate|Скользящая доля побед
Örnek maç dizisi|Sample matches|Пример матчей
Mirage radarı|Mirage radar|Радар Mirage
Mirage haritasının oyun içi radarı|In-game radar for Mirage|Игровой радар карты Mirage
Smoke animasyonu|Smoke animation|Анимация дымовой гранаты
10 harita · T / CT|10 maps · T / CT|10 карт · T / CT
ANTRENMAN|PRACTICE|ТРЕНИРОВКА
Maç önü programı|Pre-match routine|Подготовка к матчу
15 dakika|15 minutes|15 минут
İlk mermi|First shot|Первый выстрел
İki lineup|Two lineups|Две раскидки
Maç hedefi|Match goal|Цель на матч
5 dk|5 min|5 мин
Antrenman bölümünü incele|Explore practice|Посмотреть тренировки
Oyuncu alanında neler var?|What’s in the workspace?|Что есть в рабочем пространстве?
Maç verisinden antrenman planına, her aracın ne sunduğunu incele.|See what each tool offers, from match stats to practice plans.|Узнай, что умеет каждый инструмент, от статистики матчей до планов тренировок.
Özelliklere git|Jump to features|Перейти к возможностям
Takım taktikleri|Team tactics|Командные тактики
E-spor|Esports|Киберспорт
Profilim|My profile|Мой профиль
Maçlarını ve performansını karşılaştır.|Compare your matches and performance.|Сравни свои матчи и результаты.
Güncel ELO, K/D, ADR ve kafa vuruşu oranını tek bakışta gör. Son maçlardan hangi haritalarda daha iyi sonuç aldığını incele.|See current Elo, K/D, ADR, and headshot percentage at a glance. Use recent matches to find your strongest maps.|Смотри текущий Elo, K/D, ADR и долю попаданий в голову. По последним матчам узнай, на каких картах ты играешь лучше.
Son maçlar, skorlar ve maç detayları|Recent matches, scores, and match details|Последние матчи, счёт и подробности
Harita bazında sonuçlar ve galibiyet grafiği|Results by map and win rate chart|Результаты по картам и график побед
Mevcut istatistiklere göre çalışma önerileri|Practice suggestions based on available stats|Рекомендации по тренировкам на основе доступной статистики
Herkese açık FACEIT kullanıcı adı veya profil bağlantısı gerekir.|Requires a public FACEIT username or profile link.|Нужно публичное имя пользователя FACEIT или ссылка на профиль.
Demolarından öğren.|Learn from your demos.|Учись на своих демо.
Görünür CS2 oyun süreni ve Steam istatistiklerini incele. İstersen erişilebilen yeni maçlar için otomatik demo takibini aç.|Review the CS2 playtime and stats available from Steam. You can enable automatic demo tracking for eligible new matches.|Изучи доступное в Steam игровое время и статистику CS2. При желании включи автоматический анализ демо для доступных новых матчей.
Maç bazında K/D/A, ADR ve kafa vuruşu oranı|K/D/A, ADR, and headshot percentage by match|K/D/A, ADR и доля попаданий в голову по матчам
Desteklenen demolarda takaslar ve flash etkisi|Trades and flash impact in supported demos|Размены и эффективность флешек в поддерживаемых демо
Otomatik takip için Steam maç erişim kodu ve bir başlangıç maçının paylaşım kodu gerekir.|Automatic tracking requires a Steam match access code and a share code for one starting match.|Для автоматического отслеживания нужны код доступа к матчам Steam и код одного исходного матча.
Başlangıcı ve hedefi radar üzerinde bul.|Find the starting point and target on the radar.|Найди точку броска и цель на радаре.
10 haritada smoke, flash, molotof ve HE atışlarını harita, taraf ve bomba türüne göre filtrele.|Filter smoke, flash, molotov, and HE lineups by map, side, and grenade type across 10 maps.|Фильтруй раскидки дымов, флешек, молотовых и осколочных гранат на 10 картах по карте, стороне и типу гранаты.
T/CT, başlangıç noktası ve hedef|T/CT, starting point, and target|T/CT, точка броска и цель
Mevcut fotoğraflar, videolar ve atış notları|Available photos, videos, and throw notes|Доступные фото, видео и подсказки к броскам
Favorileri kaydedip antrenmanda tekrar açma|Save favorites and reopen them during practice|Сохраняй избранное и открывай снова на тренировке
Atışları güncel harita sürümünde dene.|Try the throws on the current map version.|Проверь броски на актуальной версии карты.
Bir program seç, ilerlemeni kaydet.|Choose a routine and save your progress.|Выбери программу и сохрани прогресс.
15 dakikalık maç önü, 20 dakikalık utility ve 30 dakikalık takım provası programlarından birini aç.|Choose a 15-minute warm-up, 20-minute utility practice, or 30-minute team rehearsal.|Выбери разминку на 15 минут, тренировку гранат на 20 минут или командную репетицию на 30 минут.
Haritana uygun atış önerileri|Suggested throws for your map|Подбор бросков для твоей карты
Süre tutma ve görev işaretleme|Timer and task checklist|Таймер и отметки о выполнении
Bir sonraki maç için kişisel çalışma notu|Personal practice note for your next match|Личная заметка для подготовки к следующему матчу
İlerleme ve notlar bu tarayıcıda kalır.|Progress and notes stay in this browser.|Прогресс и заметки сохраняются в этом браузере.
Rolleri dağıt, roundu birlikte prova et.|Assign roles and rehearse the round together.|Распредели роли и отрепетируй раунд с командой.
NAVI, Vitality ve The MongolZ maçlarından kaynaklı örnekleri incele. Prova adımlarını kendi takımına uyarla.|Explore sourced examples from NAVI, Vitality, and The MongolZ matches. Adapt the practice steps for your own team.|Разбери примеры из матчей NAVI, Vitality и The MongolZ. Адаптируй шаги репетиции для своей команды.
Harita ve taraf filtreleri|Map and side filters|Фильтры по карте и стороне
Her plan için beş oyuncu rolü|Five player roles per plan|Пять ролей игроков для каждого плана
2D tahtada rota çizme ve hareketleri oynatma|Draw routes and play them back on a 2D board|Рисуй маршруты и воспроизводи движения на 2D-доске
Prova görevleri Clone Lab uyarlamasıdır.|Practice tasks are adapted by Clone Lab.|Задания для репетиции адаптированы Clone Lab.
Bir ayarın kaynağına kadar in.|Trace a setting to its source.|Проверь источник настройки.
Takım veya oyuncu ara. Kaynağı bulunan crosshair, DPI, hassasiyet, çözünürlük ve viewmodel ayarlarını incele.|Search by team or player. Review sourced crosshair, DPI, sensitivity, resolution, and viewmodel settings.|Найди команду или игрока. Изучи настройки прицела, DPI, чувствительности, разрешения и модели оружия с указанием источников.
Crosshair kodunu kopyalama|Copy crosshair codes|Копируй коды прицелов
Mevcut CFG dosyalarını indirme|Download available CFG files|Скачивай доступные CFG-файлы
Favori oyuncu ayarlarını hesabında saklama|Save your favorite player settings to your account|Сохраняй избранные настройки игроков в аккаунте
Kaynakta eksik olan ayarlar gösterilmez.|Only settings provided by the source are shown.|Отображаются только настройки, указанные в источнике.
Çalışacağın modu seç ve Steam’den katıl.|Pick a mode and join through Steam.|Выбери режим и подключись через Steam.
WarmupServer, CYBERSHOKE, XPLAY ve PRACC dizinlerinde aktif kaynakları tarayarak DM, aim ve retake seçeneklerine bak.|Explore DM, aim, and retake options from the WarmupServer, CYBERSHOKE, XPLAY, and PRACC directories.|Найди DM, aim и retake в каталогах WarmupServer, CYBERSHOKE, XPLAY и PRACC.
Mod ve sunucu adına göre arama|Search by mode and server name|Поиск по режиму и имени сервера
Favori sunucular ve Steam bağlantısı|Favorite servers and Steam links|Избранные серверы и ссылки Steam
Liste güncelliği ve katılım koşulları sağlayıcıya bağlıdır.|List freshness and access depend on the provider.|Актуальность списка и условия подключения зависят от сервиса.
Profesyonel sahneyi takip et.|Follow the professional scene.|Следи за профессиональной сценой.
Turnuvaları, takımları ve kadroları incele. Yaklaşan, devam eden ve tamamlanan maçları ayır.|Explore tournaments, teams, and rosters. Browse upcoming, ongoing, and completed matches separately.|Изучи турниры, команды и составы. Смотри предстоящие, текущие и завершённые матчи по отдельности.
Maç takvimi ve eşleşmeler|Match schedule and fixtures|Расписание и пары матчей
Kaynakta bulunan sonuçlar ve takım bilgisi|Available results and team information|Доступные результаты и сведения о командах
İçerikler PandaScore veri bağlantısına bağlıdır.|Content depends on the PandaScore feed.|Содержимое зависит от данных PandaScore.
Hesaplarını ve kaydettiklerini yönet.|Manage connected accounts and saved items.|Управляй подключёнными аккаунтами и сохранённым.
Steam ve FACEIT bağlantılarını tek yerden düzenle. Favori CFG’lerine, lineuplarına ve sunucularına dön.|Manage your Steam and FACEIT connections in one place. Return to your favorite configs, lineups, and servers.|Управляй подключениями Steam и FACEIT в одном месте. Возвращайся к избранным конфигам, раскидкам и серверам.
Kullanıcı adı veya Steam ile giriş|Sign in with a username or Steam|Вход по имени пользователя или через Steam
Desteklenen tarayıcılarda ana ekrana ekleme|Add to your home screen in supported browsers|Добавляй на главный экран в поддерживаемых браузерах
Lineup ve sunucu favorileri tarayıcıda saklanır.|Favorite lineups and servers are saved in the browser.|Избранные раскидки и серверы сохраняются в браузере.
Etkileşimli tanıtım|Interactive preview|Интерактивный обзор
Bir smoke’u takip et|Follow a smoke throw|Проследи за броском дыма
Kaydırdıkça fırlatışı izle. Duman açıldığında lineup çalışma alanının adımlarını göreceksin.|Scroll to watch the throw. When the smoke blooms, the lineup guide appears.|Прокрути страницу, чтобы увидеть бросок. Когда раскроется дым, появится руководство по раскидкам.
Tüm ekranı kaplayan smoke lineup animasyonu|Full-screen smoke lineup animation|Полноэкранная анимация раскидки дыма
Interactive Lineup & Smoke Guide|Interactive Lineup & Smoke Guide|Интерактивное руководство по раскидкам дыма
Nade lineup çalışma alanı|Grenade lineup workspace|Рабочая область для раскидок гранат
01 — THROW SEQUENCE|01 — THROW SEQUENCE|01 — БРОСОК
01 — HAND / THROW|01 — HAND / THROW|01 — ЗАМАХ И БРОСОК
02 — FLIGHT / TRAJECTORY|02 — FLIGHT / TRAJECTORY|02 — ТРАЕКТОРИЯ ПОЛЁТА
03 — SMOKE / LINEUP GUIDE|03 — SMOKE / LINEUP GUIDE|03 — ДЫМ И РУКОВОДСТВО
SCROLL TO THROW|SCROLL TO THROW|ПРОКРУТИ ДЛЯ БРОСКА
Her smoke,|Every smoke|Каждый дым
bir plan başlatır.|starts a plan.|начинается с плана.
Kaydırmaya devam et. Rehber ekranı smoke’un inişinden sonra açılacak.|Keep scrolling. The guide appears when the smoke lands.|Прокручивай дальше. Руководство появится после приземления гранаты.
Haritayı seç.|Choose a map.|Выбери карту.
Atışını bul.|Find your throw.|Найди свой бросок.
BAŞLANGIÇ|START|НАЧАЛО
HEDEF|TARGET|ЦЕЛЬ
Haritanı ve T / CT tarafını seç.|Select your map and T or CT side.|Выбери карту и сторону T или CT.
Radar üzerindeki noktadan atışları keşfet; başlangıç ve hedef konumunu gör.|Select a radar marker to see the starting point and target.|Выбери метку на радаре, чтобы увидеть точку броска и цель.
Mevcut fotoğraf, video ve atış notlarıyla çalış.|Use available photos, videos, and throw notes to practice.|Тренируйся по доступным фото, видео и подсказкам к броскам.
Favorine ekle, sonraki antrenmanda tekrar et.|Save it to favorites and repeat it in your next session.|Сохрани в избранное и повтори на следующей тренировке.
Topluluk kaynaklı atışları güncel oyun sürümünde antrenman sunucusunda kontrol et. Bu animasyon tanıtım amaçlıdır.|Check community lineups on a practice server in the current game version. The animation illustrates the feature.|Проверь раскидки сообщества на тренировочном сервере в текущей версии игры. Анимация служит для демонстрации.
Lineup seçimi için Mirage radarı|Mirage radar for choosing a lineup|Радар Mirage для выбора раскидки
10 HARİTA · TEK ÇALIŞMA ALANI|10 MAPS · ONE WORKSPACE|10 КАРТ · ОДНО РАБОЧЕЕ ПРОСТРАНСТВО
KEŞFET → KAYDET → ÇALIŞ|EXPLORE → SAVE → PRACTICE|НАЙДИ → СОХРАНИ → ПОТРЕНИРУЙСЯ
Kendi alanını oluştur ↗|Create your workspace ↗|Создать рабочее пространство ↗
İlk oturumunda yapabileceklerin|What you can do in your first session|Что можно сделать в первый сеанс
Hesap oluştur|Create an account|Создай аккаунт
Steam ile giriş yap veya Clone Lab kullanıcı adı ve parola belirle.|Sign in with Steam or choose a Clone Lab username and password.|Войди через Steam или выбери имя пользователя и пароль для Clone Lab.
Oynadığın platformu bağla|Connect the platform you play on|Подключи свою игровую платформу
Profilim’den FACEIT veya Steam hesabını ekle. Lineup, taktik ve antrenman için ikisini bağlaman gerekmez.|Add a FACEIT or Steam account in My profile. Lineups, tactics, and practice are available without a linked game profile.|Добавь FACEIT или Steam в разделе «Мой профиль». Раскидки, тактики и тренировки доступны без подключения игровой платформы.
Bir hedef seç ve çalış|Pick a goal and practice|Выбери цель и тренируйся
Son maçlarına bak. Çalışacağın haritayı seç ve maç önü programıyla başla.|Review your recent matches. Pick a map and start a pre-match routine.|Просмотри недавние матчи. Выбери карту и начни подготовку к матчу.
Hesap açmadan dene|Try without an account|Попробуй без аккаунта
Isınma rutinine bak veya sunucuya katıl|Preview a warm-up or join a server|Посмотри разминку или зайди на сервер
15 dakikalık ısınma|15-minute warm-up|Разминка на 15 минут
Maç öncesinde deneyebileceğin üç kısa rutinden birini görüntüle.|View one of three short routines you can try before a match.|Посмотри одну из трёх коротких программ, которые можно опробовать перед матчем.
Bot aim · isabet ve kısa flick|Bot aim · accuracy and short flicks|Стрельба по ботам · точность и короткие флики
DM · crosshair seviyesi ve ilk mermi|DM · crosshair placement and first shot|DM · положение прицела и первый выстрел
Recoil kontrolü · 2 favori silah|Recoil control · 2 favorite weapons|Контроль отдачи · 2 любимых оружия
Kısa strafing aim çalışması|Short strafing aim drill|Короткое упражнение на стрельбу со стрейфами
DM · açı temizleme ve trade mesafesi|DM · clearing angles and trade distance|DM · проверка углов и дистанция для размена
Spray aktarımı · AK/M4|Spray transfer · AK/M4|Перенос спрея · AK/M4
El bileği ve mouse kontrolü|Wrist and mouse control|Контроль кисти и мыши
DM · sakin pre-aim ve burst|DM · steady pre-aim and bursts|DM · спокойное преднаведение и короткие очереди
Retake sunucusu · utility sonrası giriş|Retake server · entry after utility|Сервер Retake · выход после гранат
Başka rutin göster|Show another routine|Показать другую программу
Sunucu adresiyle katıl|Join by server address|Подключись по адресу сервера
Adresini bildiğin bir topluluk sunucusunu Steam üzerinden aç.|Open a community server through Steam using its address.|Открой сервер сообщества через Steam по известному адресу.
Sunucu adresi|Server address|Адрес сервера
sunucu:27015|server:27015|server:27015
Steam’de aç|Open in Steam|Открыть в Steam
Bu cihazda kaydet|Save on this device|Сохранить на этом устройстве
Bağlanmak için Steam’in kurulu olması gerekir.|Steam must be installed to connect.|Для подключения должен быть установлен Steam.
Geçerli bir sunucu adresi ve port gir (ör. sunucu:27015).|Enter a valid server address and port (e.g. server:27015).|Введи действительный адрес сервера и порт, например server:27015.
Kaydetmek için geçerli bir sunucu adresi ve port gir.|Enter a valid server address and port to save it.|Чтобы сохранить сервер, введи действительный адрес и порт.
Sunucu Oyuncu Merkezi’ne kaydedildi.|Server saved to the player center.|Сервер сохранён в центре игрока.
Sunucu adresi bu tarayıcıya kaydedildi.|Server address saved in this browser.|Адрес сервера сохранён в браузере.
Tarayıcı sunucu adresini kaydetmeye izin vermedi.|The browser could not save the server address.|Браузер не смог сохранить адрес сервера.
Aim sunucusu için Steam bağlantısı açılıyor…|Opening the Aim server in Steam…|Открываем Aim-сервер в Steam…
Deathmatch sunucusu için Steam bağlantısı açılıyor…|Opening the Deathmatch server in Steam…|Открываем Deathmatch-сервер в Steam…
Retake sunucusu için Steam bağlantısı açılıyor…|Opening the Retake server in Steam…|Открываем Retake-сервер в Steam…
Xplay sunucusu için Steam bağlantısı açılıyor…|Opening the Xplay server in Steam…|Открываем Xplay-сервер в Steam…
Fiyat ve erişim|Pricing and access|Цена и доступ
Ücretsiz başla|Get started free|Начни бесплатно
Kayıt için kredi kartı gerekmez. Clone Lab’de şu anda ücretli paket yok.|No credit card is required to sign up. Clone Lab currently has no paid plans.|Для регистрации не нужна банковская карта. Платных тарифов в Clone Lab пока нет.
Clone Lab hesabı|Clone Lab account|Аккаунт Clone Lab
Mevcut erişim|Current access|Текущий доступ
FACEIT ve Steam analiz alanları|FACEIT and Steam analytics|Аналитика FACEIT и Steam
Nade Lineups, takım taktikleri ve antrenman|Nade lineups, team tactics, and practice|Раскидки, командные тактики и тренировки
Pro Config, sunucu dizini ve e-spor|Pro Config, server directory, and esports|Pro Config, каталог серверов и киберспорт
Profil ve kaydedilenler|Profile and saved items|Профиль и сохранённое
Hangi araç için ne gerekiyor?|What does each tool require?|Что нужно для каждого инструмента?
Herkese açık FACEIT profili. Görünen alanlar FACEIT’in sunduğu veriye bağlıdır.|A public FACEIT profile. The fields shown depend on the data FACEIT returns.|Публичный профиль FACEIT. Отображаемые поля зависят от данных FACEIT.
Steam ve maç takibi|Steam and match tracking|Steam и отслеживание матчей
Steam hesabı, görünür oyun verileri ve otomatik takip için Steam’in maç erişim ile paylaşım kodları.|A Steam account, visible game data, and Steam match access and share codes for automatic tracking.|Аккаунт Steam, доступные игровые данные и коды доступа к матчам и обмена матчем для автоматического отслеживания.
Çalışma araçları|Practice tools|Инструменты тренировки
Lineup, taktik, Pro Config ve antrenmana Clone Lab hesabıyla erişirsin. Oyun profili bağlamak gerekmez.|Use your Clone Lab account to access lineups, tactics, Pro Config, and practice. You can start without linking a game profile.|Раскидки, тактики, Pro Config и тренировки доступны с аккаунтом Clone Lab. Игровой профиль подключать необязательно.
Sık sorulan sorular|Frequently asked questions|Часто задаваемые вопросы
FACEIT ve Steam hesaplarımı birlikte bağlamalı mıyım?|Do I have to connect both FACEIT and Steam?|Нужно ли подключать и FACEIT, и Steam?
Hayır. Yalnızca istatistiklerini görmek istediğin platformu Profilim’den bağla. İki platformun verileri kendi sekmelerinde gösterilir.|Connect the platform whose stats you want to see in My profile. Each platform has its own stats tab.|Подключи нужную платформу в разделе «Мой профиль». У каждой платформы своя вкладка статистики.
Geçmişteki tüm CS2 maçlarım gelir mi?|Will I see my entire CS2 match history?|Увижу ли я всю историю своих матчей в CS2?
Steam Web API tüm maç arşivini sağlamaz. Otomatik takip, verdiğin başlangıç maçından itibaren erişilebilen demoları işler. Demo erişimi ve işlem durumu kapsamı etkiler.|The Steam Web API does not provide a full match archive. Automatic tracking processes available demos starting from the match you submit. Demo availability and processing status determine what appears.|Steam Web API не предоставляет полный архив матчей. Автоматическое отслеживание обрабатывает доступные демо начиная с указанного матча. Результат зависит от наличия демо и статуса обработки.
FACEIT ELO geçmişimi görebilir miyim?|Can I see my FACEIT Elo history?|Можно ли посмотреть историю моего Elo в FACEIT?
Güncel ELO puanın ve son maçlardan hesaplanan galibiyet grafiği gösterilir. Tarihsel ELO değerleri bu veriden çıkarılmaz.|You can see your current Elo and a win rate chart based on recent matches. These data do not provide historical Elo values.|Ты увидишь текущий Elo и график доли побед по последним матчам. Эти данные не содержат историю Elo.
Lineupları nasıl çalışırım?|How do I practice lineups?|Как тренировать раскидки?
Harita ve tarafı seç. Radar üzerinde başlangıç ve hedefi bul. Varsa fotoğrafı veya videoyu aç, atışı güncel oyun sürümünde dene.|Choose a map and side. Find the starting point and target on the radar. Use any available photo or video, then try the throw in the current game version.|Выбери карту и сторону. Найди на радаре точку броска и цель. Если есть фото или видео, изучи их и проверь бросок в текущей версии игры.
Kaydettiklerim başka cihazda görünür mü?|Will my saved items appear on another device?|Увижу ли я сохранённое на другом устройстве?
Favori Pro CFG’ler hesabına bağlıdır. Lineup ve sunucu favorileri, antrenman notları ve taktik çizimleri kullandığın tarayıcıda saklanır.|Favorite Pro CFGs are tied to your account. Favorite lineups and servers, practice notes, and tactical drawings stay in the browser you use.|Избранные Pro CFG привязаны к аккаунту. Избранные раскидки и серверы, заметки тренировок и тактические схемы хранятся в твоём браузере.
Steam parolamı Clone Lab’e girmem gerekiyor mu?|Do I need to enter my Steam password in Clone Lab?|Нужно ли вводить пароль Steam в Clone Lab?
Hayır. Steam girişi Steam’in kendi sayfasında gerçekleşir. Otomatik maç takibi için gereken kodlar Steam parolandan ayrıdır.|You sign in on Steam’s own page. Automatic match tracking uses codes separate from your Steam password.|Вход выполняется на странице Steam. Автоматическое отслеживание матчей использует отдельные коды, а не пароль Steam.
Clone Lab’i telefonda kullanabilir miyim?|Can I use Clone Lab on my phone?|Можно ли пользоваться Clone Lab с телефона?
Ana sayfa ve oyuncu alanı mobil tarayıcıda açılır. Desteklenen tarayıcılarda Ayarlar’dan ana ekrana ekleyebilirsin. Analiz ve güncel veriler internet bağlantısı gerektirir.|The home page and workspace work in a mobile browser. In supported browsers, you can add Clone Lab to your home screen from Settings. Analytics and current data require an internet connection.|Главная страница и рабочая область открываются в мобильном браузере. В поддерживаемых браузерах Clone Lab можно добавить на главный экран из настроек. Для аналитики и актуальных данных нужен интернет.
Kendi maçlarınla başla|Start with your own matches|Начни со своих матчей
Bir profil bağla veya maçtan önce çalışacağın haritayı seç.|Connect a profile or pick a map to practice before your match.|Подключи профиль или выбери карту для тренировки перед матчем.
Bağımsız CS2 analiz ve antrenman aracı.|Independent CS2 analysis and practice tool.|Независимый инструмент для анализа матчей и тренировок в CS2.`;
  const dictionary=new Map(phrases.split('\n').map(line=>{const [tr,en,ru]=line.split('|');return [tr,{tr,en,ru}];}));
  for(const entry of dictionary.values())Object.assign(entry,window.CloneExtraTranslations?.[entry.en]||{});
  const languages=['tr','en','ru',...(window.CloneExtraLanguages||[])];
  let language='tr';try{language=localStorage.getItem('clone-language')||'tr';}catch{}
  if(!languages.includes(language))language='tr';
  const dynamicWords={tr:['sunucu','atış','oyuncu','bot','Son bilinen liste','Güncellendi','Kaynak erişilemiyor'],en:['servers','throws','players','bots','Last known list','Updated','Source unavailable'],ru:['серверов','бросков','игроков','ботов','Последний список','Обновлено','Источник недоступен'],de:['Server','Würfe','Spieler','Bots','Letzte bekannte Liste','Aktualisiert','Quelle nicht erreichbar'],es:['servidores','lanzamientos','jugadores','bots','Última lista conocida','Actualizado','Fuente no disponible'],fr:['serveurs','lancers','joueurs','bots','Dernière liste connue','Actualisé','Source indisponible'],pt:['servidores','lançamentos','jogadores','bots','Última lista conhecida','Atualizado','Fonte indisponível'],zh:['服务器','投掷','玩家','机器人','最近已知列表','已更新','来源不可用'],hi:['सर्वर','थ्रो','खिलाड़ी','बॉट','अंतिम ज्ञात सूची','अपडेट किया गया','स्रोत उपलब्ध नहीं'],ar:['خوادم','رميات','لاعبين','بوتات','آخر قائمة معروفة','تم التحديث','المصدر غير متاح']};
  const originals=new WeakMap();
  const skipped='script,style,code,textarea,[data-no-translate],#profileWidgetName,#profileMenuAccount,#profileWidgetInitials,.config-player-name';
  function translate(value){const trim=value.trim(),entry=dictionary.get(trim);if(entry)return value.replace(trim,(entry[language]||entry.en));
    const words=dynamicWords[language];
    if(/^\d+ sunucu · (Son bilinen liste|Güncellendi|Kaynak erişilemiyor)$/.test(trim))return value.replace('sunucu',words[0]).replace('Son bilinen liste',words[4]).replace('Güncellendi',words[5]).replace('Kaynak erişilemiyor',words[6]);
    if(/^[\w ]+ · \d+ atış$/.test(trim))return value.replace('atış',words[1]);
    return value;}
  const header=document.querySelector('.site-header');if(!header)return;
  const picker=document.createElement('label');picker.className='language-picker';picker.dataset.noTranslate='';
  picker.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg><select aria-label="Language / Dil / Язык"><option value="tr">Türkçe</option><option value="en">English</option><option value="ru">Русский</option><option value="de">Deutsch</option><option value="es">Español</option><option value="fr">Français</option><option value="pt">Português</option><option value="zh">中文</option><option value="hi">हिन्दी</option><option value="ar">العربية</option></select>';
  header.append(picker);const select=picker.querySelector('select');select.value=language;
  function apply(){
    observer.disconnect();
    document.documentElement.lang=language;
    const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node;node=walk.nextNode();){
      if(node.parentElement?.closest(skipped))continue;
      const record=originals.get(node);
      const original=record&&record.output===node.nodeValue?record.original:node.nodeValue;
      let output=translate(original);if(language==='ru'&&node.parentElement?.closest('.settings-hero h1')){if(original.trim()==='Oyuncu')output=original.replace('Oyuncu','Центр');if(original.trim()==='Merkezi')output=original.replace('Merkezi','игрока');}originals.set(node,{original,output});if(node.nodeValue!==output)node.nodeValue=output;
    }
    document.querySelectorAll('[placeholder],[aria-label],[title],#landingPage img[alt]').forEach(element=>{
      if(element.closest(skipped))return;
      let records=originals.get(element)||{};
      for(const attr of ['placeholder','aria-label','title','alt']){
        if(!element.hasAttribute(attr))continue;
        const current=element.getAttribute(attr),record=records[attr];
        const original=record&&record.output===current?record.original:current,output=translate(original);
        records[attr]={original,output};if(current!==output)element.setAttribute(attr,output);
      }originals.set(element,records);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  }
  let pending=false;
  const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;apply();});}});
  select.addEventListener('change',()=>{language=select.value;try{localStorage.setItem('clone-language',language);}catch{}apply();});
  apply();
})();
