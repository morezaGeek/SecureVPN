> وضعیت فعلی 2026-10-10: سورس انتشار Android Play در `scratch/SecureVPN-Android-source/` (checkout مستقل مخزن خصوصی) است؛ ریشهٔ `app/` نسخهٔ قدیمی sideload است. آخرین بیلدها Windows 2.0.38 و Android Play 1.0.1/code 2 در `SecureVPN-Updates-2026-10-10/` هستند. اصلاح ECH/Gecko و import ساب Dami، scope پینگ Android، DNS مستقل تونل و ماندگاری انتخاب/زمان ویندوز انجام شده است. برای جزئیات تست‌ها و محدودیت Telegram/YouTube، بخش 2026-10-10 در `ChatGPT ChangeLOG.md` را بخوانید. این بیلدها هنوز به GitHub/Play منتشر نشده‌اند. بخش‌های تاریخی زیر لزوماً وضعیت فعلی نیستند.

# راهنمای جامع معماری، توسعه و چنج‌لاگ SecureVPN (ویندوز و اندروید)

> [!IMPORTANT]
> **دستورالعمل الزامی برای توسعه‌دهندگان و مدل‌های هوش مصنوعی (AI Directive):**
> ۱. هرگونه تغییر در سورس‌کد، رفع باگ، یا افزودن قابلیت جدید **باید** بلافاصله در بخش **«تاریخچه نسخه‌ها و تغییرات (Changelog)»** همین فایل ثبت شود.
> ۲. طبق قوانین پروژه، با هر تغییر در برنامه باید شماره نسخه در فایل‌های مربوطه و در رابط کاربری (UI) افزایش یابد.
> ۳. این مستند به عنوان **منبع مرجع (Single Source of Truth)** برای سشن‌های جدید چت طراحی شده تا دید فنی و عمیقی از ساختار پروژه ارائه دهد.
> ۴. **درخواست کاربر برای نسخهٔ بعد Windows، 2026-10-04:** ابتدا سورس و ریلیز نسخهٔ جدید را روی GitHub منتشر کن؛ سپس از داخل نسخهٔ نصب‌شده (اکنون2.0.36) نشان Update و مسیر دانلود/نصب را تست کن. پیش از این آزمون نسخهٔ جدید را دستی نصب نکن. ترتیب و معیارهای تأیید در GITHUB_PUBLISH.md ثبت شده‌اند.

> **دسترسی GitHub، به‌روزرسانی2026-10-03:** توکن معتبر جدید فقط در فایل محلی `scratch/github-token.private.txt` است؛ برای Antigravity، مسیر و روش انتشار در [GITHUB_PUBLISH.md](GITHUB_PUBLISH.md) ثبت شده‌اند. مقدار توکن وارد Git نشود؛ از توکن‌های قدیمی یا credential store استفاده نشود.

## AdMob — وضعیت 2026-10-08

با اجازهٔ کاربر، اپ نمایشی **SecureVPN** و واحد بنر `SecureVPN-Connection-Banner` در AdMob ثبت شده‌اند. App ID: `ca-app-pub-5284715425712192~7524274903`؛ Banner ID: `ca-app-pub-5284715425712192/9988540732`. بیلد تست همچنان از شناسه‌های رسمی demo گوگل استفاده می‌کند. UMP/privacy message، اتصال Play، سیاست حریم خصوصی و Data safety و بررسی AdMob readiness هنوز لازم‌اند؛ جزئیات در [ANDROID_ADS.md](ANDROID_ADS.md) و [ANDROID_PLAY_PREPARATION.md](ANDROID_PLAY_PREPARATION.md) است.

## Android 1.0.1 / versionCode200 — بنر آزمایشی پس از دو چرخه، 2026-10-08

- طبق تأیید کاربر، بنر کوچک AdMob با demo App ID و fixed-banner ID رسمی Google اضافه شد؛ شناسهٔ درآمدزا یا کانفیگ آمادهٔ VPN اضافه نشده است.
- دو چرخه فقط با ثبت موفقیت اتصال در worker و خاتمهٔ نشست همان worker حساب می‌شوند. تکرار پیام، خطای قبل از اتصال، status request و کلیک دکمه شمارنده را زیاد نمی‌کنند. AtomicFile+قفل فایل در noBackupFilesDir برای اشتراک امن بین UI و worker به‌کار رفت؛ UI از SharedPreferences cache چندپروسسی برای شمارنده استفاده نمی‌کند.
- نمایش فقط داخل Home، foreground/RESUMED و DISCONNECTED؛ footer320×50 زیر ناحیهٔ اسکرول است و روی کنترل‌های اتصال نمی‌افتد. در اتصال مجدد/خروج Home/پس‌زمینه destroy می‌شود. اتصال از اعلان تبلیغ یا Activity جدید باز نمی‌کند.
- حداقل دو دقیقه فاصلهٔ تلاش‌ها،15ثانیه فرصت load پس از SDK init،45ثانیه سقف نمایش، بدون placeholder هنگام خطا. چرخه‌ها با impression واقعی reset می‌شوند؛ failure مصرف نمی‌کند و pending به2 محدود است. Ads از state machine اتصال مستقل‌اند و exception شمارنده سرویس را قطع نمی‌کند.
- SDK25.5 با Kotlin فعلی به‌دلیل metadata2.3 شکست خورد؛ AAR24.0 نیزmetadata2.1 داشت. برای APK تست23.6 استفاده شد؛ این سری deprecated ولی هنوز sunset نشده است. ارتقای SDK همراه Kotlin/Compose/AGP پیش از Play در ANDROID_ADS.md ثبت شد. AD_ID از merged manifest حذف شد؛ ادعای نبود جمع‌آوری داده توسط SDK نشده است.
- بسته‌بندی چهار ABI با heap2GB دچار OutOfMemory شد؛ همان بیلد با heap4GB و max-workers=2 پاس شد. این محدودیت ابزار build است، نه crash اپ گوشی. نخستین بیلدهای ناموفق و اصلاحات در لاگ‌های scratch محفوظ‌اند.
- نتیجهٔ نهایی:39 آزمون JVM بدون شکست،4 آزمون متمایز Android (شمارنده، پنج restart واقعی worker، Home فشرده و بنر) و smoke نسخهٔ minified Release پاس شدند. creative آزمایشی Google واقعاً دریافت و نمایش داده شد؛ در CONNECTING حذف شد و کنترل‌ها فعال ماندند. خطای اولیهٔ SDK «Must be called on main UI thread» با dispatch صریح loadAd و destroy به Main.immediate رفع شد. لاگ‌های نهایی: android-1.0.1-banner-final.log و android-1.0.1-release-smoke.log در scratch.
- APK1.0.1/code200، arm64-v8a،37,968,749بایت، SHA256 `0B797360E8336757AE6432BEE15602ED72234CB9B7823A4D8F9C9B31821E1DF6`؛ امضای تست قبلی حفظ شده است. افزایش حدود1.81MiB نسبت به1.0 به وابستگی Ads مربوط است. Windows تغییر نکرد. تست شبانه روی گوشی انجام نشده؛ این فایل برای تست است و درآمد تبلیغاتی ندارد.

## Android 1.0 / versionCode 199 — تم ساده، اعلان و آماده‌سازی انتشار، 2026-10-08

- طبق درخواست کاربر برای اولین انتشار Play، نسخهٔ نمایشی از1.3.68 به1.0 تغییر کرد؛ versionCode از198 به199 افزایش یافت تا APK تست روی نصب قبلی ارتقا پیدا کند. نسخهٔ دسکتاپ تغییر نکرد.
- پس‌زمینهٔ تزئینی WorldMap از صفحهٔ اصلی حذف شد. همهٔ صفحه‌ها زمینهٔ یکدست دارند؛ دارک با مشکی/خاکستری خنثی و کارت‌های بدون گرادیان آبی/بنفش نمایش داده می‌شود. surfaceTint نیز خنثی شد.
- تابع بلااستفادهٔ getDefaultVlessProfile حاوی کانفیگ تست واقعی و SampleProfiles حذف شدند. Repository در نصب تازه هیچ پروفایل یا سابی ایجاد نمی‌کند؛ کانفیگ‌های شخصی نصب قبلی حذف نمی‌شوند.
- گزارش اعلانِ ناپدیدشده بدون قطع VPN: سرویس همهٔ پروتکل‌ها هر15ثانیه وجود اعلان همان نشست را بررسی می‌کند؛ فقط وقتی اعلان مفقود و دسترسی/کانال فعال باشد بازیابی می‌شود. هنگام shutdown job لغو می‌شود و lock و session guard مانع بازگشت اعلان نشست متوقف‌شده هستند. deleteIntent بازیابی قبلی حفظ شد.
- اگر startForeground شکست بخورد، اتصال متوقف می‌شود؛ VPN بدون foreground ادامه نمی‌یابد. Android14+ اجازهٔ سوایپ ongoing را به کاربر می‌دهد؛ اپ از category جعلی تماس استفاده نمی‌کند. امکان بازیابی اعلان با سیاست سیستم هماهنگ است و اعلان خاموش‌شده از تنظیمات کاربر دوباره فعال نمی‌شود.
- ریپوی خصوصی جدا: https://github.com/morezaGeek/SecureVPN-Android . مقدار PAT و فایل‌های خصوصی، APK، backup، دیتای کاربر و AAR بزرگ وارد Git نمی‌شوند. مبنای تاریخچه snapshot پاک‌سازی‌شدهٔ1.3.68 است، نه ادعای وجود همهٔ commitهای قدیمی اندروید.
- آماده‌سازی Play: این نخستین انتشار است. امضای فعلی APK تست debug است و برای Play پذیرفته نمی‌شود. بررسی ELF arm64 نشان داد libbox دارای alignment16KB است، ولی libconscrypt_jni/libopenconnect/libstoken فقط4KB هستند و باید dependency به‌روزرسانی یا از سورس بازسازی شوند؛ فقط ZIP alignment مشکل ELF را رفع نمی‌کند. targetSDK فعلی35 است؛ انتشار تازه در۸اکتبر۲۰۲۶ API36 می‌خواهد. راهنمای انتشار و شواهد در ANDROID_PLAY_PREPARATION.md ثبت می‌شوند. هیچ آپلود Play در این مرحله انجام نشده است.
- تأیید نهایی: 34 آزمون JVM، شش آزمون instrumented شامل نصب خالی، رنگ خنثی، صفحهٔ فشرده، اعلان و پنج reconnect تونل واقعی پاس شدند. در roundاول اعلان ongoing واقعاً در shade سوایپ شد؛ deleteIntent فقط در ابزار تست حذف شده بود، لذا برگشت اعلان از watchdog بود. در roundآخر16ثانیه بعد از disconnect نیز اعلان غایب ماند. بررسی یک‌شبه روی گوشی کاربر انجام نشده است.
- APK Release با R8 روی شبیه‌ساز نیز اجرا شد؛ runner مستقل از Compose، نسخه1.0 و نبود پروفایل آماده را تأیید و چهار اسکرین‌شات واقعی Home/Settings در Light/Dark را ثبت کرد. عکس‌ها آفلاین و بدون IP واقعی یا کانفیگ کاربر در Android-1.0-Screenshots هستند. مشکل initial manifest ابزار تست با ثبت صریح JUnit runner رفع شد؛ برنامهٔ تولیدی تغییر اضافی نداشت.
- فایل گوشی SecureVPN-v1.0.apk، arm64-v8a، 36,073,260 بایت، SHA256 `25B4CB4FE09EC39383E354C31638F2013FCFDC19B3B3CF0FDB3E42C6013E029E`. apksigner گواهی قبلی `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` را تأیید کرد. کد199 از198 بالاتر است؛ ارتقای APK بدون reset نسخه ممکن است. پس‌زمینه و helper بلااستفاده حذف شدند، اندازهٔ APK اندکی کمتر از1.3.68 شد.
- شواهد: scratch/android-1.0-build.log، android-1.0-instrumentation.log، android-1.0-release-smoke.log و android-1.0-native-audit.json. Play بعد از API36، امضای انتشار و اصلاح native16KB قابل ادامه است.
- انتشار سورس تأیید شد: دو commit مبنا و تغییرات در main ریپوی خصوصی SecureVPN-Android پوش شدند؛ SHA بررسی‌شدهٔ initial push `0507b8da5efd7f7e2ebc0094243b634a66f1d76b` بود. private بودن پس از push با API دوباره تأیید شد. بیلد مستقل checkout پوش‌شده نیز با JDK17 و dependency pinned، به‌صورت offline پاس شد؛34 آزمون JVM و assembleRelease موفق بودند. راهنمای ادامه و محل checkout در ANDROID_GITHUB.md است.


---

## ۱. نقشه راه و نمای کلی پروژه (Project Overview)

**SecureVPN** یک نرم‌افزار ضدسانسور و کلاینت چندپروتکله با بازدهی بالا است که برای دو پلتفرم **ویندوز (Desktop)** و **اندروید (Mobile)** توسعه داده شده است. هدف اصلی این پروژه، عبور پایدار، پرسرعت و امن از فیلترینگ شدید در اپراتورهای ایرانی (همراه اول، ایرانسل، رایتل و ISPهای ثابت) با حفظ تاخیر حداقلی (Low Latency) و دور زدن سایت‌های داخلی است.

### خلاصه‌ی پشته فناوری (Tech Stack):
- **ویندوز (Windows Desktop):** 
  - معماری: **Tauri v2 (Rust Backend) + React 18 + TypeScript + Vite + Tailwind CSS**
  - ارتباط با وب‌ویو: `WebView2` از طریق سامانه IPC اختصاصی Tauri
  - هسته‌های پردازش شبکه: `sing-box.exe` (نسخه 1.12+)، `openconnect.exe`، درایور `wintun.dll`
- **اندروید (Android Mobile):**
  - معماری: **Kotlin بومی + Jetpack Compose + Material 3 + Kotlin Coroutines**
  - سرویس هسته: `android.net.VpnService`
  - هسته شبکه: ادغام کتابخانه رسمی `libbox.aar` (Sing-Box Go runtime) و باینری‌های Native OpenConnect
- **پروتکل‌های پشتیبانی‌شده:**
  - V2Ray / Sing-box: **VLESS** (Reality, TLS, WebSocket, gRPC, XHTTP, HTTPUpgrade)، **VMess**، **Trojan**، **Shadowsocks**
  - سازمانی و Enterprise: **Cisco AnyConnect / OpenConnect**، **SSTP**، **SoftEther**

---

## ۲. کالبدشکافی معماری نسخه ویندوز (Windows Client Architecture)

مسیر سورس‌کد نسخه مدرن: [`windows-app-tauri/`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri)

