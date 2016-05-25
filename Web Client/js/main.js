$(document).ready(function(){

	$(".grouphdr").click(function () {
	  $(this).next('.grouptbl').slideToggle("fast");
	});
	
	$(".button")
      .button()
      .click(function( event ) {
        event.preventDefault();
    });
	
	$( ".spinner" ).spinner({
      step: 0.01,
      numberFormat: "n"
    });
});