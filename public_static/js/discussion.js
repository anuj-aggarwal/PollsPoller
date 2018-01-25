const replyCount = 5;
let repliesLoaded = 0;
let allRepliesLoaded = false;

$(() => {
	// Poll ID of the Discussion
	const pollId = $("#outer-replies").data("poll-id");
	// Outermost Comments Box to add initial comments to
	const outerCommentsBox = $("#outer-comments-box");
	// Outer Reply Form's Text Area
	const outerReplyTextArea = $(".outer-reply-text");
	// Outermost Reply Form's Reply Button
	const outerReplyButton = $(".outer-reply-button");
	// Replies Spinner Container
	const repliesSpinnerContainer = $("#spinner-container");

	// Clear Previous Replies if present
	outerCommentsBox.html("");
	// Initialize Comments on Page Load
	updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer);
	// Avoid Scrolling of window at load
	$(window).scrollTop(0);


	// Check if User scrolled
	$(window).scroll(function () {
		if (allRepliesLoaded === false) {
			// If user scrolled to bottom and has replies to load, update the replies
			if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
				updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer);
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
			reply(pollId, outerCommentsBox, replyText);
			// Clear the Text Area's Value
			outerReplyTextArea.val("");
		}
	});
});


// Function to Append a single Reply to Outer Comments Box of current reply
function appendReply(outerCommentsBox, reply) {
	outerCommentsBox.append(`
            <div data-reply-id="${reply._id}" class="comment">
                <!-- Avatar -->
                <a class="avatar">
                    <img src="http://via.placeholder.com/50x50">
                </a>
                <div class="content">
                    <!-- Username -->
                    <a class="author">${reply.sender.username}</a>
                    ${(reply.sender._id.toString() === $("#username").data("user-id")) ? `
                            <!-- Delete Button -->
                            <a class="delete-reply" style="display: none;">
                                <i class="delete-icon large trash icon"></i>
                            </a>                  
                        ` : "" }
                    <i class="delete-spinner large red spinner icon" style="display:none"></i>
                    <!-- Text -->
                    <div class="text">
                        ${reply.body}
                    </div>
                    <!-- Reply Button -->
                    <div class="actions">
                        <a class="reply">Replies (<span class="replies-count">${reply.replies.length}</span>)</a>
                        ${(reply.sender._id.toString() === $("#username").data("user-id")) ? `
                                <a data-done="false" class="edit-reply">
                                    <span class="edit-display">Edit</span>
                                    <!-- Spinner: Initially hidden -->
                                    <i class="edit-spinner spinner icon" style="display:none"></i>
                                    <span class="edit-error-icon" data-inverted="" data-tooltip="Oops, Something went Wrong!" data-position="right center" style="display:none;"><i class="warning sign icon"></i></span>
                                </a>                    
                            ` : "" }
                    </div>
                </div>
                
                <!-- Comments: Initially hidden -->
                <div class="comments" style="display:none">
                    <div class="replies">
                        <!-- Comments to be added on page load/ new reply -->
                    </div>
                </div>
            </div>
        `);

	// Current reply
	let comment = $(`[data-reply-id="${reply._id}"]`);
	// Comments Container for the reply
	let comments = comment.children(".comments");
	// Replies Button of current Reply
	let repliesBtn = comment.children(".content").find(".reply");
	// Edit button of current Reply
	let editReplyButton = comment.children(".content").find(".edit-reply");
	// Edit Button Display Text
	let editDisplay = editReplyButton.find(".edit-display");
	// Edit Button Spinner
	let editSpinner = editReplyButton.find(".edit-spinner");
	// Edit Error Icon
	let editErrorIcon = editReplyButton.find(".edit-error-icon");
	// Delete Button of current Reply
	let deleteReplyButton = comment.children(".content").children(".delete-reply");
	// Trash Icon for Delete
	let deleteIcon = deleteReplyButton.find(".delete-icon");
	// Delete Spinner
	let deleteSpinner = comment.children(".content").children(".delete-spinner");


	// Display Delete Button on Hovering the Reply
	comment.children(".content").hover(() => deleteReplyButton.show(), () => deleteReplyButton.hide());


	// Toggle comments on clicking replies button
	repliesBtn.click(() => comments.toggle(200, "linear"));

	// Edit Reply Text on clicking Reply Button
	editReplyButton.click(() => {
		// Reply Text
		let replyText = comment.children(".content").find(".text");

		// If the button is Done Button
		if (editReplyButton.data("done")) {
			editErrorIcon.hide();

			// Get the new reply text
			let newReplyText = replyText.text().trim();
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
						url: `/api/replies/${reply._id}`,
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

	// Delete Reply on clicking Delete Button
	deleteReplyButton.click(() => {
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
				url: `/api/replies/${reply._id}`,
				type: "DELETE",
				data: requestBody
			})
			 .then(reply => {
				 if (reply.err) {
					 deleteSpinner.hide();
					 deleteIcon.show();
					 throw new Error(reply.err);
				 }

				 console.log("Deleted: ");
				 console.log(reply);
				 // Update replies count of parent reply(if exists)
				 updateParentRepliesCount(outerReply.children(".content").find(".replies-count"), -1);
				 // Remove the reply
				 comment.remove();
			 })
			 .catch(console.log);
		}
	});

	// Get the Replies of current Reply
	$.get(`/api/replies/${reply._id}/replies`)
	 .then(replies => {
		 // Append each reply to replies container
		 replies.forEach(innerReply => appendReply(comments.children(".replies"), innerReply));
		 appendReplyForm(comments, reply._id);
	 })
	 .catch(console.log);
}

