import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Phone, PlayCircle } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { formatDate, truncateHtml } from '@/lib/format';
import { useSiteStore } from '@/store/siteStore';

const featuredServiceIcons: Record<string, string> = {
  hemo: 'https://rshdbarabai.com/themes/rshd/assets/img/png-icon/png-icon-13.png',
  mcu: 'https://rshdbarabai.com/themes/rshd/assets/img/png-icon/png-icon-14.png',
  laboratorium: 'https://rshdbarabai.com/themes/rshd/assets/img/png-icon/png-icon-13.png',
  icu: 'https://rshdbarabai.com/themes/rshd/assets/img/png-icon/png-icon-12.png',
};

export default function HomePage() {
  const bootstrap = useSiteStore((state) => state.bootstrap);
  const slides = useMemo(() => bootstrap?.heroSlides ?? [], [bootstrap?.heroSlides]);
  const [activeSlide, setActiveSlide] = useState(0);
  const doctorSliderRef = useRef<HTMLDivElement | null>(null);
  const aboutImage = 'https://www.rshdbarabai.com/themes/rshd/assets/img/about/about-02.jpg';
  const aboutVideoIcon = 'https://www.rshdbarabai.com/themes/rshd/assets/img/png-icon/png-icon-09.png';
  const signatureImage = 'https://www.rshdbarabai.com/themes/rshd/assets/img/png-icon/ttd.png';
  const doctorPlaceholder =
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20indonesian%20doctor%20portrait%2C%20white%20coat%2C%20friendly%20hospital%20staff%2C%20green%20medical%20background%2C%20realistic%20editorial%20photography&image_size=portrait_4_3';

  useEffect(() => {
    if (!slides.length) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides]);

  const currentSlide = slides[activeSlide];

  function slideDoctors(direction: 'prev' | 'next') {
    const slider = doctorSliderRef.current;
    if (!slider) return;

    const cardWidth = slider.querySelector<HTMLElement>('[data-doctor-card]')?.offsetWidth ?? 320;
    const gap = 20;
    slider.scrollBy({
      left: direction === 'next' ? cardWidth + gap : -(cardWidth + gap),
      behavior: 'smooth',
    });
  }

  function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trimEnd()}...`;
  }

  if (!bootstrap || !currentSlide) {
    return null;
  }

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <img
          src={currentSlide.image}
          alt={currentSlide.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.62),rgba(15,23,42,0.26)_48%,rgba(255,255,255,0.06)),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />
        <div className="container relative grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100">
              {currentSlide.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-[3.35rem] font-semibold leading-[1.02] md:text-[4rem]">
              {currentSlide.title}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-slate-100 md:text-base">
              {currentSlide.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={currentSlide.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-[#d84f86] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#c43d72]"
              >
                <PlayCircle className="h-5 w-5" />
                {currentSlide.actionLabel}
              </a>
              <Link
                to="/hubungi"
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                <Phone className="h-5 w-5" />
                Hubungi Kami
              </Link>
            </div>

            <div className="mt-10 flex gap-3">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 rounded-full transition ${
                    index === activeSlide ? 'w-14 bg-[#ffd17a]' : 'w-8 bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="rounded-[1.75rem] border border-white/20 bg-white/14 p-6 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-200">Pelayanan Terintegrasi</p>
              <h2 className="mt-3 font-display text-[2.15rem] font-semibold leading-tight">Pelayanan cepat, ramah, dan profesional</h2>
              <p className="mt-3 text-sm leading-7 text-slate-100/85">
                Rumah sakit rujukan dengan layanan unggulan, fasilitas lengkap, dan tenaga medis berpengalaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 container -mt-7">
        <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/40 md:grid-cols-2 xl:grid-cols-4">
          {bootstrap.homeStats.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.25rem] border border-slate-100 bg-[#f8faf8] px-5 py-4 text-center"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">{item.label}</p>
              <p className="mt-2 font-display text-[2rem] font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-5">
        <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/30 md:grid-cols-3 xl:grid-cols-6">
          {bootstrap.quickLinks.map((item) =>
            item.url ? (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#d84f86]/20 hover:bg-[#fff3f8] hover:text-[#b73567]"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={`/${item.slug}`}
                className="rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#d84f86]/20 hover:bg-[#fff3f8] hover:text-[#b73567]"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="container mt-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50">
              <img
                src={aboutImage}
                alt="Kenapa harus RSHD Barabai"
                className="h-[28rem] w-full object-cover"
              />
            </div>
            <a
              href="https://youtu.be/8rPB4A3zDnQ"
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-6 right-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl shadow-slate-900/10 transition hover:scale-105"
            >
              <img src={aboutVideoIcon} alt="Lihat video" className="h-10 w-10" />
            </a>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/40 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.38em] text-emerald-700">
              Kenapa harus RSHD Barabai?
            </p>
            <h2 className="mt-3 font-display text-[2.5rem] font-semibold leading-tight text-slate-900 md:text-[3rem]">
              Pelayanan kami <span className="text-[#d84f86]">PARIPURNA</span> dengan TIM
              terbaik di bidangnya.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Setiap pasien mendapatkan perawatan terbaik dari kami. Setiap pasien adalah
              istimewa. Bukan hanya membantu kesembuhan, kami juga memberi pengalaman
              berkesan buat anda.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <img
                src={signatureImage}
                alt="Tanda tangan direktur"
                className="h-12 w-auto object-contain"
              />
              <p className="text-sm leading-6 text-slate-700">
                <span className="font-bold text-slate-900">
                  dr. Nanda Sujud Adhi Yudha Utama, Sp.B
                </span>
                <br />
                Direktur
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/hubungi"
                className="inline-flex items-center gap-2 rounded-full bg-[#d84f86] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c43d72]"
              >
                Hubungi
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/profil"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#b73567]"
              >
                Tentang Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-14">
        <SectionHeading
          eyebrow="Layanan Kami"
          title="Layanan unggulan RSHD Barabai"
          description="Migrasi ini mempertahankan jalur layanan utama dari situs lama agar pengunjung tetap familiar."
          centered
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {bootstrap.featuredServices.map((service) => (
            <Link
              key={service.slug}
              to={`/${service.slug}`}
              className="group relative overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white p-7 shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#eef8f3]" />
              {featuredServiceIcons[service.slug] ? (
                <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-[#f4fbf7] ring-1 ring-emerald-100">
                  <img
                    src={featuredServiceIcons[service.slug]}
                    alt={service.title}
                    className="h-12 w-12 object-contain"
                  />
                </div>
              ) : null}
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-700">Layanan</p>
              <h3 className="relative mt-4 font-display text-[1.85rem] font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#fff3f8] px-4 py-2 text-sm font-semibold text-[#b73567]">
                Selengkapnya
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mt-14 scroll-mt-32">
        <SectionHeading
          eyebrow="Tim Dokter"
          title="Penanggung jawab pelayanan"
          description="Data dokter diambil langsung dari database SIMRS untuk menampilkan tenaga medis aktif beserta foto pegawai jika tersedia."
          centered
        />
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => slideDoctors('prev')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[#d84f86]/30 hover:text-[#b73567]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => slideDoctors('next')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[#d84f86]/30 hover:text-[#b73567]"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <div
          ref={doctorSliderRef}
          className="mt-5 flex gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {bootstrap.doctorHighlights.map((doctor) => (
            <div
              key={doctor.code || doctor.name}
              data-doctor-card
              className="min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm shadow-slate-200/40 md:min-w-[300px] md:max-w-[300px]"
            >
              <div className="aspect-[4/4.3] overflow-hidden bg-slate-100">
                <img
                  src={doctor.photo_url || doctorPlaceholder}
                  alt={doctor.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = doctorPlaceholder;
                  }}
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                  {doctor.specialty}
                </p>
                <h3 className="mt-3 font-display text-[1.55rem] font-semibold leading-tight text-slate-900">
                  {doctor.name}
                </h3>
                <Link
                  to="/profil-dokter"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#b73567]"
                >
                  Lihat Semua Dokter
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-14">
        <SectionHeading
          eyebrow="Berita & Informasi"
          title="Berita dan informasi terbaru"
          description="Artikel terbaru dibaca langsung dari tabel `mlite_news` sehingga pembaruan CMS otomatis muncul di halaman depan."
          centered
        />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {bootstrap.latestNews.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition hover:-translate-y-1 hover:shadow-lg">
              <img src={article.cover_url} alt={article.title} className="h-56 w-full object-cover" />
              <div className="p-7">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                  {formatDate(article.published_at)}
                </div>
                <h3 className="mt-4 font-display text-[1.45rem] font-semibold leading-tight text-slate-900">
                  {truncateText(article.title, 30)}
                </h3>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  {truncateHtml(article.intro || article.content, 160)}
                </p>
                <Link to={`/news/${article.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff3f8] px-4 py-2 text-xs font-semibold text-[#b73567]">
                  Baca Selengkapnya
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/news" className="inline-flex items-center gap-2 rounded-full bg-[#d84f86] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c43d72]">
            Semua Berita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container mt-14">
        <div className="grid gap-6 rounded-[2rem] bg-[#0f5f4f] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)] px-8 py-10 text-white shadow-lg shadow-emerald-900/20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Download & Pengaduan</p>
            <h2 className="mt-3 font-display text-[2.35rem] font-semibold">APAM Barabai dan kanal layanan digital RSHD</h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-emerald-50/85">
              Unduh aplikasi APAM Barabai, akses informasi penting, dan gunakan kanal pengaduan resmi untuk komunikasi cepat dengan rumah sakit.
            </p>
          </div>
          <div className="grid gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=com.rshdbarabai.apam"
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.5rem] bg-white px-5 py-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Download APAM di Play Store
            </a>
            <Link to="/pengaduan" className="rounded-[1.5rem] bg-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
              Buka Halaman Pengaduan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
