# UmaiOS — Mimari ve Teknik Gerçekçilik

Bu belge, "her telefonda/her cihazda çalışan, iPhone dâhil, AI tabanlı bir
Linux işletim sistemi" hedefini **dürüstçe** ele alır: neyin mümkün, neyin
mümkün olmadığını ve seçtiğimiz gerçekçi yolu açıklar.

## 1. Hedefin gerçekçi analizi

| İstek | Durum | Açıklama |
|------|-------|----------|
| Desktop'ta Linux OS | ✅ Mümkün | Standart bir Linux dağıtımı işi. |
| Belirli Android cihazlarda native Linux | ⚠️ Kısmen | postmarketOS/Mobian ile, **ama** cihaz başına port gerekir; "her Android" değil. |
| **Her** Android telefonda tek imaj | ❌ Mümkün değil | Her modelin kernel/sürücü/bootloader'ı farklıdır. Universal imaj yoktur. |
| **iPhone'da** native Linux OS | ❌ Mümkün değil | Apple Secure Boot bootloader'ı kilitler; modern iPhone'a alternatif OS kurulamaz. |
| **Her cihazda çalışan** (iPhone dâhil) yazılım | ✅ Mümkün | Ancak **mevcut OS üstünde çalışan bir uygulama/platform katmanı** olarak. |
| AI tabanlı deneyim | ✅ Mümkün | Her iki yaklaşımda da uygulanabilir. |

### Neden iPhone'a native OS kurulamıyor?
iPhone'lar donanımsal Secure Boot ile gelir: bootloader yalnızca Apple
tarafından imzalanmış çekirdeği çalıştırır. Bu bir yazılım kısıtı değil,
donanım kökenli bir kısıttır ve jailbreak dâhil hiçbir yöntem modern
cihazlarda alternatif bir işletim sistemi başlatamaz.

## 2. Seçilen yaklaşım: Katmanlı / Hibrit

"iPhone dâhil her cihaz" şartı **yalnızca uygulama katmanı** ile
karşılanabildiği için mimariyi iki katmana ayırıyoruz:

```
┌──────────────────────────────────────────────────────────┐
│  KATMAN 1 — Umai AI Shell (her cihazda çalışan çekirdek)   │
│  Tek kod tabanı → iPhone · Android · Linux · Win · macOS   │
│  Teknoloji: Web/PWA çekirdek + Capacitor (mobil) + Tauri   │
│  (desktop). AI asistan, uygulama ızgarası, komut arayüzü.  │
└──────────────────────────────────────────────────────────┘
                            │  (aynı çekirdek)
                            ▼
┌──────────────────────────────────────────────────────────┐
│  KATMAN 2 — UmaiOS Native (opsiyonel, ileri faz)          │
│  Desktop Linux dağıtımı + desteklenen Android cihazlar     │
│  için postmarketOS tabanlı imaj. Katman 1'i varsayılan     │
│  kabuk (shell) olarak gömer.                               │
└──────────────────────────────────────────────────────────┘
```

**Sonuç:** Bugün geliştirdiğimiz çekirdek (Katman 1) iPhone dâhil her cihazda
çalışır. İleride donanımı uygun cihazlarda aynı deneyimi gerçek bir Linux
işletim sistemi (Katman 2) olarak da paketleyebiliriz.

## 3. Katman 1 — Umai AI Shell

### 3.1 Neden PWA/web çekirdek?
- **iPhone'a ulaşmanın tek pratik tek-kod-tabanı yolu.** Safari PWA olarak
  "Ana ekrana ekle" ile kurulur; Capacitor ile App Store'a paketlenir.
- Android'de Play Store (Capacitor) veya doğrudan PWA.
- Desktop'ta Tauri (Rust) ile küçük, hızlı native paket.
- Tek kod tabanı, tek ekip.

### 3.2 Çekirdek modüller
- **Shell UI** — tam ekran AI-öncelikli arayüz: asistan + uygulama ızgarası.
- **Assistant Core** — LLM sağlayıcısına konuşan soyutlama katmanı
  (varsayılan: Claude API — `claude-opus-4-8` / `claude-sonnet-5`).
- **App Registry** — kabuğa takılan mini-uygulamalar (web bileşenleri).
- **Bridge** — cihaz yetenekleri (kamera, dosya, bildirim) için Capacitor/Tauri
  köprüsü. Web'de zarifçe devre dışı kalır (progressive enhancement).
- **Settings/Secrets** — API anahtarı ve tercihler cihazda saklanır
  (localStorage / güvenli depolama). **Anahtarlar repoda tutulmaz.**

### 3.3 Bu repodaki mevcut iskele
`web/` altında **derleme gerektirmeyen**, çalışan bir PWA prototipi var:
- `index.html` — kabuk arayüzü
- `app.js` — asistan mantığı + uygulama ızgarası
- `styles.css` — açık/koyu tema
- `manifest.webmanifest` + `sw.js` — kurulabilir/çevrimdışı PWA

Çalıştırmak için: `docs/ROADMAP.md` → "Hızlı başlangıç".

## 4. Katman 2 — UmaiOS Native (ileri faz)
- **Desktop:** archiso/Debian tabanlı bir imaj; Katman 1 varsayılan kabuk.
- **Mobil:** postmarketOS üzerinde desteklenen cihazlar için port; her cihaz
  ayrı bir alt-proje (kernel + device tree + sürücüler).
- Bu faz **büyük bir donanım/dağıtım işidir** ve Katman 1 olgunlaştıktan
  sonra başlatılmalıdır.

## 5. AI mimarisi
- Sağlayıcı-bağımsız `AssistantProvider` arayüzü.
- Varsayılan: Anthropic Claude API (Messages API, tool use ile cihaz
  eylemleri). Anahtar **backend proxy** üzerinden kullanılmalı; istemciye
  gömülmemeli (üretimde).
- Yerel/çevrimdışı mod için ileride küçük yerel modeller (opsiyonel).

## 6. Güvenlik notu
Sırlar (API token, anahtar) **asla** repoya yazılmaz. Ortam değişkeni veya
platformun güvenli deposu kullanılır. (Bkz. kök `README.md`.)
