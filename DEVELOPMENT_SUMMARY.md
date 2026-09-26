# راهنمای جامع معماری، توسعه و چنج‌لاگ SecureVPN (ویندوز و اندروید)

> [!IMPORTANT]
> **دستورالعمل الزامی برای توسعه‌دهندگان و مدل‌های هوش مصنوعی (AI Directive):**
> ۱. هرگونه تغییر در سورس‌کد، رفع باگ، یا افزودن قابلیت جدید **باید** بلافاصله در بخش **«تاریخچه نسخه‌ها و تغییرات (Changelog)»** همین فایل ثبت شود.
> ۲. طبق قوانین پروژه، با هر تغییر در برنامه باید شماره نسخه در فایل‌های مربوطه و در رابط کاربری (UI) افزایش یابد.
> ۳. این مستند به عنوان **منبع مرجع (Single Source of Truth)** برای سشن‌های جدید چت طراحی شده تا دید فنی و عمیقی از ساختار پروژه ارائه دهد.

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