### ۲.۱. فایل‌های کلیدی بک‌اند Rust (`src-tauri/src/`):
1. [`main.rs`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/src-tauri/src/main.rs):
   - نقطه ورود اپلیکیشن، کانفیگ Tauri Builder، مدیریت پلاگین Single Instance، مقداردهی اولیه System Tray و ثبت هندلرهای سیستم‌عامل.
2. [`commands.rs`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/src-tauri/src/commands.rs):
   - رابط IPC بین فرانت‌اند و کدهای سیستمی Rust.
   - فرامین اتصال و قطع: `vpn_connect` و `vpn_disconnect`.
   - پروکسی سیستم: `set_system_proxy` که رجیستری ویندوز را در آدرس `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings` تغییر می‌دهد (`ProxyEnable`، `ProxyServer` و لیست بای‌پس ایران در `ProxyOverride`).
   - تست پینگ پیشرفته: توابع `singbox_batch_real_delay` و `singbox_test_profile_real_delay`.
   - دریافت سابسکریپشن: `subscription_fetch` (دریافت اطلاعات ترافیک `Upload/Download/Total/Expire` از هدرهای سرور و دکود کانفیگ‌های Base64).
   - مدیریت دسترسی ادمین: `vpn_is_elevated` جهت بررسی دسترسی برای فعالسازی آداپتور مجازی Wintun.
3. [`singbox.rs`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/src-tauri/src/singbox.rs):
   - تولیدکننده کانفیگ پویا برای `sing-box.exe`.
   - نگاشت انواع پروتکل‌ها (VLESS Reality, WS, XHTTP, gRPC, Trojan, VMess).
   - تولید کانفیگ تست پینگ دسته‌ای (`build_singbox_batch_test_config`) با پورت‌های مستقل Inbound برای تست همزمان.
   - اسپاون و مانیتورینگ پروسه `sing-box.exe run -c <config_path>` و هندل کردن لاگ‌ها و کرش‌ها.
4. [`openconnect.rs`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/src-tauri/src/openconnect.rs):
   - اجرای `openconnect.exe` با اسکریپت `vpnc-script-win.js` و برقراری ارتباط با سرورهای Cisco AnyConnect.
5. [`state.rs`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/src-tauri/src/state.rs):
   - ساختار `AppState` برای مدیریت وضعیت همزمان تانل در حافظه (Mutex، وضعیت اتصال، پینگ لایو، و متوقف‌سازی پروسه‌های فرزند).

### ۲.۲. فرانت‌اند React و سیستم تست Real Delay (مشابه V2rayN):
- **نحوه عملکرد تست تاخیر واقعی (Real Delay):**
  - در نسخه‌های اولیه از TCP Ping استفاده می‌شد که صرفاً زمان برقراری کانکشن به آی‌پی سرور را می‌سنجید و فیلتر بودن تانل یا تاخیر واقعی تبادل دیتا را نشان نمی‌داد.
  - برای حل این مشکل، موتور تست تاخیر V2rayN پیاده‌سازی شد: برای پروفایل‌ها Inboundهای محلی SOCKS/HTTP تعریف می‌شود، پروسه تست موقت اجرا شده، با سرور هندشیک کامل TLS صورت گرفته، و درخواست واقعی `GET http://www.gstatic.com/generate_204` با هدر `Proxy-Connection: keep-alive` ارسال می‌شود. زمان دریافت اولین بایت (TTFB) دقیقاً به عنوان Real Delay ثبت می‌گردد.
  - جهت جلوگیری از درگیر شدن سوکت‌های ویندوز، سیستم **Staggered Batch Ping** پیاده شد که با فواصل میلی‌ثانیه‌ای تست‌ها را شلیک می‌کند.
  - کلید میانبر `Ctrl+R` و دکمه تست روی هر کارت برای سنجش آنی تاخیر قرار دارد.

---

## ۳. کالبدشکافی معماری نسخه اندروید (Android Client Architecture)

