$(() => {
    const pollsContainer = $('#polls-container');

    // Get sorting method from polls Container
    let sortBy = pollsContainer.data('sort');

    // Load the user's polls from Server and update the DOM with the loaded polls
    loadPolls(pollsContainer, sortBy);
});


// Function to load user's polls from server
// and update the Polls Container with the polls
// Use appendPolls()
function loadPolls(pollsContainer, sortBy) {
    // Get user id
    let userId = $('#username').data('user-id');

    // Get all polls of user from the Server sorted by sortBy
    $.get(`/users/${userId}/polls?sort=${sortBy}`)
        .then((polls) => {
            // Append the polls to the Polls Container
            appendPolls(pollsContainer, polls);
        })
        .catch((err) => {
            console.log(err);
        });
}

// Function to append polls to the DOM
// Use appendPoll()
function appendPolls(pollsContainer, polls) {
    // Clear Container
    pollsContainer.html('');
    // Append each poll to the Polls Container
    polls.forEach((poll) => {
        appendPoll(pollsContainer, poll);
    });
}

// Function to append Poll to the pollsContainer
function appendPoll(pollContainer, poll) {
    pollContainer.append(`
        <tr>
            <td>
                <div class="ui header">
                    <a href="/polls/${poll._id}">${poll.question}</a>
                    <div class="right aligned sub header">${poll.createdAt}</div>
                </div>
            </td>
            <td class="right aligned collapsing">${poll.voteCount}</td>
        </tr>
    `);
}