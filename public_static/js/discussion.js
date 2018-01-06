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
        // Get the reply text
        let replyText = outerReplyTextArea.val().trim();
        if (replyText !== "") {
            // make reply, and append it
            reply(pollId, outerCommentsBox, replyText);
            // Clear the Text Area's Value
            outerReplyTextArea.val('');
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
                    <!-- Text -->
                    <div class="text">
                        ${reply.body}
                    </div>
                    <!-- Reply Button -->
                    <div class="actions">
                        <a class="reply">Replies (<span class="replies-count">${reply.replies.length}</span>)</a>
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
    let comments = comment.children('.comments');
    // Replies Button of current Reply
    let repliesBtn = comment.children('.content').find('.reply');

    // Toggle comments on clicking replies button
    repliesBtn.click(() => {
        comments.toggle(200, 'linear');
    });

    // Get the Replies of current Reply
    $.get(`/api/replies/${reply._id}/replies`)
        .then((replies) => {
            // Append each reply to replies container
            replies.forEach((innerReply) => {
                appendReply(comments.children('.replies'), innerReply)
            });
            appendReplyForm(comments, reply._id);
        })
        .catch((err) => {
            console.log(err);
        })
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
// uses showReplies()Container, innerReply);
function updateReplies(pollId, outerCommentsBox) {
    // Make AJAX Request to Server
    $.get(`/api/discussions/${pollId}/replies`)
        .then((replies) => {
            // If Error not undefined, throw the Error to be catched in catch statement
            if (replies.err)
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
function reply(pollId, outerCommentsBox, replyText) {
    // Make an AJAX Request with TextArea's Value
    $.post(`/api/discussions/${pollId}/replies`, {
        body: replyText
    })
        .then((reply) => {
            // If error present, throw it to be catched by outer catch statement
            if (reply.err)
                throw new Error(reply.err);

            // Append the new Reply to Comments Box
            appendReply(outerCommentsBox, reply);
        })
        .catch((err) => {
            // Log the Error if present
            console.log(err);
        })
}


// Function to append the Reply Form at the end of Comments Container of a Reply
function appendReplyForm(comments, replyId) {
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


    // EVENT LISTENERS
    let form = comments.children('.form');
    let formButton = form.children('.submit.button');
    let formTextArea = form.children('.field').children('textarea');

    // Form Reply Button
    formButton.click(() => {
        // Get the reply text
        let replyText = formTextArea.val().trim();
        if (replyText !== "") {
            // Make an AJAX Request with TextArea's Value
            $.post(`/api/replies/${replyId}/replies`, {
                body: replyText
            })
                .then((reply) => {
                    // Append the new reply
                    appendReply(comments.children('.replies'), reply);
                    // Increment parent's replies Count
                    updateParentRepliesCount(comments.parent().children('.content').find('.replies-count'));
                })
                .catch((err) => {
                    console.log(err);
                });
            formTextArea.val('');
        }
    });
}

// Function to update the Replies Count span, to increment the count
function updateParentRepliesCount(repliesCountSpan) {
    // Get replies count from the span
    let repliesCount = parseInt(repliesCountSpan.text().trim());
    // If span contained an integer(can be non integer if manipulated by Dev Tools)
    if (!isNaN(repliesCount)) {
        // Increment the count and update the span's text
        ++repliesCount;
        repliesCountSpan.text(repliesCount);
    }
}