interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="mb-4">
      {/* Blue Header Bar */}
      <div 
        className="rounded-t-[2rem] h-8 flex items-center px-6"
        style={{ 
          background: 'linear-gradient(to right, #1e6e99, #2a8ab8)' 
        }}
      >
        <h1 className="text-white font-semibold text-sm">{title}</h1>
      </div>
    </div>
  );
}
