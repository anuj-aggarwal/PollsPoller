// On window Load
$(() => {
	// Get Inputs and Buttons
	const optionList = $("#options");
	const addOptionBtn = $("#add-option-btn");
	const createPollBtn = $("#create-poll-btn");
	const optionInput = $("#new-option");
	const options = $(".option");

	//--------------------
	//   EVENT LISTENERS
	//--------------------

	// Add Option on pressing Enter while in Option Input
	optionInput.keypress(event => {
		if (event.keyCode === 13)
			addOptionBtn.click();
	});

	// Add Option on pressing Add Button
	addOptionBtn.click(() => {
		if (optionInput.val().trim() !== "") {
			optionList.append(`
                <div class="item">
                    <div class="ui grid">
                        <div class="option eleven wide column">
                            <div class="option-text">
                                ${optionInput.val().trim()}
                            </div>
                        </div>
                        <div class="one wide column"><i class="ui up-btn chevron up icon blue-hover"></i></div>
                        <div class="one wide column"><i class="ui down-btn chevron down icon blue-hover"></i></div>
                        <div class="one wide column"><i class="ui edit-option write icon blue-hover" data-done="edit"></i></div>
                        <div class="two wide column"><i class="delete-option ui remove icon blue-hover"></i></div>
                    </div>
                </div>
            `);
		}

		// Initialize input value to ''
		optionInput.val("");

		// Add Event Listeners
		addDeleteEvents();
		addEditEvents();
		addUpDownArrowEvents();
	});

	// Send POST Request on Clicking Create Button
	createPollBtn.click(() => {
		// Send request to create new Poll
		$.post("/api/polls", {
			question: $("#question").val(),
			// Extract the options' texts from the Input List
			options: $(".option").toArray().map(option => {
				return $(option).text();
			})
		})
		 .then(data => {
			 // Redirect to new Poll Page
			 console.log(data);
			 window.location = data;
		 })
		 .catch(err => {
			 // Else log the Error and Reload the Page
			 // Reload to update the page with new Flash Message(if present)
			 console.log("Error creating event!!");
			 location.reload();
		 });
	});
});

// Function to add Event Listeners to Delete Button of Options
function addDeleteEvents() {
	let deleteOptionBtn = $(".delete-option");

	//Remove old event handlers
	deleteOptionBtn.off("click");

	//Delete the option on click event
	deleteOptionBtn.click(event => {
		let option = $(event.target).closest(".item");
		option.remove();
	});
}

// Function to add Event Listeners to Edit Button of Options
function addEditEvents() {
	let editOptionBtn = $(".edit-option");

	//Remove old event handlers
	editOptionBtn.off("click");

	editOptionBtn.click(event => {
		let OptionField = $(event.target).closest(".ui.grid").find(".option .option-text");
		//if edit button was clicked
		if (editOptionBtn.data("done") === "edit") {
			// Make Option Text editable and focused
			$(OptionField).attr("contenteditable", true).focus();

			//Change edit button to check mark
			$(event.target).removeClass("write");
			$(event.target).addClass("checkmark");

			//Update data-btn attribute
			editOptionBtn.data("done", "check");
		}
		//if check button was clicked
		else {
			//Get updated option value
			let newOption = $(OptionField).text().trim();
			$(OptionField).html(newOption);

			$(OptionField).attr("contenteditable", false);

			//Change checkmark to edit button
			$(event.target).removeClass("checkmark");
			$(event.target).addClass("write");

			//Update data-btn attribute
			editOptionBtn.data("done", "edit");
		}
	});
}

// Function to add event listeners to Move option Up-Down
function addUpDownArrowEvents() {
	let upArrowBtn = $(".up-btn");
	let downArrowBtn = $(".down-btn");

	//Remove old event handlers
	upArrowBtn.off("click");
	downArrowBtn.off("click");


	upArrowBtn.click(event => {
		//Get current option
		let currentOpt = $(event.target).closest(".item");
		//Get previous sibling
		currentOpt.prev().before(currentOpt);
	});
	downArrowBtn.click(event => {
		//Get current option
		let currentOpt = $(event.target).closest(".item");
		//Get next sibling
		currentOpt.next().after(currentOpt);
	});
}
