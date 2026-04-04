const BrandLogo = ({ dark = false }) => (
  <div className="flex items-center gap-2">
    <img src="/src/assets/images/logo.png" alt="Ishya" className="w-10 h-10" />
    <div>
      <div className="flex items-baseline">
        <span className="text-[30px] font-black text-gray-600 text-center leading-tight tracking-tight">
          Ishyaculture
        </span>
        <span className="text-[30px] font-black text-slate-400 text-center leading-tight tracking-tight">
          troup
        </span>
      </div>
    </div>
  </div>
);

export default BrandLogo;
