// Content-aware presentation: original source nodes remain the unit of copy.
// This layer assigns hierarchy, relationships and action ownership without rewriting.
const slugId = value => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

export function refinePresentation($, page) {
  const pageId = slugId(page.slug || 'home');
  $('body').attr('data-page', pageId);
  const source = id => $(`[data-page-source="${id}"], [data-source-id="${id}"]`).first();
  const retag = (element, tag, cls) => {
    if (!element.length) return;
    const replacement = $(`<${tag}></${tag}>`).html(element.html());
    if (cls) replacement.addClass(cls);
    element.replaceWith(replacement);
  };
  const action = (element, variant, owner) => {
    element.removeClass('cta--primary cta--secondary cta--text').addClass(`cta cta--${variant}`).attr('data-cta-owner', owner);
    element.closest('.page-actions, .acgx-cta').attr('data-action-group', owner);
  };
  // Word-processing formatting must not determine vertical rhythm.
  $('main p, footer p').each((i, e) => {
    const p = $(e);
    if (p.is('[role="status"], [aria-live]')) return;
    if (!p.text().trim() && !p.find('img,iframe').length) { p.replaceWith(' '); return; }
    p.find('br').get().reverse().forEach(br => {
      const next = br.nextSibling;
      if (!next || (next.type === 'text' && !next.data.trim() && !next.nextSibling)) $(br).remove();
    });
  });

  // Every section has a stable identity; labels never compete with its message.
  $('main > section').each((i, e) => {
    const section = $(e);
    if (!section.attr('id')) section.attr('id', `${pageId}-section-${i + 1}`);
    // Heading IDs are assigned once below, after heading promotion/regrouping.
  });
  $('.page-intro').addClass('section-introduction');
  $('.page-intro > .wrap > .page-block').eq(1).addClass('page-lead');
  $('.page-actions a').each((i, e) => action($(e), 'secondary', $(e).closest('section').attr('id')));
  $('.acgx-cta a').each((i, e) => action($(e), 'text', $(e).closest('section').attr('id')));
  $('.nav-contact').addClass('cta cta--primary').attr('data-cta-owner', 'navigation');
  $('.mission-close .action a').addClass('cta cta--primary').attr('data-cta-owner', 'home-mission');
  $('a[data-official-form]').each((i, e) => action($(e), 'primary', $(e).closest('section').attr('id')));

  if (!page.slug) {
    // The statement explains the problem; it is not a disclosure control.
    const context = $('.challenge-context');
    context.find('summary .source-block').insertBefore(context.find('summary'));
    context.find('summary').remove();
    retag(context, 'div', 'challenge-context challenge-explanation');
    retag(source('02b31bd').find('h2'), 'p', 'eyebrow');
    retag(source('bd9c825').find('h3'), 'h2');
    retag(source('f429f26').find('h2'), 'p', 'eyebrow');
    const statement = source('eab1325');
    statement.find('p').first().each((i, e) => retag($(e), 'h2'));
    $('.hero-cta').appendTo('.hero-context').addClass('cta cta--primary').attr('data-cta-owner', 'home-section-1');
    $('.challenge-explanation > .copy').last().addClass('challenge-reasons');
    $('.mission-close').attr('id', 'home-mission').addClass('section-conclusion');
  }

  if (page.slug === 'who-we-are') {
    $('.page-intro .page-actions').appendTo('.page-intro > .wrap');
    $('.editorial-row').each((i, e) => {
      const row = $(e).attr('id', `who-we-are-evidence-${i + 1}`).addClass('evidence-row');
      const label = row.children().first().find('h2');
      retag(label, 'p', 'eyebrow');
      row.children().eq(1).find('h3').first().each((j, h) => retag($(h), 'h2'));
      row.find('.page-actions').appendTo(row).addClass('row-actions');
      row.find('a').each((j, a) => action($(a), 'text', row.attr('id')));
    });
    $('.platform-section').addClass('comparison-section');
    $('.acgx-stage').removeAttr('aria-roledescription').removeAttr('role');
    $('.acgx-card').removeAttr('aria-roledescription').removeAttr('aria-label');
    $('.acgx-card').each((i, e) => {
      const panel = $(e).attr('id', `platform-comparison-${i + 1}`);
      panel.find('a').each((j, a) => action($(a), 'text', panel.attr('id')));
    });
    source('1de6558').closest('section').addClass('evidence-section');
  }

  if (page.slug === 'what-we-do') {
    $('.process-section').attr('aria-label', 'What ACG does').addClass('gate-process');
    $('.steps__grid').closest('section').addClass('work-process');
    const closing = source('3603959').closest('section');
    closing.addClass('model-invitation');
    closing.find('.page-actions').appendTo(closing.children('.wrap')).addClass('section-actions');
    closing.find('a').each((i, a) => action($(a), 'secondary', closing.attr('id')));
  }

  if (page.slug === 'victory-district') {
    source('537ede8').addClass('operating-requirements');
    source('7e9cd87').closest('.editorial-row').addClass('pipeline-explanation');
    source('6fd0be5').closest('section').addClass('adaptation-section');
    source('55097c5').closest('section').addClass('district-model');
    $('.vertical-grid').not('.stakeholders').addClass('model-verticals');
    source('4977219').closest('.editorial-row').addClass('model-outcomes');
    source('439e846').addClass('model-conclusion');
    $('.stakeholders').addClass('stakeholder-mapping');
    $('.stakeholder-mapping article').each((i, e) => {
      const row = $(e);
      row.find('.elementor-icon-box-wrapper').addClass('value-row');
    });
    source('0ff58c7').find('a').each((i, a) => action($(a), 'primary', $(a).closest('section').attr('id')));
  }

  if (page.slug === 'our-team') {
    const index = $('<div class="section-index" role="navigation" aria-label="Our Team sections"></div>');
    $('#team-menu .submenu a').each((i, e) => index.append($(e).clone().removeAttr('aria-current')));
    $('.page-intro .wrap').append(index);
    $('.leader-section').each((i, e) => {
      const section = $(e), layout = section.find('.leader-layout');
      section.addClass('leadership-chapter');
      layout.find('.prose > .page-block').eq(1).addClass('person-role');
      layout.find('.prose > .page-block').eq(2).addClass('biography-copy');
      const reference = layout.find('.prose > .page-block').last();
      $('<div class="biography-reference"></div>').append(reference).appendTo(layout.find('.prose'));
    });
    // Only supplementary career history uses disclosure, following the source's
    // original read-more intent. Identity and principal experience stay visible.
    for (const [id, keep] of [['cb4e749', 2], ['44b3e25', 3]]) {
      const block = source(id), paragraphs = block.find('p').filter((i,e)=>$(e).text().trim());
      if (paragraphs.length <= keep) continue;
      const more = $('<details class="biography-more"><summary><span data-interface-copy>Read more</span></summary><div class="biography-history"></div></details>');
      paragraphs.slice(keep).appendTo(more.find('.biography-history'));
      block.append(more);
    }
    $('.people-section').each((i, e) => {
      const intro = $(e).find('.wrap > .prose').first().addClass('group-intro');
      const block = intro.children('.page-block');
      const paragraphs = block.children('p').filter((j,p)=>$(p).text().trim());
      if (paragraphs.length < 3) return;
      const lead = $('<div class="group-lead"></div>').append(paragraphs.first());
      const purpose = $('<div class="group-purpose"></div>').append(paragraphs.eq(1));
      const remit = $('<div class="group-remit"></div>').append(paragraphs.slice(2));
      block.empty().append(lead, purpose, remit);
    });
    $('.person').each((i, e) => {
      $(e).find('.page-block').eq(1).addClass('person-name');
      $(e).find('.page-block').last().addClass('person-role');
      $(e).find('a').addClass('person-link');
    });
  }

  if (page.slug.startsWith('our-team/')) {
    $('body').addClass('profile-page');
    const copy = $('.leader-layout .prose');
    copy.find('p').first().addClass('profile-role');
    const biography = $('<div class="profile-biography"></div>');
    copy.contents().filter((i,e)=>!$(e).hasClass('profile-role')).appendTo(biography);
    copy.append(biography);
    copy.find('a').filter((i,e)=>/read more/i.test($(e).text())).each((i,e)=>{
      $(e).addClass('profile-reference');
      $(e).find('br').remove();
      const group=$('<div class="profile-reference-group"></div>');
      $(e).appendTo(group);biography.append(group);
      action($(e),'text',$(e).closest('section').attr('id'));
    });
    biography.find('p,span').each((i,e)=>{if(!$(e).text().trim()&&!$(e).find('img').length)$(e).remove();});
    $('.leader-layout').addClass('profile-layout');
  }

  if (page.slug === 'acg-news') {
    $('.news-grid').addClass('news-archive');
    $('.news-card').first().addClass('news-feature');
    $('.news-card a').addClass('story-link');
  }
  if ($('.article-body').length) {
    $('body').addClass('story-page');
    const content = $('.article-prose');
    content.find('img').filter((i,e)=>/acg[-_\s]*logo|Group-148340\.png/i.test($(e).attr('src'))).addClass('article-brand-asset');
    content.find('p').filter((i,p)=>$(p).text().trim()).first().addClass('article-lead');
    content.find('p').each((i,e)=>{
      const p=$(e),bold=p.children('strong,b');
      if (p.text().trim().startsWith('“') && p.text().includes('”')) retag(p,'blockquote','article-quotation');
      else if (bold.length && p.text().trim()===bold.text().trim() && p.text().length<140 && !p.find('img,a').length) retag(p,'h2','article-subheading');
      else if (/^(Media contact:|About African Collaborations Group|Distributed by APO Group)/.test(p.text().trim())) p.addClass('article-reference');
    });
    $('.article-body > .wrap > .text-link').wrap('<div class="article-exit"></div>');
  }
  if (page.slug === 'contact-us') {
    $('.contact-page').addClass('contact-destination');
    $('.contact-page .page-actions').addClass('section-actions');
  }
  // Form invitations are a single coherent closing block on their owner pages.
  $('[data-page-source="contact-intro"]').closest('section').addClass('contact-conclusion');
  $('[data-contact-form]').each((i,e)=>{
    const form=$(e),owner=form.closest('section').attr('id');
    form.find('button').each((j,button)=>action($(button),j===0?'primary':'secondary',owner));
  });

  // Recompute accessible section titles after semantic heading adjustments.
  $('main > section').each((i,e)=>{
    const s=$(e),h=s.find('h1,h2').first();
    if(h.length){if(!h.attr('id'))h.attr('id',s.attr('id')+'-heading');s.attr('aria-labelledby',h.attr('id'));}
  });
}
