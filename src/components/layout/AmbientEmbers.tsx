export function AmbientEmbers() {
  return (
    <div className="embers" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="ember"
          style={
            {
              '--ember-left': `${8 + index * 7}%`,
              '--ember-delay': `${index * 0.8}s`,
              '--ember-size': `${8 + (index % 3) * 6}px`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
