$('#timeline-slider').slider({
	formatter: function(value) {
		return value + ' days ago';
	}
});