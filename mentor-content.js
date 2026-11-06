const mentorTopics={
  start:{label:'不知道先做什麼',title:'先做一件小事，就算開始。',body:'第一天不用急著變成超業。我會把今天拆成小步驟，你先選一件最容易開始的。',steps:['看看今天的第一個任務，不用一次做完三個。','先花 5～10 分鐘行動；留意一個你以前沒發現的細節。','回來用自己的話寫下收穫，我們就能看見你的進步。'],line:'今天先完成一次觀察就好，我陪你把第一步走穩。'},
  opening:{label:'不敢跟客戶開口',title:'不用一開始就談成交。',body:'先讓對方知道你是誰，再用一個容易回答的問題，把話題打開。',steps:['先打招呼、簡單介紹自己，先徵詢對方是否方便。','用一個開放問題了解需求，不急著推薦物件。','記下自己聽懂的重點，約定下一次可以聯繫的時間。'],line:'「您好，我是信義房屋的新夥伴。現在方便聊一下您最近關注的居住需求嗎？」'},
  rejection:{label:'被拒絕，有點挫折',title:'被拒絕，不代表你不適合。',body:'很多關係需要時間。先把這次經驗留成下一次能用的小線索，不用把拒絕當成對自己的評價。',steps:['先停一下、喝口水，讓情緒慢下來。','分清楚：對方沒需求、時機不對，還是開場需要調整？','寫下一個下次想改的小地方。今天願意嘗試，本身就是進步。'],line:'「了解，謝謝您願意聽我說。之後如果有需要，我再提供您參考資訊。」'},
  busy:{label:'今天只有一點時間',title:'今天走小步，也是在前進。',body:'把目標縮小，保留參與感。今天沒做完，不會扣掉你已累積的能力。',steps:['挑一件今天能做的小事：觀察一個社區細節，或整理一個客戶需求。','利用短時間寫下實際發現，不必把筆記寫成報告。','其餘任務可以先略過；狀態回來後，今天仍能補做。'],line:'先選一件容易的。比起勉強做很多，更重要的是願意繼續。'}
};
function mentorContext(){
  const day=hunterToday(),done=Object.values(day.tasks).filter(t=>t.status==='done').length;
  const next=hunterQuests().find(q=>!day.tasks[q.id]);
  const skipped=hunterQuests().find(q=>day.tasks[q.id]?.status==='skipped');
  const mood=day.mood;
  if(done===3)return {title:'今天的三件事，你都做到了。',body:'這些不是打勾而已，是你真的累積的現場經驗。記下一個收穫，今天就可以好好收工了。',action:'回顧今天的收穫',target:'journal'};
  if(mood==='tired')return {title:'累的時候，我們就走小步一點。',body:'今天先選一件最容易開始的事。需要時可以略過，明天再接著來，你的努力都會留下。',action:'學長，給我一點建議',target:'busy'};
  if(done>=2)return {title:'今天的節奏，你已經抓到了。',body:'你已完成兩件事，連續紀錄也留下來了。還有餘力就多練一點，想休息也沒關係。',action:next?'看看最後一個小任務':'回顧今天的收穫',target:next?'quest':'journal'};
  if(done===1)return {title:'第一步完成了，這就很值得。',body:'再挑一件小事，我們把今天的成長接起來。不急，我陪你慢慢找到自己的節奏。',action:'繼續下一個小任務',target:'quest'};
  if(!next&&skipped)return {title:'今天先休息一下，也沒關係。',body:'任務先略過沒有關係。如果待會有一點空檔，仍然可以回來補做。',action:'看看今天略過的任務',target:'skipped'};
  return {title:'今天，我們先把一件小事做好。',body:next?`先從「${next.name}」開始。不用追求完美，帶回一個你真的觀察到的細節就好。`:'我幫你把今天拆成幾個小練習，一件一件來就好。',action:'學長帶我開始',target:'quest'};
}
