(function(){
  // čas v Česku, ať stránka říká pravdu i návštěvníkovi z ciziny
  var p={};
  try{
    new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',weekday:'short',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hour12:false})
      .formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
  }catch(e){return}
  var den=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday),
      y=+p.year,m=+p.month,d=+p.day,min=(+p.hour%24)*60+(+p.minute);
  if(den<0)return;
  var radek=document.querySelector('.hodiny tr[data-d="'+den+'"]');
  if(radek)radek.classList.add('dnes');

  // Velikonoce (Velký pátek až Velikonoční pondělí) a Vánoce 24.–26. 12.
  function nedele(r){var a=r%19,b=Math.floor(r/100),c=r%100,e=Math.floor(b/4),f=b%4,g=Math.floor((b+8)/25),
    h=Math.floor((b-g+1)/3),i=(19*a+b-e-h+15)%30,k=Math.floor(c/4),l=c%4,n=(32+2*f+2*k-i-l)%7,
    o=Math.floor((a+11*i+22*n)/451),mm=Math.floor((i+n-7*o+114)/31),dd=((i+n-7*o+114)%31)+1;
    return Date.UTC(r,mm-1,dd)}
  function volno(yy,mo,dd){
    if(mo===12&&dd>=24&&dd<=26)return true;
    var roz=Math.round((Date.UTC(yy,mo-1,dd)-nedele(yy))/864e5);
    return roz>=-2&&roz<=1;
  }
  var SVATKY=['1.1','1.5','8.5','5.7','6.7','28.9','28.10','17.11'];
  function svatek(mo,dd){return SVATKY.indexOf(dd+'.'+mo)>-1}
  var el=document.getElementById('ted'),text=el&&el.querySelector('span');
  if(!text)return;
  if(den>=1&&den<=5&&svatek(m,d)){el.classList.add('zavreno');text.textContent='Dnes je svátek, otevřeno po telefonické domluvě';return}
  var pracovni=den>=1&&den<=5&&!volno(y,m,d);
  if(pracovni&&min>=480&&min<960){
    text.textContent='Teď máme otevřeno, dnes do 16:00';
  }else{
    el.classList.add('zavreno');
    if(pracovni&&min<480){text.textContent='Otevíráme dnes v 8:00';}
    else{
      var jm=['v neděli','v pondělí','v úterý','ve středu','ve čtvrtek','v pátek','v sobotu'],kdy='';
      for(var i=1;i<=10;i++){
        var t=new Date(Date.UTC(y,m-1,d+i)),w=t.getUTCDay();
        if(w>=1&&w<=5&&!volno(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate())&&!svatek(t.getUTCMonth()+1,t.getUTCDate())){kdy=i===1?'zítra':jm[w];break}
      }
      text.textContent='Teď je zavřeno'+(kdy?', otevíráme '+kdy+' v 8:00':'');
    }
  }
})();

(function(){
  // objednávka opravy: chyba se ukáže až po opuštění pole, při psaní jen mizí
  var f=document.getElementById('objednavka');
  if(!f||!window.fetch||!window.URLSearchParams)return;
  var pole=[].slice.call(f.querySelectorAll('[data-chyba]')),btn=f.querySelector('button'),nejde=document.getElementById('o-nejde');
  function vada(el){
    var v=el.value.trim();
    if(!v)return el.getAttribute('data-chyba');
    if(el.name==='Telefon'&&v.replace(/\D/g,'').length<9)return 'Telefon má mít aspoň 9 číslic.';
    return '';
  }
  function over(el){
    var t=vada(el);
    document.getElementById(el.id+'-ch').textContent=t;
    if(t)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');
    return !t;
  }
  pole.forEach(function(el){
    el.addEventListener('blur',function(){over(el)});
    el.addEventListener('input',function(){if(el.hasAttribute('aria-invalid'))over(el)});
  });
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var spatne=pole.filter(function(el){return !over(el)});
    if(spatne.length){spatne[0].focus();return}
    var data=new URLSearchParams(new FormData(f)),tel=f.elements['Telefon'].value.trim();
    data.delete('_next');data.set('_captcha','false');
    nejde.hidden=true;btn.disabled=true;btn.textContent='Odesílám…';
    fetch(f.action.replace('formsubmit.co/','formsubmit.co/ajax/'),{method:'POST',headers:{'Accept':'application/json'},body:data})
      .then(function(r){return r.json()})
      .then(function(j){
        if(String(j.success)!=='true')throw new Error('neodesláno');
        var p=document.createElement('p'),s=document.createElement('strong');
        p.className='hotovo';p.setAttribute('role','status');p.tabIndex=-1;
        s.textContent='Odesláno.';
        p.appendChild(s);
        p.appendChild(document.createTextNode(' Děkujeme, zavoláme vám na číslo '+tel+' a domluvíme termín.'));
        f.parentNode.replaceChild(p,f);
        p.focus();
      })
      .catch(function(){btn.disabled=false;btn.textContent='Odeslat objednávku';nejde.hidden=false});
  });
})();

(function(){
  var dlg=document.getElementById('svetlo'),odkazy=[].slice.call(document.querySelectorAll('#galerie a'));
  if(!dlg||!dlg.showModal||!odkazy.length)return;
  var img=document.getElementById('svetlo-img'),popis=document.getElementById('svetlo-popis'),ktera=0;
  function ukaz(i){
    ktera=(i+odkazy.length)%odkazy.length;
    var a=odkazy[ktera];
    img.src=a.getAttribute('href');
    img.alt=a.querySelector('img').alt;
    popis.textContent=a.getAttribute('data-popis')+' ('+(ktera+1)+' z '+odkazy.length+')';
  }
  odkazy.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();ukaz(i);dlg.showModal()})});
  document.getElementById('svetlo-zavrit').addEventListener('click',function(){dlg.close()});
  document.getElementById('svetlo-zpet').addEventListener('click',function(){ukaz(ktera-1)});
  document.getElementById('svetlo-dal').addEventListener('click',function(){ukaz(ktera+1)});
  dlg.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')ukaz(ktera-1);if(e.key==='ArrowRight')ukaz(ktera+1)});
  dlg.addEventListener('click',function(e){if(e.target===dlg||e.target.classList.contains('svetlo-stred'))dlg.close()});
  dlg.addEventListener('close',function(){img.removeAttribute('src');odkazy[ktera].focus()});
})();
