//Let's make another one, this time to model an essay or a blog post.
  // Note that the best way to *author* is as a single HTML string, with some basic
  // markup to highlight structure. This would be the result of a parsing of HTML
  const testDocument = {
    author: 'javajosh',
    created: '12 Dec 2019 17:00 ECT',
    place: 'Berlin, Germany',
    title: 'For Loops in JavaScript',
    canonical: 'javajosh.com/loops',
    styles: {
      base: 'font: 12pt sans-serif; line-height: 1.5em',
      heading: 'font-size: biggest',
      byline: 'font-size: smaller',
      section: 'font-size: bigger',
      p: '',
    },
    content: [
      'heading', 'For Loops in JavaScript',
      'byline', 'JBR, Berlin, 12/12/19',
      'section', 'Introduction',
        'image', {alt: 'picture of a loop', src: 'loop.png'},
        'p', 'Loops are central to programming.',
        'p', '',
      'section', 'Old School',
        'program', {id: 'oldschool', svg: 'oldschool.svg', js: 'oldschool.js'},
        'p', '',
      'section', 'New School',
        'program', {id: 'newschool', svg: 'newschool.svg', js: 'newschool.js'},
        'p', '',
      'section', 'Conclusion',
        'image', {alt: 'picture of a cat', src: 'cat.png'},
        'p', '',
    ],
  };
