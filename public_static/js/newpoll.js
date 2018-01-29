// On window Load
$(() => {
	// Templates
	const optionSource = $("#option-template").html();
	const optionTemplate = Handlebars.compile(optionSource);

	// Get Inputs and Buttons
	const optionList = $("#options");
	const addOptionBtn = $("#add-option-btn");
	const createPollBtn = $("#create-poll-btn");
	const optionInput = $("#new-option");
	const options = $(".option");
	const loadingIcon = $("#loading-icon");
	const errorIcon = $("#error-icon");

	//--------------------
	//   EVENT LISTENERS
	//--------------------

	// Add Option on pressing Enter while in Option Input
	optionInput.keypress(event => {
		if (event.keyCode === 13)
			addOptionBtn.click();
	});

	// Delete Option Event Handler
	addDeleteEvents(optionList);
	// Edit Option Event Handler
	addEditEvents(optionList);
	// Arrow Buttons Event Handlers
	addUpDownArrowEvents(optionList);


	// Add Option on pressing Add Button
	addOptionBtn.click(() => {
		if (optionInput.val().trim() !== "") {
			const optionHtml = optionTemplate({
				optionText: optionInput.val().trim()
			});
			optionList.append(optionHtml);
		}

		// Initialize input value to ''
		optionInput.val("");
	});

	// Send POST Request on Clicking Create Button
	createPollBtn.click(() => {
		// Hide Error Icon if Present and show loading icon
		errorIcon.hide();
		loadingIcon.show();

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
			 console.error("Error creating event!!");
			 console.error(err);
			 loadingIcon.hide();
			 if (err.responseJSON && err.responseJSON.err)
				 errorIcon.attr("data-tooltip", err.responseJSON.err);
			 else
				 errorIcon.attr("data-tooltip", "Error creating Poll!");
			 errorIcon.show();
		 });
	});
});

// Function to add Event Listeners to Delete Buttons of Options
function addDeleteEvents(optionList) {
	// If clicked Delete Button on any Option
	optionList.on("click", ".delete-option", event => {
		let option = $(event.currentTarget).closest(".item");
		option.remove();
	});
}

// Function to add Event Listeners to Edit Button of Options
function addEditEvents(optionList) {
	// If clicked edit button on any option
	optionList.on("click", ".edit-option", function(event) {
		let editOptionBtn = $(event.currentTarget);
		let OptionField = editOptionBtn.closest(".ui.grid").find(".option .option-text");

		//if edit button was clicked
		if (editOptionBtn.data("done") === "edit") {
			// Make Option Text editable and focused
			OptionField.attr("contenteditable", true).focus();

			//Change edit button to check mark
			editOptionBtn.removeClass("write");
			editOptionBtn.addClass("checkmark");

			//Update data-btn attribute
			editOptionBtn.data("done", "check");
		}
		//if check button was clicked
		else {
			//Get updated option value
			let newOption = OptionField.text().trim();
			OptionField.text(newOption);

			OptionField.attr("contenteditable", false);

			//Change checkmark to edit button
			editOptionBtn.removeClass("checkmark");
			editOptionBtn.addClass("write");

			//Update data-btn attribute
			editOptionBtn.data("done", "edit");
		}
	});
}

// Function to add event listeners to Move options Up-Down
function addUpDownArrowEvents(optionList) {
	optionList.on("click", ".up-btn", event => {
		//Get current option
		let currentOpt = $(event.currentTarget).closest(".item");
		//Get previous sibling
		currentOpt.prev().before(currentOpt);
	});

	optionList.on("click", ".down-btn", event=>{
		//Get current option
		let currentOpt = $(event.currentTarget).closest(".item");
		//Get next sibling
		currentOpt.next().after(currentOpt);
	});
}
