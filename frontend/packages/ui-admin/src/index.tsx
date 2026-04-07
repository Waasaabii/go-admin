import { type PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

import type { AppMenuNode } from "@suiyuan/types";

type IdentityCardProps = {
  avatar: string;
  name: string;
  roleName: string;
  tenantCode: string;
};

type TreeNavProps = {
  menuTree: AppMenuNode[];
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function AdminShell({ sidebar, children }: PropsWithChildren<{ sidebar: React.ReactNode }>) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">{sidebar}</aside>
      <main className="admin-panel">{children}</main>
    </div>
  );
}

export function BrandBlock() {
  return (
    <div>
      <div className="brand-kicker">Suiyuan Console</div>
      <h1 className="brand-title">现代化运营工作台</h1>
    </div>
  );
}

export function IdentityCard({ avatar, name, roleName, tenantCode }: IdentityCardProps) {
  return (
    <div className="identity-box">
      <div className="identity-avatar">{avatar ? <img alt={name} src={avatar} /> : name.slice(0, 1)}</div>
      <div className="identity-meta">
        <strong>{name}</strong>
        <span>
          {roleName} · 租户 {tenantCode}
        </span>
      </div>
    </div>
  );
}

function RecursiveNav({ nodes }: { nodes: AppMenuNode[] }) {
  return (
    <div className="nav-tree">
      {nodes
        .filter((node) => !node.hidden)
        .map((node) => (
          <div className="nav-node" key={node.id}>
            <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={node.fullPath}>
              <span>{node.title}</span>
              <small>{node.children.length || node.permission || "入口"}</small>
            </NavLink>
            {node.children.length > 0 ? (
              <div className="nav-children">
                <RecursiveNav nodes={node.children} />
              </div>
            ) : null}
          </div>
        ))}
    </div>
  );
}

export function TreeNav({ menuTree }: TreeNavProps) {
  return (
    <div>
      <p className="nav-section-title">导航树</p>
      <RecursiveNav nodes={menuTree} />
    </div>
  );
}

export function MetricGrid({ children }: PropsWithChildren) {
  return <div className="metric-grid">{children}</div>;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="admin-card metric-card">
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function SectionCard({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <section className="admin-card section-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </section>
  );
}
