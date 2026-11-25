/* ================================================================
   passout.js — Drop-in module for PASS OUT feature
   ================================================================ */
(function(){
  'use strict';

  function addT(){
    if (typeof T === 'undefined') return false;
    Object.assign(T.en, {
      passOutBtn:'Pass Out', passOutTitle:'Pass Out',
      confirmPassOut:'Pass out {name}? Data is preserved, but the user is removed from lists and login.',
      passOutDate:'Pass out date', passOutNote:'Note (optional)',
      passOutDo:'Pass Out', passOutCancel:'Cancel',
      passOutDone:'{n} students passed out',
      restoreBtn:'Restore', restoreConfirm:'Restore {name}?',
      restored:'Restored', undo:'Undo',
      alumniTab:'Alumni', alumniTitle:'Alumni / Passed Out',
      alumniSearch:'Search (name / English name)',
      yearFilter:'Year', sortByDate:'By date', sortByName:'By name',
      resultsCount:'Results: {n}', csvExport:'Download CSV',
      bulkPassOut:'Pass Out Selected', bulkClassPassOut:'Pass Out Whole Class',
      bulkConfirm:'{n} students will be passed out. Continue?',
      loginBlocked:'Your account is closed (passed out)'
    });
    Object.assign(T.ur, {
      passOutBtn:'پاس آؤٹ', passOutTitle:'پاس آؤٹ',
      confirmPassOut:'کیا آپ واقعی {name} کو پاس آؤٹ کرنا چاہتے ہیں؟ اس کا ڈیٹا محفوظ رہے گا مگر وہ لسٹ اور لاگ اِن سے ہٹ جائے گا۔',
      passOutDate:'پاس آؤٹ تاریخ', passOutNote:'نوٹ (اختیاری)',
      passOutDo:'پاس آؤٹ کریں', passOutCancel:'منسوخ کریں',
      passOutDone:'{n} طلبہ پاس آؤٹ ہو گئے',
      restoreBtn:'بحال کریں', restoreConfirm:'کیا آپ {name} کو بحال کرنا چاہتے ہیں؟',
      restored:'بحال ہو گیا', undo:'واپس کریں',
      alumniTab:'پاس آؤٹ طلبہ', alumniTitle:'پاس آؤٹ طلبہ',
      alumniSearch:'تلاش کریں (نام / نام انگریزی)',
      yearFilter:'سال', sortByDate:'تاریخ کے مطابق', sortByName:'نام کے مطابق',
      resultsCount:'نتائج: {n}', csvExport:'CSV ڈاؤن لوڈ',
      bulkPassOut:'منتخب طلبہ پاس آؤٹ کریں', bulkClassPassOut:'پوری جماعت پاس آؤٹ کریں',
      bulkConfirm:'{n} طلبہ پاس آؤٹ کیے جائیں گے۔ جاری رکھیں؟',
      loginBlocked:'آپ کا اکاؤنٹ بند ہو چکا ہے (پاس آؤٹ)'
    });
    return true;
  }
  if (!addT()) setTimeout(addT, 300); else boot();

  var esc = function(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };

  function boot(){
    // CSS
    var css = document.createElement('style');
    css.textContent = '\
.passout-btn{color:var(--mid);background:#fff;border:1px solid var(--mid);border-radius:6px;padding:6px 12px;min-height:44px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;margin-inline-start:6px}\
.passout-btn:hover{background:var(--mid);color:#fff}\
.alumni-row{cursor:pointer}.alumni-row:hover td{background:#fbfdfc}\
.passout-flag{background:#FBE6E6;color:var(--low);padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700}\
.alumni-check{width:20px;height:20px;accent-color:var(--pri);cursor:pointer}\
.alumni-bulkbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0;padding:10px 14px;background:var(--tint);border:1px solid var(--line);border-radius:var(--radius)}\
.alumni-bulkbar .chip{background:#fff;color:var(--pri);border:1px solid var(--line);padding:6px 12px;border-radius:8px;font-weight:700}\
';
    document.head.appendChild(css);

    // Add Alumni tab button
    var nav = document.querySelector('.tabs');
    if (nav && !document.getElementById('tbAlumni')){
      var btn = document.createElement('button');
      btn.dataset.t = 'alumni';
      btn.id = 'tbAlumni';
      btn.hidden = true;
      btn.onclick = openAlumniTab;
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 10v5c0 2 3 4 6 4s6-2 6-4v-5"/></svg><span class="nav-label">Alumni</span>';
      nav.appendChild(btn);
    }

    // Add Alumni section
    var main = document.querySelector('.main-content');
    if (main && !document.getElementById('p_alumni')){
      var sec = document.createElement('section');
      sec.id = 'p_alumni';
      sec.className = 'panel';
      sec.hidden = true;
      sec.innerHTML = ''
        + '<h2 style="color:var(--pri);margin-bottom:16px">Alumni</h2>'
        + '<div class="bar-tools">'
        + '  <label style="flex:1;min-width:200px"><input id="al_search" class="sfs-search" oninput="window._renderAlumniBody()" placeholder="Search..."></label>'
        + '  <label><span>Class</span><select id="al_cls" onchange="window._renderAlumniBody()"><option value="">—</option></select></label>'
        + '  <label><span>Year</span><select id="al_year" onchange="window._renderAlumniBody()"><option value="">—</option></select></label>'
        + '  <label><select id="al_sort" onchange="window._renderAlumniBody()"><option value="date">Date</option><option value="name">Name</option></select></label>'
        + '  <button class="btn ghost sm" onclick="window._exportAlumniCSV()">CSV</button>'
        + '</div>'
        + '<div class="sfs-count" id="al_count"></div>'
        + '<div class="t"><table><thead><tr>'
        + '  <th class="l">Name</th><th>Class</th><th>Pass Out Date</th><th class="l">Note</th>'
        + '</tr></thead><tbody id="al_body"></tbody></table></div>';
      main.appendChild(sec);
    }

    // Watch users table for pass-out button injection
    var ul = document.getElementById('ul');
    if (ul){
      new MutationObserver(injectPassoutButtons).observe(ul, { childList:true, subtree:true });
    }

    // Poll for D.alumni to show/hide Alumni tab
    setInterval(function(){
      if (typeof D !== 'undefined' && D && D.me){
        var show = (D.me.role === 'admin' || D.me.role === 'teacher');
        var tb = document.getElementById('tbAlumni');
        if (tb) tb.hidden = !show;
      }
    }, 500);
  }

  function openAlumniTab(){
    document.querySelectorAll('.main-content > section').forEach(function(s){ s.hidden = true; });
    var p = document.getElementById('p_alumni');
    if (p) p.hidden = false;
    document.querySelectorAll('.tabs button').forEach(function(b){
      b.classList.toggle('on', b.dataset.t === 'alumni');
    });
    renderAlumni();
  }
  window.openAlumniTab = openAlumniTab;

  function renderAlumni(){
    if (typeof D === 'undefined' || !D || !D.alumni) return;

    var T2 = (typeof T !== 'undefined') ? T[typeof LG !== 'undefined' ? LG : 'en'] : {};
    var h2 = document.querySelector('#p_alumni h2');
    if (h2) h2.textContent = T2.alumniTitle || 'Alumni';
    var sIn = document.getElementById('al_search');
    if (sIn) sIn.placeholder = T2.alumniSearch || 'Search';
    var sortSel = document.getElementById('al_sort');
    if (sortSel){
      sortSel.options[0].text = T2.sortByDate || 'Date';
      sortSel.options[1].text = T2.sortByName || 'Name';
    }
    var csvBtn = document.querySelector('#p_alumni .bar-tools button');
    if (csvBtn) csvBtn.textContent = T2.csvExport || 'CSV';

    var clsSel = document.getElementById('al_cls');
    if (clsSel && clsSel.options.length <= 1){
      var cls = Array.from(new Set(D.alumni.map(function(a){ return a.class; }).filter(Boolean)));
      clsSel.innerHTML = '<option value="">—</option>' + cls.map(function(c){
        var disp = (typeof displayClass === 'function') ? displayClass(c) : c;
        return '<option value="' + esc(c) + '">' + esc(disp) + '</option>';
      }).join('');
    }
    var yrSel = document.getElementById('al_year');
    if (yrSel && yrSel.options.length <= 1){
      var yrs = Array.from(new Set(D.alumni.map(function(a){ return String(a.passoutDate||'').slice(0,4); }).filter(Boolean))).sort();
      yrSel.innerHTML = '<option value="">—</option>' + yrs.map(function(y){
        return '<option value="' + esc(y) + '">' + esc(y) + '</option>';
      }).join('');
    }
    window._renderAlumniBody();
  }

  window._renderAlumniBody = function(){
    if (typeof D === 'undefined' || !D) return;
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    var q   = (document.getElementById('al_search').value || '').toLowerCase().trim();
    var cls = document.getElementById('al_cls').value;
    var yr  = document.getElementById('al_year').value;
    var srt = document.getElementById('al_sort').value;

    var rows = (D.alumni || []).filter(function(a){
      if (q && !String(a.name||'').toLowerCase().includes(q) && !String(a.nameEn||'').toLowerCase().includes(q)) return false;
      if (cls && a.class !== cls) return false;
      if (yr && String(a.passoutDate||'').slice(0,4) !== yr) return false;
      return true;
    });
    rows.sort(function(a,b){
      return srt === 'name'
        ? String(a.name||'').localeCompare(String(b.name||''),'ur')
        : String(a.passoutDate||'').localeCompare(String(b.passoutDate||''));
    });

    var cnt = document.getElementById('al_count');
    if (cnt) cnt.textContent = (T2.resultsCount || 'Results: {n}').replace('{n}', rows.length);

    var body = document.getElementById('al_body');
    if (!rows.length){
      body.innerHTML = '<tr><td colspan="4" class="empty">—</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function(a){
      var nm = (typeof displayName === 'function') ? displayName(a) : (a.name || '');
      var cl = (typeof displayClass === 'function') ? displayClass(a.class) : (a.class || '');
      return '<tr class="alumni-row" onclick="window._openAlumniProfile(\'' + esc(a.username) + '\')">'
        + '<td class="l">' + esc(nm) + '</td>'
        + '<td>' + esc(cl) + '</td>'
        + '<td>' + esc(a.passoutDate || '—') + '</td>'
        + '<td class="l">' + esc(a.passoutNote || '—') + '</td>'
        + '</tr>';
    }).join('');
  };

  function injectPassoutButtons(){
    if (typeof D === 'undefined' || !D || !D.users) return;
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    document.querySelectorAll('#ul tbody tr').forEach(function(row){
      if (row.querySelector('.passout-btn')) return;
      var username = null;
      row.querySelectorAll('[onclick]').forEach(function(el){
        var m = /(?:delUser|editUser|openUser|showUser|delUserConfirm)\(['"]([^'"]+)/.exec(el.getAttribute('onclick')||'');
        if (m) username = m[1];
      });
      if (!username) return;
      var user = D.users.find(function(u){ return String(u.username) === String(username); });
      if (!user || user.role !== 'student') return;
      var btn = document.createElement('button');
      btn.className = 'passout-btn';
      btn.textContent = '🚪 ' + (T2.passOutBtn || 'Pass Out');
      btn.onclick = function(){ showPassOutModal(username); };
      var cell = row.querySelector('td:last-child');
      if (cell) cell.appendChild(btn);
    });
  }

  function showPassOutModal(username){
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    var u = (D.users||[]).find(function(x){ return String(x.username) === String(username); });
    if (!u) return;
    var nm = (typeof displayName === 'function') ? displayName(u) : (u.name || u.username);
    var wrap = document.createElement('div');
    wrap.className = 'md';
    wrap.innerHTML = ''
      + '<div class="mb" role="dialog">'
      + '<h2 style="color:var(--pri);margin-bottom:12px">' + esc(T2.passOutTitle||'Pass Out') + '</h2>'
      + '<p class="note">' + esc((T2.confirmPassOut||'Pass out {name}?').replace('{name}', nm)) + '</p>'
      + '<label class="f" style="margin-top:12px">' + esc(T2.passOutDate||'Date')
      + '<input type="date" id="po_date" value="' + new Date().toISOString().slice(0,10) + '"></label>'
      + '<label class="f" style="margin-top:8px">' + esc(T2.passOutNote||'Note')
      + '<input type="text" id="po_note" maxlength="200"></label>'
      + '<div class="row" style="justify-content:flex-end;margin-top:16px;gap:8px">'
      + '<button class="btn ghost" id="po_cancel">' + esc(T2.passOutCancel||'Cancel') + '</button>'
      + '<button class="btn danger" id="po_ok">' + esc(T2.passOutDo||'Pass Out') + '</button>'
      + '</div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('#po_cancel').onclick = function(){ wrap.remove(); };
    wrap.addEventListener('click', function(e){ if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('#po_ok').onclick = function(){
      var date = wrap.querySelector('#po_date').value;
      var note = wrap.querySelector('#po_note').value;
      wrap.remove();
      doPassOut([u.username], date, note);
    };
  }
  window.showPassOutModal = showPassOutModal;

  async function apiCall(payload){
    var res = await fetch(API, {
      method:'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type':'text/plain;charset=utf-8' }
    });
    return res.json();
  }
  function auth(){ return (typeof U !== 'undefined' && typeof P !== 'undefined') ? { u:U, p:P } : {}; }

  function applyResult(r){
    if (!r || !r.ok) return;
    if (typeof D !== 'undefined' && D){
      D.students = r.students || D.students;
      D.entries  = r.entries  || D.entries;
      D.photos   = r.photos   || D.photos;
      D.classes  = r.classes  || D.classes;
      D.targets  = r.targets  || D.targets;
      D.alumni   = r.alumni   || D.alumni || [];
      if (r.users) D.users = r.users;
      if (r.attendanceRaw) D.attendanceRaw = r.attendanceRaw;
      if (r.publishedSalaries) D.publishedSalaries = r.publishedSalaries;
    }
    try { if (typeof fill === 'function') fill(); } catch(e){}
    try { if (typeof render === 'function') render(); } catch(e){}
    try { if (typeof ulist === 'function') ulist();  } catch(e){}
  }

  async function doPassOut(usernames, date, note){
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    try {
      var r = await apiCall(Object.assign(auth(), { action:'passOut', usernames:usernames, date:date, note:note }));
      if (!r || !r.ok){ toastSimple((r && r.msg) || 'Error', true); return; }
      applyResult(r);
      toastUndo((T2.passOutDone || '{n} passed out').replace('{n}', usernames.length), function(){ restoreUsers(usernames); });
    } catch(e){ toastSimple(e.message, true); }
  }
  async function restoreUsers(usernames){
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    for (var i = 0; i < usernames.length; i++){
      try {
        var r = await apiCall(Object.assign(auth(), { action:'restoreUser', username:usernames[i] }));
        if (r && r.ok) applyResult(r);
      } catch(e){}
    }
    toastSimple(T2.restored || 'Restored');
  }

  function toastSimple(msg, bad){
    var el = document.getElementById('toast');
    if (!el){ alert(msg); return; }
    el.classList.remove('has-undo'); el.innerHTML = ''; el.textContent = msg;
    el.classList.toggle('bad', !!bad); el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.hidden = true; }, 3000);
  }
  function toastUndo(msg, undoFn){
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    var el = document.getElementById('toast');
    if (!el){ alert(msg); return; }
    el.innerHTML = esc(msg) + ' <button class="undo-btn">' + esc(T2.undo||'Undo') + '</button>';
    el.classList.add('has-undo'); el.classList.remove('bad'); el.hidden = false;
    var hide = function(){ el.hidden = true; el.classList.remove('has-undo'); el.innerHTML = ''; };
    el.querySelector('.undo-btn').onclick = function(){ hide(); undoFn(); };
    clearTimeout(el._t);
    el._t = setTimeout(hide, 5000);
  }

  window._openAlumniProfile = async function(username){
    var lg = (typeof LG !== 'undefined') ? LG : 'en';
    var T2 = (typeof T !== 'undefined') ? T[lg] : {};
    try {
      var r = await apiCall(Object.assign(auth(), { action:'alumniData', username:username }));
      if (!r || !r.ok){ toastSimple((r && r.msg)||'Error', true); return; }
      var s = r.student;
      var sum = (r.attSum||[])[0] || { p:0, l:0, a:0 };
      var photo = r.photos && r.photos[s.username];
      var nm = (typeof displayName === 'function') ? displayName(s) : (s.name || '');
      var cl = (typeof displayClass === 'function') ? displayClass(s.class) : (s.class || '');
      var wrap = document.createElement('div');
      wrap.className = 'md';
      wrap.innerHTML = ''
        + '<div class="mb pmb" style="max-width:880px;position:relative">'
        + '<button class="pmx" onclick="this.closest(\'.md\').remove()" style="position:absolute;top:12px;right:16px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer">✕</button>'
        + '<h2 style="color:var(--pri);margin:0 0 8px">' + esc(nm) + '</h2>'
        + '<div class="note">' + esc(cl) + ' • ' + esc(T2.passOutDate||'Pass out') + ': ' + esc(s.passoutDate||'—') + '</div>'
        + (s.passoutNote ? '<div class="note" style="font-style:italic">' + esc(s.passoutNote) + '</div>' : '')
        + '<div class="kpis" style="margin-top:16px">'
        + '<div class="kpi ok"><small>' + esc(T2.present||'Present') + '</small><b>' + sum.p + '</b></div>'
        + '<div class="kpi mid"><small>' + esc(T2.leave||'Leave') + '</small><b>' + sum.l + '</b></div>'
        + '<div class="kpi low"><small>' + esc(T2.absent||'Absent') + '</small><b>' + sum.a + '</b></div>'
        + '</div>'
        + '<h4>Entries (' + (r.entries||[]).length + ')</h4>'
        + '<div class="t"><table><thead><tr><th>Date</th><th class="l">Data</th></tr></thead><tbody>'
        + ((r.entries||[]).sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); }).map(function(e){
            return '<tr><td>' + esc(String(e.date).slice(0,7)) + '</td><td class="l"><code style="font-size:12px">' + esc(e.data) + '</code></td></tr>';
          }).join('') || '<tr><td colspan="2" class="empty">—</td></tr>')
        + '</tbody></table></div>'
        + '<div class="row" style="justify-content:flex-end;margin-top:16px">'
        + '<button class="btn danger" id="al_restore">' + esc(T2.restoreBtn||'Restore') + '</button>'
        + '</div></div>';
      document.body.appendChild(wrap);
      wrap.addEventListener('click', function(e){ if (e.target === wrap) wrap.remove(); });
      wrap.querySelector('#al_restore').onclick = function(){
        var c = confirm((T2.restoreConfirm||'Restore {name}?').replace('{name}', nm));
        if (!c) return;
        restoreUsers([s.username]).then(function(){ wrap.remove(); });
      };
    } catch(e){ toastSimple(e.message, true); }
  };

  window._exportAlumniCSV = function(){
    var rows = (typeof D !== 'undefined' && D.alumni) || [];
    var head = ['username','name','nameEn','class','classEn','passoutDate','passoutNote'];
    var esc2 = function(v){ return '"' + String(v==null?'':v).replace(/"/g,'""') + '"'; };
    var csv = [head.join(',')].concat(rows.map(function(r){
      return head.map(function(k){ return esc2(r[k]); }).join(',');
    })).join('\n');
    var blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alumni.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

})();
