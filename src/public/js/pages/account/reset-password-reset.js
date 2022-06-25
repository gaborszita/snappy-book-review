'use strict';

function formSubmit(infobox) {
  const passwordRegex = /(?=.*\d)(?=.*[a-zA-Z]).{8,20}/;
  const password = document.getElementById('password_input').value;
  if (password.length === 0) {
    Common.CommonUI.errorMessage(infobox, 'Password required.')
    return;
  }
  if (!password.match(passwordRegex)) {
    Common.CommonUI.errorMessage(infobox, 'Password invalid. (Please check password constraints.)');
    return;
  }
  const verifypassword = document.getElementById('verify_password_input').value;
  if (password !== verifypassword) {
    Common.CommonUI.errorMessage(infobox, 'Passwords do not match.');
    return;
  }

  const params = new URLSearchParams(location.search);
  const email = params.get('email');
  const hash = params.get('hash');

  if (email == null || email === '' 
    || hash == null || hash === '') {
    Common.CommonUI.errorMessage(infobox, 'Invalid URL');
  }

  Common.CommonUI.loadingIcon(infobox);

  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      Common.CommonUI.successMessage(infobox, this.responseText);
    }
    else if (this.readyState == 4) {
      Common.CommonUI.errorMessage(infobox, this.responseText);
    }
  };
  xhttp.open('POST', config.siteUrl + '/account/reset-password-reset/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    email: email,
    password: password,
    hash: hash
  }
  xhttp.send(JSON.stringify(data));
}

document.getElementById('reset_password_reset_form').addEventListener('submit',
  function (event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});