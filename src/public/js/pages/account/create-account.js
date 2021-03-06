'use strict';

function formSubmit(infobox) {
  const nameregex = /^[a-zA-Z ]{1,255}$/;
  // Check first name, last name validity
  const firstName = document.getElementById('first_name_input').value;
  if (!firstName.match(nameregex)) {
    if (firstName.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'First name invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'First name required.');
    }
    return;
  }
  const lastName = document.getElementById('last_name_input').value;
  if (!lastName.match(nameregex)) {
    if (lastName.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Last name invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Last name required.');
    }
    return;
  }
  ''
  const emailRegex = new RegExp([
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|',
    '(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|',
    '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
  ].join(''));
  const email = document.getElementById('email_input').value;
  if (!email.match(emailRegex) || email.length > 254) {
    if (email.length > 0) {
      Common.CommonUI.errorMessage(infobox, 'Email adress invalid.');
    } else {
      Common.CommonUI.errorMessage(infobox, 'Email adress required.');
    }
    return;
  }
  const passwordRegex = /(?=.*\d)(?=.*[a-zA-Z]).{8,20}/;
  const password = document.getElementById('password_input').value;
  if (password.length === 0) {
    Common.CommonUI.errorMessage(infobox, 'Password required.')
    return;
  }
  if (!password.match(passwordRegex)) {
    Common.CommonUI.errorMessage(infobox, 'Password invalid. ' + 
                                 '(Please check password constraints.)');
    return;
  }
  const verifypassword = document.getElementById('verify_password_input')
      .value;
  if (password !== verifypassword) {
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
  xhttp.open('POST', config.siteUrl + '/account/create-account/submit/', true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  const data = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password
  }
  xhttp.send(JSON.stringify(data));
}

document.getElementById('sign_up_form').addEventListener('submit',
  function (event) {
  event.preventDefault();
  formSubmit(document.getElementById('form_submit_info'));
});