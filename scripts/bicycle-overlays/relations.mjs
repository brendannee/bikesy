export const compareIds = (a, b) =>
  BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;

/** Expand bicycle routes only. Membership never grants bicycle access. */
export function indexRelations(
  relations,
  { maxDepth = 8, maxMemberships = 1_000_000 } = {},
) {
  const byId = new Map();
  for (const relation of relations) {
    if (
      byId.has(relation.id) &&
      JSON.stringify(byId.get(relation.id)) !== JSON.stringify(relation)
    )
      throw new Error(`Conflicting duplicate relation ${relation.id}.`);
    byId.set(relation.id, relation);
  }
  const ways = new Map();
  const warnings = new Map();
  let count = 0;
  const warn = (s) => warnings.set(s, (warnings.get(s) ?? 0) + 1);
  for (const root of [...byId.values()].sort((a, b) => compareIds(a.id, b.id))) {
    const walk = (
      relation,
      path,
      role = '',
      inheritedInactive = false,
      inheritedConditional = false,
    ) => {
      if (path.has(relation.id)) {
        warn('relation_cycle');
        return;
      }
      if (path.size >= maxDepth)
        throw new Error(
          `Nested relation depth exceeds ${maxDepth}; input is incomplete under this limit.`,
        );
      const next = new Set([...path, relation.id]);
      const inactive =
        inheritedInactive ||
        ['proposed', 'construction', 'disused', 'abandoned'].some(
          (state) =>
            relation.tags.state === state ||
            relation.tags.status === state ||
            relation.tags[state] === 'yes',
        );
      const conditionalPath =
        inheritedConditional ||
        Object.keys(relation.tags).some((k) => k.includes(':conditional'));
      for (const member of relation.members) {
        const effectiveRole = [role, member.role].filter(Boolean).join('/');
        if (member.type === 'r') {
          const child = byId.get(member.ref);
          if (child) walk(child, next, effectiveRole, inactive, conditionalPath);
          else warn('missing_or_non_bicycle_child_relation');
        } else if (member.type === 'w') {
          if (++count > maxMemberships)
            throw new Error(`Route memberships exceed ${maxMemberships}.`);
          const entry = {
            id: root.id,
            network: root.tags.network ?? null,
            ref: root.tags.ref ?? null,
            name: root.tags.name ?? null,
            state: root.tags.state ?? root.tags.status ?? null,
            type: root.tags.type ?? null,
            role: effectiveRole,
            inactive,
            conditional_path: conditionalPath,
            conditional: Object.fromEntries(
              Object.entries(root.tags).filter(([k]) => k.includes(':conditional')),
            ),
          };
          if (!ways.has(member.ref)) ways.set(member.ref, new Map());
          ways
            .get(member.ref)
            .set(`${root.id}:${effectiveRole}:${inactive}:${conditionalPath}`, entry);
        }
      }
    };
    walk(root, new Set());
  }
  return {
    ways: new Map(
      [...ways].map(([id, entries]) => [
        id,
        [...entries.values()].sort(
          (a, b) => compareIds(a.id, b.id) || a.role.localeCompare(b.role),
        ),
      ]),
    ),
    warnings: Object.fromEntries(warnings),
    expandedMemberships: count,
  };
}
