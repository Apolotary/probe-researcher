// Probe Halide · root app orchestrator
// Simplified pass: a loadedRun state holds the currently-open run. The
// Home view populates it via loadRun(runId) which fetches /api/runs/:id.
// Views pull data from loadedRun when available, fall back to fixtures
// for the stages/views we haven't wired to the API yet.

const { useState: HsS, useEffect: HsE, useCallback: HsCb } = React;

function HalideApp() {
  const [route, setRoute] = HsS({ kind: 'home' });
  const [branches, setBranches] = HsS({ a: 'live', b: 'live', c: 'live' });
  const [chosen, setChosen] = HsS(1);
  const [sourceOpen, setSourceOpen] = HsS(null);
  const [cmdK, setCmdK] = HsS(false);
  const [loadedRun, setLoadedRun] = HsS(null);
  const [loadError, setLoadError] = HsS(null);
  const [guidebookText, setGuidebookText] = HsS(null);

  // ⌘K
  HsE(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdK((o) => !o); }
      if (e.key === 'Escape') { setCmdK(false); setSourceOpen(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Load a run on demand
  const loadRun = HsCb(async (runId) => {
    setLoadError(null);
    try {
      const r = await fetch(`/api/runs/${encodeURIComponent(runId)}`);
      if (!r.ok) {
        setLoadError(`Could not load ${runId} (HTTP ${r.status})`);
        return;
      }
      const body = await r.json();
      setLoadedRun(body);
      setGuidebookText(null);
      setBranches({ a: 'live', b: 'live', c: 'live' });
      if (body.guidebook_exists) setRoute({ kind: 'guidebook' });
      else if (body.branches && Object.keys(body.branches).length > 0) {
        setRoute({ kind: 'branch', id: Object.keys(body.branches)[0] });
      } else {
        setRoute({ kind: 'premise' });
      }
    } catch (e) {
      setLoadError(String(e.message || e));
    }
  }, []);

  // Lazy-fetch the guidebook text the first time the guidebook view opens
  HsE(() => {
    if (route.kind !== 'guidebook' || !loadedRun || guidebookText != null) return;
    (async () => {
      try {
        const r = await fetch(`/api/runs/${encodeURIComponent(loadedRun.run_id)}/file?p=PROBE_GUIDEBOOK.md`);
        if (r.ok) setGuidebookText(await r.text());
      } catch { /* leave null; fall back to fixture */ }
    })();
  }, [route.kind, loadedRun, guidebookText]);

  const killBranch = (id) => setBranches((b) => ({ ...b, [id]: 'killed' }));

  const crumb = (() => {
    if (route.kind === 'home') return ['Home'];
    const base = [loadedRun?.run_id || 'run'];
    if (route.kind === 'premise')   return [...base, 'Premise card'];
    if (route.kind === 'branch')    return [...base, 'Branch', (route.id || '').toUpperCase()];
    if (route.kind === 'audit')     return [...base, 'Audit', (route.branch || 'b').toUpperCase()];
    if (route.kind === 'guidebook') return [...base, 'Guidebook'];
    return base;
  })();

  const topbarRight = (
    route.kind !== 'home' && loadedRun && (
      <>
        <button className="hld-btn hld-btn-ghost" onClick={() => setRoute({ kind: 'home' })}>
          <HIcon k="home" size={11} /> <span>Home</span>
        </button>
        {loadedRun.report_page_exists && (
          <a className="hld-btn" href={`/api/runs/${encodeURIComponent(loadedRun.run_id)}/file?p=PROBE_REPORT_PAGE.html`} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
            <HIcon k="ext" size={11} /> Report
          </a>
        )}
      </>
    )
  );

  return (
    <div className="hld" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '272px 1fr', minHeight: 0 }}>
        <HalideSidebar route={route} setRoute={setRoute} branches={branches} killBranch={killBranch} loadedRun={loadedRun} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <HalideTopbar crumb={crumb} right={topbarRight} onCmdK={() => setCmdK(true)} />
          {loadError && (
            <div style={{ padding: '10px 16px', background: 'oklch(22% 0.06 20)', borderBottom: '1px solid var(--rose-s)', color: 'var(--rose)', fontSize: 12 }}>
              {loadError}
            </div>
          )}
          {route.kind === 'home' && <HalideHomeView loadRun={loadRun} />}
          {route.kind === 'premise' && <HalidePremise chosen={chosen} setChosen={setChosen} loadedRun={loadedRun} onAccept={() => setRoute({ kind: 'guidebook' })} />}
          {route.kind === 'branch' && <HalideBranch id={route.id} branches={branches} killBranch={killBranch} loadedRun={loadedRun} />}
          {route.kind === 'audit' && <HalideAudit branchId={route.branch || 'b'} loadedRun={loadedRun} />}
          {route.kind === 'guidebook' && <HalideGuidebook setSourceOpen={setSourceOpen} guidebookText={guidebookText} />}
          {sourceOpen && <HalideSourcePanel id={sourceOpen} onClose={() => setSourceOpen(null)} />}
        </div>
      </div>
      <HalideCmdK open={cmdK} onClose={() => setCmdK(false)} setRoute={setRoute} loadedRun={loadedRun} />
    </div>
  );
}

Object.assign(window, { HalideApp });
