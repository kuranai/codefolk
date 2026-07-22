import { useMemo, useState } from "react";

type Member = { id: number; name: string; role: "maker" | "guide" };

export function CodefolkRoster({ members }: { members: readonly Member[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => members.filter(({ name }) => name.toLowerCase().includes(query.toLowerCase())),
    [members, query]
  );

  return (
    <section aria-label="Codefolk roster">
      <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
      {visible.map((member) => <strong key={member.id}>{member.name}</strong>)}
    </section>
  );
}
