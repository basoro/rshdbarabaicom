type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-xs font-bold uppercase tracking-[0.42em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[2.25rem] font-semibold leading-tight text-slate-900 md:text-[2.65rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-[15px] leading-7 text-slate-600 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
