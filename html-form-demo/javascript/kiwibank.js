const OpenSubmitModal = () => {
  $("#openModalButton").click(function () {
    $("#submit").modal("show"); // Show the modal
  });
};

const getToken = () => {
  return document.getElementById("api-key").value;
};

const sendPostRequestToLendingAPI = (jsonData) => {
  var testToken = getToken();
  $.ajax({
    type: "POST",
    url: "https://lending-service-chong.apps.5e06.cip-non-production.nonprod.internal.aws.kiwibank.co.nz/HomeLoan/v1",
    data: jsonData,
    headers: {
      "Content-Type": "application/json",
      "kb-api-consumer-id": "demo",
      "kb-api-correlation-id": "demo",
    },

    success: function (response) {
      alert(
        "The submission of the Home Loan to the Kiwi Bank Lending API has been successful! \n\nActivate Application Number is " +
          response.activateApplicationNumber
      );
    },
    error: function (error) {
      alert("POST request failed: " + error.responseText);
    },
  });
};

const FixRequestJson = (json) => {
  var clonedJson = _.cloneDeep(json);
  clonedJson.Package.Content.Application["@uniqueID"] = UUIDGeneratorBrowser();
  clonedJson.Package.Publisher["@LIXICode"] = "UQWDVN6";

  var overview = {
    ["@BrokerApplicationReferenceNumber"]: UUIDGeneratorBrowser(),
  };
  clonedJson.Package.Content.Application["Overview"] = overview;

  return clonedJson;
};

const SubmitToAPI = () => {
  DisableInterface();
  var converted_json = create_json(xml_string);
  var jsonObject = JSON.parse(converted_json);
  var lendingRequest = FixRequestJson(jsonObject);
  var jsonString = JSON.stringify(lendingRequest);

  sendPostRequestToLendingAPI(jsonString);
  EnableInterface();
};

const UUIDGeneratorBrowser = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

const ConvertJsonPropertiesToPascalCase = (jsonObject) => {};
