"use client";

import Link from "next/link";
import { useState } from "react";

type Flag = {
  name: string;
  description: string;
  environment: string;
  rollout: string;
  updated: string;
  active: boolean;
  tone: string;
};

const initialFlags: Flag[] = [
  {
    name: "checkout-redesign",
    description: "New checkout experience",
    environment: "Production",
    rollout: "25% rollout",
    updated: "9 min ago",
    active: true,
    tone: "orange",
  },
  {
    name: "new-search-api",
    description: "Faster search infrastructure",
    environment: "Staging",
    rollout: "100% rollout",
    updated: "42 min ago",
    active: true,
    tone: "blue",
  },
  {
    name: "billing-portal",
    description: "Self-serve billing portal",
    environment: "Production",
    rollout: "Internal only",
    updated: "2 hours ago",
    active: true,
    tone: "green",
  },
  {
    name: "smart-recommendations",
    description: "Personalized recommendations",
    environment: "Development",
    rollout: "Off",
    updated: "Yesterday",
    active: false,
    tone: "purple",
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="nav-svg" aria-hidden="true">
      {children}
    </span>
  );
}
function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
      <path d="M5 15 15 5M7 5h8v8" />
    </svg>
  );
}

export default function Dashboard() {
  const [flags, setFlags] = useState(initialFlags);
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const visibleFlags = flags.filter((flag) =>
    `${flag.name} ${flag.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const activeCount = flags.filter((flag) => flag.active).length;

  function toggleFlag(index: number) {
    setFlags((current) =>
      current.map((flag, flagIndex) =>
        flagIndex === index
          ? {
              ...flag,
              active: !flag.active,
              rollout: flag.active ? "Off" : "25% rollout",
              updated: "Just now",
            }
          : flag,
      ),
    );
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <Link
          href="https://flaggable.dev"
          className="brand brand-dark"
          aria-label="flaggable.dev home"
        >
          <span className="brand-mark">
            f<span>.</span>
          </span>
          <span>
            flaggable<span className="brand-domain">.dev</span>
          </span>
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-avatar">A</span>
          <span>
            <b>Acme</b>
            <small>Personal workspace</small>
          </span>
          <span className="chevron">⌄</span>
        </div>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="app-nav">
          <Link href="/dashboard" className="app-nav-item active">
            <Icon>◈</Icon>Overview
          </Link>
          <Link href="#flags" className="app-nav-item">
            <Icon>◇</Icon>Feature flags{" "}
            <span className="nav-count">{flags.length}</span>
          </Link>
          <Link href="#environments" className="app-nav-item">
            <Icon>⌁</Icon>Environments
          </Link>
        </nav>
        <div className="sidebar-section-label">Manage</div>
        <nav className="app-nav">
          <Link href="#activity" className="app-nav-item">
            <Icon>◌</Icon>Activity
          </Link>
          <Link href="#settings" className="app-nav-item">
            <Icon>⊙</Icon>Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>
            <b>All systems operational</b>
            <small>Updated 2 min ago</small>
          </span>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div className="breadcrumb">
            Acme <span>/</span> Overview
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              ♢<i />
            </button>
            <span className="header-divider" />
            <div className="user-avatar">AL</div>
            <span className="user-name">Alex Lee</span>
            <span className="chevron">⌄</span>
          </div>
        </header>
        <div className="dashboard-inner">
          <div className="dashboard-title-row">
            <div>
              <p className="dashboard-kicker">MONDAY, MAY 12, 2025</p>
              <h1>Good morning, Alex.</h1>
              <p className="dashboard-subtitle">
                Here&apos;s what&apos;s moving across your workspace.
              </p>
            </div>
            <button type="button" className="button button-primary">
              <span>+</span> New flag
            </button>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <span>Active flags</span>
              <strong>{activeCount}</strong>
              <small>
                <b className="green-text">↑ 2</b> this week
              </small>
            </div>
            <div className="summary-item">
              <span>Currently rolling out</span>
              <strong>3</strong>
              <small>
                <b className="blue-text">Across 2</b> environments
              </small>
            </div>
            <div className="summary-item">
              <span>Changes this week</span>
              <strong>18</strong>
              <small>
                <b className="orange-text">↑ 12%</b> vs last week
              </small>
            </div>
            <div className="summary-health">
              <span className="online-dot" />
              <div>
                <b>All systems operational</b>
                <small>Last checked 2 min ago</small>
              </div>
            </div>
          </div>
          <div className="dashboard-grid" id="flags">
            <section className="flags-panel">
              <div className="panel-heading">
                <div>
                  <h2>Feature flags</h2>
                  <p>Manage and monitor your releases.</p>
                </div>
                <Link href="#all-flags" className="panel-link">
                  View all <ArrowUpRight />
                </Link>
              </div>
              <div className="flag-toolbar">
                <div className="search-field">
                  <span>⌕</span>
                  <input
                    aria-label="Search flags"
                    placeholder="Search flags"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <button type="button" className="filter-button">
                  All environments <span>⌄</span>
                </button>
              </div>
              <div className="flags-table">
                <div className="flag-row table-heading">
                  <span>Flag</span>
                  <span>Environment</span>
                  <span>Rollout</span>
                  <span>Updated</span>
                  <span />
                </div>
                {visibleFlags.map((flag) => {
                  const originalIndex = flags.indexOf(flag);
                  return (
                    <button
                      type="button"
                      className={`flag-row ${selected === originalIndex ? "selected" : ""}`}
                      key={flag.name}
                      onClick={() => setSelected(originalIndex)}
                    >
                      <span className="flag-name">
                        <i className={`status-dot ${flag.tone}`} />
                        <span>
                          <b>{flag.name}</b>
                          <small>{flag.description}</small>
                        </span>
                      </span>
                      <span className="environment">
                        <i className="env-dot" />
                        {flag.environment}
                      </span>
                      <span>
                        <span
                          className={`rollout-pill ${flag.active ? "on" : "off"}`}
                        >
                          <i />
                          {flag.rollout}
                        </span>
                      </span>
                      <span className="updated">{flag.updated}</span>
                      <span className="row-arrow">→</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="activity-panel" id="activity">
              <div className="panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>The latest changes in your workspace.</p>
                </div>
                <Link href="#activity" className="panel-link">
                  View all <ArrowUpRight />
                </Link>
              </div>
              <div className="activity-list">
                <div className="activity-day">TODAY</div>
                <ActivityItem
                  icon="↗"
                  tone="orange"
                  title="checkout-redesign"
                  body="Enabled for 25% of production"
                  actor="You"
                  time="9 min ago"
                />
                <ActivityItem
                  icon="↑"
                  tone="blue"
                  title="new-search-api"
                  body="Promoted from development to staging"
                  actor="Maya Chen"
                  time="42 min ago"
                />
                <ActivityItem
                  icon="◉"
                  tone="green"
                  title="billing-portal"
                  body="Enabled for internal users"
                  actor="You"
                  time="2 hours ago"
                />
                <div className="activity-day yesterday">YESTERDAY</div>
                <ActivityItem
                  icon="⊘"
                  tone="purple"
                  title="smart-recommendations"
                  body="Disabled in development"
                  actor="Jordan Kim"
                  time="Yesterday"
                />
              </div>
            </aside>
          </div>
          <section className="change-inspector" id="environments">
            <div className="inspector-label">SELECTED FLAG</div>
            <div className="inspector-content">
              <div>
                <h2>{flags[selected].name}</h2>
                <p>
                  {flags[selected].description} · Last changed{" "}
                  {flags[selected].updated.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                className={`toggle ${flags[selected].active ? "on" : ""}`}
                aria-label={`Turn ${flags[selected].active ? "off" : "on"} ${flags[selected].name}`}
                onClick={() => toggleFlag(selected)}
              >
                <span />
              </button>
              <span className="inspector-action">
                {flags[selected].active
                  ? "Live in production"
                  : "Currently off"}
              </span>
              <button type="button" className="button button-quiet">
                Edit flag <ArrowUpRight />
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ActivityItem({
  icon,
  tone,
  title,
  body,
  actor,
  time,
}: {
  icon: string;
  tone: string;
  title: string;
  body: string;
  actor: string;
  time: string;
}) {
  return (
    <div className="activity-item">
      <span className={`activity-icon ${tone}`}>{icon}</span>
      <div>
        <b>{title}</b>
        <p>{body}</p>
        <small>
          {actor} · {time}
        </small>
      </div>
    </div>
  );
}
