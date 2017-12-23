// On window Load
$(() => {
    // Get Inputs and Buttons
    const optionList = $('#options');
    const addOptionBtn = $('#add-option-btn');
    const createPollBtn = $('#create-poll-btn');
    const optionInput = $('#new-option');
    const options = $('.option');

    //--------------------
    //   EVENT LISTENERS
    //--------------------

    // Add Option on pressing Enter while in Option Input
    optionInput.keypress((event) => {
        if (event.keyCode === 13)
            addOptionBtn.click();
    });

    // Add Option on pressing Add Button
    addOptionBtn.click(() => {
        if (optionInput.val().trim() !== "") {
            optionList.append(`
                <div class="item">
                    <div class="ui grid">
                        <div class="option fourteen wide column">${optionInput.val().trim()}</div>
                        <div class="two wide column"><i class="ui remove icon"></i></div>
                    </div>
                </div>
            `);
        }

        // Initialize input value to ''
        optionInput.val('');
    });

    // Send POST Request on Clicking Create Button
    createPollBtn.click(() => {
        // Send request to create new Poll
        $.post('/polls', {
            question: $('#question').val(),
            // Extract the options' texts from the Input List
            options: $('.option').toArray().map((option) => {
                return $(option).text();
            })
        })
        .then((data) => {
            // Redirect to new Poll Page
            console.log(data);
            window.location = data;
        })
        .catch((err) => {
            // Else log the Error and Reload the Page
            // Reload to update the page with new Flash Message(if present)
            console.log("Error creating event!!");
            location.reload();
        });
    });
});