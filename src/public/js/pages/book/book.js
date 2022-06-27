'use strict';

function formSubmit(infobox) {
  const isbn = document.getElementById('isbn').value;

  let checkedStar;
  if (document.getElementById('form_rating_1').checked) {
    checkedStar = 1;
  } else if (document.getElementById('form_rating_2').checked) {
    checkedStar = 2;
  } else if (document.getElementById('form_rating_3').checked) {
    checkedStar = 3;
  } else if (document.getElementById('form_rating_4').checked) {
    checkedStar = 4;
  } else if (document.getElementById('form_rating_5').checked) {
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

function deleteReview(ratingBox, errorInfoBox) {
  const isbn = document.getElementById('isbn').value;

  ratingBox.classList.add('sbr-review-comment-user-deleting');
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      new Common.Collapse(ratingBox, {
        hide: true
      });
      const userReviewHrElement = document.getElementById('user_review_hr');
      if (userReviewHrElement != null) {
        userReviewHrElement.remove();
      }
    } else if (this.readyState == 4) {
      ratingBox.classList.remove('sbr-review-comment-user-deleting');
      Common.CommonUI.errorMessage(errorInfoBox, this.responseText);
    }
  };

  xhttp.open('POST', config.siteUrl + '/books/delete-review/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    isbn: isbn
  };
  xhttp.send(JSON.stringify(data));
}

document.getElementById('review_form_container').addEventListener('show.bs.collapse', function() {
  if (!Common.Account.checkLogin()) {
    window.location.href = config.siteUrl + '/account/log-in/';
    return;
  }
});

document.getElementById('review_form').addEventListener('submit', function(event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});

if (document.getElementById('delete_review') != null) {
  document.getElementById('delete_review').addEventListener('click', function(event) {
    deleteReview(document.getElementById('user_review'),
      document.getElementById('review_delete_error_info'));
  });
}