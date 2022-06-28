'use strict';

document.getElementById('home_search_form').addEventListener('submit',
                                                             function(event) {
  if (document.getElementById('home_search_input').value === '') {
    event.preventDefault();
  }
});