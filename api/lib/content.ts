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
      'https://rshdbarabai.com/themes/rshd/assets/img/hero/hero-01.jpg',
  },
  {
    eyebrow: 'RSUD H. Damanhuri',
    title: 'Ramah Anak dan Ibu Menyusui',
    description:
      'Ruang bermain anak yang aman serta area menyusui yang nyaman untuk keluarga pasien.',
    actionLabel: 'Lihat Video',
    actionUrl: 'https://youtu.be/l-dLJOguwZI',
    image:
      'https://rshdbarabai.com/themes/rshd/assets/img/hero/hero-02.jpg',
  },
  {
    eyebrow: 'RSUD H. Damanhuri',
    title: 'Salam, Senyum, Sopan, Santun, Segera',
    description:
      'Layanan berkarakter, ikhlas, dan berakhlak dengan semangat 5S di seluruh area rumah sakit.',
    actionLabel: 'Lihat Video',
    actionUrl: 'https://youtu.be/YnE-tv47VU8',
    image:
      'https://rshdbarabai.com/themes/rshd/assets/img/hero/hero-03.jpg',
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
      {
        label: 'Layanan Medis',
        slug: 'layanan-medis',
        children: [
          { label: 'IGD', slug: 'igd' },
          { label: 'Rawat Jalan', slug: 'rawat-jalan' },
          { label: 'Rawat Inap', slug: 'rawat-inap' },
        ],
      },
      {
        label: 'Penunjang Medis',
        slug: 'penunjang-medis',
        children: [
          { label: 'Farmasi', slug: 'farmasi' },
          { label: 'Laboratorium', slug: 'laboratorium' },
          { label: 'Radiologi', slug: 'radiologi' },
          { label: 'Rehabilitasi Medik / Fisioterapi', slug: 'fisioterapi' },
        ],
      },
      {
        label: 'Penunjang Klinik',
        slug: 'penunjang-klinik',
        children: [
          { label: 'ICU', slug: 'icu' },
          { label: 'Unit Hemodialisa', slug: 'hemo' },
          { label: 'Unit Transfusi Darah', slug: 'utd' },
          { label: 'Instalasi Gizi', slug: 'gizi' },
          { label: 'Instalasi CSSD (Central Sterile Supply Department)', slug: 'cssd' },
          { label: 'Instalasi Rekam Medik', slug: 'rekam-medik' },

        ],
      },
      {
        label: 'Penunjang Non Klinik',
        slug: 'penunjang-non-klinik',
        children: [
          { label: 'Instalasi Kesehatan Lingkungan', slug: 'kesling' },
          { label: 'Instalasi Pemeliharaan Sarana Prasarana Rumah Sakit', slug: 'ipsrs' },
          { label: 'Unit PKRS', slug: 'pkrs' },
          { label: 'Instalasi Pemulasaran Jenazah', slug: 'jenazah' },
          { label: 'Instalasi Pengolahan Air Limbah', slug: 'ipal' },
        ],
      },
      {
        label: 'Komite',
        slug: 'komite',
        children: [
          { label: 'Komite Medik', slug: 'komite-medik' },
          { label: 'Komite Keperawatan', slug: 'komite-keperawatan' },
          { label: 'Komite Tenaga Kesehatan Lainnya', slug: 'komite-lainnya' },
          { label: 'Komite Pencegahan dan Pengendalian Efeksi (PPE)', slug: 'ppi' },
        ],
      },
      { label: 'ICT', slug: 'ict' },
      { label: 'Security', slug: 'security' },
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
      {
        label: 'Laporan Penyelesaian Aduan',
        slug: 'laporan-penyelesaian-aduan',
        children: [
          { label: 'Penyelesaian Pengaduan 2023', slug: 'penyelesaian-aduan-2023' },
          { label: 'Penyelesaian Pengaduan 2024', slug: 'penyelesaian-aduan-2024' },
          { label: 'Penyelesaian Pengaduan 2025', slug: 'penyelesaian-aduan-2025' },
          { label: 'Penyelesaian Pengaduan 2026', slug: 'penyelesaian-aduan-2026' },
        ],
      },
      { 
        label: 'Laporan LKJIP dan RENJA',
        slug: 'laporan-lkjip-renja',
        children: [
          { label: 'LKJIP 2024', slug: 'lkjip2024' },
          { label: 'RENJA 2024', slug: 'renja2024' },
          { label: 'RENJA 2025', slug: 'renja2025' },
        ],
      },
      {
        label: 'Hasil Survei Persepsi Anti Korupsi',
        slug: 'hasil-survei-persepsi-anti-korupsi',
        children: [
          { label: 'Hasil Survei Persepsi Anti Korupsi 2023', slug: 'hasilzi2023' },
          { label: 'Hasil Survei Persepsi Anti Korupsi 2024', slug: 'hasilzi2024' },
          { label: 'Hasil Survei Persepsi Anti Korupsi 2025', slug: 'hasilzi2025' },
          { label: 'Hasil Survei Persepsi Anti Korupsi 2026', slug: 'hasilzi2026' },
        ],
      },
      {
        label: 'Indeks Kepuasan Masyarakat (IKM)',
        slug: 'ikm',
        children: [
          { label: 'IKM 2021', slug: 'ikm2021' },
          { label: 'IKM 2022', slug: 'ikm2022' },
          { label: 'IKM 2023', slug: 'ikm2023' },
          { label: 'IKM 2024', slug: 'ikm2024' },
          { label: 'IKM 2025', slug: 'ikm2025' },
          { label: 'IKM 2026', slug: 'ikm2026' },
        ],
      },
      { label: 'Jadwal Dokter', slug: 'jadwal-dokter' },
      { label: 'Jam Pelayanan dan Jam Berkunjung', slug: 'jam-pelayanan-berkunjung' },
      { label: 'Ketersediaan Kamar Inap', slug: 'bed' },
      { label: 'Stok Darah UTD RS', slug: 'stok-darah-utd' },
      { label: 'Informasi Tarif Akomodasi Rawat Inap', slug: 'infomasi-tarif-akomodasi-rawat-inap' },
      { label: 'Survey Kepuasan Masyarakat', slug: 'survey' },
      { label: 'Frequently Asked Questions (FAQ)', slug: 'faq' },
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
