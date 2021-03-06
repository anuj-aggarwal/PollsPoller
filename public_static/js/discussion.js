const replyCount = 5;
let repliesLoaded = 0;
let allRepliesLoaded = false;

$(() => {
	// Templates
	const replySource = $("#reply-template").html();
	const replyTemplate = Handlebars.compile(replySource);
	const replyFormSource = $("#reply-form-template").html();
	const replyFormTemplate = Handlebars.compile(replyFormSource);


	// Poll ID of the Discussion
	const pollId = $("#outer-replies").data("poll-id");
	// Outermost Comments Box to add initial comments to
	const outerCommentsBox = $("#outer-comments-box");
	// Outer Reply Form's Text Area
	const outerReplyTextArea = $(".outer-reply-text");
	// Outermost Reply Form's Reply Button
	const outerReplyButton = $(".outer-reply-button");
	// Outer Form's Loader
	const outerFormLoader = $("#outer-form-loader");
	// Outer Form's Error Icon
	const outerFormError = $("#outer-form-error");
	// Replies Spinner Container
	const repliesSpinnerContainer = $("#spinner-container");
	// Replies Spinner
	const repliesSpinner = $("#replies-spinner");
	// Replies Error icon
	const repliesErrorIcon = $("#replies-error-icon");

	// Clear Previous Replies if present
	outerCommentsBox.html("");
	// Initialize Comments on Page Load
	updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer, replyTemplate, replyFormTemplate);
	// Avoid Scrolling of window at load
	$(window).scrollTop(0);


	// Check if User scrolled
	$(window).scroll(function () {
		if (allRepliesLoaded === false) {
			// If user scrolled to bottom and has replies to load, update the replies
			if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
				updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer, replyTemplate, replyFormTemplate);
			}
		}
	});

	/********************
	 *  Event Listeners  *
	 *********************/

	// Make new AJAX Request to Reply on clicking Reply Button
	outerReplyButton.click(() => {
		// Get the reply text
		let replyText = outerReplyTextArea.val().trim();
		if (replyText !== "") {
			// make reply, and append it
			reply(pollId, outerCommentsBox, replyText, outerFormLoader, outerFormError, replyTemplate, replyFormTemplate);
			// Clear the Text Area's Value
			outerReplyTextArea.val("");
		}
	});

	repliesErrorIcon.click(() => {
		updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer, replyTemplate, replyFormTemplate);
	});


	// Edit Reply Buttons
	addEditReplyEvents(outerCommentsBox);
	// Delete Reply Buttons
	addDeleteReplyEvents(outerCommentsBox);

	// Form Reply Buttons
	addFormReplyEvents(outerCommentsBox, replyTemplate, replyFormTemplate);
});


// Function to Append a single Reply to Outer Comments Box of current reply
function appendReply(outerCommentsBox, reply, replyTemplate, replyFormTemplate, toPrepend = false) {
	const templateData = {
		replyId: reply._id,
		senderUsername: reply.sender.username,
		authenticated: reply.sender._id.toString() === $("#username").data("user-id"),
		replyBody: reply.body,
		repliesLength: reply.replies.length
	};
	const replyHtml = replyTemplate(templateData);

	console.log(toPrepend);
	if (!toPrepend)
		outerCommentsBox.append(replyHtml);
	else
		outerCommentsBox.prepend(replyHtml);


	// Current reply
	let comment = $(`[data-reply-id="${reply._id}"]`);
	// Comments Container for the reply
	let comments = comment.children(".comments");
	// Replies Button of current Reply
	let repliesBtn = comment.children(".content").find(".reply");
	// Delete Button of current Reply
	let deleteReplyButton = comment.children(".content").children(".delete-reply");
	// Trash Icon for Delete
	let deleteIcon = deleteReplyButton.find(".delete-icon");
	// Delete Error Icon
	let deleteErrorIcon = comment.children(".content").children(".delete-error-icon");


	// Display Delete Button on Hovering the Reply
	comment.children(".content").hover(() => deleteReplyButton.show(), () => deleteReplyButton.hide());


	// Toggle comments on clicking replies button
	repliesBtn.click(() => comments.toggle(200, "linear"));


	// Show Delete Icon on clicking Delete Error Icon
	deleteErrorIcon.click(() => {
		deleteErrorIcon.hide();
		deleteIcon.show();
	});


	// Get the Replies of current Reply
	$.get(`/api/replies/${reply._id}/replies`)
	 .then(replies => {
		 // Append each reply to replies container
		 replies.forEach(innerReply => appendReply(comments.children(".replies"), innerReply, replyTemplate, replyFormTemplate));
		 appendReplyForm(comments, reply._id, replyFormTemplate);
	 })
	 .catch(console.log);
}

