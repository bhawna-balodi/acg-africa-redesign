// Visual explanations use existing facts and imagery. Source copy stays in place.
export function addStorytelling($, page, assets) {
  const original = suffix => {
    const match=assets.find(a=>a.source.endsWith(suffix));
    if(!match)throw Error('Missing approved image: '+suffix);
    return match.local;
  };
  const stadium=original('/pexels-furknsaglam-1596977-3131406-1.png');
  const district=original('/Group-148227.png');
  const aerial=original('/Group-253-1.png');
  const logo=original('/Group-148336.png');
  const photo=(src,cls,alt='')=>`<figure class="story-picture ${cls}" data-reveal="picture"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></figure>`;
  const flow=(cls,path)=>`<svg class="flow-drawing ${cls}" viewBox="0 0 1000 360" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path data-flow-line pathLength="1" d="${path}"/></svg>`;
  const source=id=>$(`[data-page-source="${id}"], [data-source-id="${id}"]`).first();

  $('body').addClass('storytelling-site');
  $('.hero-context').addClass('glass-panel');
  $('.hero-detail').addClass('story-picture');
  $('.hero-image,.page-cover').attr({'data-reveal':'picture'}).addClass('story-picture');
  $('.section-index').addClass('glass-navigation');

  if(!page.slug){
    // Each failure point has its own approved photograph. Store the association
    // on the existing rows; retain the single, fixed-size image frame.
    const challengeImages=[
      [district,'Sports infrastructure within an urban district'],
      [original('/Group-148230.png'),'Stadium seating and playing field beneath a structural roof'],
      [aerial,'Aerial view of a stadium roof, facade and surrounding grounds'],
      [original('/Group-253.png'),'Stadium roof structure and spectator stands seen from above']
    ];
    $('#failure-track').children().each((i,e)=>{
      $(e).attr({'data-image-src':challengeImages[i][0],'data-image-alt':challengeImages[i][1]});
    });
    const prose=source('9c4c1ed').text();
    if(!/25 to 30/.test(prose)||!/335 to 340/.test(prose))throw Error('Utilisation source ranges changed.');
    const graphic=$(`<figure class="utilisation-graphic" data-reveal="diagram" aria-label="The original annual stadium utilisation ranges">
      <div class="range-row"><div class="range-caption"><strong>25 to 30</strong><span>event days a year</span></div><div class="range-track" aria-hidden="true"><span class="range-solid" style="--range:6.8493%"></span><span class="range-bound" style="--range:8.2192%"></span></div></div>
      <div class="range-row"><div class="range-caption"><strong>335 to 340</strong><span>days the lights are off</span></div><div class="range-track" aria-hidden="true"><span class="range-solid" style="--range:91.7808%"></span><span class="range-bound" style="--range:93.1507%"></span></div></div>
    </figure>`);
    graphic.insertAfter(source('9c4c1ed'));
    $('.why-image').attr('data-reveal','picture').addClass('story-picture');
    $('.why-section').addClass('utilisation-chapter');
    $('.challenge-section').addClass('challenge-chapter');
    $('.challenge-image,.mission-image').attr('data-reveal','picture').addClass('story-picture');
    $('.mission-close').addClass('mission-finale');
  }

  if(page.slug==='who-we-are'){
    const rows=$('.evidence-row');
    rows.eq(0).addClass('provenance-feature').prepend(photo(stadium,'evidence-picture','Stadium structure and spectator stands'));
    rows.eq(1).addClass('consortium-feature');
    const labels=['strategy','masterplanning','feasibility','finance advisory','venue operations','ESG and safeguards'];
    const map=$(`<figure class="collaboration-map" data-reveal="diagram" aria-label="ACG delivery consortium disciplines">${flow('collaboration-lines','M500 180 L166 60 M500 180 L500 60 M500 180 L834 60 M500 180 L166 300 M500 180 L500 300 M500 180 L834 300')}<div class="collaboration-hub"><img src="${logo}" alt="ACG" loading="lazy"></div><ul>${labels.map(label=>`<li>${label}</li>`).join('')}</ul></figure>`);
    rows.eq(1).append(map);
    const backing=source('8d4af70').text();
    if(!backing.includes('2007')||!/over 300/.test(backing))throw Error('APO backing source facts changed.');
    rows.eq(2).addClass('backing-feature').append('<figure class="backing-proof" aria-label="APO Group backing and reach"><figcaption class="eyebrow">APO Group</figcaption><div><span>founded in</span><strong>2007</strong></div><div><strong>over 300</strong><span>institutional and blue-chip clients</span></div></figure>');
    rows.eq(3).addClass('method-feature').prepend(photo(district,'method-picture','Sports infrastructure in its surrounding district'));
    const methodCopy=$('<div class="method-copy glass-panel"></div>');
    rows.eq(3).children().not('figure').appendTo(methodCopy);rows.eq(3).append(methodCopy);
    $('.comparison-section').attr('data-reveal','section');
    $('.acgx-gates').addClass('accountability-rail').attr('data-reveal','diagram');
  }

  if(page.slug==='what-we-do'){
    $('.gates__body').prepend(flow('gate-lines','M20 180 L850 180')).attr('data-reveal','diagram');
    $('.gates__track').addClass('gate-infographic');
    const work=$('.work-process'),list=work.find('.steps__grid');
    const visual=$(`<div class="work-visual">${photo(stadium,'work-picture','Stadium roof, stands and playing field')}<div class="process-status glass-panel" aria-hidden="true" data-interface-copy><span class="process-position" data-process-position>01 / 06</span><div class="process-track">${Array.from({length:6},(_,i)=>`<span data-process-marker="${i}"></span>`).join('')}</div></div></div>`);
    const layout=$('<div class="work-narrative" data-process></div>');
    list.before(layout);layout.append(visual,list);
    list.children().each((i,e)=>$(e).attr('data-process-step',String(i)));
    $('.model-invitation').prepend(photo(aerial,'invitation-picture','A stadium and its surrounding urban setting'));
    $('.model-invitation>.wrap').addClass('glass-panel');
  }

  if(page.slug==='victory-district'){
    source('537ede8').closest('section').addClass('operating-chapter');
    const adaptation=$('.adaptation-section');
    adaptation.prepend(photo(stadium,'adaptation-picture','Stadium facilities and stands'));
    adaptation.children('.wrap').addClass('glass-panel');
    const verticals=$('.model-verticals');
    const model=$('<div class="ecosystem-diagram" data-reveal="diagram"></div>');
    verticals.before(model);
    model.append(photo(district,'ecosystem-picture','Sports infrastructure integrated with its district'));
    model.append(flow('ecosystem-lines','M395 180 L430 180 M430 70 L430 290 M430 70 L458 70 M430 180 L458 180 M430 290 L458 290'));
    model.append(verticals);
    $('.stakeholder-mapping article').attr('data-reveal','value');
  }

  if(page.slug==='our-team'){
    $('.leadership-chapter').eq(1).addClass('leadership-reverse');
    $('.leadership-reverse .leader-image').addClass('portrait-stage');
    $('.leadership-reverse .person-role').addClass('role-caption');
    $('#our-research-and-impact-advisory-panel').addClass('research-index');
  }

  if($('.article-body').length){
    const picture=$('.article-photo');
    picture.addClass('story-cover story-picture').attr({'data-reveal':'picture'}).appendTo('.article-intro>.wrap');
    $('.article-intro').addClass('story-opening');
    if(/ACG[-_]Logo|Group-148340/i.test(picture.find('img').attr('src')||''))picture.addClass('brand-cover');
    $('body').append('<div class="reading-progress" aria-hidden="true"><span></span></div>');
    $('.article-quotation').attr('data-reveal','quotation');
  }

  $('.contact-conclusion').each((i,e)=>{
    const section=$(e);
    section.find('.contact-introduction').append(photo(district,'contact-editorial-picture','Sports infrastructure and urban development'));
  });
  if(page.slug==='contact-us'){
    $('.contact-destination .contact-introduction').append(photo(stadium,'contact-editorial-picture','Stadium architecture and stands'));
  }

  $('.leader-image,.profile-layout .leader-image').attr('data-reveal','picture').addClass('story-picture');
  $('.leader-image img').each((i,e)=>{
    if(!$(e).attr('alt'))$(e).attr('alt',$(e).closest('.leader-layout').find('h3').first().text()||page.title);
  });
  $('.person img').each((i,e)=>{if(!$(e).attr('alt'))$(e).attr('alt',$(e).closest('.person').find('h3').text());});
  $('.story-cover img').each((i,e)=>{if(!$(e).attr('alt'))$(e).attr('alt',page.title);});
  $('.news-feature .apoc-card__img-wrap').attr('data-reveal','picture').addClass('story-picture');
  $('.person-link .page-block:first-child,.story-link .apoc-card__img-wrap').addClass('interactive-picture');
  // These source photographs contain an oversized baked-in mark at the right.
  // Frame the unmarked photographic area, then position the original standalone
  // brand symbol independently. Original image files remain untouched.
  const brandMark=original('/cropped-Group-148232-192x192.png');
  const cornerByComposition=[
    ['hero-detail','top-right'],
    ['challenge-image','top-right'],
    ['mission-image','bottom-left'],
    ['method-picture','top-left'],
    ['invitation-picture','bottom-right'],
    ['ecosystem-picture','top-right'],
    ['contact-editorial-picture','bottom-right']
  ];
  $('.story-picture').each((i,e)=>{
    const frame=$(e),picture=frame.find('img').first();
    if(!/-(Group-208|Group-148227|Group-148230|Group-253(?:-1)?)\.png$/.test(picture.attr('src')||''))return;
    const coverCorners={'who-we-are':'top-right','what-we-do':'bottom-left','victory-district':'top-left'};
    const corner=frame.hasClass('page-cover')?coverCorners[page.slug]||'top-left':cornerByComposition.find(([name])=>frame.hasClass(name))?.[1]||'top-left';
    frame.addClass('brand-framed').attr('data-brand-corner',corner);
    picture.addClass('brand-photo');
    frame.append(`<img class="image-brand-mark" src="${brandMark}" alt="" aria-hidden="true" loading="lazy" decoding="async">`);
  });
  $('main>section').each((i,e)=>{
    const section=$(e);
    if(!section.is('[data-reveal]'))section.find('h2').first().attr('data-reveal','heading');
    section.attr('data-composition',section.hasClass('page-intro')?'opening':section.hasClass('contact-conclusion')?'invitation':section.hasClass('research-index')?'research-index':section.hasClass('people-section')?'portrait-directory':section.hasClass('leadership-reverse')?'portrait-right':section.hasClass('leadership-chapter')?'portrait-left':section.hasClass('gate-process')?'gate-diagram':section.hasClass('work-process')?'guided-process':section.hasClass('model-invitation')?'image-invitation':section.hasClass('district-model')?'ecosystem':section.hasClass('adaptation-section')?'image-statement':section.hasClass('evidence-section')?'evidence-story':section.hasClass('comparison-section')?'comparison':section.hasClass('utilisation-chapter')?'utilisation':section.hasClass('challenge-chapter')?'challenge':section.hasClass('mission-section')?'mission':section.hasClass('source-hero')?'hero':section.hasClass('article-related')?'related-stories':section.hasClass('article-navigation')?'story-navigation':section.hasClass('article-body')?'reading':section.hasClass('profile-page')?'profile':'editorial');
  });
}
