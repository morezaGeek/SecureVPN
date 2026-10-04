# GitHub publication handoff — 2026-10-04

مخزن: `morezaGeek/SecureVPN`، شاخهٔ `main`.

توکن پروژه در **2026-10-03** به‌روز و دسترسی خواندن مخزن/پوش با GitHub API تأیید شد. مقدار توکن تنها در فایل محلی `scratch/github-token.private.txt` نگهداری می‌شود. این فایل و تمام پوشهٔ scratch توسط Git نادیده گرفته می‌شوند؛ مقدار توکن در مستندات، کامیت، URL ریموت یا asset ریلیز قرار نگیرد.

برای Antigravity در همین workspace: توکن را از این فایل بخوان؛ از مقادیر قدیمی داخل اسکریپت‌ها یا اطلاعات ورود ذخیره‌شدهٔ Git استفاده نکن. چهار helper قدیمی در scratch اکنون از فایل مرکزی می‌خوانند. این helperها نسخه‌های قدیمی را هدف گرفته‌اند و برای انتشار تازه اجرا نشوند.

اسکریپت محلی انتشار Windows2.0.32: `scratch/windows-diagnostics/publish-2.0.32.cjs`. عملیات `inspect`، `push`، `release` و `verify` دارد؛ release پس از پوش سورس، نصب‌کننده را در draft آپلود می‌کند، فایل آپلودشده را دانلود و SHA256 را بررسی می‌کند، سپس ریلیز را عمومی می‌کند و تطبیق tag با کامیت را تأیید می‌کند. verify وضعیت عمومی و لینک نهایی را بررسی می‌کند. اسکریپت صرفاً از توکن پروژه استفاده می‌کند و از credential store چیزی نمی‌خواند.

توکن خصوصی روی GitHub منتشر نمی‌شود؛ clone تازه آن را ندارد و باید توکن اختصاصی محیطش را فراهم کند.

فایل انتشار: `SecureVPN-v2.0.32-Setup.exe`، **30,267,577 بایت**.

SHA256: `DAF84EAB301B4248A0819C7DC4781E1798FFFCCBDEDCC7368BF1E42CAF111C9D`.

انتشار در2026-10-03 تکمیل شد: [Windows v2.0.32](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.32)، tag روی کامیت `8f59c382e41ea570c4fd7d6e3f7a7efaad685f18`. سورس روی main پوش و ریلیز عمومی شد؛ فایل آپلودشده با دانلود مجدد و SHA256 بررسی شد.

[دانلود نصب‌کننده](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.32/SecureVPN-v2.0.32-Setup.exe).

## قرارداد آپدیت داخل اپ، از Windows2.0.34

اپ فقط ریلیزهای عمومی stable همین مخزن با tag `v<semver>` و asset دقیق `SecureVPN-v<semver>-Setup.exe` را برای ارتقا می‌پذیرد. فایل باید به‌عنوان GitHub release asset آپلود شود تا metadata آن `digest` معتبر SHA256 داشته باشد. draft/prerelease، فایل Android، نسخهٔ برابر/قدیمی و URL خارجی نادیده گرفته می‌شوند. هیچ PAT در کلاینت آپدیت وجود ندارد.

آخرین نسخهٔ منتشرشده در۴اکتبر۲۰۲۶: [Windows2.0.34](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.34)، tag روی کامیت `bbd3de728ae069c1dbd0a8a381640aa740f51024`. سورس روی main پوش و فایل آپلودشده با دانلود مجدد/SHA256 تأیید شد. [دانلود نصب‌کننده34](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.34/SecureVPN-v2.0.34-Setup.exe).

helper این انتشار `scratch/windows-diagnostics/publish-2.0.34.cjs` است؛ عملیات inspect/push/release/verify با توکن خصوصی مرکزی انجام می‌شود و helper Git از credential store استفاده نمی‌کند. گزارش دقیق انتشار در `scratch/windows-diagnostics/published-2.0.34.json` است. برای نسخهٔ بعدی، helper34 یا32 را بدون تطبیق نسخه/نام/hash اجرا نکن. SHA256 فایل34: `BC4B501E084CFF4DE8DC2C86F2273709FB46256E2D0425BA94563BF00AB1B326`، حجم30,339,736بایت؛ metadata عمومی digest معتبر دارد. قرارداد و آزمون‌ها در `windows-app-tauri/src-tauri/installer/README.md` ثبت شده‌اند. توکن وارد asset یا سورس نشده است.
