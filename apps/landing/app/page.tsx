import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDot,
  Flag,
  Grid2X2,
  Layers,
  Plus,
  Settings,
} from "lucide-react";

import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";

const MAIN_APP_URL = process.env.MAIN_APP_URL ?? "http://localhost:3000";

function ActivityMini({
  title,
  detail,
  time,
  tone,
}: {
  title: string;
  detail: string;
  time: string;
  tone: string;
}) {
  return (
    <div className="mini-activity">
      <span className={`status-dot ${tone}`} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="landing-nav shell">
        <Link href="/" className="brand brand-light" aria-label="flaggable.dev home">
          <span className="brand-mark">
            f<span>.</span>
          </span>
          <span>
            flaggable<span className="brand-domain">.dev</span>
          </span>
        </Link>
        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#activity">Activity</a>
          <a href={`${MAIN_APP_URL}/auth/login?screen_hint=signup`}>Sign up</a>
          <a href={`${MAIN_APP_URL}/auth/login`}>Log in</a>
          <Button asChild variant="light" size="sm" className="button button-light button-small">
            <a href={`${MAIN_APP_URL}/dashboard`}>
              Start now <ArrowUpRight />
            </a>
          </Button>
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow eyebrow-light">
            <span className="eyebrow-line" /> Feature flags, without the fog
          </p>
          <h1>
            Ship the change.
            <br />
            <em>See what happens.</em>
          </h1>
          <p className="hero-description">
            flaggable.dev gives developers and product managers one calm place to control releases,
            follow rollouts, and move with confidence.
          </p>
          <div className="hero-actions">
            <Button asChild variant="accent" size="lg" className="button button-accent">
              <a href={`${MAIN_APP_URL}/dashboard`}>
                Start now <ArrowUpRight />
              </a>
            </Button>
            <a href="#how-it-works" className="text-link light-link">
              See how it works <span>↓</span>
            </a>
          </div>
          <div className="hero-proof">
            <span className="proof-mark">
              <Check aria-hidden="true" />
            </span>
            <span>Built for teams that ship often</span>
          </div>
        </div>

        <div className="hero-console" role="img" aria-label="Preview of the flaggable dashboard">
          <div className="console-topbar">
            <div className="console-brand">
              <span className="brand-mark">
                f<span>.</span>
              </span>{" "}
              flaggable
            </div>
            <span className="console-context">Acme / Production</span>
            <div className="console-avatar">AL</div>
          </div>
          <div className="console-body">
            <aside className="console-sidebar">
              <div className="console-sidebar-label">Workspace</div>
              <div className="console-nav active">
                <span className="nav-icon">
                  <Grid2X2 aria-hidden="true" />
                </span>{" "}
                Overview
              </div>
              <div className="console-nav">
                <span className="nav-icon">
                  <Flag aria-hidden="true" />
                </span>{" "}
                Feature flags <b>12</b>
              </div>
              <div className="console-nav">
                <span className="nav-icon">
                  <Layers aria-hidden="true" />
                </span>{" "}
                Environments
              </div>
              <div className="console-sidebar-label second">Manage</div>
              <div className="console-nav">
                <span className="nav-icon">
                  <CircleDot aria-hidden="true" />
                </span>{" "}
                Activity
              </div>
              <div className="console-nav">
                <span className="nav-icon">
                  <Settings aria-hidden="true" />
                </span>{" "}
                Settings
              </div>
              <div className="console-sidebar-bottom">
                <span className="online-dot" /> All systems operational
              </div>
            </aside>
            <div className="console-main">
              <div className="console-heading">
                <div>
                  <span className="console-kicker">MONDAY, MAY 12</span>
                  <h2>Good morning, Alex.</h2>
                </div>
                <Badge className="console-add">
                  <Plus aria-hidden="true" /> New flag
                </Badge>
              </div>
              <div className="console-summary">
                <div>
                  <strong>12</strong>
                  <span>Active flags</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>In rollout</span>
                </div>
                <div>
                  <strong className="green-text">0</strong>
                  <span>Needs attention</span>
                </div>
              </div>
              <div className="console-activity-head">
                <strong>Recent changes</strong>
                <span>View all →</span>
              </div>
              <div className="console-activity-list">
                <ActivityMini
                  title="checkout-redesign"
                  detail="Enabled for 25% of production"
                  time="9m"
                  tone="orange"
                />
                <ActivityMini
                  title="new-search-api"
                  detail="Promoted to staging"
                  time="42m"
                  tone="blue"
                />
                <ActivityMini
                  title="billing-portal"
                  detail="Enabled for internal users"
                  time="2h"
                  tone="green"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-strip shell" id="activity">
        <div className="signal-label">
          <span className="signal-pulse" /> The signal, in context
        </div>
        <p>Every change leaves a clear trail—from first toggle to full rollout.</p>
        <ChevronDown className="signal-arrow" aria-hidden="true" />
      </section>

      <section className="how-section shell" id="how-it-works">
        <div className="section-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" /> A better release rhythm
          </p>
          <h2>
            Less guessing.
            <br />
            <span>More shipping.</span>
          </h2>
        </div>
        <div className="principles">
          <article className="principle">
            <span className="principle-number">01</span>
            <h3>Make the call</h3>
            <p>
              Give every feature a deliberate on/off switch. Keep release control close to the
              people who know the work.
            </p>
          </article>
          <article className="principle highlighted-principle">
            <span className="principle-number">02</span>
            <h3>Watch the move</h3>
            <p>
              See rollout changes as they happen, with the environment and audience context attached
              to every update.
            </p>
          </article>
          <article className="principle">
            <span className="principle-number">03</span>
            <h3>Keep momentum</h3>
            <p>
              When the signal is good, move forward. When it is not, roll back cleanly and know
              exactly what changed.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-cta shell">
        <div>
          <p className="eyebrow eyebrow-light">
            <span className="eyebrow-line" /> Your next release
          </p>
          <h2>Make it visible.</h2>
        </div>
        <Button asChild variant="accent" size="lg" className="button button-accent button-large">
          <a href={`${MAIN_APP_URL}/auth/login?screen_hint=signup`}>
            Sign up <ArrowUpRight />
          </a>
        </Button>
      </section>

      <footer className="landing-footer shell">
        <Link href="/" className="brand brand-light">
          <span className="brand-mark">
            f<span>.</span>
          </span>{" "}
          flaggable<span className="brand-domain">.dev</span>
        </Link>
        <span>Feature flags for people who ship.</span>
        <span>© 2025 flaggable.dev</span>
      </footer>
    </main>
  );
}
