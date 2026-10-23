// Build-time cleanup shared by every route. Preserve layout/source carriers;
// only remove wrappers whose sole purpose is already served by their parent.
export function normalizeSemantics($) {
  const rename = (element, tag) => { element.each((i,e) => { e.name = tag; }); return element; };
  rename($('.section-index'), 'nav').removeAttr('role');
  rename($('.article-navigation'), 'nav').attr('aria-label', 'Article navigation');
  const title = $('.article-intro h1');
  if (title.length) rename($('.article-body'), 'article').attr('aria-labelledby', title.attr('id'));
  rename($('.article-photo'), 'figure');

  $('.leader-image').each((i,e) => {
    const frame = rename($(e), 'figure');
    const source = frame.children('.page-block[data-page-source]');
    if (frame.children().length === 1 && source.length === 1 && source.children().length === 1 && source.children().is('img')) {
      frame.attr('data-page-source', source.attr('data-page-source'));
      source.replaceWith(source.contents());
    }
  });
  // Elementor adds an anonymous button wrapper inside an existing action group.
  $('.source-block.action > div').each((i,e) => {
    if (!Object.keys(e.attribs).length && $(e).children().length === 1 && $(e).children().is('a')) $(e).replaceWith($(e).contents());
  });
  $('#failure-track,.sequence-controls').attr('role', 'group');

  // Empty source anchors are invisible duplicate stops, not usable controls.
  $('a[href]').each((i,e) => {
    const link = $(e);
    if (!link.text().trim() && !link.is('[aria-label],[aria-labelledby]') && !link.find('img,svg,picture,video,canvas').length) link.replaceWith(link.contents());
  });
  // Related-story thumbnails have separate text links. Reuse their published
  // heading as the accessible name instead of inventing labels or visible copy.
  $('.elementor-post').each((i,e) => {
    const story = $(e), heading = story.find('h2,h3,h4').first();
    if (!heading.length) return;
    if (!heading.attr('id')) heading.attr('id', `related-post-title-${i + 1}`);
    story.find('.elementor-post__thumbnail__link').attr('aria-labelledby', heading.attr('id'));
  });
}
