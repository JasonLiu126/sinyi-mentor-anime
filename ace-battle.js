// Normal-version IP turn battle. HP/PP, priority, speed, type advantage and substitutions.
const duelTypes={insight:{name:'洞察',icon:'🔎',color:'#4094a6',beats:'adapt'},adapt:{name:'應變',icon:'⚡',color:'#c99e37',beats:'expression'},expression:{name:'表達',icon:'🎵',color:'#b55e9b',beats:'insight'},normal:{name:'一般',icon:'✦',color:'#7d8c7e'}};
const duelMoves={
  dart:{name:'線索飛鏢',type:'insight',power:26,accuracy:100,pp:15,kind:'attack',desc:'穩定的洞察攻擊。'},
  beam:{name:'真相光束',type:'insight',power:46,accuracy:90,pp:5,kind:'attack',desc:'集中線索，發射強力光束。'},
  sound:{name:'節奏衝擊',type:'expression',power:30,accuracy:100,pp:15,kind:'attack',desc:'以音浪衝擊對手。'},
  rap:{name:'嘻哈爆發',type:'expression',power:52,accuracy:85,pp:5,kind:'attack',desc:'高威力，有落空風險。'},
  shadow:{name:'影分突襲',type:'adapt',power:24,accuracy:100,pp:15,priority:1,kind:'attack',desc:'優先出招，搶先突襲。'},
  slash:{name:'忍法疾風',type:'adapt',power:44,accuracy:95,pp:5,kind:'attack',desc:'迅速揮出一道疾風。'},
  punch:{name:'肌力重拳',type:'adapt',power:30,accuracy:100,pp:15,kind:'attack',desc:'穩定的正面重拳。'},
  smash:{name:'黃金爆肌拳',type:'adapt',power:55,accuracy:85,pp:5,kind:'attack',desc:'全力一擊，威力最高。'},
  chord:{name:'電音和弦',type:'expression',power:30,accuracy:100,pp:15,kind:'attack',desc:'和弦化為衝擊波。'},
  concert:{name:'搖滾終章',type:'expression',power:50,accuracy:90,pp:5,kind:'attack',desc:'壓軸音浪震撼全場。'},
  spin:{name:'旋轉踢擊',type:'insight',power:26,accuracy:100,pp:15,priority:1,kind:'attack',desc:'輕盈旋轉，優先出招。'},
  tornado:{name:'芭蕾旋風',type:'insight',power:46,accuracy:95,pp:5,kind:'attack',desc:'旋轉形成強力風壓。'},
  focus:{name:'集中氣勢',type:'normal',pp:5,kind:'focus',desc:'下次攻擊傷害 ×1.4，使用後消耗。'},
  guard:{name:'防護架勢',type:'normal',pp:5,priority:2,kind:'guard',desc:'優先架盾，下一次受到傷害減半。'},
  heal:{name:'重整呼吸',type:'normal',pp:3,kind:'heal',desc:'恢復自身最大 HP 的 30%。'},
  slow:{name:'節奏干擾',type:'expression',pp:5,kind:'slow',desc:'對手速度降低 30%，持續本回合及後續兩回合。'},
  basic:{name:'基本撞擊',type:'normal',power:20,accuracy:100,pp:null,kind:'attack',desc:'不限次數，PP 耗盡也能出招。'}
};
const duelCast={
  tony_detective:{type:'insight',hp:94,atk:23,def:20,speed:30,moves:['dart','focus','guard','beam']},
  fig_hiphop:{type:'expression',hp:96,atk:27,def:18,speed:28,moves:['sound','slow','heal','rap']},
  tony_ninja:{type:'adapt',hp:88,atk:25,def:17,speed:40,moves:['shadow','guard','focus','slash']},
  fig_muscle:{type:'adapt',hp:114,atk:29,def:26,speed:18,moves:['punch','focus','guard','smash']},
  tony_rock:{type:'expression',hp:98,atk:28,def:20,speed:26,moves:['chord','focus','heal','concert']},
  fig_ballet:{type:'insight',hp:90,atk:24,def:18,speed:37,moves:['spin','guard','heal','tornado']}
};
const duelOpponents={
  balanced:{name:'均衡挑戰隊',team:['tony_detective','fig_hiphop','tony_ninja'],desc:'依屬性選招，HP 較低時會恢復。'},
  power:{name:'爆發重擊隊',team:['fig_muscle','tony_rock','fig_hiphop'],desc:'喜歡高威力招式，正面進攻。'},
  tactical:{name:'靈巧戰術隊',team:['tony_ninja','fig_ballet','tony_detective'],desc:'會使用防護、集中與速度優勢。'}
};
let duelDraft=['tony_detective','fig_hiphop','tony_ninja'];
let duelOpponent='balanced',duelGame=null,duelEpoch=0,duelShowHelp=false;
let duelSoundEnabled=false,duelAudio=null,duelReturnFocus=null;
const duelRecord={played:0,wins:0};
if(globalThis.hideChenCharacters){const replacements={fig_hiphop:'tony_clown',fig_muscle:'tony_boxer',fig_ballet:'tony_lion'};for(const [from,to] of Object.entries(replacements))duelCast[to]={...duelCast[from],moves:[...duelCast[from].moves]};for(const opponent of Object.values(duelOpponents))opponent.team=opponent.team.map(id=>replacements[id]||id);duelDraft=['tony_detective','tony_rock','tony_ninja'];}
function duelOwned(id){return isFigurineVisible(id)?userWarehouse.find(item=>item.id===id):undefined;}
function duelName(id){return executiveFigurineDatabase[id].name;}
function duelTypeMultiplier(type,target){if(type==='normal')return 1;if(duelTypes[type].beats===target)return 1.5;if(duelTypes[target].beats===type)return .75;return 1;}
function duelFighter(id,enemy=false){
  const card=duelCast[id],item=duelOwned(id),stars=enemy?3:Math.max(1,Math.min(5,item?.stars||1)),maxHp=card.hp+(stars-1)*10;
  return {id,stars,outfit:enemy?3:item?.equippedStars||stars,type:card.type,maxHp,hp:maxHp,atk:card.atk+(stars-1)*2,def:card.def+(stars-1)*2,speed:card.speed+stars-1,moves:[...card.moves],pp:Object.fromEntries(card.moves.map(k=>[k,duelMoves[k].pp])),shield:false,focus:false,slow:0};
}
function duelActive(side){return duelGame?.[side].team[duelGame[side].active];}
function duelAlive(side){return side.team.some(actor=>actor.hp>0);}
function duelAvailable(actor,key){return actor&&actor.hp>0&&(key==='basic'||actor.moves.includes(key)&&actor.pp[key]>0);}
function duelDamage(actor,target,move,random=Math.random){
  if(move.kind!=='attack')return null;
  if(random()*100>=(move.accuracy??100))return {damage:0,miss:true,critical:false,multiplier:1};
  const multiplier=duelTypeMultiplier(move.type,target.type),critical=random()<.08;
  const raw=(move.power+actor.atk*.55-target.def*.35)*multiplier*(actor.focus?1.4:1)*(target.shield ? .5 : 1)*(critical?1.35:1)*(.9+random()*.2);
  return {damage:Math.max(4,Math.round(raw)),miss:false,critical,multiplier};
}
function duelEnemyMove(){
  const actor=duelActive('enemy'),target=duelActive('player'),keys=actor.moves.filter(key=>duelAvailable(actor,key));
  if(duelGame.opponent!=='power'&&actor.hp<actor.maxHp*.36&&keys.includes('heal'))return 'heal';
  if(duelGame.opponent==='tactical'){
    if(target.focus&&!actor.shield&&keys.includes('guard'))return 'guard';
    if(!actor.focus&&keys.includes('focus')&&actor.hp>actor.maxHp*.65&&duelGame.turn%3===1)return 'focus';
  }
  const attacks=keys.filter(key=>duelMoves[key].kind==='attack');if(!attacks.length)return 'basic';
  const value=key=>duelMoves[key].power*duelTypeMultiplier(duelMoves[key].type,target.type)*duelMoves[key].accuracy/100+(duelMoves[key].priority||0)*4;
  return attacks.sort((a,b)=>value(b)-value(a))[0];
}
function duelChoose(id){
  if(duelGame||!duelCast[id]||!duelOwned(id))return false;
  if(duelDraft.includes(id))duelDraft=duelDraft.filter(value=>value!==id);else if(duelDraft.length<3)duelDraft.push(id);else {document.getElementById('duel-draft-tip').textContent='先取消一位已選夥伴，再加入新角色。';return false;}
  duelRender(false);return true;
}
function duelChooseOpponent(id){if(duelGame||!duelOpponents[id])return false;duelOpponent=id;duelRender(false);return true;}
function duelStart(){
  if(duelGame||duelDraft.length!==3||new Set(duelDraft).size!==3||!duelDraft.every(id=>duelCast[id]&&duelOwned(id))||!duelOpponents[duelOpponent])return false;
  ++duelEpoch;duelShowHelp=false;
  duelGame={phase:'command',turn:1,opponent:duelOpponent,player:{team:duelDraft.map(id=>duelFighter(id)),active:0},enemy:{team:duelOpponents[duelOpponent].team.map(id=>duelFighter(id,true)),active:0},fx:null,log:[],rewardPaid:false,message:'對手派出了 '+duelName(duelOpponents[duelOpponent].team[0])+'！你要怎麼做？'};
  duelRender();return true;
}
function duelSetMenu(menu){if(!duelGame||!['command','moves','switch'].includes(duelGame.phase)||!['command','moves','switch'].includes(menu))return false;duelGame.phase=menu;duelShowHelp=false;duelRender();return true;}
function duelToggleHelp(){if(!duelGame||['busy','result'].includes(duelGame.phase))return;duelShowHelp=!duelShowHelp;duelRender(false);}
function duelSetMessage(message){duelGame.message=message;duelGame.log.push(message);if(duelGame.log.length>24)duelGame.log.shift();}
function duelUse(side,key){
  const actor=duelActive(side),other=side==='player'?'enemy':'player',target=duelActive(other),move=duelMoves[key];
  if(!move||!duelAvailable(actor,key)||target.hp<=0)return false;
  if(key!=='basic')actor.pp[key]--;
  let text=duelName(actor.id)+' 使用了「'+move.name+'」！';const before=target.hp;
  if(move.kind==='attack'){
    const result=duelDamage(actor,target,move);actor.focus=false;
    if(result.miss){text+=' 但是沒有命中。';duelGame.fx={kind:'miss',source:side,target:other,type:move.type};}
    else {target.hp=Math.max(0,target.hp-result.damage);target.shield=false;text+=' '+(result.critical?'擊中要害！':'')+(result.multiplier>1?'效果絕佳！':result.multiplier<1?'效果不太好。':'')+' 造成 '+(before-target.hp)+' 傷害。';duelGame.fx={kind:'hit',source:side,target:other,type:move.type,damage:before-target.hp,before};duelBeep(result.multiplier>1?650:240);}
  }else if(move.kind==='heal'){
    const old=actor.hp;actor.hp=Math.min(actor.maxHp,actor.hp+Math.round(actor.maxHp*.3));text+=' 恢復 '+(actor.hp-old)+' HP。';duelGame.fx={kind:'heal',source:side,target:side,before:old};
  }else if(move.kind==='guard'){actor.shield=true;text+=' 架起防護，下一次受傷減半。';duelGame.fx={kind:'guard',source:side,target:side};}
  else if(move.kind==='focus'){actor.focus=true;text+=' 集中氣勢，下一次攻擊增強。';duelGame.fx={kind:'focus',source:side,target:side};}
  else if(move.kind==='slow'){target.slow=3;text+=' 對手的速度降低了。';duelGame.fx={kind:'slow',source:side,target:other};}
  duelSetMessage(text);duelRender(false);return true;
}
function duelQueue(actions){
  const epoch=duelEpoch;duelGame.phase='busy';duelGame.fx=null;duelRender(false);let index=0;
  const step=()=>{
    if(epoch!==duelEpoch||!duelGame||duelGame.phase!=='busy')return;
    if(index>=actions.length){duelEndTurn();return;}
    const action=actions[index++];if(duelActive(action.side).hp<=0||duelActive(action.side==='player'?'enemy':'player').hp<=0){duelEndTurn();return;}
    duelUse(action.side,action.key);setTimeout(step,1250);
  };setTimeout(step,220);
}
function duelPlay(key){
  if(!duelGame||!['moves','command'].includes(duelGame.phase)||!duelAvailable(duelActive('player'),key))return false;
  const enemyKey=duelEnemyMove(),p=duelActive('player'),e=duelActive('enemy');
  const priority=(actor,move)=>(duelMoves[move].priority||0)*1000+actor.speed*(actor.slow ? .7 : 1);
  const actions=[{side:'player',key},{side:'enemy',key:enemyKey}];
  if(priority(e,enemyKey)>priority(p,key)||priority(e,enemyKey)===priority(p,key)&&Math.random()<.5)actions.reverse();
  duelQueue(actions);return true;
}
function duelEndTurn(){
  const game=duelGame;if(!game)return;game.fx=null;
  for(const side of [game.player,game.enemy])for(const actor of side.team)if(actor.slow>0)actor.slow--;
  if(!duelAlive(game.player)){duelFinish(false);return;}if(!duelAlive(game.enemy)){duelFinish(true);return;}
  let text='';if(duelActive('enemy').hp<=0){const old=duelActive('enemy');game.enemy.active=game.enemy.team.findIndex(actor=>actor.hp>0);text=duelName(old.id)+' 倒下了！對手換上 '+duelName(duelActive('enemy').id)+'。';}
  game.turn++;
  if(duelActive('player').hp<=0){game.phase='forced';duelSetMessage(duelName(duelActive('player').id)+' 倒下了！請派出下一位夥伴。');}
  else {game.phase='command';duelSetMessage(text||duelName(duelActive('player').id)+'，接下來怎麼做？');}
  duelRender();
}
function duelSwitch(index){
  const game=duelGame;if(!game||!['switch','forced'].includes(game.phase)||!Number.isInteger(index)||index===game.player.active||!game.player.team[index]||game.player.team[index].hp<=0)return false;
  const forced=game.phase==='forced';game.player.active=index;duelSetMessage('上場吧，'+duelName(duelActive('player').id)+'！');
  if(forced){game.phase='command';duelRender();}else duelQueue([{side:'enemy',key:duelEnemyMove()}]);return true;
}
function duelFinish(win){
  const game=duelGame;if(!game||game.rewardPaid||duelAlive(win?game.enemy:game.player))return false;game.phase='result';game.fx=null;game.rewardPaid=true;game.win=win;game.reward=win?180:60;
  duelRecord.played++;if(win)duelRecord.wins++;userCoins+=game.reward;updateCurrencyUI();
  duelSetMessage(win?'對手的三位 IP 都倒下了！你贏得本場對戰！':'隊伍已無可出戰的夥伴。換個組合，再來挑戰！');duelRender();return true;
}
function duelAgain(){if(!duelGame||duelGame.phase!=='result')return false;++duelEpoch;duelGame=null;duelShowHelp=false;duelRender();return true;}
function duelBeep(frequency){if(!duelSoundEnabled||!duelAudio)return;try{const osc=duelAudio.createOscillator(),gain=duelAudio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(frequency,duelAudio.currentTime);gain.gain.setValueAtTime(.06,duelAudio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,duelAudio.currentTime+.14);osc.connect(gain);gain.connect(duelAudio.destination);osc.start();osc.stop(duelAudio.currentTime+.15);}catch{}}
function duelToggleSound(){try{if(!duelAudio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;duelAudio=new Audio();}duelAudio.resume();duelSoundEnabled=!duelSoundEnabled;duelBeep(500);document.getElementById('duel-sound').textContent=duelSoundEnabled?'音效：開':'音效：關';document.getElementById('duel-sound').setAttribute('aria-pressed',String(duelSoundEnabled));}catch{}}
function duelArt(actor){return getFigurineAvatarSVG(actor.id,'md',actor.outfit);}
function duelStatus(actor){return [actor.shield?'🛡 防護':'',actor.focus?'✦ 集中':'',actor.slow?'↓ 速度':''].filter(Boolean).join(' · ');}
function duelHpHTML(actor,side,party){
  const fx=duelGame.fx,pct=actor.hp/actor.maxHp*100,old=fx?.target===side&&fx.before!==undefined?fx.before/actor.maxHp*100:pct;
  return `<div class="db-hud db-hud-${side}"><div><b>${duelName(actor.id)}</b><span>${'★'.repeat(actor.stars)}</span></div><small>${duelTypes[actor.type].icon} ${duelTypes[actor.type].name}<em>${duelStatus(actor)}</em></small><div class="db-hp"><i>HP</i><span><strong style="width:${pct}%;--old-hp:${old}%;background:${pct<25?'#db6a57':pct<50?'#ddbc57':'#59a76a'}"></strong></span></div><footer><span>${party.team.map((a,i)=>`<i class="${a.hp<=0?'is-out':i===party.active?'is-active':''}"></i>`).join('')}</span><b>${actor.hp} / ${actor.maxHp}</b></footer></div>`;
}
function duelSetupHTML(){
  duelDraft=duelDraft.filter(id=>duelCast[id]&&duelOwned(id));
  return `<div class="db-intro"><small>IP BATTLE · 三人隊伍 / 單人對戰</small><h3>這次，真的出招吧！</h3><p>選三位夥伴，用招式削減對方 HP。速度決定先後，屬性影響傷害，也能換人、架盾或恢復。</p><span>本頁戰績 ${duelRecord.wins} 勝 / ${duelRecord.played} 場</span></div><div class="db-label"><b>選三位 IP，第一位先發</b><span>${duelDraft.length} / 3</span></div><p id="duel-draft-tip" class="db-note">點已選夥伴取消後可重新排序；升星會提升 HP 與戰鬥數值。</p><div class="db-cast">${Object.entries(duelCast).filter(([id])=>isFigurineVisible(id)).map(([id,card])=>{const owned=duelOwned(id);return `<button class="db-card ${duelDraft.includes(id)?'is-selected':''}" onclick="duelChoose('${id}')" aria-label="選擇${duelName(id)}" aria-pressed="${duelDraft.includes(id)}" ${owned?'':'disabled'}><small class="db-order">${duelDraft.includes(id)?(duelDraft.indexOf(id)===0?'① 先發':'隊伍 '+(duelDraft.indexOf(id)+1)):owned?'＋ 加入':'尚未收藏'}</small><span class="db-card-art">${getFigurineAvatarSVG(id,'md')}</span><b>${duelName(id)}</b><small>${duelTypes[card.type].icon} ${duelTypes[card.type].name} · ${owned?'★'.repeat(owned.stars):'到測試後台加入'}</small><em>${card.moves.map(key=>duelMoves[key].name).join(' / ')}</em></button>`;}).join('')}</div><div class="db-label"><b>選擇對手</b></div><div class="db-opponents">${Object.entries(duelOpponents).map(([id,item])=>`<button class="${duelOpponent===id?'is-selected':''}" onclick="duelChooseOpponent('${id}')" aria-pressed="${duelOpponent===id}"><b>${item.name}</b><small>${item.desc}</small></button>`).join('')}</div><details class="db-rules"><summary>屬性、換人與勝負規則</summary><p>洞察剋應變 → 應變剋表達 → 表達剋洞察。剋制 ×1.5，反向 ×0.75，同系 ×1。每回合雙方選一招，優先招式先出，否則看速度。同速隨機決定先後。</p><p>招式有 PP 與命中率；傷害有 ±10% 變化、8% 要害（×1.35）。基本撞擊不限次數。主動換人會讓對手出招；倒下後換人不額外受攻擊。對手固定三星，我方採開局時星等與造型。</p><p>一方三位都倒下即結束，勝利 180／落敗 60 遊戲幣自動入帳，不扣 IP、碎片或入場費。本機原型尚未做經濟平衡；關閉視窗保留本局，重整會重設對局與戰績。</p></details><button class="db-primary" onclick="duelStart()" ${duelDraft.length===3?'':'disabled'}>進入對戰擂台 →</button>`;
}
function duelArenaHTML(){
  const p=duelActive('player'),e=duelActive('enemy'),fx=duelGame.fx;
  return `<div class="db-arena ${fx?'db-fx-'+fx.kind:''}" style="--fx-color:${duelTypes[fx?.type||'normal'].color}">${duelHpHTML(e,'enemy',duelGame.enemy)}${duelHpHTML(p,'player',duelGame.player)}<div class="db-platform db-platform-enemy"></div><div class="db-platform db-platform-player"></div><div class="db-fighter db-fighter-enemy ${e.hp<=0?'is-fainted':''} ${fx?.source==='enemy'?'is-attacking':''} ${fx?.target==='enemy'?'is-target':''}">${duelArt(e)}</div><div class="db-fighter db-fighter-player ${p.hp<=0?'is-fainted':''} ${fx?.source==='player'?'is-attacking':''} ${fx?.target==='player'?'is-target':''}">${duelArt(p)}</div>${fx?`<span class="db-impact impact-${fx.target}">${fx.kind==='hit'?'−'+fx.damage:fx.kind==='heal'?'＋HP':fx.kind==='guard'?'🛡':fx.kind==='focus'?'✦':fx.kind==='miss'?'MISS':'速度↓'}</span>`:''}<div class="db-turn">TURN ${duelGame.turn} · ${duelOpponents[duelGame.opponent].name}</div></div>`;
}
function duelCommandsHTML(){
  const game=duelGame,actor=duelActive('player');
  if(game.phase==='busy')return '<div class="db-wait">招式交鋒中…</div>';
  if(game.phase==='result')return `<div class="db-result"><b>${game.win?'🏆 對戰勝利！':'隊伍需要休息了'}</b><p>＋${game.reward} 遊戲幣已入帳 · 本頁 ${duelRecord.wins} 勝 / ${duelRecord.played} 場</p><button class="db-primary" onclick="duelAgain()">重新組隊，再戰一場</button></div>`;
  if(game.phase==='switch'||game.phase==='forced')return `<div class="db-label"><b>${game.phase==='forced'?'派出下一位夥伴':'更換上場夥伴'}</b><span>${game.phase==='forced'?'免費換人':'會消耗本回合'}</span></div><div class="db-party">${game.player.team.map((a,i)=>`<button onclick="duelSwitch(${i})" ${a.hp<=0||i===game.player.active?'disabled':''}><span>${duelArt(a)}</span><div><b>${duelName(a.id)}</b><small>${a.hp<=0?'已倒下':i===game.player.active?'目前上場':duelTypes[a.type].name+' · HP '+a.hp+'/'+a.maxHp}</small></div></button>`).join('')}</div>${game.phase==='switch'?'<button class="db-back" onclick="duelSetMenu(\'command\')">← 返回指令</button>':''}`;
  if(game.phase==='moves')return `<div class="db-moves">${actor.moves.map(key=>{const move=duelMoves[key];return `<button style="--move-color:${duelTypes[move.type].color}" onclick="duelPlay('${key}')" ${actor.pp[key]<=0?'disabled':''}><strong>${move.name}</strong><span>${duelTypes[move.type].icon} ${duelTypes[move.type].name} · PP ${actor.pp[key]}/${move.pp}</span><small>${move.kind==='attack'?'威力 '+move.power+' · 命中 '+move.accuracy+'%'+(move.priority?' · 先制':''):move.desc}</small></button>`;}).join('')}</div><div class="db-move-footer"><button onclick="duelSetMenu('command')">← 返回</button><button onclick="duelPlay('basic')">基本撞擊 · 無限 PP</button></div>`;
  return `<div class="db-main-menu"><button onclick="duelSetMenu('moves')"><span>⚔</span>戰鬥</button><button onclick="duelSetMenu('switch')"><span>⇄</span>夥伴</button><button onclick="duelToggleHelp()"><span>◎</span>屬性</button><button onclick="closeAceBattle()"><span>↩</span>離開</button></div>`;
}
function duelRender(resetScroll=true){
  const body=document.getElementById('duel-body');if(!body)return;const focusCommand=document.activeElement?.getAttribute?.('onclick');
  body.innerHTML=!duelGame?duelSetupHTML():duelArenaHTML()+`<div class="db-dialogue" role="status" aria-live="polite">${duelGame.message}</div>`+duelCommandsHTML()+(duelShowHelp?'<div class="db-help">🔎 洞察 → ⚡ 應變 → 🎵 表達 → 🔎 洞察<br>順向剋制 ×1.5，逆向 ×0.75。先制優先於速度。防護減半下一次傷害，集中強化下一次攻擊。<br>傷害含命中、要害與小幅變動；PP 耗盡可用基本撞擊。</div>':'')+(duelGame.log.length?`<details class="db-log"><summary>最近的戰鬥紀錄</summary>${duelGame.log.slice(-8).map(line=>'<p>'+line+'</p>').join('')}</details>`:'');
  if(resetScroll)document.getElementById('duel-panel').scrollTop=0;else if(focusCommand)[...body.querySelectorAll('[onclick]')].find(node=>node.getAttribute('onclick')===focusCommand)?.focus({preventScroll:true});
}
function openAceBattle(){duelReturnFocus=document.activeElement;duelRender();document.getElementById('ace-modal').classList.remove('hidden');document.getElementById('duel-close').focus();}
function closeAceBattle(){document.getElementById('ace-modal').classList.add('hidden');duelReturnFocus?.focus?.();}
const duelCSS=`
#ace-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:12px;background:#102124e8}#ace-modal.hidden{display:none}.db-panel{width:100%;max-width:480px;max-height:92vh;overflow-y:auto;border:3px solid #12362c;border-radius:18px;background:#f1f1df;color:#274536;box-shadow:5px 6px #0d211c}.db-heading{position:sticky;top:0;z-index:10;padding:12px 13px;display:flex;align-items:center;gap:8px;background:#193e34;color:#f6df9b}.db-heading>div{flex:1}.db-heading small{font-size:7px;letter-spacing:1px;color:#b4c7ad}.db-heading h2{font-size:18px;font-weight:900}.db-heading button{font-size:10px;border:1px solid #ffffff40;padding:4px 7px;border-radius:8px}.db-heading #duel-close{font-size:18px;border:0}.db-body{padding:11px}.db-intro{background:#234f3b;color:#fff1bf;padding:16px;border-radius:12px}.db-intro h3{font-size:20px;font-weight:900;margin:8px 0}.db-intro small{font-size:8px;letter-spacing:1px}.db-intro p{font-size:11px;line-height:1.9;color:#d6e3c7}.db-intro>span{display:block;font-size:9px;margin-top:10px;color:#e8ce8b}.db-label{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px;font-weight:900;margin:13px 0 8px}.db-label span,.db-note{font-size:9px;font-weight:400;color:#849078}.db-note{line-height:1.8;margin:5px 0 8px}.db-cast{display:grid;grid-template-columns:1fr 1fr;gap:7px}.db-card{position:relative;display:flex;flex-direction:column;align-items:center;min-width:0;border:2px solid #c9d4b9;background:#fffff7;border-radius:12px;padding:24px 7px 9px;gap:4px}.db-card.is-selected,.db-opponents .is-selected{background:#e7f2d7;border-color:#2c8753;box-shadow:0 0 0 1px #2c875322}.db-card-art{height:82px;width:100%;display:flex;justify-content:center}.db-card-art>svg,.db-card-art>div{width:100%;height:100%;flex-shrink:1}.db-card b{font-size:12px}.db-card small{font-size:9px;color:#7d8e70}.db-card .db-order{position:absolute;top:6px;right:7px;font-size:8px}.db-card em{font-size:8px;font-style:normal;line-height:1.8;color:#7c8c72;text-align:center}.db-opponents{display:grid;gap:6px}.db-opponents button{padding:9px 11px;border:2px solid #cdd7be;border-radius:10px;text-align:left;background:white}.db-opponents b{font-size:11px}.db-opponents small{font-size:9px;display:block;color:#87927d;margin-top:4px}.db-rules,.db-help,.db-log{font-size:10px;line-height:1.9;color:#708168;border:1px solid #cbd6bd;border-radius:9px;padding:9px;margin-top:10px;background:#fcfdf4}.db-rules summary,.db-log summary{font-weight:900;cursor:pointer}.db-rules p,.db-log p{margin-top:7px}.db-primary{width:100%;background:#13794d;color:#fff2c1;border:2px solid #1e5036;border-radius:10px;padding:12px 7px;font-size:12px;font-weight:900;margin-top:12px;box-shadow:0 3px #1e5036}.db-body button:disabled{opacity:.4;cursor:default}
.db-arena{height:300px;position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(#c2e3e6 0%,#e2eee0 52%,#b8cf91 53%,#d4d7a4 100%);border:2px solid #728e68;border-radius:12px}.db-arena::before{content:'';position:absolute;left:-10%;right:-10%;top:115px;height:85px;border-radius:50%;background:#8fba9666;box-shadow:75px -15px #a1c6a480}.db-turn{position:absolute;top:0;right:0;font-size:7px;background:#264d3bcb;color:#edebca;padding:3px 6px;border-radius:0 0 0 8px;z-index:4}.db-platform{position:absolute;border-radius:50%;border:3px solid #73985f66;background:#9ebc76;box-shadow:0 5px #78975e44}.db-platform-enemy{right:5px;top:155px;width:133px;height:30px}.db-platform-player{left:-9px;bottom:-8px;width:176px;height:47px;background:#91b36e}.db-hud{position:absolute;width:55%;padding:8px 9px 6px;border:2px solid #4f7454;background:#ffffe9;box-shadow:3px 3px #4c74505c;z-index:5}.db-hud-enemy{top:21px;left:8px;border-radius:0 10px 0 10px}.db-hud-player{bottom:13px;right:7px;border-radius:10px 0 10px 0}.db-hud>div:first-child{display:flex;justify-content:space-between;gap:3px;align-items:center}.db-hud b{font-size:11px;font-weight:900}.db-hud>div>span{font-size:8px;color:#b58e2d}.db-hud>small{display:flex;align-items:center;justify-content:space-between;font-size:8px;color:#758069;margin-top:3px}.db-hud em{font-size:7px;font-style:normal}.db-hp{display:flex;align-items:center;background:#4a6251;padding:3px;border-radius:10px;margin-top:5px;gap:4px}.db-hp i{font-size:8px;font-style:normal;color:#f3d571;font-weight:900}.db-hp>span{height:7px;flex:1;background:#e0e6cb;border-radius:5px;overflow:hidden}.db-hp strong{display:block;height:100%;border-radius:4px;animation:db-hp-drain .65s ease-out}.db-hud footer{display:flex;justify-content:space-between;align-items:center;margin-top:4px}.db-hud footer>b{font:11px/1.2 monospace;color:#465b43}.db-hud footer>span{display:flex;gap:3px}.db-hud footer i{height:6px;width:6px;border-radius:50%;background:#5f9667;border:1px solid #346d49}.db-hud footer .is-out{background:#c7c6ac;border-color:#b1b39b}.db-hud footer .is-active{background:#efca63;border-color:#a88c35}.db-fighter{position:absolute;display:flex;justify-content:center;align-items:flex-end;transform-origin:center bottom;z-index:3;filter:drop-shadow(1px 4px 2px #3a5e4630)}.db-fighter>svg,.db-fighter>div{width:100%;height:100%;flex-shrink:1}.db-fighter-enemy{right:10px;top:70px;width:116px;height:111px}.db-fighter-player{left:4px;bottom:1px;width:153px;height:154px}.db-fighter.is-fainted{transform:translateY(42px) scale(.7);opacity:.15;transition:transform .6s,opacity .6s}.db-fx-hit .is-attacking{animation:db-lunge .48s ease-in-out}.db-fx-hit .db-fighter-enemy.is-attacking{animation-name:db-enemy-lunge}.db-fx-hit .is-target{animation:db-hit .6s ease-out}.db-fx-heal .is-target{filter:drop-shadow(0 0 12px #b3ff8e)}.db-fx-focus .is-target,.db-fx-guard .is-target{filter:drop-shadow(0 0 10px #ffe091)}.db-impact{position:absolute;z-index:7;border-radius:20px;padding:3px 8px;font-size:22px;font-weight:900;color:#fff9d5;text-shadow:1px 2px #435e44;background:var(--fx-color,#698d64);box-shadow:0 0 15px #fff6a066;animation:db-impact .9s ease-out both;pointer-events:none}.impact-enemy{right:43px;top:85px}.impact-player{left:55px;bottom:80px}.db-dialogue{margin-top:9px;border:3px solid #526b53;background:#fcfce6;border-radius:10px;padding:13px;font-size:13px;font-weight:800;line-height:1.9;min-height:82px;box-shadow:inset 0 0 0 2px #e7dec0;color:#36513b}.db-main-menu{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.db-main-menu button{border:2px solid #627b57;background:#fff9df;border-radius:9px;padding:11px;font-size:15px;font-weight:900;text-align:left;box-shadow:0 3px #627b5730}.db-main-menu button:first-child{background:#f8dea1;border-color:#b1873b}.db-main-menu span{margin-right:9px}.db-moves{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.db-moves button{border:2px solid var(--move-color);border-left:6px solid var(--move-color);background:#fffff4;border-radius:10px;padding:10px 7px;text-align:left;min-width:0}.db-moves strong{font-size:12px;display:block}.db-moves span{font-size:9px;display:block;margin:5px 0;color:#6c806a}.db-moves small{font-size:8px;line-height:1.7;color:#92977a;display:block}.db-move-footer{display:flex;justify-content:space-between;gap:5px;margin-top:9px}.db-move-footer button,.db-back{font-size:10px;border:1px solid #c0c9aa;background:#f8faed;border-radius:8px;padding:7px 9px}.db-party{display:grid;gap:6px}.db-party button{display:flex;align-items:center;gap:9px;padding:6px 12px;border:2px solid #bbcea7;border-radius:11px;background:white;text-align:left}.db-party button>span{height:56px;width:54px;display:flex}.db-party svg,.db-party button>span>div{width:100%;height:100%}.db-party b{font-size:12px}.db-party small{display:block;font-size:10px;color:#819374;margin-top:5px}.db-wait{font-size:11px;padding:20px;text-align:center;color:#728569}.db-result{text-align:center;padding:13px;background:#e8efda;border-radius:12px;margin-top:10px}.db-result>b{font-size:19px;color:#456d39}.db-result p{font-size:10px;color:#7e8e6e;margin-top:7px}#ace-modal :focus-visible{outline:3px solid #d8a642;outline-offset:2px}@keyframes db-hp-drain{from{width:var(--old-hp)} }@keyframes db-lunge{50%{transform:translate(23px,-10px) rotate(6deg)}}@keyframes db-enemy-lunge{50%{transform:translate(-20px,10px) rotate(-6deg)}}@keyframes db-hit{25%{transform:translateX(-5px);filter:brightness(1.3)}60%{transform:translateX(5px)} }@keyframes db-impact{from{opacity:0;transform:scale(.5) translateY(8px)}30%{opacity:1;transform:scale(1.1)}to{opacity:.8;transform:translateY(-12px)}}@media(prefers-reduced-motion:reduce){.db-fighter,.db-hp strong,.db-impact{animation:none!important;transition:none!important}}`;
const duelCompactCSS="@media(max-height:650px){.db-heading{padding:8px 11px}.db-body{padding:8px}.db-arena{height:205px}.db-fighter-player{height:105px;width:110px}.db-fighter-enemy{height:75px;width:80px;top:30px}.db-platform-enemy{top:98px;width:111px}.db-hud{padding:5px 7px}.db-hud-enemy{top:14px}.db-hud-player{bottom:8px}.db-hud b{font-size:10px}.db-dialogue{min-height:58px;padding:7px 9px;font-size:11px}.db-moves button{padding:6px 5px}.db-moves span{margin:3px 0}.db-moves small{line-height:1.5}.db-main-menu button{padding:9px}.db-impact{font-size:18px}.impact-enemy{top:65px}}";
window.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');style.textContent=duelCSS+duelCompactCSS;document.head.appendChild(style);
  const modal=document.createElement('div');modal.id='ace-modal';modal.className='hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','duel-title');modal.innerHTML='<div id="duel-panel" class="db-panel"><div class="db-heading"><div><small>IP BATTLE ARENA · 回合制對戰</small><h2 id="duel-title">IP 對戰擂台</h2></div><button id="duel-sound" onclick="duelToggleSound()" aria-pressed="false">音效：關</button><button id="duel-close" onclick="closeAceBattle()" aria-label="關閉對戰擂台">✕</button></div><div id="duel-body" class="db-body"></div></div>';document.body.appendChild(modal);
  modal.addEventListener('keydown',event=>{if(event.key==='Escape'){closeAceBattle();return;}if(event.key!=='Tab')return;const nodes=[...modal.querySelectorAll('button:not(:disabled),summary')].filter(node=>node.getClientRects().length),first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
});
