# GitHub publication handoff — 2026-10-03

مخزن: `morezaGeek/SecureVPN`، شاخهٔ `main`.

توکن پروژه در **2026-10-03** به‌روز و دسترسی خواندن مخزن/پوش با GitHub API تأیید شد. مقدار توکن تنها در فایل محلی `scratch/github-token.private.txt` نگهداری می‌شود. این فایل و تمام پوشهٔ scratch توسط Git نادیده گرفته می‌شوند؛ مقدار توکن در مستندات، کامیت، URL ریموت یا asset ریلیز قرار نگیرد.

برای Antigravity در همین workspace: توکن را از این فایل بخوان؛ از مقادیر قدیمی داخل اسکریپت‌ها یا اطلاعات ورود ذخیره‌شدهٔ Git استفاده نکن. چهار helper قدیمی در scratch اکنون از فایل مرکزی می‌خوانند. این helperها نسخه‌های قدیمی را هدف گرفته‌اند و برای انتشار تازه اجرا نشوند.

اسکریپت محلی انتشار Windows2.0.32: `scratch/windows-diagnostics/publish-2.0.32.cjs`. عملیات `inspect`، `push`، `release` و `verify` دارد؛ release پس از پوش سورس، نصب‌کننده را در draft آپلود می‌کند، فایل آپلودشده را دانلود و SHA256 را بررسی می‌کند، سپس ریلیز را عمومی می‌کند و تطبیق tag با کامیت را تأیید می‌کند. verify وضعیت عمومی و لینک نهایی را بررسی می‌کند. اسکریپت صرفاً از توکن پروژه استفاده می‌کند و از credential store چیزی نمی‌خواند.

توکن خصوصی روی GitHub منتشر نمی‌شود؛ clone تازه آن را ندارد و باید توکن اختصاصی محیطش را فراهم کند.

فایل انتشار: `SecureVPN-v2.0.32-Setup.exe`، **30,267,577 بایت**.

SHA256: `DAF84EAB301B4248A0819C7DC4781E1798FFFCCBDEDCC7368BF1E42CAF111C9D`.

انتشار در2026-10-03 تکمیل شد: [Windows v2.0.32](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.32)، tag روی کامیت `8f59c382e41ea570c4fd7d6e3f7a7efaad685f18`. سورس روی main پوش و ریلیز عمومی شد؛ فایل آپلودشده با دانلود مجدد و SHA256 بررسی شد.

[دانلود نصب‌کننده](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.32/SecureVPN-v2.0.32-Setup.exe).
