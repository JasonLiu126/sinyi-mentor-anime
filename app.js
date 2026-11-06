// Visibility is separate from saved ownership; hidden characters remain recoverable.
function isFigurineVisible(id){return !(globalThis.hideChenCharacters===true&&(id?.startsWith('fig_')||executiveFigurineDatabase[id]?.pool==='chen'));}
let isQuizCompleted = false;
    let currentUserTotalExp = 0;
    let currentUserLevel = 1;

    // 代幣經濟與主管盲盒狀態 (PRD 規格)
    let userCoins = 1200;
    let gachaTickets = 3;
    let gachaPityCounter = 0;
    let cabinetPedestalTheme = 'wood';
    let cabinetHeartsCount = 38;
    let currentWarehouseFilter = 'all';
    let currentGachaPool = 'tony'; // 預設直接設為托尼池，開箱即抽托尼！

    let selectedSlotIndexForEdit = 0;
    let userWarehouse = [
      { id: 'fig_muscle', stars: 3, fragments: 4 },
      { id: 'fig_santa', stars: 2, fragments: 4 },
      { id: 'fig_ballet', stars: 2, fragments: 2 },
      { id: 'fig_track', stars: 2, fragments: 3 },
      { id: 'fig_hiphop', stars: 2, fragments: 3 },
      { id: 'fig_moto', stars: 2, fragments: 5 },
      // 托尼宇宙預設已擁有角色
      { id: 'tony_ninja', stars: 2, fragments: 3 },
      { id: 'tony_detective', stars: 2, fragments: 2 },
      { id: 'tony_rock', stars: 2, fragments: 4 },
      { id: 'tony_dino', stars: 3, fragments: 5 },
      { id: 'tony_alien', stars: 2, fragments: 2 },
      { id: 'tony_lion', stars: 2, fragments: 3 },
      { id: 'tony_clown', stars: 2, fragments: 3 }
    ];
    let userCabinetSlots = [
      'tony_ninja', 'fig_muscle', 'tony_detective',
      'fig_hiphop', 'tony_dino', 'fig_ballet',
      'tony_rock', 'fig_track', 'tony_lion'
    ];

    // 依據使用者上傳之 6 款實體樂高積木角色貼紙，精確重繪 IP 向量視覺
    const executiveFigurineDatabase = {
      'fig_muscle': {
        id: 'fig_muscle', name: '肌肉陳總', titleBadge: '強壯！陳總', rarity: 'SSR', rate: 0.02,
        themeColor: '#dc2626', bgGradient: 'from-amber-400 via-rose-500 to-red-600',
        desc: '金光閃閃樂高粗手臂彎曲炫耀肱二頭肌，方塊紅色六塊肌積木胸膛，頂著黑色「強壯！」積木磚！',
        stars: 3, fragments: 4, quote: '「強壯！陳總！這個月的業績給我通通爆肌破表！！」'
      },
      'fig_santa': {
        id: 'fig_santa', name: '聖誕陳總', titleBadge: '成交禮物大使', rarity: 'R', rate: 0.30,
        themeColor: '#16a34a', bgGradient: 'from-red-600 via-emerald-600 to-green-700',
        desc: '頭戴紅白凸點聖誕積木帽、黃色樂高夾手高舉打招呼，左手捧著綠紅緞帶大禮盒！',
        stars: 2, fragments: 4, quote: '「Ho Ho Ho！聖誕快樂！今天認真跑業務的新人，通通有大委託禮物！」'
      },
      'fig_ballet': {
        id: 'fig_ballet', name: '芭蕾陳總', titleBadge: '優雅旋轉', rarity: 'SR', rate: 0.10,
        themeColor: '#ec4899', bgGradient: 'from-pink-400 via-rose-300 to-purple-400',
        desc: '雙手高舉弧形芭蕾舞手勢、粉紅方塊身軀搭配白色蕾絲 Tutu 芭蕾裙，站立旋轉積木底座！',
        stars: 2, fragments: 2, quote: '「在房產市場的風浪中，我們也要維持優雅而精準的腳步～」'
      },
      'fig_track': {
        id: 'fig_track', name: '田徑陳總', titleBadge: '01 冠軍衝線', rarity: 'R', rate: 0.25,
        themeColor: '#0284c7', bgGradient: 'from-sky-400 via-blue-500 to-indigo-600',
        desc: '天藍色長身積木背心、01 冠軍號碼布、金牌綬帶高掛，雙拳勝利向上衝線！',
        stars: 2, fragments: 3, quote: '「業務是一場馬拉松，但這個月的業績第一名，我先收下了！」'
      },
      'fig_hiphop': {
        id: 'fig_hiphop', name: '嘻哈陳總', titleBadge: 'MC CHEN BOSS', rarity: 'SR', rate: 0.08,
        themeColor: '#9333ea', bgGradient: 'from-purple-600 via-indigo-600 to-slate-900',
        desc: '頭戴立體凸點黑色棒球帽、手持積木麥克風、大粗金鍊大金色 $ 符號，街頭霸氣開單！',
        stars: 2, fragments: 3, quote: '「Yo Check it out！信義雙軌帶你看透，簽約斡旋節奏最秀！」'
      },
      'fig_moto': {
        id: 'fig_moto', name: '飆車陳總', titleBadge: '飆風騎士', rarity: 'R', rate: 0.25,
        themeColor: '#f97316', bgGradient: 'from-amber-500 via-orange-600 to-red-600',
        desc: '黑白格子旗安全帽、跨騎在重裝黃黑積木越野機車上、手握龍頭疾速帶看！',
        stars: 2, fragments: 5, quote: '「油門催到底！帶看衝第一，今天誰都別想超我的車！」'
      },
      'fig_pizza': {
        id: 'fig_pizza', name: '披薩陳總', titleBadge: '熱騰騰出爐', rarity: 'R', rate: 0.15,
        themeColor: '#f59e0b', bgGradient: 'from-amber-400 via-orange-500 to-red-600',
        desc: '倒三角金黃脆皮義式臘腸披薩套裝、右手端起完整迷你起司披薩，香氣四溢！',
        stars: 2, fragments: 3, quote: '「這塊區域的委託，就像剛出爐的起司一樣熱騰騰拉絲～」'
      },
      'fig_magic': {
        id: 'fig_magic', name: '魔法陳總', titleBadge: '成交大魔法師', rarity: 'SR', rate: 0.08,
        themeColor: '#3b82f6', bgGradient: 'from-indigo-600 via-blue-600 to-sky-400',
        desc: '頭頂深藍星月尖頂巫師帽、身穿繁星魔法長袍、手持頂端金光閃爍的魔法魔杖！',
        stars: 2, fragments: 2, quote: '「成交魔法陣啟動！今天看屋的客戶通通下斡旋！」'
      },
      'fig_chef': {
        id: 'fig_chef', name: '廚神陳總', titleBadge: '米其林三星主廚', rarity: 'R', rate: 0.15,
        themeColor: '#64748b', bgGradient: 'from-slate-100 via-slate-300 to-slate-500',
        desc: '頭戴高聳百褶白廚師帽、雙排扣專業主廚服、左持平底煎鍋右持銀色打蛋器！',
        stars: 2, fragments: 4, quote: '「火候要夠，案子才會香！今晚給你端出一桌滿漢全席委託！」'
      },
      'fig_mermaid': {
        id: 'fig_mermaid', name: '美人魚陳總', titleBadge: '外星三眼深海人魚', rarity: 'SR', rate: 0.07,
        themeColor: '#0d9488', bgGradient: 'from-teal-400 via-emerald-500 to-cyan-600',
        desc: '頭戴三眼觸角怪獸頭箍、身著紫貝殼比基尼與翠綠鱗片魚尾、手持發光未來雷射槍！',
        stars: 2, fragments: 3, quote: '「在大海裡游得快不算什麼，游出專任約才算真本事！」'
      },
      'fig_dino': {
        id: 'fig_dino', name: '恐龍陳總', titleBadge: '房仲頂級掠食者', rarity: 'SSR', rate: 0.02,
        themeColor: '#15803d', bgGradient: 'from-emerald-500 via-green-600 to-teal-800',
        desc: '全套綠色暴龍巨齒玩偶裝，露齒咬牙霸氣威武、雙手利爪蓄勢待發！',
        stars: 3, fragments: 5, quote: '「吼——！房仲界的頂級掠食者登場，誰敢擋我的案子通通吞掉！」'
      },
      'fig_doctor': {
        id: 'fig_doctor', name: '醫生陳總', titleBadge: '急診室主任', rarity: 'R', rate: 0.15,
        themeColor: '#0284c7', bgGradient: 'from-sky-300 via-blue-400 to-indigo-500',
        desc: '身穿專業醫師白袍、脖掛金屬雙耳聽診器、手持巨大刻度藥劑針筒！',
        stars: 2, fragments: 2, quote: '「讓我來診斷一下這間房子的定價問題，來一針強心劑馬上成交！」'
      },
      'fig_cowboy': {
        id: 'fig_cowboy', name: '牛仔陳總', titleBadge: '荒野神射手', rarity: 'R', rate: 0.15,
        themeColor: '#b45309', bgGradient: 'from-amber-600 via-yellow-600 to-stone-700',
        desc: '頭戴超寬棕色皮質牛仔帽、亮金警長五角星胸章、右手精準握持套索繩套！',
        stars: 2, fragments: 3, quote: '「快狠準！看準買方一甩繩，立刻把好案子牢牢套住！」'
      },
      'fig_vampire': {
        id: 'fig_vampire', name: '吸血鬼陳總', titleBadge: '德古拉伯爵', rarity: 'SR', rate: 0.07,
        themeColor: '#991b1b', bgGradient: 'from-rose-900 via-red-950 to-black',
        desc: '黑底血紅高立領披風、白色復古皺褶領巾、嘴角尖銳獠牙、手持高貴銀色聖杯！',
        stars: 2, fragments: 4, quote: '「白天要帶看，晚上也要盯緊地政謄本異動～我不需要睡覺！」'
      },
      'fig_astronaut': {
        id: 'fig_astronaut', name: '太空人陳總', titleBadge: '星際拓荒者', rarity: 'SSR', rate: 0.02,
        themeColor: '#0284c7', bgGradient: 'from-slate-900 via-indigo-950 to-blue-900',
        desc: '立體透明圓弧太空防護頭盔、胸前生命維持儀表按鍵、身背雙氧氣鋼瓶背包！',
        stars: 3, fragments: 6, quote: '「我們的目標不是信義區，是浩瀚無垠的宇宙成交榜第一名！」'
      }
    };

    const tonyCharacters = [
      ['ninja', '忍者', 'SR', '隱身出擊，細心掌握每個機會。'],
      ['detective', '偵探', 'R', '放大細節，找出客戶真正的需求。'],
      ['lion', '獅子', 'SR', '鼓起勇氣，迎接今天的挑戰！'],
      ['clown', '小丑', 'R', '用笑容開場，讓溝通更輕鬆。'],
      ['zombie', '喪屍', 'R', '一步一步走，也能走到目標。'],
      ['vampire', '吸血鬼', 'SR', '夜色降臨，依然保持敏銳觀察。'],
      ['rock', '搖滾', 'SR', '抓準節奏，奏出自己的成交樂章！'],
      ['boxer', '拳擊', 'R', '穩住腳步，每次練習都算數。'],
      ['dino', '恐龍', 'SSR', '好案子出現，準備全力出擊！'],
      ['scientist', '瘋狂科學家', 'SSR', '提出假設，用資料驗證每個想法。'],
      ['alien', '外星', 'SSR', '換個角度，探索全新的可能。'],
      ['cowboy', '牛仔', 'R', '看準方向，穩穩套住好機會。']
    ];
    tonyCharacters.forEach(([key, name, rarity, quote], index) => {
      const id = `tony_${key}`;
      executiveFigurineDatabase[id] = {
        id, name: `${name}托尼`, titleBadge: '托尼宇宙', pool: 'tony', rarity,
        themeColor: '#d7bc6b', bgGradient: 'from-emerald-800 to-slate-900',
        desc: `托尼宇宙的${name}造型，依照你提供的角色圖去背處理。`, quote: `「${quote}」`,
        artworkIndex: index
      };
    });

    const chenArtwork = {};
    const chenArtworkGroups = [
      {file: 'chen-classic-transparent.png', width: 1451, height: 1084,
        ids: ['fig_muscle', 'fig_santa', 'fig_ballet', 'fig_track', 'fig_hiphop', 'fig_moto'],
        frames: [[0,0,510,545],[520,0,470,545],[1000,0,451,545],[45,550,455,534],[530,545,450,539],[1000,550,451,534]]},
      {file: 'chen-extra-transparent.png', width: 1223, height: 1286,
        ids: ['fig_pizza', 'fig_magic', 'fig_chef', 'fig_mermaid', 'fig_dino', 'fig_doctor', 'fig_cowboy', 'fig_vampire', 'fig_astronaut'],
        frames: [[0,0,420,429],[425,0,385,429],[830,0,393,429],[0,432,420,424],[440,432,375,424],[830,432,393,424],[0,858,420,428],[440,858,375,428],[830,858,393,428]]}
    ];
    chenArtworkGroups.forEach(group => group.ids.forEach((id, index) => {
      chenArtwork[id] = {...group, frame: group.frames[index]};
      executiveFigurineDatabase[id].desc = `陳總宇宙的${executiveFigurineDatabase[id].name}造型，依照你提供的角色圖去背處理。`;
    }));

    const muscleEvolutionStages = [
      {name:'健身新手', desc:'灰色訓練上衣、小啞鈴與放鬆站姿，從基本訓練開始。'},
      {name:'穩定鍛鍊', desc:'紅色背心與護腕，肌肉更結實，單手彎臂展現訓練成果。'},
      {name:'黃金肌力', desc:'紅色腹肌造型與雙臂金色肌肉，雙手彎臂展現招牌姿勢。'},
      {name:'力量突破', desc:'黑金力量服、紅色腰帶與重型槓鈴，進入進階力量訓練。'},
      {name:'冠軍陳總', desc:'紅金冠軍戰服、披風與金色獎盃，展現最高星等的勝利姿態。'}
    ];

    function getMuscleEvolutionAvatar(stars, wh) {
      const frames = [[0,130,330,560],[320,130,420,560],[730,120,455,570],[1100,110,690,580],[1710,0,462,690]];
      const [x,y,width,height] = frames[stars-1];
      return `<svg role="img" aria-label="肌肉陳總 ${stars} 星" viewBox="0 0 ${width} ${height}" class="${wh}" style="overflow:hidden"><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" style="overflow:hidden"><image href="./muscle-evolution-approved.png" width="2172" height="724" /></svg></svg>`;
    }

    function getEquippedFigurineStars(figId) {
      const item = userWarehouse.find(w => w.id === figId);
      return item ? Math.max(1, Math.min(item.stars, item.equippedStars ?? item.stars)) : 1;
    }

    function getFigurineAvatarSVG(figId, size = 'md', starOverride = null) {
      const isSm = size === 'sm';
      const isLg = size === 'lg';
      const wh = isSm ? 'w-12 h-14' : isLg ? 'w-24 h-28' : 'w-16 h-20';
      const figurine = executiveFigurineDatabase[figId];
      const evolution = globalThis.characterEvolutionCatalog?.[figId];
      if (evolution) {
        const stars = Math.max(1, Math.min(5, starOverride ?? getEquippedFigurineStars(figId)));
        if(evolution.files) return `<div class="${wh}" style="flex-shrink:0"><img src="./${evolution.files[stars-1]}" alt="${figurine.name} ${stars} 星 · ${evolution.names[stars-1]}" style="width:100%;height:100%;object-fit:contain" /></div>`;
        const column = (stars - 1) % 3;
        const row = Math.floor((stars - 1) / 3);
        const cellWidth = evolution.width / 3, cellHeight = evolution.height / 2;
        const [x,y,width,height] = evolution.frames?.[stars-1] ?? [column*cellWidth,row*cellHeight,cellWidth,cellHeight];
        return `<svg role="img" aria-label="${figurine.name} ${stars} 星 · ${evolution.names[stars-1]}" viewBox="0 0 ${width} ${height}" class="${wh}" style="overflow:hidden"><title>${figurine.name} ${stars} 星</title><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" style="overflow:hidden"><image href="./${evolution.file}" width="${evolution.width}" height="${evolution.height}" /></svg></svg>`;
      }
      if (figurine?.familyRole) return globalThis.renderFamilyAvatar(figId,wh);
      if (figId === 'fig_muscle') {
        const stars = Math.max(1, Math.min(5, starOverride ?? getEquippedFigurineStars(figId)));
        return getMuscleEvolutionAvatar(stars, wh);
      }
      if (chenArtwork[figId]) {
        const artwork = chenArtwork[figId];
        const [x, y, width, height] = artwork.frame;
        return `<svg role="img" aria-label="${figurine.name}" viewBox="0 0 ${width} ${height}" class="${wh}" style="overflow:hidden"><title>${figurine.name}</title><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" style="overflow:hidden"><image href="./${artwork.file}" width="${artwork.width}" height="${artwork.height}" /></svg></svg>`;
      }
      if (figurine?.pool === 'tony') {
        const frames = [
          [40, 50, 315, 344], [390, 48, 305, 346], [745, 48, 310, 346], [1080, 48, 345, 346],
          [45, 395, 285, 335], [375, 395, 350, 335], [765, 394, 310, 336], [1080, 395, 345, 335],
          [55, 730, 315, 350], [425, 730, 290, 350], [720, 730, 325, 350], [1060, 730, 385, 350]
        ];
        const [x, y, width, height] = frames[figurine.artworkIndex];
        return `<svg role="img" aria-label="${figurine.name}" viewBox="0 0 ${width} ${height}" class="${wh}" style="overflow:hidden"><title>${figurine.name}</title><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" style="overflow:hidden"><image href="./tony-transparent.png" width="1451" height="1084" /></svg></svg>`;
      }

      switch(figId) {
        case 'fig_muscle':
          // 貼紙 1：肌肉陳總 - 粗手臂、紅色六塊肌方塊身、強壯黑磚招牌、黑色底牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <!-- 貼紙白邊外框輪廓 (Die-cut Sticker Outline) -->
                <path d="M20 50 Q10 25 35 20 Q60 5 95 15 Q115 30 105 75 Q100 110 85 115 L35 115 Q15 105 20 50 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                
                <!-- 樂高底座凸點板 -->
                <rect x="28" y="94" width="64" height="10" rx="2" fill="#c2a677" stroke="#0f172a" stroke-width="2"/>
                <circle cx="40" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="60" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="80" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>

                <!-- 金光二頭肌粗手臂 (高舉彎曲炫耀) -->
                <path d="M22 66 C10 60 12 28 28 26 C36 26 36 38 28 42 C24 45 26 58 32 64 Z" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>
                <circle cx="28" cy="27" r="4" fill="#d97706" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M98 66 C110 60 108 28 92 26 C84 26 84 38 92 42 C96 45 94 58 88 64 Z" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>
                <circle cx="92" cy="27" r="4" fill="#d97706" stroke="#0f172a" stroke-width="1.5"/>

                <!-- 紅色方塊身軀 (印刷六塊腹肌) -->
                <rect x="36" y="50" width="48" height="44" rx="2" fill="#dc2626" stroke="#0f172a" stroke-width="2.5"/>
                <!-- 六塊肌立體刻線 -->
                <path d="M40 58 Q48 63 60 58 Q72 63 80 58" fill="none" stroke="#7f1d1d" stroke-width="2.2"/>
                <line x1="60" y1="58" x2="60" y2="88" stroke="#7f1d1d" stroke-width="2.2"/>
                <rect x="44" y="64" width="12" height="7" rx="2" fill="none" stroke="#7f1d1d" stroke-width="2"/>
                <rect x="64" y="64" width="12" height="7" rx="2" fill="none" stroke="#7f1d1d" stroke-width="2"/>
                <rect x="44" y="74" width="12" height="7" rx="2" fill="none" stroke="#7f1d1d" stroke-width="2"/>
                <rect x="64" y="74" width="12" height="7" rx="2" fill="none" stroke="#7f1d1d" stroke-width="2"/>

                <!-- 脖子與頭部 -->
                <rect x="53" y="44" width="14" height="7" fill="#fcd34d" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="42" y="20" width="36" height="26" rx="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2.2"/>
                <!-- 烏黑直長髮 -->
                <path d="M38 26 C36 12 84 12 82 26 C82 46 78 52 74 54 C72 38 70 28 60 28 C50 28 48 38 46 54 C42 52 38 46 38 26 Z" fill="#18181b"/>
                <!-- 紅色粗框眼鏡 -->
                <rect x="44" y="25" width="13" height="10" rx="3" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="63" y="25" width="13" height="10" rx="3" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="57" y1="30" x2="63" y2="30" stroke="#dc2626" stroke-width="2.5"/>
                <!-- 咧嘴咬牙搞怪表情 -->
                <circle cx="50" cy="29" r="2" fill="#0f172a"/>
                <circle cx="70" cy="29" r="2" fill="#0f172a"/>
                <rect x="52" y="38" width="16" height="5" rx="2" fill="#fff" stroke="#0f172a" stroke-width="1.8"/>
                <line x1="57" y1="38" x2="57" y2="43" stroke="#0f172a" stroke-width="1.2"/>
                <line x1="63" y1="38" x2="63" y2="43" stroke="#0f172a" stroke-width="1.2"/>

                <!-- 右上方黑色「強壯！」積木磚 -->
                <g transform="translate(74, 2)">
                  <rect x="0" y="3" width="38" height="18" rx="2" fill="#18181b" stroke="#ffffff" stroke-width="1.8"/>
                  <rect x="4" y="0" width="7" height="4" fill="#18181b"/>
                  <rect x="15" y="0" width="7" height="4" fill="#18181b"/>
                  <rect x="26" y="0" width="7" height="4" fill="#18181b"/>
                  <text x="19" y="16" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">強壯！</text>
                </g>

                <!-- 貼紙下方專屬名牌標籤 (肌肉陳總 💪) -->
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#18181b" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#facc15" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#facc15" text-anchor="middle">肌肉陳總 💪</text>
                </g>
              </svg>
            </div>`;

        case 'fig_santa':
          // 貼紙 2：聖誕陳總 - 帶凸點聖誕帽、紅袍金扣、黃色夾手舉起、綠禮物盒、聖誕名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <!-- 貼紙白邊外框輪廓 -->
                <path d="M20 45 Q15 15 40 10 Q70 5 95 15 Q115 35 105 85 Q95 115 85 115 L35 115 Q15 105 20 45 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                
                <!-- 樂高底座 -->
                <rect x="28" y="94" width="64" height="10" rx="2" fill="#c2a677" stroke="#0f172a" stroke-width="2"/>
                <circle cx="40" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="60" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="80" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>

                <!-- 紅色聖誕長身軀幹與金色皮帶 -->
                <rect x="36" y="48" width="48" height="46" rx="2" fill="#dc2626" stroke="#0f172a" stroke-width="2.5"/>
                <rect x="56" y="48" width="8" height="46" fill="#ffffff"/>
                <rect x="36" y="68" width="48" height="9" fill="#18181b"/>
                <rect x="52" y="66" width="16" height="13" rx="1.5" fill="#facc15" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="56" y="70" width="8" height="5" fill="#18181b"/>

                <!-- 右手舉起的黃色樂高夾手 (打招呼) -->
                <path d="M32 54 L18 40 L24 34" fill="none" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
                <rect x="22" y="32" width="5" height="7" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
                <circle cx="21" cy="30" r="5.5" fill="#eab308" stroke="#0f172a" stroke-width="2"/>
                <circle cx="21" cy="30" r="2.5" fill="#ffffff"/>

                <!-- 左手捧著綠色大禮物盒 -->
                <path d="M82 56 L94 62" fill="none" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
                <g transform="translate(72, 50)">
                  <rect x="0" y="0" width="34" height="26" rx="2" fill="#16a34a" stroke="#0f172a" stroke-width="2"/>
                  <!-- 紅色十字緞帶 -->
                  <rect x="14" y="0" width="6" height="26" fill="#dc2626"/>
                  <rect x="0" y="10" width="34" height="6" fill="#dc2626"/>
                  <!-- 蝴蝶結 -->
                  <path d="M14 0 C9 -7 4 0 14 0 Z" fill="#dc2626"/>
                  <path d="M20 0 C25 -7 30 0 20 0 Z" fill="#dc2626"/>
                </g>

                <!-- 脖子與頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <!-- 紅色眼鏡與咬牙表情 -->
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>

                <!-- 聖誕帽子 (帶樂高積木凸點與白絨毛) -->
                <g transform="translate(38, 4)">
                  <rect x="0" y="16" width="44" height="8" rx="2.5" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                  <path d="M6 16 L28 1 L42 16 Z" fill="#dc2626" stroke="#0f172a" stroke-width="2"/>
                  <circle cx="44" cy="18" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
                  <!-- 積木凸點 -->
                  <rect x="22" y="-2" width="6" height="3" fill="#dc2626"/>
                  <rect x="30" y="1" width="6" height="3" fill="#dc2626"/>
                </g>

                <!-- 下方專屬名牌 (🎄 聖誕陳總) -->
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#14532d" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#86efac" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#facc15" text-anchor="middle">🎄 聖誕陳總</text>
                </g>
              </svg>
            </div>`;

        case 'fig_ballet':
          // 貼紙 3：芭蕾陳總 - 弧形雙手向上第五位置、粉紅方塊身、白色百褶 Tutu 澎裙、芭蕾名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <!-- 貼紙白邊外框輪廓 -->
                <path d="M25 45 Q15 10 60 5 Q105 10 95 45 Q115 65 100 85 Q95 115 85 115 L35 115 Q15 105 20 75 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                
                <!-- 旋轉積木底座 -->
                <rect x="28" y="94" width="64" height="10" rx="2" fill="#c2a677" stroke="#0f172a" stroke-width="2"/>
                <circle cx="40" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="60" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="80" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>

                <!-- 雙手高舉優雅弧線 (樂高 C 型夾手 en haut) -->
                <path d="M26 62 C18 42 24 16 42 12" fill="none" stroke="#fcd34d" stroke-width="7" stroke-linecap="round"/>
                <circle cx="42" cy="12" r="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
                <path d="M94 62 C102 42 96 16 78 12" fill="none" stroke="#fcd34d" stroke-width="7" stroke-linecap="round"/>
                <circle cx="78" cy="12" r="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>

                <!-- 雙腿與粉紅舞鞋 -->
                <rect x="48" y="78" width="8" height="16" fill="#fcd34d" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="64" y="78" width="8" height="16" fill="#fcd34d" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="45" y="88" width="14" height="8" rx="2.5" fill="#f472b6" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="61" y="88" width="14" height="8" rx="2.5" fill="#f472b6" stroke="#0f172a" stroke-width="1.8"/>

                <!-- 白色澎澎百褶 Tutu 芭蕾裙 -->
                <path d="M18 66 C28 56 92 56 102 66 C98 78 22 78 18 66 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.8"/>
                <path d="M28 66 L32 75 M44 65 L46 75 M60 64 L60 75 M76 65 L74 75 M92 66 L88 75" stroke="#cbd5e1" stroke-width="2.2"/>

                <!-- 粉紅積木胸甲 (帶 2 個凸點) -->
                <rect x="44" y="44" width="32" height="22" rx="2" fill="#f472b6" stroke="#0f172a" stroke-width="2.5"/>
                <rect x="47" y="40" width="6" height="4" fill="#f472b6" stroke="#0f172a" stroke-width="1"/>
                <rect x="67" y="40" width="6" height="4" fill="#f472b6" stroke="#0f172a" stroke-width="1"/>

                <!-- 脖子與頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <!-- 紅色眼鏡與咬牙神情 -->
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>

                <!-- 下方專屬名牌 (芭蕾陳總 🩰) -->
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#831843" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#fbcfe8" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">芭蕾陳總 🩰</text>
                </g>
              </svg>
            </div>`;

        case 'fig_track':
          // 貼紙 4：田徑陳總 - 天藍長背心、01 金牌、雙臂向上歡呼、田徑名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <!-- 貼紙白邊外框輪廓 -->
                <path d="M22 45 Q15 15 35 15 Q60 5 95 15 Q105 15 98 45 Q105 85 95 115 L25 115 Q15 105 22 45 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                
                <!-- 樂高底座 -->
                <rect x="24" y="94" width="72" height="10" rx="2" fill="#c2a677" stroke="#0f172a" stroke-width="2"/>
                <circle cx="36" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="52" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="68" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="84" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>

                <!-- 雙手向上歡呼 \\o/ -->
                <path d="M30 64 L24 30 L36 26" fill="none" stroke="#fcd34d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="36" cy="26" r="4.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M90 64 L96 30 L84 26" fill="none" stroke="#fcd34d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="84" cy="26" r="4.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>

                <!-- 天藍色長梯形積木運動背心 -->
                <path d="M42 48 L78 48 L86 94 L34 94 Z" fill="#0284c7" stroke="#0f172a" stroke-width="2.8"/>
                <!-- 01 號碼布 -->
                <rect x="46" y="58" width="28" height="20" fill="#ffffff" stroke="#0f172a" stroke-width="2" rx="2"/>
                <text x="60" y="74" font-size="15" font-weight="900" fill="#0f172a" text-anchor="middle">01</text>
                <!-- 紅白藍金牌綬帶與金牌 -->
                <path d="M48 48 L60 62 L72 48" fill="none" stroke="#ef4444" stroke-width="3.5"/>
                <path d="M50 48 L60 60 L70 48" fill="none" stroke="#3b82f6" stroke-width="1.8"/>
                <circle cx="60" cy="64" r="6" fill="#facc15" stroke="#a16207" stroke-width="2"/>

                <!-- 脖子與頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <!-- 紅色眼鏡與自信微笑 -->
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <path d="M52 41 Q60 46 68 41" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>

                <!-- 下方專屬名牌 (田徑陳總 🏅) -->
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#0369a1" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#bae6fd" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#facc15" text-anchor="middle">田徑陳總 🏅</text>
                </g>
              </svg>
            </div>`;

        case 'fig_hiphop':
          // 貼紙 5：嘻哈陳總 - 黑色立體凸點棒球帽、大金鍊 $ 吊墜、積木麥克風、嘻哈名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <!-- 貼紙白邊外框輪廓 -->
                <path d="M20 45 Q10 15 45 10 Q80 5 105 20 Q115 45 100 85 Q95 115 85 115 L25 115 Q15 105 20 45 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                
                <!-- 樂高底座 -->
                <rect x="24" y="94" width="72" height="10" rx="2" fill="#c2a677" stroke="#0f172a" stroke-width="2"/>
                <circle cx="36" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="52" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="68" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>
                <circle cx="84" cy="94" r="3" fill="#a48858" stroke="#0f172a" stroke-width="1"/>

                <!-- 黑色 Oversized 方塊積木軀幹 -->
                <rect x="34" y="48" width="52" height="46" rx="2" fill="#18181b" stroke="#0f172a" stroke-width="2.8"/>
                <!-- 粗大金鍊與 $ 號 -->
                <path d="M42 52 Q60 70 78 52" fill="none" stroke="#facc15" stroke-width="5" stroke-linecap="round"/>
                <circle cx="60" cy="74" r="9" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
                <text x="60" y="81" font-size="15" font-weight="900" fill="#713f12" text-anchor="middle">$</text>

                <!-- 右手持灰色麥克風 (樂高握把) -->
                <path d="M38 56 L22 62" fill="none" stroke="#18181b" stroke-width="8" stroke-linecap="round"/>
                <rect x="16" y="60" width="8" height="7" rx="1" fill="#eab308" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="14" y="44" width="7" height="17" rx="1.5" fill="#475569" stroke="#0f172a" stroke-width="1.8"/>
                <circle cx="17.5" cy="42" r="5" fill="#94a3b8" stroke="#0f172a" stroke-width="1.8"/>

                <!-- 左手黃色樂高夾手 -->
                <path d="M82 56 L94 70" fill="none" stroke="#18181b" stroke-width="8" stroke-linecap="round"/>
                <circle cx="95" cy="74" r="5.5" fill="#eab308" stroke="#0f172a" stroke-width="2"/>

                <!-- 脖子與頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <!-- 紅色眼鏡 -->
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>

                <!-- 黑色積木凸點棒球帽 (反戴/平沿帽) -->
                <g transform="translate(18, 4)">
                  <rect x="20" y="10" width="54" height="15" rx="3" fill="#18181b" stroke="#0f172a" stroke-width="2"/>
                  <rect x="10" y="21" width="52" height="5" fill="#09090b" stroke="#0f172a" stroke-width="1.8"/>
                  <!-- 積木頂部凸點 -->
                  <rect x="30" y="6" width="10" height="4" fill="#18181b" stroke="#0f172a" stroke-width="1.5"/>
                  <rect x="48" y="6" width="10" height="4" fill="#18181b" stroke="#0f172a" stroke-width="1.5"/>
                </g>

                <!-- 下方專屬名牌 (嘻哈陳總 🎤) -->
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#581c87" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#e9d5ff" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#f472b6" text-anchor="middle">嘻哈陳總 🎤</text>
                </g>
              </svg>
            </div>`;

        case 'fig_moto':
          // 貼紙 6：飆車陳總 - 黑白格子旗安全帽、黃黑越野機車、龍頭把手、飆車名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M25 45 Q15 15 50 10 Q85 5 95 30 Q115 65 105 85 Q95 115 85 115 L25 115 Q15 105 25 45 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <circle cx="42" cy="80" r="16" fill="#18181b" stroke="#0f172a" stroke-width="2.8"/>
                <circle cx="42" cy="80" r="8" fill="#eab308" stroke="#0f172a" stroke-width="2"/>
                <polygon points="40,66 70,54 90,66 84,82 50,82" fill="#eab308" stroke="#0f172a" stroke-width="2.5"/>
                <rect x="80" y="74" width="20" height="7" rx="2" fill="#475569" stroke="#0f172a" stroke-width="1.8"/>
                <rect x="48" y="44" width="30" height="26" rx="2" fill="#dc2626" stroke="#0f172a" stroke-width="2.5"/>
                <path d="M46 50 L62 60 L66 56" fill="none" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
                <path d="M74 50 L70 58" fill="none" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
                <rect x="50" y="54" width="20" height="5" fill="#0f172a"/>
                <rect x="46" y="24" width="28" height="22" rx="5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M43 28 C41 18 79 18 77 28 C77 38 74 44 71 46 C68 34 67 28 61 28 C55 28 54 34 51 46 C48 44 45 38 43 28 Z" fill="#18181b"/>
                <rect x="48" y="27" width="10" height="8" rx="2" fill="#fff" stroke="#dc2626" stroke-width="2"/>
                <rect x="62" y="27" width="10" height="8" rx="2" fill="#fff" stroke="#dc2626" stroke-width="2"/>
                <line x1="58" y1="31" x2="62" y2="31" stroke="#dc2626" stroke-width="2"/>
                <g transform="translate(36, 4)">
                  <path d="M8 20 C8 4 40 4 40 20 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
                  <rect x="12" y="10" width="6" height="5" fill="#18181b"/>
                  <rect x="18" y="10" width="6" height="5" fill="#ffffff"/>
                  <rect x="24" y="10" width="6" height="5" fill="#18181b"/>
                  <rect x="30" y="10" width="6" height="5" fill="#ffffff"/>
                  <rect x="12" y="15" width="6" height="5" fill="#ffffff"/>
                  <rect x="18" y="15" width="6" height="5" fill="#18181b"/>
                  <rect x="24" y="15" width="6" height="5" fill="#ffffff"/>
                  <rect x="30" y="15" width="6" height="5" fill="#18181b"/>
                  <path d="M4 20 L44 20 L40 24 L8 24 Z" fill="#18181b"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#c2410c" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#fed7aa" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#facc15" text-anchor="middle">飆車陳總 🏍️</text>
                </g>
              </svg>
            </div>`;

        case 'fig_pizza':
          // 貼紙 7：披薩陳總 - 倒三角金黃起司套裝、臘腸片、右手小披薩盤、名牌
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M15 15 Q60 5 105 15 Q115 50 100 85 Q95 115 85 115 L25 115 Q15 105 10 50 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <polygon points="20,16 100,16 60,94" fill="#eab308" stroke="#0f172a" stroke-width="2.5"/>
                <path d="M20 16 Q60 8 100 16 L96 24 Q60 16 24 24 Z" fill="#b45309" stroke="#0f172a" stroke-width="2"/>
                <circle cx="45" cy="35" r="6" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="75" cy="35" r="6" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="60" cy="58" r="6" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="45" cy="74" r="5" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="68" cy="74" r="5" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 頭部鑲嵌在披薩洞中 -->
                <rect x="42" y="24" width="36" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M38 28 C36 18 82 18 80 28 C80 44 76 50 72 52 C70 38 68 28 60 28 C52 28 50 38 48 52 C44 50 40 44 38 28 Z" fill="#18181b"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 右手拿小披薩盤 -->
                <g transform="translate(80, 52)">
                  <circle cx="16" cy="16" r="14" fill="#fed7aa" stroke="#0f172a" stroke-width="2"/>
                  <circle cx="16" cy="16" r="11" fill="#facc15" stroke="#b45309" stroke-width="1.5"/>
                  <line x1="16" y1="5" x2="16" y2="27" stroke="#b45309" stroke-width="1.5"/>
                  <line x1="5" y1="16" x2="27" y2="16" stroke="#b45309" stroke-width="1.5"/>
                  <circle cx="12" cy="12" r="2" fill="#dc2626"/>
                  <circle cx="20" cy="12" r="2" fill="#dc2626"/>
                  <circle cx="12" cy="20" r="2" fill="#dc2626"/>
                  <circle cx="20" cy="20" r="2" fill="#dc2626"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#b45309" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#fef08a" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#fef08a" text-anchor="middle">披薩陳總 🍕</text>
                </g>
              </svg>
            </div>`;

        case 'fig_magic':
          // 貼紙 8：魔法陳總 - 尖巫師帽、星光法袍、發光魔法棒
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 40 Q25 5 60 5 Q95 5 100 40 Q115 70 100 95 Q95 115 85 115 L25 115 Q15 105 10 70 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <polygon points="30,48 90,48 98,94 22,94" fill="#1e3a8a" stroke="#0f172a" stroke-width="2.5"/>
                <!-- 法袍星星點綴 -->
                <text x="38" y="70" font-size="10" fill="#facc15">★</text>
                <text x="75" y="66" font-size="9" fill="#facc15">★</text>
                <text x="56" y="85" font-size="11" fill="#facc15">★</text>
                <!-- 脖子與頭部 -->
                <rect x="44" y="28" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 32 C38 22 80 22 78 32 C78 48 75 52 71 54 C68 40 67 30 59 30 C51 30 50 40 47 54 C44 52 40 48 40 32 Z" fill="#18181b"/>
                <rect x="46" y="32" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="32" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="36" x2="62" y2="36" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="36" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="36" r="1.8" fill="#0f172a"/>
                <rect x="52" y="43" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 藍色尖頂巫師帽 -->
                <g transform="translate(24, 6)">
                  <polygon points="12,22 60,22 36,0" fill="#1d4ed8" stroke="#0f172a" stroke-width="2.5"/>
                  <ellipse cx="36" cy="22" rx="34" ry="7" fill="#1e40af" stroke="#0f172a" stroke-width="2"/>
                  <text x="32" y="15" font-size="9" fill="#facc15">★</text>
                </g>
                <!-- 右手握魔法魔杖與發光光芒 -->
                <g transform="translate(14, 38)">
                  <line x1="16" y1="34" x2="6" y2="10" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
                  <polygon points="6,4 9,9 14,9 10,13 12,18 7,15 2,18 4,13 0,9 5,9" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#1e3a8a" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#93c5fd" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#93c5fd" text-anchor="middle">魔法陳總 🪄</text>
                </g>
              </svg>
            </div>`;

        case 'fig_chef':
          // 貼紙 9：廚神陳總 - 蓬鬆主廚高帽、雙排扣主廚服、左手平底鍋右手打蛋器
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 30 Q25 5 60 5 Q95 5 100 30 Q115 60 105 95 Q95 115 85 115 L25 115 Q15 105 10 60 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <!-- 白色主廚服雙排扣 -->
                <rect x="34" y="48" width="52" height="46" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
                <line x1="60" y1="48" x2="60" y2="94" stroke="#e2e8f0" stroke-width="2"/>
                <circle cx="48" cy="58" r="2" fill="#0f172a"/>
                <circle cx="72" cy="58" r="2" fill="#0f172a"/>
                <circle cx="48" cy="70" r="2" fill="#0f172a"/>
                <circle cx="72" cy="70" r="2" fill="#0f172a"/>
                <circle cx="48" cy="82" r="2" fill="#0f172a"/>
                <circle cx="72" cy="82" r="2" fill="#0f172a"/>
                <!-- 頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 高聳白色主廚帽 -->
                <g transform="translate(32, 2)">
                  <path d="M10 20 C0 8 16 -2 28 4 C38 -4 56 6 46 20 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
                  <rect x="12" y="16" width="32" height="7" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
                </g>
                <!-- 打蛋器 (左) -->
                <g transform="translate(12, 38)">
                  <line x1="16" y1="36" x2="16" y2="20" stroke="#64748b" stroke-width="3"/>
                  <ellipse cx="16" cy="12" rx="6" ry="10" fill="none" stroke="#64748b" stroke-width="2"/>
                  <ellipse cx="16" cy="12" rx="3" ry="10" fill="none" stroke="#64748b" stroke-width="1.5"/>
                </g>
                <!-- 平底煎鍋 (右) -->
                <g transform="translate(86, 42)">
                  <ellipse cx="14" cy="14" rx="12" ry="12" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
                  <ellipse cx="14" cy="14" rx="9" ry="9" fill="#334155"/>
                  <line x1="2" y1="24" x2="10" y2="18" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#334155" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#f1f5f9" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#f1f5f9" text-anchor="middle">廚神陳總 🍳</text>
                </g>
              </svg>
            </div>`;

        case 'fig_mermaid':
          // 貼紙 10：美人魚陳總 - 三眼頭箍、紫貝殼上衣、翠綠魚尾、外星雷射槍
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 40 Q25 5 60 5 Q95 5 100 40 Q115 70 100 95 Q95 115 85 115 L25 115 Q15 105 10 70 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <!-- 肉色上身 + 紫色貝殼比基尼 -->
                <rect x="36" y="48" width="48" height="24" rx="2" fill="#fed7aa" stroke="#0f172a" stroke-width="2.5"/>
                <circle cx="48" cy="58" r="6" fill="#a855f7" stroke="#0f172a" stroke-width="1.8"/>
                <circle cx="72" cy="58" r="6" fill="#a855f7" stroke="#0f172a" stroke-width="1.8"/>
                <!-- 翠綠魚尾裙與尾鰭 -->
                <path d="M38 72 L82 72 L76 95 L44 95 Z" fill="#0d9488" stroke="#0f172a" stroke-width="2.5"/>
                <path d="M60 95 Q40 105 45 115 Q60 106 75 115 Q80 105 60 95 Z" fill="#14b8a6" stroke="#0f172a" stroke-width="2"/>
                <!-- 頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 三眼外星人頭飾 -->
                <g transform="translate(36, 4)">
                  <path d="M4 18 Q24 8 44 18" stroke="#22c55e" stroke-width="4" fill="none"/>
                  <circle cx="10" cy="8" r="4.5" fill="#22c55e" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="10" cy="8" r="2" fill="#fff"/>
                  <circle cx="24" cy="4" r="5" fill="#22c55e" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="24" cy="4" r="2" fill="#fff"/>
                  <circle cx="38" cy="8" r="4.5" fill="#22c55e" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="38" cy="8" r="2" fill="#fff"/>
                </g>
                <!-- 雷射光槍 (左手持) -->
                <g transform="translate(12, 54)">
                  <rect x="4" y="8" width="16" height="8" rx="2" fill="#94a3b8" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="2" cy="12" r="4" fill="#f43f5e"/>
                  <line x1="16" y1="12" x2="22" y2="12" stroke="#0f172a" stroke-width="2"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#0f766e" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#5eead4" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#5eead4" text-anchor="middle">美人魚陳總 🧜</text>
                </g>
              </svg>
            </div>`;

        case 'fig_dino':
          // 貼紙 11：恐龍陳總 - 綠色暴龍巨齒裝、恐龍尾巴、霸氣利爪
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 30 Q30 5 65 5 Q95 5 105 35 Q115 70 100 95 Q95 115 85 115 L25 115 Q15 105 10 65 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <!-- 綠色恐龍肚子與背甲 -->
                <rect x="34" y="48" width="52" height="46" rx="4" fill="#16a34a" stroke="#0f172a" stroke-width="2.5"/>
                <ellipse cx="60" cy="72" rx="16" ry="18" fill="#86efac" stroke="#15803d" stroke-width="1.8"/>
                <!-- 恐龍尾巴 (左後方擺出) -->
                <path d="M34 82 Q14 88 18 98 Q30 96 36 92 Z" fill="#16a34a" stroke="#0f172a" stroke-width="2"/>
                <!-- 恐龍大頭套與巨齒 -->
                <g transform="translate(28, 4)">
                  <path d="M12 28 C10 8 54 8 52 28 Z" fill="#16a34a" stroke="#0f172a" stroke-width="2.5"/>
                  <circle cx="22" cy="14" r="5" fill="#eab308" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="22" cy="14" r="2" fill="#0f172a"/>
                  <circle cx="42" cy="14" r="5" fill="#eab308" stroke="#0f172a" stroke-width="1.5"/>
                  <circle cx="42" cy="14" r="2" fill="#0f172a"/>
                  <!-- 上下尖利牙齒 -->
                  <polygon points="16,28 20,24 24,28 28,24 32,28 36,24 40,28 44,24 48,28" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
                </g>
                <!-- 露在恐龍口中的陳總臉 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#14532d" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#86efac" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#86efac" text-anchor="middle">恐龍陳總 🦖</text>
                </g>
              </svg>
            </div>`;

        case 'fig_doctor':
          // 貼紙 12：醫生陳總 - 白袍、聽診器、巨大針筒
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 40 Q25 15 60 15 Q95 15 100 40 Q115 70 100 95 Q95 115 85 115 L25 115 Q15 105 10 70 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <rect x="34" y="48" width="52" height="46" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
                <polygon points="46,48 60,64 74,48" fill="#0284c7"/>
                <path d="M48 52 C46 64 74 64 72 52" fill="none" stroke="#475569" stroke-width="2.5"/>
                <circle cx="60" cy="62" r="4" fill="#94a3b8" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 頭部 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 18 80 18 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#18181b"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="32" r="1.8" fill="#0f172a"/>
                <rect x="52" y="39" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 巨大注射筒 (左手持) -->
                <g transform="translate(10, 42)">
                  <rect x="10" y="8" width="8" height="26" fill="#bae6fd" stroke="#0f172a" stroke-width="1.8"/>
                  <line x1="10" y1="14" x2="18" y2="14" stroke="#0284c7" stroke-width="1"/>
                  <line x1="10" y1="20" x2="18" y2="20" stroke="#0284c7" stroke-width="1"/>
                  <line x1="10" y1="26" x2="18" y2="26" stroke="#0284c7" stroke-width="1"/>
                  <rect x="8" y="4" width="12" height="4" fill="#94a3b8" stroke="#0f172a" stroke-width="1.5"/>
                  <line x1="14" y1="4" x2="14" y2="0" stroke="#0f172a" stroke-width="2"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#0369a1" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#bae6fd" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#bae6fd" text-anchor="middle">醫生陳總 🩺</text>
                </g>
              </svg>
            </div>`;

        case 'fig_cowboy':
          // 貼紙 13：牛仔陳總 - 寬邊牛仔帽、警長星徽背心、套索繩套
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M15 45 Q20 15 60 15 Q100 15 105 45 Q115 75 100 95 Q95 115 85 115 L25 115 Q15 105 10 75 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <rect x="34" y="52" width="52" height="42" rx="2" fill="#0284c7" stroke="#0f172a" stroke-width="2.5"/>
                <!-- 警長五角星徽章 -->
                <polygon points="46,58 48,63 53,63 49,66 51,71 46,68 41,71 43,66 39,63 44,63" fill="#facc15" stroke="#a16207" stroke-width="1"/>
                <rect x="34" y="84" width="52" height="8" fill="#78350f" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="54" y="82" width="12" height="12" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 頭部 -->
                <rect x="44" y="26" width="32" height="24" rx="6" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 30 C38 20 80 20 78 30 C78 46 75 52 71 54 C68 40 67 30 59 30 C51 30 50 40 47 54 C44 52 40 46 40 30 Z" fill="#18181b"/>
                <rect x="46" y="30" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="30" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="34" x2="62" y2="34" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="34" r="1.8" fill="#0f172a"/>
                <circle cx="68" cy="34" r="1.8" fill="#0f172a"/>
                <rect x="52" y="41" width="16" height="4.5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <!-- 寬邊棕色牛仔帽 -->
                <g transform="translate(18, 6)">
                  <ellipse cx="42" cy="22" rx="40" ry="12" fill="#854d0e" stroke="#0f172a" stroke-width="2.5"/>
                  <path d="M26 20 C24 4 60 4 58 20 Z" fill="#713f12" stroke="#0f172a" stroke-width="2.2"/>
                </g>
                <!-- 套索 (左手持) -->
                <g transform="translate(10, 52)">
                  <ellipse cx="14" cy="18" rx="8" ry="14" fill="none" stroke="#d97706" stroke-width="3"/>
                  <path d="M14 32 Q20 38 24 36" fill="none" stroke="#d97706" stroke-width="3"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#78350f" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#fed7aa" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#fed7aa" text-anchor="middle">牛仔陳總 🤠</text>
                </g>
              </svg>
            </div>`;

        case 'fig_vampire':
          // 貼紙 14：吸血鬼陳總 - 紅黑立領披風、白色皺褶領巾、吸血尖牙、銀高腳杯
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M18 40 Q25 10 60 10 Q95 10 102 40 Q115 70 100 95 Q95 115 85 115 L25 115 Q15 105 10 70 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <!-- 紅黑立領斗篷 -->
                <polygon points="26,38 38,94 82,94 94,38 78,54 60,46 42,54" fill="#991b1b" stroke="#0f172a" stroke-width="2.5"/>
                <polygon points="36,54 84,54 78,94 42,94" fill="#18181b" stroke="#0f172a" stroke-width="2"/>
                <path d="M52 54 L60 66 L68 54 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
                <!-- 慘白/淡黃頭部與尖牙 -->
                <rect x="44" y="24" width="32" height="24" rx="6" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
                <path d="M40 28 C38 16 80 16 78 28 C78 44 75 50 71 52 C68 38 67 28 59 28 C51 28 50 38 47 52 C44 50 40 44 40 28 Z" fill="#09090b"/>
                <rect x="46" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <rect x="62" y="28" width="12" height="9" rx="2.5" fill="#fff" stroke="#dc2626" stroke-width="2.2"/>
                <line x1="58" y1="32" x2="62" y2="32" stroke="#dc2626" stroke-width="2.5"/>
                <circle cx="52" cy="32" r="1.8" fill="#dc2626"/>
                <circle cx="68" cy="32" r="1.8" fill="#dc2626"/>
                <!-- 獠牙咬牙表情 -->
                <rect x="52" y="39" width="16" height="5" rx="1.5" fill="#fff" stroke="#0f172a" stroke-width="1.5"/>
                <polygon points="53,44 55,48 57,44" fill="#fff"/>
                <polygon points="63,44 65,48 67,44" fill="#fff"/>
                <!-- 銀高腳杯 (右手持) -->
                <g transform="translate(84, 52)">
                  <path d="M8 8 L20 8 L18 18 Q14 22 14 26 L10 26 L10 18 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8"/>
                  <rect x="6" y="26" width="16" height="3" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#450a0a" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#fca5a5" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#fca5a5" text-anchor="middle">吸血鬼陳總 🧛</text>
                </g>
              </svg>
            </div>`;

        case 'fig_astronaut':
          // 貼紙 15：太空人陳總 - 透明圓弧頭盔、太空服儀表、氧氣鋼瓶背包
          return `
            <div class="${wh} relative flex flex-col items-center justify-center shrink-0 drop-shadow-md">
              <svg viewBox="0 0 120 130" class="w-full h-full">
                <path d="M20 30 Q25 10 60 10 Q95 10 100 30 Q115 65 105 95 Q95 115 85 115 L25 115 Q15 105 10 65 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
                <!-- 白色太空服軀幹 -->
                <rect x="34" y="52" width="52" height="42" rx="4" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5"/>
                <!-- 胸前控制面板 -->
                <rect x="44" y="60" width="32" height="18" rx="2" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.8"/>
                <circle cx="50" cy="66" r="3" fill="#3b82f6"/>
                <circle cx="58" cy="66" r="3" fill="#ef4444"/>
                <rect x="64" y="64" width="8" height="4" fill="#10b981"/>
                <rect x="48" y="72" width="24" height="3" fill="#475569"/>
                <!-- 身後氧氣背包 (兩側露出) -->
                <rect x="26" y="54" width="8" height="30" rx="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>
                <rect x="86" y="54" width="8" height="30" rx="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>
                <!-- 透明太空頭盔與內部陳總面容 -->
                <g transform="translate(32, 10)">
                  <circle cx="28" cy="26" r="24" fill="#e0f2fe" stroke="#0f172a" stroke-width="2.8"/>
                  <ellipse cx="22" cy="18" rx="6" ry="12" fill="#ffffff" opacity="0.6"/>
                  <!-- 頭部 -->
                  <rect x="14" y="16" width="28" height="20" rx="5" fill="#fcd34d" stroke="#0f172a" stroke-width="1.8"/>
                  <rect x="16" y="20" width="10" height="7" rx="2" fill="#fff" stroke="#dc2626" stroke-width="1.8"/>
                  <rect x="28" y="20" width="10" height="7" rx="2" fill="#fff" stroke="#dc2626" stroke-width="1.8"/>
                  <circle cx="21" cy="23" r="1.5" fill="#0f172a"/>
                  <circle cx="33" cy="23" r="1.5" fill="#0f172a"/>
                  <rect x="21" y="28" width="12" height="3.5" rx="1" fill="#fff" stroke="#0f172a" stroke-width="1.2"/>
                </g>
                <g transform="translate(14, 106)">
                  <rect x="0" y="0" width="92" height="20" rx="5" fill="#0f172a" stroke="#ffffff" stroke-width="2"/>
                  <rect x="2" y="2" width="88" height="16" rx="4" fill="none" stroke="#38bdf8" stroke-width="1.2"/>
                  <text x="44" y="14" font-size="11" font-weight="900" fill="#38bdf8" text-anchor="middle">太空人陳總 👨‍🚀</text>
                </g>
              </svg>
            </div>`;
      }
    }
    // 依據 PRD 完整建置 5 大領域 01~06 關實機可玩的闖關題庫
    let currentActiveSchoolStageNum = 1;
    let currentSelectedPlayOption = null;
    let currentSliderValue = 4;
    let stageBossHp = 100;
    let userPairAnswers = {};

    const schoolStagesDatabase = {
      'tax': {
        1: {
          type: 'pair',
          title: '第 01 關：房地合一稅 2.0 持有年限與稅率配對',
          desc: '【名詞與基礎觀念】請查核境內個人持有房地期間，並為每一項點選其適用的法定房地合一稅率：',
          pairs: [
            { id: 'p1', left: '境內個人持有 2 年以內', right: '45%' },
            { id: 'p2', left: '境內個人持有超過 2 年，未逾 5 年', right: '35%' },
            { id: 'p3', left: '境內個人持有超過 5 年，未逾 10 年', right: '20%' },
            { id: 'p4', left: '境內個人持有超過 10 年以上', right: '15%' }
          ],
          rateOptions: ['45%', '35%', '20%', '15%']
        },
        2: {
          type: 'choice',
          title: '第 02 關：自住房地重購退稅適用要件判斷',
          desc: '【適用條件判斷】屋主小王想辦理房地合一稅「自住重購退稅」，以下哪一項是必備的法定要件？',
          options: [
            { id: 'A', text: '出售與重購房屋的登記所有權人，本人、配偶或未成年子女須於該地辦竣戶籍登記並居住，且重購後 5 年內不得改作其他用途或移轉。', correct: true },
            { id: 'B', text: '出售舊屋後，只要在 8 年內買入新屋即可申請全額退稅。', correct: false },
            { id: 'C', text: '重購退稅後的新屋，次月即可出租給他人補貼房貸。', correct: false },
            { id: 'D', text: '只要是同一個行政區內的房屋買賣，不需設籍也能辦理退稅。', correct: false }
          ],
          analysis: '正確！自住房地重購退稅規定：所有權人、配偶或未成年子女須辦竣戶籍登記並實際居住，且重購後 5 年內不得改作其他用途或移轉！'
        },
        3: {
          type: 'inspection',
          title: '第 03 關：標的物現況說明書（漏水瑕疵）實境找碴',
          desc: '【表單識讀找碴】導師 A-yi 提醒：「這份剛收回的委託現況說明書有一處重大矛盾漏填會引發糾紛，請點出是哪個區塊！」',
          flaws: [
            { id: 'blockA', label: '區塊 A：建築主要用途勾選「集合住宅」', isFlaw: false, text: '此欄勾選合規無瑕疵。' },
            { id: 'blockB', label: '區塊 B：第 29 項次「是否有滲漏水情形」勾選【是】', isFlaw: false, text: '此欄如實勾選有漏水。' },
            { id: 'blockC', label: '區塊 C：滲漏水「具體位置與修繕協議」欄位完全空白未註記', isFlaw: true, text: '抓到了！現況說明書若勾選有滲漏水，必須詳載滲水位置並約定是否由屋主修繕或折抵價金，空白將引發日後民事求償爭議！' }
          ]
        },
        4: {
          type: 'choice',
          title: '第 04 關：實務地雷：繼承取得房地出售課稅舊制判讀',
          desc: '【常見實務地雷】屋主林先生於 112 年繼承父親在 103 年買入之老宅並於今年出售，房地合一稅應如何適用？',
          options: [
            { id: 'A', text: '被繼承人取得於 104/12/31 以前，林先生出售原則適用舊制財產交易所得稅（房地分開課稅），免課房地合一稅！', correct: true },
            { id: 'B', text: '一律按林先生繼承登記日 112 年起算，持有未滿 2 年強制課徵 45% 房地合一重稅。', correct: false },
            { id: 'C', text: '必須強制按新制 35% 稅率申報。', correct: false },
            { id: 'D', text: '不論何時取得，繼承取得房地皆永久免稅。', correct: false }
          ],
          analysis: '恭喜過關！被繼承人於 105 年 1 月 1 日前取得者，繼承人出售原則上適用舊制財產交易所得稅，大幅減免稅負地雷！'
        },
        5: {
          type: 'slider',
          title: '第 05 關：數據試算：專任約違約罰則金額比例',
          desc: '【進階數據試算】專任委託總價 2,000 萬，屋主於委託有效期間內「私自出售予他人」，依信義委託契約約定，屋主應給付相當於服務報酬之違約金比例為何？請滑動拉桿至正確比例！',
          min: 1, max: 8, correctVal: 4, unit: '%',
          hint: '滑動拉桿選定百分比（相當於法定最高委託服務報酬率 4%）'
        },
        6: {
          type: 'boss',
          title: '第 06 關：Boss 綜合實戰：刁鑽客戶稅務快問快答',
          desc: '【Boss 實戰戰場】客戶陳董情緒激動：「我這間店面要是簽一般約給你們賣，萬一我自己找到買方成交，你們憑什麼收我服務費？」',
          options: [
            { id: 'A', text: '「陳董您放心！一般委託契約下，若您自己找到非信義仲介引薦的買方自行成交，我們完全不收取任何服務報酬！」', correct: true, damage: 100 },
            { id: 'B', text: '「只要掛在我們店裡，不管誰賣掉都要付 4% 啦，這是行業規矩！」', correct: false, damage: 0 },
            { id: 'C', text: '「那就看我們店長的心情決定要不要打折囉。」', correct: false, damage: 0 }
          ]
        }
      },
      'mortgage': {
        1: {
          type: 'choice',
          title: '第 01 關：新青安貸款最高額度與年限',
          desc: '【名詞與基礎觀念】財政部「新青年安心成家貸款」目前的最高貸款額度與最長貸款年限為何？',
          options: [
            { id: 'A', text: '最高額度 1,000 萬元、最長 40 年、寬限期最長 5 年。', correct: true },
            { id: 'B', text: '最高額度 800 萬元、最長 30 年、寬限期 3 年。', correct: false },
            { id: 'C', text: '最高額度 1,500 萬元、最長 50 年、寬限期 10 年。', correct: false }
          ]
        },
        2: {
          type: 'choice',
          title: '第 02 關：央行第 7 波信用管制：名下有房首購限制',
          desc: '【適用條件判斷】買方名下已有繼承持分房屋（有房無貸），向銀行申辦第 1 戶購置住宅貸款時，是否享有寬限期？',
          options: [
            { id: 'A', text: '依現行信用管制，名下有房屋者申辦第 1 戶購屋貸款，不得享有寬限期！', correct: true },
            { id: 'B', text: '只要沒有貸款，一律享有最長 5 年寬限期。', correct: false },
            { id: 'C', text: '由承貸銀行主管自由心證決定。', correct: false }
          ]
        },
        3: {
          type: 'inspection',
          title: '第 03 關：豪宅線（高價住宅）認定標準查核',
          desc: '【表單識讀找碴】台北市總價多少以上之住宅會被列為央行管制之「高價住宅（豪宅）」而限貸 3 成無寬限期？',
          flaws: [
            { id: 'blockA', label: '新北市豪宅線：4,000 萬元', isFlaw: false, text: '新北豪宅線確實為4,000萬。' },
            { id: 'blockB', label: '台北市豪宅線：誤標為 8,000 萬元', isFlaw: true, text: '抓到了！央行規定台北市高價住宅門檻為「總價 7,000 萬元以上」，非 8,000 萬！' },
            { id: 'blockC', label: '其他縣市豪宅線：3,000 萬元', isFlaw: false, text: '其他地區標準合規。' }
          ]
        },
        4: {
          type: 'choice',
          title: '第 04 關：換屋族簽署切結書期限規定',
          desc: '【常見實務地雷】換屋族申辦第 2 戶購屋貸款若要排除成數限制，必須切結在多久之內將第 1 戶舊屋出售並完成塗銷？',
          options: [
            { id: 'A', text: '於產權登記完成日起 1 年以內出售並塗銷第 1 戶抵押權。', correct: true },
            { id: 'B', text: '2 年以內出售即可。', correct: false },
            { id: 'C', text: '只要在委託有效期間內即可無限期延長。', correct: false }
          ]
        },
        5: {
          type: 'slider',
          title: '第 05 關：第二戶房貸最高成數試算',
          desc: '【進階數據試算】在央行受管制地區（六都及新竹縣市），自然人購買「第二戶住宅貸款」法定最高成數為何？請滑動拉桿！',
          min: 1, max: 8, correctVal: 5, unit: '成',
          hint: '滑動拉桿選定成數（央行第七波信用管制第二戶上限）'
        },
        6: {
          type: 'boss',
          title: '第 06 關：Boss 實戰：買方貸款成數不足抗性',
          desc: '【Boss 實戰戰場】買方張先生驚恐質問：「當初你說這間可以貸到八成，現在銀行鑑價出來只能貸七成，自備款差了 150 萬，你們是不是要騙我斡旋金？」',
          options: [
            { id: 'A', text: '「張先生請您先放寬心！我們在要約/斡旋契約中已特別加註『若貸款成數不足八成，本契約無條件解除退還價金』條款，您的資金絕對安全，我也會立刻協助送件第二家配合公股銀行爭取最優鑑價！」', correct: true, damage: 100 },
            { id: 'B', text: '「這鑑價是銀行的問題啊，合約簽了就不能反悔，不然斡旋金會被沒收喔。」', correct: false, damage: 0 },
            { id: 'C', text: '「那您看要不要找信貸借一下補足？」', correct: false, damage: 0 }
          ]
        }
      }
    };

    function launchSchoolStage(stageNumber) {
      currentActiveSchoolStageNum = stageNumber;
      currentSelectedPlayOption = null;
      userPairAnswers = {};

      const domainKey = currentSchoolDomain || 'tax';
      const stageData = (schoolStagesDatabase[domainKey] && schoolStagesDatabase[domainKey][stageNumber]) 
        || schoolStagesDatabase['tax'][stageNumber];

      const modal = document.getElementById('modal-school-stage-play');
      const titleEl = document.getElementById('stage-play-title');
      const domainTag = document.getElementById('stage-play-domain-tag');
      const contentArea = document.getElementById('stage-play-content-area');

      if (!modal || !titleEl || !contentArea) return;

      domainTag.innerText = domainKey === 'tax' ? '🪙 稅務' : domainKey === 'mortgage' ? '🏦 貸款' : domainKey === 'contract' ? '📝 契據' : domainKey === 'law' ? '⚖️ 法規' : '🏘️ 行情';
      titleEl.innerText = stageData.title;

      contentArea.innerHTML = '';

      if (stageData.type === 'pair') {
        const rateOptions = stageData.rateOptions || ['45%', '35%', '20%', '15%'];
        contentArea.innerHTML = `
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-300 text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
            ${stageData.desc}
          </div>
          <div class="space-y-2.5 text-xs sm:text-sm">
            ${stageData.pairs.map((p) => `
              <div class="p-3 bg-white rounded-xl border-2 border-slate-900 lego-card-sm space-y-2 transition-all" id="pair-card-${p.id}">
                <div class="flex justify-between items-center">
                  <span class="font-black text-slate-900 text-xs sm:text-sm leading-snug">${p.left}</span>
                  <span id="pair-badge-${p.id}" class="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-300">尚未選擇</span>
                </div>
                <div class="grid grid-cols-4 gap-2 pt-0.5">
                  ${rateOptions.map(rate => `
                    <button type="button" onclick="selectPairRate('${p.id}', '${rate}')" id="btn-pair-${p.id}-${rate.replace('%', '')}" class="py-1.5 px-1 text-center rounded-lg border-2 border-slate-800 font-black text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 lego-btn transition-all">
                      ${rate}
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-1.5">
            <span>💡 提示：</span> <span>點選每一道年限條件對應的稅率按鈕，全數配對正確後點擊下方送出！</span>
          </div>
        `;
      } else if (stageData.type === 'choice') {
        contentArea.innerHTML = `
          <div class="bg-blue-50 p-3 rounded-xl border border-blue-300 text-xs sm:text-sm text-blue-950 font-bold leading-relaxed">
            ${stageData.desc}
          </div>
          <div class="space-y-2.5" id="stage-choice-options-list">
            ${stageData.options.map(opt => `
              <button onclick="selectStageChoiceOption('${opt.id}', ${opt.correct})" id="stage-opt-${opt.id}" class="w-full text-left p-3.5 rounded-xl border-2 border-slate-800 bg-white hover:bg-slate-50 font-bold lego-btn transition-all flex items-start gap-2.5">
                <span class="font-pixel text-lego-blue font-black mt-0.5 text-xs sm:text-sm">${opt.id}.</span>
                <span class="text-xs sm:text-sm text-slate-900 leading-snug font-bold">${opt.text}</span>
              </button>
            `).join('')}
          </div>
        `;
      } else if (stageData.type === 'inspection') {
        contentArea.innerHTML = `
          <div class="bg-rose-50 p-3 rounded-xl border border-rose-300 text-xs sm:text-sm text-rose-950 font-bold leading-relaxed">
            ${stageData.desc}
          </div>
          <div class="space-y-2.5">
            ${stageData.flaws.map(f => `
              <div onclick="selectInspectionFlaw('${f.id}', ${f.isFlaw}, '${f.text}')" id="flaw-${f.id}" class="p-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-50 cursor-pointer lego-btn transition-all">
                <div class="flex justify-between items-center">
                  <span class="font-black text-slate-900 text-xs sm:text-sm">${f.label}</span>
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-300">點擊查核</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (stageData.type === 'slider') {
        currentSliderValue = 4;
        contentArea.innerHTML = `
          <div class="bg-amber-50 p-3 rounded-xl border border-amber-300 text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
            ${stageData.desc}
          </div>
          <div class="bg-white p-4 rounded-2xl border-2 border-slate-900 text-center space-y-3 lego-card-sm">
            <div class="text-xs font-bold text-slate-600">當前拉桿選擇數值：</div>
            <div class="text-4xl font-black font-pixel text-sinyi-green py-1">
              <span id="slider-display-val">4</span> ${stageData.unit}
            </div>
            <input type="range" min="${stageData.min}" max="${stageData.max}" step="1" value="4" oninput="updateStageSliderVal(this.value)" class="w-full accent-sinyi-green h-2.5 bg-slate-200 rounded-lg cursor-pointer">
            <div class="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500">
              <span>${stageData.min} ${stageData.unit}</span>
              <span>正確答案：${stageData.correctVal} ${stageData.unit}</span>
              <span>${stageData.max} ${stageData.unit}</span>
            </div>
          </div>
        `;
      } else if (stageData.type === 'boss') {
        stageBossHp = 100;
        contentArea.innerHTML = `
          <div class="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-3.5 rounded-2xl border-2 border-slate-900 space-y-2.5">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="text-2xl">👹</span>
                <div>
                  <div class="text-sm font-black">刁鑽大客・現場質問</div>
                  <div class="text-[9px] text-purple-200">BOSS 實戰快問快答 (限時 15 秒)</div>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-pixel text-amber-300">HP: <span id="boss-hp-val">100</span>/100</span>
                <div class="w-24 bg-slate-700 h-2 rounded-full overflow-hidden mt-0.5 border border-slate-600">
                  <div id="boss-hp-bar" class="bg-rose-500 h-full w-full transition-all duration-300"></div>
                </div>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-purple-100 bg-black/40 p-2.5 rounded-xl border border-white/10 leading-relaxed font-bold">
              ${stageData.desc}
            </p>
          </div>
          <div class="space-y-2.5" id="stage-boss-options-list">
            ${stageData.options.map(opt => `
              <button onclick="selectBossFightOption('${opt.id}', ${opt.correct}, ${opt.damage})" class="w-full text-left p-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 font-bold lego-btn transition-all">
                <span class="text-xs sm:text-sm text-slate-900 leading-relaxed font-bold block">${opt.text}</span>
              </button>
            `).join('')}
          </div>
        `;
      }

      openModal('modal-school-stage-play');
    }

    function selectStageChoiceOption(optId, isCorrect) {
      currentSelectedPlayOption = { id: optId, isCorrect };
      ['A', 'B', 'C', 'D'].forEach(k => {
        const btn = document.getElementById(`stage-opt-${k}`);
        if (btn) {
          if (k === optId) {
            btn.className = "w-full text-left p-3 rounded-xl border-2 border-slate-900 bg-amber-100 font-black lego-btn transition-all flex items-start gap-2 ring-2 ring-slate-900";
          } else {
            btn.className = "w-full text-left p-3 rounded-xl border-2 border-slate-800 bg-white font-bold lego-btn transition-all flex items-start gap-2 opacity-60";
          }
        }
      });
      showCustomToast(`已選取選項 ${optId}！點擊下方「確認送出答案」進行檢核。`, '💡');
    }

    function selectPairRate(pairId, rateVal) {
      userPairAnswers[pairId] = rateVal;

      const rateOptions = ['45%', '35%', '20%', '15%'];
      rateOptions.forEach(r => {
        const cleanRate = r.replace('%', '');
        const btn = document.getElementById(`btn-pair-${pairId}-${cleanRate}`);
        if (btn) {
          if (r === rateVal) {
            btn.className = "py-1 px-1 text-center rounded-lg border-2 border-slate-900 font-black text-xs bg-sinyi-green text-white lego-btn shadow";
          } else {
            btn.className = "py-1 px-1 text-center rounded-lg border-2 border-slate-800 font-black text-xs bg-slate-50 hover:bg-slate-100 lego-btn opacity-60";
          }
        }
      });

      const badge = document.getElementById(`pair-badge-${pairId}`);
      if (badge) {
        badge.innerText = `✔ ${rateVal}`;
        badge.className = "text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-400";
      }

      showCustomToast(`已選擇稅率：${rateVal}`, '📌');
    }

    function selectInspectionFlaw(id, isFlaw, feedback) {
      currentSelectedPlayOption = { id, isCorrect: isFlaw, feedback };
      ['blockA', 'blockB', 'blockC'].forEach(k => {
        const item = document.getElementById(`flaw-${k}`);
        if (item) {
          item.className = (k === id) 
            ? "p-3 rounded-xl border-2 border-slate-900 bg-amber-100 cursor-pointer lego-btn transition-all ring-2 ring-slate-900" 
            : "p-3 rounded-xl border-2 border-slate-900 bg-white cursor-pointer lego-btn transition-all opacity-60";
        }
      });
      showCustomToast(`已選取該區塊！點擊下方「確認送出答案」進行檢核。`, '🔍');
    }

    function updateStageSliderVal(val) {
      currentSliderValue = parseInt(val);
      const disp = document.getElementById('slider-display-val');
      if (disp) disp.innerText = currentSliderValue;
    }

    function selectBossFightOption(id, isCorrect, damage) {
      if (isCorrect) {
        stageBossHp = 0;
        const hpVal = document.getElementById('boss-hp-val');
        const hpBar = document.getElementById('boss-hp-bar');
        if (hpVal) hpVal.innerText = '0';
        if (hpBar) hpBar.style.width = '0%';
        currentSelectedPlayOption = { isCorrect: true };
        showCustomToast('💥 暴擊成功！命中核心合約規範，Boss 態度放軟認可！', '👑');
      } else {
        currentSelectedPlayOption = { isCorrect: false };
        showCustomToast('⚠️ 回答錯誤引發客戶質疑！請重新審視答覆。', '❌');
      }
    }

    function submitCurrentStageAnswer() {
      const domainKey = currentSchoolDomain || 'tax';
      const stageNum = currentActiveSchoolStageNum;
      const stageData = (schoolStagesDatabase[domainKey] && schoolStagesDatabase[domainKey][stageNum]) 
        || schoolStagesDatabase['tax'][stageNum];

      let isPassed = false;

      if (stageData.type === 'pair') {
        const requiredPairs = stageData.pairs || [];
        const answeredCount = Object.keys(userPairAnswers).length;

        if (answeredCount < requiredPairs.length) {
          showCustomToast('還有年限尚未選取稅率！請為 4 個條件皆點選對應稅率。', '⚠️');
          return;
        }

        const isAllCorrect = requiredPairs.every(p => userPairAnswers[p.id] === p.right);
        if (isAllCorrect) {
          isPassed = true;
        } else {
          showCustomToast('稅率配對有誤喔！請依「持有越短稅率越重」的原則重新調整。', '❌');
          return;
        }
      } else if (stageData.type === 'slider') {
        isPassed = (currentSliderValue === stageData.correctVal);
      } else if (currentSelectedPlayOption) {
        isPassed = currentSelectedPlayOption.isCorrect;
      }

      if (isPassed) {
        closeModal('modal-school-stage-play');
        // 發放 PRD 經驗與遊戲代幣
        addCapabilityExp('hard_know', domainKey, 30, `小學堂第 0${stageNum} 關三星完美通關`);
        userCoins += 100;
        updateCurrencyUI();

        // 點亮節點星星
        const starEl = document.getElementById(`school-node-star-${stageNum}`);
        if (starEl) starEl.innerText = '⭐⭐⭐';

        showCustomToast(`🎉 恭喜通關第 0${stageNum} 關！獲得 ⭐⭐⭐ 三星評等與 🪙 +100 盲盒代幣！`, '🍬');
      } else {
        showCustomToast('答案不完全正確喔！請詳讀題目提示並重新嘗試～', '💡');
      }
    }

    // 業務風格定義 (開發 6 型 + 銷售 5 型)
    const devStyleDefinitions = {
      'A': { code: 'A', name: '社區經營型', dimension: '地緣深耕', icon: '🏘️', desc: '鎖定特定社區大樓，針對管委會、物業人員與住戶建立長期關係與高頻互動，以掌握第一手屋況動態與委託機會。' },
      'B': { code: 'B', name: '商圈經營型', dimension: '地緣深耕', icon: '🏬', desc: '針對特定地理街廓進行廣度耕耘，對在地店家、里長、開放式住戶做日常拜訪與曝光。' },
      'C': { code: 'C', name: '網路社群經營型', dimension: '線上經營', icon: '📱', desc: '針對線上數位平台進行內容耕耘，對買賣社團、粉絲做個人品牌曝光與互動吸客。' },
      'D': { code: 'D', name: '私人人脈經營型', dimension: '人脈關係', icon: '🤝', desc: '針對個人既有生活圈進行關係盤點，對親友、同學、前同事做日常關懷與專業價值輸出。' },
      'E': { code: 'E', name: '公司既有人脈經營型', dimension: '人脈關係', icon: '🗄️', desc: '針對公司系統資料庫進行名單活化，對歷年成交舊客、過期委託屋主做定期回訪。' },
      'F': { code: 'F', name: '市場物件經營型', dimension: '精準標的鎖定', icon: '🎯', desc: '針對特定在售或異動地址進行精準鎖定，對自售屋主、同業在售案屋主做主動查址與直接開發。' }
    };

    const salStyleDefinitions = {
      'A': { code: 'A', name: '社區經營型', dimension: '地緣深耕', icon: '🏘️', desc: '把特定社區摸透並深耕物業與住戶關係，讓自己成為該社區的代名詞。' },
      'B': { code: 'B', name: '商圈經營型', dimension: '地緣深耕', icon: '🏬', desc: '針對特定地理範圍進行廣度經營，對在地店家、鄰里住戶進行駐點曝光。' },
      'C': { code: 'C', name: '網路社群經營型', dimension: '線上經營', icon: '📱', desc: '針對線上社群平台進行開箱行銷與互動，主動吸引看屋買方。' },
      'D': { code: 'D', name: '私人人脈經營型', dimension: '人脈關係', icon: '🤝', desc: '針對身邊親友進行長期關懷、購屋需求盤點與促動轉介紹。' },
      'E': { code: 'E', name: '公司既有人脈經營型', dimension: '人脈關係', icon: '🗄️', desc: '針對公司系統資料庫進行名單經營，對歷年已成交舊客做定期回訪與精準配案。' }
    };

    // 官方 6 題完整測驗資料庫
    const officialQuestions = [
      {
        id: 1, part: 'dev', type: 'sort', category: '開發｜啟動意願【排序題】', targetCount: 6,
        title: '你剛下分店第一週，店長請你開始找屋主簽委託。以下 6 種具體做法，請依照你「最想先嘗試」的順序排列：',
        hint: '請使用右側上下箭頭微調順序（由上而下代表最想先做至最後）：',
        options: [
          { key: 'A', rawText: '挑定 1～2 棟主力社區大樓，每天去跟管理員聊天打關係、投遞社區信箱（對應：社區經營）' },
          { key: 'B', rawText: '走訪分店周邊街道，逐一拜訪一樓店面老闆、里長與鄰居自我介紹（對應：商圈經營）' },
          { key: 'C', rawText: '在臉書在地社團、買賣社團發文互動，或拍攝看屋短影音吸引屋主私訊（對應：網路社群經營）' },
          { key: 'D', rawText: '盤點自己的親朋好友、同學與前同事名單，主動聯繫分享自己入行的消息（對應：私人人脈經營）' },
          { key: 'E', rawText: '從公司電腦系統裡，撈出過去曾成交過或委託過期的舊屋主名單逐一致電關心（對應：公司既有人脈經營）' },
          { key: 'F', rawText: '去街上或網路上找自售、同業在售的物件，或調閱繼承／異動謄本直接去找屋主（對應：市場物件經營／踩線）' }
        ]
      },
      {
        id: 2, part: 'dev', type: 'top2', category: '開發｜抗壓適性【選前 2 名並排序】', targetCount: 2,
        title: '假設你認真跑了一個月，卻連一張委託都還沒簽到。面對以下 6 種「需要忍受挫折、重複做」的日常，哪 2 種是你最不排斥、最願意繼續撐下去的？',
        hint: '請依優先順序選出第 1 名與第 2 名：',
        options: [
          { key: 'A', rawText: '就算警衛一開始很冷淡，仍願意每天固定去同一棟大樓報到、送飲料聊天，直到混熟為止（對應：社區經營）' },
          { key: 'B', rawText: '頂著大太陽或風雨在街區裡沿路發傳單、進店面遞名片，就算被多數路人拒絕也沒關係（對應：商圈經營）' },
          { key: 'C', rawText: '花時間剪輯影片、寫房市分析文發上網，就算一開始沒什麼人按讚留言，仍願意持續調整內容（對應：網路社群經營）' },
          { key: 'D', rawText: '持續在 LINE 上關心親友近況、提供免費房價試算，耐心等待身邊朋友未來有賣房需求（對應：私人人脈經營）' },
          { key: 'E', rawText: '每天坐在電腦前打幾十通電話給系統裡的舊客戶，就算常遇到空號或被掛電話，仍願意繼續洗名單（對應：公司既有人脈經營）' },
          { key: 'F', rawText: '每天盯著同業新上架的物件照片去現場比對確切門牌，或研究謄本資料去敲陌生屋主的門（對應：市場物件經營／踩線）' }
        ]
      },
      {
        id: 3, part: 'dev', type: 'single', category: '開發｜日常行為偏好【單選題】', targetCount: 1,
        title: '今天下午你有 3 個小時的完整空檔，店長沒有安排特別任務，你最自然會想把時間花在哪裡？',
        hint: '請單選一項最符合你直覺的安排：',
        options: [
          { key: 'A', rawText: '去重點大樓整理歷年成交行情表，把每一棟的格局跟優缺點背熟（對應：社區經營）' },
          { key: 'B', rawText: '去附近的傳統市場、公園或里長辦公室走動，跟在地大哥大姐泡茶聊天聽八卦（對應：商圈經營）' },
          { key: 'C', rawText: '去拍幾間漂亮房子的開箱素材，研究怎麼把貼文或短影音做得更吸睛（對應：網路社群經營）' },
          { key: 'D', rawText: '約以前的朋友、同學或老客戶出來喝咖啡敘舊，順便聊聊彼此最近的財務與居住規劃（對應：私人人脈經營）' },
          { key: 'E', rawText: '打開公司資料庫，把過去三年曾接觸過但沒下文的屋主紀錄全部翻出來看，準備電話跟進（對應：公司既有人脈經營）' },
          { key: 'F', rawText: '上網搜尋哪裡有屋主自售、同業新接案件，直接騎車去現場找地址貼開發信（對應：市場物件經營／踩線）' }
        ]
      },
      {
        id: 4, part: 'sal', type: 'sort', category: '銷售｜啟動意願【排序題】', targetCount: 5,
        title: '店裡剛接進一間條件不錯的房子，你要開始找買方來看屋。以下 5 種找買方的做法，請依照你「最想先採取」的順序排列：',
        hint: '請使用右側上下箭頭微調順序（由上而下代表最想先做至最後）：',
        options: [
          { key: 'A', rawText: '把這間房所在的社區大樓摸透，去跟該大樓管理員宣傳、找換屋或親友買同社區買方（對應：社區經營）' },
          { key: 'B', rawText: '印製售屋傳單，到附近的路口、菜市場定點舉牌駐點，或沿街塞信箱攔截路過買方（對應：商圈經營）' },
          { key: 'C', rawText: '拍這間房子的開箱短影音或圖文，貼到各大臉書買賣社團、IG 吸引網友私訊看屋（對應：網路社群經營）' },
          { key: 'D', rawText: '思考身邊有哪些親朋好友最近有買房打算，主動傳資料推薦給他們（對應：私人人脈經營）' },
          { key: 'E', rawText: '從公司系統裡撈出舊買方名單，逐一打電話邀約帶看（對應：公司既有人脈經營）' }
        ]
      },
      {
        id: 5, part: 'sal', type: 'top2', category: '銷售｜抗壓適性【選前 2 名並排序】', targetCount: 2,
        title: '如果這個月你手上一直沒有合適的買方可以帶看，你最願意靠哪 2 種日常基本功來突破僵局？',
        hint: '請依優先順序選出第 1 名與第 2 名：',
        options: [
          { key: 'A', rawText: '鎖定一兩個熱門社區深度研究，做到只要有買方去問管理員，大家第一個就推薦你（對應：社區經營）' },
          { key: 'B', rawText: '每天固定時段去人潮多的街口駐點發傳單，練習跟停下來的路人主動搭話（對應：商圈經營）' },
          { key: 'C', rawText: '每天固定在網路社團尋找回覆尋屋貼文，並持續拍攝不同物件介紹影片累積粉絲（對應：網路社群經營）' },
          { key: 'D', rawText: '定期聯繫已成交的舊客戶與親友，請他們幫忙留意身邊有沒有朋友想買房並轉介紹（對應：私人人脈經營）' },
          { key: 'E', rawText: '每天耐心地把公司系統裡的舊買方名單重新打過一輪，更新看屋條件與預算（對應：公司既有人脈經營）' }
        ]
      },
      {
        id: 6, part: 'sal', type: 'single', category: '銷售｜促成優勢【單選題】', targetCount: 1,
        title: '想像一位買方正在考慮要不要跟你看房，你覺得自己最容易靠哪一種方式贏得買方的信任？',
        hint: '請單選一項最符合你的優勢方式：',
        options: [
          { key: 'A', rawText: '把特定幾棟大樓的歷史成交價、格局優缺點摸到最熟，解答買方對社區的所有疑問（對應：社區經營）' },
          { key: 'B', rawText: '常在街頭巷尾駐點發傳單，面對面聊個兩句就能快速跟陌生買方拉近距離（對應：商圈經營）' },
          { key: 'C', rawText: '持續在網路上整理看屋分析或拍攝流暢開箱短影音，讓買方先對你的內容產生好感（對應：網路社群經營）' },
          { key: 'D', rawText: '平常就跟身邊親友保持良好互動，透過熟人牽線推薦，讓買方一開始就放心找你（對應：私人人脈經營）' },
          { key: 'E', rawText: '詳細記錄每位接觸過買方的看屋條件，一有符合的新案子仍主動精準推薦（對應：公司既有人脈經營）' }
        ]
      }
    ];

    let currentQuizIndex = 0;
    let userQuizAnswers = {
      1: ['A', 'B', 'C', 'D', 'E', 'F'],
      2: ['A', 'B'],
      3: 'A',
      4: ['E', 'A', 'B', 'C', 'D'],
      5: ['E', 'A'],
      6: 'E'
    };

    let currentSelectedDevCode = 'A';
    let currentSelectedSalCode = 'E';

    /* ========================================================= */
    /* 成長手冊：PRD 13項能力與等級算分資料庫                     */
    /* ========================================================= */
    const handbookDatabase = {
      'hard_know': {
        title: '硬實力・專業知識',
        items: [
          { key: 'tax', name: '稅務', score: 45, desc: '房地合一2.0、土增稅(自住重購退稅)、契稅、印花稅與持有期房屋/地價稅試算。' },
          { key: 'mortgage', name: '貸款', score: 30, desc: '金融機構鑑價、新青安貸款、選擇性信用管制(限貸成數)與買方收支比(DBR)財務評估。' },
          { key: 'contract', name: '契據', score: 25, desc: '20筆法定契據、48項現況說明書、斡旋要約與瑕疵告知義務規範。' },
          { key: 'law', name: '不動產法規', score: 10, desc: '住三/商三建蔽容積率、建物法定用途(事務所vs住宅)、公寓大廈規約與違建查報列管。' },
          { key: 'market', name: '商圈/社區行情熟悉度', score: 10, desc: '主力社區建築規格、近2~3年實價登錄成交高低點、歷史均價與案源分佈。' }
        ]
      },
      'soft_dev': {
        title: '軟實力・開發能力',
        items: [
          { key: 'dev_local', name: '地緣深耕', score: 25, desc: '針對社區管委會、物業保全、周邊店家與里長進行日常拜訪與長期信任建立。' },
          { key: 'dev_track', name: '踩線', score: 15, desc: '市場自售案、同業在售(黃色潛案)、繼承塗銷等地政異動(紅色開發機會)現場查址。' },
          { key: 'dev_resource', name: '資源盤點', score: 10, desc: '親友同學人脈維繫，及公司歷年成交舊屋主、過期撤售(灰色逾案)電訪喚醒。' },
          { key: 'dev_brand', name: '個人品牌', score: 5, desc: '線上社群與個人自媒體產出專業房產內容，吸引潛在屋主主動諮詢委託。' }
        ]
      },
      'soft_sal': {
        title: '軟實力・銷售能力',
        items: [
          { key: 'sal_stranger', name: '陌生獲客', score: 20, desc: '商圈路口舉牌駐點、捷運市場實體派報，及深耕社區現場攔截外來買方約看。' },
          { key: 'sal_present', name: '物件介紹', score: 15, desc: '綠色可售案實體帶看、空間亮點呈現、排解疑慮與引導下斡旋/簽要約促成。' },
          { key: 'sal_resource', name: '資源盤點', score: 5, desc: '親友購屋追蹤促動轉介，與過往帶看未購舊買方定期電話回訪精準配案。' },
          { key: 'sal_market', name: '行銷', score: 5, desc: '在庫可售物件拍攝高質感短影音、開箱文案包裝發布各大買賣通路吸引預約。' }
        ]
      }
    };

    function calculateLevelFromScore(score) {
      // 0~49: Lv1, 50~99: Lv2, 100~149: Lv3 ... 每 50 分升 1 級
      return Math.min(99, Math.floor(score / 50) + 1);
    }

    function renderHandbookUI() {
      // 統計大分類總分與等級
      const hardTotal = handbookDatabase.hard_know.items.reduce((s, i) => s + i.score, 0);
      const devTotal = handbookDatabase.soft_dev.items.reduce((s, i) => s + i.score, 0);
      const salTotal = handbookDatabase.soft_sal.items.reduce((s, i) => s + i.score, 0);

      document.getElementById('cat-score-hard').innerText = hardTotal;
      document.getElementById('cat-level-hard').innerText = calculateLevelFromScore(hardTotal);

      document.getElementById('cat-score-dev').innerText = devTotal;
      document.getElementById('cat-level-dev').innerText = calculateLevelFromScore(devTotal);

      document.getElementById('cat-score-sal').innerText = salTotal;
      document.getElementById('cat-level-sal').innerText = calculateLevelFromScore(salTotal);

      switchHandbookTab('hard');
    }

    function switchHandbookTab(cat) {
      const btnHard = document.getElementById('hb-btn-hard');
      const btnDev = document.getElementById('hb-btn-dev');
      const btnSal = document.getElementById('hb-btn-sal');
      const container = document.getElementById('handbook-items-list');

      btnHard.className = cat === 'hard' ? "flex-1 py-2 bg-sinyi-green text-white transition-all text-center text-xs font-black" : "flex-1 py-2 bg-slate-100 text-slate-700 hover:bg-slate-50 transition-all text-center text-xs font-bold";
      btnDev.className = cat === 'dev' ? "flex-1 py-2 bg-lego-red text-white transition-all text-center text-xs font-black" : "flex-1 py-2 bg-slate-100 text-slate-700 hover:bg-slate-50 transition-all text-center text-xs font-bold";
      btnSal.className = cat === 'sal' ? "flex-1 py-2 bg-lego-blue text-white transition-all text-center text-xs font-black" : "flex-1 py-2 bg-slate-100 text-slate-700 hover:bg-slate-50 transition-all text-center text-xs font-bold";

      container.innerHTML = '';
      const groupKey = cat === 'hard' ? 'hard_know' : cat === 'dev' ? 'soft_dev' : 'soft_sal';
      const items = handbookDatabase[groupKey].items;

      items.forEach(item => {
        const lvl = calculateLevelFromScore(item.score);
        const nextScore = lvl * 50;
        const currentProgressPct = Math.min(100, Math.round(((item.score % 50) / 50) * 100));

        const card = document.createElement('div');
        card.className = "bg-white p-3.5 rounded-2xl lego-card-sm border-slate-900 space-y-2";
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="font-black text-slate-900 text-xs sm:text-sm">${item.name}</span>
              <span class="text-[10px] bg-slate-900 text-white font-pixel px-2 py-0.5 rounded">Lv.${lvl}</span>
            </div>
            <span class="text-xs font-black text-sinyi-green">${item.score} / ${nextScore} EXP</span>
          </div>
          <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-400">
            <div class="bg-sinyi-green h-full" style="width: ${currentProgressPct}%"></div>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">${item.desc}</p>
        `;
        container.appendChild(card);
      });
    }

    function addCapabilityExp(majorCat, itemKey, points, reason) {
      const oldLevel = Math.floor(currentUserTotalExp / 60) + 1;
      currentUserTotalExp += points;
      const newLevel = Math.floor(currentUserTotalExp / 60) + 1;

      document.getElementById('header-user-exp').innerText = currentUserTotalExp;
      document.getElementById('header-user-level').innerText = newLevel;

      // 依據 PRD：僅在整體等級提升時發放升等獎勵金幣，避免與任務本身發放的金幣重複計算
      if (newLevel > oldLevel) {
        const levelBonus = (newLevel - oldLevel) * 100;
        userCoins += levelBonus;
        updateCurrencyUI();
        showCustomToast(`🎊 恭喜升等！晉升至 Lv.${newLevel}，獲得升等獎勵 🪙 +${levelBonus} 幣！`, '⭐');
      }

      const group = handbookDatabase[majorCat];
      if (group) {
        const target = group.items.find(i => i.key === itemKey);
        if (target) {
          target.score += points;
        }
      }
      renderHandbookUI();
    }

    /* ========================================================= */
    /* 任務主頁資料與切換引擎 (完整支援 DEMO 點擊與實機完成)       */
    /* ========================================================= */
    let activeTaskInModal = null;

    const routeTasksData = {
      'dev': {
        poolTitle: '社區深耕｜接下來的挑戰',
        hero: {
          id: 'dev_hero_01',
          badge: '主線 01｜進行中',
          badgeClass: 'bg-lego-red text-white text-[9px] font-pixel px-2 py-0.5 rounded',
          time: '接取於 10:15',
          title: '認識你的第一塊地盤',
          desc: '目標：前往信義地圖，選一個想了解的社區大樓標記為耕耘目標。',
          cond: '前往信義地圖，鎖定大器四方或周邊大樓標記',
          reward: '🪙 150 盲盒幣 ｜ 開發經驗 EXP +20',
          actionText: '🗺️ 前往信義地圖進行標記',
          isHero: true
        },
        slots: [
          {
            id: 'dev_m_01',
            tag: '主線 01',
            title: '從地圖選一個想了解的社區',
            desc: '前往地圖查看大樓詳情並完成標記',
            isOngoing: true,
            statusText: '進行中',
            rewardExp: 20,
            rewardCoins: 150,
            cat: 'soft_dev',
            sub: 'dev_local',
            type: 'navigate_map'
          },
          {
            id: 'dev_m_02',
            tag: '主線 02',
            title: '實地走訪，辨識主力大樓生活機能',
            desc: '憑日報表完成街廓走訪自動核對',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 25,
            rewardCoins: 180,
            cat: 'soft_dev',
            sub: 'dev_local',
            type: 'checklist',
            checkItems: [
              { text: '確認松智路主力大樓車道出入口與保全哨點', checked: false },
              { text: '走訪信義國小/信義國中學區生活圈步行距離', checked: false },
              { text: '拍照記錄社區一樓店面商家型態與人流動線', checked: false }
            ]
          },
          {
            id: 'dev_m_03',
            tag: '主線 03',
            title: '整理社區筆記與三個想請教的問題',
            desc: '於 APP 內儲存大樓行情重點與疑難筆記',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 30,
            rewardCoins: 200,
            cat: 'hard_know',
            sub: 'market',
            type: 'input_notes',
            defaultNote: '1. 大器四方近兩年最高單價 149.9 萬是否有含特殊裝潢？\n2. 社區車位是否可單獨出租給非住戶？\n3. 近期是否有繼承或逾案屋主有意願釋出？'
          },
          {
            id: 'dev_m_04',
            tag: '隱藏 01',
            title: '社區管理員破冰並獲得第一手情資',
            desc: '建立信任關係，獲得 1 筆在售或搬遷訊息',
            isOngoing: false,
            isHidden: false,
            btnText: '挑戰破冰',
            rewardExp: 35,
            rewardCoins: 250,
            cat: 'soft_dev',
            sub: 'dev_local',
            type: 'icebreaker'
          }
        ]
      },
      'sal': {
        poolTitle: '既有人脈經營｜接下來的挑戰',
        hero: {
          id: 'sal_hero_01',
          badge: '主線 01｜進行中',
          badgeClass: 'bg-lego-blue text-white text-[9px] font-pixel px-2 py-0.5 rounded',
          time: '接取於 10:40',
          title: '接收可聯繫的舊買資源並了解現況',
          desc: '目標：盤點店長提供的舊買清單，重新梳理購屋預算與目標區域。',
          cond: '完成首筆名單狀態標記與未知條件盤點',
          reward: '🪙 150 盲盒幣 ｜ 銷售經驗 EXP +20',
          actionText: '🤖 進行舊買回訪實戰演練',
          isHero: true
        },
        slots: [
          {
            id: 'sal_m_01',
            tag: '主線 01',
            title: '接收可聯繫的舊買資源並了解現況',
            desc: '取得名單參照，記錄目前購屋階段',
            isOngoing: true,
            statusText: '進行中',
            rewardExp: 20,
            rewardCoins: 150,
            cat: 'soft_sal',
            sub: 'sal_resource',
            type: 'buyer_audit'
          },
          {
            id: 'sal_m_02',
            tag: '主線 02',
            title: '準備釐清需求的問題清單',
            desc: '確認預算、區域、不可妥協條件與自備款',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 25,
            rewardCoins: 180,
            cat: 'soft_sal',
            sub: 'sal_present',
            type: 'checklist',
            checkItems: [
              { text: '確認買方目前名下是否有貸款(央行第7波限貸審查)', checked: false },
              { text: '核對買方最高自備款金額(預算 3,500 萬～4,500 萬)', checked: false },
              { text: '鎖定松智路 3~4 房有車位且電梯大樓物件配案', checked: false }
            ]
          },
          {
            id: 'sal_m_03',
            tag: '主線 03',
            title: '完成首次電話或訊息聯繫',
            desc: '電話聯繫舊買，邀約週末現場看屋',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 30,
            rewardCoins: 200,
            cat: 'soft_sal',
            sub: 'sal_stranger',
            type: 'phone_call'
          },
          {
            id: 'sal_m_04',
            tag: '隱藏 01',
            title: '久未互動舊買重新回應並同意看屋',
            desc: '成功喚醒沉睡客戶，預約週六實體帶看',
            isOngoing: false,
            isHidden: false,
            btnText: '達成預約',
            rewardExp: 40,
            rewardCoins: 300,
            cat: 'soft_sal',
            sub: 'sal_present',
            type: 'appointment'
          }
        ]
      },
      'com': {
        poolTitle: '冒險基本功｜跨路線實戰課題',
        hero: {
          id: 'com_hero_01',
          badge: '支線 01｜進行中',
          badgeClass: 'bg-lego-green text-white text-[9px] font-pixel px-2 py-0.5 rounded',
          time: '接取於 09:30',
          title: '嘗試一次陌生接觸，練習非主力技能',
          desc: '目標：不以取得委託或成交為條件，練習自然合宜的開場與提問。',
          cond: '日報表或對練紀錄中有一次初次接觸',
          reward: '🪙 100 盲盒幣 ｜ 共通經驗 EXP +15',
          actionText: '🎓 前往知識小學堂練功',
          isHero: true
        },
        slots: [
          {
            id: 'com_m_01',
            tag: '支線 01',
            title: '嘗試一次陌生接觸，練習非主力技能',
            desc: '練習開場與提問，感受對話節奏',
            isOngoing: true,
            statusText: '進行中',
            rewardExp: 15,
            rewardCoins: 120,
            cat: 'soft_dev',
            sub: 'dev_local',
            type: 'checklist',
            checkItems: [
              { text: '向分店周邊 2 家熟稔店家老闆主動遞名片寒暄', checked: false },
              { text: '詢問在地近期是否有街坊想換屋或招租訊號', checked: false }
            ]
          },
          {
            id: 'com_m_02',
            tag: '支線 02',
            title: '比較相鄰兩個生活圈的環境差異',
            desc: '整理交通、學區與商圈特色對照表',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 20,
            rewardCoins: 150,
            cat: 'hard_know',
            sub: 'market',
            type: 'comparison_review'
          },
          {
            id: 'com_m_03',
            tag: '支線 03',
            title: '追蹤所選生活圈的一項新市場訊號',
            desc: '記錄一筆新案動態或自售看板變化',
            isOngoing: false,
            btnText: '接取與執行',
            rewardExp: 25,
            rewardCoins: 180,
            cat: 'soft_dev',
            sub: 'dev_track',
            type: 'market_signal'
          }
        ]
      }
    };

    let currentActiveRouteKey = 'dev';

    function switchRoute(routeKey) {
      currentActiveRouteKey = routeKey;
      const data = routeTasksData[routeKey];
      if (!data) return;

      ['dev', 'sal', 'com'].forEach(k => {
        const btn = document.getElementById(`route-tab-${k}`);
        if (btn) {
          if (k === routeKey) {
            btn.className = "py-1.5 text-center rounded-xl text-xs font-black bg-lego-yellow text-slate-900 border border-slate-900 shadow-sm transition-all";
          } else {
            btn.className = "py-1.5 text-center rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all";
          }
        }
      });

      // 渲染 Hero 卡片
      // 渲染 Hero 卡片 (字體放大)
      const heroEl = document.getElementById('tasks-hero-card');
      heroEl.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="${data.hero.badgeClass}">${data.hero.badge}</span>
          <span class="text-xs text-slate-400 font-bold">${data.hero.time}</span>
        </div>
        <h3 class="text-sm font-black text-slate-900 leading-snug">${data.hero.title}</h3>
        <p class="text-xs text-slate-600 leading-relaxed">${data.hero.desc}</p>
        <div class="bg-amber-50 p-3 rounded-xl border border-amber-300 space-y-1.5">
          <div class="text-xs text-amber-900 font-bold flex items-center gap-1.5">
            <span>🎯 達成條件：</span> <span>${data.hero.cond}</span>
          </div>
          <div class="text-xs text-emerald-800 font-black flex items-center gap-1.5">
            <span>🎁 獎勵：</span> <span>${data.hero.reward}</span>
          </div>
        </div>
        <button onclick="handleHeroAction('${routeKey}')" class="w-full py-3 bg-sinyi-green hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black lego-btn flex items-center justify-center space-x-1 shadow">
          <span>${data.hero.actionText}</span>
        </button>
      `;

      // 渲染 Slots (字體放大)
      document.getElementById('tasks-pool-title').innerText = data.poolTitle;
      const slotsContainer = document.getElementById('tasks-slots-container');
      slotsContainer.innerHTML = '';

      data.slots.forEach(slot => {
        const itemEl = document.createElement('div');
        if (slot.isHidden) {
          itemEl.className = "p-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-between text-slate-400";
          itemEl.innerHTML = `
            <div>
              <div class="text-[10px] font-pixel text-slate-400">${slot.tag}</div>
              <div class="text-xs sm:text-sm font-bold">${slot.title}</div>
            </div>
            <span class="text-xs text-slate-400 font-bold">${slot.desc}</span>
          `;
        } else if (slot.isCompleted) {
          itemEl.className = "p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/70 flex items-center justify-between lego-card-sm transition-all";
          itemEl.innerHTML = `
            <div class="flex-1 pr-2.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-pixel text-emerald-800 font-black">${slot.tag}</span>
                <span class="text-[9px] sm:text-[10px] text-emerald-700 font-bold">已領取 🪙 +${slot.rewardCoins || 150} ｜ +${slot.rewardExp || 20}EXP</span>
              </div>
              <div class="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1 mt-0.5">
                <span>✔</span> <span>${slot.title}</span>
              </div>
              <div class="text-xs text-emerald-700 mt-1 line-clamp-1">${slot.desc}</div>
            </div>
            <div>
              <span class="px-3 py-1.5 bg-emerald-200 text-emerald-900 rounded-lg text-xs font-black border border-emerald-400 inline-block whitespace-nowrap">
                ✔ 已完成
              </span>
            </div>
          `;
        } else {
          itemEl.className = "p-3 rounded-xl border-2 border-slate-900 bg-white flex items-center justify-between lego-card-sm hover:bg-slate-50 transition-all";
          itemEl.innerHTML = `
            <div class="flex-1 pr-2.5">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-pixel text-lego-blue font-black">${slot.tag}</span>
                <span class="text-[9px] sm:text-[10px] text-amber-600 font-bold">🪙 +${slot.rewardCoins || 150} ｜ +${slot.rewardExp || 20}EXP</span>
              </div>
              <div class="text-xs sm:text-sm font-black text-slate-900 mt-0.5">${slot.title}</div>
              <div class="text-xs text-slate-500 mt-1 line-clamp-1">${slot.desc}</div>
            </div>
            <div>
              ${slot.isOngoing 
                ? `<button onclick="openTaskActionModal('${routeKey}', '${slot.id}')" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-black border border-amber-400 lego-btn whitespace-nowrap">
                    執行中 ➔
                   </button>`
                : `<button onclick="openTaskActionModal('${routeKey}', '${slot.id}')" class="px-3 py-1.5 bg-lego-blue hover:bg-lego-darkblue text-white rounded-lg text-xs font-black lego-btn whitespace-nowrap">
                    ${slot.btnText || '接取與執行'}
                   </button>`
              }
            </div>
          `;
        }
        slotsContainer.appendChild(itemEl);
      });
    }

    function handleHeroAction(routeKey) {
      const slot = routeTasksData[routeKey]?.slots.find(s => !s.isCompleted && !s.isHidden);
      if (!slot) { switchTab('tab-academy'); return; }
      if (slot.type === 'navigate_map') {
        switchTab('tab-map');
        showCustomToast('已跳轉至信義地圖！請點擊「🎯 標記為耕耘目標」完成主線 01！', '🗺️');
      } else {
        openTaskActionModal(routeKey, slot.id);
      }
    }

    /* 任務彈窗 DEMO 執行系統 */
    function openTaskActionModal(routeKey, taskId) {
      const data = routeTasksData[routeKey];
      if (!data) return;
      const slot = data.slots.find(s => s.id === taskId);
      if (!slot) return;
      if (slot.isCompleted) { showCustomToast('此任務已完成並領取獎勵。', '✅'); return; }

      activeTaskInModal = { routeKey, slot };

      const tagEl = document.getElementById('modal-task-tag');
      const titleEl = document.getElementById('modal-task-title');
      const container = document.getElementById('modal-task-content');

      if (!tagEl || !titleEl || !container) {
        console.warn('Task modal elements not found in DOM.');
        return;
      }

      tagEl.innerText = slot.tag;
      titleEl.innerText = slot.title;
      container.innerHTML = '';

      if (slot.type === 'navigate_map') {
        container.innerHTML = `
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2 text-slate-800">
            <div class="font-black text-emerald-950 flex items-center gap-1">
              <span>🎯 任務目標：</span> <span>鎖定主力生活圈大樓</span>
            </div>
            <p class="text-[10px] text-emerald-800 leading-relaxed">
              請前往信義地圖，點選「大器四方」並點擊右上角的「🎯 標記為耕耘目標」。標記完成後即可回此處領取獎勵！
            </p>
            <button onclick="closeModal('modal-task-action'); switchTab('tab-map');" class="w-full py-2 bg-sinyi-green text-white font-black text-xs rounded-lg lego-btn text-center">
              立即前往信義地圖 ➔
            </button>
          </div>
        `;
      } else if (slot.type === 'checklist') {
        container.innerHTML = `
          <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600">
            請依序核對並勾選完成的實務項目，全數確認後即可完成此任務：
          </div>
          <div class="space-y-2 pt-1" id="task-checklist-items">
            ${slot.checkItems.map((item, idx) => `
              <label class="flex items-start gap-2 p-2 bg-white rounded-xl border-2 border-slate-900 cursor-pointer lego-card-sm">
                <input type="checkbox" onchange="toggleTaskCheckItem(${idx})" ${item.checked ? 'checked' : ''} class="accent-sinyi-green w-4 h-4 mt-0.5">
                <span class="text-xs font-bold text-slate-800 leading-snug">${item.text}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else if (slot.type === 'input_notes') {
        container.innerHTML = `
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-800 flex items-center gap-1">
              <span>✍️</span> <span>大樓行情重點與疑難筆記（可自由編輯）：</span>
            </label>
            <textarea id="task-note-textarea" rows="4" class="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-bold outline-none leading-relaxed">${slot.defaultNote}</textarea>
            <p class="text-[9px] text-slate-500">將筆記存入系統，後續可隨時於晨會向店長或學長請益探討。</p>
          </div>
        `;
      } else if (slot.type === 'buyer_audit') {
        container.innerHTML = `
          <div class="p-3 bg-blue-50 rounded-xl border border-blue-300 space-y-2 text-slate-800">
            <div class="flex justify-between items-center">
              <span class="font-black text-blue-950">📋 舊買名單盤點記錄卡</span>
              <span class="text-[8px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-pixel font-bold">VIP 買方</span>
            </div>
            <div class="text-[10px] space-y-1">
              <div><b>客戶姓名：</b>張先生 (科技業高階主管)</div>
              <div><b>購屋預算：</b>3,500萬～4,500萬 ｜ <b>指定房型：</b>松智路3~4房</div>
              <div><b>目前狀態：</b>已確認首購無房屋貸款限制，自備款1,200萬已到位</div>
            </div>
            <div class="p-2 bg-white rounded-lg border border-slate-300 text-[9px] text-slate-600">
              💡 推薦動作：建議直接帶看大器四方高樓景觀戶，並於本週六安排初次面談。
            </div>
          </div>
        `;
      } else if (slot.type === 'icebreaker' || slot.type === 'phone_call' || slot.type === 'appointment') {
        container.innerHTML = `
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2 text-slate-800">
            <div class="font-black text-amber-950 flex items-center gap-1">
              <span>🤝</span> <span>實戰互動情境檢核</span>
            </div>
            <p class="text-[10px] text-amber-900 leading-relaxed">
              此任務考驗人際互動與溝通節奏！你已成功在分店現場或電話端發動標準話術，管理員/客戶給予正面回應，並同意保持長期情資交流！
            </p>
            <div class="p-2 bg-white rounded-lg border border-amber-300 text-[10px] font-bold text-slate-800">
              ✔ 建立雙向名片交換與 LINE 聯繫<br>
              ✔ 記錄客戶最優先關注指標：【產權安全與付款履保】
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-800">
            <div class="font-black text-slate-900">實務課題已驗證</div>
            <p class="text-[10px] text-slate-600">已向學長核對周邊生活圈環境差異與最新自售看版動態，點擊下方按鈕即可完成審核！</p>
          </div>
        `;
      }

      openModal('modal-task-action');
    }

    function toggleTaskCheckItem(idx) {
      if (activeTaskInModal && activeTaskInModal.slot && activeTaskInModal.slot.checkItems) {
        activeTaskInModal.slot.checkItems[idx].checked = !activeTaskInModal.slot.checkItems[idx].checked;
      }
    }

    function submitCurrentTaskDemo() {
      if (!activeTaskInModal || !activeTaskInModal.slot) {
        closeModal('modal-task-action');
        return;
      }

      const slot = activeTaskInModal.slot;
      const routeKey = activeTaskInModal.routeKey;
      const data = routeTasksData[routeKey];
      if (slot.isCompleted) return;
      if (slot.type === 'navigate_map' && !slot.targetBuildingId) {
        showCustomToast('請先到地圖標記耕耘目標。', '🎯'); return;
      }
      if (slot.type === 'input_notes') {
        const note = document.getElementById('task-note-textarea').value.trim();
        if (!note) { showCustomToast('請先填寫任務筆記。', '✍️'); return; }
        slot.defaultNote = note;
      }

      // 若有 checklist，檢查是否全選
      if (slot.type === 'checklist' && slot.checkItems) {
        const allChecked = slot.checkItems.every(i => i.checked);
        if (!allChecked) {
          showCustomToast('請先將所有實務走訪項目全數打勾確認！', '⚠️');
          return;
        }
      }

      // 標記為完成，不再是進行中
      slot.isCompleted = true;
      slot.isOngoing = false;
      slot.desc = '✅ 已圓滿完成該任務檢核與日報登錄';

      // 自動推進：將下一個未完成的任務設為進行中，並同步更新頂部 Hero 卡片
      if (data && data.slots) {
        const nextSlot = data.slots.find(s => !s.isCompleted && !s.isHidden);
        if (nextSlot) {
          nextSlot.isOngoing = true;
          // 同步更新 Hero 卡片資訊
          data.hero = {
            id: `${routeKey}_hero_${nextSlot.id}`,
            badge: `${nextSlot.tag}｜進行中`,
            badgeClass: routeKey === 'dev' ? 'bg-lego-red text-white text-[9px] font-pixel px-2 py-0.5 rounded' : routeKey === 'sal' ? 'bg-lego-blue text-white text-[9px] font-pixel px-2 py-0.5 rounded' : 'bg-lego-green text-white text-[9px] font-pixel px-2 py-0.5 rounded',
            time: '接取於 剛才',
            title: nextSlot.title,
            desc: `目標：${nextSlot.desc}，點擊下方按鈕即可開啟檢核與執行。`,
            cond: '完成該課題各項指標登錄',
            reward: `🪙 ${nextSlot.rewardCoins || 150} 盲盒幣 ｜ 經驗 EXP +${nextSlot.rewardExp || 20}`,
            actionText: `📋 立即執行【${nextSlot.tag}】`,
            isHero: true
          };
        } else {
          // 全數任務皆完成
          data.hero = {
            id: `${routeKey}_hero_completed`,
            badge: '🏆 路線全通關',
            badgeClass: 'bg-amber-400 text-slate-900 text-[9px] font-pixel px-2 py-0.5 rounded font-black',
            time: '本日進度達標',
            title: `恭喜！【${routeKey === 'dev' ? '社區深耕' : routeKey === 'sal' ? '既有人脈' : '冒險基本功'}】今日挑戰全數達成！`,
            desc: '你已奠定紮實的新人實戰經驗，可前往「修練學院」或「信義地圖」探索更多案源。',
            cond: '本日所有挑戰皆已通關領獎',
            reward: '✨ 達成每日大滿貫成就！',
            actionText: '🎓 前往修練學院對練',
            isHero: true
          };
        }
      }

      closeModal('modal-task-action');

      // 發放經驗與遊戲幣
      activeTaskInModal = null;
      const exp = slot.rewardExp || 25;
      const coins = slot.rewardCoins || 150;
      addCapabilityExp(slot.cat || 'soft_dev', slot.sub || 'dev_local', exp, `任務【${slot.title}】圓滿達成`);
      userCoins += coins;
      updateCurrencyUI();

      // 刷新任務首頁
      switchRoute(routeKey);

      showCustomToast(`🎉 任務【${slot.title}】已完成！獲得 +${exp} EXP 與 🪙 +${coins} 盲盒幣！`, '🎁');
    }

    /* ========================================================= */
    /* 地圖 PRD 規格資料庫與互動邏輯                              */
    /* ========================================================= */
    const buildingDatabase = {
      'b1': {
        id: 'b1', name: '大器四方', type: '社區大樓', icon: '🏢',
        address: '台北市信義區松智路',
        summary: {
          age: '31.9 年', units: '23 戶', fee: '見詳情 (約120元/坪)',
          ratio: '6.0 - 6.68 %', floorsUp: '7 層', floorsDown: '1 層',
          structure: '鋼筋混凝土 (RC)', builder: '匯大建設股份有限公司', management: '全天候物業保全'
        },
        trends: {
          avgPrice: '141.4 萬/坪', highPrice: '149.9 萬/坪', lowPrice: '83.8 萬/坪',
          historyTotal: '39 筆', historySinyi: '15 筆', sinyiShare: '38.5 %',
          webOnSale: '6 筆', sinyiOnSale: '1 筆'
        },
        specs: {
          area: '482 坪', zoning: '信義計畫區特定業務區 (住三)',
          parking: '坡道平面 32 位 (清潔費 800元/月)', barrierFree: '有無障礙坡道與電梯直達',
          layouts: '4房 (40~46坪)、5房 (68~70坪)'
        },
        listings: [
          { status: 'green', statusName: '可售', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-400', title: '大器四方高樓景觀戶 (信義有效委託)', price: '6,280 萬', size: '48.5 坪 ｜ 4房2廳2衛' },
          { status: 'yellow', statusName: '潛案', colorClass: 'bg-amber-100 text-amber-800 border-amber-400', title: '5樓屋主自售 (591市場在售案)', price: '5,980 萬', size: '46.2 坪 ｜ 屋主自售踩線機會' },
          { status: 'gray', statusName: '逾案', colorClass: 'bg-slate-200 text-slate-700 border-slate-400', title: '3樓歷史撤售戶 (歷史過期名單)', price: '5,500 萬', size: '40.8 坪 ｜ 建議電訪喚醒' }
        ]
      },
      'b2': {
        id: 'b2', name: '松智金賞', type: '華廈', icon: '🏬',
        address: '台北市信義區松智路29巷',
        summary: {
          age: '18.5 年', units: '16 戶', fee: '80 元/坪',
          ratio: '18.2 %', floorsUp: '7 層', floorsDown: '1 層',
          structure: '鋼筋混凝土 (RC)', builder: '松智建設', management: '日間保全+磁扣'
        },
        trends: {
          avgPrice: '115.2 萬/坪', highPrice: '122.0 萬/坪', lowPrice: '98.5 萬/坪',
          historyTotal: '18 筆', historySinyi: '7 筆', sinyiShare: '38.9 %',
          webOnSale: '2 筆', sinyiOnSale: '0 筆'
        },
        specs: {
          area: '210 坪', zoning: '第二種住宅區',
          parking: '升降機械 16 位', barrierFree: '門廳有無障礙坡道',
          layouts: '3房 (32~36坪)'
        },
        listings: [
          { status: 'yellow', statusName: '潛案', colorClass: 'bg-amber-100 text-amber-800 border-amber-400', title: '4樓同業在售中 (同業踩線標的)', price: '4,150 萬', size: '35.2 坪' },
          { status: 'red', statusName: '開發機會', colorClass: 'bg-rose-100 text-rose-800 border-rose-400', title: '2樓地政繼承塗銷登記 (紅色異動機會)', price: '預估 3,900 萬', size: '33.1 坪 ｜ 優先登門拜訪' }
        ]
      },
      'b3': {
        id: 'b3', name: '莊敬傳家透天', type: '透天', icon: '🏡',
        address: '台北市信義區莊敬路',
        summary: {
          age: '42 年', units: '1 戶 (單一產權)', fee: '0 元',
          ratio: '0 % (無公設比)', floorsUp: '3 層', floorsDown: '0 層',
          structure: '加強磚造', builder: '私人自建', management: '無管理員 (門戶獨立)'
        },
        trends: {
          avgPrice: '土地約 220 萬/坪', highPrice: '250 萬/坪', lowPrice: '190 萬/坪',
          historyTotal: '3 筆', historySinyi: '1 筆', sinyiShare: '33.3 %',
          webOnSale: '1 筆', sinyiOnSale: '0 筆'
        },
        specs: {
          area: '基地 28 坪', zoning: '住三 (建蔽55/容積225)',
          parking: '門前獨立車位', barrierFree: '無',
          layouts: '全棟 1~3 樓 (建坪約 56 坪)'
        },
        listings: [
          { status: 'red', statusName: '開發機會', colorClass: 'bg-rose-100 text-rose-800 border-rose-400', title: '長輩過世分割繼承中 (紅色情資標的)', price: '商議中', size: '地坪 28 坪 ｜ 建坪 56 坪' }
        ]
      }
    };

    let currentSelectedBuildingId = 'b1';
    let currentBuildingSubtab = 'summary';

    function selectMapBuilding(bId) {
      currentSelectedBuildingId = bId;
      const b = buildingDatabase[bId];
      if (!b) return;

      document.getElementById('b-detail-name').innerText = b.name;
      document.getElementById('b-detail-type').innerText = `${b.address} ｜ ${b.type} (地上${b.summary.floorsUp}/地下${b.summary.floorsDown})`;
      document.getElementById('b-detail-icon').innerText = b.icon;

      switchBuildingSubtab(currentBuildingSubtab);
      showCustomToast(`已鎖定標的：【${b.name}】（${b.type}）`, b.icon);
    }

    function switchBuildingSubtab(tabKey) {
      currentBuildingSubtab = tabKey;
      ['summary', 'trends', 'specs', 'listings'].forEach(k => {
        const btn = document.getElementById(`bsub-tab-${k}`);
        if (btn) {
          if (k === tabKey) {
            btn.className = "pb-1.5 px-2 text-sinyi-green border-b-2 border-sinyi-green font-black";
          } else {
            btn.className = "pb-1.5 px-2 text-slate-500 hover:text-slate-800 font-bold";
          }
        }
      });

      const container = document.getElementById('building-subtab-content');
      const b = buildingDatabase[currentSelectedBuildingId];
      if (!b || !container) return;

      if (tabKey === 'summary') {
        container.innerHTML = `
          <div class="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.age}</div>
              <div class="text-[10px] text-slate-400">屋齡</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.units}</div>
              <div class="text-[10px] text-slate-400">總戶數</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.fee}</div>
              <div class="text-[10px] text-slate-400">管理費</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.ratio}</div>
              <div class="text-[10px] text-slate-400">約略公設比</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.floorsUp}</div>
              <div class="text-[10px] text-slate-400">地上樓層</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-slate-900">${b.summary.floorsDown}</div>
              <div class="text-[10px] text-slate-400">地下樓層</div>
            </div>
          </div>
          <div class="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div><b class="text-slate-800">建築形態：</b>${b.type} ｜ <b class="text-slate-800">物業警衛：</b>${b.summary.management}</div>
            <div><b class="text-slate-800">結構型態：</b>${b.summary.structure} ｜ <b class="text-slate-800">起造營造：</b>${b.summary.builder}</div>
          </div>
        `;
      } else if (tabKey === 'trends') {
        container.innerHTML = `
          <div class="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <div class="text-xs sm:text-sm font-black text-emerald-700">${b.trends.avgPrice}</div>
              <div class="text-[9px] text-slate-400">近三個月平均單價</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-rose-600">${b.trends.highPrice}</div>
              <div class="text-[9px] text-slate-400">近兩年最高單價</div>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-black text-blue-600">${b.trends.lowPrice}</div>
              <div class="text-[9px] text-slate-400">近兩年最低單價</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <div class="font-black text-slate-800">${b.trends.historyTotal}</div>
              <div class="text-[9px] text-slate-400">歷史成交</div>
            </div>
            <div>
              <div class="font-black text-sinyi-green">${b.trends.historySinyi}</div>
              <div class="text-[9px] text-slate-400">歷史信義成交</div>
            </div>
            <div>
              <div class="font-black text-sinyi-green">${b.trends.sinyiShare}</div>
              <div class="text-[9px] text-slate-400">實登信義佔比</div>
            </div>
          </div>
          <div class="flex justify-between items-center text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <span>網路在售 <b>${b.trends.webOnSale}</b> ｜ 信義在售 <b>${b.trends.sinyiOnSale}</b></span>
            <button onclick="showCustomToast('已跳轉至信義內部實價登錄系統！', '📈')" class="text-sinyi-green font-black underline text-xs">
              查看實登 ➔
            </button>
          </div>
        `;
      } else if (tabKey === 'specs') {
        container.innerHTML = `
          <div class="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div><b class="text-slate-800">基地面積：</b>${b.specs.area}</div>
            <div><b class="text-slate-800">土地分區：</b>${b.specs.zoning}</div>
            <div><b class="text-slate-800">車位規劃：</b>${b.specs.parking}</div>
            <div><b class="text-slate-800">無障礙設施：</b>${b.specs.barrierFree}</div>
            <div><b class="text-slate-800">主力格局：</b>${b.specs.layouts}</div>
          </div>
        `;
      } else if (tabKey === 'listings') {
        container.innerHTML = `
          <div class="space-y-2">
            ${b.listings.map(l => `
              <div class="p-2.5 rounded-xl border-2 border-slate-900 bg-white flex justify-between items-center lego-card-sm">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] px-1.5 py-0.2 rounded font-black border ${l.colorClass}">${l.statusName}</span>
                    <span class="text-xs sm:text-sm font-black text-slate-900">${l.title}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">${l.size}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs sm:text-sm font-black text-lego-red">${l.price}</div>
                  <button onclick="launchRPWithCase('${l.status}')" class="text-[9px] bg-slate-900 text-white px-2.5 py-1 rounded font-black mt-1">對練攻略 ➔</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    function switchMapQueryMode(mode) {
      const btnComm = document.getElementById('btn-query-comm');
      const btnSource = document.getElementById('btn-query-source');
      if (mode === 'community') {
        btnComm.className = "px-3 py-1 rounded-xl text-xs font-black bg-sinyi-green text-white border border-slate-900 transition-all";
        btnSource.className = "px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
        showCustomToast('已切換為【社區查詢】模式：聚焦生活圈各大樓格局與行情。', '🏢');
      } else {
        btnSource.className = "px-3 py-1 rounded-xl text-xs font-black bg-sinyi-green text-white border border-slate-900 transition-all";
        btnComm.className = "px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
        showCustomToast('已切換為【案源查詢】模式：聚焦可售/潛案/逾案/開發機會標的。', '🎯');
      }
    }

    function markCommunityTarget() {
      const b = buildingDatabase[currentSelectedBuildingId];
      const slot = routeTasksData.dev.slots.find(s => s.type === 'navigate_map');
      if (slot.isCompleted) { showCustomToast(`已標記【${b.name}】；主線 01 獎勵已領取。`, '✅'); return; }
      slot.targetBuildingId = b.id;
      activeTaskInModal = {routeKey: 'dev', slot};
      submitCurrentTaskDemo();
    }

    /* ========================================================= */
    /* 修練學院：知識小學堂 (Candy Crush) 邏輯                   */
    /* ========================================================= */
    let currentSchoolDomain = 'tax';
    let currentSchoolRouteIndex = 0;

    const schoolDomainRoutes = {
      'tax': [
        { id: 'r1', name: '房地合一稅 2.0' },
        { id: 'r2', name: '土地增值稅與重購退稅' },
        { id: 'r3', name: '持有稅與買賣規費' }
      ],
      'mortgage': [
        { id: 'r1', name: '首購與新青安貸款' },
        { id: 'r2', name: '央行選擇性信用管制' },
        { id: 'r3', name: '銀行鑑價與收支比評估' }
      ],
      'contract': [
        { id: 'r1', name: '買賣委託契約篇' },
        { id: 'r2', name: '標的物現況說明書篇' },
        { id: 'r3', name: '斡旋要約與買賣合約篇' }
      ],
      'law': [
        { id: 'r1', name: '土地使用分區效益' },
        { id: 'r2', name: '建物法定用途限制' },
        { id: 'r3', name: '公寓大廈與違建法規' }
      ],
      'market': [
        { id: 'r1', name: '分店主力社區規格' },
        { id: 'r2', name: '實價登錄與車位拆算' }
      ]
    };

    function switchSchoolDomain(domainKey) {
      currentSchoolDomain = domainKey;
      currentSchoolRouteIndex = 0;

      ['tax', 'mortgage', 'contract', 'law', 'market'].forEach(k => {
        const btn = document.getElementById(`school-dom-${k}`);
        if (btn) {
          if (k === domainKey) {
            btn.className = "px-3 py-1.5 rounded-xl bg-sinyi-green text-white shrink-0 border border-slate-900";
          } else {
            btn.className = "px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 shrink-0 border border-slate-300";
          }
        }
      });

      renderSchoolRoutes();
    }

    function renderSchoolRoutes() {
      const routes = schoolDomainRoutes[currentSchoolDomain] || [];
      const container = document.getElementById('school-routes-container');
      if (!container) return;
      container.innerHTML = '';

      routes.forEach((r, idx) => {
        const isSel = idx === currentSchoolRouteIndex;
        const btn = document.createElement('button');
        btn.className = isSel
          ? "px-2.5 py-1 rounded-xl bg-lego-yellow text-slate-900 font-black text-xs border border-slate-900 shrink-0 shadow-sm"
          : "px-2.5 py-1 rounded-xl bg-white text-slate-600 font-bold text-xs border border-slate-300 shrink-0";
        btn.innerText = `路線 ${idx + 1}：${r.name}`;
        btn.onclick = () => {
          currentSchoolRouteIndex = idx;
          renderSchoolRoutes();
          showCustomToast(`已切換為：【${r.name}】S型闖關地圖`, '🍭');
        };
        container.appendChild(btn);
      });
    }

    /* ========================================================= */
    /* 修練學院：AI Roleplay (PRD 擬真對練系統) 邏輯              */
    /* ========================================================= */
    const rpOfficialTemplates = [
      {
        id: 't1', title: '591 屋主自售踩線防禦', clientName: '陳先生 (自售屋主)',
        tags: ['個性急躁', '在意費用/服務費', '對仲介極度防備'],
        prop: 'b1', goal: '預約實體帶看 / 碰面',
        intro: '「我這間房子放在 591 很多人來看，你們仲介不要再打來了！如果要簽委託免談，除非你有買方直接帶過來！」'
      },
      {
        id: 't2', title: '專任轉一般異議化解', clientName: '林小姐 (換屋族)',
        tags: ['猶豫不決', '專注合約細節', '只看大品牌'],
        prop: 'b2', goal: '簽立委託 (轉任/續約)',
        intro: '「給你們專任賣了一個月都沒動靜，我朋友叫我簽給其他三家一般約一起賣比較快，你覺得呢？」'
      },
      {
        id: 't3', title: '新青安房貸試算質疑', clientName: '張先生 (首購工程師)',
        tags: ['話少冷淡', '對行情敏銳', '重度風水控'],
        prop: 'b1', goal: '化解稅費/新青安疑慮',
        intro: '「央行現在管制這麼嚴，你確定新青安能貸到八成五？寬限期會不會被銀行砍掉？算給我看。」'
      },
      {
        id: 't4', title: '嫌惡設施抗性排解', clientName: '黃太太 (置產客)',
        tags: ['強勢主導', '注重屋況瑕疵', '被同業騙過/有負面經驗'],
        prop: 'b2', goal: '預約實體帶看 / 碰面',
        intro: '「我看街景旁邊50公尺好像有一座宮廟跟變電所，這棟大樓以後轉手鐵定跌價，你怎麼看？」'
      },
      {
        id: 't5', title: '買方下斡旋猶豫不決', clientName: '王先生 (首購新婚夫妻)',
        tags: ['健談多話', '重視家庭意見', '不急著賣/買(佛系)'],
        prop: 'b1', goal: '引導下斡旋 / 簽要約',
        intro: '「這間雖然很喜歡，但長輩說下週再來看一次，而且出價要是低於屋主底價被退斡旋怎麼辦？」'
      }
    ];

    let currentSelectedRPTemplate = rpOfficialTemplates[0];
    let rpSelectedTags = ['強勢主導', '在意費用/服務費', '對仲介極度防備'];
    let rpTrustMeter = 40;
    let rpTimerRemaining = 600; // 10 分鐘
    let rpTimerInterval = null;
    let rpChatHistory = [];

    function switchAcademySubtab(subKey) {
      const btnSchool = document.getElementById('acad-subtab-school');
      const btnRP = document.getElementById('acad-subtab-roleplay');
      const viewSchool = document.getElementById('academy-subtab-school-view');
      const viewRP = document.getElementById('academy-subtab-roleplay-view');

      if (subKey === 'school') {
        btnSchool.className = "py-2 rounded-xl bg-lego-yellow text-slate-900 border border-slate-900 shadow-sm transition-all text-center flex items-center justify-center gap-1 font-black";
        btnRP.className = "py-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all text-center flex items-center justify-center gap-1 font-bold";
        viewSchool.classList.remove('hidden');
        viewRP.classList.add('hidden');
      } else {
        btnRP.className = "py-2 rounded-xl bg-lego-yellow text-slate-900 border border-slate-900 shadow-sm transition-all text-center flex items-center justify-center gap-1 font-black";
        btnSchool.className = "py-2 rounded-xl text-slate-600 hover:text-slate-900 transition-all text-center flex items-center justify-center gap-1 font-bold";
        viewRP.classList.remove('hidden');
        viewSchool.classList.add('hidden');
      }
    }

    function toggleRPSourceMode(mode) {
      const btnOff = document.getElementById('rp-src-btn-official');
      const btnCust = document.getElementById('rp-src-btn-custom');
      const offList = document.getElementById('rp-official-templates-list');
      const custInputs = document.getElementById('rp-custom-source-inputs');

      if (mode === 'official') {
        btnOff.className = "px-2 py-0.5 rounded bg-lego-yellow font-black border border-slate-900";
        btnCust.className = "px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-300";
        offList.classList.remove('hidden');
        custInputs.classList.add('hidden');
      } else {
        btnCust.className = "px-2 py-0.5 rounded bg-lego-yellow font-black border border-slate-900";
        btnOff.className = "px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-300";
        custInputs.classList.remove('hidden');
        offList.classList.add('hidden');
      }
    }

    function renderRPSetup() {
      // 渲染官方範本
      const listEl = document.getElementById('rp-official-templates-list');
      if (listEl) {
        listEl.innerHTML = '';
        rpOfficialTemplates.forEach(t => {
          const isSel = t.id === currentSelectedRPTemplate.id;
          const card = document.createElement('div');
          card.className = `p-2.5 rounded-xl border-2 border-slate-900 shrink-0 w-44 cursor-pointer lego-btn ${isSel ? 'bg-amber-100' : 'bg-white'}`;
          card.innerHTML = `
            <div class="text-[9px] font-black text-lego-blue font-pixel">${t.clientName}</div>
            <div class="text-xs font-black text-slate-900 truncate mt-0.5">${t.title}</div>
            <div class="text-[8px] text-slate-500 mt-1 line-clamp-1">${t.tags.join(' ｜ ')}</div>
          `;
          card.onclick = () => selectRPTemplate(t);
          listEl.appendChild(card);
        });
      }

      // 渲染標籤
      renderTagPills('pace', ['個性急躁', '話少冷淡', '強勢主導', '猶豫不決', '健談多話']);
      renderTagPills('focus', ['在意費用/服務費', '專注合約細節', '對行情敏銳', '重視家庭意見', '注重屋況瑕疵']);
      renderTagPills('mindset', ['對仲介極度防備', '被同業騙過/有負面經驗', '只看大品牌', '不急著賣/買(佛系)']);
      updateSelectedTagsCount();
    }

    function selectRPTemplate(t) {
      currentSelectedRPTemplate = t;
      rpSelectedTags = [...t.tags];
      document.getElementById('rp-goal-select').value = t.goal;
      renderRPSetup();
      showCustomToast(`已套用官方實戰範本：【${t.title}】`, '🤖');
    }

    function renderTagPills(groupKey, tags) {
      const container = document.getElementById(`rp-tags-row-${groupKey}`);
      if (!container) return;

      // 移除舊有標籤，確保 DOM 乾淨
      const existingPills = container.querySelectorAll('.rp-tag-pill');
      existingPills.forEach(p => p.remove());

      // 清理後再精準取得「+ 自訂」按鈕作為插入錨點
      const addBtn = document.getElementById(`btn-toggle-custom-${groupKey}`) || container.querySelector('.btn-custom-toggle');

      tags.forEach(tag => {
        const isSel = rpSelectedTags.includes(tag);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `rp-tag-pill px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
          isSel 
            ? 'bg-sinyi-green text-white border-slate-900 shadow-sm' 
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`;
        pill.innerText = tag;
        pill.onclick = () => toggleRPTag(tag);

        if (addBtn && addBtn.parentNode === container) {
          container.insertBefore(pill, addBtn);
        } else {
          container.appendChild(pill);
        }
      });
    }

    function toggleRPTag(tag) {
      const idx = rpSelectedTags.indexOf(tag);
      if (idx !== -1) {
        rpSelectedTags.splice(idx, 1);
      } else {
        if (rpSelectedTags.length >= 5) {
          showCustomToast('最多僅能選取 5 個特質標籤！', '⚠️');
          return;
        }
        rpSelectedTags.push(tag);
      }
      renderRPSetup();
    }

    function updateSelectedTagsCount() {
      const badge = document.getElementById('rp-tags-count-badge');
      if (badge) {
        badge.innerText = `已選 ${rpSelectedTags.length} 項標籤 (建議3~5項)`;
      }
    }

    function toggleInlineTagInput(groupKey) {
      const box = document.getElementById(`inline-input-box-${groupKey}`);
      if (box) box.classList.toggle('hidden');
    }

    function addInlineCustomTag(groupKey) {
      const input = document.getElementById(`inline-input-text-${groupKey}`);
      const val = input.value.trim();
      if (!val) return;
      if (!rpSelectedTags.includes(val)) {
        rpSelectedTags.push(val);
      }
      input.value = '';
      toggleInlineTagInput(groupKey);
      renderRPSetup();
      showCustomToast(`已新增自訂標籤：【${val}】`, '🏷️');
    }

    function handleGoalSelectChange() {
      const sel = document.getElementById('rp-goal-select');
      const box = document.getElementById('rp-custom-goal-box');
      if (sel.value === 'custom') {
        box.classList.remove('hidden');
      } else {
        box.classList.add('hidden');
      }
    }

    function startRPSessionFromSetup() {
      if (rpSelectedTags.length === 0) {
        showCustomToast('請至少挑選或自訂 1~3 項對手特質標籤！', '⚠️');
        return;
      }

      document.getElementById('rp-setup-screen').classList.add('hidden');
      document.getElementById('rp-chat-screen').classList.remove('hidden');

      // 初始化信任度與計時器
      rpTrustMeter = 40;
      rpTimerRemaining = 600;
      updateTrustMeterUI();

      const goalVal = document.getElementById('rp-goal-select').value;
      const finalGoalText = goalVal === 'custom' 
        ? (document.getElementById('rp-custom-goal-input').value.trim() || '自訂結算目標')
        : goalVal;

      document.getElementById('rp-chat-name').innerText = currentSelectedRPTemplate.clientName;
      document.getElementById('rp-chat-goal-pill').innerText = `目標：${finalGoalText}`;
      document.getElementById('rp-chat-subtags').innerText = rpSelectedTags.join(' ｜ ');

      // 初始化開場白
      const messagesContainer = document.getElementById('rp-messages-scroll');
      messagesContainer.innerHTML = '';
      rpChatHistory = [];

      appendChatMessage('ai', currentSelectedRPTemplate.intro);
      renderQuickTactics();

      // 啟動倒數
      if (rpTimerInterval) clearInterval(rpTimerInterval);
      rpTimerInterval = setInterval(() => {
        rpTimerRemaining--;
        const min = String(Math.floor(rpTimerRemaining / 60)).padStart(2, '0');
        const sec = String(rpTimerRemaining % 60).padStart(2, '0');
        const timerEl = document.getElementById('rp-timer-text');
        if (timerEl) timerEl.innerText = `⏱️ ${min}:${sec}`;

        // 倒數 2 分鐘催促推進
        if (rpTimerRemaining === 120) {
          appendChatMessage('ai', '「我等一下還有會議要出門，你一句話告訴我，為什麼一定要跟你碰面？」');
          showCustomToast('⚠️ 客戶發動時間緊迫催促！請給出具體明確的 Call to Action！', '⏱️');
        }

        if (rpTimerRemaining <= 0) {
          clearInterval(rpTimerInterval);
          concludeRPSession('timeout');
        }
      }, 1000);
    }

    function appendChatMessage(sender, text) {
      const container = document.getElementById('rp-messages-scroll');
      if (!container) return;

      const bubble = document.createElement('div');
      if (sender === 'ai') {
        bubble.className = "flex items-start gap-2 max-w-[88%]";
        bubble.innerHTML = `
          <div class="w-7 h-7 rounded-full bg-purple-200 border border-purple-400 flex items-center justify-center text-sm shrink-0">🧐</div>
          <div class="p-2.5 rounded-2xl bg-white border border-slate-300 text-slate-800 leading-snug shadow-sm">
            ${text}
          </div>
        `;
        // 朗讀 AI 回應
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'zh-TW';
          utter.rate = rpSelectedTags.includes('個性急躁') ? 1.2 : 0.95;
          window.speechSynthesis.speak(utter);
        }
      } else {
        bubble.className = "flex items-start gap-2 max-w-[88%] ml-auto justify-end";
        bubble.innerHTML = `
          <div class="p-2.5 rounded-2xl bg-sinyi-green text-white font-bold leading-snug shadow-sm">
            ${text}
          </div>
          <div class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs shrink-0 font-pixel">我</div>
        `;
      }

      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
      rpChatHistory.push({ sender, text });
    }

    function renderQuickTactics() {
      const container = document.getElementById('rp-quick-tactics');
      if (!container) return;
      container.innerHTML = `
        <button onclick="sendPresetTactic(1)" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 shrink-0">
          同理自售辛苦＋帶入已備自備款買方
        </button>
        <button onclick="sendPresetTactic(2)" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 shrink-0">
          強調信義成屋漏水保固與產權查核價值
        </button>
        <button onclick="sendPresetTactic(3)" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 shrink-0">
          約定明午2點實體碰面看屋 (明確CTA)
        </button>
      `;
    }

    function sendPresetTactic(id) {
      if (id === 1) {
        sendRPUserMessage("陳大哥您好，我完全能理解您白天要上班還要接幾十通電話的辛苦！我手邊剛好有兩組鎖定大器四方、且已看過謄本自備款充裕的家庭買方，我不是來簽委託的，想先了解您方便給帶看的時間？");
      } else if (id === 2) {
        sendRPUserMessage("大哥您最擔心的肯定是售後糾紛與實拿金額，信義房屋提供買賣雙方高規格的成屋漏水保固與價金履約保證，能確保您賣得安心且資金百分之百安全！");
      } else {
        sendRPUserMessage("既然這棟大樓的歷史成交行情在140萬上下，明天下午兩點我先親自到府拜訪您15分鐘，把周邊買方條件帶給您過目，您看兩點方便還是三點？");
      }
    }

    function sendRPUserMessage(directText = null) {
      const inputEl = document.getElementById('rp-user-input');
      const text = directText || inputEl.value.trim();
      if (!text) return;
      if (!directText) inputEl.value = '';

      appendChatMessage('user', text);

      // 動態 Trust Meter 判定 (PRD 規格)
      setTimeout(() => {
        if (text.includes('買方') || text.includes('自備款') || text.includes('履約保證') || text.includes('兩點') || text.includes('漏水保固')) {
          rpTrustMeter = Math.min(100, rpTrustMeter + 15);
          updateTrustMeterUI();
          appendChatMessage('ai', '「聽起來你們確實有在做功課，手上有現成買方這點滿有誠意的。那明天下午兩點你先一個人過來，我們當面聊聊，不要帶其他人喔！」');
          if (rpTrustMeter >= 70) {
            setTimeout(() => concludeRPSession('success'), 1200);
          }
        } else if (text.includes('簽專任') || text.includes('4%') || text.includes('公司規定')) {
          rpTrustMeter = Math.max(0, rpTrustMeter - 20);
          updateTrustMeterUI();
          appendChatMessage('ai', '「我剛剛就說了不要一直跟我提委託！你們仲介都只顧自己賺服務費，沒誠意就不用談了！」');
          if (rpTrustMeter <= 0) {
            setTimeout(() => concludeRPSession('failed'), 1200);
          }
        } else {
          rpTrustMeter = Math.min(100, rpTrustMeter + 5);
          updateTrustMeterUI();
          appendChatMessage('ai', '「嗯，你說的這個點我還能接受，那還有其他重點嗎？」');
        }
      }, 700);
    }

    function updateTrustMeterUI() {
      const valEl = document.getElementById('rp-trust-val');
      const barEl = document.getElementById('rp-trust-bar');
      if (valEl) valEl.innerText = rpTrustMeter;
      if (barEl) {
        barEl.style.width = `${rpTrustMeter}%`;
        barEl.className = rpTrustMeter >= 70 
          ? 'bg-emerald-400 h-full transition-all duration-300' 
          : rpTrustMeter <= 20 
          ? 'bg-rose-500 h-full transition-all duration-300' 
          : 'bg-amber-400 h-full transition-all duration-300';
      }
    }

    function toggleVoiceInput() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showCustomToast('此瀏覽器環境未支援 Web Speech 語音辨識，請使用文字打字！', '🎙️');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-TW';
      recognition.start();
      showCustomToast('語音辨識聆聽中... 請說話！', '🎙️');
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        document.getElementById('rp-user-input').value = transcript;
        showCustomToast(`已辨識語音：「${transcript}」`, '✅');
      };
    }

    function concludeRPSession(reason) {
      if (rpTimerInterval) clearInterval(rpTimerInterval);

      let finalScore = 18;
      let starsText = "⭐⭐⭐ 三星大師";
      let expReward = 30;

      if (rpTrustMeter >= 70 || reason === 'success') {
        finalScore = 19;
        starsText = "⭐⭐⭐ 三星大師 (完美促成)";
        expReward = 30;
      } else if (rpTrustMeter >= 40) {
        finalScore = 15;
        starsText = "⭐⭐ 二星熟練 (尚可推進)";
        expReward = 20;
      } else {
        finalScore = 8;
        starsText = "★ 未過關 (破局中斷)";
        expReward = 2;
      }

      document.getElementById('rp-review-stars').innerText = starsText;
      document.getElementById('rp-review-total-score').innerText = `${finalScore} / 20`;
      document.getElementById('rp-review-points-badge').innerText = `獲得專業能力值 +${expReward} EXP ｜ 🪙 +${expReward * 5} 盲盒幣`;

      openModal('modal-rp-review');
    }

    function applyRPReviewReward() {
      closeModal('modal-rp-review');
      backToRPSetup();
      addCapabilityExp('soft_dev', 'dev_local', 30, 'AI Roleplay 擬真對練三星通過');
      userCoins += 150;
      updateCurrencyUI();
      showCustomToast('戰力結算完成！軟實力獲得全面提升，並入袋 🪙 150 盲盒幣！', '🎉');
    }

    function backToRPSetup() {
      const setupScreen = document.getElementById('rp-setup-screen');
      const chatScreen = document.getElementById('rp-chat-screen');
      if (setupScreen) setupScreen.classList.remove('hidden');
      if (chatScreen) chatScreen.classList.add('hidden');
    }

    function launchRPWithCase(caseId) {
      switchTab('tab-academy');
      switchAcademySubtab('roleplay');
      const propSel = document.getElementById('rp-property-select');
      if (propSel) propSel.value = 'b1';
      selectRPTemplate(rpOfficialTemplates[0]);
      showCustomToast('已帶入 591 自售情境與大器四方標的！', '🤖');
    }

    /* ========================================================= */
    /* 主管 IP 盲盒抽卡、3x3 展櫃與代幣經濟引擎 (PRD 規格)        */
    /* ========================================================= */
    function updateCurrencyUI() {
      const coinEl = document.getElementById('currency-coins');
      const headerCoinEl = document.getElementById('header-user-coins');
      const ticketEl = document.getElementById('currency-tickets');
      const pityEl = document.getElementById('gacha-pity-counter');
      const heartsEl = document.getElementById('cabinet-hearts-count');

      if (coinEl) coinEl.innerText = userCoins.toLocaleString();
      if (headerCoinEl) headerCoinEl.innerText = userCoins.toLocaleString();
      if (ticketEl) ticketEl.innerText = gachaTickets;
      if (pityEl) pityEl.innerText = gachaPityCounter;
      if (heartsEl) heartsEl.innerText = cabinetHeartsCount;
    }

    function pullExecutiveGacha(times = 1) {
      let cost = (times === 1) ? 100 : 950;

      if (times === 1 && gachaTickets > 0) {
        gachaTickets--;
      } else if (userCoins >= cost) {
        userCoins -= cost;
      } else {
        showCustomToast(`遊戲幣不足！需要 🪙 ${cost} 幣，解任務或小學堂即可獲得！`, '⚠️');
        return;
      }

      // 所有可用角色（全 27 款：托尼 12 款 + 陳總 15 款）全數平等進池！
      let availableIds = Object.keys(executiveFigurineDatabase).filter(isFigurineVisible);

      availableIds=availableIds.filter(isFigurineVisible);
      const rPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'R');
      const srPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'SR');
      const ssrPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'SSR');

      const results = [];

      for (let i = 0; i < times; i++) {
        gachaPityCounter++;
        let chosenId = availableIds[Math.floor(Math.random() * availableIds.length)];

        // 50 抽大保底：必出 SR 或 SSR
        if (gachaPityCounter >= 50) {
          chosenId = (Math.random() < 0.35 && ssrPool.length > 0)
            ? ssrPool[Math.floor(Math.random() * ssrPool.length)]
            : (srPool.length > 0 ? srPool[Math.floor(Math.random() * srPool.length)] : availableIds[0]);
          gachaPityCounter = 0;
        } else if (times === 10 && i === 9) {
          // 十連保底稀有 R 以上
          const rand = Math.random();
          if (rand < 0.08 && ssrPool.length > 0) chosenId = ssrPool[Math.floor(Math.random() * ssrPool.length)];
          else if (rand < 0.40 && srPool.length > 0) chosenId = srPool[Math.floor(Math.random() * srPool.length)];
          else chosenId = rPool.length > 0 ? rPool[Math.floor(Math.random() * rPool.length)] : availableIds[0];
        } else {
          const rand = Math.random();
          if (rand < 0.06 && ssrPool.length > 0) {
            chosenId = ssrPool[Math.floor(Math.random() * ssrPool.length)];
            gachaPityCounter = 0;
          } else if (rand < 0.30 && srPool.length > 0) {
            chosenId = srPool[Math.floor(Math.random() * srPool.length)];
          } else {
            chosenId = rPool.length > 0 ? rPool[Math.floor(Math.random() * rPool.length)] : availableIds[0];
          }
        }

        const figDef = executiveFigurineDatabase[chosenId] || executiveFigurineDatabase['tony_ninja'];
        const existingInWarehouse = userWarehouse.find(w => w.id === chosenId);
        let isDuplicate = false;

        if (existingInWarehouse) {
          existingInWarehouse.fragments += 1;
          isDuplicate = true;
        } else {
          userWarehouse.push({ id: chosenId, stars: 1, fragments: 0 });
        }

        results.push({ ...figDef, isDuplicate });
      }

      updateCurrencyUI();
      renderWarehouseUI();
      showGachaRevealModal(results);
    }

    // Experimental branch life. Layout and memories share the prototype's in-memory lifetime.
    const lifeFurniture={
      treadmill:{name:'跑步機',icon:'🏃',desc:'誰是分店的衝刺王？'},
      stage:{name:'迷你舞台',icon:'🎤',desc:'今晚的主角就是你。'},
      coffee:{name:'咖啡桌',icon:'☕',desc:'好點子，從聊天開始。'}
    };
    const lifeZoneNames=['採光角落','分店中央','窗邊空間'];
    let lifeLayout=['treadmill','stage','coffee'];
    let lifeSelectedFurniture=null;
    let lifeAutoEnabled=true;
    let lifeActiveStory=null;
    let lifeStoryToken=0;
    const lifeMemories=new Set();
    const lifeStoryCatalog=[
      {id:'race',name:'分店衝刺王',icon:'🏃',furniture:'treadmill',members:['fig_muscle','fig_track'],extra:'fig_hiphop',steps:[['fig_muscle','來吧！今天比的不是業績，是耐力！'],['fig_track','暖身完畢，先讓你三秒。'],['fig_muscle','等一下…跑步機的速度誰調快了？！'],['fig_track','哈哈，先從慢跑開始吧！']],ending:'兩人決定每天一起練習，分店多了一組晨跑搭檔。',extraLine:'嘻哈陳總拿起麥克風：各位觀眾，這就是分店速度！'},
      {id:'concert',name:'下班小演唱會',icon:'🎸',furniture:'stage',members:['fig_hiphop','tony_rock'],extra:'fig_ballet',steps:[['fig_hiphop','白天介紹好房，晚上介紹我的新歌！'],['tony_rock','吉他準備好了，三、二、一！'],['fig_hiphop','這首歌送給今天努力的每一位夥伴。'],['tony_rock','下一次，換你來當主唱！']],ending:'沒有售票的演唱會，卻收穫了整間分店的掌聲。',extraLine:'芭蕾陳總輕輕轉了一圈，替今晚的演出加上舞蹈。'},
      {id:'coffee',name:'消失的好房線索',icon:'🔎',furniture:'coffee',members:['tony_detective','tony_ninja'],extra:'tony_dino',steps:[['tony_detective','奇怪，那張寫著好房線索的便條去哪了？'],['tony_ninja','我只看見一個綠色身影經過咖啡桌…'],['tony_detective','找到了！原來被壓在杯墊下面。'],['tony_ninja','下次先喝咖啡，再辦案吧。']],ending:'一杯咖啡的時間，兩人又交換了一個找屋的新點子。',extraLine:'恐龍托尼探頭過來：我只是來問，還有餅乾嗎？'}
    ];
    function lifeStoryReady(story){return lifeLayout.includes(story.furniture)&&story.members.every(id=>isFigurineVisible(id)&&userCabinetSlots.includes(id));}
    function selectLifeFurniture(id){
      if(lifeActiveStory||!lifeFurniture[id])return;
      lifeSelectedFurniture=lifeSelectedFurniture===id?null:id;renderLifeFurniture();
      document.getElementById('life-layout-tip').textContent=lifeSelectedFurniture?'已選擇'+lifeFurniture[id].name+'，點選上方活動區即可放置；已放置的家具會交換位置。':'先選家具，再點活動區。';
    }
    function placeLifeFurniture(zone){
      if(lifeActiveStory||!Number.isInteger(zone)||zone<0||zone>2)return;
      if(!lifeSelectedFurniture){document.getElementById('life-layout-tip').textContent='先在下方選一件家具，再點這個活動區。';return;}
      const furniture=lifeSelectedFurniture,old=lifeLayout.indexOf(furniture);
      if(old>=0){const target=lifeLayout[zone];lifeLayout[old]=target;}
      lifeLayout[zone]=furniture;lifeSelectedFurniture=null;renderLivingBranch();
      document.getElementById('life-layout-tip').textContent=lifeFurniture[furniture].name+'已放到'+lifeZoneNames[zone]+'，夥伴會到新位置演出。';
    }
    function storeLifeFurniture(){
      if(lifeActiveStory||!lifeSelectedFurniture)return;
      const id=lifeSelectedFurniture;lifeLayout=lifeLayout.map(value=>value===id?null:value);lifeSelectedFurniture=null;renderLivingBranch();
      document.getElementById('life-layout-tip').textContent=lifeFurniture[id].name+'已收起，隨時可再放回。';
    }
    function renderLifeFurniture(){
      const el=document.getElementById('life-furniture');if(!el)return;
      document.getElementById('living-branch').classList.toggle('is-editing',!!lifeSelectedFurniture);
      el.innerHTML=Object.entries(lifeFurniture).map(([id,item])=>`<button class="life-furniture-item ${lifeSelectedFurniture===id?'is-selected':''}" onclick="selectLifeFurniture('${id}')" aria-pressed="${lifeSelectedFurniture===id}" ${lifeActiveStory?'disabled':''}><span>${item.icon}</span><b>${item.name}</b><small>${lifeLayout.includes(id)?'已放置':'收納中'}</small></button>`).join('')+`<button class="life-store" onclick="storeLifeFurniture()" ${!lifeSelectedFurniture||lifeActiveStory?'disabled':''}>收起<br>所選家具</button>`;
    }
    function renderLifeStories(){
      const el=document.getElementById('life-stories');if(!el)return;
      el.innerHTML=lifeStoryCatalog.filter(story=>story.members.every(isFigurineVisible)).map(story=>{
        const missing=story.members.filter(id=>!userCabinetSlots.includes(id)).map(id=>executiveFigurineDatabase[id].name);
        const hint=missing.length?'需陳列：'+missing.join('、'):!lifeLayout.includes(story.furniture)?'請先放置'+lifeFurniture[story.furniture].name:lifeActiveStory?'劇情進行中':lifeMemories.has(story.id)?'已收藏 · 再看一次':'默契就位 · 開演';
        return `<button class="life-story ${lifeMemories.has(story.id)?'has-memory':''}" onclick="startLifeStory('${story.id}')" ${!lifeStoryReady(story)||lifeActiveStory?'disabled':''}><span>${story.icon}</span><div><b>${story.name}</b><small>${story.members.map(id=>executiveFigurineDatabase[id].name).join(' ＋ ')}</small></div><em>${hint}</em></button>`;
      }).join('');
      document.getElementById('life-stamp-count').textContent='日常回憶 '+lifeMemories.size+' / 3';
    }
    function renderLivingBranch(){
      const room=document.getElementById('living-branch');if(!room)return;
      // Any change to the roster/outfit ends the scene before actors are rebuilt.
      if(lifeActiveStory)endLifeStory(false);
      room.className='living-branch life-'+cabinetPedestalTheme;
      document.getElementById('life-zones').innerHTML=lifeLayout.map((id,index)=>`<button class="life-zone" onclick="placeLifeFurniture(${index})" aria-label="布置${lifeZoneNames[index]}：${id?lifeFurniture[id].name:'空地'}"><span class="life-zone-label">${lifeZoneNames[index]}</span><div class="life-prop prop-${id||'empty'}" aria-hidden="true"><i></i><b>${id?lifeFurniture[id].icon:'＋'}</b><i></i></div><small>${id?lifeFurniture[id].name:'點此放家具'}</small></button>`).join('');
      document.getElementById('life-actors').innerHTML=userCabinetSlots.map((id,index)=>id&&isFigurineVisible(id)&&executiveFigurineDatabase[id]?`<button id="life-actor-${index}" class="life-actor" style="--x:${17+(index%3)*33}%;--y:${31+Math.floor(index/3)*27}%;--delay:${-index*.3}s" onclick="greetLifeActor(${index})" aria-label="和${executiveFigurineDatabase[id].name}打招呼"><span class="life-actor-art">${getFigurineAvatarSVG(id,'md')}</span><small>${executiveFigurineDatabase[id].name}</small></button>`:'').join('');
      renderLifeFurniture();renderLifeStories();
    }
    function greetLifeActor(index){
      if(lifeActiveStory)return;
      const fig=executiveFigurineDatabase[userCabinetSlots[index]];if(!fig)return;
      document.getElementById('life-story-label').textContent='夥伴打招呼';
      document.getElementById('life-story-line').textContent=fig.name+'：'+fig.quote;
    }
    function setLifeCaption(label,line,step,total){
      document.getElementById('life-story-label').textContent=label;
      document.getElementById('life-story-line').textContent=line;
      document.getElementById('life-progress').innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<=step?'is-done':''}"></i>`).join('');
    }
    function startLifeStory(id,shouldScroll=true){
      const story=lifeStoryCatalog.find(s=>s.id===id);if(lifeActiveStory||!story||!lifeStoryReady(story))return false;
      lifeActiveStory=story;lifeSelectedFurniture=null;const token=++lifeStoryToken;
      const actors=[...story.members];if(isFigurineVisible(story.extra)&&userCabinetSlots.includes(story.extra))actors.push(story.extra);
      const zone=lifeLayout.indexOf(story.furniture),center=17+zone*33;
      actors.forEach((actorId,i)=>{
        const actor=document.getElementById('life-actor-'+userCabinetSlots.indexOf(actorId));if(!actor)return;
        actor.style.setProperty('--x',Math.max(9,Math.min(91,center+(i-1)*12))+'%');actor.style.setProperty('--y',(49+(i%2)*17)+'%');actor.classList.add('is-walking');
      });
      document.getElementById('living-branch').classList.add('story-running','story-'+story.id);
      document.getElementById('life-end-story').classList.remove('hidden');
      renderLifeFurniture();renderLifeStories();
      if(shouldScroll)document.getElementById('living-branch').scrollIntoView({block:'start',behavior:'smooth'});
      const lines=story.steps.map(([actorId,line])=>executiveFigurineDatabase[actorId].name+'：'+line);
      if(actors.includes(story.extra))lines.push(story.extraLine);
      setLifeCaption(story.name,'夥伴正在走向'+lifeZoneNames[zone]+'的'+lifeFurniture[story.furniture].name+'…',-1,lines.length);
      lines.forEach((line,index)=>setTimeout(()=>{
        if(token!==lifeStoryToken)return;
        actors.forEach(actorId=>{const actor=document.getElementById('life-actor-'+userCabinetSlots.indexOf(actorId));actor?.classList.remove('is-walking');actor?.classList.add('is-acting');});
        setLifeCaption(story.name,line,index,lines.length);
      },1400+index*1900));
      setTimeout(()=>{if(token!==lifeStoryToken)return;lifeMemories.add(story.id);endLifeStory(true);setLifeCaption('✦ 回憶已收藏 · '+story.name,story.ending,lines.length-1,lines.length);},1400+lines.length*1900);
      return true;
    }
    function endLifeStory(completed=false){
      if(!lifeActiveStory)return;
      ++lifeStoryToken;lifeActiveStory=null;
      document.getElementById('life-end-story').classList.add('hidden');
      renderLivingBranch();
      if(!completed)setLifeCaption('分店日常','夥伴們回到各自的位置。想看下一段故事，隨時可以再開演。',-1,0);
    }
    function toggleLifeAuto(){
      lifeAutoEnabled=!lifeAutoEnabled;
      const btn=document.getElementById('life-auto');btn.textContent=lifeAutoEnabled?'自動小劇場：開':'自動小劇場：關';btn.setAttribute('aria-pressed',String(lifeAutoEnabled));
    }
    function scheduleLifeStory(){
      setTimeout(()=>{
        const page=document.getElementById('tab-showcase');
        const rect=document.getElementById('living-branch')?.getBoundingClientRect();
        const viewport=document.getElementById('app-main-scroll')?.getBoundingClientRect();
        const visible=rect&&viewport&&rect.top<viewport.bottom-120&&rect.bottom>viewport.top+120;
        if(visible&&lifeAutoEnabled&&!lifeSelectedFurniture&&!lifeActiveStory&&!document.hidden&&page&&!page.classList.contains('hidden')&&!document.querySelector('[id^="modal-"]:not(.hidden)')&&!document.querySelector('.life-roster-details[open]')){
          const ready=lifeStoryCatalog.filter(lifeStoryReady),unseen=ready.filter(s=>!lifeMemories.has(s.id)),pool=unseen.length?unseen:ready;
          if(pool.length)startLifeStory(pool[Math.floor(Math.random()*pool.length)].id,false);
        }
        scheduleLifeStory();
      },24000);
    }
    window.addEventListener('DOMContentLoaded',scheduleLifeStory);

    function render3x3CabinetGrid() {
      if(typeof renderCabinetCarousel==='function')renderCabinetCarousel();
      renderLivingBranch();
      const container = document.getElementById('cabinet-3x3-container');
      if (!container) return;
      container.innerHTML = '';

      if (cabinetPedestalTheme === 'marble') {
        container.className = "grid grid-cols-3 gap-2 p-2.5 rounded-2xl border-2 border-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner";
      } else if (cabinetPedestalTheme === 'cyber') {
        container.className = "grid grid-cols-3 gap-2 p-2.5 rounded-2xl border-2 border-purple-500 bg-gradient-to-b from-purple-950 to-slate-900 shadow-inner";
      } else {
        container.className = "grid grid-cols-3 gap-2 p-2.5 rounded-2xl border-2 border-amber-800/60 bg-gradient-to-br from-amber-100/90 to-amber-200/80 shadow-inner";
      }

      userCabinetSlots.forEach((savedId, idx) => {
        const figId=isFigurineVisible(savedId)?savedId:null;
        const slotEl = document.createElement('div');
        const fig = figId ? executiveFigurineDatabase[figId] : null;
        const warehouseItem = figId ? userWarehouse.find(w => w.id === figId) : null;
        const currentStars = warehouseItem ? warehouseItem.stars : 1;

        slotEl.className = "cabinet-slot rounded-xl border-2 border-slate-800/80 relative cursor-pointer group transition-all lego-btn bg-white/95 shadow-sm";

        if (fig) {
          // 點擊公仔開啟角色背景故事詳情彈窗
          slotEl.onclick = () => openFigurineDetailModal(fig.id);
          const rarityGlow = fig.rarity === 'SSR' 
            ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-amber-100 shadow-md ring-1 ring-amber-400' 
            : fig.rarity === 'SR' 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-blue-400 bg-blue-50';

          slotEl.className += ` ${rarityGlow}`;
          slotEl.innerHTML = `
            <div class="cabinet-avatar">
              ${getFigurineAvatarSVG(fig.id, 'md')}
            </div>
            <div class="cabinet-name">${fig.name}</div>
            <div class="cabinet-stars" aria-label="${currentStars} 星">${'★'.repeat(currentStars)}${'☆'.repeat(5-currentStars)}</div>
            <button onclick="event.stopPropagation(); openSelectFigurineModal(${idx});" class="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] font-black flex items-center justify-center opacity-70 hover:opacity-100" title="更換公仔">⇄</button>
          `;
        } else {
          slotEl.onclick = () => openSelectFigurineModal(idx);
          slotEl.innerHTML = `
            <span class="text-slate-300 text-xl font-black">+</span>
            <span class="text-[8px] text-slate-400 font-bold mt-0.5">點擊放置</span>
          `;
        }

        container.appendChild(slotEl);
      });
    }

    // 渲染同事展櫃 (全面採用真實 3x3 IP 公仔)
    function renderColleagueCabinet() {
      const container = document.getElementById('colleague-cabinet-grid');
      if (!container) return;
      container.innerHTML = '';

      // 同事展示的 9 款真實主管 IP (陳總 + 托尼 混搭)
      const colleagueSlots = [
        'fig_muscle', 'tony_ninja', 'fig_hiphop',
        'tony_alien', 'fig_ballet', 'tony_detective',
        'fig_moto', 'tony_rock', 'fig_santa'
      ];

      colleagueSlots.forEach(figId => {
        const fig = executiveFigurineDatabase[figId];
        const card = document.createElement('div');
        card.className = "p-1.5 bg-purple-900/60 rounded-xl border border-amber-400/80 text-center flex flex-col items-center cursor-pointer hover:scale-105 transition-transform";
        card.onclick = () => openFigurineDetailModal(figId);
        card.innerHTML = `
          ${getFigurineAvatarSVG(figId, 'sm')}
          <span class="text-[8px] font-black text-amber-300 truncate mt-0.5 w-full">${fig ? fig.name : '主管'}</span>
        `;
        container.appendChild(card);
      });
    }

    /* ========================================================= */
    /* 倉庫與升星突破 (Warehouse & Breakthrough)                  */
    /* ========================================================= */
    function renderWarehouseUI() {
      if(typeof renderCabinetCarousel==='function')renderCabinetCarousel();
      const container = document.getElementById('warehouse-grid');
      if (!container) return;
      container.innerHTML = '';

      const filteredList = userWarehouse.filter(item => {
        if(!isFigurineVisible(item.id))return false;
        const fig = executiveFigurineDatabase[item.id];
        if (!fig) return false;
        if (currentWarehouseFilter === 'all') return true;
        if (currentWarehouseFilter === 'super') return fig.category === 'super';
        return fig.rarity === currentWarehouseFilter;
      });

      if (filteredList.length === 0) {
        container.innerHTML = `
          <div class="col-span-2 py-6 text-center text-slate-400 font-bold text-xs">
            查無此稀有度的公仔，快去扭蛋機試試手氣吧！
          </div>
        `;
        return;
      }

      filteredList.forEach(item => {
        const fig = executiveFigurineDatabase[item.id];
        if (!fig) return;
        const canUpgrade = item.fragments >= 5 && item.stars < 5 && fig.familyRole !== 'founder';
        const rarityBadgeClass = fig.rarity === 'SSR' 
          ? 'bg-amber-400 text-slate-900 border-amber-500' 
          : fig.rarity === 'SR' 
          ? 'bg-purple-600 text-white border-purple-700' 
          : 'bg-blue-500 text-white border-blue-600';

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-2xl border-2 border-slate-900 flex flex-col justify-between lego-card-sm space-y-2 relative";
        card.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-1.5 cursor-pointer" onclick="openFigurineDetailModal('${fig.id}')">
              ${getFigurineAvatarSVG(fig.id, 'sm')}
              <div class="min-w-0">
                <div class="text-xs font-black text-slate-900 truncate">${fig.name}</div>
                <div class="text-[9px] text-amber-500 font-pixel mt-0.5">${'★'.repeat(item.stars)}</div>
              </div>
            </div>
            <span class="text-[8px] font-pixel px-1.5 py-0.5 rounded border font-black shrink-0 ${rarityBadgeClass}">${fig.rarity}</span>
          </div>

          <div class="space-y-1 ${fig.familyRole === 'founder' ? 'hidden' : ''}">
            <div class="flex justify-between items-center text-[9px] font-bold text-slate-500">
              <span>碎片進度</span>
              <span class="${canUpgrade ? 'text-sinyi-green font-black' : 'text-slate-600'}">${item.fragments} / 5</span>
            </div>
            <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-300">
              <div class="${canUpgrade ? 'bg-sinyi-green' : 'bg-amber-400'} h-full transition-all duration-300" style="width: ${Math.min(100, (item.fragments / 5) * 100)}%"></div>
            </div>
          </div>

          ${fig.familyRole === 'heir' ? `<p class="text-[9px] text-slate-500 font-bold">持有 ${item.copies ?? 1} 張 · 重複融合 +1 專屬碎片</p>` : ''}
          <button onclick="upgradeFigurineStars('${fig.id}')" ${canUpgrade ? '' : 'disabled'} class="w-full py-1.5 rounded-xl text-[10px] font-black border transition-all lego-btn ${
            canUpgrade 
              ? 'bg-sinyi-green hover:bg-emerald-700 text-white border-slate-900 shadow' 
              : 'bg-slate-100 text-slate-400 border-slate-300 pointer-events-none'
          }">
            ${fig.familyRole === 'founder' ? `持有 ${item.copies ?? 1} 張 · 融合素材` : item.stars >= 5 ? '已達最高 5 星' : canUpgrade ? '✨ 升星突破 (+1★)' : '碎片不足'}
          </button>
        `;
        container.appendChild(card);
      });
    }

    function filterWarehouse(rarity) {
      currentWarehouseFilter = rarity;
      renderWarehouseUI();
    }

    function upgradeFigurineStars(figId) {
      const item = userWarehouse.find(w => w.id === figId);
      if (executiveFigurineDatabase[figId]?.familyRole === 'founder') {showCustomToast('此為融合素材角色，維持 1 星造型。','✨');return;}
      if (item?.stars >= 5) { showCustomToast('已達最高 5 星！', '🏆'); return; }
      if (!item || item.fragments < 5) {
        showCustomToast('碎片不足，需 5 片專屬碎片方可升星！', '⚠️');
        return;
      }
      item.fragments -= 5;
      item.stars = Math.min(5, item.stars + 1);
      item.equippedStars = item.stars;
      renderWarehouseUI();
      render3x3CabinetGrid();
      const fig = executiveFigurineDatabase[figId];
      showCustomToast(`🎉 恭喜！【${fig ? fig.name : '公仔'}】成功突破晉升至 ${item.stars} 星！`, '⭐');
      if (figId === 'fig_muscle' || globalThis.characterEvolutionCatalog?.[figId]) openFigurineDetailModal(figId);
    }

    function changePedestalTheme(theme) {
      cabinetPedestalTheme = theme;
      render3x3CabinetGrid();
      showCustomToast(`已套用【${theme === 'wood' ? '原木' : theme === 'marble' ? '大理石' : '賽博'}】展櫃材質！`, '🏆');
    }

    function showGachaRevealModal(results, mode = 'gacha') {
      const container = document.getElementById('gacha-reveal-container');
      if (!container) return;
      const heading = document.getElementById('gacha-reveal-heading');
      if (heading) heading.innerText = mode === 'fusion' ? '✨ 傳承融合成功' : mode === 'recruit' ? '創辦人招募結果' : 'GACHA REVEAL';
      container.classList.toggle('fusion-reveal',mode === 'fusion');
      container.innerHTML = '';

      results.forEach(res => {
        const row = document.createElement('div');
        row.className = "p-2.5 bg-slate-50 rounded-2xl border-2 border-slate-900 flex items-center justify-between gap-2 text-left lego-card-sm";
        row.innerHTML = `
          <div class="flex items-center gap-2">
            ${getFigurineAvatarSVG(res.id, 'sm')}
            <div>
              <div class="flex items-center gap-1">
                <span class="text-xs font-black text-slate-900">${res.name}</span>
                <span class="text-[8px] bg-slate-900 text-white font-pixel px-1.5 py-0.2 rounded">${res.rarity}</span>
              </div>
              <div class="text-[9px] text-slate-500 font-bold">${res.titleBadge}</div>
            </div>
          </div>
          <span class="text-[9px] font-black px-2 py-0.5 rounded border shrink-0 ${res.isDuplicate ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}">
            ${res.rewardLabel || (res.isDuplicate ? '重複 ➔ +1碎片' : '✨ NEW!')}
          </span>
        `;
        container.appendChild(row);
      });

      openModal('modal-gacha-reveal');
    }

    function openFigurineDetailModal(figId) {
      if(!isFigurineVisible(figId))return;
      const fig = executiveFigurineDatabase[figId];
      if (!fig) return;
      const warehouseItem = userWarehouse.find(w => w.id === figId);
      const currentStars = warehouseItem ? warehouseItem.stars : 1;

      const universeBadge = document.getElementById('fig-detail-universe-badge');
      const rarityBadge = document.getElementById('fig-detail-rarity-badge');
      const avatarContainer = document.getElementById('fig-detail-avatar-container');
      const nameEl = document.getElementById('fig-detail-name');
      const titleBadgeEl = document.getElementById('fig-detail-title-badge');
      const starsEl = document.getElementById('fig-detail-stars');
      const descEl = document.getElementById('fig-detail-desc');
      const quoteEl = document.getElementById('fig-detail-quote');
      const voiceBtn = document.getElementById('btn-fig-voice-preview');

      const isTony = fig.id.startsWith('tony_');
      if (universeBadge) {
        universeBadge.innerText = fig.category === 'super' ? '超業 · ' + (fig.owner === 'dingyuan' ? '鼎元' : '婉嫣') : fig.familyRole ? '傳承融合 IP' : isTony ? '托尼宇宙（主角）' : '陳總宇宙';
        universeBadge.className = isTony
          ? 'text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded border border-slate-900'
          : 'text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded border border-slate-900';
      }
      if (rarityBadge) {
        rarityBadge.innerText = fig.rarity;
        rarityBadge.className = fig.rarity === 'SSR' 
          ? 'text-[10px] font-pixel px-2 py-0.5 rounded font-black bg-amber-400 text-slate-900' 
          : fig.rarity === 'SR' 
          ? 'text-[10px] font-pixel px-2 py-0.5 rounded font-black bg-purple-600 text-white' 
          : 'text-[10px] font-pixel px-2 py-0.5 rounded font-black bg-blue-500 text-white';
      }
      if (avatarContainer) avatarContainer.innerHTML = getFigurineAvatarSVG(fig.id, 'lg');
      if (nameEl) nameEl.innerText = fig.name;
      if (titleBadgeEl) titleBadgeEl.innerText = fig.titleBadge;
      if (starsEl) starsEl.innerText = (warehouseItem ? '目前星等：' : '尚未擁有：') + '★'.repeat(warehouseItem ? currentStars : 0) + '☆'.repeat(warehouseItem ? 5-currentStars : 5);
      if (descEl) descEl.innerText = fig.desc;
      if (quoteEl) quoteEl.innerText = fig.quote;
      const evolutionPanel = document.getElementById('fig-evolution-panel');
      const hasEvolution = figId === 'fig_muscle' || !!globalThis.characterEvolutionCatalog?.[figId];
      evolutionPanel.classList.toggle('hidden', !hasEvolution);
      if (hasEvolution) renderEvolutionPreview(figId, getEquippedFigurineStars(figId));
      if (voiceBtn) {
        voiceBtn.onclick = () => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(fig.quote.replace(/[「」]/g, ''));
            utter.lang = 'zh-TW';
            utter.rate = 1.05;
            window.speechSynthesis.speak(utter);
          }
        };
      }

      openModal('modal-figurine-detail');
    }

    function renderEvolutionPreview(figId, stars) {
      const item = userWarehouse.find(w => w.id === figId);
      const ownedStars = item?.stars ?? 0;
      const fig = executiveFigurineDatabase[figId];
      const names = globalThis.characterEvolutionCatalog?.[figId]?.names ?? muscleEvolutionStages.map(s=>s.name);
      document.getElementById('fig-evolution-title').innerText = `${fig.name} · 五星造型衣櫃`;
      document.getElementById('fig-detail-avatar-container').innerHTML = getFigurineAvatarSVG(figId,'lg',stars);
      document.getElementById('fig-evolution-stage').innerText = `${stars} 星 · ${names[stars-1]}${stars > ownedStars ? '（尚未解鎖）' : '（已解鎖）'}`;
      document.getElementById('fig-detail-desc').innerText = figId === 'fig_muscle' ? muscleEvolutionStages[stars-1].desc : `${fig.name}的第 ${stars} 階造型「${names[stars-1]}」。升星後會同步更新展櫃、倉庫與角色詳情中的服裝、姿勢及配件。`;
      const equippedStars = getEquippedFigurineStars(figId);
      document.getElementById('fig-evolution-options').innerHTML = names.map((name,index) => `<button type="button" aria-label="預覽 ${index+1} 星 ${name}" aria-pressed="${index+1===stars}" onclick="renderEvolutionPreview('${figId}',${index+1})" class="evolution-option ${index+1===stars ? 'is-selected' : ''}"><span>${getFigurineAvatarSVG(figId,'sm',index+1)}</span><b>${index+1} 星</b><small>${item && index+1 === equippedStars ? '使用中' : index+1 <= ownedStars ? '已解鎖' : '未解鎖'}</small></button>`).join('');
      const equipBtn = document.getElementById('fig-evolution-equip');
      equipBtn.disabled = !item || stars > ownedStars || stars === equippedStars;
      equipBtn.innerText = !item ? '尚未獲得角色' : stars > ownedStars ? `升至 ${stars} 星即可解鎖此造型` : stars === equippedStars ? '正在使用此造型' : '使用此造型';
      equipBtn.onclick = () => equipFigurineAppearance(figId,stars);
      const upgradeBtn = document.getElementById('fig-evolution-upgrade');
      upgradeBtn.onclick = () => upgradeFigurineStars(figId);
      upgradeBtn.disabled = !item || ownedStars >= 5 || item.fragments < 5;
      upgradeBtn.innerText = !item ? (executiveFigurineDatabase[figId]?.familyRole === 'heir' ? '尚未獲得角色，請至融合工坊取得' : '尚未獲得角色，可在獎池抽取') : ownedStars >= 5 ? '已達最高 5 星' : `升至 ${ownedStars+1} 星 · 碎片 ${item.fragments}/5`;
    }

    function equipFigurineAppearance(figId, stars) {
      const item = userWarehouse.find(w=>w.id===figId);
      if (!item || !Number.isInteger(stars) || stars<1 || stars>5 || stars>item.stars || !globalThis.characterEvolutionCatalog?.[figId]) {
        showCustomToast('此造型尚未解鎖，請先提升角色星等。','🔒');
        return;
      }
      item.equippedStars = stars;
      renderWarehouseUI();
      render3x3CabinetGrid();
      renderEvolutionPreview(figId,stars);
      showCustomToast(`已換上【${executiveFigurineDatabase[figId].name}】${stars} 星造型！`,'✨');
    }

    function openEvolutionCollection() {
      const list = document.getElementById('evolution-collection-list');
      list.innerHTML = Object.keys(globalThis.characterEvolutionCatalog ?? {}).filter(isFigurineVisible).map(id => {
        const fig = executiveFigurineDatabase[id];
        const owned = userWarehouse.find(item => item.id === id);
        return `<button class="evolution-collection-card" onclick="closeModal('modal-evolution-collection'); openFigurineDetailModal('${id}')"><span>${getFigurineAvatarSVG(id,'md')}</span><b>${fig.name}</b><small>${owned ? `${owned.stars} 星 · 已擁有` : '尚未擁有'}</small></button>`;
      }).join('');
      openModal('modal-evolution-collection');
    }

    function openSelectFigurineModal(slotIdx) {
      selectedSlotIndexForEdit = slotIdx;
      const listEl = document.getElementById('select-figurine-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      // 防呆：清理重複的公仔，確保展櫃唯一性
      const currentOccupiedMap = {};
      userCabinetSlots.forEach((id, idx) => {
        if (id) {
          if (currentOccupiedMap[id] !== undefined) {
            userCabinetSlots[idx] = null; // 清除非首個重複位置
          } else {
            currentOccupiedMap[id] = idx;
          }
        }
      });

      userWarehouse.forEach(item => {
        if(!isFigurineVisible(item.id))return;
        const fig = executiveFigurineDatabase[item.id];
        if (!fig) return;

        const isCurrentlyInThisSlot = userCabinetSlots[selectedSlotIndexForEdit] === fig.id;
        const otherSlotIdx = userCabinetSlots.findIndex((sId, idx) => sId === fig.id && idx !== selectedSlotIndexForEdit);
        const isPlacedInOtherSlot = otherSlotIdx !== -1;

        const card = document.createElement('div');
        card.className = `p-2.5 rounded-2xl border-2 border-slate-900 bg-white flex items-center justify-between lego-card-sm hover:bg-slate-50 cursor-pointer transition-all ${
          isCurrentlyInThisSlot ? 'ring-2 ring-sinyi-green bg-emerald-50' : ''
        }`;
        card.innerHTML = `
          <div class="flex items-center gap-2">
            ${getFigurineAvatarSVG(fig.id, 'sm')}
            <div>
              <div class="flex items-center gap-1">
                <span class="text-xs font-black text-slate-900">${fig.name}</span>
                <span class="text-[8px] bg-slate-900 text-white font-pixel px-1.5 py-0.2 rounded">${fig.rarity}</span>
                <span class="text-[8px] text-amber-500 font-pixel">${'★'.repeat(item.stars)}</span>
              </div>
              <div class="text-[9px] text-slate-500 font-bold mt-0.5">${fig.titleBadge}</div>
              ${isPlacedInOtherSlot ? `<div class="text-[8px] text-amber-600 font-black mt-0.5">※ 已在位置 ${otherSlotIdx + 1}，選擇將自動移至此處</div>` : ''}
            </div>
          </div>
          <div>
            <button class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${
              isCurrentlyInThisSlot 
                ? 'bg-slate-200 text-slate-500 border-slate-300' 
                : 'bg-sinyi-green text-white border-slate-900 lego-btn shadow-sm'
            }">
              ${isCurrentlyInThisSlot ? '已在此處' : isPlacedInOtherSlot ? '移動至此 ⇄' : '陳列上架'}
            </button>
          </div>
        `;
        card.onclick = () => selectFigurineForSlot(fig.id);
        listEl.appendChild(card);
      });

      openModal('modal-select-figurine');
    }

    function selectFigurineForSlot(figId) {
      if(!isFigurineVisible(figId))return;
      // 唯一性防護：若該公仔已在其他格子，自動拔除原位置
      const existingIdx = userCabinetSlots.indexOf(figId);
      if (existingIdx !== -1 && existingIdx !== selectedSlotIndexForEdit) {
        userCabinetSlots[existingIdx] = null;
      }

      userCabinetSlots[selectedSlotIndexForEdit] = figId;
      render3x3CabinetGrid();
      closeModal('modal-select-figurine');
      const fig = executiveFigurineDatabase[figId];
      showCustomToast(`已將【${fig ? fig.name : '公仔'}】陳列於展示櫃第 ${selectedSlotIndexForEdit + 1} 位！`, '🏆');
    }

    function switchGachaPool(poolKey) {
      if(globalThis.hideChenCharacters&&poolKey==='chen')poolKey='tony';
      currentGachaPool = poolKey;
      ['all', 'chen', 'tony', 'family', 'super'].forEach(k => {
        const btn = document.getElementById(`pool-btn-${k}`);
        if (btn) {
          if (k === poolKey) {
            btn.className = "flex-1 py-1.5 rounded-lg bg-slate-900 text-white font-black border border-slate-900 shadow-sm transition-all text-center";
          } else {
            btn.className = "flex-1 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 font-bold border border-slate-300 transition-all text-center";
          }
        }
      });

      const labelMap = {
        tony: '當期特選：【⚡ 托尼宇宙限定池 (12款主角)】',
        chen: '當期特選：【🌌 陳總宇宙限定池 (15款)】',
        all: '當期特選：【🎲 雙宇宙混抽 (27款)】',
        family: '傳承限定：【周先生 50% · 王小姐 50%】',
        super: '超業限定：【鼎元 4 款 · 婉嫣 5 款】'
      };
      const labelEl = document.getElementById('gacha-active-pool-label');
      if (labelEl) labelEl.innerText = labelMap[poolKey] || labelMap.tony;
      document.getElementById('family-pool-note')?.classList.toggle('hidden',poolKey !== 'family');
      document.getElementById('super-pool-note')?.classList.toggle('hidden',poolKey !== 'super');
      document.getElementById('gacha-pity-info')?.classList.toggle('hidden',poolKey === 'family');
      const tenBadge = document.getElementById('gacha-ten-badge');
      const tenCost = document.getElementById('gacha-ten-cost');
      if (tenBadge) tenBadge.textContent = poolKey === 'family' ? '95折・獨立抽取' : '95折・保底R';
      if (tenCost) tenCost.textContent = poolKey === 'family' ? '🪙 950 幣' : '🪙 950 幣 (保底稀有)';

      showCustomToast(`已切換至：${labelMap[poolKey].replace('當期特選：', '')}`, '🎰');
    }

    function pullExecutiveGacha(times = 1) {
      if (currentGachaPool === 'family') return pullFamilyGacha(times);
      let cost = (times === 1) ? 100 : 950;

      if (times === 1 && gachaTickets > 0) {
        gachaTickets--;
      } else if (userCoins >= cost) {
        userCoins -= cost;
      } else {
        showCustomToast(`遊戲幣不足！需要 🪙 ${cost} 幣，解任務或小學堂即可獲得！`, '⚠️');
        return;
      }

      // 嚴格依據目前選擇卡池過濾，並加入防呆保底
      let availableIds = [];
      if (currentGachaPool === 'tony') {
        availableIds = Object.keys(executiveFigurineDatabase).filter(id => id.startsWith('tony_') || executiveFigurineDatabase[id].pool === 'tony');
      } else if (currentGachaPool === 'chen') {
        availableIds = Object.keys(executiveFigurineDatabase).filter(id => id.startsWith('fig_') || executiveFigurineDatabase[id].pool === 'chen');
      } else if (currentGachaPool === 'super') {
        availableIds = Object.keys(executiveFigurineDatabase).filter(id => executiveFigurineDatabase[id].pool === 'super');
      } else {
        availableIds = Object.keys(executiveFigurineDatabase).filter(id => !executiveFigurineDatabase[id].familyRole && executiveFigurineDatabase[id].pool !== 'super');
      }

      availableIds=availableIds.filter(isFigurineVisible);
      // 嚴密防呆：若過濾為空，自動取托尼
      if (availableIds.length === 0) {
        availableIds = Object.keys(executiveFigurineDatabase).filter(id => id.startsWith('tony_'));
        if (availableIds.length === 0) availableIds = Object.keys(executiveFigurineDatabase);
      }

      const rPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'R');
      const srPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'SR');
      const ssrPool = availableIds.filter(id => executiveFigurineDatabase[id].rarity === 'SSR');

      const results = [];

      for (let i = 0; i < times; i++) {
        gachaPityCounter++;
        let chosenId = availableIds[0];

        // 50 抽大保底：必出 SR 或 SSR
        if (gachaPityCounter >= 50) {
          chosenId = (Math.random() < 0.35 && ssrPool.length > 0)
            ? ssrPool[Math.floor(Math.random() * ssrPool.length)]
            : (srPool.length > 0 ? srPool[Math.floor(Math.random() * srPool.length)] : availableIds[0]);
          gachaPityCounter = 0;
        } else if (times === 10 && i === 9) {
          // 十連保底稀有 R 以上
          const rand = Math.random();
          if (rand < 0.08 && ssrPool.length > 0) chosenId = ssrPool[Math.floor(Math.random() * ssrPool.length)];
          else if (rand < 0.40 && srPool.length > 0) chosenId = srPool[Math.floor(Math.random() * srPool.length)];
          else chosenId = rPool.length > 0 ? rPool[Math.floor(Math.random() * rPool.length)] : availableIds[0];
        } else {
          const rand = Math.random();
          if (rand < 0.06 && ssrPool.length > 0) {
            chosenId = ssrPool[Math.floor(Math.random() * ssrPool.length)];
            gachaPityCounter = 0;
          } else if (rand < 0.30 && srPool.length > 0) {
            chosenId = srPool[Math.floor(Math.random() * srPool.length)];
          } else {
            chosenId = rPool.length > 0 ? rPool[Math.floor(Math.random() * rPool.length)] : availableIds[0];
          }
        }

        const figDef = executiveFigurineDatabase[chosenId] || executiveFigurineDatabase['tony_ninja'];
        const existingInWarehouse = userWarehouse.find(w => w.id === chosenId);
        let isDuplicate = false;

        if (existingInWarehouse) {
          existingInWarehouse.fragments += 1;
          isDuplicate = true;
        } else {
          userWarehouse.push({ id: chosenId, stars: 1, fragments: 0 });
        }

        results.push({ ...figDef, isDuplicate });
      }

      updateCurrencyUI();
      renderWarehouseUI();
      showGachaRevealModal(results);
    }

    // 渲染同事展櫃 (全面採用真實 3x3 IP 向量貼紙)
    function renderColleagueCabinet() {
      const container = document.getElementById('colleague-cabinet-grid');
      if (!container) return;
      container.innerHTML = '';

      // 同事展示的 9 款真實主管 IP (托尼主角群 + 陳總 混搭)
      const colleagueSlots = [
        'tony_ninja', 'tony_detective', 'tony_dino',
        'tony_rock', 'tony_alien', 'tony_clown',
        'fig_muscle', 'fig_moto', 'fig_hiphop'
      ];

      colleagueSlots.forEach(figId => {
        const fig = executiveFigurineDatabase[figId];
        if (!fig) return;
        const card = document.createElement('div');
        card.className = "p-1.5 bg-purple-900/60 rounded-xl border border-amber-400/80 text-center flex flex-col items-center cursor-pointer hover:scale-105 transition-transform";
        card.onclick = () => openFigurineDetailModal(figId);
        card.innerHTML = `
          ${getFigurineAvatarSVG(figId, 'sm')}
          <span class="text-[8px] sm:text-[9px] font-black text-amber-300 truncate mt-1 w-full block">${fig.name}</span>
        `;
        container.appendChild(card);
      });
    }

    function openColleagueVisitModal() {
      renderColleagueCabinet();
      openModal('modal-colleague-visit');
    }

    function likeColleagueCabinet() {
      showCustomToast('已為小林的展櫃點讚送愛心！每日人氣加成完成。', '❤️');
      closeModal('modal-colleague-visit');
    }

    function sendBulletComment() {
      showCustomToast('彈幕已發送：「你居然抽到恐龍托尼與肌肉陳總！吸一口歐氣！」', '💬');
    }

    /* ========================================================= */
    /* 導覽列與分頁切換邏輯 (嚴格防止未完成測驗前外溢)            */
    /* ========================================================= */
    function switchTab(tabId) {
      if (!isQuizCompleted) {
        showCustomToast('請先完成新手適性測驗並確認起步路線！', '🔒');
        return;
      }

      ['tab-tasks', 'tab-map', 'tab-handbook', 'tab-showcase', 'tab-academy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.classList.remove('hidden');

      // 更新 Bottom Nav 高亮
      ['map', 'handbook', 'tasks', 'showcase', 'academy'].forEach(k => {
        const btn = document.getElementById(`nav-btn-${k}`);
        if (btn) {
          if (`tab-${k}` === tabId) {
            btn.className = "flex flex-col items-center flex-1 text-sinyi-green transition-all scale-105 font-black";
          } else {
            btn.className = "flex flex-col items-center flex-1 text-slate-400 hover:text-slate-800 transition-all font-bold";
          }
        }
      });

      const mainScroll = document.getElementById('app-main-scroll');
      if (mainScroll) {
        mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function confirmAndEnterApp() {
      isQuizCompleted = true;
      document.getElementById('screen-quiz-flow').classList.add('hidden');

      const bottomNav = document.getElementById('bottom-navbar');
      if (bottomNav) bottomNav.classList.remove('hidden');

      switchTab('tab-tasks');
      showCustomToast(`🎉 歡迎啟航！已為你開啟【${devStyleDefinitions[currentSelectedDevCode].name}】任務線！`, '🚀');
    }

    function openModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    }

    function closeModal(id) {
      if (id === 'modal-family-fusion' && typeof familyFusionBusy !== 'undefined' && familyFusionBusy) return;
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }

    function showCustomToast(msg, icon = '✨') {
      const toast = document.getElementById('custom-toast');
      const msgEl = document.getElementById('toast-msg');
      const iconEl = document.getElementById('toast-icon');

      if (!toast || !msgEl) return;
      msgEl.innerText = msg;
      if (iconEl) iconEl.innerText = icon;

      toast.classList.remove('opacity-0', '-translate-y-2');
      toast.classList.add('opacity-100', 'translate-y-0');

      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-2');
      }, 2500);
    }

    /* ========================================================= */
    /* 適性測驗邏輯 (拖曳排序無第X名標籤)                        */
    /* ========================================================= */
    function cleanOptionText(raw) {
      return raw.replace(/（對應：[^）]+）|\(對應：[^)]+\)/g, '').trim();
    }

    function renderQuizQuestion() {
      const q = officialQuestions[currentQuizIndex];
      if (!q) return;

      document.getElementById('quiz-qnum-badge').innerText = `第 ${q.id} 題／共 6 題`;
      document.getElementById('quiz-type-label').innerText = q.category;
      document.getElementById('quiz-question-title').innerText = q.title;

      const pct = Math.round(((currentQuizIndex + 1) / 6) * 100);
      document.getElementById('quiz-progress-bar').style.width = `${pct}%`;

      const prevBtn = document.getElementById('btn-prev-q');
      if (prevBtn) prevBtn.disabled = (currentQuizIndex === 0);

      const nextBtn = document.getElementById('btn-next-q');
      if (nextBtn) {
        nextBtn.innerText = currentQuizIndex === 5 ? '計算適性成果 ➔' : '下一題 →';
      }

      const sortFooter = document.getElementById('quiz-sort-footer');
      const hintEl = document.getElementById('quiz-question-hint');
      const optionsArea = document.getElementById('quiz-options-area');
      optionsArea.innerHTML = '';

      hintEl.innerText = q.hint;

      if (q.type === 'sort') {
        sortFooter.classList.remove('hidden');
        renderSortTypeQuestionWithoutBadges(q, optionsArea);
      } else if (q.type === 'top2') {
        sortFooter.classList.remove('hidden');
        renderTop2TypeQuestion(q, optionsArea);
      } else if (q.type === 'single') {
        sortFooter.classList.add('hidden');
        renderSingleTypeQuestion(q, optionsArea);
      }

      calculateAndApplyResults();
    }

    function renderSortTypeQuestionWithoutBadges(q, container) {
      const order = userQuizAnswers[q.id] || q.options.map(o => o.key);
      userQuizAnswers[q.id] = order;

      order.forEach((key, idx) => {
        const opt = q.options.find(o => o.key === key);
        if (!opt) return;
        const cleanText = cleanOptionText(opt.rawText);

        const row = document.createElement('div');
        row.className = "p-2.5 rounded-xl border-2 border-slate-900 bg-white flex items-center justify-between lego-card-sm transition-all";
        row.innerHTML = `
          <div class="flex items-start space-x-2 text-[11px] text-slate-800 leading-snug">
            <span class="font-pixel text-[10px] text-lego-blue shrink-0 mt-0.5">${key}.</span>
            <span>${cleanText}</span>
          </div>
          <div class="flex items-center space-x-1 shrink-0 ml-2">
            <button onclick="moveSortItem(${q.id}, ${idx}, -1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border border-slate-400 flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}">▲</button>
            <button onclick="moveSortItem(${q.id}, ${idx}, 1)" class="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border border-slate-400 flex items-center justify-center text-[10px] font-bold ${idx === order.length - 1 ? 'opacity-30 pointer-events-none' : ''}">▼</button>
          </div>
        `;
        container.appendChild(row);
      });

      const progText = document.getElementById('sort-progress-text');
      if (progText) progText.innerText = "由上至下代表最想先做至最後 (可點箭頭微調)";
    }

    function moveSortItem(qId, idx, direction) {
      const order = userQuizAnswers[qId];
      if (!order) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= order.length) return;

      const temp = order[idx];
      order[idx] = order[targetIdx];
      order[targetIdx] = temp;

      renderQuizQuestion();
    }

    function renderTop2TypeQuestion(q, container) {
      const currentOrder = userQuizAnswers[q.id] || [];

      q.options.forEach(opt => {
        const cleanText = cleanOptionText(opt.rawText);
        const rankIdx = currentOrder.indexOf(opt.key);
        const isRanked = rankIdx !== -1;
        const rankNum = isRanked ? `第 ${rankIdx + 1} 名` : '-';

        const row = document.createElement('div');
        row.className = isRanked 
          ? "p-2.5 rounded-xl border-2 border-slate-900 bg-emerald-50 flex items-center justify-between cursor-pointer lego-btn transition-all shadow-sm"
          : "p-2.5 rounded-xl border-2 border-slate-800 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer lego-btn transition-all";

        row.onclick = () => toggleRankItem(q.id, opt.key, 2);
        row.innerHTML = `
          <div class="flex items-start space-x-2 text-[11px] text-slate-800 leading-snug">
            <span class="font-pixel text-[10px] text-lego-blue shrink-0 mt-0.5">${opt.key}.</span>
            <span>${cleanText}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ml-2 border ${isRanked ? 'bg-lego-green text-white border-slate-900 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-300'}">
            ${rankNum}
          </span>
        `;
        container.appendChild(row);
      });

      const progText = document.getElementById('sort-progress-text');
      if (progText) progText.innerText = `目前已選擇：${currentOrder.length} / 2 名 (依序選前2名)`;
    }

    function renderSingleTypeQuestion(q, container) {
      const selectedKey = userQuizAnswers[q.id];

      q.options.forEach(opt => {
        const cleanText = cleanOptionText(opt.rawText);
        const isSelected = (selectedKey === opt.key);

        const row = document.createElement('div');
        row.className = isSelected 
          ? "p-2.5 rounded-xl border-2 border-slate-900 bg-emerald-50 flex items-center justify-between cursor-pointer lego-btn transition-all font-black shadow-sm"
          : "p-2.5 rounded-xl border-2 border-slate-800 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer lego-btn transition-all font-bold text-slate-800";

        row.onclick = () => {
          userQuizAnswers[q.id] = opt.key;
          renderQuizQuestion();
        };

        row.innerHTML = `
          <div class="flex items-start space-x-2 text-[11px] leading-snug">
            <span class="font-pixel text-[10px] ${isSelected ? 'text-lego-red' : 'text-slate-400'} shrink-0 mt-0.5">${opt.key}.</span>
            <span>${cleanText}</span>
          </div>
          <span class="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[10px] shrink-0 ml-2 ${isSelected ? 'bg-lego-green text-white shadow' : 'bg-slate-100 text-transparent'}">${isSelected ? '✔' : ''}</span>
        `;
        container.appendChild(row);
      });
    }

    function toggleRankItem(qId, key, maxCount) {
      if (!userQuizAnswers[qId]) userQuizAnswers[qId] = [];
      const order = userQuizAnswers[qId];
      const idx = order.indexOf(key);
      if (idx !== -1) {
        order.splice(idx, 1);
      } else if (order.length < maxCount) {
        order.push(key);
      }
      renderQuizQuestion();
    }

    function resetCurrentQuestionSort() {
      const q = officialQuestions[currentQuizIndex];
      if (q) {
        if (q.type === 'sort') {
          userQuizAnswers[q.id] = q.options.map(o => o.key);
        } else {
          userQuizAnswers[q.id] = [];
        }
        renderQuizQuestion();
        showCustomToast('已重設本題選項順序！', '↺');
      }
    }

    function navigateQuiz(step) {
      const nextIdx = currentQuizIndex + step;
      if (nextIdx < 0) return;
      if (nextIdx >= 6) {
        showCustomToast('🎉 6 題適性測驗作答完畢！已為你精算推薦最佳起步路線。', '🧭');
        calculateAndApplyResults();
        const recCard = document.getElementById('card-recommendation');
        if (recCard) recCard.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      currentQuizIndex = nextIdx;
      renderQuizQuestion();
    }

    function autoFillRemainingQuestions() {
      officialQuestions.forEach(q => {
        if (q.type === 'sort') {
          userQuizAnswers[q.id] = q.options.map(o => o.key);
        } else if (q.type === 'top2') {
          userQuizAnswers[q.id] = [q.options[0].key, q.options[1].key];
        } else if (q.type === 'single') {
          userQuizAnswers[q.id] = q.options[0].key;
        }
      });
      showCustomToast('⚡ [PM 模式] 已快速預填 6 題官方題組！', '✅');
      renderQuizQuestion();
    }

    function calculateAndApplyResults() {
      const devScores = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0 };
      const q1Rank = userQuizAnswers[1] || [];
      if (q1Rank[0]) devScores[q1Rank[0]] += 3;
      if (q1Rank[1]) devScores[q1Rank[1]] += 2;
      if (q1Rank[2]) devScores[q1Rank[2]] += 1;

      const q2Rank = userQuizAnswers[2] || [];
      if (q2Rank[0]) devScores[q2Rank[0]] += 3;
      if (q2Rank[1]) devScores[q2Rank[1]] += 2;

      const q3Pick = userQuizAnswers[3];
      if (q3Pick && devScores[q3Pick] !== undefined) devScores[q3Pick] += 2;

      let topDev = 'A';
      let maxDevScore = -1;
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(key => {
        if (devScores[key] > maxDevScore) {
          maxDevScore = devScores[key];
          topDev = key;
        } else if (devScores[key] === maxDevScore) {
          const rankA = q2Rank.indexOf(topDev);
          const rankB = q2Rank.indexOf(key);
          const tieA = rankA !== -1 ? rankA : 99;
          const tieB = rankB !== -1 ? rankB : 99;
          if (tieB < tieA) topDev = key;
        }
      });
      currentSelectedDevCode = topDev;

      const salScores = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 };
      const q4Rank = userQuizAnswers[4] || [];
      if (q4Rank[0]) salScores[q4Rank[0]] += 3;
      if (q4Rank[1]) salScores[q4Rank[1]] += 2;
      if (q4Rank[2]) salScores[q4Rank[2]] += 1;

      const q5Rank = userQuizAnswers[5] || [];
      if (q5Rank[0]) salScores[q5Rank[0]] += 3;
      if (q5Rank[1]) salScores[q5Rank[1]] += 2;

      const q6Pick = userQuizAnswers[6];
      if (q6Pick && salScores[q6Pick] !== undefined) salScores[q6Pick] += 2;

      let topSal = 'E';
      let maxSalScore = -1;
      ['A', 'B', 'C', 'D', 'E'].forEach(key => {
        if (salScores[key] > maxSalScore) {
          maxSalScore = salScores[key];
          topSal = key;
        } else if (salScores[key] === maxSalScore) {
          const rankA = q5Rank.indexOf(topSal);
          const rankB = q5Rank.indexOf(key);
          const tieA = rankA !== -1 ? rankA : 99;
          const tieB = rankB !== -1 ? rankB : 99;
          if (tieB < tieA) topSal = key;
        }
      });
      currentSelectedSalCode = topSal;

      renderSelectedRouteRecommendations();
    }

    function renderSelectedRouteRecommendations() {
      const devObj = devStyleDefinitions[currentSelectedDevCode];
      document.getElementById('rec-dev-dimension').innerText = devObj.dimension;
      document.getElementById('rec-dev-icon').innerText = devObj.icon;
      document.getElementById('rec-dev-title').innerText = devObj.name;
      document.getElementById('rec-dev-desc').innerText = devObj.desc;

      const salObj = salStyleDefinitions[currentSelectedSalCode];
      document.getElementById('rec-sal-dimension').innerText = salObj.dimension;
      document.getElementById('rec-sal-icon').innerText = salObj.icon;
      document.getElementById('rec-sal-title').innerText = salObj.name;
      document.getElementById('rec-sal-desc').innerText = salObj.desc;
    }

    function openChangeRouteModal(type) {
      const title = document.getElementById('route-modal-title');
      const container = document.getElementById('route-options-list');
      container.innerHTML = '';

      const isDev = type === 'dev';
      const defMap = isDev ? devStyleDefinitions : salStyleDefinitions;
      const keys = Object.keys(defMap);

      title.innerText = isDev 
        ? "更換開發起步路線（共 6 種業務風格）" 
        : "更換銷售起步路線（共 5 種業務風格）";

      keys.forEach(k => {
        const item = defMap[k];
        const isSelected = (isDev ? currentSelectedDevCode : currentSelectedSalCode) === k;
        const btn = document.createElement('button');
        btn.className = `w-full text-left p-2.5 rounded-xl border-2 border-slate-900 ${isSelected ? 'bg-lego-yellow' : 'bg-white hover:bg-slate-50'} lego-btn flex items-center justify-between gap-2`;
        btn.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-slate-900">${item.icon} ${item.name}</span>
              <span class="text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">${item.dimension}</span>
            </div>
            <div class="text-[10px] text-slate-600 mt-1 leading-snug line-clamp-2">${item.desc}</div>
          </div>
          <span class="text-xs font-bold text-slate-700 shrink-0 ml-1">${isSelected ? '✔ 已選' : '選擇'}</span>
        `;
        btn.onclick = () => selectCustomRoute(type, k);
        container.appendChild(btn);
      });

      openModal('modal-change-route');
    }

    function selectCustomRoute(type, code) {
      const definitions = type === 'dev' ? devStyleDefinitions : type === 'sal' ? salStyleDefinitions : null;
      if (!definitions || !Object.prototype.hasOwnProperty.call(definitions, code)) return;
      if (type === 'dev') {
        currentSelectedDevCode = code;
      } else {
        currentSelectedSalCode = code;
      }
      renderSelectedRouteRecommendations();
      closeModal('modal-change-route');
      showCustomToast(`已成功更換路線！`, '🔄');
    }

    /* ========================================================= */
    /* 視窗載入與初始化掛載                                      */
    /* ========================================================= */
    window.addEventListener('DOMContentLoaded', () => {
      renderQuizQuestion();
      switchRoute('dev');
      renderHandbookUI();
      render3x3CabinetGrid();
      renderWarehouseUI();
      updateCurrencyUI();
      switchSchoolDomain('tax');
      renderRPSetup();
      // 確保一開始就初始化地圖預設建築「大器四方」並立即渲染「社區摘要」
      selectMapBuilding('b1');
    });
