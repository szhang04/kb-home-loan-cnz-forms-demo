const OpenSubmitModal = () => {
  $("#openModalButton").click(function () {
    $("#submit").modal("show"); // Show the modal
  });
};

const getToken = () => {
  return document.getElementById("api-key").value;
};

const sendPostRequest = (jsonData) => {
  $.ajax({
    type: "POST",
    url: "http://localhost:5013/homeloan/v1",
    // url: "https://lending-service-integrate.apps.5e06.cip-non-production.nonprod.internal.aws.kiwibank.co.nz/HomeLoan/v1",
    data: jsonData,
    headers: {
      "Content-Type": "application/json",
      "kb-api-consumer-id": "demo",
      "kb-api-correlation-id": "demo",
      //"Authorization": "Bearer " + authorization_token
      Authorization: "Bearer " + getToken(),
    },
    success: function (response) {
      alert("POST request successful: " + response.activateApplicationNumber);
    },
    error: function (error) {
      console.log("POST request failed:", error);
    },
  });
};

function SubmitToAPI() {
  DisableInterface();
  var apikey = getToken();
  var converted_json = create_json(xml_string);
  //var test = xml_string;
  var jsonObject = JSON.parse(converted_json);

  jsonObject.Package.Content.Application["@uniqueID"] = UUIDGeneratorBrowser();
  jsonObject.Package.Content.Application.Overview[
    "@brokerApplicationReferenceNumber"
  ] = UUIDGeneratorBrowser();

  var jsonString = JSON.stringify(jsonObject);

  sendPostRequest(jsonString);
  EnableInterface();
}

const UUIDGeneratorBrowser = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

const ConvertJsonPropertiesToPascalCase = (jsonObject) => {};

const authorization_token =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiJjZjI1ZWZiNS1lNmZjLTRkOGYtYWE5OS1hODBmNTg0YmJlOTgiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNWIwMTg1ZWQtZWIxYS00ZmIzLWE0ZGUtM2MzNGQ4ZDhiNGU2L3YyLjAiLCJpYXQiOjE2OTE2NDM2NjAsIm5iZiI6MTY5MTY0MzY2MCwiZXhwIjoxNjkxNjQ3NTYwLCJhaW8iOiJFMkZnWU1nb2NtaWFFSDU3aWtIampGMHRpeXhYV0dwRjdQTys5cmdwYUdiYi9weS92M1VCIiwiYXpwIjoiMmVmZTY0MjAtZTE0ZC00NTk5LWI0NDctYTYwNDNiNjE3ZDY2IiwiYXpwYWNyIjoiMSIsIm9pZCI6ImYzODg3ZDlkLTIyNjEtNDUyNS04MGEwLTkzMjMxZDAzM2EyYyIsInJoIjoiMC5BV2NBN1lVQld4cnJzMC1rM2p3MDJOaTA1clh2SmNfODVvOU5xcG1vRDFoTHZwaG5BQUEuIiwicm9sZXMiOlsiaG9tZWxvYW4uc3VibWl0IiwiS0lXSUJBTkstU1RBRkYtQUNDRVNTLVVBVCIsIktJV0lCQU5LLVNUQUZGLUFDQ0VTUyJdLCJzdWIiOiJmMzg4N2Q5ZC0yMjYxLTQ1MjUtODBhMC05MzIzMWQwMzNhMmMiLCJ0aWQiOiI1YjAxODVlZC1lYjFhLTRmYjMtYTRkZS0zYzM0ZDhkOGI0ZTYiLCJ1dGkiOiJLMk5GYTFfUWxFYVk1NmxsOXIwbUFBIiwidmVyIjoiMi4wIn0.LXMkthnNk5Q3pRawDaZ7TyhLhVYiUaKZKTOwLp0eg7g5eXYtN1f5_EnvgXrdCSr2d7SCoW8Km-RORFAYh6tCNAX3zjTsApqYfxdJrE-29iC1jYrLyyH8PXp_az3r2CLsP-tjER-K1ldpz-rQAHcIO94d8lft8EX-SwJUNDjG159HhQ3-MNTiOqIiVVrV8Nunn2dEmRJwYiQqw5TggN30BJEGDt2Z35g_TTEJzY1lhK5EdptWEiccJRGyewW5OrudrJmNpZBp9whyC_xCAP9ABp_5K6Dkd96x7aW5Ju0YIsiuH0X3Yx0bFEc6RSiG3oVqKT9sp5HGw2hW1aDhHlB5lQ";
