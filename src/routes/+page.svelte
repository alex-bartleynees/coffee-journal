<script lang="ts">
  import TopBar from "$lib/components/TopBar.svelte";
  import Icon from "$lib/icons/Icon.svelte";
  import MethodIcon from "$lib/components/MethodIcon.svelte";
  import BrewDetail from "$lib/components/BrewDetail.svelte";
  import DetailActionMenu from "$lib/components/DetailActionMenu.svelte";
  import { journal } from "$lib/stores/journal.svelte";
  import { search } from "$lib/stores/search.svelte";
  import { beanById } from "$lib/data/sample";
  import { methodLabel } from "$lib/data/methods";
  import { averageRating } from "$lib/data/ratings";
  import {
    calendarDate,
    todayIso,
    daysBetween,
    parseIsoDate,
  } from "$lib/data/date";
  import type { CalendarDate } from "$lib/data/date";

  const beans = $derived(beanById(journal.beans));
  const brews = $derived(journal.brews);

  const groups = $derived(
    brews.reduce<Record<string, typeof brews>>((acc, b) => {
      (acc[b.date] ??= []).push(b);
      return acc;
    }, {}),
  );
  const sortedDates = $derived(
    Object.keys(groups)
      .map(calendarDate)
      .sort((a, b) => b.localeCompare(a)),
  );

  // Desktop split-pane: list stays on the left, detail renders inline on the
  // right instead of navigating. Mobile ignores this and navigates normally.
  let selectedBrewId = $state<string | undefined>(undefined);
  const effectiveSelectedId = $derived(
    selectedBrewId ??
      (sortedDates.length ? groups[sortedDates[0]][0].id : undefined),
  );
  const selectedBrew = $derived(
    brews.find((b) => b.id === effectiveSelectedId),
  );
  const selectedBean = $derived(
    selectedBrew ? beans[selectedBrew.beanId] : undefined,
  );
  const selectedGrinder = $derived(
    selectedBrew
      ? journal.grinders.find((g) => g.id === selectedBrew.grinder)
      : undefined,
  );
  const selectedMachine = $derived(
    selectedBrew?.machine
      ? journal.machines.find((m) => m.id === selectedBrew.machine)
      : undefined,
  );
  const selectedPrevBrew = $derived.by(() => {
    if (!selectedBrew) return undefined;
    return brews
      .filter(
        (b) =>
          b.beanId === selectedBrew.beanId &&
          b.id !== selectedBrew.id &&
          b.date <= selectedBrew.date,
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  });
  const selectedPrevBean = $derived(
    selectedPrevBrew ? beans[selectedPrevBrew.beanId] : undefined,
  );

  function onBrewCardClick(e: MouseEvent, id: string) {
    if (window.matchMedia("(min-width: 860px)").matches) {
      e.preventDefault();
      selectedBrewId = id;
    }
  }

  const avgRating = $derived(averageRating(brews));
  const favMethod = $derived.by(() => {
    const c: Record<string, number> = {};
    brews.forEach((b) => (c[b.method] = (c[b.method] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "espresso";
  });

  function formatDate(d: CalendarDate) {
    const diff = daysBetween(todayIso(), d);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return parseIsoDate(d).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  function todaySub() {
    return new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="journal-shell">
  <div class="screen">
    <TopBar sub={todaySub()} title="The Journal">
      {#snippet action()}
        <button
          class="icon-btn"
          type="button"
          aria-label="Search"
          onclick={search.open}><Icon name="search" size={18} /></button
        >
      {/snippet}
    </TopBar>

    <div class="stats-strip">
      <div class="stat-item">
        <div class="stat-label">Brews</div>
        <div class="stat-value">
          {brews.length}<span class="stat-unit">this wk</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">Avg</div>
        <div class="stat-value serif">
          {avgRating == null ? "—" : avgRating.toFixed(1)}{#if avgRating != null}<span class="stat-unit">/ 10</span>{/if}
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">Top</div>
        <div class="stat-value small">
          {methodLabel(journal.methods, favMethod)}
        </div>
      </div>
    </div>

    <div class="section-label">Recent brews</div>

    <div class="brew-list">
      {#each sortedDates as date (date)}
        <div class="date-group">
          <div class="date-label">
            <span>{formatDate(date)}</span>
            <span class="date-sep">·</span>
            <span class="date-count"
              >{groups[date].length} brew{groups[date].length > 1
                ? "s"
                : ""}</span
            >
          </div>
          {#each groups[date] as brew (brew.id)}
            {@const bean = beans[brew.beanId]}
            <a
              class="brew-card"
              class:selected={brew.id === effectiveSelectedId}
              href="/brew/{brew.id}"
              onclick={(e) => onBrewCardClick(e, brew.id)}
            >
              <div class="swatch {bean.roast}" class:has-photo={bean.photoUrl}>
                {#if bean.photoUrl}<img src={bean.photoUrl} alt="" />{/if}
                <span class="method-badge">
                  <MethodIcon
                    method={brew.method}
                    size={22}
                    stroke="white"
                    strokeWidth={1.6}
                  />
                </span>
              </div>
              <div class="meta">
                <div>
                  <div class="row1">
                    <div class="bean-name">{bean.name}</div>
                    <div class="rating">
                      {#if brew.rating == null}
                        <span class="denom">Not rated</span>
                      {:else}
                        <span class="num">{brew.rating}</span><span class="denom">/10</span>
                      {/if}
                    </div>
                  </div>
                  <div class="roaster">
                    {bean.roaster} · {methodLabel(journal.methods, brew.method)}
                  </div>
                </div>
                <div class="stats">
                  {#if brew.method === "espresso"}
                    <span class="stat">{brew.doseIn}g → {brew.yieldOut}g</span>
                    <span class="dot"></span>
                    <span class="stat">{brew.extractionTime}s</span>
                    {#if brew.withMilk}
                      <span class="dot"></span>
                      <Icon name="milk" size={12} />
                    {/if}
                  {:else}
                    <span class="stat">{brew.doseIn}g · {brew.ratio}</span>
                    <span class="dot"></span>
                    <span class="stat"
                      >{Math.floor(brew.extractionTime / 60)}:{String(
                        brew.extractionTime % 60,
                      ).padStart(2, "0")}</span
                    >
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if selectedBrew && selectedBean}
    <div class="journal-detail-pane">
      <div class="desktop-detail-actions">
        <DetailActionMenu editHref={`/new?edit=${selectedBrew.id}`} label="Brew actions" />
      </div>
      <BrewDetail
        brew={selectedBrew}
        bean={selectedBean}
        grinder={selectedGrinder}
        machine={selectedMachine}
        prevBrew={selectedPrevBrew}
        prevBean={selectedPrevBean}
      />
    </div>
  {/if}
</div>

<style>
  .stats-strip {
    margin: 4px 16px 18px;
    padding: 14px 18px;
    background: linear-gradient(135deg, var(--card), var(--paper-2));
    border: 1px solid var(--line-soft);
    border-radius: var(--r-lg);
    display: flex;
    align-items: stretch;
  }
  .stat-item {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-label {
    font-size: 9.5px;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .stat-value {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-size: 22px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.2px;
  }
  .stat-value.serif {
    font-family: var(--serif);
    font-weight: 500;
    letter-spacing: -0.3px;
  }
  .stat-value.small {
    font-size: 16px;
  }
  .stat-unit {
    font-size: 10px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .stat-divider {
    width: 1px;
    background: var(--line);
    margin: 4px 12px;
    flex-shrink: 0;
  }
  .brew-list {
    padding-bottom: 20px;
  }
  :global(.brew-card .swatch.has-photo img) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  :global(.brew-card .swatch.has-photo::after) {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.02),
      rgba(0, 0, 0, 0.3)
    );
  }
  .method-badge {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.brew-card .swatch.has-photo) .method-badge {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(22, 18, 14, 0.48);
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  }
  .date-label {
    padding: 10px 24px 6px;
    font-size: 11px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .date-sep {
    color: var(--ink-4);
  }
  .date-count {
    color: var(--ink-4);
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }

  :global(.journal-shell) {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .journal-detail-pane {
    display: none;
  }
  .desktop-detail-actions {
    display: flex;
    justify-content: flex-end;
    padding: 32px 16px 0;
  }

  @media (min-width: 860px) {
    :global(.journal-shell .screen) {
      max-width: none;
      margin: 0;
      width: 400px;
      flex-shrink: 0;
      border-right: 1px solid var(--line-soft);
    }
    :global(.brew-card.selected) {
      background: var(--card);
      border-radius: var(--r-md);
    }
    .journal-detail-pane {
      display: block;
      flex: 1;
      min-width: 0;
      overflow-y: auto;
    }
    .journal-detail-pane :global(.brew-detail) {
      max-width: 720px;
      margin: 0 auto;
    }
  }
</style>