// Function to add Event Handlers to Edit Reply Buttons
function addEditReplyEvents(outerCommentsBox) {
	outerCommentsBox.on("click", ".edit-reply", event => {
		// Get the comment
		let comment = $(event.currentTarget).closest(".comment");
		// Reply Id
		let replyId = comment.data("reply-id");
		// Reply Text
		let replyText = comment.children(".content").find(".text");
		// editReplyButton
		let editReplyButton = $(event.currentTarget);
		// Edit Reply Error Icon
		let editErrorIcon = editReplyButton.find(".edit-error-icon");
		// Edit Reply Spinner
		let editSpinner = editReplyButton.find(".edit-spinner");
		// Edit Display
		let editDisplay = editReplyButton.find(".edit-display");

		// If the button is Done Button
		if (editReplyButton.data("done")) {
			editErrorIcon.hide();

			// Get the new reply text
			let newReplyText = replyText.text().trim();
			console.log(newReplyText);
			if (newReplyText !== "") {
				// Confirm the Edit operation
				if (confirm("Confirm Edit?")) {

					// Make Reply text not Editable
					replyText.attr("contentEditable", false);
					// Display the spinner
					editSpinner.show();
					// Disable the Edit Button
					editReplyButton.css({ pointerEvents: "none", cursor: "default" });

					// Make PATCH Request to Server to update text
					$.ajax({
						url: `/api/replies/${replyId}`,
						type: "PATCH",
						data: { body: newReplyText }
					})
					 .then(reply => {
						 // Update Reply Text with new data
						 replyText.text(reply.body);

						 // Update Edit Button to Edit(from Done)
						 editReplyButton.data("done", false);
						 editDisplay.text("Edit");
						 // Hide the Spinner
						 editSpinner.hide();
						 // Enable the Edit Button
						 editReplyButton.css({ pointerEvents: "auto", cursor: "pointer" });
					 })
					 .catch(err => {
						 console.error(err);

						 // Hide the Spinner
						 editSpinner.hide();

						 // Show Error Icon with error message in tooltip
						 if (err.responseJSON && err.responseJSON.err)
							 editErrorIcon.attr("data-tooltip", err.responseJSON.err);
						 else
							 editErrorIcon.attr("data-tooltip", "Oops, something went wrong!");
						 editErrorIcon.show();

						 // Enable the Edit Button
						 editReplyButton.css({ pointerEvents: "auto", cursor: "pointer" });
						 // Keep Text Editable only
						 replyText.attr("contentEditable", true).focus();
					 });
				}
			}
		}
		// If the button is Edit Button
		else {
			// Make Reply Text Editable
			replyText.attr("contentEditable", true).focus();
			// Change edit button to a Done Button
			editReplyButton.data("done", true);
			editDisplay.text("Done");
		}
	});
}

// Function to add Event Handlers to Delete Reply Buttons
function addDeleteReplyEvents(outerCommentsBox) {
	// Delete Reply on clicking Delete Button
	outerCommentsBox.on("click", ".delete-reply", event => {
		// Current Delete Reply Button
		let deleteReplyButton = $(event.currentTarget);
		// Trash Icon for Delete
		let deleteIcon = deleteReplyButton.find(".delete-icon");
		// Delete Spinner
		let deleteSpinner = deleteReplyButton.siblings(".delete-spinner");
		// Delete Error Icon
		let deleteErrorIcon = deleteReplyButton.siblings(".delete-error-icon");

		// Comment
		let comment = deleteReplyButton.closest(".comment");
		// Current Reply Id
		let replyId = comment.data("reply-id");

		// Confirm Delete
		if (confirm("Delete Reply?")) {

			// Change Delete Icon to a Spinner
			deleteIcon.hide();
			deleteSpinner.show();

			// Get outer Reply
			let outerReply = comment.parent().closest(".comment");

			let requestBody = {};
			// If Reply is outermost(No outer reply exists)
			if (outerReply.length === 0) {
				requestBody = { pollId: $("#outer-replies").data("poll-id") };
			}
			// If Reply is inner reply
			else {
				requestBody = { outerReplyId: outerReply.data("reply-id") };
			}

			// Send Delete Request to Server
			$.ajax({
				url: `/api/replies/${replyId}`,
				type: "DELETE",
				data: requestBody
			})
			 .then(reply => {
				 console.log("Deleted: ");
				 console.log(reply);
				 // Update replies count of parent reply(if exists)
				 updateParentRepliesCount(outerReply.children(".content").find(".replies-count"), -1);
				 // Remove the reply
				 comment.remove();
			 })
			 .catch(err => {
				 console.error(err);

				 // Hide the spinner
				 deleteSpinner.hide();

				 // Show Error Icon with message in tooltip
				 if (err.responseJSON && err.responseJSON.err)
					 deleteErrorIcon.attr("data-tooltip", err.responseJSON.err);
				 else
					 deleteErrorIcon.attr("data-tooltip", "Oops, something went wrong!");
				 deleteErrorIcon.show();
			 });
		}
	});
}


// Function to update all replies in comments Box with replies
// uses appendReply()
function showReplies(outerCommentsBox, replies, replyTemplate, replyFormTemplate) {
	// For each Reply in replies, append it to Comments Box
	replies.forEach(reply => appendReply(outerCommentsBox, reply, replyTemplate, replyFormTemplate));
}

