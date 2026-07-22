function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLdScript({ id, data }: { id: string; data: unknown }) {
  return (
    <script id={id} type="application/ld+json">
      {serializeJsonLd(data)}
    </script>
  );
}
