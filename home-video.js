document.addEventListener('DOMContentLoaded',()=>{
  const links=[...document.querySelectorAll('a[href*="youtube.com/watch"]')].filter(a=>a.closest('#main-content'));
  if(!links.length)return;
  const modal=document.createElement('div'); modal.className='qaa-video-modal'; modal.hidden=true;
  modal.innerHTML='<div class="qaa-video-backdrop"></div><div class="qaa-video-dialog" role="dialog" aria-modal="true" aria-label="Student story video"><button class="qaa-video-close" type="button" aria-label="Close video">×</button><div class="qaa-video-frame"></div></div>';
  document.body.append(modal);
  const frame=modal.querySelector('.qaa-video-frame');
  const close=()=>{modal.hidden=true;frame.innerHTML='';document.body.classList.remove('qaa-video-open')};
  modal.querySelector('.qaa-video-close').addEventListener('click',close);
  modal.querySelector('.qaa-video-backdrop').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  links.forEach(link=>link.addEventListener('click',e=>{
    e.preventDefault(); const id=new URL(link.href).searchParams.get('v'); if(!id)return;
    const origin=encodeURIComponent(location.origin);
    frame.innerHTML='<iframe src="https://www.youtube.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0&origin='+origin+'&widget_referrer='+encodeURIComponent(location.href)+'" title="Student story video" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    modal.hidden=false;document.body.classList.add('qaa-video-open');modal.querySelector('.qaa-video-close').focus();
  }));
});
