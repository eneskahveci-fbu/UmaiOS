# UmaiOS — Yol Haritası

Fazlar bağımsız değer üretir: her fazın sonunda elde çalışan bir şey olur.

## Faz 0 — Temel (BU PR)
- [x] Dürüst mimari ve teknik gerçekçilik belgesi (`docs/ARCHITECTURE.md`)
- [x] Yol haritası
- [x] Derleme gerektirmeyen çalışan PWA iskelesi (`web/`)
- [x] Sağlayıcı-bağımsız asistan çekirdeği (yer tutucu + gerçek API'ye hazır)
- [x] Kurulabilir/çevrimdışı PWA (manifest + service worker)

## Faz 1 — AI Shell MVP
- [ ] Gerçek LLM entegrasyonu için hafif backend proxy (Claude API)
  - Node/Express veya Cloudflare Worker; anahtar sunucuda saklanır.
- [ ] Akış (streaming) yanıtları
- [ ] Sohbet geçmişi (cihazda saklama)
- [ ] Uygulama kayıt sistemi (App Registry) + 2-3 örnek mini-uygulama
- [ ] Ayarlar ekranı (tema, dil TR/EN, sağlayıcı seçimi)

## Faz 2 — Native paketleme (her cihaz)
- [ ] Capacitor ile iOS paketi (App Store) — iPhone'a ulaşım
- [ ] Capacitor ile Android paketi (Play Store / APK)
- [ ] Tauri ile desktop paketi (Linux / Windows / macOS)
- [ ] Cihaz köprüsü: bildirim, kamera, dosya, paylaşım

## Faz 3 — AI yetenekleri
- [ ] Tool use ile cihaz eylemleri (ayar aç, uygulama başlat, arama)
- [ ] Sesli asistan (STT/TTS)
- [ ] Bağlam/hafıza katmanı
- [ ] Opsiyonel çevrimdışı yerel model

## Faz 4 — UmaiOS Native (opsiyonel, büyük iş)
- [ ] Desktop Linux imajı (Katman 1 varsayılan kabuk)
- [ ] postmarketOS tabanlı mobil port (desteklenen ilk cihaz)
- [ ] OTA güncelleme altyapısı

---

## Hızlı başlangıç (PWA iskelesini çalıştır)

Derleme/kurulum gerekmez. Repo kökünde herhangi bir statik sunucu yeter:

```bash
# Python ile (her yerde var)
cd web && python3 -m http.server 8080
# Tarayıcıda: http://localhost:8080
```

- **iPhone:** Safari'de aç → Paylaş → "Ana Ekrana Ekle" → uygulama gibi açılır.
- **Android:** Chrome → menü → "Uygulamayı yükle".
- **Desktop:** Chrome/Edge adres çubuğundaki yükle simgesi.

Gerçek AI yanıtları için Faz 1'deki backend proxy gerekir; iskele şu an
yer tutucu (echo) asistanla çalışır ve gerçek sağlayıcıya bağlanmaya hazırdır.
