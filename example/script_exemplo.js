$(function(){
	$(".prateleira .prateleira").coresPrateleira();
	$(document).ajaxStop(function(){ $(".prateleira .prateleira").coresPrateleira(); });
});