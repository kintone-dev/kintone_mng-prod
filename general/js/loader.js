function startLoad(msg) {
  if (msg == undefined) {
    msg = '処理中です';
  }
  var dispMsg = "<div class='loadingMsg'><p>" + msg + "</p></div>";
  if ($("#loading").length == 0) {
    $("body").append("<div id='loading'>" + dispMsg + "</div>");
  }
}

function endLoad(){
  $("#loading").remove();
}