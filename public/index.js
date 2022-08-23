const showFormSubmittedMessage = () => {
  const queryParams = window.location.search.substring(1).split("&");
  for (const queryParam of queryParams) {
    const [key, value] = queryParam.split("=");
    if (key === "submit") {
      if (value === "true") {
        M.toast({html: "Incident submitted successfully!", classes: "green"});
      } else if (value === "false") {
        M.toast({html: "There was a problem submitting the Incident to BreachRx!", classes: "red"});
      }
    } else if (key==="invalid" && value=="true") {
      M.toast({html: "This incident isn't valid!", classes: "amber"});
    }
  }
};

showFormSubmittedMessage();
M.AutoInit();

$(document).ready(function() {
  $("select[required]").css({
    display: "inline",
    height: 0,
    padding: 0,
    width: 0,
  });
});
