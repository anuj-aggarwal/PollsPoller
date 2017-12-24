$(() => {
    // Poll ID of the Discussion
    const pollId = $('#outer-replies').data('poll-id');
    // Outermost Comments Box to add initial comments to
    const outerCommentsBox = $('#outer-comments-box');
    // Outer Reply Form's Text Area
    const outerReplyTextArea = $('.outer-reply-text');
    // Outermost Reply Form's Reply Button
    const outerReplyButton = $('.outer-reply-button');


    // Initialize Comments on Page Load
    updateReplies(pollId, outerCommentsBox);

    /********************
    *  Event Listeners  *
    *********************/

    // Make new AJAX Request to Reply on clicking Reply Button
    outerReplyButton.click(() => {
        // make reply, and append it
        reply(pollId, outerCommentsBox, outerReplyTextArea);
        // Clear the Text Area's Value
        outerReplyTextArea.val('');
    });
});


// Function to Append a single Reply to Outermost Comments Box
function appendReply(outerCommentsBox, reply){
    outerCommentsBox.append(`
            <div data-reply-id="${reply._id}" class="comment">
                <!-- Avatar -->
                <a class="avatar">
                    <img src="http://via.placeholder.com/50x50">
                </a>
                <div class="content">
                    <!-- Username -->
                    <a class="author">${reply.sender.username}</a>
                    <!-- Text -->
                    <div class="text">
                        ${reply.body}
                    </div>
                    <!-- Reply Button -->
                    <div class="actions">
                        <a class="reply">Replies (${reply.replies.length})</a>
                    </div>
                </div>
            </div>
        `);
}

// Function to update all replies in comments Box with replies
// uses appendReply()
function showReplies(outerCommentsBox, replies) {
    // Clear Previous Replies if present
    outerCommentsBox.html('');
    // For each Reply in replies, append it to Comments Box
    replies.forEach((reply) => {
        appendReply(outerCommentsBox, reply)
    });
}

// Function to Load Replies from Server through AJAX Request
// and updates the CommentsBox
// uses showReplies()
function updateReplies(pollId, outerCommentsBox) {
    // Make AJAX Request to Server
    $.get(`/discussions/${pollId}/replies`)
    .then((replies) => {
        // If Error not undefined, throw the Error to be catched in catch statement
        if(replies.err)
            throw new Error(replies.err);

        // update the DOM if no error
        showReplies(outerCommentsBox, replies);
    })
    .catch((err) => {
        // Log the Error if present
        console.log("Error Extracting Replies");
    });
}

// function to Make a POST AJAX request to Server to make a reply
// and append the new reply returned to the comments Box
function reply(pollId, outerCommentsBox, outerReplyTextArea) {
    // Make an AJAX Request with TextArea's Value
    $.post(`/discussions/${pollId}/replies`, {
        body: outerReplyTextArea.val()
    })
    .then((reply) => {
        // If error present, throw it to be catched by outer catch statement
        if(reply.err)
            throw new Error(reply.err);

        // Append the new Reply to Comments Box
        appendReply(outerCommentsBox, reply);
    })
    .catch((err) => {
        // Log the Error if present
        console.log(err);
    })
}