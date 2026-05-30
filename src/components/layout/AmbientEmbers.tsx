import { useMemo } from 'react';

export function AmbientEmbers() {
  const embers = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${Math.round((((index * 37) % 100) + ((index * 19) % 13)) % 100)}%`,
        delay: `${((index * 0.37) % 4.4).toFixed(2)}s`,
        duration: `${9.5 + ((index * 1.17) % 7.2)}s`,
        driftStart: `${-48 + ((index * 17) % 96)}px`,
        driftEnd: `${-140 + ((index * 29) % 280)}px`,
        rise: `${72 + ((index * 11) % 36)}vh`,
        size: `${8 + ((index * 5) % 18)}px`,
        opacity: `${0.18 + ((index * 0.07) % 0.36)}`
      })),
    []
  );

  return (
    <div className="embers" aria-hidden="true">
      {embers.map((ember) => (
        <span
          key={ember.id}
          className="ember"
          style={
            {
              '--ember-left': ember.left,
              '--ember-delay': ember.delay,
              '--ember-duration': ember.duration,
              '--ember-drift-start': ember.driftStart,
              '--ember-drift-end': ember.driftEnd,
              '--ember-rise': ember.rise,
              '--ember-size': ember.size,
              '--ember-opacity': ember.opacity
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
