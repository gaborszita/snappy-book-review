'use strict';

export class CommonUI {
  static errorMessage(infobox, message) {
    infobox.innerHTML = '<div class="sbr-error-message" role="alert">'
    + message + 
    '</div>';
  }
  static successMessage(infobox, message) {
    infobox.innerHTML = '<div class="sbr-success-message" role="alert">'
    + message + 
    '</div>';
  }
  static loadingIcon(infobox) {
    infobox.innerHTML = '<br><div class="sbr-loading-icon" role="status">' + 
    '<span>Loading...</span>' + 
    '</div><br>';
  }
}