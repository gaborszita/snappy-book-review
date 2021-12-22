export class Account {
  static checkLogin() {
    const defaultStylesheet = document.createElement("style");
    defaultStylesheet.type = "text/css";
    defaultStylesheet.innerText = "#login-button, #signup-button, #logout-button { display: none; }";
    document.head.appendChild(defaultStylesheet);

    if (document.cookie.match(/^(.*;)?\s*<?php echo session_name(); ?>\s*=\s*[^;]+(.*)?$/)) {
      const stylesheet = document.createElement("style");
      stylesheet.type = "text/css";
      stylesheet.innerText = "#logout-button { display: list-item; }";
      document.head.appendChild(stylesheet);
      return true;
    } else {
      const stylesheet = document.createElement("style");
      stylesheet.type = "text/css";
      stylesheet.innerText = "#login-button, #signup-button { display: list-item; }";
      document.head.appendChild(stylesheet);
      return false;
    }
  }
}