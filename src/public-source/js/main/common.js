'use strict';

export * from './collapse.js';
export * from './commonUI.js';
export * from './account.js';

document.body.style.background = 'url(\'' + config.siteUrl +
    '/img/lotsofbooksbackground.jpg\')';

document.getElementById('search_form').addEventListener('submit',
                                                        function(event) {
  if (document.getElementById('search_input').value === '') {
    event.preventDefault();
  }
});