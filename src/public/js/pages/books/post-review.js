'use strict';

if (!Common.Account.checkLogin()) {
  window.location.href = config.siteUrl + '/account/log-in/';
}
let isbnValid = false;
function isbnValidator(infobox) {
  Common.CommonUI.loadingIcon(infobox);
  isbnValid = false;
  const isbn = document.getElementById('isbn').value.trim().replace(/-/g, '');
  if (isbn==='') {
    Common.CommonUI.errorMessage(infobox, 'Please enter ISBN.');
    return;
  } else if (isNaN(Number(isbn))) {
    Common.CommonUI.errorMessage(infobox, 'ISBN invalid.');
    return;
  }
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const data = JSON.parse(this.responseText);
      if (data.found) {
        Common.CommonUI.successMessage(infobox, 'Book found!<br>' +
            data.title);
        isbnValid = true;
      } else {
        Common.CommonUI.errorMessage(infobox, 'ISBN invalid.');
      }
    }
    else if (this.readyState == 4) {
      Common.CommonUI.errorMessage(infobox, 'Unknown error');
    }
  }
  xhttp.open('GET', config.siteUrl + '/books/isbn-validator/?isbn=' + isbn);
  xhttp.send();
}
function formSubmit(infobox) {
  const isbn = document.getElementById('isbn').value.trim().replace(/-/g, '');
  if (!isbnValid) {
    Common.CommonUI.errorMessage(infobox, 'ISBN invalid.');
    return;
  }

  let checkedStar;
  if (document.getElementById('rating_1').checked) {
    checkedStar = 1;
  } else if (document.getElementById('rating_2').checked) {
    checkedStar = 2;
  } else if (document.getElementById('rating_3').checked) {
    checkedStar = 3;
  } else if (document.getElementById('rating_4').checked) {
    checkedStar = 4;
  } else if (document.getElementById('rating_5').checked) {
    checkedStar = 5;
  } else {
    Common.CommonUI.errorMessage(infobox, 'Please select a rating.');
    return;
  }

  let comment = document.getElementById('comment_text_area').value;
  if (comment === '') {
    comment = null;
  }
  Common.CommonUI.loadingIcon(infobox);

  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      Common.CommonUI.successMessage(infobox, this.responseText);
    } else if (this.readyState == 4) {
      Common.CommonUI.errorMessage(infobox, this.responseText);
    }
  };

  xhttp.open('POST', config.siteUrl + '/books/post-review/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    isbn: isbn,
    rating: checkedStar,
    comment: comment
  };
  xhttp.send(JSON.stringify(data));
}

document.getElementById('isbn').addEventListener('keyup', function() {
  isbnValidator(document.getElementById('isbn_validator_response_field'));
});

document.getElementById('review_form').addEventListener('submit',
                                                        function(event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});