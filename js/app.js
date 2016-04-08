
var showFive = 0;
var remainder = 0;

//determines number of 'pages'
function byFive(responseItems){
	showFive = 0;
	remainder = 0;
	if (responseItems.length >= 5) {
		showFive = responseItems.length / 5;
		showFive = Math.floor(showFive);
	}
	if (responseItems.length % 5) {
		remainder = responseItems.length % 5;
	}
}

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

//clones elements and adds content, which is then appended to results in addExpert function
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

//manages all the work for "expert" content on page
// segment refers strictly to 5 items, segments may be of 5 items only
// segment is incremented by one when addNext below is called, and it is decremented by one when addPrev below is called
// initially it is set to one.
function navContent(responseItems, rangeFrom = 0, range = 0, segment = 1){
	//empty out children on each call
	$('.results').empty();
	$('.nav').empty();
	// if items five or more, need to set range to iterate through to load content for each 'page'
	if (responseItems.length >= 5){
		// if the segment of items is less than or equal to the number of times all items are divisible by five,
		// then in that case, set range multiplying 5 by the segment number.
		// that ensures the next five items will be loaded to the page
		// example: first time function is called, segment is one, and range is 5 times 1, that is, 5
		// second time function is called, segment is two, and range is 5 times 2, that is, 10
		// while rangeFrom is range minus 5, in the latter case, 10.
		if (segment <= showFive){
			range = 5 * segment;
			rangeFrom = range - 5;
		}
		// if segment is larger than the number of times the number of items is divisible by five
		// then the number of items has a remainder when divided by five, and so there is no segment of five 
		// and the remaining portion of items will be just the remainder of number of items divided by five--see byFive function above.
		else {
			range = responseItems.length;
			rangeFrom = range - remainder;
		}
	}
	// if items less than five, length to range through is number of items
	else {
		range = responseItems.length;
	}
	// add experts ranging through a segment of items.  
	addExpert(responseItems, rangeFrom, range);
	// add five to these segment boundaries
	// which creates the next segment of five if it exists 
	rangeFrom += 5;
	range += 5;
	
	// this conditional checks if there is another segment of five items to follow the segment just loaded to the page above
	if (range <= responseItems.length){
		// if yes, add the following
		var next = $('.templates .show-more a#next').clone();
		$(".nav").append(next);
		//add prev only if beyond the first segment
		if (segment > 1){
			var prev = $('.templates .show-more a#prev').clone();
			$(".nav").prepend(prev);
			addPrev(responseItems, rangeFrom, range, segment);
			addNext(responseItems, rangeFrom, range, segment);
		}
		// otherwise add only the option to go to the next segment
		else {
			console.log("else go to next five");
			addNext(responseItems, rangeFrom, range, segment);
		}
	}
	// if after the last or only segment [of five] was loaded to the page, and there is less than five remaining 
	// ex. when you have 7 or 16 or 17 items, this will condition will be met
	else if (responseItems.length > 5 && (segment == showFive)){
		if (segment == 1){
			var next = $('.templates .show-more a#next').clone();
			$(".nav").append(next);
			addNext(responseItems, rangeFrom, range, segment);
		}
		else {
			var next = $('.templates .show-more a#next').clone();
			$(".nav").append(next);
			var prev = $('.templates .show-more a#prev').clone();
			$(".nav").prepend(prev);
			addPrev(responseItems, rangeFrom, range, segment);
			addNext(responseItems, rangeFrom, range, segment);
		}
	}
	//add only prev only if range has exceeded the length of items, i.e. reached last 5 items
	// this condition makes sure too that if all items in response are less than five, so that if showFive is 0, no navigation appears
	else if (showFive) {
		if (segment > showFive){
			console.log("add prev")
			var prev = $('.templates .show-more a#prev').clone();
			$(".nav").prepend(prev);
			addPrev(responseItems, rangeFrom, range, segment);
		}
	}
}

function addPrev(responseItems, rangeFrom, range, segment){
	rangeFrom -= 5;
	if (remainder){
		range = responseItems.length - remainder;
	}
	else {
		range -= 5;
	}
	segment -= 1;
	$("a#prev").click(function(e){
		e.preventDefault();
		$(".results").empty();
		navContent(responseItems, range, rangeFrom, segment);
	});
}

function addNext(responseItems, rangeFrom, range, segment){
	segment += 1;
	$("a#next").click(function(e){
		e.preventDefault();
		$(".results").empty();
		navContent(responseItems, rangeFrom, range, segment);
	});
}

function addExpert(responseItems, rangeFrom, range){
	
	for (var i = rangeFrom; i < range; i++){
		var expert = showExpert(responseItems[i]);
		$(".results").append(expert);
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
		pagesize: 16, // 16 for demo
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
		byFive(response.items);
		navContent(response.items);
		
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
