// Probe Halide · root app orchestrator

const { useState: HsS, useEffect: HsE } = React;

function HalideApp() {
  const [route, setRoute] = HsS({ kind: 'home' });
  const [branches, setBranches] = HsS({ a: 'live', b: 'live', c: 'live' });
  const [paused, setPaused] = HsS(true);
  const [chosen, setChosen] = HsS(1);
  const [sourceOpen, setSourceOpen] = HsS(null);
  const [cmdK, setCmdK] = HsS(false);
  const [cost, setCost] = HsS(2.19);

  // ⌘K
  HsE(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdK((o) => !o); }
      if (e.key === 'Escape') { setCmdK(false); setSourceOpen(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // cost ticker while running
  HsE(() => {
    if (paused || route.kind === 'home') return;
    const iv = setInterval(() => setCost((c) => +(c + 0.004).toFixed(3)), 900);
    return () => clearInterval(iv);
  }, [paused, route.kind]);

  const killBranch = (id) => setBranches((b) => ({ ...b, [id]: 'killed' }));

  const crumb = (() => {
    if (route.kind === 'home') return ['Home'];
    const base = ['demo_run'];
    if (route.kind === 'stage') return [...base, 'Pipeline', `Stage ${route.n}`];
    if (route.kind === 'premise') return [...base, 'Stage 1', 'Premise card'];
    if (route.kind === 'branch') return [...base, 'Branches', `${route.id.toUpperCase()}`];
    if (route.kind === 'walkthrough') return [...base, 'Branch B', 'Walkthrough'];
    if (route.kind === 'audit') return [...base, 'Branch B', 'Audit'];
    if (route.kind === 'reviewers') return [...base, 'Branch B', 'Reviewers'];
    if (route.kind === 'guidebook') return [...base, 'Guidebook'];
    return base;
  })();

  const topbarRight = (
    route.kind !== 'home' && (
      <>
        <button className="hld-btn hld-btn-ghost">
          {paused ? <HIcon k="play" size={11} color="var(--amber)" /> : <HIcon k="pause" size={11} />}
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>
        <button className="hld-btn"><HIcon k="ext" size={11} /> Render</button>
      </>
    )
  );

  return (
    <div className="hld" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
        <HalideSidebar route={route} setRoute={setRoute} branches={branches} killBranch={killBranch} cost={cost} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <HalideTopbar crumb={crumb} right={topbarRight} onCmdK={() => setCmdK(true)} />
          {route.kind === 'home' && <HalideHomeView onBegin={() => { setRoute({ kind: 'premise' }); setPaused(true); }} />}
          {route.kind === 'premise' && <HalidePremise chosen={chosen} setChosen={setChosen} onAccept={() => { setPaused(false); setRoute({ kind: 'walkthrough' }); }} />}
          {route.kind === 'branch' && <HalideBranch id={route.id} branches={branches} killBranch={killBranch} />}
          {route.kind === 'walkthrough' && <HalideWalkthrough />}
          {route.kind === 'audit' && <HalideAudit />}
          {route.kind === 'reviewers' && <HalideReviewers />}
          {route.kind === 'guidebook' && <HalideGuidebook setSourceOpen={setSourceOpen} />}
          {route.kind === 'stage' && (
            <div style={{ padding: '40px 60px', color: 'var(--ink-3)' }}>
              <div className="hld-uc">Stage {route.n}</div>
              <div style={{ fontFamily: 'Newsreader, serif', fontSize: 22, marginTop: 8, color: 'var(--ink)' }}>
                {window.PROBE_STAGES.find((s) => s.n === route.n)?.name}
              </div>
              <div style={{ marginTop: 12, fontSize: 13 }}>
                Select an artifact from the tree to inspect this stage's output.
              </div>
            </div>
          )}
          {sourceOpen && <HalideSourcePanel id={sourceOpen} onClose={() => setSourceOpen(null)} />}
        </div>
      </div>
      <HalideCmdK open={cmdK} onClose={() => setCmdK(false)} setRoute={setRoute} />
    </div>
  );
}

Object.assign(window, { HalideApp });
