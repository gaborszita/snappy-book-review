'use strict';

if (!Common.Account.checkLogin()) {
  window.location.href = config.siteUrl + '/account/log-in/';
}

function nameSubmit(infobox) {
  const nameregex = /^[a-zA-Z ]{1,255}$/;
  var firstName = document.getElementById('first_name_input').value;
  if (!firstName.match(nameregex)) {
    if (firstName.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'First name invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'First name required.');
    }
    return;
  }
  var lastName = document.getElementById('last_name_input').value;
  if (!lastName.match(nameregex)) {
    if (lastName.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Last name invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Last name required.');
    }
    return;
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
  xhttp.open('POST', config.siteUrl + '/account/account-settings/submit/',
             true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    setting: 'name',
    firstName: firstName,
    lastName: lastName
  };
  xhttp.send(JSON.stringify(data));
}

function emailSubmit(infobox) {
  const emailRegex = new RegExp([
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|',
    '(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|',
    '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
  ].join(''));
  const email = document.getElementById('email_input').value;
  if (!email.match(emailRegex) || email.length > 254) {
    if (email.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Email address invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Email address required.');
    }
    return;
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
  xhttp.open('POST', config.siteUrl + '/account/account-settings/submit/',
             true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    setting: 'email',
    email: email
  };
  xhttp.send(JSON.stringify(data));
}

function passwordSubmit(infobox) {
  const passwordregex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
  const password = document.getElementById('password_input').value;
  if (!password.match(passwordregex)) {
    if (password.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Password invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Password required.');
    }
    return;
  }
  const verifyPassword =
      document.getElementById('verify_password_input').value;
  if (password !== verifyPassword) {
    Common.CommonUI.errorMessage(infobox, 'Passwords do not match.');
    return;
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
  xhttp.open('POST', config.siteUrl + '/account/account-settings/submit/',
             true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    setting: 'password',
    password: password
  };
  xhttp.send(JSON.stringify(data));
}

document.getElementById('name_settings').addEventListener('submit',
function(event) {
  event.preventDefault();
  nameSubmit(document.getElementById('name_form_submit_info'));
});

document.getElementById('email_setting').addEventListener('submit',
function(event) {
  event.preventDefault();
  emailSubmit(document.getElementById('email_form_submit_info'));
});

document.getElementById('password_setting').addEventListener('submit',
function(event) {
  event.preventDefault();
  passwordSubmit(document.getElementById('password_form_submit_info'));
});