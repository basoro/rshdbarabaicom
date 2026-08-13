import mysql, { type RowDataPacket } from 'mysql2/promise';

type DoctorRow = RowDataPacket & {
  kd_dokter: string;
  nm_dokter: string;
  jk: 'L' | 'P' | null;
  kd_sps: string | null;
  nip: string | null;
  nm_sps: string | null;
  pegawai_nik: string | null;
  pegawai_nama: string | null;
  pegawai_photo: string | null;
};

export type DoctorProfile = {
  code: string;
  name: string;
  specialty: string;
  gender: 'L' | 'P' | null;
  photo_path: string | null;
  photo_url: string;
};

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

function resolveDoctorPhotoPath(photoPath: string | null): string | null {
  if (!photoPath) return null;
  if (!/\.(png|jpe?g|webp|gif)$/i.test(photoPath)) {
    return null;
  }

  return photoPath.replace(/^\/+/, '');
}

function buildDoctorFallback(name: string, specialty: string, gender: 'L' | 'P' | null): string {
  const description =
    gender === 'P'
      ? 'female doctor portrait'
      : gender === 'L'
        ? 'male doctor portrait'
        : 'professional doctor portrait';

  const prompt = encodeURIComponent(
    `${description}, Indonesian hospital specialist, ${specialty}, white coat, green medical background, realistic editorial photography`,
  );

  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3`;
}

export async function getFeaturedDoctors(limit = 8): Promise<DoctorProfile[]> {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
    return [];
  }

  try {
    const [rows] = await getPool().query<DoctorRow[]>(
      `
        SELECT
          d.kd_dokter,
          d.nm_dokter,
          d.jk,
          d.kd_sps,
          d.nip,
          s.nm_sps,
          COALESCE(pk.nik, pn.nik, pm.nik) AS pegawai_nik,
          COALESCE(pk.nama, pn.nama, pm.nama) AS pegawai_nama,
          COALESCE(pk.photo, pn.photo, pm.photo) AS pegawai_photo
        FROM dokter d
        LEFT JOIN spesialis s ON s.kd_sps = d.kd_sps
        LEFT JOIN pegawai pk ON pk.nik = d.kd_dokter
        LEFT JOIN pegawai pn ON d.nip IS NOT NULL AND d.nip != '' AND pn.nik = d.nip
        LEFT JOIN pegawai pm ON pm.nama = d.nm_dokter
        WHERE d.status = '1' AND d.nm_dokter IS NOT NULL AND d.nm_dokter != '-'
        ORDER BY
          CASE WHEN COALESCE(pk.photo, pn.photo, pm.photo) IS NOT NULL AND COALESCE(pk.photo, pn.photo, pm.photo) != '' THEN 0 ELSE 1 END,
          d.nm_dokter ASC
        LIMIT ?
      `,
      [limit * 3],
    );

    const uniqueDoctors = new Map<string, DoctorProfile>();

    for (const row of rows) {
      if (uniqueDoctors.has(row.kd_dokter)) {
        continue;
      }

      const photoPath = resolveDoctorPhotoPath(row.pegawai_photo);

      uniqueDoctors.set(row.kd_dokter, {
        code: row.kd_dokter,
        name: row.nm_dokter.trim().replace(/\s+/g, ' '),
        specialty: (row.nm_sps || 'Dokter Spesialis').trim(),
        gender: row.jk,
        photo_path: photoPath,
        photo_url: photoPath
          ? `/api/public/media/pegawai?path=${encodeURIComponent(photoPath)}`
          : buildDoctorFallback(row.nm_dokter, row.nm_sps || 'Dokter', row.jk),
      });
    }

    return Array.from(uniqueDoctors.values())
      .sort((left, right) => {
        const leftHasRealPhoto = left.photo_path ? 1 : 0;
        const rightHasRealPhoto = right.photo_path ? 1 : 0;

        if (leftHasRealPhoto !== rightHasRealPhoto) {
          return rightHasRealPhoto - leftHasRealPhoto;
        }

        return left.name.localeCompare(right.name, 'id');
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}