// Function to update all replies in comments Box with replies
// uses appendReply()
function showReplies(outerCommentsBox, replies) {
	// For each Reply in replies, append it to Comments Box
	replies.forEach(reply => appendReply(outerCommentsBox, reply));
}

// Function to Load Replies from Server through AJAX Request
// and updates the CommentsBox
// uses showReplies()Container, innerReply);
function updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer) {
	// Show the Replies spinner
	repliesSpinnerContainer.show();

	// Create a delay for spinner to show
	setTimeout(() => {
		// Make AJAX Request to Server
		$.get(`/api/discussions/${pollId}/replies?skip=${repliesLoaded}&limit=${replyCount}`)
		 .then(replies => {
			 // If Error not undefined, throw the Error to be catched in catch statement
			 if (replies.err)
				 throw new Error(replies.err);

			 repliesLoaded += replies.length;
			 if (replies.length === 0)
				 allRepliesLoaded = true;

			 // update the DOM if no error
			 showReplies(outerCommentsBox, replies);

			 // Hide the Spinner
			 repliesSpinnerContainer.hide();

			 if ($(window).height() >= $(document).height() && allRepliesLoaded === false)
				 updateReplies(pollId, outerCommentsBox, repliesSpinnerContainer);
		 })
		 // Log the Error if present
		 .catch(err => console.log("Error Extracting Replies"));
	}, 500);
}

// function to Make a POST AJAX request to Server to make a reply
// and append the new reply returned to the comments Box
function reply(pollId, outerCommentsBox, replyText) {
	// Make an AJAX Request with TextArea's Value
	$.post(`/api/discussions/${pollId}/replies`, {
		body: replyText
	})
	 .then(reply => {
		 // If error present, throw it to be catched by outer catch statement
		 if (reply.err)
			 throw new Error(reply.err);

		 // Append the new Reply to Comments Box
		 appendReply(outerCommentsBox, reply);
	 })
	 // Log the Error if present
	 .catch(console.log);
}


// Function to append the Reply Form at the end of Comments Container of a Reply
function appendReplyForm(comments, replyId) {
	if ($("#username").data("user-id")) {
		comments.append(`
            <!-- Outermost Reply Form -->
            <form class="ui form reply-form">
                <!-- TextArea -->
                <div class="field">
                    <textarea class="outer-reply-text" rows="2"></textarea>
                </div>
                <!-- Reply Button -->
                <div class="ui blue labeled submit icon button outer-reply-button">
                    <i class="icon edit"></i> Add Reply
                </div>
            </form>
        `);
	}
	else {
		comments.append(`
            <!-- Outermost Reply Form -->
            <form class="ui form reply-form">
                <!-- No Reply Text -->

                <!-- Reply Button -->
                <span data-inverted="" data-tooltip="Login to Reply!" data-position="right center">
                    <button class="ui disabled labeled submit icon button outer-reply-button">
                        <i class="icon edit"></i> Add Reply
                    </button>
                </span>
            </form>
        `);
	}


	// EVENT LISTENERS
	let form = comments.children(".form");
	let formButton = form.children(".submit.button");
	let formTextArea = form.children(".field").children("textarea");

	// Form Reply Button
	formButton.click(() => {
		// Get the reply text
		let replyText = formTextArea.val().trim();
		if (replyText !== "") {
			// Make an AJAX Request with TextArea's Value
			$.post(`/api/replies/${replyId}/replies`, {
				body: replyText
			})
			 .then(reply => {
				 if (reply.err)
					 throw new Error(reply.err);

				 // Append the new reply
				 appendReply(comments.children(".replies"), reply);
				 // Increment parent's replies Count
				 updateParentRepliesCount(comments.parent().children(".content").find(".replies-count"), 1);
			 })
			 .catch(console.log);
			formTextArea.val("");
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