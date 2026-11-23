document.documentElement.classList.add('js');

// Mobile menu
(function(){
  var btn=document.querySelector('.menu-btn'), list=document.querySelector('.nav ul');
  if(!btn||!list) return;
  btn.addEventListener('click',function(){
    var open=list.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
    btn.textContent=open?'Close':'Menu';
  });
})();

// Fade-in on scroll (content is visible by default; only hidden once JS confirms it can reveal it)
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els=[].slice.call(document.querySelectorAll('.reveal'));
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pending'); io.unobserve(e.target);} });
  },{rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(el){
    var r=el.getBoundingClientRect();
    if(r.top<window.innerHeight) return; // already on screen: leave visible
    el.classList.add('pending'); io.observe(el);
  });
})();

// Lightbox: any button with data-full inside a [data-gallery] group
(function(){
  var groups=document.querySelectorAll('[data-gallery]');
  if(!groups.length) return;
  var lb=document.createElement('div');
  lb.className='lb'; lb.hidden=true;
  lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Image viewer');
  lb.innerHTML='<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><button class="close" type="button">Close</button><button class="prev" type="button" aria-label="Previous image">&larr;</button><button class="next" type="button" aria-label="Next image">&rarr;</button><span class="count"></span>';
  document.body.appendChild(lb);
  var img=lb.querySelector('img'), count=lb.querySelector('.count'), items=[], idx=0, opener=null;
  function show(i){
    idx=(i+items.length)%items.length;
    var b=items[idx], t=b.querySelector('img');
    img.src=b.dataset.full; img.alt=t?t.alt:'';
    count.textContent=(idx+1)+' / '+items.length;
    lb.querySelector('.prev').hidden=lb.querySelector('.next').hidden=items.length<2;
  }
  function open(group,i,btn){ items=[].slice.call(group.querySelectorAll('button[data-full]')); opener=btn; lb.hidden=false; document.body.style.overflow='hidden'; show(i); lb.querySelector('.close').focus(); }
  function close(){ lb.hidden=true; document.body.style.overflow=''; if(opener) opener.focus(); }
  groups.forEach(function(g){
    [].forEach.call(g.querySelectorAll('button[data-full]'),function(b,i){ b.addEventListener('click',function(){open(g,i,b)}); });
  });
  lb.querySelector('.close').addEventListener('click',close);
  lb.querySelector('.prev').addEventListener('click',function(){show(idx-1)});
  lb.querySelector('.next').addEventListener('click',function(){show(idx+1)});
  lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
  document.addEventListener('keydown',function(e){
    if(lb.hidden) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') show(idx-1);
    else if(e.key==='ArrowRight') show(idx+1);
    else if(e.key==='Tab'){ // keep focus inside the viewer
      var f=[].slice.call(lb.querySelectorAll('button:not([hidden])')); var first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
})();

// Year
[].forEach.call(document.querySelectorAll('[data-year]'),function(el){el.textContent=new Date().getFullYear();});
