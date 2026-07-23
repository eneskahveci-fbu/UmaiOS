# UmaiOS

iPhone, Android ve masaüstü dâhil **her cihazda çalışan, AI tabanlı bir kabuk**
(shell) — ve ileride desteklenen donanımda gerçek bir Linux işletim sistemi.

> **Neden "her cihaz" ancak bu şekilde mümkün?** iPhone'a native bir Linux OS
> **kurulamaz** (Apple donanımsal Secure Boot). Her cihaza tek kod tabanıyla
> ulaşmanın tek gerçekçi yolu, mevcut OS üstünde çalışan bir uygulama/platform
> katmanıdır. Ayrıntılı gerekçe ve mimari: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Ne var burada?
- `docs/ARCHITECTURE.md` — teknik gerçekçilik + katmanlı mimari
- `docs/ROADMAP.md` — fazlı yol haritası
- `web/` — **derleme gerektirmeyen, çalışan PWA prototipi** (AI kabuğu)

## Hızlı başlangıç
```bash
cd web && python3 -m http.server 8080
# Tarayıcı: http://localhost:8080
```
- **iPhone:** Safari → Paylaş → "Ana Ekrana Ekle"
- **Android:** Chrome → "Uygulamayı yükle"
- **Desktop:** adres çubuğundaki yükle simgesi

Gerçek AI yanıtları için bir backend proxy bağlanır (bkz. Yol Haritası, Faz 1);
prototip şimdilik yer tutucu asistanla çalışır ve Claude API'ye bağlanmaya hazırdır.

## Güvenlik
Sırlar (API anahtarı, token) **asla repoya yazılmaz** — ortam değişkeni veya
platformun güvenli deposu kullanılır.
