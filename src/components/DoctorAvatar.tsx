type DoctorAvatarProps = {
  name: string;
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
};

const titlePattern = /^(drg?|prof|apt|bidan|perawat)\.?$/i;

export function getDoctorInitials(name: string): string {
  const words = name
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/\.+$/g, '').trim())
    .filter(Boolean)
    .filter((word) => !titlePattern.test(word));

  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return initials || 'DR';
}

export default function DoctorAvatar({
  name,
  src,
  alt,
  className = '',
  imageClassName = '',
}: DoctorAvatarProps) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-100 via-teal-50 to-slate-100 ${className}`}>
      <div className="absolute inset-0 grid place-items-center" aria-hidden={Boolean(src)}>
        <span className="font-display text-6xl font-semibold tracking-[0.12em] text-emerald-700/80">
          {getDoctorInitials(name)}
        </span>
      </div>
      {src ? (
        <img
          src={src}
          alt={alt || `Foto ${name}`}
          className={`relative h-full w-full object-cover ${imageClassName}`}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
    </div>
  );
}
