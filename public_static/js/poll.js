$(() => {
	$(".ui.radio.checkbox").checkbox();

	const deleteErrorIcon = $("#delete-error-icon");
	const deleteLoaderIcon = $("#delete-loader");

	// Delete Poll Button Event Listener
	$("#delete-poll").click(() => {
		deleteErrorIcon.hide();
		deleteLoaderIcon.show();

		// Confirm Delete
		if (confirm("Confirm Delete?")) {
			$.ajax({
				url: "/api" + window.location.pathname,
				type: "DELETE"
			})
			 .then(poll => {
				 // Show successful Deletion Alert
				 alert(`Successfully Deleted Poll: ${poll.question}`);

				 // Redirect user to User's Polls Page
				 window.location = `/users/${$("#username").data("user-id")}/polls`;
			 })
			 .catch(err => {
				 console.error(err);
				 deleteLoaderIcon.hide();

				 if (err.responseJSON && err.responseJSON.err)
					 deleteErrorIcon.attr("data-tooltip", err.responseJSON.err);
				 else
					 deleteErrorIcon.attr("data-tooltip", "Error Deleting Poll!");
				 deleteErrorIcon.show();
			 });
		}
	});
});