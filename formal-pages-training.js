// Public practice questions and original recap videos for the static Pages edition.
const publicTrainingStages = [
  {
    title: '房地交易試算',
    question: '小安想先算出房地交易所得。他已知道成交價，還要整理哪些資料？',
    options: ['原始取得成本與可認列的取得、改良及移轉費用', '目前的房貸餘額', '同一條街的平均開價'],
    correct: 0
  },
  {
    title: '出售費用與憑證',
    question: '屋主要整理出售這間房子所支出的交易費用。下列哪一項應先保留憑證供查核？',
    options: ['持有期間每月的管理費', '這次出售支付的仲介費', '過去持有期間每月的房貸利息'],
    correct: 1
  },
  {
    title: '自住優惠查證',
    question: '屋主說自己曾在這間房子設戶籍，想確認能否適用自住優惠。下一步該確認什麼？',
    options: ['只確認出售價格', '只確認戶籍曾經設在這裡', '查證持有與居住期間、房屋用途及以往適用優惠的紀錄'],
    correct: 2
  }
];

async function requestFormalPublicTraining(path, body) {
  const key = 'sinyi-formal-pages-training-v1';
  const duration = 18;
  const progress = JSON.parse(localStorage.getItem(key)) ?? {};
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  if (!isQuizCompleted) fail(403, '請先完成適性測驗。');
  if (path === 'training/progress') {
    return { stages: Object.entries(progress).map(([stage, { passed, pending }]) => ({ stage: Number(stage), passed, pending })) };
  }

  const match = /^training\/stages\/([1-3])\/(open|answer|play|retry)$/.exec(path);
  if (!match) fail(404, '找不到這個關卡。');
  const [, id, action] = match;
  const { title, question, options, correct } = publicTrainingStages[Number(id) - 1];
  const record = progress[id] ?? { passed: false, pending: false, started: null };
  const questionView = { state: 'question', title, question, options };
  const remediation = { state: 'remediation', title, duration, clipLabel: '公開補課短片' };
  const save = changes => {
    progress[id] = { ...record, ...changes };
    localStorage.setItem(key, JSON.stringify(progress));
  };

  if (action === 'open') return record.pending ? remediation : questionView;
  if (action === 'answer') {
    if (record.pending) return remediation;
    if (!Number.isInteger(body?.option) || options[body.option] === undefined) fail(400, '請選擇一個答案。');
    if (body.option === correct) {
      save({ passed: true, pending: false, started: null });
      return { state: 'passed', title };
    }
    save({ pending: true, started: null });
    return remediation;
  }
  if (!record.pending) fail(409, '目前沒有待補課的影片。');
  if (action === 'play') {
    if (record.started === null) save({ started: Date.now() });
    return { url: './school-tax-' + id + '.mp4' };
  }
  if (record.started === null || Date.now() - record.started < duration * 1000) fail(409, '請完整看完補課影片再重答。');
  save({ pending: false, started: null });
  return questionView;
}
