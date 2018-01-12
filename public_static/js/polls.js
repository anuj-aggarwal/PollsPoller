$(() => {
    const pollsContainer = $('#polls-container');

    // Get sorting method from polls Container
    let sortBy = pollsContainer.data('sort');

    // Load the polls from Server and update the DOM with the loaded polls
    loadPolls(pollsContainer, sortBy);
});


// Function to load polls from server
// and update the Polls Container with the polls
// Use appendPolls()
function loadPolls(pollsContainer, sortBy) {
    // Get all polls from the Server sorted by sortBy
    $.get(`/api/polls?sort=${sortBy}`)
        // Append the polls to the Polls Container
        .then(polls => appendPolls(pollsContainer, polls))
        .catch(console.log);
}

// Function to append polls to the DOM
// Use appendPoll()
function appendPolls(pollsContainer, polls) {
    // Clear Container
    pollsContainer.html('');
    // Append each poll to the Polls Container
    polls.forEach(poll => appendPoll(pollsContainer, poll));
}

// Function to append Poll to the pollsContainer
function appendPoll(pollContainer, poll) {
    console.log(poll);
    pollContainer.append(`
        <tr>
            <td>
                <div class="ui header">
                    <a href="/polls/${poll._id}">${poll.question}</a>
                    <div class="right aligned sub header">~ ${poll.author.username}</div>
                </div>
            </td>
            <td class="right aligned collapsing">${poll.voteCount}</td>
        </tr>
    `);
}