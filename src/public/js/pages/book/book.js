'use strict';

function reviewFormSubmit(infobox) {
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

  ratingBox.classList.add('sbr-review-summary-comment-user-deleting');
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
      ratingBox.classList.remove('sbr-review-summary-comment-user-deleting');
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

function summaryFormSubmit(infobox) {
  const isbn = document.getElementById('isbn').value;

  let summary = document.getElementById('summary_text_area').value;
  if (summary === '') {
    Common.CommonUI.errorMessage(infobox, 'Summary cannot be empty!');
    return;
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

  xhttp.open('POST', config.siteUrl + '/books/post-summary/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    isbn: isbn,
    summary: summary
  };
  xhttp.send(JSON.stringify(data));
}

function deleteSummary(summaryBox, errorInfoBox) {
  const isbn = document.getElementById('isbn').value;

  summaryBox.classList.add('sbr-review-summary-comment-user-deleting');
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      new Common.Collapse(summaryBox, {
        hide: true
      });
      const userSummaryHrElement = document.getElementById('user_summary_hr');
      if (userSummaryHrElement != null) {
        userSummaryHrElement.remove();
      }
    } else if (this.readyState == 4) {
      summaryBox.classList.remove('sbr-review-summary-comment-user-deleting');
      Common.CommonUI.errorMessage(errorInfoBox, this.responseText);
    }
  };

  xhttp.open('POST', config.siteUrl + '/books/delete-summary/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    isbn: isbn
  };
  xhttp.send(JSON.stringify(data));
}

document.getElementById('review_form_container').addEventListener(
    'show.bs.collapse', function() {
  if (!Common.Account.checkLogin()) {
    window.location.href = config.siteUrl + '/account/log-in/';
    return;
  }
});

document.getElementById('review_form').addEventListener('submit',
                                                        function(event) {
  event.preventDefault();
  reviewFormSubmit(document.getElementById('review_form_submit_info'));
});

if (document.getElementById('delete_review') != null) {
  document.getElementById('delete_review').addEventListener('click',
                                                            function() {
    deleteReview(document.getElementById('user_review'),
      document.getElementById('review_delete_error_info'));
  });
}

document.getElementById('summary_form').addEventListener('submit',
                                                         function(event) {
  event.preventDefault();
  summaryFormSubmit(document.getElementById('summary_form_submit_info'))
});

if (document.getElementById('delete_summary') != null) {
  document.getElementById('delete_summary').addEventListener('click',
      function() {
        deleteSummary(document.getElementById('user_summary'),
            document.getElementById('summary_delete_error_info'));
      });
}