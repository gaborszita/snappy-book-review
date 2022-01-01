export class Account {
  static checkLogin() {
    const defaultStylesheet = document.createElement('style');
    defaultStylesheet.innerText = '#login_button, #signup_button, #logout_button { display: none; }';
    document.head.appendChild(defaultStylesheet);

    const cookieName = '<%= config.loggedInCookie %>';
    if (document.cookie.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)')?.pop() === 'true') {
      const stylesheet = document.createElement('style');
      stylesheet.innerText = '#logout_button { display: list-item; }';
      document.head.appendChild(stylesheet);
      return true;
    } else {
      const stylesheet = document.createElement('style');
      stylesheet.innerText = '#login_button, #signup_button { display: list-item; }';
      document.head.appendChild(stylesheet);
      return false;
    }
  }
}