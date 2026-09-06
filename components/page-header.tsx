export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="pt-9">
      <h1 className="text-[22px] font-bold text-[#2F2528]">{title}</h1>
      {subtitle && (
        <p className="font-display mt-1.5 text-[15px] text-[#B79A90]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
