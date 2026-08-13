export const SITE_ORIGIN = 'https://www.rshdbarabai.com';

export const heroSlides = [
  {
    eyebrow: 'RSUD H. Damanhuri',
    title: 'Smart, Green and Friendly Hospital',
    description:
      'Pemanfaatan teknologi inovatif untuk meningkatkan kualitas perawatan dan pengalaman pasien.',
    actionLabel: 'Lihat Video',
    actionUrl: 'https://youtu.be/KTvrVGD0yeo',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=indonesian%20regional%20hospital%20facade%2C%20green%20branding%2C%20modern%20healthcare%20campus%2C%20sunrise%20lighting%2C%20realistic%20editorial%20photography&image_size=landscape_16_9',
  },
  {
    eyebrow: 'RSUD H. Damanhuri',
    title: 'Ramah Anak dan Ibu Menyusui',
    description:
      'Ruang bermain anak yang aman serta area menyusui yang nyaman untuk keluarga pasien.',
    actionLabel: 'Lihat Video',
    actionUrl: 'https://youtu.be/l-dLJOguwZI',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=child-friendly%20hospital%20interior%2C%20bright%20pediatric%20clinic%2C%20soft%20green%20and%20cream%20tones%2C%20realistic%20editorial%20photography&image_size=landscape_16_9',
  },
  {
    eyebrow: 'RSUD H. Damanhuri',
    title: 'Salam, Senyum, Sopan, Santun, Segera',
    description:
      'Layanan berkarakter, ikhlas, dan berakhlak dengan semangat 5S di seluruh area rumah sakit.',
    actionLabel: 'Lihat Video',
    actionUrl: 'https://youtu.be/YnE-tv47VU8',
    image:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20indonesian%20hospital%20staff%20welcoming%20patients%2C%20friendly%20service%2C%20green%20medical%20branding%2C%20realistic%20editorial%20photography&image_size=landscape_16_9',
  },
];

export const homeStats = [
  { label: 'Kamar Inap', value: '274' },
  { label: 'Paramedis', value: '342' },
  { label: 'Dokter', value: '40' },
  { label: 'Tempat Tidur ICU', value: '14' },
];

export const featuredServices = [
  {
    title: 'Perawatan Intensif',
    description:
      'Dukungan dokter spesialis anestesi dan tim medis berpengalaman untuk pasien kritikal.',
    slug: 'icu',
  },
  {
    title: 'Cuci Darah',
    description:
      'Terapi pengganti fungsi ginjal dengan fasilitas hemodialisa yang terintegrasi.',
    slug: 'hemo',
  },
  {
    title: 'Medical Check Up',
    description:
      'Pemeriksaan kesehatan berkala untuk pencegahan penyakit dan pemetaan faktor risiko.',
    slug: 'mcu',
  },
  {
    title: 'Laboratorium',
    description:
      'Laboratorium terpadu dengan layanan patologi klinik, mikrobiologi, parasitologi, dan bank darah.',
    slug: 'laboratorium',
  },
];

export const quickLinks = [
  { label: 'Playstore APAM Barabai', url: 'https://play.google.com/store/apps/details?id=com.rshdbarabai.apam' },
  { label: 'Alur Pelayanan', slug: 'alur-pelayanan' },
  { label: 'Pengaduan', slug: 'pengaduan' },
  { label: 'Jadwal Dokter', slug: 'jadwal-dokter' },
  { label: 'FAQ', slug: 'faq' },
  { label: 'Ketersediaan Kamar', slug: 'bed' },
];

export const publicMenu = [
  {
    label: 'Beranda',
    href: '/',
  },
  {
    label: 'Tentang Kami',
    children: [
      { label: 'Profil', slug: 'profil' },
      { label: 'Visi Misi', slug: 'visi-misi' },
      { label: 'Akreditasi Rumah Sakit', slug: 'akreditasi' },
      { label: 'Zona Integritas', slug: 'zona-integritas' },
      { label: 'Maklumat Pelayanan', slug: 'maklumat-rshd' },
      { label: 'Standar Pelayanan', slug: 'standar-pelayanan' },
      { label: 'Struktur Organisasi dan Profil Manajemen', slug: 'struktur' },
      { label: 'Profil Dokter RSHD', slug: 'profil-dokter' },
      { label: 'Fasilitas Layanan', slug: 'fasilitas' },
      { label: 'Kepemilikan dan Perizinan', slug: 'kepemilikan' },
      { label: 'Peta Lokasi', slug: 'peta' },
    ],
  },
  {
    label: 'Layanan',
    children: [
      { label: 'IGD', slug: 'igd' },
      { label: 'Rawat Jalan', slug: 'rawat-jalan' },
      { label: 'Rawat Inap', slug: 'rawat-inap' },
      { label: 'Farmasi', slug: 'farmasi' },
      { label: 'Laboratorium', slug: 'laboratorium' },
      { label: 'Radiologi', slug: 'radiologi' },
      { label: 'Rehabilitasi Medik / Fisioterapi', slug: 'fisioterapi' },
      { label: 'ICU', slug: 'icu' },
      { label: 'Unit Hemodialisa', slug: 'hemo' },
      { label: 'Instalasi Gizi', slug: 'gizi' },
      { label: 'ICT', slug: 'ict' },
    ],
  },
  {
    label: 'Berita',
    href: '/news',
  },
  {
    label: 'Informasi',
    children: [
      { label: 'Alur Pelayanan', slug: 'alur-pelayanan' },
      { label: 'Pengaduan', slug: 'pengaduan' },
      { label: 'Kerjasama Pihak Ketiga', slug: 'kerjasama-pihak-ketiga' },
      { label: 'Jadwal Dokter', slug: 'jadwal-dokter' },
      { label: 'Jam Pelayanan dan Jam Berkunjung', slug: 'jam-pelayanan-berkunjung' },
      { label: 'Ketersediaan Kamar Inap', slug: 'bed' },
      { label: 'Stok Darah UTD RS', slug: 'stok-darah-utd' },
      { label: 'Informasi Tarif Akomodasi Rawat Inap', slug: 'infomasi-tarif-akomodasi-rawat-inap' },
      { label: 'Survey Kepuasan Masyarakat', slug: 'survey' },
      { label: 'FAQ', slug: 'faq' },
    ],
  },
  {
    label: 'Hubungi',
    slug: 'hubungi',
  },
  {
    label: 'Inovasi RSHD',
    slug: 'inovasi',
  },
  {
    label: 'Arsip Dokumen',
    href: '/arsip-dokumen',
  },
  {
    label: 'E-Lapor',
    href: 'https://www.lapor.go.id/instansi/pemerintah-kabupaten-hulu-sungai-tengah',
  },
];

export { resolveNewsCover, resolvePreviewCoverFromEnv } from './uploadPaths.js';

export function resolveArchiveUrl(filePath: string): string {
  if (/^https?:\/\//.test(filePath)) {
    return filePath;
  }

  if (filePath.startsWith('uploads/') || filePath.startsWith('/uploads/')) {
    return `/${filePath.replace(/^\/+/, '')}`;
  }

  return `${SITE_ORIGIN}/${filePath.replace(/^\/+/, '')}`;
}

export function resolveDoctorPhotoProxy(photoPath: string): string {
  return `/api/public/media/pegawai?path=${encodeURIComponent(photoPath.replace(/^\/+/, ''))}`;
}
