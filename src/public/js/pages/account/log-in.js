'use strict';

function formSubmit(infobox) {
  const email = document.getElementById('email_input').value;
  if (email === '') {
    Common.CommonUI.errorMessage(infobox, 'Email is required.');
    return;
  }
  const password = document.getElementById('password_input').value;
  if (password === '') {
    Common.CommonUI.errorMessage(infobox, 'Password is required.');
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
  xhttp.open('POST', config.siteUrl + '/account/log-in/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    email: email,
    password: password
  }
  xhttp.send(JSON.stringify(data));
}

document.getElementById('login_form').addEventListener('submit',
  function (event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});