// this function takes the question object returned by the StackOverflow request
// and returns new result to be appended to DOM
var showQuestion = function(question) {
	
	// clone our result template code
	var result = $('.templates .question').clone();
	
	// Set the question properties in result
	var questionElem = result.find('.question-text a');
	questionElem.attr('href', question.link);
	questionElem.text(question.title);

	// set the date asked property in result
	var asked = result.find('.asked-date');
	var date = new Date(1000*question.creation_date);
	asked.text(date.toString());

	// set the .viewed for question property in result
	var viewed = result.find('.viewed');
	viewed.text(question.view_count);

	// set some properties related to asker
	var asker = result.find('.asker');
	// note href is not https
	asker.html('<p>Name: <a target="_blank" '+
		'href=http://stackoverflow.com/users/' + question.owner.user_id + ' >' +
		question.owner.display_name +
		'</a></p>' +
		'<p>Reputation: ' + question.owner.reputation + '</p>'
	);

	return result;
};

function showExpert(responseItem){
	var result = $('.templates .expert').clone();
	
	var expertName = result.find('.expert-name a');
	expertName.attr('href', responseItem.user.link);
	expertName.text(responseItem.user.display_name);
	
	var expertReputation = result.find('.expert-reputation');
	expertReputation.text(responseItem.user.reputation);
	
	var expertImage = result.find('.expert-image img');
	expertImage.attr({
		'src': responseItem.user.profile_image,
		'height': "75px",
		'margin-left': "30px"
	});
	
	var expertScore = result.find('.expert-score');
	expertScore.text(responseItem.score);
	return result;
}

// for any response containing 5 or more items, just send in the first parameter and use defaults for the next two
// but for less than 5 items, 
function nextFive(responseItems, timeAround = 1){
	console.log(timeAround+"time around");
	$('.results').empty();
	$('.nav').empty();
	var range = null;
	var rangeFrom = 0;
	if (responseItems.length >= 5){
		range = 5 * timeAround;
		rangeFrom = range - 5;
	}
	else {
		range = responseItems.length;
	}
	for (var i = rangeFrom; i < range; i++){
		var expert = showExpert(responseItems[i]);
		$(".results").append(expert);
	}
	rangeFrom += 5;
	range += 5;
	if (range <= responseItems.length){
		var next = $('.templates .show-more a#next').clone();
		$(".nav").append(next);
		if (timeAround > 1){
			var prev = $('.templates .show-more a#prev').clone();
			$(".nav").prepend(prev);
			$("a#prev").click(function(e){
				e.preventDefault();
				$(".results").empty();
				prevFive(responseItems, (range - 10), (rangeFrom - 10), timeAround);
			});
			$("a#next").click(function(e){
				e.preventDefault();
				$(".results").empty();
				nextFive(responseItems, timeAround += 1);
			});
		}
		else {
			console.log("else go to next five");
			$("a#next").click(function(e){
				e.preventDefault();
				$(".results").empty();
				nextFive(responseItems, timeAround += 1);
			});
		}
	}
	else if (timeAround > 1) {
		// add prev link will not show for items less than 5 because timeAround has not been incremented
		// 
		var prev = $('.templates .show-more a#prev').clone();
		$(".nav").prepend(prev);
		$("a#prev").click(function(e){
			e.preventDefault();
			$(".results").empty();
			prevFive(responseItems, (range - 10), (rangeFrom - 10), timeAround);
		});
	}
}

function prevFive(responseItems, range, rangeFrom, timeAround){
	$(".nav").empty();
	console.log(range+"range sent");
	// range -= 10;
	console.log(range+"range decremented")
	// rangeFrom -= 10;
	timeAround -= 1;
	for (var i = rangeFrom; i < range; i++){
		console.log("I!"+i);
		console.log(responseItems[i].user.display_name);
		var expert = showExpert(responseItems[i]);
		$(".results").append(expert);
	}
	var next = $('.templates .show-more a#next').clone();
	$(".nav").append(next);
	if (timeAround > 1){
		var prev = $('.templates .show-more a#prev').clone();
		$(".nav").prepend(prev);
		$("a#prev").click(function(e){
			e.preventDefault();
			$(".results").empty();
			prevFive(responseItems, (range - 5), (rangeFrom - 5), timeAround);
		});
		$("a#next").click(function(e){
			e.preventDefault();
			$(".results").empty();
			nextFive(responseItems, timeAround += 1);
		});
	}
	else {
		console.log("else go to next five");
		$("a#next").click(function(e){
			e.preventDefault();
			$(".results").empty();
			nextFive(responseItems, timeAround += 1);
		});
	}
}

// this function takes the results object from StackOverflow
// and returns the number of results and tags to be appended to DOM
var showSearchResults = function(query, resultNum) {
	var results = resultNum + ' results for <strong>' + query + '</strong>';
	return results;
};

// takes error string and turns it into displayable DOM element
var showError = function(error){
	var errorElem = $('.templates .error').clone();
	var errorText = '<p>' + error + '</p>';
	errorElem.append(errorText);
};

// takes a string of semi-colon separated tags to be searched
// for on StackOverflow
var getUnanswered = function(tags) {
	
	// the parameters we need to pass in our request to StackOverflow's API
	var request = { 
		tagged: tags,
		site: 'stackoverflow',
		order: 'desc',
		sort: 'creation'
	};
	
	$.ajax({
		url: "https://api.stackexchange.com/2.2/questions/unanswered",
		data: request,
		dataType: "jsonp",//use jsonp to avoid cross origin issues
		type: "GET",
	})
	.done(function(result){ //this waits for the ajax to return with a succesful promise object
		var searchResults = showSearchResults(request.tagged, result.items.length);

		$('.search-results').html(searchResults);
		//$.each is a higher order function. It takes an array and a function as an argument.
		//The function is executed once for each item in the array.
		$.each(result.items, function(i, item) {
			var question = showQuestion(item);
			$('.results').append(question);
		});
	})
	.fail(function(jqXHR, error){ //this waits for the ajax to return with an error promise object
		var errorElem = showError(error);
		$('.search-results').append(errorElem);
	});
};

function getExpertsOn(tag){
	console.log("getExpertsOn function "+tag);
	var about = tag;
	
	var params = {
		pagesize: 30,
		site: 'stackoverflow'
	}
	
	$.ajax({
		url: "https://api.stackexchange.com/2.2/tags/"+tag+"/top-answerers/all_time",
		data: params,
		dataType: "jsonp",
		type: "GET",
	})
	.done(function(response){
		console.log(response);
		var searchResults = showSearchResults(tag, response.items.length);
		console.log("number of items "+response.items.length);
		$('.search-results').html(searchResults);
		// for (var i = 0; i < response.items.length; i++){
		// 	var expert = showExpert(response.items[i]);
		// 	$(".results").append(expert);
		// }
		nextFive(response.items);
	})
	.fail(function(jqXHR, error){ //this waits for the ajax to return with an error promise object
		var errorElem = showError(error);
		$('.search-results').append(errorElem);
	});
}

$(document).ready( function() {
	console.log("document ready");
	$('.unanswered-getter').submit( function(e){
		e.preventDefault();
		console.log("unanswered getter");
		// zero out results if previous search has run
		$('.results').html('');
		// get the value of the tags the user submitted
		var tags = $(this).find("input[name='tags']").val();
		getUnanswered(tags);
	});
	$('.inspiration-getter').submit(function(e){
		e.preventDefault();
		console.log("inspiration-getter submitted!");
		$('.results').html('');
		var tag = $(this).find("input[name='answerers']").val();
		console.log(tag);
		getExpertsOn(tag);
	});
});
