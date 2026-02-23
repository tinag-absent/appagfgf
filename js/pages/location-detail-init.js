// Auto-generated inline script for location-detail
if (!ProgressSystem.checkPageAccess('location-detail.html')) {
      ModalSystem.warning('このページにアクセスするには LEVEL 1 が必要です。', 'ACCESS DENIED')
        .then(() => { Router.navigate('#/dashboard'); });
    }

    // データはJSONから読み込む（下部のinit()で取得）
    let MUNIS = {};
    let INCIDENTS = [];

    const SEV_COLOR  = { critical:'hsl(0,70%,55%)', warning:'hsl(38,90%,55%)', safe:'hsl(180,70%,45%)' };
    const SEV_RANK   = { critical:3, warning:2, safe:1 };
    const SEV_LABEL  = { critical:'重大', warning:'警戒', safe:'観察' };

    function assignMuni(lon, lat) {
      let best=null, bestDist=Infinity;
      for (const [code,m] of Object.entries(MUNIS)) {
        const d = Math.hypot(lon-m.centLon, lat-m.centLat);
        if (d < bestDist) { bestDist=d; best=code; }
      }
      return best;
    }

    function buildMap(code, muni, myIncs) {
      const svg  = document.getElementById('mapSvg');
      const wrap = document.getElementById('mapSvgWrap');
      const W    = wrap.clientWidth  || 600;
      const H    = wrap.clientHeight || 450;

      const spreadLon=0.45, spreadLat=0.34;
      const minLon=muni.centLon-spreadLon, maxLon=muni.centLon+spreadLon;
      const minLat=muni.centLat-spreadLat, maxLat=muni.centLat+spreadLat;

      function toSvg(lon,lat) {
        return [
          ((lon-minLon)/(maxLon-minLon))*W,
          H - ((lat-minLat)/(maxLat-minLat))*H
        ];
      }

      svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      svg.innerHTML='';

      const NS='http://www.w3.org/2000/svg';
      const el=(tag,attrs={})=>{ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); return e; };

      // Defs: radial glow
      const defs=el('defs');
      const rg=el('radialGradient',{id:'cg',cx:'50%',cy:'50%',r:'50%'});
      [['0%','rgba(0,229,229,0.07)'],['100%','rgba(0,0,0,0)']].forEach(([o,c])=>{ const s=el('stop',{offset:o,'stop-color':c}); rg.appendChild(s); });
      defs.appendChild(rg);
      svg.appendChild(defs);

      // Background
      svg.appendChild(el('rect',{width:W,height:H,fill:'hsl(220,30%,6%)'}));
      svg.appendChild(el('rect',{width:W,height:H,fill:'url(#cg)'}));

      // Grid
      const gridG=el('g',{opacity:'0.1'});
      const gs=0.1;
      for(let lon=Math.ceil(minLon/gs)*gs;lon<=maxLon;lon+=gs){
        const [x]=toSvg(lon,minLat);
        gridG.appendChild(el('line',{x1:x,y1:0,x2:x,y2:H,stroke:'rgba(0,229,229,0.5)','stroke-width':'0.5','stroke-dasharray':'3,7'}));
      }
      for(let lat=Math.ceil(minLat/gs)*gs;lat<=maxLat;lat+=gs){
        const [,y]=toSvg(minLon,lat);
        gridG.appendChild(el('line',{x1:0,y1:y,x2:W,y2:y,stroke:'rgba(0,229,229,0.5)','stroke-width':'0.5','stroke-dasharray':'3,7'}));
      }
      svg.appendChild(gridG);

      // Neighbors
      const neighborG=el('g');
      const [fcx,fcy]=toSvg(muni.centLon,muni.centLat);
      for(const [nc,nm] of Object.entries(MUNIS)){
        if(nc===code) continue;
        const [cx,cy]=toSvg(nm.centLon,nm.centLat);
        if(cx<-30||cx>W+30||cy<-30||cy>H+30) continue;
        const dist=Math.hypot(cx-fcx,cy-fcy);
        if(dist<W*0.65){
          neighborG.appendChild(el('line',{x1:fcx,y1:fcy,x2:cx,y2:cy,stroke:'rgba(255,255,255,0.04)','stroke-width':'0.5'}));
        }
        neighborG.appendChild(el('circle',{cx,cy,r:'3',fill:'rgba(255,255,255,0.07)',stroke:'rgba(255,255,255,0.15)','stroke-width':'0.5'}));
        const t=el('text',{x:cx+5,y:cy+3,fill:'rgba(255,255,255,0.18)','font-size':'8','font-family':'JetBrains Mono, monospace'});
        t.textContent=nm.name; neighborG.appendChild(t);
      }
      svg.appendChild(neighborG);

      // Focus hex territory
      const hexR=Math.min(W,H)*0.18;
      const hexPts=Array.from({length:6},(_,i)=>{
        const a=Math.PI/180*(60*i-30);
        return `${fcx+hexR*Math.cos(a)},${fcy+hexR*Math.sin(a)}`;
      }).join(' ');
      svg.appendChild(el('polygon',{points:hexPts,fill:'rgba(0,229,229,0.025)',stroke:'rgba(0,229,229,0.12)','stroke-width':'1','stroke-dasharray':'4,4'}));

      // Pulse rings
      [0.32,0.46,0.62].forEach(r=>{
        svg.appendChild(el('circle',{cx:fcx,cy:fcy,r:hexR*r,fill:'none',stroke:'rgba(0,229,229,0.07)','stroke-width':'1'}));
      });

      // Center dot
      svg.appendChild(el('circle',{cx:fcx,cy:fcy,r:'5',fill:'var(--primary)',opacity:'0.9',filter:'drop-shadow(0 0 6px rgba(0,229,229,0.8))'}));
      const cl=el('text',{x:fcx,y:fcy-10,fill:'rgba(0,229,229,0.9)','font-size':'11','font-weight':'bold','font-family':'Space Grotesk, sans-serif','text-anchor':'middle'});
      cl.textContent=muni.name; svg.appendChild(cl);

      // Incident markers (clickable)
      myIncs.forEach((inc,idx)=>{
        const [ix,iy]=toSvg(inc.lon,inc.lat);
        const col=SEV_COLOR[inc.severity];

        // Group for click handling
        const g=el('g',{'class':'map-marker-group','data-idx':idx});

        // Outer pulse ring
        g.appendChild(el('circle',{cx:ix,cy:iy,r:'18',fill:'rgba(0,0,0,0)',stroke:col,'stroke-width':'1',opacity:'0.22','stroke-dasharray':'3,3'}));
        // Hit area (invisible, larger)
        const hit=el('circle',{cx:ix,cy:iy,r:'18',fill:'rgba(0,0,0,0)',stroke:'none',cursor:'pointer'});
        // Dot
        const dot=el('circle',{cx:ix,cy:iy,r:'9',fill:col,opacity:'0.9','class':'marker-dot',
          filter:`drop-shadow(0 0 7px ${col})`,cursor:'pointer',
          style:'transition:r 0.12s ease'});
        // Number label
        const num=el('text',{x:ix,y:iy+4,fill:'white','font-size':'7.5','font-weight':'bold',
          'font-family':'JetBrains Mono, monospace','text-anchor':'middle','pointer-events':'none'});
        num.textContent=idx+1;

        g.appendChild(dot); g.appendChild(hit); g.appendChild(num);

        // Callout line
        const dx=ix>fcx?52:-52, dy=iy>fcy?22:-22;
        g.appendChild(el('line',{x1:ix,y1:iy,x2:ix+dx,y2:iy+dy,stroke:col,'stroke-width':'0.6',opacity:'0.4','pointer-events':'none'}));
        const lt=el('text',{x:ix+dx+(dx>0?3:-3),y:iy+dy,fill:col,opacity:'0.7','font-size':'7.5',
          'font-family':'JetBrains Mono, monospace','text-anchor':dx>0?'start':'end','pointer-events':'none'});
        lt.textContent=inc.location; g.appendChild(lt);

        // Click → open modal
        g.addEventListener('click', ()=>openIncidentModal(inc, idx));
        // Hover animation
        g.addEventListener('mouseenter', ()=>{ dot.setAttribute('r','11'); dot.setAttribute('opacity','1'); });
        g.addEventListener('mouseleave', ()=>{ dot.setAttribute('r','9');  dot.setAttribute('opacity','0.9'); });

        svg.appendChild(g);
      });

      // Scale bar
      const [p1x]=toSvg(muni.centLon,muni.centLat);
      const [p2x]=toSvg(muni.centLon+0.1,muni.centLat);
      const km10px=Math.abs(p2x-p1x)*0.9;
      const sbX=W-95, sbY=H-18;
      svg.appendChild(el('line',{x1:sbX,y1:sbY,x2:sbX+km10px,y2:sbY,stroke:'rgba(255,255,255,0.3)','stroke-width':'1.5'}));
      const st=el('text',{x:sbX+km10px/2,y:sbY-5,fill:'rgba(255,255,255,0.3)','font-size':'7','font-family':'JetBrains Mono, monospace','text-anchor':'middle'});
      st.textContent='≈10km'; svg.appendChild(st);

      // Compass
      const cpx=28, cpy=28;
      svg.appendChild(el('path',{d:`M${cpx} ${cpy-13} L${cpx+5} ${cpy+5} L${cpx} ${cpy+2} L${cpx-5} ${cpy+5} Z`,fill:'rgba(0,229,229,0.55)'}));
      const cn=el('text',{x:cpx,y:cpy-15,fill:'rgba(0,229,229,0.65)','font-size':'8','font-family':'JetBrains Mono, monospace','text-anchor':'middle'});
      cn.textContent='N'; svg.appendChild(cn);
    }


    // ── Incident Modal ──
    const overlay   = document.getElementById('incModalOverlay');
    const modalEl   = document.getElementById('incModal');
    const closeBtn  = document.getElementById('incModalClose');

    const SEV_LABEL_MAP = { critical:'重大', warning:'警戒', safe:'観察' };
    const SEV_ALERT_TEXT = {
      critical: '重大事案が発生中です。即時対応が必要です。付近への立入は禁止されています。',
      warning:  '警戒事案を監視中です。動向に注意してください。',
      safe:     '観察対象の事案があります。収束済みまたは軽微です。',
    };

    function openIncidentModal(inc, idx) {
      const col = SEV_COLOR[inc.severity];
      const label = SEV_LABEL_MAP[inc.severity];

      document.getElementById('incModalSevBar').style.background = col;
      document.getElementById('incModalSevDot').style.background = col;
      document.getElementById('incModalSevDot').style.boxShadow  = `0 0 6px ${col}`;
      document.getElementById('incModalSevLabel').textContent    = label;
      document.getElementById('incModalSevLabel').style.color    = col;
      document.getElementById('incModalId').textContent          = inc.id ? `#${inc.id}` : `#${String(idx+1).padStart(3,'0')}`;
      document.getElementById('incModalTitle').textContent       = inc.name;
      document.getElementById('incModalStatus').textContent      = inc.status;
      document.getElementById('incModalGsi').textContent         = `${inc.gsi}`;
      document.getElementById('incModalLocation').textContent    = inc.location;
      document.getElementById('incModalEntity').textContent      = inc.entity;
      document.getElementById('incModalDivision').textContent    = inc.division;
      document.getElementById('incModalTime').textContent        = inc.time;
      document.getElementById('incModalDesc').textContent        = inc.desc;

      // 詳細ページリンク（mission-detail があれば遷移、なければ無効化）
      const linkEl = document.getElementById('incModalDetailLink');
      if (inc.missionId) {
        linkEl.href = `./mission-detail.html?id=${inc.missionId}`;
        linkEl.classList.remove('inc-modal-link-disabled');
      } else {
        linkEl.href = '#';
        linkEl.classList.add('inc-modal-link-disabled');
        linkEl.setAttribute('title', '関連ミッションページなし');
      }

      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeIncidentModal() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeIncidentModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeIncidentModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeIncidentModal();
    });

    // ── Main: JSON読み込み後に描画 ──
    async function init() {
      const params = new URLSearchParams(window.__getHashSearch ? window.__getHashSearch() : location.search);
      const code   = params.get('code') || '';

      try {
        // ① インラインデータ優先（file:// でも動作）
        if (window.__DATA_MUNICIPALITIES_DATA && window.__DATA_AREA_INCIDENTS_DATA) {
          MUNIS     = window.__DATA_MUNICIPALITIES_DATA.municipalities;
          INCIDENTS = window.__DATA_AREA_INCIDENTS_DATA.incidents;
        } else {
          // ② HTTP / GitHub Pages フォールバック
          const [muniRes, incRes] = await Promise.all([
            fetch('../data/municipalities-data.json'),
            fetch('../data/area-incidents-data.json')
          ]);
          if (!muniRes.ok || !incRes.ok) throw new Error('データの読み込みに失敗しました');
          const muniData = await muniRes.json();
          const incData  = await incRes.json();
          MUNIS     = muniData.municipalities;
          INCIDENTS = incData.incidents;
        }
      } catch (err) {
        console.error('JSON load error:', err);
        document.getElementById('locTitle').textContent = 'データ読み込みエラー';
        document.getElementById('alertText').textContent = 'データの読み込みに失敗しました。';
        return;
      }

      const muni = MUNIS[code];

    if (!muni) {
      document.getElementById('locTitle').textContent = '不明な地域コード';
      document.getElementById('alertText').textContent = `code="${code}" はデータに存在しません。マップから選択してください。`;
    } else {
      const myIncs = INCIDENTS.filter(inc => assignMuni(inc.lon,inc.lat)===code)
                               .sort((a,b)=>SEV_RANK[b.severity]-SEV_RANK[a.severity]);
      const worst  = myIncs.length ? myIncs[0].severity : null;
      const maxGsi = myIncs.length ? Math.max(...myIncs.map(i=>i.gsi)) : 0;
      const divSet = [...new Set(myIncs.map(i=>i.division))];

      document.title = `${muni.name} - 海蝕機関`;
      document.getElementById('locBadge').textContent = `市町村コード: ${code} // 大分県 // KAISHOKU MONITORING`;
      document.getElementById('locTitle').textContent = muni.name;
      document.getElementById('locSub').textContent   = `${muni.centLat.toFixed(4)}°N  ${muni.centLon.toFixed(4)}°E  //  海蝕現象モニタリング地域`;
      document.getElementById('mapTitle').textContent = muni.name;
      document.getElementById('mapCoord').textContent = `${muni.centLat.toFixed(3)}°N, ${muni.centLon.toFixed(3)}°E`;

      // Alert
      const banner = document.getElementById('alertBanner');
      const alertMap = {
        critical:{ cls:'critical', text:'重大事案が発生中です。即時対応が必要です。付近への立入は禁止されています。' },
        warning: { cls:'warning',  text:'警戒事案を監視中です。動向に注意してください。' },
        safe:    { cls:'safe',     text:'観察対象の事案があります。収束済みまたは軽微です。' },
      };
      const ai = worst ? alertMap[worst] : { cls:'none', text:'現在この地域に記録された事案はありません。' };
      banner.className=`alert-banner ${ai.cls}`;
      document.getElementById('alertText').textContent=ai.text;

      // Stats
      document.getElementById('sTot').textContent  = myIncs.length;
      document.getElementById('sCrit').textContent = myIncs.filter(i=>i.severity==='critical').length;
      document.getElementById('sWarn').textContent = myIncs.filter(i=>i.severity==='warning').length;
      document.getElementById('sSafe').textContent = myIncs.filter(i=>i.severity==='safe').length;

      // Info
      document.getElementById('infoCode').textContent     = code;
      document.getElementById('infoCoord').textContent    = `${muni.centLat.toFixed(4)}°N, ${muni.centLon.toFixed(4)}°E`;
      document.getElementById('infoAlert').textContent    = worst ? SEV_LABEL[worst] : '正常';
      document.getElementById('infoDivision').textContent = divSet[0] || '未配備';
      document.getElementById('infoUpdated').textContent  = new Date().toLocaleString('ja-JP',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});

      // GSI
      const gsiColor = maxGsi>=10?'hsl(0,70%,55%)':maxGsi>=5?'hsl(38,90%,55%)':'var(--primary)';
      document.getElementById('gsiVal').textContent = maxGsi.toFixed(1);
      document.getElementById('gsiVal').style.color = gsiColor;
      setTimeout(()=>{
        const f=document.getElementById('gsiFill');
        f.style.width=Math.min(100,(maxGsi/15)*100)+'%';
        f.style.background=gsiColor;
        f.style.boxShadow=`2px 0 10px ${gsiColor}`;
      },300);

      // Division bars
      if(divSet.length>0){
        document.getElementById('divPanel').style.display='';
        const cnt={};
        myIncs.forEach(i=>{ cnt[i.division]=(cnt[i.division]||0)+1; });
        const maxC=Math.max(...Object.values(cnt));
        document.getElementById('divBars').innerHTML=Object.entries(cnt).map(([d,c])=>`
          <div class="div-row">
            <div class="div-name">${d} <span style="color:rgba(255,255,255,0.4)">(${c})</span></div>
            <div class="div-track"><div class="div-fill" style="width:0%" data-pct="${(c/maxC*100).toFixed(0)}"></div></div>
          </div>
        `).join('');
        setTimeout(()=>{
          document.querySelectorAll('.div-fill').forEach(el=>{ el.style.width=el.dataset.pct+'%'; });
        },400);
      }

      // Incident list
      const listEl=document.getElementById('incList');
      if(myIncs.length===0){
        listEl.innerHTML=`<div class="no-inc">この地域に記録された事案はありません</div>`;
      } else {
        listEl.innerHTML=myIncs.map((inc,idx)=>`
          <div class="inc-item ${inc.severity}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.2rem;">
              <div class="inc-item-name">${idx+1}. ${inc.name}</div>
              <span class="inc-sev-tag ${inc.severity}">${SEV_LABEL[inc.severity]}</span>
            </div>
            <div class="inc-item-meta">
              <span>${inc.status}</span>
              <span>GSI ${inc.gsi}</span>
              <span>${inc.time.slice(5)}</span>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:rgba(255,255,255,0.25);margin-top:0.25rem;line-height:1.5;">${inc.desc}</div>
          </div>
        `).join('');
      }

      // Build map after layout
      requestAnimationFrame(()=>{ setTimeout(()=>buildMap(code,muni,myIncs),50); });
    }
    } // end init

    init();