// Function to Load Replies from Server through AJAX Request
// and updates the CommentsBox
// uses showReplies()Container, innerReply);
function updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer, replyTemplate, replyFormTemplate) {
	// Replies Spinner
	const repliesSpinner = repliesSpinnerContainer.find("#replies-spinner");
	// Replies Error Icon
	const repliesErrorIcon = repliesSpinnerContainer.find("#replies-error-icon");

	// Show the Replies spinner
	repliesErrorIcon.hide();
	repliesSpinner.show();
	repliesSpinnerContainer.show();

	// Create a delay for spinner to show
	setTimeout(() => {
		// Make AJAX Request to Server
		$.get(`/api/discussions/${pollId}/replies?skip=${repliesLoaded}&limit=${replyCount}`)
		 .then(replies => {

			 repliesLoaded += replies.length;
			 if (replies.length === 0)
				 allRepliesLoaded = true;

			 // update the DOM if no error
			 showReplies(outerCommentsBox, replies, replyTemplate, replyFormTemplate);

			 // Hide the Spinner
			 repliesSpinnerContainer.hide();

			 if ($(window).height() >= $(document).height() && allRepliesLoaded === false)
				 updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer, replyTemplate, replyFormTemplate);
		 })
		 // Log the Error if present
		 .catch(err => {
			 console.error("Error Extracting Replies!");
			 console.error(err);
			 repliesSpinner.hide();
			 repliesErrorIcon.show();
		 });
	}, 500);
}

// function to Make a POST AJAX request to Server to make a reply
// and append the new reply returned to the comments Box
function reply(pollId, commentsBox, replyText, formLoader, formErrorIcon, replyTemplate, replyFormTemplate) {
	formErrorIcon.hide();
	formLoader.show();

	// Make an AJAX Request with TextArea's Value
	$.post(`/api/discussions/${pollId}/replies`, {
		body: replyText
	})
	 .then(reply => {
		 formLoader.hide();

		 // Increment replies loaded count
		 ++repliesLoaded;

		 // Append the new Reply to Comments Box
		 appendReply(commentsBox, reply, replyTemplate, replyFormTemplate, true);
	 })
	 // Log the Error if present
	 .catch(err => {
		 console.error(err);
		 formLoader.hide();

		 if (err.responseJSON && err.responseJSON.err)
			 formErrorIcon.attr("data-tooltip", err.responseJSON.err);
		 else
			 formErrorIcon.attr("data-tooltip", "Error Replying to Discussion!");
		 formErrorIcon.show();
	 });
}


// Function to append the Reply Form at the end of Comments Container of a Reply
function appendReplyForm(comments, replyId, replyFormTemplate) {
	const replyFormHtml = replyFormTemplate({ loggedIn: $("#username").data("user-id") });
	comments.append(replyFormHtml);
}


// Function to add Event Listeners to Form Reply Buttons
function addFormReplyEvents(outerCommentsBox, replyTemplate, replyFormTemplate) {
	// Form Reply Buttons
	outerCommentsBox.on("click", ".outer-reply-button", event => {
		let formButton = $(event.currentTarget);
		let comments = formButton.closest(".comments");
		let form = formButton.closest(".form");
		let formTextArea = form.children(".field").children("textarea");
		const formLoader = form.find(".form-loader");
		const formErrorIcon = form.find(".form-error-icon");
		let replyId = form.closest(".comment").data("reply-id");

		// Get the reply text
		let replyText = formTextArea.val().trim();
		if (replyText !== "") {
			formErrorIcon.hide();
			formLoader.show();

			// Make an AJAX Request with TextArea's Value
			$.post(`/api/replies/${replyId}/replies`, {
				body: replyText
			})
			 .then(reply => {
				 // Append the new reply
				 appendReply(comments.children(".replies"), reply, replyTemplate, replyFormTemplate, true);
				 // Increment parent's replies Count
				 updateParentRepliesCount(comments.parent().children(".content").find(".replies-count"), 1);

				 formLoader.hide();
				 formTextArea.val("");
			 })
			 .catch(err => {
				 console.error(err);
				 formLoader.hide();
				 if (err.responseJSON && err.responseJSON.err)
					 formErrorIcon.attr("data-tooltip", err.responseJSON.err);
				 else
					 formErrorIcon.attr("data-tooltip", "Error Replying to Discussion!");
				 formErrorIcon.show();
			 });

		}
	});
}


// Function to update the Replies Count span, to increment the count
function updateParentRepliesCount(repliesCountSpan, change) {
	// Get replies count from the span
	let repliesCount = parseInt(repliesCountSpan.text().trim());
	// If span contained an integer(can be non integer if manipulated by Dev Tools)
	if (!isNaN(repliesCount)) {
		// Increment the count and update the span's text
		repliesCount += change;
		repliesCountSpan.text(repliesCount);
	}
}