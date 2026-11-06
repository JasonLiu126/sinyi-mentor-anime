// Quiz-selected development/sales profiles drive live missions without resetting rewards.
let formalActiveDevCode='A',formalActiveSalCode='E';
let formalManualDevCode=null,formalManualSalCode=null;
const formalRouteDefaults=JSON.parse(JSON.stringify(routeTasksData));
const formalPathByDev={A:'community',B:'district',C:'social',D:'network',E:'company',F:'market'};
const formalPathNames={community:'社區經營',district:'商圈經營',social:'網路社群經營',network:'私人人脈經營',company:'公司既有人脈經營',market:'市場物件經營',luxury:'豪宅專研'};
const formalRouteProfiles={
  dev:{
    B:[
      ['認識你的商圈節點','選定一條主要街道與兩處生活機能。',['確認商圈範圍與主要街道','記下交通、採買與休閒節點','列出兩家想認識的在地店家']],
      ['完成在地店家拜訪準備','準備介紹自己與了解商圈的問題。',['準備簡短自我介紹','列出兩個在地觀察問題','安排合適的拜訪時段']],
      ['整理商圈觀察紀錄','記下一項人流、店家或居住需求的發現。'],
      ['規劃下一次商圈互動','根據觀察列出下一步經營行動。']
    ],
    C:[
      ['建立你的社群經營定位','選定主要平台、目標受眾與內容主題。',['選定一個主要經營平台','確認帳號簡介與公開聯繫方式','列出三個想分享的房產主題']],
      ['完成一則房產內容草稿','寫下貼文或短影音的開場、重點與行動邀請。'],
      ['整理社群互動與潛在需求','從公開留言與提問了解受眾關注的議題。',['整理三個常見房產問題','寫下一則自然且有幫助的回覆','記錄後續可以製作的內容主題']],
      ['規劃下一週的社群內容','排出發布主題、預計時間與觀察指標。']
    ],
    D:[
      ['盤點可以自然聯繫的人脈','整理熟悉的人脈類型與合適的關心切入點。',['分出親友、同學與前同事等類型','選出一位適合關心近況的對象','準備不涉及推銷的開場問題']],
      ['準備一次自然的近況關心','寫下關心的切入點與想了解的需求。'],
      ['整理人脈互動的下一步','確認對方需要的資訊與可接受的聯繫方式。',['整理本次聽到的需求','確認是否方便後續聯繫','規劃一項能提供的實用資訊']],
      ['規劃長期人脈關心節奏','記下未來的關心時機與可以提供的服務。']
    ],
    E:[
      ['整理公司既有屋主資源','依分店授權範圍盤點可回訪的紀錄。',['確認名單來源與可聯繫範圍','查看先前互動紀錄','列出需要更新的屋況或出售意願']],
      ['準備舊客回訪問題','寫下近況關心、需求更新與後續服務問題。'],
      ['整理回訪狀態與後續安排','更新可跟進的事項。',['確認目前是否仍有服務需求','標記適合的下次聯繫時機','整理可提供的市場資訊']],
      ['完成舊客經營計畫','依回訪結果安排下一輪跟進。']
    ],
    F:[
      ['建立市場物件觀察清單','選擇公開在售或自售物件，觀察特色與價格。',['確認公開資料來源','整理物件位置與主要特色','記錄價格與值得進一步了解的問題']],
      ['比較兩筆市場物件','記錄價格、條件與客群差異。'],
      ['準備物件開發切入點','整理可提供的市場資訊與服務價值。',['確認需要查證的公開資訊','寫下合宜的自我介紹','整理可以協助屋主的具體事項']],
      ['完成市場物件跟進計畫','列出資料查證與後續服務行動。']
    ]
  },
  sal:{
    A:[['掌握社區買方常見需求','從主力社區出發整理買方關注的條件。',['整理社區成交與格局特色','列出換屋或同社區購屋需求','準備社區介紹重點']],['準備社區物件推薦','依買方需求整理社區優缺點。'],['練習回答社區比較問題','整理買方常問的三項差異。',['確認買方最重視的條件','比較社區與競品','準備可查證的行情依據']],['完成社區帶看準備','寫下介紹順序、疑問與後續跟進。']],
    B:[['盤點商圈買方接觸點','找出適合介紹在售物件的商圈節點。',['確認物件周邊客群與生活需求','選擇合宜的接觸地點','準備簡短物件介紹']],['準備商圈銷售素材','整理適合現場介紹的特色與問題。'],['練習商圈買方需求訪談','從生活需求自然了解購屋條件。',['詢問居住區域與生活習慣','釐清預算與時間規劃','確認是否願意接收後續資訊']],['整理商圈買方跟進計畫','寫下配案方向與下一次互動。']],
    C:[['盤點社群尋屋需求','從公開尋屋提問與內容互動中整理買方需求。',['選定一個觀察平台','整理常見區域、預算與格局需求','準備有幫助的互動回覆']],['製作物件介紹內容草稿','整理照片或影片順序、特色與聯繫邀請。'],['準備社群詢問回覆','練習從留言或訊息釐清實際需求。',['確認買方提問的重點','準備不誇大且可查證的物件資訊','提出合宜的下一步聯繫建議']],['規劃線上詢問到帶看的流程','寫下需求確認、配案與邀約步驟。']],
    D:[['盤點親友與舊客的買方線索','整理適合自然分享物件的關係與需求。',['確認對方是否有購屋需求','準備能提供的實用資訊','尊重對方接受聯繫的意願']],['準備熟人推薦的物件說明','寫下物件適合的需求與需要提醒的限制。'],['整理轉介紹溝通重點','練習讓對方安心介紹有需求的朋友。',['說明可以提供的協助','確認介紹與聯繫意願','準備需求確認問題']],['規劃熟人買方跟進','安排自然且合宜的後續服務。']]
  }
};
function formalUpdateRouteData(){
  for(const [kind,code] of [['dev',formalActiveDevCode],['sal',formalActiveSalCode]]){
    const route=routeTasksData[kind],definition=(kind==='dev'?devStyleDefinitions:salStyleDefinitions)[code];
    const profile=formalRouteProfiles[kind][code];
    if(route.formalProfileCode!==code){
      route.slots.forEach((slot,index)=>{
        if(slot.isCompleted)return;
        const original=formalRouteDefaults[kind].slots[index];
        if(!profile){Object.assign(slot,JSON.parse(JSON.stringify(original)));return;}
        const [title,desc,checks]=profile[index];
        Object.assign(slot,{title,desc,type:checks?'checklist':'input_notes',defaultNote:'',noteLabel:kind==='dev'?'開發行動紀錄：':'銷售準備與互動紀錄：',cat:kind==='dev'?'soft_dev':'soft_sal',sub:kind==='dev'?(code==='C'?'dev_brand':code==='F'?'dev_track':code==='E'?'dev_resource':'dev_local'):(code==='C'?'sal_present':code==='D'?'sal_resource':'sal_market')});
        if(checks)slot.checkItems=checks.map(text=>({text,checked:false}));
      });
      route.formalProfileCode=code;
    }
    route.poolTitle=definition.name+'｜接下來的挑戰';
    const next=route.slots.find(s=>!s.isCompleted&&!s.isHidden);
    if(next){Object.assign(route.hero,{id:kind+'_hero_'+next.id,title:next.title,desc:'目標：'+next.desc,cond:next.type==='navigate_map'?'前往地圖並完成標記':next.type==='checklist'?'完成本次實務檢核項目':'儲存本次行動紀錄',badge:next.tag+'｜進行中',reward:`🪙 ${next.rewardCoins||150} 盲盒幣 ｜ 經驗 EXP +${next.rewardExp||20}`,actionText:next.type==='navigate_map'?'🗺️ 前往信義地圖進行標記':'📋 開始本次任務'});}
    else{route.hero.title=definition.name+'｜目前任務已完成';route.hero.desc='已完成的紀錄與獎勵保留，可繼續練習每日任務。';}
  }
}
function formalRenderRouteLabels(){
  const dev=devStyleDefinitions[formalActiveDevCode].name,sal=salStyleDefinitions[formalActiveSalCode].name;
  document.getElementById('route-tab-dev').textContent=dev;
  document.getElementById('route-tab-sal').textContent=sal;
  const summary=document.getElementById('formal-active-routes');if(summary){summary.textContent=`開發：${dev}　｜　銷售：${sal}`;summary.dataset.dev=formalActiveDevCode;summary.dataset.sal=formalActiveSalCode;}
  const direction=document.getElementById('formal-practice-direction');if(direction&&hunterState)direction.textContent='今日開發練習方向：'+formalPathNames[hunterState.path];
}
function formalApplySelectedRoutes(syncJourney=true){
  formalActiveDevCode=currentSelectedDevCode;formalActiveSalCode=currentSelectedSalCode;
  formalRefreshAppliedRoutes(syncJourney);
}
function formalRefreshAppliedRoutes(syncJourney=false){
  if(hunterState&&(syncJourney||!hunterState.quizDevRoute)){hunterState.path=formalPathByDev[formalActiveDevCode];hunterState.quizDevRoute=formalActiveDevCode;}
  formalUpdateRouteData();switchRoute(currentActiveRouteKey);formalRenderRouteLabels();
  if(hunterState){hunterRender();hunterSave();}
}
