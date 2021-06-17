function errorMessage(infobox, message) {
    infobox.innerHTML = '<div class="alert alert-danger" role="alert" style="margin: 10px;"> '
    + message + 
    '</div>';
}
function successMessage(infobox, message) {
    infobox.innerHTML = '<div class="alert alert-success" role="alert" style="margin: 10px;"> '
    + message + 
    '</div>';
}
function loadingIcon(infobox) {
    infobox.innerHTML = '<p></p><div class="spinner-border text-primary" role="status">' + 
    '<span class="visually-hidden">Loading...</span>' + 
    '</div><p></p>';
}