# UmaiOS

UmaiOS, [Buildroot](https://buildroot.org) ile derlenen, minimal ve hafif bir
Linux dağıtımı. Aynı imaj üç şekilde çalışır:

- **Gerçek donanım / VM üzerinde**, kurulabilir bir disk imajı (ext4) olarak,
- **QEMU üzerinde**, disksiz, RAM'e açılan bir initramfs olarak,
- **Web tarayıcısında**, [v86](https://github.com/copy/v86) (WebAssembly x86
  emülatörü) ile hiçbir eklenti/kurulum gerekmeden, aynı initramfs imajını
  kullanarak.

Sistem musl libc + BusyBox üzerine kurulu; SSH (dropbear), temel ağ araçları
(iproute2), `nano` ve `htop` dışında ekstra paket taşımıyor - amaç mümkün
olduğunca küçük ve hızlı açılan bir taban olmak.

## Depo yapısı

```
configs/umaios_x86_64_defconfig   Buildroot defconfig (paket/toplam sistem seçimi)
board/umaios/linux.config         Çekirdek yapılandırma parçası
board/umaios/rootfs-overlay/      Dosya sistemine kopyalanan dosyalar (motd, os-release, ...)
board/umaios/post-build.sh        Derleme sonrası dosya sistemi düzenlemeleri
board/umaios/post-image.sh        İmaj sonrası: start-qemu.sh üretir, web/boot/'u doldurur
buildroot/                        Buildroot (git submodule, 2026.05.1 etiketine sabit)
web/                              Tarayıcıda önyükleme sayfası (v86)
build.sh                          Derleme sarmalayıcı script
.github/workflows/build.yml       CI: derler ve web/'i GitHub Pages'e yayınlar
```

`external.desc`, `external.mk` ve `Config.in` bu depoyu bir Buildroot
`BR2_EXTERNAL` ağacı olarak tanımlar; yani Buildroot'un kendisine hiç
dokunulmadan tüm özelleştirme bu depoda tutulur.

## Yerelde derleme

Gereksinimler (Debian/Ubuntu): `build-essential cpio rsync unzip bc
libncurses-dev git`. Derleme, tam bir toolchain + çekirdek + kök dosya
sistemi derlediği için onlarca kaynak paketi indirir (gcc, kernel, busybox,
...); **tam internet erişimi olan bir makine veya CI gerekir** - kısıtlı/izole
ağ ortamlarında (ör. bazı sanal ajan/sandbox ortamları) kaynak indirmeleri
engellenebilir.

```sh
git clone --recursive https://github.com/eneskahveci-fbu/UmaiOS
cd UmaiOS
./build.sh
```

İlk derleme (toolchain dahil) donanıma bağlı olarak 20-60 dakika sürebilir.
Çıktılar `output/images/` altında oluşur:

- `bzImage` - Linux çekirdeği
- `rootfs.cpio.gz` - initramfs (QEMU ve tarayıcı önyüklemesi için)
- `rootfs.ext4` - kurulabilir disk imajı (gerçek donanım/VM için)
- `start-qemu.sh` - tek komutla QEMU'da test etmek için hazır script

Aynı adımlar `bzImage`+`rootfs.cpio.gz` çiftini otomatik olarak `web/boot/`
içine de kopyalar.

Diğer kullanışlı komutlar:

```sh
./build.sh menuconfig         # Paket seçimini değiştir
./build.sh linux-menuconfig   # Çekirdek yapılandırmasını değiştir
./build.sh clean              # output/'u temizle (indirilen kaynaklar kalır)
```

## Çalıştırma

**QEMU:**
```sh
output/images/start-qemu.sh
```

**Gerçek donanım / VM:** `output/images/rootfs.ext4` imajını bir USB/disk'e
yazın (`dd if=output/images/rootfs.ext4 of=/dev/sdX bs=4M status=progress`)
ve makineyi bu diskten, `bzImage`'i de bir önyükleyici (GRUB, syslinux, vb.)
ile ayarlayıp açın.

**Tarayıcıda:** `./build.sh` çalıştırıldıktan sonra `web/` klasörünü herhangi
bir statik dosya sunucusuyla servis edin (`python3 -m http.server` yeterli)
ve tarayıcıda açın. Sayfa kernel + initramfs'i indirip v86 ile tamamen
istemci tarafında, sunucuya hiçbir veri göndermeden çalıştırır.

## CI ve canlı web demo

`.github/workflows/build.yml`, `main` dalına her push'ta UmaiOS'u GitHub
Actions üzerinde (tam internet erişimiyle) derler ve `web/` klasörünü
GitHub Pages'e yayınlar; ayrıca `output/images/` içeriğini iş akışı
çıktısı (artifact) olarak sunar. Canlı demoyu almak için depo ayarlarından
**Settings → Pages → Source: GitHub Actions** seçilmesi yeterli - ilk
başarılı çalışmadan sonra sayfa `https://<kullanıcı>.github.io/UmaiOS/`
adresinde yayında olur.

## Varsayılan giriş bilgileri

`root` / `umaios`. Bu sadece hızlı başlangıç içindir - gerçek bir dağıtım
veya herkese açık bir ortamda **ilk girişten sonra mutlaka değiştirin**
(`passwd`) ya da `board/umaios/rootfs-overlay` ile SSH anahtarı bazlı girişe
geçin.

## Neden bu mimari

- **Buildroot**, gerçek bir Linux çekirdeği ve minimal userspace üretir -
  "sahte" bir web tabanlı OS simülasyonu değil, gerçekten önyüklenebilir bir
  dağıtım.
- **v86**, çekirdeği doğrudan (`bzImage` + `initrd`, BIOS'suz) önyükleyerek
  tarayıcıda çalıştırır; bu yüzden gerçek donanım, QEMU ve tarayıcı aynı
  imajı kullanır - ayrı bir "web sürümü" derlemeye gerek yok.
- Şu an masaüstü/GUI (X11 vb.) katmanı **yok**: bu, hem imaj boyutunu hem
  derleme süresini önemli ölçüde artırır ve "hafif" hedefiyle çelişir.
  Sistem seri konsol üzerinden bir kabuk (shell) sunar. İleride grafik
  arayüz eklenmek istenirse `configs/umaios_x86_64_defconfig`'e bir
  pencere yöneticisi + framebuffer/Wayland yığını eklenmesi yeterlidir.
