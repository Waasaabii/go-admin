import { SectionCard } from "@suiyuan/ui-admin";

type ToolLinkPageProps = {
  title: string;
  description: string;
  kicker?: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
  notes: string[];
};

export function ToolLinkPage({
  title,
  description,
  kicker = "Dev Tool",
  links,
  notes,
}: ToolLinkPageProps) {
  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>{kicker}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="tool-grid">
        {links.map((link) => (
          <SectionCard key={link.href} title={link.label} description={link.note}>
            <div className="tool-link-stack">
              <a className="primary-action tool-link-anchor" href={link.href} rel="noreferrer" target="_blank">
                打开页面
              </a>
              <code>{link.href}</code>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="当前阶段说明" description="这些工具页先作为可达入口保留，后续再决定是否完全 React 化。">
        <ul className="detail-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