مسیر سورس‌کد اندروید: [`app/`](file:///H:/Antigravity%20Projects/VPN%20APP/app)

### ۳.۱. ماژول‌های اساسی هسته شبکه (`app/src/main/java/com/vpnapp/vpn/`):
1. [`SingBoxConfigGenerator.kt`](file:///H:/Antigravity%20Projects/VPN%20APP/app/src/main/java/com/vpnapp/vpn/singbox/SingBoxConfigGenerator.kt):
   - تولیدکننده ساختار JSON استاندارد sing-box 1.12+.
   - **آرایش DNS:**
     - ایندکس ۰: سرور `proxy-dns` از نوع `tcp://8.8.8.8:53` با `detour: "proxy"` (به عنوان پیش‌فرض الزامی در هسته).
     - ایندکس ۱: سرور `fakeip` با رنج آی‌پی `198.18.0.0/15` جهت پاسخ‌دهی فوری (0ms).
     - ایندکس ۲: سرور `direct-dns` با آی‌پی `178.22.122.100` برای دامنه‌های ایرانی بدون `detour` مستقیم (برای پیشگیری از خطای Empty Direct Outbound).
   - **قوانین مسیردهی (Routing Rules):**
     - اسنیفرهای فعال: `["http", "tls", "quic", "dns"]`.
     - ربودن پورت ۵۳: `{"port": [53], "action": "hijack-dns"}` تا هیچ کوئری DNS توسط اندروید نشت نکند.
     - مسدودسازی QUIC: بستن پورت `443` پروتکل `udp` تا یوتیوب فوراً به TCP HTTP/2 سوئیچ کند.
     - پشتیبانی کامل از VLESS با قابلیت `packet_encoding: "xudp"` جهت عبور ترافیک UDP.
2. [`SingBoxEngine.kt`](file:///H:/Antigravity%20Projects/VPN%20APP/app/src/main/java/com/vpnapp/vpn/singbox/SingBoxEngine.kt):
   - پیاده‌سازی اینترفیس `io.nekohasekai.libbox.PlatformInterface`.
   - فراخوانی `protectSocket(fd)` برای محافظت از سوکت‌های خروجی و جلوگیری از افتادن ترافیک هسته در لوپ VPN.
   - **اصلاح پرچم‌های POSIX:** بازگرداندن مقادیر `IFF_UP | IFF_RUNNING` به هسته Go runtime تا کارت شبکه‌های Wi-Fi و Cellular را فعال تشخیص دهد.
   - استفاده از `NET_CAPABILITY_NOT_RESTRICTED` در Network Callback برای دریافت اینترفیس فیزیکی اصلی گوشی.
3. [`VpnConnectionService.kt`](file:///H:/Antigravity%20Projects/VPN%20APP/app/src/main/java/com/vpnapp/vpn/VpnConnectionService.kt):
   - سرویس پس‌زمینه اندروید که چرخه حیات اتصال را هدایت می‌کند.
   - ایجاد آداپتور TUN با `VpnService.Builder`، تخصیص آی‌پی `172.19.0.1/30` و MTU بهینه 1400.
   - اطلاع‌رسانی لایو ترافیک مصرفی و سرعت آپلود/دانلود به UI از طریق `BroadcastReceiver`.

---

## ۴. چالش‌های فنی عمیق حل‌شده (Critical Engineering Solutions)

| مشکل مشاهده‌شده | علت ریشه‌ای در هسته شبکه | راه‌حل مهندسی اعمال‌شده |
| :--- | :--- | :--- |
| **خطای `Read timed out` روی اینترنت همراه (ایرانسل/همراه اول)** | عدم عبور بسته‌های UDP بر بستر VLESS و مسدود بودن کوئری‌های DNS | فعالسازی `packet_encoding: "xudp"` روی تمام اوت‌باندهای VLESS/VMess و اضافه کردن قانون هایجک پورت 53 UDP. |
| **خطای Fatal در شروع sing-box 1.12+:** `default server cannot be fakeip` | در نسخه‌های جدید sing-box سرور اول آرایه DNS باید یک سرور قابل رزولوت باشد | جابجایی سرورها به نحوی که `proxy-dns` در ایندکس ۰ و `fakeip` در ایندکس ۱ قرار گیرد. |
| **خطای کرش:** `detour to an empty direct outbound makes no sense` | سرور `direct-dns` تلاش می‌کرد به اوت‌باند خالی `direct` دیتور کند | حذف `put("detour", "direct")` از تعریف `direct-dns` در کلاس `SingBoxConfigGenerator.kt`. |
| **تشخیص اشتباه قطع بودن اینترنت در هسته Go:** `interfaces down` | در متد `getInterfaces` در لایه Java پرچم‌های شبکه با مقدار `0` پاس داده می‌شد | نگاشت وضعیت رابط‌های اندروید به بیت‌ماسک‌های استاندارد POSIX (`IFF_UP \| IFF_RUNNING`). |
| **لوپ شدن اتصال و قطع مداوم سوکت** | ثبت شدن اینترفیس مجازی `tun0` به عنوان اینترفیس پیش‌فرض گوشی | فیلتر کردن Network Callbackها با متد `addCapability(NET_CAPABILITY_NOT_RESTRICTED)`. |
| **تفاوت پینگ با V2rayN در نسخه ویندوز** | استفاده از تست خام TCP Socket در برابر تست کامل لایه اپلیکیشن در V2rayN | ساخت موتور تست با ارسال درخواست `GET generate_204` به گوگل روی پورت اختصاصی SOCKS با قابلیت Keep-Alive. |
| **بافرینگ شدید ویدیوی یوتیوب در موبایل** | ارسال بسته‌های QUIC بر بستر UDP که در ایران با افت پکت شدید مواجه می‌شود | مسدودسازی هوشمند ترافیک UDP 443 در هسته sing-box تا مرورگر و اپ به سرعت به TCP HTTP/2 بازگردند. |

---

## ۵. تاریخچه نسخه‌ها و تغییرات (Changelog)

### Android 1.3.68 / versionCode198 — اسکن و اشتراک‌گذاری QR و ثبات DNS، 2026-10-08

- نتیجهٔ تست گوشی، ۸ اکتبر ۲۰۲۶: پس از تحویل APK1.3.68 در ادامهٔ گزارش کامنت‌های Instagram روی Dallas/Gozar، کاربر گفت «دمت گرم درست شد». رفع مشکل گزارش‌شده روی گوشی از طرف کاربر تأیید شد. این نتیجه، تأیید کاربر است؛ تست مستقل حساب توسط توسعه‌دهنده انجام نشده و ثابت نمی‌کند تغییر نگاشت FakeIP تنها علت بوده است. timeoutهای آزمایش شبیه‌ساز در گزارش زیر برای پیگیری تاریخی حفظ شده‌اند.
- Add → Scan QR، V2Ray → Scan QR و Add Sub → Scan QR یک اسکنر portrait داخلی با ZXing Android Embedded4.3.0 وcore3.5.3 باز می‌کنند. CAMERA فقط پس از انتخاب Scan QR درخواست می‌شود؛ نبود دوربین، رد مجوز و لغو اسکن رسیدگی دارند. CAMERA feature اجباری نیست. CaptureActivity چرخهٔ دوربین و decoding را مدیریت می‌کند؛ QR فقط محلی پردازش می‌شود، تصویر دوربین ذخیره/آپلود نمی‌شود.
- نتیجهٔ QR و کلیپ‌بورد از ShareLinkCodec.parseImport عبور می‌کنند. لینک پروفایل قبل از ذخیره نام/پروتکل/سرور را نشان می‌دهد؛ HTTP(S) پیش‌نمایش ساب و نام اختیاری دارد و تنها پس از Import دانلود می‌شود. QRهای دیگر، لینک نامعتبر، پورت خارج بازه و auth خالی رد می‌شوند. Force/Smart XHTTP همچنان از addProfile قبلی اعمال می‌شود.
- دکمهٔ Share کنار هر کارت و Share subscription در ویرایش ساب، دیالوگ QR و Copy link / Share link / Share QR image باز می‌کند. کلیپ‌بورد full link و sensitive flag دارد. PNG از cache/shared-qr با FileProvider غیرexported و فقط همان مسیر، content URI و مجوز موقت خواندن ارسال می‌شود؛ دسترسی storage درخواست نمی‌شود. QR سفید/سیاه با quiet zone، UTF-8 وECC M است؛ لینک بیش از ظرفیت QR همچنان کامل قابل کپی و اشتراک متنی است. ساخت QR وPNG روی thread پس‌زمینه انجام می‌شود.
- خروجی VLESS/VMess/Trojan/Shadowsocks/Hysteria2 لینک همان پروتکل است؛ IPv6، credential، نام فارسی، + و% وtransport، XHTTP extra/mode، TLS/Reality، VLESS encryption وVMess cipher/alterId حفظ می‌شوند. خروجی OpenConnect/SSTP با scheme همان پروتکل، username/password وinsecure/DTLS/native/MTU است؛ round-trip داخل SecureVPN پشتیبانی می‌شود، سازگاری این دو scheme با تمام کلاینت‌های دیگر ادعا نمی‌شود. Smart policy محلی/شناسه‌ها/آمار/تاریخ به گیرنده صادر نمی‌شوند؛ برای XHTTP mode واقعی/موفق صادر می‌شود و سیاست import گیرنده مستقل است.
- parser برای round-trip اصلاح شد: fragment URI دوباره URLDecode نمی‌شود (نام‌های شامل%یا+ خراب می‌شدند)، bracketهای IPv6 حذف می‌شوند، gRPC serviceName خوانده می‌شود وVMess aid/scy/extra وallowInsecure از لینک نگه داشته می‌شوند. Hysteria2 insecure صریح خوانده می‌شود؛ پیش‌فرض قبلی بدونپارامتر حفظ شد.
- نسخه وUI به1.3.68/code198 افزایش یافت؛ کتابخانهٔ هسته، MTU وWindows تغییر نکردند. علاوه بر QR، persistence نگاشت FakeIP اصلاح شد.
- بررسی Dallas ساب Gozar: پروفایل محلی VLESS/XHTTP باTLS وALPN=h2 وextra مربوط بهpadding بود. مقایسهٔ Desktop با sing-box1.14.2-lx.11 وXray26.3.27، درauto وstream-up: هرچهار URL (generate_204، robots اینستاگرام، i.instagram.com/api/v1 وgraph.instagram.com) پاسخ HTTP دادند؛ UDP/DNS از داخل SOCKS نیز درهرچهار حالت پاسخ معتبر داشت. 404/400 ویک500 پاسخ سرور API بدونورود هستند، تأیید کامنت یا حساب نیستند. نتایج بدونcredential در scratch/dallas-2026-10-08/results.json هستند.
- یک ایراد مشخص DNS بازتولید شد: FakeIP همان دامنه در دو worker متوالی و ترتیب متفاوت تخصیص از198.18.0.3 به198.18.0.5 عوض شد. اپ‌های باز می‌توانند پاسخ IP قبلی را در حافظه نگه دارند و بعد ازتعویض VPN به نگاشت اشتباه/ناموجود برسند. experimental.cache_file با enabled وstore_fakeip فعال شد؛ مسیر مطلق context.noBackupFilesDir/sing-box-fakeip.db، مشترک بین کانفیگ‌ها وخصوصی اپ است، درbackup اندروید وارد نمی‌شود. مسیر نسبی قبلاً به‌دلیل permission حذف شده بود؛ این مسیر از working directory هسته مستقل است. صرفاً نگاشت FakeIP ذخیره می‌شود؛ store_dns فعال نشده تا پاسخ‌های واقعی DNS بین سرورها بی‌جهت نگه نمانند. تست پینگ مستقل mixed-inbound این فایل را استفاده نمی‌کند.
- آزمون پیش‌ازاصلاح در scratch/android-1.3.68-fakeip-before.log باخطای مقایسهٔ آدرس شکست خورد؛ پس‌ازاصلاح پنج restart هسته باسرورfixtureمحلی، چنددامنهٔ جدید درهرround وDNS UDP ازتونل واقعی، آدرس همان دامنه ثابت ماند وexitlookup/latency کارکردند. آماده‌شدن شبکهٔ VPN پیش‌شرط درخواستDNS شد؛ broadcast CONNECTED می‌تواند زودتر ازانتخاب default network برسد وبدوناین‌انتظار یکquery بهDNS بیرونی رفتهNXDOMAIN گرفت. این انتظار اصلاح تست است؛ خودش به‌عنوان علت قطعی Instagram گزارش نشده.
- آزمون نهایی: 34unit، 16instrumentation یکپارچه و1instrumentation اضافی تغییر زندهٔ routing/قطع و وصل همگی پاس شدند. مسیر دوربین باQR مصنوعی، رد دسترسی وretry/تأیید، عدمذخیره قبل ازImport، round-trip هفت پروتکل، خواندنPNG ازFileProvider، clipboard sensitive وdecode پیکسل‌هایQR درهردوتم بررسی شدند. oversized QR کپی/اشتراکمتنی را ازکارنمی‌اندازد. R8/minify وlintVitalRelease پاس شدند.
- چالش‌های تستQR: شبیه‌ساز اولیهAPI37 باEspresso قدیمی خطای InputManager داشت؛ آزمون نهایی رویAPI34 اجرا شد. imagefile camera باpath دارایفاصله وviewport/crop ورودی به‌درستی QR را نشان نمی‌داد؛ فایل تست به مسیر بدونفاصله منتقل وQR512px درcanvas سفید1920 باoffset مناسب گذاشته شد. flagهای user-fixed مجوز بینتست‌ها پاک شدند. اسکن واقعی API34 سپس پاس شد؛ تست منطق بافرض decode موفق گزارش نشده است. دیالوگ اشتراک160dp وpreview لینک دودخط است تا Copy/Share ازابتدا دیده شوند؛ محتوای خروجی وPNG768px کامل هستند. PixelCopy درتغییرتم ممکن است زودتر ازhardware redraw snapshot بدهد؛ خود QR نمایش‌داده‌شده درهرتم decode و اعتبارسنجی شد.
- آزمون تکمیلی نگاشت معکوس نیز پاس شد: در هر پنج اتصال، با socket به FakeIP نگه‌داشته‌شده وصل شدیم و HTTP Host هم همان IP بود تا sniffing نام اصلی را بازیابی نکند؛ سرور fixture نام دامنهٔ صحیح را در هدر VLESS دریافت کرد. تست اولیهٔ HttpURLConnection به‌دلیل منع cleartext اندروید متوقف شد و فقط ابزار تست به socket محلی تغییر کرد؛ سیاست HTTP اپ تغییر نکرد. لاگ نهایی scratch/android-1.3.68-fakeip-after.log شامل OK (1 test) است.
- محدودیت Dallas: باگ تغییر نگاشت FakeIP تأیید و اصلاح شده است، ولی اینکه تنها علت نیامدن کامنت‌های حساب کاربر باشد هنوز ثابت نشده؛ endpoint بدونlogin جای تست خودcomments را نمی‌گیرد. پس‌ازنصب، یکبار Instagram را کامل ببند و دوباره باز کن تاFakeIPهای ذخیره‌شده ازنسخهٔ قبلی کنار گذاشته شوند؛ سپس Dallas وقطع/وصل را باهمان حساب/اینترنت مقایسه کن. درصورتباقی‌ماندن مشکل، trace DNS/TCP/UDP همان گوشی وکانفیگ دقیق v2rayNG لازم است؛ بدونشاهد QUIC یاMTU سراسری تغییر داده نشد.
- وضعیت دقیق تست واقعیDallas: قبل ازاصلاح، stream-up رویریلیز ازTUN واقعی بههرسه endpoint جوابداد وping209ms/PublicIPUS داشت. دربیلدنهایی، باmodeواقعی auto (generated_mode=auto)، دوendpoint اینستاگرامtimeout وgraph400 بود. سناریوی stream-up/reconnect هم رویبررسی endpointها شکست خورد؛ بنابراین موفقیت تستثباتDNS با موفقیت کامنت‌ها یکی نیست وتمام timeoutهایDallas رفع‌شده گزارش نمی‌شوند. Desktopمجدداً درهردوهسته وmodeها HTTP/UDP پاسخ داد؛ اختلاف AndroidTUN/مسیرشبکه هنوز نیازمند trace گوشی است. ابزار قدیمی mode_override تنهاv2rayType را عوض می‌کرد وoverride ذخیره‌شده می‌توانست آنرا overwrite کند؛ ابزار اصلاح شد وgeneratedmode باخواستهٔ تست assert می‌شود. کاربر درپاسخ۸اکتبر گفت فعلاً APK را بده تاخودش رویگوشی تست کند؛ تستخودحساب وcomments انجام نشد.
- APK نهایی: [SecureVPN-v1.3.68.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.3.68.apk>)، arm64-v8a، **36,078,148 بایت**، حدود34.41MiB، افزایش179,284بایت نسبت به67. SHA256 `F5EC40C67E295906F5740149D9B46B982B556156A6C562B0B16206CFC51B51A6`. apksigner گواهی قبلی `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` را تأیید کرد؛ نصب روی نسخهٔ قبلی ممکن است. شواهد محلی: scratch/android-1.3.68-build.log، api34-tests.log، routing-test.log، qr-pixels.log، qr-release.log وپوشه scratch/dallas-2026-10-08. سورسAndroid وAPK مطابق ignore ریشه محلی‌اند؛ این درخواست انتشارGitHub نداشت.
- منابع رسمی پیاده‌سازی: [ZXing Android Embedded](https://github.com/journeyapps/zxing-android-embedded)، [Android FileProvider](https://developer.android.com/reference/androidx/core/content/FileProvider)، [Sensitive clipboard](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste#sensitive-content)، [sing-box cache_file/store_fakeip](https://sing-box.sagernet.org/configuration/experimental/cache-file/). برای تست واقعی مسیر دوربین می‌توان [imagefile camera emulator](https://developer.android.com/studio/run/emulator-commandline) را باQR مصنوعی به کار برد.

### Android 1.3.67 / versionCode197 — پینگ تازه و کارت‌های کوچک‌تر، 2026-10-07

- با شروع تست، نتیجهٔ قبلی تمام پروفایل‌های هدف و selectedProfile فوراً پاک می‌شود. تست‌ها پشت‌سرهم اجرا می‌شوند؛ صف تست، پروفایل در حال تست و تعداد تکمیل‌شده در StateFlow نمایش داده می‌شوند. spinner فقط هنگام تست فعال است؛ کارت‌های منتظر «Queued» دارند. دکمهٔ Ping حین تست غیرفعال است تا ضربهٔ تکراری صف جدا نسازد.
- generation و cancellation از اعمال نتیجهٔ دور قبلی جلوگیری می‌کنند؛ failure مقدار -1 ثبت می‌کند و حالت busy در finally پاک می‌شود. نتیجهٔ پروفایلی که حین تست ویرایش یا با refresh عوض شده اعمال نمی‌شود. هنگام اتصال، تست لیست فقط latency تونل فعال را می‌گیرد؛ هستهٔ آزمایشی موازی با VPN ساخته نمی‌شود. انتخاب کارت دیگر هویت تست تونل فعال را عوض نمی‌کند.
- لمس ردیف سرعت/حجم، دیالوگ دانلود، آپلود و مجموع حجم همین اتصال را باز می‌کند؛ اعداد زنده‌اند و شمارندهٔ کل عمر اپ محسوب نمی‌شوند.
- تاریخ روی کارت زمان آخرین اتصال بود؛ نمایش آن و formatter حذف شد ولی timestamp ذخیره‌شده حفظ شد. عنوان کارت titleSmall و حداکثر2خط است، ستون متن وزن مستقل دارد تا دکمه‌های ویرایش/حذف بیرون نروند.
- هسته، MTU، routing، Windows و فونت سیستم گوشی تغییر نکردند.
- تأیید نهایی67: 34 تست JVM و5 تست instrumentation روی emulator API34 موفق بودند؛ پاک‌شدن فوری نتایج، تکرار تست با probe لغوشده، failure و رفع busy، نام دقیقاً2خطی در عرض360dp/font1.2، حذف تاریخ و نمایش spinner به‌جای پینگ قبلی، دیالوگ ترافیک در تم روشن/تیره و رگرسیون‌های ساب/اعلان پوشش داده شدند. تصاویر Home به‌صورت محلی بررسی شدند. Release با R8 روی شبیه‌ساز نصب شد و MainActivity بدون crash اجرا شد؛ تست واقعی اتصال/سرعت شبکه روی گوشی در این نسخه انجام نشده است.
- APK نهایی: [SecureVPN-v1.3.67.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.3.67.apk>)، arm64-v8a، **35,898,864 بایت**، حدود34.24MiB؛ افزایش3,172بایت نسبت به66. SHA256 `A17A47030FE25AAC6296B88096A609CD06E5971F84E5EC583C698602181E1842`. apksigner امضای67و66را یکسان تأیید کرد: `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62`؛ APK روی نسخهٔ موجود قابل ارتقاست، نصب روی گوشی به کاربر واگذار شد.
- شواهد محلی: scratch/android-1.3.67-build.log، scratch/android-1.3.67-instrumentation.log، scratch/android-1.3.67-home-light.png وhome-dark.png. سورس Android وAPK طبق .gitignore ریشه وارد Git ویندوز نمی‌شوند؛ انتشار GitHub در این درخواست انجام نشد.

### Android 1.3.66 / versionCode196 — صفحهٔ اصلی فشرده و ساب، 2026-10-07

- طبق درخواست کاربر، توسعه دوباره به Android منتقل شد؛ Windows2.0.37 و هسته‌ها تغییر نکردند.
- MainActivity.onStart رفرش تمام ساب‌های ذخیره‌شده را در پس‌زمینه درخواست می‌کند؛ برگشت از پس‌زمینه نیز رفرش می‌کند. ViewModel guard جلوی تکرار در چرخش صفحه و jobهای هر ساب جلوی هم‌پوشانی را می‌گیرند. حداکثر3دریافت هم‌زمان؛ موفقیت/شکست در لاگ و وضعیت refresh در UI. رفرش دیگر خودکار همهٔ پینگ‌ها را اجرا یا VPN را restart نمی‌کند. قطع شبکه، فهرست قبلی را نگه می‌دارد؛ URL و حذف/ویرایش حین دریافت دوباره بررسی می‌شوند.
- SubscriptionProfiles.merge شناسهٔ محلی، زمان ساخت/آخرین اتصال و override دستی XHTTP را حفظ می‌کند؛ دادهٔ تازهٔ سرور وارد می‌شود و نتیجهٔ smart/ping با تغییر endpoint معتبر نمی‌ماند. نام‌های تکراری یک‌به‌یک با endpoint تطبیق می‌یابند. این اصلاح برای رفرش هر بار ضروری بود؛ parser قبلاً UUID تازه می‌داد و selected profile به اول لیست می‌پرید.
- فیلتر ساب در SharedPreferences vpn_profiles با selected_subscription_id ذخیره می‌شود؛ در بازشدن/بازگشت از تنظیمات همان ساب می‌ماند و chip آن به دید می‌آید. حذف همان ساب به All برمی‌گردد؛ پروفایل‌ها پاک نمی‌شوند.
- نام کانفیگ اصلی از session/service و profile_id نمایش داده می‌شود، مستقل از انتخاب کارت بعدی. تمام broadcastهای Connected و RequestState شناسه/نام/پروتکل دارند؛ وضعیت سرویس در هر onStart UI دوباره خوانده می‌شود. کانفیگ حذف‌شده از ساب، نام session فعال را مخفی نمی‌کند.
- UI: دکمهٔ108dp کنار وضعیت و نام کانفیگ/ساب/زمان؛ حذف Private IP و Transport فقط از صفحه؛ Public IP و Ping در کارت کوچک، Origin IP و MTU در ردیف پایین؛ سرعت دانلود/آپلود و مجموع حجم در یک ردیف. نسخه به بالای صفحه منتقل، فاصله‌ها کمتر، لاگ با لمس باز/بسته و FAB تکراری حذف شد. تم روشن/تیرهٔ موجود حفظ شد و انیمیشن مداوم جدید اضافه نشد.
- اعلان سرویس ongoing و autoCancel=false و onlyAlertOnce است. اندروید14به‌بعد حتی ongoing را در حالت unlocked قابل سوایپ می‌کند؛ deleteIntent به همان سرویس برمی‌گردد و فقط برای session فعلی در حالت connecting/connected اعلان را repost می‌کند. در قطع، shutdown یا intent متعلق به session قدیمی، VPN دوباره وصل نمی‌شود و اعلان برنمی‌گردد. این راهکار بازیابی اعلان است، ادعای ممنوع‌شدن قطعی gesture در تمام OEMها نیست؛ مجوز/کانال خاموش‌شده توسط کاربر هم از اپ قابل اجبار نیست. [مرجع رسمی](https://developer.android.com/about/versions/14/behavior-changes-all#non-dismissable-notifications).
- تأیید نهایی66: 34 تست JVM و3 تست instrumentation روی emulator API34 گذشتند (Home360dp وfont1.2 در هر دو تم، foreground refresh/فیلتر و notification flags). Release با R8 نصب و اجرا شد. SecureVPN-v1.3.66.apk، arm64، 35,895,692بایت؛ SHA256 `CD659654104B30656347C4938081732836552D65ED468DF8211E948AC741B30B`؛ همان گواهی نسخه65. آزمون VPN و gesture اعلان روی تمام OEMها انجام نشده. درخواست بازگردانی font_scale شبیه‌ساز از1.5به1.0 در پایان66 توسط automatic approval review به علت سقف مصرف رد شد و اجرا نشد.
- خطای اولیه Gradle: TEMP ابزار sandbox بیش از حد طولانی بود و JDK UnixDomainSockets با Invalid argument: connect شکست خورد. انتخاب JDK17 و TEMP/TMP و jdk.net.unixdomain.tmpdir کوتاه داخل scratch/jtmp فقط برای پردازش build، مشکل اتصال daemon را حل کرد؛ IPv4 به‌تنهایی کافی نبود. هیچ تنظیم سیستمی تغییر نکرد.

### Windows v2.0.37 — بایپس و دانلود موازی، 2026-10-06

- گزارش کاربر: هنگام ورود IP بایپس پنجره‌ای مکرراً باز/بسته می‌شود؛ دامنه نیز همان مسیر را داشت. save روی blur حتی آرایهٔ بدون تغییر را ارسال می‌کرد؛ provider صرف وجود کلید routing را «تغییر» فرض و connect دوباره می‌کرد. taskkill بدون CREATE_NO_WINDOW می‌توانست پنجره/فوکوس را جابه‌جا کند و blur مجدد تولید کند.
- provider اکنون مقادیر واقعی را با settingsRef مقایسه می‌کند؛ بدون تغییر هیچ ذخیره/اتصال مجدد انجام نمی‌شود. merge بیرون updater تابع setState است، snapshot جدید فوراً در ref نگهداری می‌شود و تغییر هم‌زمان IP/دامنه از بین نمی‌رود. routing در یک صف apply انجام می‌شود؛ blur+Save همان Promise را انتظار می‌کشند، عملیات هم‌زمان connect ایجاد نمی‌کنند و آخرین snapshot بعد از عملیات جاری اعمال می‌شود.
- blur ناشی از خروج فوکوس از خود اپ، متن نیمه‌ویرایش‌شده را live apply نمی‌کند؛ Save صریح همچنان کار می‌کند. پیام Applied Live بعد از پایان عملیات موفق نمایش داده می‌شود؛ در خطا، تنظیمات ذخیره می‌شوند ولی پیام reconnect لازم است. تایمرهای Saved محدود به دو کادرند، هنگام خروج پاک می‌شوند و پاسخ دیررس روی screen بسته‌شده setState نمی‌کند. label دسترس‌پذیر برای کادرها/Save اضافه شد.
- taskkillهای بستن PID خود اپ و فرمان net session به helper hidden_command منتقل شدند که در Windows از CREATE_NO_WINDOW استفاده می‌کند. نصب/UAC دور زده نشده است؛ رفتار GUI هسته تغییر نکرده و آزمون مستقیم روی پنجرهٔ Administrator انجام نشده است.
- دانلود خودکار فایل‌های حداقل8MiB اکنون Range0-0 را واقعاً بررسی می‌کند؛ در پشتیبانی معتبر، چهار اتصال HTTP/1.1، قطعه‌های2MiB و handle/seek مستقل در فایل preallocated استفاده می‌شوند. هر قطعه دو تلاش،90ثانیه سقف درخواست و20ثانیه سقف توقف دریافت دارد. به‌جای clone کردن handle با offset مشترک، هر worker فایل را جدا باز می‌کند.
- Range باید206، Content-Range دقیق شامل total و encoding identity داشته باشد؛ strong ETag در صورت وجود با If-Range منتقل می‌شود. URL نهایی CDN از redirect معتبر client گرفته می‌شود؛ توکن انتشار داخل اپ وجود ندارد. در خطا/عدم پشتیبانی، همهٔ workerها abort/reap و سپس فایل برای دانلود تک‌اتصال truncate می‌شود. retry پیشرفت را دوبار نمی‌شمارد و بیشتر از100درصد گزارش نمی‌شود.
- بعد از flush/sync، SHA256 روی کل فایل مونتاژشده خوانده و اندازه/hash تأیید می‌شوند؛ hash قطعه‌ها به‌هم چسبانده نمی‌شود. فایل ناقص/اشتباه جای installer تأییدشده را نمی‌گیرد و اجرا نمی‌شود. فایل‌های کوچک مستقیم تک‌اتصال می‌مانند.
- مقایسهٔ زنده بدون توکن، با همان installer36 به اندازه36,785,885بایت و همان Client/شبکه: تک‌اتصال86.47ثانیه،3.40Mbps میانگین؛ موازی واقعاً Parallel،12.52ثانیه،23.51Mbps میانگین. SHA256 هر دو صحیح بود؛ حدود6.91برابر بهبود در این اجرا، نه تضمین همیشگی. اجرای مستقل production downloader نیز همین فایل را10.9ثانیه و با hash صحیح دریافت کرد.
- تست رفتاری React: blur بدون تغییر، blur+Save، صف IP سپس دامنه، حفظ هر دو مقدار، blurهای تکراری بعد از apply و خروج فوکوس از اپ پاس شدند؛ تست‌های قبلی پینگ/حفظ ساب نیز پاس‌اند.22تست Rust موفق،5تست شبکه/fixture پیش‌فرض ignored؛ تست هم‌زمانی Range، tail غیرهم‌اندازه، Range نادیده‌گرفته، header خراب، قطعهٔ ناقص/retry، و حفاظت SHA/installer قبلی پاس شدند. TypeScript پاس شد؛ Release build و نصب‌کننده37 موفق‌اند.
- نصب‌کنندهٔ نهایی: [SecureVPN-v2.0.37-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.37-Setup.exe>)، x64، **36,849,111 بایت**، حدود35.14MiB، SHA256 `A3F443DC2A11BF378CFE5C3306228E0C710D11F10C4C436B0348C28D6AAE39ED`.
- تصویر جدید نصب36 را تأیید می‌کند؛ روش نصب و دیدن نشان Update صریحاً تأیید نشده. دانلود خود37 از نسخهٔ نصب‌شده36 همچنان downloader قدیمی36 را استفاده می‌کند؛ دانلود موازی پس از نصب37 برای آپدیت‌های بعدی فعال است. طبق درخواست پیشین،37 اول روی GitHub منتشر می‌شود و قبل از آزمون نشان36 دستی نصب نمی‌شود.
- Android، core1.14.2-lx.11 و تنظیمات MTU/DNS اتصال اصلی تغییر نکردند؛ توکن/fixtureهای خصوصی و فایل‌های نامرتبط وارد Git نمی‌شوند.
- درخواست تکمیلی همین نسخه: دکمهٔ Check for Updates در پایین Sidebar همیشه در دسترس است؛ به‌جای بازکردن صفحهٔ Releases، metadata را با backend واقعی بررسی می‌کند. Checking، Up to date و خطا نمایش داده می‌شوند؛ با پیدا شدن نسخهٔ جدید، دکمه به Update تبدیل می‌شود. بررسی نصب خودکار انجام نمی‌دهد؛ نصب با کلیک بعدی کاربر است. دکمهٔ Settings/About همین مسیر را حفظ می‌کند و footer برای متن کامل دو ردیف دارد. تست رفتاری، بررسی دستی دوم پس از نبود آپدیت، قفل هنگام بررسی و نصب فقط با کلیک را تأیید کرد.
- مرجع semantics Range/206 و If-Range: [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-14)، [If-Range](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5).

- انتشار37 تکمیل شد: سورس `c2d3e76c3869f34c5eb1b5995f69034fd1889769` روی main پوش و tag v2.0.37 روی همان commit تأیید شد. [ریلیز عمومی37](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.37) و [installer](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.37/SecureVPN-v2.0.37-Setup.exe)، 36,849,111بایت، SHA256 `A3F443DC2A11BF378CFE5C3306228E0C710D11F10C4C436B0348C28D6AAE39ED`. فایل draft قبل از عمومی‌شدن دانلود مجدد و hash، سپس digest/اندازه/tag عمومی تأیید شدند. دکمهٔ Check for Updates هم در همان build نهایی37 است؛ React workflow و TypeScript بعد از افزودن آن مجدداً پاس شدند.
- آزمون خودکار کلیک Update در نسخهٔ نصب‌شده36 همچنان به دسترسی ابزار به اپ Administrator محدود است؛ نتیجهٔ ارتقای واقعی36به37 را تأیید نمی‌کنیم.37 دستی نصب نشده است؛ کاربر می‌تواند در36 از Settings/About > Check for Updates مسیر واقعی ارتقا را تست کند. دانلود موازی برای آپدیت‌های بعدی از37 فعال خواهد بود.

### Windows v2.0.36 — پینگ و حفظ ساب، 2026-10-06

- کاربر دانلود و نصب واقعی آپدیت35 و اتصال Hamed را تأیید کرد. تصویر جدید نسخهٔ نصب‌شده35 را نشان می‌دهد؛ دیگر وضعیت «هنوز34» جاری نیست.
- علت گیرکردن Test all: صفحه ساب انتخاب‌شده را فیلتر می‌کرد، اما provider همهٔ72پروفایل را تست می‌کرد. اکنون IDهای فهرست نمایان منتقل می‌شوند؛ All همچنان همه را تست می‌کند. پیشرفت done/total و Stop اضافه شدند؛ قفل فوری ref، دوبارکلیک/تست تکی هم‌زمان را مهار می‌کند.
- هر اجرا requestId مستقل دارد؛ event/جواب نهایی قدیمی بعد از Stop، Clear یا شروع اجرای جدید پذیرفته نمی‌شود. finally اجرای قبلی هم وضعیت اجرای تازه را پاک نمی‌کند. Cancel تا پایان توقف runner و حذف config خصوصی صبر می‌کند؛ kill_on_drop و مدیریت محدودهٔ پورت/پروفایل نامعتبر اضافه شدند.
- پینگ واقعی و زنده از مسیر مشترک latency.rs استفاده می‌کنند: gstatic، Cloudflare و Google به‌ترتیب جایگزین؛ TLS معتبر، بدون redirect، پاسخ کوچک حداکثر4KiB؛ درخواست نخست گرم می‌کند و درخواست دوم RTT کاربردی HTTP را می‌سنجد. هر درخواست3ثانیه و کل پروب9ثانیه مهلت دارد؛4کانفیگ هم‌زمان تست می‌شوند. این عدد ICMP نیست و الزاماً با مقصد آزمون سایر اپ‌ها مساوی نیست.
- تولید batch دیگر DNS هر پروفایل را در Rust سریالی resolve نمی‌کند؛ domain به core سپرده می‌شود. DNS مستقل1.1.1.1 و auto_detect_interface برای جلوگیری از استفادهٔ ناخواسته از VPN فعال در تست اضافه شدند. در تست شروع، detour به outbound direct خالی با خطای core رد شد؛ حذف آن و اتکا به auto_detect_interface شروع runner را اصلاح کرد. کانفیگ اتصال واقعی VPN/DNS/MTU و core1.14.2-lx.11 تغییر نکردند.
- پینگ زنده اولین بار خودکار اجرا می‌شود، دوره‌ای هم‌پوشانی ندارد؛ client با PID اتصال cache می‌شود و با تغییر PID/status درخواست قبلی فوراً لغو می‌شود. frontend هم generation اتصال/پروفایل دارد. Hysteria2 به پینگ زنده اضافه شد. API قدیمی server ping دیگر عدد ساختگی25ms نمی‌دهد؛ TCP واقعی می‌سنجد. OpenConnect در فهرست، TCP سرور را می‌سنجد و tooltip نوع آزمون را روشن می‌کند؛ این آزمون تأیید احراز هویت VPN نیست.
- صفحهٔ آخر با vpn-last-screen و ساب با vpn-selected-subscription ذخیره می‌شوند؛ ساب ذخیره‌شده فقط در صورت وجود پذیرفته می‌شود. بین تب‌ها و بعد از خروج/راه‌اندازی مجدد حفظ می‌شوند. storage-version همچنان1.0.6 است؛ پروفایل‌ها پاک نشده‌اند.
- دانلود updater به BufWriter1MiB تبدیل شد تا به‌ازای هر chunk نوشتن دیسک رخ ندهد؛ flush و sync قبل از SHA256/size/rename حفظ شدند. هیچ محدودکنندهٔ سرعت یا سیاست کاهش سرعت انتهای فایل در کد یافت نشد.
- آزمون محلی مسیر production:36MiB با chunkهای4KiB و انتهای غیرهم‌اندازهٔ بافر، در0.56ثانیه ذخیره/هش و پیشرفت کامل تأیید شد. دانلود عمومی installer35 با همین downloader در147.9ثانیه، هش/اندازهٔ صحیح؛ بازه‌ها1.69تا2.90Mbps، بازهٔ آخر2.10Mbps بود. افت اختصاصی انتهای دانلود در این اجرا بازتولید نشد؛ نرخ مسیر GitHub/CDN/شبکه متغیر است و این تغییر تضمین افزایش سرعت اینترنت نیست.
- آزمون زنده69کانفیگ در دو نوبت:44پاسخ معتبر،25عدم پاسخ در مهلت آزمون؛ زمان کل91.99ثانیه. چهار Hamed سالم111تا114ms پاسخ دادند؛ پنجم همچنان ناموفق بود و مشکل certificate/SNI ثبت‌شده در35 باقی است. با سه نمونهٔ ناموفق، پروب20ثانیه و DNS/IP قدیم/جدید مقایسه شد: Jup Finland S1 و Istanbul S1 در هر دو شکست خوردند؛ Armenia Yerevan در تکرار بعدی204 داد، پس نوسان شبکه نیز وجود دارد. ادعا نشده تمام timeoutها خرابی قطعی سرورند. Direct-To-Server طبق درخواست کاربر تست نشد.
- نصب‌کنندهٔ نهایی: [SecureVPN-v2.0.36-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.36-Setup.exe>)، x64، **36,785,885 بایت**، حدود35.08MiB. SHA256: `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`.
- دو OpenConnect هم TCP پاسخ دادند:218 و94ms.
- اعتبارسنجی نهایی:18تست Rust موفق،4آزمون شبکه/fixture پیش‌فرض ignored؛ TypeScript، React workflow و Release build موفق. تست React در سورس tests/ping-workflow.test.tsx، دستور npm run test:workflows؛ دامنهٔ ساب، Stop، جواب دیررس، کلیک تکراری، حفظ انتخاب با جابه‌جایی/راه‌اندازی و تغییر اتصال را بررسی می‌کند. react-test-renderer فقط devDependency است و داخل اپ بسته‌بندی نمی‌شود.
- ابتدا push و انتشار36 روی GitHub، سپس بررسی تشخیص Update در35؛ نسخهٔ جدید قبل از آن دستی نصب نمی‌شود. Android تغییر نکرده و فایل‌های خصوصی/توکن/fixture وارد Git نشده‌اند.

- انتشار36 تکمیل شد: سورس `057dd859b4158c8e1e160ceaf4e335be0b9d598b` روی main پوش و tag v2.0.36 روی همان commit تأیید شد. [ریلیز عمومی36](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.36) و [installer](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.36/SecureVPN-v2.0.36-Setup.exe)، 36,785,885بایت، SHA256 `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`. فایل draft قبل از عمومی‌شدن دانلود مجدد و hash، سپس digest/اندازه/tag عمومی تأیید شدند.
- بررسی UI بعد از انتشار: نسخهٔ نصب‌شده35 در Profiles/Sale باز است و هنوز Releases نشان می‌دهد؛ اجرای Administrator طبق پیام ابزار higher Windows integrity دسترسی به دکمه‌ها را محدود کرده است. از کاربر خواسته شد در35 Check for Updates را بزند. این آزمون تا دریافت پاسخ کاربر تأییدشده نیست؛36 دستی نصب نشده است.

### Windows v2.0.35 — 2026-10-06 — اصلاح Speedtest و Hamed

- VLESS encryption از لینک وارد مدل می‌شد ولی در JSON هسته جا می‌ماند؛ اکنون مقدار اصلی فعال به outbound منتقل می‌شود. هستهٔ قبلی 1.14.0-lx.15 این فیلد را رد می‌کند؛ هستهٔ رسمی pinned1.14.2-lx.11 با checksum تأییدشده جایگزین شد.
- WebSocket/HTTPUpgrade اکنون فقط ALPN `http/1.1` دارند؛ قبول‌کردن لیست `h2,http/1.1,h3` باعث انتخاب HTTP/2 و قطع WebSocket می‌شد. TLS و اعتبارسنجی گواهی حفظ می‌شوند.
- Speedtest نسخهٔ Store در SYN_SENT به پراکسی localhost اپ گیر می‌کرد. برای اتصال TUN دیگر system proxy روشن نمی‌شود. پاک‌سازی endpoint/override خود اپ با WinINet per-connection API و اعلان95/39/37 انجام می‌شود؛ PAC/AutoDetect و پراکسی دیگر برنامه‌ها حفظ می‌شوند. پاک‌کردن صرف registry کافی نبود. با API رسمی و اجرای تازهٔ Speedtest، تست کامل Ping207ms، Download53.91Mbps، Upload9.94Mbps موفق شد؛ MTU1400 ثابت ماند. harness همان ماژول تولیدی، پاک‌سازی legacy app proxy و حفظ AutoDetect را تأیید کرد.
- آزمون خروجی اصلاح‌شده: چهار Hamed از پنج لینک، HTTPS204 و دانلود64KB200 موفق؛ لینک پنجم، خطای گواهی hl.dimdata.org در برابر SNI de.sadraguard.ir دارد و بررسی TLS غیرفعال نشده است.
- رگرسیون هسته: سه XHTTP از GozarVPN/Sale نیز HTTPS204/دانلود200 موفق؛14تست Rust، TypeScript و بیلد Release پاس شدند. نصب‌کننده2.0.35،36,827,328بایت، SHA256 `EF38A372368614DF7530CFD19E91CC83AB46F07A2C46F29FF64725889757D25D`. افزایش حجم نسبت به34 از هستهٔ جدید است؛ DLL اختیاری Cronet بسته‌بندی نشده. انتشار پیش از آزمون نشان آپدیت از2.0.34 انجام می‌شود؛ هیچ نصب دستی نسخهٔ35 تا این مرحله انجام نشده است.
- [ریلیز عمومی35](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.35) پس از push سورس b1fc54c، آپلود/download/hash و تطبیق tag منتشر شد. storage72پروفایل و تنظیمات/اشتراک‌ها قبل/بعد دقیقاً یکسان‌اند. UI نسخهٔ نصب‌شده34 با higher Windows integrity محدود است؛ از کاربر خواسته شد Check for Updates و نصب از نشان را اجرا کند. تأیید بعدی کاربر در۶اکتبر: دانلود/نصب35 موفق بود و تصویر UI نسخه35 را نشان داد.

### Windows v2.0.34 — 2026-10-04 — آپدیت داخل برنامه و نصب با حفظ تنظیمات

- بررسی عمومی GitHub در شروع، هر۶ساعت، focus با throttle و دستی در Settings؛ SemVer و asset رسمی Windows، درصد دانلود، SHA256/اندازه/HTTPS، حذف part خراب و جلوگیری از نصب همزمان پیاده شدند. پس از تأیید دانلود، VPN قطع، نصب‌کنندهٔ تعاملی /UPDATE اجرا و اپ بسته می‌شود. توکن انتشار وارد برنامه نشده و نسخهٔ Android تغییر نکرد.
- قالب رسمی NSIS CLI2.11.4 سفارشی شد: Update/Reinstall پیش‌فرض و حفظ تنظیمات؛ Clean Install انتخاب جدا با هشدار فارسی/انگلیسی، حذف فقط داده‌های identifier همین کاربر پس از توقف اپ؛ silent/passive حفظ داده و downgrade مسدود. دانلود در Temp خارج از AppData است تا پاک‌سازی Clean با installer در حال اجرا تداخل نکند. راهنمای نگهداری/انتشار در installer/README.md.
- Release/NSIS و typecheck نهایی موفق؛۱۲ تست Rust + یک integration واقعیِ دانلود/تأیید فایل عمومی2.0.32 + شش سناریوی NSIS روی دادهٔ disposable موفق. UI با API ساختگی (نشان، نبود آپدیت، درصد، disabled، retry، خطای چک دستی) تأیید شد. نصب کامل روی Program Files هنوز تست نشده؛ دادهٔ واقعی کاربر برای Clean پاک نشد.
- نصب‌کنندهٔ SecureVPN-v2.0.34-Setup.exe،30,339,736بایت، ProductVersion2.0.34؛ SHA256 `BC4B501E084CFF4DE8DC2C86F2273709FB46256E2D0425BA94563BF00AB1B326`. پس از تحویل محلی و درخواست انتشار، سورس روی main پوش و [ریلیز عمومی GitHub2.0.34](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.34) با tag روی کامیت `bbd3de728ae069c1dbd0a8a381640aa740f51024` منتشر شد. آپلود با دانلود مجدد/hash تأیید و digest موردنیاز کلاینت آپدیت موجود است. جزئیات محدودیت‌ها، چالش‌ها و گزارش‌ها در ChatGPT ChangeLOG.md.

### Windows v2.0.33 — 2026-10-04 — اجرای تک‌نمونه و بازگرداندن پنجره

- single-instance رسمی Tauri پیش از سایر pluginها ثبت شد؛ اجرای دوم پنجرهٔ قبلی را نمایش/restore/focus می‌کند و setup/پاک‌کردن proxy دوباره اجرا نمی‌شوند. رفتار نمایش پنجره برای Tray مشترک شد؛ شناسه ثابت و پروفایل‌ها/منطق اتصال تغییر نکردند.
- نسخه2.0.33؛ Release/NSIS و typecheck موفق،۷ تست Rust موفق و۲ ignored. single-instance2.4.5 به lock اضافه و Tauri موجود حفظ شد. نصب‌کنندهٔ محلی SecureVPN-v2.0.33-Setup.exe آماده است،30,282,746بایت؛ SHA256 در ChatGPT ChangeLOG.md.
- آزمون UI هنوز تأیید نشده: ابزار launch به نسخهٔ نصب‌شده32 هدایت شد و سطح Administrator جلوی کنترل پنجره را گرفت. از کاربر بستن32/تست شخصی خواسته شد. قبل از نصب و اجرای33، نسخهٔ32 باید کاملاً بسته شود؛ ریلیز GitHub این مرحله هنوز منتشر نشده است.

### Windows v2.0.32 — 2026-10-03 — ترتیب سابسکریپشن و برچسب رنگی

- سورس به main پوش و [ریلیز عمومی v2.0.32](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.32) با نصب‌کنندهٔ تأییدشده منتشر شد؛ SHA256 آپلود با دانلود مجدد برابر فایل محلی است. توکن جدید با اجازهٔ کاربر در فایل خصوصی مرکزی به‌روز شد؛ مسیر و روش برای Antigravity در GITHUB_PUBLISH.md ثبت‌اند و مقدار توکن وارد Git نشد.
- All Profiles در Profiles و فهرست انتخاب Connection با utility مشترک به ترتیب تب‌های سابسکریپشن مرتب شدند؛ ترتیب داخلی گروه ثابت و دستی‌ها در انتها هستند. نام سابسکریپشن با برچسب رنگی یکسان در دو صفحه، انتخاب بسته و توضیح اتصال نشان داده می‌شود.
- برای برچسب رنگی، select بومی به ProfilePicker با listbox قابل اسکرول و پشتیبانی کیبورد، Escape/Tab و کلیک بیرون تبدیل شد. sort فقط روی کپی است؛ پروفایل ذخیره‌شده و منطق شبکه تغییر نکردند. نسخه2.0.32؛ typecheck، بررسی تعاملی React با۳۰ کانفیگ ساختگی در تم روشن/تیره و Release/NSIS موفق. نصب‌کنندهٔ SecureVPN-v2.0.32-Setup.exe در ریشه ذخیره شد،30,267,577بایت. نصب اپ واقعی برای تست کاربر باقی است؛ جزئیات/SHA256 در ChatGPT ChangeLOG.md.

### Windows v2.0.31 — 2026-10-03 — GozarVPN/Sale، تحویل نهایی

- طبق درخواست کاربر، Windows/Tauri بررسی و اصلاح شد؛ Android و Electron قدیمی تغییر نکردند. از داده‌های۵۹ پروفایل بکاپ خصوصی گرفته شد؛۳۶ مورد GozarVPN/Sale آزمایش شدند و Direct-To-Server کنار گذاشته شد.
- فایل واقعی اتصال به‌علت تبدیل دامنهٔ fallback DNS به CIDR نامعتبر رد می‌شد. تولید CIDR فقط برای IP معتبر، rule دامنهٔ مستقل، timeout lookup، core check پیش از اجرا، نمایش FATAL و cleanup خطای setup اصلاح شدند.
- parser/export پارامتر extra و mode اصلی XHTTP را حفظ می‌کنند؛ padding صریح به schema هسته منتقل و اعتبارسنجی می‌شود. خطاهای TypeScript قدیمی نیز رفع شدند. هسته/MTU و mode پیش‌فرض تغییر نکردند.
- نتیجه:۷ تست Rust موفق، صفر شکست، دو ignored؛ typecheck و round-trip parser موفق؛۳۶ config معتبر،۷۲ درخواست پراکسی نهایی موفق، **۳۶ تونل واقعی با۷۲ درخواست و۳۶ قطع کامل موفق**. تست CLI شبکه است؛ رابط React/IPC و نصب ارتقایی هنوز توسط کاربر تست می‌شوند.
- نصب‌کنندهٔ SecureVPN-v2.0.31-Setup.exe ساخته و در ریشهٔ پروژه ذخیره شد. پس از نصب، refresh اشتراک‌های GozarVPN/Sale برای بازیابی extra قدیمی لازم است. تغییرات/چالش‌ها در ChatGPT ChangeLOG.md و جزئیات آزمون در WINDOWS_TEST_REPORT.md ثبت شدند.

### Android v1.3.65 — 2026-10-03 — Smart/manual، encryption و فرم‌های کوچک‌تر

- گزینهٔ **Edit Profile > Stream Settings > XHTTP mode > Smart** کنار انتخاب‌های دستی **auto / stream-up / packet-up / stream-one** و Follow app setting اضافه شد. انتخاب دستی بر Force عمومی اولویت دارد؛ Smart فقط برای XHTTP/splithttp است. پیش‌فرض Force عمومی طبق درخواست قبلی روشن ماند؛ Smart باید برای پروفایل مورد نظر انتخاب شود.
- Smart قبل از ایجاد TUN، HTTPS واقعی را از پراکسی موقت همان کانفیگ بررسی می‌کند؛ نخست آخرین mode موفق، سپس mode اصلی اشتراک و باقی حالت‌ها، بدون تکرار و حداکثر چهار حالت. دو مقصد generate_204 جایگزین‌اند؛ موفقیت200/204 برای عبور آزمون کافی است. بودجه45ثانیه است و خروج از درخواست مسدودشده ممکن است تا timeout محدود socket/cleanup طول بکشد؛ این عدد hard deadline نیست. mode موفق در v2raySmartXhttpMode ذخیره و روی کارت نمایش داده می‌شود. در هر اتصال دوباره بررسی می‌شود؛ خاموش‌شدن اینترنت پس از اتصال باعث تعویض خودکار mode در این نسخه نمی‌شود.
- کلیدها، VLESS encryption، TLS/REALITY، بررسی گواهی و extra در تمام تلاش‌ها ثابت‌اند. refresh همان endpoint، انتخاب Smart/دستی را حفظ می‌کند؛ تغییر مشخصات اتصال/احراز هویت cache mode موفق را حذف می‌کند. لغو بررسی، تغییر/حذف پروفایل و خروج از ViewModel، کار را متوقف می‌کنند؛ generation guard جلوی شروع دیرهنگام VPN را می‌گیرد. در صورت روشن‌بودن VPN دیگر، Smart به‌جای تست از مسیر نامعلوم خطا می‌دهد. شکست Smart به ERROR می‌رسد و VPN ساخته نمی‌شود؛ این بررسی همهٔ مقصدها یا همهٔ پروتکل‌ها را تضمین نمی‌کند.
- فرم Add/Edit و Settings کوچک‌تر شدند: متن اصلی14sp، متن متوسط13sp، توضیحات12sp و عنوان22sp؛ مقیاس فونت سیستم و اندازهٔ هدف لمس حفظ شد. فونت صفحهٔ اصلی تغییر نکرد.
- علت واقعی Hamed، نادیده‌گرفتن VLESS encryption بود. در64 مدل/parser/Repository/editor/generator اضافه شد، اما تست Release گوشی نشان داد مقدار تازه در Intent بین MainActivity و VpnConnectionService جا می‌ماند. در65 EXTRA_VLESS_ENCRYPTION در دو طرف اضافه شد؛64 مرحلهٔ میانی است و برای تحویل نهایی نیست. روی گوشی هر چهار پروفایل با تطبیق UUID/سرور از لینک اصلی اصلاح شده‌اند؛ روی دستگاهی که قبلاً اطلاعات را ناقص وارد کرده، refresh همان اشتراک پس از نصب لازم است.
- **اصلاح برداشت قبلی:** آزمون‌های مستقل قبلی حامد هم از مدل ناقص ساخته شده و encryption نداشتند؛ شکست آن‌ها خرابی سرور را ثابت نمی‌کرد. با کانفیگ کامل، دو هسته24/24 درخواست موفق دادند. در65 گوشی هر چهار Hamed، Ping109..139ms، Public IP و هشت درخواست GeoIP/دانلود200 داشتند؛ در JSON واقعی هسته نیز encryption دقیقاً برابر مقدار ذخیره‌شده است و هر چهار قطع کامل شدند. MTU و باینری هسته برای این اصلاح تغییر نکردند.
- **۲۸ تست JVM بدون شکست/خطا**؛ Release minified ساخته و با دادهٔ قبلی روی گوشی نصب شد. آزمون UI، Follow app setting/auto/Smart/packet-up و نگهداری encryption در clipboard/editor را تأیید کرد. تست نهایی US با mode اولیهٔ ناسازگار stream-up، پیش از شروع VPN به **packet-up** رسید و همان mode ذخیره‌شده در خروجی واقعی هسته بود؛ GeoIP و دانلود200، Ping[202ms] و قطع کامل داشت. در تلاش قبل‌تر auto عبور کرده بود ولی cleanup ابزار خطا داشت؛ آن اجرای ناقص به‌عنوان تست نهایی شمرده نشد. این تغییر انتخاب با وضعیت واقعی درخواست‌ها سازگار است، نه وعدهٔ یک mode ثابت برای همهٔ شبکه‌ها. لغو Smart و نبود VPN دیرهنگام پس از10ثانیه موفق شد.
- پینگ نهایی **43 مورد، 43 پاسخ و 0 شکست**؛ Direct-To-Server طبق درخواست کاربر تست نشد. TLS پینگ SSTP/OpenConnect تأیید احراز هویت نیست. نتایج اتصال/درخواست جداگانه در ANDROID_PHONE_TEST.md ثبت شده‌اند؛ timeoutهای مقطعی s1، از جمله دانلود US در تلاش اول و FR در اجرای نهایی65، همچنان محدودیت‌اند؛ پینگ/GeoIP موفق همهٔ دانلودها را تضمین نمی‌کند. Connected در اتصال دستی همچنان شروع هسته/TUN است؛ Smart قبل از آن یک آزمون ترافیک دارد، نه تضمین عملکرد تمام اپ‌ها.
- یک assertion اولیهٔ ابزار تست از برچسب قدیمی Smart در یک frame گذار نتیجهٔ غلط گرفت. بررسی ابزار به مقدار تأییدشده/ذخیره‌شده پیش از VPN تغییر کرد. cleanup بعدی دوباره روی دکمهٔ stale کلیک کرد و خطا داد؛ ابزار به ارسال یک درخواست قطع، انتظار بسته‌شدن VPN و restore در finally مستقل تغییر کرد. تنظیم موقت باقی‌مانده با بررسی همان44ID از backup پیش از65 برگردانده و سناریوها تکرار شدند. فایل‌های ui-race-invalid و cleanup-invalid به‌عنوان تست نهایی شمارش نشدند؛ موفقیت درخواست‌ها در آن‌ها به‌تنهایی موفقیت cleanup نیست. APK اصلی در اصلاح ابزار تغییر نکرد.
- restoreProfileByName اکنون ابتدا پروفایل انتخاب‌شدهٔ فعلی با همان نام را نگه می‌دارد تا نام تکراری بی‌جهت انتخاب را عوض نکند؛ fallback هنوز با name است و انتقال هویت سرویس با ID به‌طور کامل پیاده نشده است.
- پایان: همان44ID، انتخاب قبلی و تنظیمات حفظ شدند؛ تفاوت با backup پیش از65 صرفاً هیچ فیلدی بود. تست‌ها تنظیم Smart آزمایشی را بازگرداندند؛ پنج s1 همچنان auto · Custom هستند. VPN فعال نیست. این مقایسهٔ backup پیش از65 است؛ اصلاح encryption چهار حامد پیش از این backup انجام شده بود.
- APK قابل ارتقا: SecureVPN-v1.3.65.apk، arm64-v8a، **35,896,236 بایت**، حدود 34.23MiB؛ افزایش 6,584بایت نسبت به63. SHA256: `95B1CA22905BA7B207F4CF367B1CE8F97654CB7B66DBB5FD515274F629F92E04`. گواهی قبلی با SHA256 `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` حفظ شد. ویندوز تغییر نکرد.

شواهد محلی: scratch/xhttp-server-check/build-1.3.65.log، phone-1.3.65-*.json، named-hamed-encryption-results.json. لینک/کلید/backup با پسوندprivate در گزارش عمومی درج نشده‌اند.

### Android v1.3.64 — 2026-10-03 — حفظ VLESS encryption

- مقایسهٔ دقیق لینک Hamed در اپ مرجع علت واقعی را مشخص کرد: encryption=mlkem768x25519plus در parser اپ نادیده گرفته می‌شد. تست‌های قبلی مستقل نیز همین پارامتر را جا انداخته بودند؛ شکست آن‌ها ایراد سرور/اکانت را ثابت نمی‌کرد. با انتقال مقدار اصلی encryption، هر چهار Hamed در دو هسته24/24 درخواست HTTP/HTTPS/دانلود موفق دادند.
- فیلد مستقل vlessEncryption به مدل، import VLESS، ذخیره‌سازی، فرم افزودن/ویرایش و generator هسته اضافه شد؛ از TLS/REALITY و security در VMess جدا است. none یا مقدار غایب رفتار قبلی دارد؛ رشتهٔ فعال بدون حذف بخش‌ها به هسته داده می‌شود. هستهٔ فعلی پشتیبانی دارد و باینری آن تغییر نکرد.
- نسخه194/1.3.64 در Gradle ثبت شد؛ ساخت/تست گوشی و تحویل در حال انجام است. برای پروفایل‌های قدیمی که مقدار در آن‌ها از دست رفته، یک refresh اشتراک لازم است؛ کلید از hostname یا UUID قابل بازسازی نیست.

### Android v1.3.63 — 2026-10-02 — بررسی روی گوشی واقعی

- پیگیری 2026-10-03 پس از گزارش نام‌دار کاربر: Hamed چهار WS/TLS روی2053 با SNI یکسان دارد؛ پس از HTTP101 معتبر، هر چهار endpoint به درخواست VLESS همان UUID، frame Close1000 بدون داده/علت می‌دهند. WebSocket کنترل سالم HTTP204 داد؛ هم sing-box و هم Xray با حامد شکست خوردند. علت دقیق backend/حساب نیاز به لاگ سرور دارد؛ Connected فعلی فقط شروع هسته/TUN را تأیید می‌کند، نه اینترنت.
- US-reza مستقیم HetznerSale، s1/path `/us` با auto در دو هسته و دو fingerprint،12/12 درخواست HTTP/HTTPS/دانلود موفق داشت؛ stream-up در دو هسته0/6 و timeout. روی گوشی auto، Ping198ms، IPUS و Geo/دانلود200؛ US Tun با stream-up، Ping220ms، همان IPUS و دو درخواست200. مقایسهٔ تنظیمات، نتایج/محدودیت‌ها و فایل‌های شواهد در ChatGPT ChangeLOG ثبت شدند؛ سورس اصلی/نسخه/MTU در این پیگیری تغییر نکرد و timeoutهای مقطعی قبلی همچنان محدودیت‌اند.

- گوشی متصل کاربر با44پروفایل بررسی شد. تست فهرست SSTP اشتباهاً به sing-box می‌رفت و Unsupported protocol می‌داد؛ dispatch برای SSTP/OpenConnect به تست TLS اختصاصی اصلاح شد. این عدد TLS reachability است، نه موفقیت احراز هویت/تونل.
- تست TLS اکنون skipCertificateVerification پروفایل را رعایت می‌کند؛ در حالت اعتبارسنجی، chain و hostname بررسی می‌شوند. socketها در موفقیت/شکست بسته می‌شوند، timeout اتصال/read چهار ثانیه و fallback آدرس‌ها با ترجیح IPv4 دارد؛ زمان monotonic است.
- نسخه193/1.3.63 در Gradle و fallback UI ثبت، Release ساخته و روی گوشی با حفظ داده نصب شد؛ ویندوز تغییر نکرد. تحویل نهایی2026-10-03: SecureVPN-v1.3.63.apk، arm64،35,889,652بایت، SHA256: F7B91054CD7CE453F840411BDF263F368134CAA662D80FC38426F45DE594CBE8. افزایش نسبت به62 فقط2008بایت است؛ امضای قبلی حفظ شد.
- کانفیگ SSTP گوشی آدرس تایپی sstp.rahanetmi.com داشت؛ خطای واقعی2.2ثانیه‌ای روی گوشی بازتولید و آدرس به sstp.rahanetmci.com اصلاح شد. تنظیمات/پروفایل‌ها پیش از تست در فایل خصوصی بکاپ شدند.
- نتیجهٔ گوشی: SSTP پس از اصلاح آدرس در5.6ثانیه وصل شد، ping260ms، GeoIP و دانلود200 و قطع کامل. همه44پینگ اجرا شدند:33موفق و11ناموفق شامل باگ tester SSTP. ده مورد دیگر هم با TUN واقعی بررسی شدند؛ چهارWS connection closed، پنجXHTTP s1 timeout و localhost51829 connection refused.
- روی s1، stream-up اجباری شکست ولی همان پروفایل با mode اصلیauto GeoIP/دانلود200 و Public IP صحیح داد. تنظیم XHTTP mode برای هر پروفایل، اولویت override برforce عمومی، نشان Custom و حفظ override هنگام refresh اشتراک با تطبیق endpoint اضافه شد؛ پیش‌فرض ایمپورت‌ها همچنان force stream-up است. پنج پروفایل s1 گوشی روی auto · Custom تنظیم شدند.
- نهایی:24تست JVM بدون شکست/خطا و تست UI auto→Follow app setting→auto موفق.43پینگ با حذف Direct-To-Server طبق درخواست کاربر:39پاسخ و4شکست WS. SSTP/OpenConnect/فرانسه stream-up در گوشی Ping/Public IP و GeoIP/دانلود200 و قطع کامل داشتند. همهs1 خروجی واقعیauto؛ در بعضی درخواست‌ها timeout مقطعی باقی است، به‌ویژه NL با وجود Ping123ms/Public IP. موفقیت پینگ به معنی احراز هویت تمام تونل‌ها نیست.
- چهار Mo-Ebrahimi با وجود TCP/TLS/WS101، HTTPS از تونل connection closed دارند؛ Xray مستقل و یک تست بدون fingerprint نیز موفق نشدند. علت قطعی حساب/سرور ثابت نشده و رفع‌شده محسوب نمی‌شوند. MTU یا هسته بر اساس حدس تغییر نکرد.
- مقایسهٔ backup خصوصی:44ID و انتخاب قبلی حفظ شدند؛ تغییرات تنها آدرس صحیح SSTP و mode/override پنجs1 هستند. Force با مقدار مؤثرtrue ثابت ماند. ابزار تست یک نتیجهٔ NL را زود ثبت کرده بود؛ helper اصلاح و نتیجه معتبر اتصال همراه timeout ثبت شد. پایان تست VPN فعال نبود. جزئیات نهایی در ChatGPT ChangeLOG.md و ANDROID_PHONE_TEST.md.

### Android v1.3.62 — 2026-10-02 — Force XHTTP stream-up

- طبق درخواست کاربر، سیاست پیش‌فرض روشن Force XHTTP stream-up برای پروفایل‌های فعلی، ایمپورت clipboard/دستی و افزودن/refresh سابسکریپشن اضافه شد؛ xhttp و splithttp پوشش داده می‌شوند.
- گزینهٔ Settings > XHTTP > Force XHTTP stream-up و برچسب stream-up · Forced روی کارت پروفایل اضافه شدند. تغییر روی VPN فعال در اتصال بعدی اعمال می‌شود.
- mode اصلی در v2rayOriginalXhttpMode ذخیره می‌شود و با خاموش کردن گزینه برمی‌گردد؛ raw extra و مشخصات سرور/TLS دست‌نخورده باقی می‌مانند. پروفایل‌های غیر XHTTP تغییر نمی‌کنند.
- versionCode به 192 و versionName/fallback UI به 1.3.62 افزایش یافت. ۲۲ تست JVM موفق شدند؛ Release با امضای قبلی ساخته و روی شبیه‌ساز نصب شد. APK arm64: SecureVPN-v1.3.62.apk، حجم35,887,644بایت، SHA256: 9A3C3FA9C68D09FD747AF6CFB765C5C080F9F4897E8702BF765260873981B370. ویندوز تغییر نکرد.
- بررسی جدید OpenConnect: در 1.3.61 اتصال واقعی برقرار شد ولی UID اپ عمداً خارج VPN بود؛ Ping/Public IP خالی ماندند. حذف exclusion اجباری خود اپ، اعمال split-tunnel کاربر، buffer/TCP_NODELAY روی FD duplicate در Native و ذخیرهٔ پایدار این تنظیمات اضافه شدند. MTU واقعی به حداقل requested/negotiated تغییر کرد و پس از establish به UI اعلام می‌شود.
- SSTP: اصلاح بیت C در wire header و parser، Crypto Binding استاندارد SHA1/SHA256 برای PAP با nonce/certificate/CMAC، انتظار ACK دوطرفهٔ LCP/IPCP، درخواست DNS و MTU، بستن فوری socket و hostname verification در حالت certificate validation اضافه شدند. سرور تست PAP درخواست می‌کند؛ پشتیبانی MS-CHAPv2 اضافه نشده است. تست بردارهای رسمی Microsoft و تست اتصال واقعی در حال انجام‌اند.
- فرم Add/Edit با imePadding و adjustResize برای اسکرول فیلد Password بالای کیبورد اصلاح شد؛ آزمون واقعی OpenConnect/SSTP پایین فیلد و بالای IME را1517px نشان داد و موفق شد.
- تست reconnect ایراد EPERM در explicit binding به netId قبلی VPN را بازتولید کرد. probe پروتکل‌های غیر sing-box اکنون از socket پیش‌فرض UID داخل VPN، DNS همان شبکه، کنترل هویت شبکه قبل/بعد اتصال و IPv4-first/fallback استفاده می‌کند. سه reconnect Native با ping=103..104ms، Public IP درست و قطع کامل تأیید شدند.
- SSTP روی سرور اصلاح‌شدهٔ آدرس کاربر سه بار وصل و قطع شد؛ هر بار GeoIP/دانلود/آپلود واقعی HTTP200 داشت، ping=227..261ms و MTU واقعی/نمایش1360 برابر بود. NoDelay/Buffer در Native syscallهای موفق داشتند؛ اندازهٔ مؤثر kernel اندازه‌گیری نشده است.
- انتقال initialProtocol از انتخاب افزودن به فرم، MTU request در Java OpenConnect و حذف لاگ cookie/body احراز هویت نیز اصلاح شدند. حالت SSTP فعلی PAP است؛ آزمون بردارهای SHA1/SHA256 رسمی Microsoft پاس شد.
- تست مستقل Native با MTU1200، buffer1MB، NoDelay=false، DisableDTLS=true و BypassLAN=true موفق شد؛ syscall TCP_NODELAY=0، MTU واقعی/نمایش1200، probe/Geo/download/upload و قطع کامل تأیید شدند. تست UI سیاست XHTTP مهاجرت۴۹پروفایل، clipboard، restore mode/extra و روشن‌کردن مجدد را تأیید کرد.
- تست نهایی Release: سه reconnect فرانسه و سه سوئیس با input auto و generated stream-up موفق؛ پینگ108..116ms، Public IP صحیح، MTU1400، ۳۰HTTP200 و قطع app/اعلان362..491ms بدون VPN/worker باقی‌مانده. آپلود512KB فرانسه4.72..5.08 و سوئیس4.59..5.03Mbps بود.
- بررسی YouTube فرانسه: سایت200، اپ/جست‌وجو قابل دسترس؛ صفحهٔ ویدیو در اجرای تازه پیام Sign in to confirm you’re not a bot داد. پخش موفق تأیید نشد و علت گزارش گوشی قطعی نیست؛ تغییر حدسی MTU/QUIC اعمال نشد. تنظیمات تست restore و اپ قطع‌شده باز شد. گزارش کامل در ChatGPT ChangeLOG.md به‌روز شد.

### آزمون Android Release روی شبیه‌ساز — 2026-10-02 — بدون تغییر APK اصلی

- با اجازهٔ صریح تازهٔ کاربر، AVD موجود اجرا و Release x86_64 1.3.61 با حفظ داده روی 1.3.58 نصب شد. سابسکریپشن فعلی با نام Raha-XHTTP-Test از UI اپ وارد شد: ۲۶ پروفایل، extra حفظ‌شده، پروفایل‌های قبلی باقی ماندند.
- ReleaseServerDiagnosticsInstrumentation و ثبت آن در androidTest اضافه شدند؛ APK تست ساخته شد و APK اصلی/شمارهٔ نسخه تغییر نکردند. ۱۴ سناریو و ۱۸ اتصال/قطع موفق روی France و Switzerland انجام شد؛ هر ۹۰ درخواست HTTPS مستقیم از TUN پاسخ 200 داشت. پینگ/IP هر سه reconnect پایه برگشتند.
- MTU واقعی 1280/1360/1400/1500 از LinkProperties و mode از config هسته تأیید شدند. پس از همهٔ قطع‌ها VPN network و worker باقی نماند؛ قطع 442..814ms و پینگ 108..142ms بود. دو مورد از اکشن واقعی اعلان با PendingIntent انجام شدند.
- stream-up در هر شش مقایسهٔ MTU بهتر بود: آپلود سرد 512KB در auto حدود 1.17..1.69Mbps و stream-up حدود 3.75..5.18Mbps. کندی کامل Instagram روی گوشی، QUIC/UDP و Doze با این آزمون‌ها تأیید نشده‌اند.
- خطاهای اولیهٔ wrapper/پانل اعلان به ابزار تست مربوط بودند و از شمارش نتایج معتبر کنار گذاشته شدند. ایراد مستقل بازیابی پروفایل با name تکراری در سورس شناسایی شد؛ برای اصلاح بعدی باید profile.id در status منتقل شود. این مشکل در اپ اصلی هنوز اصلاح نشده است.
- تنظیمات موقت تست restore شدند و اشتراک تازه در شبیه‌ساز باقی است. android-summary.json و گزارش جامع ChatGPT ChangeLOG.md به‌روز شدند؛ کلاینت Windows تغییر نکرده است.

### تست XHTTP و گزارش تحویل ChatGPT — 2026-10-02 — بدون تغییر نسخهٔ اپ

- سابسکریپشن کاربر با ۲۶ پروفایل دریافت شد. سوئیس و فرانسه با CLI رسمی هم‌نسخهٔ libbox 1.14.2-lx.11، Xray رسمی 26.3.27 و حالت stream-up در دو دور مقایسه شدند؛ TUN/MTU و تنظیمات VPN ویندوز وارد تست نشدند.
- هر ۲۰۴ درخواست در ۱۲ نشست کامل موفق بود. میانهٔ آپلود گرم auto هستهٔ اپ حدود 3.00..3.36Mbps و stream-up حدود 9.64..9.68Mbps بود. source pinned انتظار متوالی پاسخ POST در packet-up را نشان می‌دهد؛ بهبود responsiveness کامل Instagram روی گوشی همچنان تأیید نشده است.
- در core فعلی حذف MTU در Android مقدار ثابت 9000 انتخاب می‌کند، نه adaptive MTU. سورس، شمارهٔ نسخه و پیش‌فرض عمومی auto/MTU تغییر نکردند و APK تازه‌ای ساخته نشد.
- دو لینک آزمایشی با حفظ پارامترهای اصلی و mode=stream-up در XHTTP-Switzerland-France-stream-up-test.txt ساخته شدند. اجرای شبیه‌ساز به‌علت لغو قبلی از سوی بررسی خودکار مجوز رد شد؛ افزودن اشتراک در اپ Android انجام نشده است.
- گزارش کامل تغییرات این همکاری از پایهٔ 1.3.55 تا 1.3.61، چالش‌ها، راه‌حل‌ها، رگرسیون‌ها، تست‌ها، فایل‌ها و کارهای باقی‌مانده در [ChatGPT ChangeLOG.md](<H:/Antigravity Projects/VPN APP/ChatGPT ChangeLOG.md>) ثبت شد. دادهٔ خام تست در scratch/xhttp-server-check است؛ داده‌های اتصال private به گزارش عمومی منتقل نشوند.

### Android v1.3.61 — 2026-10-02

- رفع رگرسیون شروع اپ در 1.3.60: پاسخ DISCONNECTED سرویس idle به‌دلیل وجود هر شبکهٔ VPN دستگاه به Disconnecting تبدیل می‌شد. این شرط عمومی حذف شد؛ وضعیت VPNهای دیگر وارد تشخیص وضعیت SecureVPN نمی‌شود.
- تأیید پایان قطع فقط برای closed_worker_pid همان پردازش انجام می‌شود. پاسخ idle بدون PID مستقیم به Disconnected می‌رود؛ انتظار PID محدود به ۶ ثانیه است و عدم تأیید خطا می‌دهد، نه حلقهٔ نامحدود.
- نسخهٔ Android به 1.3.61 / versionCode 191 افزایش یافت. سه تست رگرسیون پاسخ idle، خروج پردازش و مهلت انتظار موفق شدند؛ مجموع ۱۴ تست JVM بدون شکست هستند. بررسی روی گوشی/شبیه‌ساز در این نوبت انجام نشده است.
- Release ساخته و امضای قبلی تأیید شد. SecureVPN-v1.3.61.apk دارای ABI arm64-v8a و حجم 35,882,004 بایت است؛ SHA256: D45C778211DA3A1FE48E52ADF3B311906AC5E65EBAF5D649885501E2C0184C21.

### Android v1.3.60 — 2026-10-02

- رفع توقف نامحدود Disconnecting: سرویس VPN در پردازش اختصاصی اجرا می‌شود؛ پایان اتصال به onDestroy وابسته نیست و مهلت مستقل توقف، در صورت گیرکردن native، فقط پردازش VPN را می‌بندد تا همهٔ descriptorها واقعاً آزاد شوند.
- اطلاعات probe از پیام وضعیت همان اپ منتقل می‌شود؛ وضعیت رابط کاربری برای قطع، نبود شبکهٔ VPN در Android را بررسی می‌کند. تنظیمات مسیر با مقادیر Intent اعمال می‌شوند تا کش Preferences بین دو پردازش باعث برگشت تنظیمات نشود.
- هستهٔ قدیمی 1.14.0-lx.21 به نسخهٔ همان پروژه 1.14.2-lx.11 ارتقا یافت تا پشتیبانی XMUX / استفادهٔ مجدد از اتصال‌ها و اصلاحات deadlineهای XHTTP وارد اپ شوند. هش AAR با digest منتشرشدهٔ GitHub تطبیق داده شده است؛ منبع در app/libs/libbox-provenance.json ثبت است.
- اعلان‌های بدون تغییر رابط فیزیکی به هسته ارسال نمی‌شوند؛ مکث افزودهٔ ارسال packet-up از ۳۰ به ۱ میلی‌ثانیه کاهش یافت و مقدار صریح لینک مقدم است. extraهای اتصال شامل pacing، headers، padding، placement و XMUX از import تا تنظیمات هسته حفظ می‌شوند. MTU خودکار تغییر نمی‌کند.
- نسخهٔ Android به 1.3.60 / versionCode 190 افزایش یافت. ۱۱ تست JVM شامل cleanup مسدود، پایان عادی، dedup شبکه، import options و probe/routing موفق شدند. Release و APK تست ساخته شدند؛ ابزار متناظر همان هسته نیز تنظیمات fixture را تأیید کرد (گزینهٔ Android-only override_android_vpn فقط برای این بررسی روی میزبان خاموش شد).
- SecureVPN-v1.3.60.apk نسخهٔ arm64، دارای امضای قبلی و قابل نصب روی نسخهٔ پیشین است؛ حجم 35,881,180 بایت، حدود 1.13MB بیشتر از 1.3.59 به علت هستهٔ جدید. SHA256: 7E562378E65210EEE90E69A241FAB3FC0333EAA1ED2935104548E8F9B70D9258.
- به درخواست قبلی کاربر شبیه‌ساز اجرا نشد؛ حذف علامت VPN، تکرار اتصال و پاسخ‌گویی Instagram/XHTTP روی گوشی هنوز تأیید نشده است. برای بازیابی extraهایی که نسخهٔ قبلی موقع import دور می‌ریخت، لینک باید دوباره وارد یا اشتراک دوباره دریافت شود.

### Android v1.3.59 — 2026-10-02

- قطع اتصال تا پایان onDestroy وضعیت DISCONNECTING دارد؛ درخواست وضعیت هنگام teardown دیگر زودتر DISCONNECTED نمی‌فرستد.
- پرچم‌های لغو/اتصال به همان نمونهٔ سرویس تعلق دارند؛ ایجاد TUN پس از لغو ممنوع است و start/reload/cleanup هماهنگ شدند.
- onRevoke پاک‌سازی را اجرا می‌کند؛ توقف native به Go دوباره وارد نمی‌شود و خطای closeService مانع بسته‌شدن CommandServer نیست.
- مسدودسازی اجباری UDP/443 حذف شد تا اپ‌های QUIC مجبور به fallback نشوند. ALPN صریح XHTTP حفظ و مسیر لینک تنها یک‌بار decode می‌شود.
- DNS آدرس سرور از شبکهٔ فیزیکی دریافت می‌شود؛ callback قبلیِ پایش رابط در reload حذف می‌شود.
- شمارهٔ Android به 1.3.59 / versionCode 189 افزایش یافت؛ MTU بدون تغییر خودکار باقی است.
### Android v1.3.58 — 2026-10-01

- برای V2Ray، سنجش IP و پینگ از ورودی SOCKS محلیِ دارای رمز تصادفی و مخصوص هر نشست به outbound پروکسی می‌رود؛ وابستگی به netId و FakeIP ذخیره‌شدهٔ اندروید حذف شد.
- اتصال TCP/TLS و درخواست گرم‌کن از زمان پینگ خارج شدند؛ دو پاسخ روی همان اتصال اندازه‌گیری می‌شوند. این مقدار تأخیر پاسخ HTTPS است، نه ICMP.
- MTU با ورود عدد 1200 تا 1500 و ذخیرهٔ دائمی در تنظیمات قابل تغییر است؛ مقدار ذخیره‌شده در اتصال بعدی به موتور و TUN ارسال می‌شود.
- شمارهٔ Android به 1.3.58 / versionCode 188 افزایش یافت.
### Android v1.3.57 — 2026-10-01

- انیمیشن‌های هم‌زمان پالس، حلقه‌های بزرگ‌شونده و پس‌زمینهٔ متحرک حذف شدند؛ فقط حلقهٔ کوچک هنگام اتصال روی لایهٔ گرافیکی می‌چرخد.
- کارت IP یکتا شد تا هنگام قطع، کارت قبلی و Origin جدید هم‌زمان ظاهر نشوند؛ انیمیشن تغییر اندازهٔ کارت‌ها حذف و انتقال صفحات کوتاه شد.
- پینگ و Public IP به شبکهٔ VPN فعلی و DNS مخصوص همان شبکه متصل شدند؛ اتصال HTTP قبلی مجدداً استفاده نمی‌شود و هنگام تغییر TUN درخواست‌ها تازه می‌شوند.
- شکست پینگ از حالت Checking خارج می‌شود؛ پینگ پشتیبان دارد و تکرار آزمون، دریافت Public IP ناموفق را نیز تکرار می‌کند.
- Release با همان امضای نسخه‌های قبلی و افزایش versionCode به 187 آماده می‌شود.
### Android v1.3.56 — 2026-10-01

- Origin IP فقط از شبکهٔ فیزیکی غیر VPN و با HTTPS دریافت می‌شود؛ پاسخ‌های دیررس اتصال قبلی کنار گذاشته می‌شوند.
- مسیرهای خصوصی از فهرست ایران حذف شدند و LAN مستقل است؛ تغییر دو کلید در اتصال V2Ray فعال با بارگذاری مجدد هسته اعمال می‌شود.
- وضعیت قطع اتصال پس از آزادسازی هسته و TUN اعلام می‌شود؛ MTU پروفایل به هسته منتقل می‌شود.
- مالکیت descriptor تانل بین سرویس و هسته جدا شد؛ بارگذاری مجدد، descriptor قبلی سرویس را می‌بندد و از بسته‌شدن دوبارهٔ descriptor هسته جلوگیری می‌کند.
- رنگ Origin IP در تم روشن اصلاح شد؛ کارت‌ها و ورودی‌ها گردتر و انتقال صفحه، کارت پروفایل، وضعیت و دکمهٔ اتصال نرم‌تر شدند.
- دامنهٔ اثر TCP Buffer/No Delay در تنظیمات مشخص شد؛ ثبت کانفیگ کامل و شناسهٔ اتصال در لاگ حذف شد.
- تست‌های استقلال LAN/ایران، اولویت FakeIP، اعتبار CIDR و پاسخ IP اضافه شدند.

> [!CAUTION]
> این جدول باید با هر بیلد جدید آپدیت شود.

### ۵.۱. تغییرات نسخه ویندوز (Windows Desktop)

- **v2.0.28 تا v2.0.30 (آخرین بیلد پایدار - Multi-Subscription):**
  - پیاده‌سازی سیستم **Multi-Subscription**: امکان افزودن چندین ساب‌اسکریپشن با قابلیت انتخاب و فیلتر روی تب‌های افقی (Chips) و تب یکپارچه "All Profiles".
  - امکان ویرایش (تغییر نام و لینک) و حذف ساب‌اسکریپشن از داخل اپ.
  - اصلاح استایل Modal‌ها و پشتیبانی از Dark Theme.
- **v2.0.27:**
  - جایگزینی کارت ثابت TCP با نمایشگر زنده پینگ (Live Ping).
  - رفع باگ کرش در رندر کامپوننت اتصال صفحه اصلی.
  - آماده‌سازی باینری پرتابل و اینستالر NSIS در گیت‌هاب ریلیز.
- **v2.0.25:**
  - بازطراحی تست پینگ مطابق نتایج دقیق V2rayN با ارسال درخواست واقعی HTTP 204.
  - اضافه شدن تست دسته‌ای با فواصل زمانی هوشمند (Staggered Batch Ping).
  - منوی System Tray کامل‌تر و لینک مستقیم به ریلیزهای گیت‌هاب.
- **v2.0.21:**
  - اضافه شدن پشتیبانی از آیکون روشن/تیره در تسک‌بار ویندوز.
  - اضافه شدن کلید میانبر `Ctrl+R` و دکمه تست مجزای هر سرور.
- **v2.0.14:**
  - مهاجرت بزرگ از فریم‌ورک Electron به **Tauri v2 + Rust**.
  - کاهش حجم اینستالر از ۱۰۰ مگابایت به ۳۰ مگابایت.
  - اصلاح روتینگ داخلی OpenConnect بدون نیاز به برنامه‌های کمکی جانبی.
- **v1.0.0 تا v1.4.1 (دوران Electron):**
  - توسعه اولیه بر پایه React، ادغام درایور Wintun، افزایش پهنای باند System Proxy تا ۵۰+ مگابیت با اصلاح ALPN، و پیاده‌سازی سابسکریپشن و بای‌پس ایران.

---

### ۵.۲. تغییرات نسخه اندروید (Android Mobile)

- **v1.3.51 تا v1.3.58 - Code 188 (آخرین بیلد پایدار - Multi-Subscription & Hysteria2):**
  - **سیستم Multi-Subscription**: اضافه شدن تب‌های افقی (Chips) برای فیلتر پروفایل‌ها بر اساس ساب‌اسکریپشن، دقیقا مشابه ویندوز. دارای تب "All Profiles" و امکان ویرایش/حذف ساب‌اسکریپشن با دکمه Edit.
  - **رفع مشکل دیتای Hysteria2**: کشف و رفع باگ ذخیره‌نشدن پارامتر `hysteriaObfs` در دیتابیس اندروید که باعث می‌شد کلاینت در ارسال `obfs=salamander` به سرور ناکام بماند و ترافیک دراپ شود.
  - نمایش Original Public IP کاربر قبل از اتصال در رابط کاربری اندروید، مشابه ویندوز.
  - حذف تنظیمات مخرب `up_mbps` و `down_mbps` از کانفیگ‌های خروجی Hysteria2 جهت پایداری اتصال.

- **v1.3.50 - Code 180:**
  - **رفع قطعی مجدد بایپس ایران:** جایگزینی DNS مستقیم شکن (`178.22.122.100`) با DNS عمومی `8.8.8.8`. به دلیل مسدودسازی یا اختلال روی شکن در برخی اپراتورها (مانند ایرانسل)، استفاده از `8.8.8.8` باعث می‌شود اپراتورها خودشان ترافیک UDP 53 را به DNS داخلی خودشان هایجک کنند و دامنه‌های ایرانی را با بالاترین پایداری و ۱۰۰٪ موفقیت رزولوشن برگردانند.

- **v1.3.49 - Code 179 (آخرین بیلد پایدار جهت پابلیش):**
  - **حذف کامل کانفیگ‌های پیش‌فرض جهت انتشار برنامه:** حذف پروفایل‌های هاردکدشده پیش‌فرض (`US-Reza`, `SSTP`, `openconnect`, `US`) از `VpnViewModel.kt`؛ نصب‌های جدید با محیطی کاملاً خام، تمیز و استاندارد جهت پابلیش بالا می‌آیند.
  - **تثبیت قطعی و پایدار بایپس روت‌های ایران (Bypass Iran Routes):**
    1. تغییر سرور `direct-dns` به آی‌پی عمومی و مطمئن شکن (`178.22.122.100` در دیتاسنتر آسیاتک تهران) به جای آی‌پی نامطمئن و پرایوت `10.202.10.202` که در شبکه دیتای همراه (همراه اول/ایرانسل) به دلیل تداخل با CGNAT رنج ۱۰ مسدود یا دراپ می‌شد و پایداری بایپس را مختل می‌کرد.
    2. فعال‌سازی پیش‌فرض بایپس ایران (`bypass_iran = true`) در تنظیمات و مقداردهی اولیه برنامه.
    3. خواندن مستقیم تنظیمات بایپس از `SharedPreferences` به عنوان Fallback در `VpnConnectionService` تا در صورت اجرای سرویس از حالت ریستارت یا عدم ارسال اینتنت، گزینه‌ها نادیده گرفته نشوند.
    4. اضافه کردن مستقیم متد `excludeRoute` در لایه کرنل لینوکس اندروید ۱۳+ برای اتصال‌های V2Ray/SingBox جهت بایپس قطعی و بدون تأخیر رنج‌های دولتی (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **v1.3.48 - Code 178:**
  - **رفع ارور هسته SingBox:** حذف پارامتر `detour: direct` از سرورهای `direct-dns` در `SingBoxConfigGenerator.kt` جهت جلوگیری از خطای `detour to an empty direct outbound makes no sense`.
  - افزودن مسیر مستقیم به آی‌پی‌های سرورهای DNS مستقیم در `route.rules` جهت هدایت تضمینی درخواست‌های DNS محلی بدون افتادن در تانل پروکسی.
  - آماده‌سازی و نصب نسخه نهایی در شبیه‌ساز.
- **v1.3.47 - Code 177:**
  - **رفع مشکل پریدن تنظیمات Split Tunneling:** ذخیره‌سازی خودکار برنامه‌های بایپس‌شده در `SharedPreferences` و بازیابی کامل آنها در شروع برنامه (`init`).
  - **رفع باگ نادیده گرفته شدن Bypass Iran Routes:**
    1. اصلاح ترتیب اولویت قوانین روتینگ SingBox: انتقال رول‌های دامنه‌ها و رنج‌های ایران به بالای جدول روتینگ قبل از رول پروکسی FakeIP (`198.18.0.0/15 -> proxy`).
    2. تفکیک و پشتیبانی از هر دو پسوند `"ir"` و `".ir"` در `domain_suffix` جهت جلوگیری از عدم تطابق.
    3. اصلاح تنظیمات DNS مستقیم و افزودن سرورهای مطمئن (403.online و Cloudflare/Google).
    4. پشتیبانی و بایپس کامل رنج‌های پرایوت دولتی (`10.0.0.0/8` و `172.16.0.0/12` و `192.168.0.0/16`) همراه با فعال بودن بایپس روت‌های ایران.
  - **آپدیت جامع‌ترین دیتابیس دامنه‌ها و آی‌پی‌های ایران:**
    - یکپارچه‌سازی و تجمیع ۱,۸۰۵ رنج CIDR رسمی RIPE NCC با پوشش ۱۰۰٪ فضای IPv4 ایران (`app/src/main/assets/iran_cidrs.txt`).
    - اضافه شدن بیش از ۵۷,۵۰۰ دامنه معتبر ایرانی غیر دات‌آی‌آر از مرجع `bootmortis/iran-hosted-domains` (`app/src/main/assets/iran_domains.txt`).
    - لودینگ بهینه بدون سربار حافظه در کلاس `IranIps.kt`.
- **v1.3.46 - Code 176:**
  - **رفع باگ حیاتی کرش:** حذف پارامتر `detour: direct` از تنظیمات سرور `direct-dns` در `SingBoxConfigGenerator.kt` جهت جلوگیری از ارور `detour to an empty direct outbound makes no sense` در هسته sing-box 1.12+.
  - تثبیت اجرای سرویس تانل و تست بدون نقص.
- **v1.3.45 - Code 175:**
  - **بازسازی اساسی معماری شبکه برای اینترنت همراه:**
    1. قرار دادن `proxy-dns` در ایندکس صفر برای رفع ارور `default server cannot be fakeip`.
    2. اضافه کردن اسنیفر `dns` و رول ربودن پورت ۵۳ (`hijack-dns`).
    3. فعال‌سازی اجباری `packet_encoding: "xudp"` در تمامی اوت‌باندهای VLESS و VMess.
    4. پر کردن صحیح پرچم‌های POSIX در `SingBoxEngine.kt` با بیت‌ماسک `IFF_UP | IFF_RUNNING`.
    5. تفکیک و فیلتر کردن NetworkCallbackهای سیستم با فلگ عدم محدودیت.
- **v1.3.40 تا v1.3.44 - Code 170 to 174:**
  - بهینه‌سازی سایز خروجی با ابزار R8 و ProGuard، جداسازی فایل‌های خروجی بر اساس معماری پردازنده (ARM64, ARMv7, x86, x86_64).
  - توسعه صفحه نمایش زنده لاگ‌ها (Logs Screen).
- **v1.0.0 تا v1.3.21 - Code 100 to 150:**
  - راه‌اندازی ساختار برنامه با Jetpack Compose، سرویس VpnService، ادغام اولیه هسته sing-box و پشتیبانی از Cisco AnyConnect.

---

## ۶. نگهداری، بهداشت مخزن و ساختار فایل‌های پروژه

پروژه به صورت کامل پاکسازی شده و از **۲۸ گیگابایت به ۱.۱ گیگابایت** کاهش حجم داشته است. برای حفظ سبکی مخزن در آینده به نکات زیر توجه شود:

### فایل‌هایی که باید همیشه حفظ شوند:
1. سورس‌کد کامل اندروید در [`app/`](file:///H:/Antigravity%20Projects/VPN%20APP/app) و کتابخانه [`app/libs/libbox.aar`](file:///H:/Antigravity%20Projects/VPN%20APP/app/libs/libbox.aar).
2. سورس‌کد کامل ویندوز در [`windows-app-tauri/`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri) و وابستگی‌های [`resources/`](file:///H:/Antigravity%20Projects/VPN%20APP/windows-app-tauri/resources).
3. آخرین فایل‌های خروجی و نصبی در ریشه پروژه:
   - ویندوز نصبی: `SecureVPN-v2.0.27-Setup.exe`
   - ویندوز پرتابل: پوشه `SecureVPN-Portable/` و فایل `SecureVPN.exe`
   - اندروید آماده نصب: `SecureVPN-v1.3.48.apk`
4. تصاویر رسمی پروژه در پوشه `assets/`.
5. مستندات رسمی: `DEVELOPMENT_SUMMARY.md` و `README.md`.

### فایل‌هایی که در صورت سنگین شدن پروژه می‌توان پاکسازی کرد:
- پوشه `windows-app-tauri/src-tauri/target/debug` (کش میانی بیلد Rust که حجم بالایی می‌گیرد و با دستور بیلد مجدداً ساخته می‌شود).
- پوشه `app/build/intermediates` در اندروید (با اجرای `gradlew clean` تمیز می‌شود).
- از قرار دادن فایل‌های باینری قدیمی (مثل ستاپ‌های نسخه‌های قبل، فایل‌های لاگ حجیم txt، و فایل‌های Zip موقت) در ریشه پروژه خودداری شود.

ثبت GitHub: تغییرات Android1.0.1 به مخزن خصوصی SecureVPN-Android، شاخهٔ main، commit `faf49eefa9487189bd25ec242ea716904edf4b45` پوش شدند و HEAD ریموت با local برابر بود. ریپوی Windows پوش نشد.

## بررسی شروع Google Play و AdMob — 2026-10-08

- مرورگر به Play Console حساب MRE Developer (Personal) دسترسی داشت؛ فقط Persian & Gregorian Calendar دیده شد، SecureVPN هنوز app record ندارد. نام SecureVPN در فرم وارد شد. Play اعلام کرد `com.vpnapp` و `com.securevpn` قبلاً استفاده شده‌اند؛ `com.rahanetmci.securevpn` آزاد بود، اما مالکیت دامنهٔ مربوطه هنوز تأیید نشده و هیچ شناسه‌ای ثبت نشد. اظهارنامه‌های سیاست Play و صادرات/رمزنگاری نیز تیک نخورده‌اند.
- با ورود کاربر به AdMob، اپ SecureVPN و بنر ثبت شدند؛ شناسه‌ها و وضعیت در بخش AdMob بالای همین سند و ANDROID_ADS.md آمده‌اند. شناسه‌های واقعی هنوز وارد APK نشده‌اند و demo IDs در بیلد تست مانده‌اند.
- پیش‌نیازهای build مانده: target/compile API36، همهٔ nativeها 16KB، upload key/Play App Signing و AAB. APK تست با Android Debug امضا شده و هنوز قابل ارسال نیست.
- در ANDROID_PLAY_PREPARATION.md وضعیت حساب، مراحل رسمی، مقررات آزمون Closed، VPN declaration، privacy/Data safety، app-ads.txt و موارد نیازمند مالکیت/تأیید صاحب حساب ثبت شده‌اند.
- منابع رسمی بررسی‌شده: Target API36 از 31اوت2026؛ شرط 12 آزمایشگر/14روز برای حساب‌های Personal مشمول؛ الزامات 16KB، VPN، Data safety و AdMob readiness.
- هیچ app record در Play ساخته، AAB/APK بارگذاری یا release منتشر نشده؛ دو اظهارنامهٔ قانونی داخل Create app را بدون تأیید مالک تیک نزدم.
