export class CommonUI {
  static errorMessage(infobox, message) {
    infobox.innerHTML = '<div class="sbr-error-message" role="alert"> '
    + message + 
    '</div>';
  }
  static successMessage(infobox, message) {
    infobox.innerHTML = '<div class="sbr-success-message" role="alert"> '
    + message + 
    '</div>';
  }
  static loadingIcon(infobox) {
    infobox.innerHTML = '<p></p><div class="sbr-loading-icon" role="status">' + 
    '<span>Loading...</span>' + 
    '</div><p></p>';
  }
}