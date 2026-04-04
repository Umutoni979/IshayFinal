const PageHeader = ({ icon: Icon, title, description, color = 'bg-orange-500', actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
        <Icon size={28} strokeWidth={1.8} />
      </div>
      <div>
        <h1 className="text-2xl font-black text-slate-800 leading-tight">{title}</h1>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 self-center">{actions}</div>}
  </div>
);

export default PageHeader;
