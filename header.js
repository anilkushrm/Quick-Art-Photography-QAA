(() => {
 const header=document.getElementById('qaaHeader');if(!header?.classList.contains('ref-header'))return;
 // Keep shared navigation consistent across the static course pages.
 const online=header.querySelector('#ref-online');
 const album=header.querySelector('#ref-courses a[href*="album-design"]');
 if(online&&album){
  const label='Video Editing Course <small class="ref-ai-label">AI Powered</small>';
  online.querySelector('#ref-online-tab-0').innerHTML='<span class="ref-category-label">'+label+'</span><span aria-hidden="true">›</span>';
  online.querySelector('#ref-online-panel-0 h2').innerHTML=label;
  const design=online.querySelector('#ref-online-panel-2');
  const marketing=design.cloneNode(true);marketing.id='ref-online-panel-3';marketing.setAttribute('aria-labelledby','ref-online-tab-3');marketing.querySelector('h2').textContent='Digital Marketing';
  design.after(marketing);
  design.querySelector('h2').textContent='Graphics Design Course';design.querySelector('.ref-card-grid').replaceChildren(album.cloneNode(true));
  const tab=online.querySelector('#ref-online-tab-2');tab.innerHTML='Graphics Design Course<span aria-hidden="true">›</span>';
  const next=tab.cloneNode(true);next.id='ref-online-tab-3';next.setAttribute('aria-controls','ref-online-panel-3');next.innerHTML='Digital Marketing<span aria-hidden="true">›</span>';tab.after(next);
  const mobileOnline=header.querySelector('#ref-mobile details');
  const groups=mobileOnline.querySelectorAll('.ref-mobile-group');
  if(groups[0])groups[0].innerHTML=label;
  if(groups[2]){groups[2].textContent='Graphics Design Course';const card=album.cloneNode(true);groups[2].after(card);const heading=document.createElement('p');heading.className='ref-mobile-group';heading.textContent='Digital Marketing';card.after(heading);}
  const marketingCard=marketing.querySelector('a[href*="digital-marketing-course/"]');
  const marketingCards=['Google and Facebook Ads Course','SEO Course','GMB Profile Course'].map((title,i)=>{const card=marketingCard.cloneNode(true);card.querySelector('.ref-course-icon').textContent=['Ads','SEO','GMB'][i];card.querySelector('span:last-child').textContent=title;return card;});
  marketing.querySelector('.ref-card-grid').replaceChildren(...marketingCards);
  const oldMobileMarketing=mobileOnline.querySelector('a[href*="digital-marketing-course/"]');
  if(oldMobileMarketing){oldMobileMarketing.replaceWith(...marketingCards.map(card=>card.cloneNode(true)));}
  mobileOnline.querySelectorAll('a[href*="website-design-course/"],a[href*="automation-course/"]').forEach(card=>card.remove());
 }
 const mobileNav=header.querySelector('#ref-mobile');
 const campus=header.querySelector('#ref-courses');
 if(campus){
  const video=campus.querySelector('a[href*="courses/video-editing/"]').cloneNode(true);
  const graphics=campus.querySelector('a[href*="album-design/"]').cloneNode(true);
  const wedding=campus.querySelector('a[href*="ai-wedding-filmmaking/"]').cloneNode(true);
  video.querySelector('span:last-child').innerHTML='Video Editing Course<small class="ref-ai-label">AI Powered</small>';
  graphics.querySelector('span:last-child').textContent='Wedding Album Design';
  wedding.querySelector('span:last-child').textContent='Wedding Filmmaking Course';
  const categories=campus.querySelector('.ref-categories'),panels=campus.querySelector('.ref-panels');
  categories.replaceChildren();panels.replaceChildren();
  const aiMarketing=wedding.cloneNode(true);aiMarketing.querySelector('span:last-child').textContent='AI Marketing Course (Free)';aiMarketing.querySelector('.ref-course-icon').textContent='AI';
  const entries=[['Video Editing Course',video,true],['Graphics Design',graphics,false],['Wedding Filmmaking Course',wedding,false],['AI Marketing Course (Free)',aiMarketing,false]];
  entries.forEach(([name,card,ai],i)=>{
   const tab=document.createElement('button');tab.type='button';tab.id='ref-courses-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','ref-courses-panel-'+i);tab.setAttribute('aria-selected',String(i===0));tab.tabIndex=i===0?0:-1;
   tab.innerHTML='<span class="ref-category-label">'+name+(ai?'<small class="ref-ai-label">AI Powered</small>':'')+'</span><span aria-hidden="true">›</span>';categories.append(tab);
   const panel=document.createElement('div');panel.id='ref-courses-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=i!==0;
   const heading=document.createElement('h2');heading.textContent=name;const grid=document.createElement('div');grid.className='ref-card-grid';grid.append(card);panel.append(heading,grid);panels.append(panel);
  });
  const mobileCampus=[...mobileNav.querySelectorAll('details')].find(d=>d.querySelector('summary').textContent.trim()==='On Campus Programs');
  if(mobileCampus){const summary=mobileCampus.querySelector('summary');mobileCampus.replaceChildren(summary,video.cloneNode(true));const heading=document.createElement('p');heading.className='ref-mobile-group';heading.textContent='Graphics Design';mobileCampus.append(heading,graphics.cloneNode(true),wedding.cloneNode(true),aiMarketing.cloneNode(true));}
 }
 const contact=header.querySelector('.ref-nav>a[href*="contact-us"]');
 if(mobileNav&&contact){const cta=document.createElement('a');cta.className='ref-demo-cta';cta.href=contact.href;cta.textContent='Book Free Demo Class';mobileNav.append(cta);}
 const drops=[...header.querySelectorAll('.ref-dropdown')];
 header.querySelectorAll('#ref-online-tab-1,#ref-online-panel-1 h2,#ref-mobile .ref-mobile-group').forEach(label=>{
  if(label.textContent.replace('›','').trim()!=='Wedding Filmmaking')return;
  if(label.id==='ref-online-tab-1')label.firstChild.textContent='Wedding Filmmaking Course';
  else label.textContent='Wedding Filmmaking Course';
 });
 const appLink=document.createElement('a');appLink.href='https://play.google.com/store/apps/details?id=com.lmwkkjh799.classes&hl=en';appLink.target='_blank';appLink.rel='noopener noreferrer';appLink.textContent='Download Our App';
 const resources=header.querySelector('#ref-resources');if(resources)resources.append(appLink);
 const mobileResources=[...header.querySelectorAll('#ref-mobile details')].find(detail=>detail.querySelector('summary')?.textContent.trim()==='Free Resources');if(mobileResources)mobileResources.append(appLink.cloneNode(true));
 header.querySelectorAll('.ref-ai-label').forEach(label=>label.classList.add('ref-highlight-badge'));
 header.querySelectorAll('#ref-courses .ref-category-label,#ref-courses h2,#ref-mobile .ref-mobile-group').forEach(label=>{
  if(label.textContent.trim()!=='Graphics Design')return;
  const note=document.createElement('small');note.className='ref-highlight-badge ref-course-update';note.textContent='Updated Course';label.append(note);
 });
 header.querySelectorAll('#ref-online-tab-2,#ref-online-panel-2 h2,#ref-mobile .ref-mobile-group').forEach(label=>{
  if(!label.textContent.startsWith('Graphics Design Course'))return;
  const update=document.createElement('small');update.className='ref-highlight-badge ref-updated-label';update.textContent='Updated';
  if(label.id==='ref-online-tab-2'){const title=document.createElement('span');title.className='ref-category-label';title.textContent='Graphics Design Course';title.append(update);label.replaceChild(title,label.firstChild);}else label.append(update);
 });
 header.querySelectorAll('#ref-courses .ref-category-label,#ref-courses h2,#ref-courses .ref-course>span:last-child,#ref-mobile .ref-course>span:last-child').forEach(label=>{
  if(label.textContent.trim()==='AI Marketing Course (Free)'){
   label.replaceChildren(document.createTextNode('AI Marketing Course '));
   const badge=document.createElement('small');badge.className='ref-highlight-badge ref-free-badge';badge.textContent='Free';label.append(badge);
  }
 });
 function set(drop,open){const button=drop.querySelector('.ref-toggle');const panel=document.getElementById(button.getAttribute('aria-controls'));button.setAttribute('aria-expanded',String(open));panel.hidden=!open;}
 function closeAll(){drops.forEach(d=>set(d,false));}
 drops.forEach(drop=>{
  const toggle=drop.querySelector('.ref-toggle');
  let closeTimer;
  drop.addEventListener('pointerenter',event=>{
   if(event.pointerType!=='mouse'||!matchMedia('(min-width:1151px)').matches)return;
   clearTimeout(closeTimer);closeAll();set(drop,true);
  });
  drop.addEventListener('pointerleave',event=>{
   if(event.pointerType!=='mouse')return;
   closeTimer=setTimeout(()=>{if(!drop.contains(document.activeElement))set(drop,false);},180);
  });
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';closeAll();set(drop,open);});
  drop.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();set(drop,false);toggle.focus();}});
  drop.addEventListener('focusout',event=>{if(!drop.contains(event.relatedTarget))set(drop,false);});
  const tabs=[...drop.querySelectorAll('[role=tab]')];
  function select(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')select(tab);});tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown')next=(i+1)%tabs.length;else if(event.key==='ArrowUp')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(tabs[next]);tabs[next].focus();});});
 });
 const menu=header.querySelector('#ref-mobile'),button=header.querySelector('.ref-menu-button');
 const drawerBody=document.createElement('div');drawerBody.className='ref-drawer-body';
 const drawerActions=document.createElement('div');drawerActions.className='ref-drawer-actions';
 const demo=menu.querySelector('.ref-demo-cta');
 const login=header.querySelector('.ref-login').cloneNode(true);drawerActions.append(login);if(demo)drawerActions.append(demo);
 while(menu.firstChild)drawerBody.append(menu.firstChild);menu.append(drawerBody,drawerActions);
 const backdrop=document.createElement('div');backdrop.className='ref-drawer-backdrop';backdrop.hidden=true;header.insertBefore(backdrop,menu);
 const oldOverflow=document.body.style.overflow;
 function drawerState(open){backdrop.hidden=!open;document.body.style.overflow=open?'hidden':oldOverflow;}
 backdrop.addEventListener('click',closeMobile);
 menu.querySelectorAll('details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)menu.querySelectorAll('details').forEach(other=>{if(other!==detail)other.open=false;});}));
 function closeMobile(){menu.hidden=true;drawerState(false);button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');}
 button.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;drawerState(open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');closeAll();});
 header.addEventListener('keydown',event=>{if(event.key!=='Tab'||menu.hidden)return;const items=[button,...menu.querySelectorAll('a,summary,button')].filter(el=>el.getClientRects().length);const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
 header.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){closeMobile();button.focus();}});
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMobile));
 document.addEventListener('click',event=>{if(!header.contains(event.target)){closeAll();closeMobile();}});
 matchMedia('(min-width:1151px)').addEventListener('change',()=>{closeAll();closeMobile();});
})();
