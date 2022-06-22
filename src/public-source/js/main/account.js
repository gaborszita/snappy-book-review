'use strict';

export class Account {
  static checkLogin() {
    if (document.cookie.match('(^|;)\\s*' + config.loggedInCookie + '\\s*=\\s*([^;]+)')?.pop() === 'true') {
      document.getElementById('account_settings_button').style.removeProperty('display');
      document.getElementById('logout_button').style.removeProperty('display');
      document.getElementById('login_button').style.setProperty('display', 'none');
      document.getElementById('signup_button').style.setProperty('display', 'none');
      return true;
    } else {
      document.getElementById('account_settings_button').style.setProperty('display', 'none');
      document.getElementById('logout_button').style.setProperty('display', 'none');
      document.getElementById('login_button').style.removeProperty('display');
      document.getElementById('signup_button').style.removeProperty('display');
      return false;
    }
  }
}

document.getElementById('logout_button').addEventListener('click', 
  function () {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      Account.checkLogin();
    }
  };
  xhttp.open('POST', config.siteUrl + '/account/log-out/submit/', true);
  xhttp.send();
});