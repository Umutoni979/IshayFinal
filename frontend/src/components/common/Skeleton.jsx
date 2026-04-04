// Base animated skeleton block
const Bone = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

// ── Presets ────────────────────────────────────────────────────

// Single table row
const TableRow = ({ cols = 4 }) => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-0">
    {Array.from({ length: cols }).map((_, i) => (
      <Bone key={i} className={`h-4 ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'flex-1'}`} />
    ))}
  </div>
);

// Table with N rows
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="border border-gray-200 rounded-sm overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => <TableRow key={i} cols={cols} />)}
  </div>
);

// Card grid (e.g. productions)
export const CardsSkeleton = ({ count = 3 }) => (
  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 min-h-[200px] flex flex-col gap-4 animate-pulse">
        <Bone className="w-11 h-11 rounded-xl" />
        <Bone className="h-3 w-20 mt-auto" />
        <Bone className="h-5 w-3/4" />
        <Bone className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

// List of notification / role items
export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse flex flex-col gap-2">
        <Bone className="h-4 w-1/3" />
        <Bone className="h-3 w-2/3" />
        <Bone className="h-3 w-16" />
      </div>
    ))}
  </div>
);

// Detail page (member / production)
export const DetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-center gap-4">
      <Bone className="w-16 h-16 rounded-full" />
      <div className="flex flex-col gap-2 flex-1">
        <Bone className="h-5 w-40" />
        <Bone className="h-3 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <Bone className="h-3 w-20" />
          <Bone className="h-4 w-32" />
        </div>
      ))}
    </div>
    <TableSkeleton rows={3} cols={3} />
  </div>
);

// Inline small (inside a section)
export const InlineSkeleton = ({ rows = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 animate-pulse">
        <div className="flex flex-col gap-1.5">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
        <Bone className="h-3 w-16" />
      </div>
    ))}
  </div>
);

export default Bone;
