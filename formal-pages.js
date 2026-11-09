// GitHub Pages has no server. This adapter stores demo data in the current browser.
async function requestFormalPreview(path, body) {
  const key = 'sinyi-formal-pages-surveys-v1';
  const state = JSON.parse(localStorage.getItem(key)) ?? { onboarding: null, records: [], drafts: [] };
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  const profile = () => ({
    completed: !!state.onboarding || isQuizCompleted,
    dev: state.onboarding?.dev ?? formalActiveDevCode,
    sal: state.onboarding?.sal ?? formalActiveSalCode,
    records: state.records,
    drafts: state.drafts
  });

  if (path === 'profile') return profile();
  if (path === 'onboarding') {
    if (!officialQuestions.every(q => formalQuizValid(q, body.answers[q.id]))) fail(400, '請先完成全部 6 題。');
    state.onboarding = { dev: body.dev, sal: body.sal };
    save();
    return profile();
  }

  if (path === 'review') {
    if (body) {
      const record = state.records.find(item => item.id === body.id);
      if (!record || record.revision !== body.revision || record.status !== 'pending') fail(409, '這筆紀錄已更新，請重新載入。');
      const feedback = body.feedback?.trim().slice(0, 500) ?? '';
      if (!['approved', 'returned'].includes(body.status) || (body.status === 'returned' && !feedback)) fail(400, '退回時請填寫補正原因。');
      Object.assign(record, { status: body.status, feedback, revision: record.revision + 1 });
      save();
    }
    return { records: state.records };
  }

  if (path === 'surveys' || path === 'surveys/draft') {
    if (!profile().completed) fail(403, '請先完成適性測驗。');
    const { building } = body;
    if (!Object.hasOwn(buildingDatabase, building)) fail(400, '請先選擇社區。');
    const record = state.records.find(item => item.building === building);
    if (record && (record.status !== 'returned' || record.revision !== body.revision)) fail(409, '這筆資料已送審或已核可，請重新載入。');
    const draft = state.drafts.find(item => item.building === building);
    if ((draft?.revision ?? 0) !== (body.draftRevision ?? 0)) fail(409, '草稿已在其他分頁更新，請重新載入。');
    const fields = Object.fromEntries([...communityMetrics, ...communityNotes].map(([field]) => [
      field, (body.fields[field] ?? '').trim().slice(0, field === 'observation' ? 500 : 120)
    ]));
    const otherDrafts = state.drafts.filter(item => item.building !== building);
    if (path.endsWith('/draft')) {
      const saved = { building, fields, revision: (draft?.revision ?? 0) + 1 };
      state.drafts = [...otherDrafts, saved];
      save();
      return { draft: saved };
    }
    if (Object.values(fields).some(value => !value)) fail(400, '請填完 9 個欄位。');
    state.records = [{
      id: record?.id ?? building, building, profile: '示範業務', fields, status: 'pending',
      feedback: record?.feedback ?? '', revision: (record?.revision ?? 0) + 1
    }, ...state.records.filter(item => item.building !== building)];
    state.drafts = otherDrafts;
    save();
    return { records: state.records };
  }
  fail(404, '找不到這個功能。');
}
