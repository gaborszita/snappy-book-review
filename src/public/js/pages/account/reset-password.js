'use strict';

function formSubmit(infobox) {
  const email = document.getElementById('email_input').value;
  if (email === '') {
    Common.CommonUI.errorMessage(infobox, 'Email is required.');
    return;
  }
  const emailRegex = new RegExp([
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|',
    '(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|',
    '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
  ].join(''));
  if (!email.match(emailRegex) || email.length > 254) {
    if (email.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Email adress invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Email adress required.');
    }
    return;
  }
  Common.CommonUI.loadingIcon(infobox);
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      Common.CommonUI.successMessage(infobox, this.responseText);
      Common.Account.checkLogin();
    }
    else if (this.readyState == 4) {
      Common.CommonUI.errorMessage(infobox, this.responseText);
    }
  };
  xhttp.open('POST', config.siteUrl + '/account/reset-password/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    email: email
  }
  xhttp.send(JSON.stringify(data));
}

document.getElementById('reset_password_form').addEventListener('submit',
  function (event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});