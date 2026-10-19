export function Bars({ items }: { items: { name: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="bars">
      {items.map((g) => (
        <div className="bar" key={g.name}>
          <span>{g.name}</span>
          <div className="track" role="img" aria-label={`${g.name}: ${g.count}`}><div className="fill" style={{ width: `${(g.count / max) * 100}%` }} /></div>
          <em>{g.count}</em>
        </div>
      ))}
    </div>
  );
}
