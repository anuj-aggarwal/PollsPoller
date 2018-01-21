$(() => {
	$(".ui.radio.checkbox").checkbox();

	// Delete Poll Button Event Listener
	$("#delete-poll").click(() => {
		// Confirm Delete
		if (confirm("Confirm Delete?")) {
			$.ajax({
				url: "/api" + window.location.pathname,
				type: "DELETE"
			})
			 .then(poll => {
			 	// Check for Errors
				 if (poll.err)
					 throw new Error(poll.err);

				 // Show successful Deletion Alert
				 alert(`Successfully Deleted Poll: ${poll.question}`);

				 // Redirect user to User's Polls Page
				 window.location = `/users/${$('#username').data('user-id')}/polls`;
			 })
			 .catch(console.log);
		}
	});
});