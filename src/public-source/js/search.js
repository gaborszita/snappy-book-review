document.getElementById('search_form').addEventListener('submit', function(event) {
  if (document.getElementById('search_input').value === '') {
    event.preventDefault();
  }
});