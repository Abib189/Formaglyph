import type { ReactNode } from "react";

export function FamilyProof({
  render,
}: {
  render: (size: number) => ReactNode;
}) {
  return (
    <section
      className="family-proof"
      aria-label="Family proof at actual CSS sizes"
    >
      <h3>Family proof</h3>
      <p>Rendered at actual CSS sizes</p>
      <div>
        {[16, 20, 24, 32].map((size) => (
          <figure key={size}>
            <span>{render(size)}</span>
            <figcaption>{size} px</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
