<script lang="ts">
  import Icon from "$lib/icons/Icon.svelte";
  import StarRow from "$lib/components/StarRow.svelte";
  import type { Bean, Brew, Grinder, Machine } from "$lib/data/types";
  import { formatExtractionTime } from "$lib/data/sample";
  import { methodLabel } from "$lib/data/methods";
  import { journal } from "$lib/stores/journal.svelte";
  import { parseIsoDate } from "$lib/data/date";
  import type { CalendarDate } from "$lib/data/date";

  let {
    brew,
    bean,
    grinder,
    machine,
    prevBrew,
    prevBean,
  }: {
    brew: Brew;
    bean: Bean;
    grinder: Grinder | undefined;
    machine?: Machine;
    prevBrew?: Brew;
    prevBean?: Bean;
  } = $props();

  function dateStr(d: CalendarDate) {
    return parseIsoDate(d).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
</script>

<div class="brew-detail">
  <div class="hero">
    <div class="hero-sub">
      {dateStr(brew.date)} · {brew.time} · {methodLabel(journal.methods, brew.method)}{brew.withMilk ? ` + ${brew.milkDrink ?? "milk"}` : ""}
    </div>
    <h1 class="hero-title">{bean.name}</h1>
    <div class="hero-meta">
      <span>{bean.roaster}</span>
      <span class="dim">·</span>
      <span>{bean.origin}</span>
    </div>

    <div class="rating-block">
      <div class="rating-col">
        <div class="rating-label">{brew.withMilk ? "Straight" : "Rating"}</div>
        <div class="rating-value">
          {brew.rating}<span class="rating-denom">/ 10</span>
        </div>
        <div style="margin-top:4px"><StarRow value={brew.rating} /></div>
      </div>
      {#if brew.rating2 != null}
        <div class="rating-sep"></div>
        <div class="rating-col">
          <div class="rating-label"><Icon name="milk" size={11} /> {brew.milkDrink ?? 'In milk'}</div>
          <div class="rating-value">
            {brew.rating2}<span class="rating-denom">/ 10</span>
          </div>
          <div style="margin-top:4px"><StarRow value={brew.rating2} /></div>
        </div>
      {/if}
    </div>
  </div>

  <div class="section-label">Recipe</div>
  <div class="recipe-grid">
    <div class="recipe-cell">
      <div class="recipe-label">Dose</div>
      <div class="recipe-value">
        {brew.doseIn}<span class="recipe-unit">g</span>
      </div>
    </div>
    <div class="recipe-cell">
      <div class="recipe-label">Yield</div>
      <div class="recipe-value">
        {brew.yieldOut}<span class="recipe-unit">g</span>
      </div>
    </div>
    <div class="recipe-cell">
      <div class="recipe-label">Ratio</div>
      <div class="recipe-value mono">{brew.ratio}</div>
    </div>
    <div class="recipe-cell">
      <div class="recipe-label">Time</div>
      <div class="recipe-value mono">
        {formatExtractionTime(brew.extractionTime)}
      </div>
    </div>
    <div class="recipe-cell">
      <div class="recipe-label">Temp</div>
      <div class="recipe-value">
        {brew.temperature}<span class="recipe-unit">°C</span>
      </div>
    </div>
    <div class="recipe-cell">
      <div class="recipe-label">Grind</div>
      <div class="recipe-value">
        {brew.grindSetting}<span class="recipe-unit"
          >{grinder?.name.split(" ")[0]}</span
        >
      </div>
    </div>
  </div>

  {#if machine}
    <div class="machine-strip">
      <Icon name="machine" size={14} />
      <span>{machine.name}</span>
    </div>
  {/if}

  {#if brew.recipeNotes}
    <div class="recipe-notes">{brew.recipeNotes}</div>
  {/if}

  <div class="section-label">Tasting</div>
  <div class="tasting-card">
    {#if brew.descriptors?.length}
      <div class="descriptors">
        {#each brew.descriptors as d (d)}
          <span class="descriptor-chip">{d}</span>
        {/each}
      </div>
    {/if}
    {#each [["Aroma", brew.aroma], ["Flavor", brew.flavor], ["Body", brew.body], ["Finish", brew.finish]] as [label, text], i (label)}
      {#if text}
        <div class="note-row" class:last={i === 3}>
          <div class="note-label">{label}</div>
          <div class="note-text">{text}</div>
        </div>
      {/if}
    {/each}
  </div>

  {#if prevBrew && prevBean}
    <a class="compare-hint" href="/brew/{brew.id}/compare">
      <div>
        <div class="compare-hint-label">Compare to last brew</div>
        <div class="compare-hint-value">
          {prevBean.name} · {prevBrew.rating}/10
        </div>
      </div>
      <Icon name="chevron" size={16} />
    </a>
  {/if}
</div>

<style>
  .hero {
    padding: 24px 24px 8px;
  }
  .hero-sub {
    font-size: 11px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 8px;
  }
  .hero-title {
    font-family: var(--serif);
    font-size: 36px;
    font-weight: 400;
    font-style: italic;
    margin: 0;
    color: var(--ink);
    letter-spacing: -0.8px;
    line-height: 1.05;
    font-variation-settings:
      "opsz" 144,
      "SOFT" 50;
  }
  .hero-meta {
    font-size: 13px;
    color: var(--ink-3);
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hero-meta .dim {
    color: var(--ink-4);
  }
  .rating-block {
    margin-top: 20px;
    padding: 16px 18px;
    background: var(--card);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-lg);
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .rating-col {
    flex: 1;
  }
  .rating-label {
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .rating-value {
    font-family: var(--serif);
    font-size: 38px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1;
    font-variation-settings: "opsz" 144;
  }
  .rating-denom {
    font-size: 14px;
    color: var(--ink-3);
    font-style: italic;
    font-family: var(--serif);
  }
  .rating-sep {
    width: 1px;
    height: 50px;
    background: var(--line);
  }
  .recipe-grid {
    margin: 0 16px;
    padding: 18px;
    background: var(--card);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-lg);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .recipe-label {
    font-size: 9.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 4px;
  }
  .recipe-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.2px;
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .recipe-value.mono {
    font-family: var(--mono);
  }
  .recipe-unit {
    font-size: 11px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .machine-strip {
    margin: 10px 16px 0;
    padding: 10px 14px;
    background: var(--card-2);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--ink-2);
  }
  .recipe-notes {
    margin: 10px 16px 0;
    padding: 14px 16px;
    background: var(--card);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-lg);
    font-size: 14px;
    line-height: 1.5;
    color: var(--ink-2);
    white-space: pre-wrap;
  }
  .tasting-card {
    margin: 0 16px 12px;
    padding: 18px;
    background: var(--card);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-lg);
  }
  .descriptors {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 18px;
  }
  .descriptor-chip {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 100px;
    background: rgba(196, 90, 58, 0.1);
    color: var(--accent-2);
  }
  .note-row {
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--line-soft);
  }
  .note-row.last {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: none;
  }
  .note-label {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 4px;
  }
  .note-text {
    font-family: var(--serif);
    font-size: 15px;
    font-style: italic;
    color: var(--ink-2);
    line-height: 1.5;
    font-variation-settings: "opsz" 14;
  }
  .compare-hint {
    margin: 8px 16px 24px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    border: 1px dashed var(--line);
    border-radius: var(--r-md);
    color: var(--ink-2);
  }
  .compare-hint-label {
    font-size: 11px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 2px;
  }
  .compare-hint-value {
    font-size: 13px;
    color: var(--ink-2);
  }
</style>
