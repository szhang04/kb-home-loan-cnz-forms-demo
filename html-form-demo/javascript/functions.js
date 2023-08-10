var show_JSON = false;
var xml_string = "";
var schema;
var resolver;
var all_lixi_paths;
var active_tab_id;
var xml_string_previous;
let modal_full_path_arr = [];

let old_context_xml = null;
let old_context_json = null;
let highlight_position = {
  xml: { start: 0, end: 0 },
  json: { start: 0, end: 0 },
};

Initialise();

$("#myModal").on("shown.bs.modal", function () {
  $("#myInput").trigger("focus");
});

$(window).on("load", function () {
  $("li.nav-item.active a").click();
  EnableInterface();
});

function Change_Tab_By_ID(Tab_ID) {
  // console.log("Change Tab By ID");
  tab_nav = "#" + Tab_ID + "tab";
  $(tab_nav).click();
}

function Repair_XML() {
  // Add Sequence Numbers to Borrowers
  lixi_package = xmlbuilder2.create(xml_string);
  borrower_xpath =
    '/Package/Content/Application/PersonApplicant[@ApplicantType="Borrower"]';
  var borrowers = xpath.select(borrower_xpath, lixi_package.node);
  for (var i = 0; i < borrowers.length; i++) {
    borrower = borrowers[i];
    borrower.setAttribute("SequenceNumber", (i + 1).toString());

    // Add sequence numbers to PAYG
    employment_xpath = "Employment";
    var employment_paygs = xpath.select(employment_xpath, borrower);
    for (var j = 0; j < employment_paygs.length; j++) {
      employment_payg = employment_paygs[j];
      employment_payg.setAttribute("SequenceNumber", (j + 1).toString());
    }
  }

  // Add sequence numbers to Households
  households_xpath = "/Package/Content/Application/Household";
  var households = xpath.select(households_xpath, lixi_package.node);
  for (var i = 0; i < households.length; i++) {
    household = households[i];
    household.setAttribute("SequenceNumber", (i + 1).toString());

    // Add sequence numbers to Dependant
    dependants_xpath = "Dependant";
    var dependants = xpath.select(dependants_xpath, household);
    for (var j = 0; j < dependants.length; j++) {
      dependant = dependants[j];
      dependant.setAttribute("SequenceNumber", (j + 1).toString());
    }
  }

  // Add sequence numbers to Non Real Estate Assets
  nonrealestateassets_xpath = "/Package/Content/Application/NonRealEstateAsset";
  var nonrealestateassets = xpath.select(
    nonrealestateassets_xpath,
    lixi_package.node
  );
  for (var i = 0; i < nonrealestateassets.length; i++) {
    nonrealestateasset = nonrealestateassets[i];
    nonrealestateasset.setAttribute("SequenceNumber", (i + 1).toString());

    // Add sequence numbers to Owners
    owners_xpath = "PercentOwned/Owner";
    var owners = xpath.select(owners_xpath, nonrealestateasset);
    for (var j = 0; j < owners.length; j++) {
      owner = owners[j];
      owner.setAttribute("SequenceNumber", (j + 1).toString());
    }
  }

  // Add sequence numbers to Liabilities
  liabilities_xpath = "/Package/Content/Application/Liability";
  var liabilities = xpath.select(liabilities_xpath, lixi_package.node);
  for (var i = 0; i < liabilities.length; i++) {
    liability = liabilities[i];
    liability.setAttribute("SequenceNumber", (i + 1).toString());
    // Add sequence numbers to Owners
    owners_xpath = "PercentOwned/Owner";
    var owners = xpath.select(owners_xpath, liability);
    for (var j = 0; j < owners.length; j++) {
      owner = owners[j];
      owner.setAttribute("SequenceNumber", (j + 1).toString());
    }
  }

  // Add sequence numbers to properties being purchased
  purchases_xpath =
    '/Package/Content/Application/RealEstateAsset[@Transaction="Purchasing"]';
  var purchases = xpath.select(purchases_xpath, lixi_package.node);
  for (var i = 0; i < purchases.length; i++) {
    purchase = purchases[i];
    purchase.setAttribute("SequenceNumber", (i + 1).toString());
  }
  xml_string = lixi_package.end({ prettyPrint: true });
  Import_Field_Values_From_XML(lixi_package);
  Set_Default_Values();
  Display_Message(lixi_package);
  Enable_Dependant_Fields(lixi_package, active_tab_id);
  Update_Cross_Reference_Fields(lixi_package);
  Update_Buttons();
}

function Initialise() {
  // console.log("Initialise.")
  parser = new DOMParser();
  schema = parser.parseFromString(schema_string, "text/xml");
  evaluator = new XPathEvaluator();
  resolver = evaluator.createNSResolver(schema.documentElement);
}

function Initialise_Tab(tab_nav_obj) {
  // console.log(tab_nav_obj);

  if (tab_nav_obj) {
    // console.log("Start Initialise Tab")
    active_tab_id = "#" + tab_nav_obj.id.replace("tab", "");
    active_tab = $(active_tab_id + ' [data-toggle="tooltip"]');
    lixi_package = xmlbuilder2.create(xml_string);
    Import_Field_Values_From_XML(lixi_package);
    Set_Default_Values();
    Display_Message(lixi_package);
    Enable_Dependant_Fields(lixi_package, active_tab_id);
    Update_Cross_Reference_Fields(lixi_package);
    Update_Buttons();
    // console.log("End Initialise Tab")
  }
}

function insert_another(xpath, value) {
  full_xpath = xpath + '="' + value + '"';
  var results_array = insert_xpath_recursive(full_xpath, xml_string);
  xml_string = results_array[1];
}

function Insert_XML(full_xpath) {
  message_not_initialised = false;
  // console.log("Insert Attribute")
  var results_array = insert_xpath_recursive(full_xpath, xml_string);
  xml_string = results_array[1];
  Remove_Empty_Items();
  lixi_package = xmlbuilder2.create(xml_string);
  Display_Message(lixi_package);
  Enable_Dependant_Fields(lixi_package);
  Update_Cross_Reference_Fields(lixi_package);
  lixi_package = xmlbuilder2.create(xml_string);
  Import_Field_Values_From_XML(lixi_package);
  //Set_Default_Values();
  Display_Message(lixi_package);
  displayMessage_kafka(full_xpath, "OFFLINE");
  Enable_Dependant_Fields(lixi_package, active_tab_id);
  Update_Cross_Reference_Fields(lixi_package);
  Update_Buttons();
}

function On_Change_Update_XML(e) {
  message_not_initialised = false;
  // console.log("On Change Update XML.")
  var xpath = e.target.attributes["xpath"].value;
  // escape these characters  // &<>"'
  var value = Escape_XML_Char_To_Hex(e.target.value);
  if (value == "") {
    value = "{delete}";
  }
  full_xpath = xpath + '="' + value + '"';
  results_array = insert_xpath_recursive(full_xpath, xml_string);
  xml_string = results_array[1];
  console.log(xml_string);
  Remove_Empty_Items();
  lixi_package = xmlbuilder2.create(xml_string);
  Import_Field_Values_From_XML(lixi_package);
  Display_Message(lixi_package);
  displayMessage_kafka(full_xpath, "OFFLINE");
  Enable_Dependant_Fields(lixi_package, active_tab_id);
  Update_Buttons();
}

function Escape_XML_Hex_To_HTML(my_string) {
  return my_string
    .replaceAll("%26", "&amp;")
    .replaceAll("%3C", "&lt;")
    .replaceAll("%3E", "&gt;")
    .replaceAll("%22", "&quot;")
    .replaceAll("%27", "&apos;")
    .replaceAll("%5C", "\\");
}

function Escape_JSON_Hex_To_JSON(my_string) {
  return my_string
    .replaceAll("%26", "&")
    .replaceAll("%3C", "<")
    .replaceAll("%3E", ">")
    .replaceAll("%22", '\\"')
    .replaceAll("%27", "'")
    .replaceAll("%5C", "\\\\")
    .replaceAll("\t", "\\\t");
}

function Escape_JSON_To_Hex(my_string) {
  return my_string
    .replaceAll("&", "%26")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E")
    .replaceAll("\\\\", "%5C")
    .replaceAll('\\"', "%22")
    .replaceAll("'", "%27");
}

function Escape_XML_Char_To_Hex(my_string) {
  return my_string
    .replaceAll("&", "%26")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E")
    .replaceAll('"', "%22")
    .replaceAll("'", "%27");
}

function Escape_XML_HTML_To_Hex(my_string) {
  return my_string
    .replaceAll("&amp;", "%26")
    .replaceAll("&lt;", "%3C")
    .replaceAll("&gt;", "%3E")
    .replaceAll("&quot;", "%22")
    .replaceAll("&apos;", "%27");
}

function Escape_XML_Hex_To_Char(my_string) {
  return my_string
    .replaceAll("%26", "&")
    .replaceAll("%3C", "<")
    .replaceAll("%3E", ">")
    .replaceAll("%22", '"')
    .replaceAll("%27", "'")
    .replaceAll("%5C", "\\");
}

function Update_Buttons() {
  // console.log("Update Buttons");
  var buttons = document.querySelectorAll("button[xpath]");
  for (var index = 0; index < buttons.length; index++) {
    button = buttons[index];
    var prerequisite = "boolean(" + button.attributes["xpath"].value + ")";
    // console.log("prerequisite: " + prerequisite);
    var result = xpath.select(prerequisite, lixi_package.node);
    if (result) {
      // console.log("found")
      button.classList.remove("btn-primary");
      button.classList.add("btn-success");
    } else {
      // console.log("Not Found")
      button.classList.add("btn-primary");
      button.classList.remove("btn-success");
    }
  }
}

function On_Change_Update_Modal(e) {
  if (e) {
    // console.log("On Change Update Modal")
    var ccsSelector = ".modal.fade.in";
    var active_modal = document.querySelector(ccsSelector);
    var active_modal_id = "#" + active_modal.id;
    var xpath = e.target.attributes["xpath"].value;
    var value = e.target.value;
    if (value == "") {
      value = "{delete}";
    }
    // console.log(xpath);
    full_xpath = xpath + '="' + value + '"';
    modal_full_path_arr.unshift(full_xpath);
    results_array = insert_xpath_recursive(full_xpath, xml_string);
    Remove_Empty_Items();
    xml_string = results_array[1];
    lixi_package = xmlbuilder2.create(xml_string);
    Display_Message(lixi_package);

    if (!isConnectedToKafka) displayMessage_kafka(full_xpath, "OFFLINE");

    Enable_Dependant_Fields(lixi_package, active_modal_id);
  }
}

function Cancel_Modal() {
  //delete shard
  Reset_Element(modal_full_path_arr);

  xml_string = xml_string_previous;
  lixi_package = xmlbuilder2.create(xml_string_previous);
  let active_tab_link = document.querySelector(".nav-item.active a");
  Initialise_Tab(active_tab_link);
}

function Submit_Modal() {
  let active_tab_link = document.querySelector(".nav-item.active a");
  Initialise_Tab(active_tab_link);
}

function Reset_Field(field_path) {
  full_xpath = field_path + '=""';
  xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];
  Remove_Empty_Items(xml_string);
  Update_Everything();
}

function Reset_Element_XML(field_path) {
  // console.log("Reset Element")
  //If reset a modal
  if (Array.isArray(field_path)) {
    var xpath_array = [];

    field_path.forEach(function (xpath) {
      let full_xpath = "not(" + xpath + ")";
      xpath_array.push(full_xpath);

      Reset_Element_XML(xpath);
    });

    //displayMessage_kafka(message, 'OFFLINE');
  } else {
    //If reset a single element
    var lixi_package = xmlbuilder2.create(xml_string);
    if (xpath.select(field_path, lixi_package.node).length > 0) {
      var elements = xpath.select(field_path, lixi_package.node);
      for (var kindex = 0; kindex < elements.length; kindex++) {
        var element = elements[kindex];
        element.remove();
      }
      xml_string = lixi_package.end({ prettyPrint: true });
    }
    Remove_Empty_Items(xml_string);
    let active_tab_link = document.querySelector(".nav-item.active a");
    Initialise_Tab(active_tab_link);
    let message = "not(" + field_path + ")";
    displayMessage_kafka(message, "OFFLINE");
  }
}

function RemoveAttachment_XML(list_of_xpaths) {
  if (Array.isArray(list_of_xpaths)) {
    var xpath_array = [];
    list_of_xpaths.forEach(function (field_path) {
      full_xpath = field_path + '="{delete}"';
      xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];
      xpath_array.push(full_xpath);
    });
    Remove_Empty_Items(xml_string);
    lixi_package = xmlbuilder2.create(xml_string);
    Import_Field_Values_From_XML(lixi_package);
    Set_Default_Values();
    Display_Message(lixi_package);
    displayMessage_kafka(xpath_array.join("<br/>"), "OFFLINE");
    Enable_Dependant_Fields(lixi_package, active_tab_id);
    Update_Cross_Reference_Fields(lixi_package);
    Update_Buttons();
  } else {
    Reset_Field(list_of_xpaths);
  }
}

function Close_Panel(_xpath) {
  Reset_Element(_xpath);
  Repair_XML();
}

function Set_Default_Values() {
  // console.log("Set Default Values.")
  var inputs = document.querySelectorAll(
    "#myTabContent input, #myTabContent select"
  );
  for (var kindex = 0; kindex < inputs.length; kindex++) {
    var this_input = inputs[kindex];
    var placeholder_value = this_input.getAttribute("placeholder");
    if (placeholder_value) {
      this_input.setAttribute("value", placeholder_value);
      var full_xpath =
        this_input.getAttribute("xpath") + '="' + placeholder_value + '"';
      xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];
    }
    if (
      this_input.getAttribute("xpath") ==
      "/Package/SchemaVersion/@LIXITransactionType"
    ) {
      var xpath = '//xs:attribute[@name="LIXITransactionType"]/@fixed';
      var LIXITransactionType = schema
        .evaluate(xpath, schema, resolver, XPathResult.ANY_TYPE, null)
        .iterateNext().textContent;
      this_input.setAttribute("value", LIXITransactionType);
      var full_xpath =
        '/Package/SchemaVersion/@LIXITransactionType="' +
        LIXITransactionType +
        '"';
      xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];
    }
    if (
      this_input.getAttribute("xpath") == "/Package/SchemaVersion/@LIXIVersion"
    ) {
      var xpath = '//xs:attribute[@name="LIXIVersion"]/@fixed';
      var LIXIVersion = schema
        .evaluate(xpath, schema, resolver, XPathResult.ANY_TYPE, null)
        .iterateNext().textContent;
      this_input.setAttribute("value", LIXIVersion);
      var full_xpath =
        '/Package/SchemaVersion/@LIXIVersion="' + LIXIVersion + '"';
      xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];
    }
  }
}

function get_lixi_path(xpath_string) {
  outer_xpath = get_inner_matches(xpath_string, (strict = true))[0];
  lixi_path = outer_xpath.replace("@", "").replace(/\//g, ".").substring("1");
  return lixi_path;
}

function get_all_paths() {
  var paths = [];
  var xpath = "//lx:path/text()";
  var paths_result = schema.evaluate(
    xpath,
    schema,
    resolver,
    XPathResult.ANY_TYPE,
    null
  );
  while ((path_value = paths_result.iterateNext())) {
    paths.push(path_value.textContent);
  }
  return paths;
}

function Enable_Dependant_Fields(lixi_package, container_id) {
  // console.log("Start Enable Dependant Fields")
  var ccsSelector = "*[prerequisite]";
  // console.log(ccsSelector);

  var dependentFields = document.querySelectorAll(ccsSelector);
  for (var jindex = 0; jindex < dependentFields.length; jindex++) {
    var dependentField = dependentFields[jindex];
    var prerequisite =
      "boolean(" + dependentField.attributes["prerequisite"].value + ")";
    var result = xpath.select(prerequisite, lixi_package.node);
    if (result) {
      dependentField.classList.remove("lixi-inactive");
      dependentField.classList.add("lixi-active");
    } else {
      dependentField.classList.add("lixi-inactive");
      dependentField.classList.remove("lixi-active");
    }
  }
  // console.log("End Enable Dependant Fields")
}

function Remove_Empty_Items() {
  // console.log("Remove Empty Items.")
  var prev = "";
  while (xml_string != prev) {
    prev = xml_string;
    xml_string = xml_string.replaceAll(/(\s+[a-zA-Z0-9_]+\s*=\s*"")/gm, "");
    lixi_package = xmlbuilder2.create(xml_string);
    xml_string = lixi_package.end({ prettyPrint: true });
    xml_string = xml_string.replaceAll(
      /(<[a-zA-Z]+\s*\/>|<\s+[a-zA-Z]+\s*\/>)/gm,
      ""
    );
  }
}

var parser = new DOMParser();
var XML_to_JSON_DOM = parser.parseFromString(XML_to_JSON, "text/xml");

function create_json(xml_string) {
  var xsltProcessor = new XSLTProcessor();
  var XMLdom = parser.parseFromString(xml_string, "text/xml");
  xsltProcessor.importStylesheet(XML_to_JSON_DOM);
  var resultDocument = xsltProcessor.transformToFragment(XMLdom, document);
  var jsonString = new XMLSerializer().serializeToString(resultDocument);
  var parseJSON = JSON.parse(jsonString);
  var JSONInPrettyFormat = JSON.stringify(parseJSON, undefined, 4);
  return JSONInPrettyFormat;
}

function Display_Message(lixi_package) {
  xml_string_before_truncation = lixi_package.end({ prettyPrint: true });
  lixi_package_temp = xmlbuilder2.create(xml_string_before_truncation);

  var results = xpath.select(
    "/Package/Attachment/InlineAttachment",
    lixi_package_temp.node
  );
  for (var j = 0; j < results.length; j++) {
    result = results[j];
    result.textContent = result.textContent.substring(0, 22) + "...";
  }
  xml_string_for_display = lixi_package_temp.end({ prettyPrint: true });

  //XML Highlight
  let context_xml = Escape_XML_Hex_To_HTML(xml_string_for_display);
  old_context_xml = hightlight_compare(context_xml, old_context_xml, true);

  //JSON Highlight
  let context_json;
  try {
    context_json = Escape_JSON_Hex_To_JSON(create_json(xml_string_for_display));
    old_context_json = hightlight_compare(
      context_json,
      old_context_json,
      false
    );
  } catch (e) {
    //xml_string_for_display is too short
  }

  if (show_JSON == false) {
    //textarea.value = context;
    document.getElementById("highlight-content").classList.add("language-xml");
    document
      .getElementById("highlight-content")
      .classList.remove("language-json");

    let start = highlight_position["xml"]["start"];
    let end = highlight_position["xml"]["end"];

    update_syntax_hightlight(context_xml, start, end);
  } else {
    //textarea.value = context;

    document.getElementById("highlight-content").classList.add("language-json");
    document
      .getElementById("highlight-content")
      .classList.remove("language-xml");

    let start = highlight_position["json"]["start"];
    let end = highlight_position["json"]["end"];

    update_syntax_hightlight(context_json, start, end);
  }
}

//Highlight all code with prism
function update_syntax_hightlight(text, start, end) {
  //If not the new document
  if (end > 0)
    document
      .getElementById("highlight")
      .setAttribute("data-line", start + "-" + end);

  let result_element = document.querySelector("#highlight-content");
  // Handle final newlines (see article)
  if (text[text.length - 1] == "\n") {
    text += " ";
  }
  // Update code
  result_element.innerHTML = text
    .replace(new RegExp("&", "g"), "&amp;")
    .replace(new RegExp("<", "g"), "&lt;"); /* Global RegExp */

  // Syntax Highlight
  Prism.highlightElement(result_element);

  //Focus on hightlight
  let line_hightlight = $(".line-highlight");

  if (line_hightlight.length > 0) {
    line_hightlight[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

var message_not_initialised = true;

//Hightlight only newly added fields background color
function hightlight_compare(new_context, old_context, isXML) {
  let start = 0;
  let end = 0;
  let dataType = isXML ? "xml" : "json";

  //If open page for the first time
  if (old_context === null) return new_context;

  //If switch between XML/JSON -> load the positions
  if (old_context === new_context) {
    start = highlight_position[dataType]["start"];
    end = highlight_position[dataType]["end"];
  } //If context is updated with new fields
  else {
    //Array of Lines
    let arr_new = new_context.split("\n");
    let arr_old = old_context.split("\n");

    let Num_lines = arr_new.length;

    while (start < Num_lines) {
      if (arr_new[start] !== arr_old[start]) break;
      start++;
    }
    start++;

    end = Num_lines;
    for (let i = 1; i < Num_lines; i++) {
      if (arr_new[arr_new.length - i] !== arr_old[arr_old.length - i]) break;
      end--;
    }

    if (end == Num_lines) end = -1;

    //Save the position
    highlight_position[dataType]["start"] = start;
    highlight_position[dataType]["end"] = end;
  }

  if (message_not_initialised == true) {
    return new_context;
  }

  return new_context;
}

function EnableInterface() {
  // console.log("Enable Interface.")
  var spinner = document.getElementById("lixi-loading-spinner");
  spinner.style.display = "none";
  document.getElementById("my-container").classList.remove("lixi-ui-disabled");
}

function DisableInterface() {
  // console.log("Disable Interface.")
  var spinner = document.getElementById("lixi-loading-spinner");
  spinner.style.display = "block";
  document.getElementById("my-container").classList.add("lixi-ui-disabled");
}

function UploadAttachment_XML(xpath) {
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (readerEvent) => {
      var content = readerEvent.target.result;
      var contentArray = content.split(";base64,");
      var base64 = contentArray[1];
      var mediatype = contentArray[0].slice(5);
      var xpath_array = [];

      var full_xpath = xpath + '="' + base64 + '"';
      results_array = insert_xpath_recursive(full_xpath, xml_string);
      xml_string = results_array[1];
      xpath_array.push(full_xpath);

      var mediatypeXpath =
        xpath.replace("/InlineAttachment/text()", "/@MediaType") +
        '="' +
        mediatype +
        '"';
      results_array = insert_xpath_recursive(mediatypeXpath, xml_string);
      xml_string = results_array[1];
      xpath_array.push(mediatypeXpath);

      var filenameXpath =
        xpath.replace("/InlineAttachment/text()", "/@Filename") +
        '="' +
        file.name +
        '"';
      results_array = insert_xpath_recursive(filenameXpath, xml_string);
      xml_string = results_array[1];
      xpath_array.push(filenameXpath);

      lixi_package = xmlbuilder2.create(xml_string);
      Import_Field_Values_From_XML(lixi_package);
      Set_Default_Values();
      Display_Message(lixi_package);
      displayMessage_kafka(xpath_array.join("<br/>"), "OFFLINE");
      Enable_Dependant_Fields(lixi_package, active_tab_id);
      Update_Cross_Reference_Fields(lixi_package);
      Update_Buttons();
    };
  };
  input.click();
}

function SubmitToAPI_Copy() {
  apikey = document.getElementById("api-key").value;
  if (apikey == "") {
    alert("Please contact LIXI for an API Key.");
    return;
  }
  var url = document.getElementById("api-url").value;
  var mime = "application/xml";
  var method = "POST";
  var xhr = createCORSRequest(method, url);

  xhr.onload = function () {
    var text = xhr.responseText;
    var blob;
    if (show_JSON) {
      blob = new Blob([text], { type: "text/json" });
    } else {
      blob = new Blob([text], { type: "text/xml" });
    }
    let url = URL.createObjectURL(blob);
    window.open(url);
    URL.revokeObjectURL(url);
    EnableInterface();
  };

  xhr.onerror = function () {
    var text = xhr.responseText;
    var blob;
    if (show_JSON) {
      blob = new Blob([text], { type: "text/json" });
    } else {
      blob = new Blob([text], { type: "text/xml" });
    }
    let url = URL.createObjectURL(blob);
    window.open(url);
    URL.revokeObjectURL(url);
    EnableInterface();
  };
  xhr.setRequestHeader("Content-Type", mime);
  xhr.setRequestHeader("x-api-key", apikey);
  if (show_JSON) {
    var converted_json = create_json(xml_string);
    xhr.send(converted_json);
  } else {
    xhr.send(xml_string);
  }
  DisableInterface();
}

// utility method to create the request factory
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else xhr = null;
  return xhr;
}

function ExportPackage() {
  if (show_JSON) {
    var converted_json = create_json(xml_string);
    var hiddenElement = document.createElement("a");
    hiddenElement.href =
      "data:attachment/text," +
      encodeURI(Escape_JSON_Hex_To_JSON(converted_json));
    hiddenElement.target = "_blank";
    hiddenElement.download = "download.json";
    hiddenElement.click();
  } else {
    var formattedXML = xml_string;
    var hiddenElement = document.createElement("a");
    hiddenElement.href =
      "data:attachment/text," + encodeURI(Escape_XML_Hex_To_HTML(formattedXML));
    hiddenElement.target = "_blank";
    hiddenElement.download = "download.xml";
    hiddenElement.click();
  }
}

function ImportPackage() {
  // console.log("Import Package.")
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    // console.log("ImportPackage: onchange");
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (readerEvent) => {
      var content = readerEvent.target.result;
      if (content.startsWith("{")) {
        show_JSON = true;
      } else {
        show_JSON = false;
      }
      if (show_JSON) {
        // console.log(content);
        xml_string = Escape_JSON_To_Hex(content);
        // console.log(xml_string);
      } else {
        xml_string = Escape_XML_HTML_To_Hex(content);
      }
    };

    reader.onloadend = function () {
      // console.log("ImportPackage: onloadend");
      active_tab = $(active_tab_id + ' [data-toggle="tooltip"]');
      lixi_package = xmlbuilder2.create(xml_string);
      Import_Field_Values_From_XML(lixi_package);
      Set_Default_Values();
      Display_Message(lixi_package);
      Enable_Dependant_Fields(lixi_package, active_tab_id);
      Update_Cross_Reference_Fields(lixi_package);

      lixi_package = xmlbuilder2.create(xml_string);
      Import_Field_Values_From_XML(lixi_package);
      Set_Default_Values();
      Display_Message(lixi_package);
      Enable_Dependant_Fields(lixi_package, active_tab_id);
      Update_Cross_Reference_Fields(lixi_package);
      Update_Buttons();
      // console.log("End Initialise Tab")
    };
  };
  input.click();
}

function Update_Cross_Reference_Fields(lixi_package) {
  // console.log("Start Update cross-reference fields.")
  var cross_ref_fields = document.querySelectorAll(
    active_tab_id + " .entity-selector"
  );

  for (var j = 0; j < cross_ref_fields.length; j++) {
    var this_input = cross_ref_fields[j];
    var selected_option = this_input.value;
    var lixi_xpath = this_input.attributes["xpath"].value;
    var entity_type = this_input.attributes["entity-type"].value;
    var targets_str = this_input.attributes["targets"].value.replace(
      /\'/g,
      '"'
    );
    var references = JSON.parse(targets_str);

    var entities = [];
    for (var k = 0; k < references.length; k++) {
      var reference = references[k];
      var referenceXPath = "/" + reference.replaceAll(".", "/");
      if (referenceXPath == "/Package/Content/Application/Funder") {
        entity_type = "Funder";
      } else if (
        referenceXPath == "/Package/Content/Application/PersonApplicant"
      ) {
        entity_type = "Person Applicant";
      } else if (
        referenceXPath == "/Package/Content/Application/CompanyApplicant"
      ) {
        entity_type = "Company Applicant";
      } else if (
        referenceXPath == "/Package/Content/Application/RealEstateAsset"
      ) {
        entity_type = "Real Estate Asset";
      } else if (
        referenceXPath == "/Package/Content/Application/NonRealEstateAsset"
      ) {
        entity_type = "Non Real Estate Asset";
      } else if (
        referenceXPath == "/Package/Content/Application/RelatedCompany"
      ) {
        entity_type = "Related Company";
      }

      var result = xpath.evaluate(
        referenceXPath, // xpathExpression
        lixi_package.node, // contextNode
        null, // namespaceResolver
        xpath.XPathResult.ANY_TYPE, // resultType
        null // result
      );
      node = result.iterateNext();
      while (node) {
        var uniqueID = "";
        if (xpath.select("@UniqueID", node)[0])
          uniqueID = xpath.select("@UniqueID", node)[0].value;
        else {
          var value_of_uniqueID = "x" + uuid();
          node.setAttribute("UniqueID", value_of_uniqueID);
          xml_string = lixi_package.end({ prettyPrint: true });
          Import_Field_Values_From_XML(lixi_package);
        }

        if (!(entity_type in entity_string_representations)) {
          alert("Error: Entity type not found: " + entity_type);
        }

        var string_components = entity_string_representations[entity_type];
        var entity_string = "";
        for (var l = 0; l < string_components.length; l++) {
          var string_component_xpath = string_components[l];
          var string_component_xpath_without_variable =
            string_component_xpath.replace("$UniqueID", uniqueID);
          if (xpath.select(string_component_xpath_without_variable, node)[0]) {
            entity_string +=
              xpath.select(string_component_xpath_without_variable, node)[0]
                .value + " ";
          }
        }
        if (uniqueID != "" && entity_string != "")
          entities.push([entity_string, uniqueID]);
        node = result.iterateNext();
      }
    }
    create_drop_down_menu(this_input, entities, selected_option);
  }
  // console.log("End Update cross-reference fields.")
}

function create_drop_down_menu(this_input, entities, selected_option) {
  // console.log("Create Drop Down Menu")
  var original_attributes = [];
  for (var i = 0; i < this_input.attributes.length; ++i) {
    var attribute = this_input.attributes[i];
    if (attribute.name != "type" && attribute.name != "value") {
      original_attributes.push([attribute.name, attribute.value]);
    }
  }
  var lixi_xpath = this_input.attributes["xpath"].value;
  modal_id = null;
  if (this_input.getAttribute("modal")) {
    modal_id = this_input.attributes["modal"].value;
  }
  if (lixi_xpath.endsWith("/text()")) {
    lixi_xpath = lixi_xpath.replace("/text()");
  }

  var select_element = document.createElement("select");
  for (var j = 0; j < original_attributes.length; ++j) {
    original_attribute = original_attributes[j];
    select_element.setAttribute(original_attribute[0], original_attribute[1]);
  }
  // create unique ID for new entity
  var newUUID = "x" + uuid();
  if (modal_id != "None") {
    select_element.setAttribute(
      "onchange",
      "if (this.selectedIndex == 1) { New_Entity_Modal('" +
        modal_id +
        "','" +
        newUUID +
        "'); } else {$('.tooltip').tooltip('hide');}"
    );
  }

  // blank option (nothing selected)
  var option_element = document.createElement("option");
  option_element.selected = true;
  option_element.textContent = "";
  select_element.appendChild(option_element);
  // if there is a entity type then appen a enw option
  // new option (trigger modal to create new)
  if (modal_id != "None") {
    var option_element = document.createElement("option");
    option_element.textContent = "New...";
    option_element.setAttribute("value", newUUID);
    select_element.appendChild(option_element);
  }
  for (var j = 0; j < entities.length; j++) {
    var entity = entities[j];
    var entity_name = entity[0];
    var entity_ID = entity[1];
    var option_element = document.createElement("option");
    option_element.setAttribute("value", entity_ID);
    option_element.textContent = entity_name;
    if (selected_option == entity_ID) {
      option_element.selected = true;
    }
    select_element.appendChild(option_element);
  }
  this_input.parentNode.insertBefore(select_element, this_input);
  this_input.remove();
  select_element.addEventListener("change", Update_XML);
  // $(select_element).tooltip();
}

function New_Entity_Modal(this_modal_id, newUUID) {
  //reset modal_full_path_arr
  modal_full_path_arr = [];

  // deep copy of xml string
  xml_string_previous = (" " + xml_string).slice(1);

  var css_selector = "#" + this_modal_id;
  $(css_selector).modal("show");
  var this_modal = document.getElementById(this_modal_id);

  let xpath = null;

  var rows = this_modal.querySelectorAll(".row");
  for (var index = 0; index < rows.length; index++) {
    var this_row = rows[index];
    if (this_row.hasAttribute("prerequisite-variable")) {
      var prerequisite_with_variable = this_row.getAttribute(
        "prerequisite-variable"
      );
      this_row.setAttribute(
        "prerequisite",
        prerequisite_with_variable.replace("$UniqueID", newUUID)
      );

      if (xpath == null) {
        const myArray = prerequisite_with_variable.split('$UniqueID"]/');
        xpath = myArray[0] + newUUID + '"]';
        modal_full_path_arr.unshift(xpath);
      }
    }
  }

  var inputs = this_modal.querySelectorAll("input, select");
  for (var index = 0; index < inputs.length; index++) {
    var this_input = inputs[index];
    this_input.value = "";
    if (this_input.hasAttribute("xpath-variable")) {
      var xpath_with_variable = this_input.getAttribute("xpath-variable");
      this_input.setAttribute("xpath", xpath_with_variable);
    }
    var xpath_with_variable = this_input.getAttribute("xpath");
    var xpath_with_new_uniqueID = xpath_with_variable.replace(
      "$UniqueID",
      newUUID
    );
    this_input.setAttribute("xpath-variable", xpath_with_variable);
    this_input.setAttribute("xpath", xpath_with_new_uniqueID);
    if (this_input.hasAttribute("prerequisite-variable")) {
      var prerequisite_with_variable = this_input.getAttribute(
        "prerequisite-variable"
      );
      this_input.setAttribute(
        "prerequisite",
        prerequisite_with_variable.replace("$UniqueID", newUUID)
      );
    }
    // console.log("Add Listener")
    this_input.addEventListener("change", Update_Modal);
    // $(this_input).tooltip();
  }
  Enable_Dependant_Fields(lixi_package, css_selector);
}

function Import_Field_Values_From_XML(lixi_package) {
  // console.log("Start Import Field Values From_XML.")

  // console.log(xml_string);

  var inputs = document.querySelectorAll(
    active_tab_id +
      " input, " +
      active_tab_id +
      " textarea, " +
      active_tab_id +
      " select, " +
      active_tab_id +
      " img, " +
      active_tab_id +
      " iframe, " +
      active_tab_id +
      " embed, " +
      active_tab_id +
      " object"
  );

  for (var index = 0; index < inputs.length; index++) {
    var input = inputs[index];
    if (input.hasAttribute("xpath")) {
      var this_xpath = input.attributes["xpath"].value;
      if (this_xpath.endsWith("text()")) {
        mediatype_xpath = this_xpath.replace(
          "InlineAttachment/text()",
          "@MediaType"
        );
        var mediatype_result = xpath.select(mediatype_xpath, lixi_package.node);
        var result = xpath.select(this_xpath, lixi_package.node);
        if (mediatype_result.length > 0 && result.length > 0) {
          var mediatype = mediatype_result[0].textContent;
          if (mediatype == "application/pdf") {
            var parentOfInput = input.parentElement;
            parentOfInput.removeChild(input);
            var iframe = document.createElement("iframe");
            var attributes = input.attributes;
            for (let i = 0; i < attributes.length; i++) {
              attribute = attributes[i];
              iframe.setAttribute(attribute.name, attribute.value);
            }
            parentOfInput.appendChild(iframe);
            iframe.src =
              "data:" + mediatype + ";base64," + result[0].textContent;
          } else if (mediatype.startsWith("text")) {
            var parentOfInput = input.parentElement;
            parentOfInput.removeChild(input);
            var textarea = document.createElement("textarea");
            var attributes = input.attributes;
            for (let i = 0; i < attributes.length; i++) {
              attribute = attributes[i];
              if (attribute.name != "src") {
                textarea.setAttribute(attribute.name, attribute.value);
              }
            }
            parentOfInput.appendChild(textarea);
            textarea.textContent = atob(result[0].textContent);
          } else {
            var parentOfInput = input.parentElement;
            parentOfInput.removeChild(input);
            var image = document.createElement("img");
            var attributes = input.attributes;
            for (let i = 0; i < attributes.length; i++) {
              attribute = attributes[i];
              image.setAttribute(attribute.name, attribute.value);
            }
            parentOfInput.appendChild(image);
            image.src =
              "data:" + mediatype + ";base64," + result[0].textContent;
          }
        } else if (result.length > 0) {
          input.src = result[0].textContent;
        }
      } else {
        let xpath_sections = split_on_and(this_xpath);
        let last_xpath_section = xpath_sections[xpath_sections.length - 1];
        new_xpath = "string(" + last_xpath_section + ")";
        var result = xpath.select(new_xpath, lixi_package.node);
        input.value = Escape_XML_Hex_To_Char(result);
      }
    }
  }
  // console.log("End Import Field Values From_XML.")
}

function Clear_Field_Values() {
  // console.log("Clear Field Values");
  var inputs = document.querySelectorAll("input, select, img");
  for (var index = 0; index < inputs.length; index++) {
    var input = inputs[index];
    if (input.hasAttribute("xpath")) {
      input.value = "";
      input.src = "";
    }
  }
  xml_string = "";
  Set_Default_Values();
  lixi_package = xmlbuilder2.create(xml_string);
  Display_Message(lixi_package);
  Enable_Dependant_Fields(lixi_package, active_tab_id);
  Update_Cross_Reference_Fields(lixi_package);
  Update_Buttons();
}

function Validate() {
  var result = xmllint.validateXML({
    xml: xml_string,
    schema: unannotated_schema_string,
  });

  if (result.errors == null) {
    document.getElementById("validation-results").innerText = "Valid.";
  } else {
    var validation_results = "";
    result.errors.forEach(function (error) {
      validation_results +=
        String(
          error
            .replace("file_0.xml:", "")
            .replace("element", "")
            .replace("Schemas validity error :", "")
            .split(/\:(.+)/)[1]
        ) + "\n\n";
    });
    document.getElementById("validation-results").innerText =
      validation_results;
  }
}

function Schematron() {
  var parser = new DOMParser();
  var XSLTdom = parser.parseFromString(XSLT, "text/xml");
  var XMLdom = parser.parseFromString(xml_string, "text/xml");
  var xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(XSLTdom);
  var resultDocument = xsltProcessor.transformToDocument(XMLdom, document);
  var errors = resultDocument.querySelectorAll("failed-assert");
  var error_log = "";
  errors.forEach(function (error) {
    var diagnostic_message = error.querySelector("text").textContent;
    var error_location = error.getAttribute("location");
    error_log += diagnostic_message + "\n";
    error_log += "(" + error_location + ")\n\n";
  });
  if (error_log == "") {
    document.getElementById("schematron-results").innerText = "Valid.";
  } else {
    document.getElementById("schematron-results").innerText = error_log;
  }
}

let isDisplayCode = false;
let isDisplayShard = false;
let currentDocType = null;

function display(docType) {
  if (docType == "XML" || docType == "JSON") {
    if (isDisplayCode & (currentDocType == docType)) {
      Toggle_Display_Code();
    } else if (isDisplayCode & (currentDocType != docType)) {
      Toggle_Sticker(currentDocType);
      currentDocType = docType;
      Toggle_XML_JSON(currentDocType);
    } else if (!isDisplayCode) {
      currentDocType = docType;
      Toggle_Display_Code();
      Toggle_XML_JSON(currentDocType);
    }
  } else if (docType == "SHARD") {
    Toggle_Display_LIXI_Shard();
  }

  //Show-Hide right Panel
  if (!isDisplayCode && !isDisplayShard) ToggleDisplay(false);
  else ToggleDisplay(true);

  //Show-Hide Sticker on Dropdown Menu
  Toggle_Sticker(docType);

  //Show-Hide Vertical Resize Handler
  Toggle_resize_handle_y();
}

function Toggle_XML_JSON(docType) {
  // console.log("Toggle XML JSON")
  if (docType == "JSON") show_JSON = true;
  else show_JSON = false;
  lixi_package = xmlbuilder2.create(xml_string);
  Display_Message(lixi_package);
}

function ToggleDisplay(isDisplay) {
  //Hide Right Panel
  if (!isDisplay) {
    var formWrap = document.getElementById("form-wrap");
    formWrap.classList.remove("col-md-8");
    formWrap.classList.add("col-md-12");
    formWrap.style.removeProperty("width");

    var myContainer = document.getElementById("my-container");
    myContainer.classList.remove("container-fluid");
    myContainer.classList.add("container");

    var resize_handle = document.getElementById("resize-handle");
    resize_handle.classList.add("resize-hide");
    resize_handle.classList.remove("resize-show");

    var right_panel = document.getElementById("right-panel");
    right_panel.classList.add("display-hide");
  }
  //Show Right Panel
  else {
    var formWrap = document.getElementById("form-wrap");
    formWrap.classList.remove("col-md-12");
    formWrap.classList.add("col-md-8");

    var myContainer = document.getElementById("my-container");
    myContainer.classList.remove("container");
    myContainer.classList.add("container-fluid");

    var resize_handle = document.getElementById("resize-handle");
    resize_handle.classList.add("resize-show");
    resize_handle.classList.remove("resize-hide");

    var right_panel = document.getElementById("right-panel");
    right_panel.classList.remove("display-hide");

    Update_Width_Right_Panel();
  }

  let active_tab_link = document.querySelector(".nav-item.active a");
  Initialise_Tab(active_tab_link);
}

function Toggle_Display_Code() {
  isDisplayCode = !isDisplayCode;
  let showCode = document.getElementById("show-code-container");

  //Show
  if (isDisplayCode) {
    showCode.classList.remove("xml-hide");
  } else {
    //Hide
    showCode.classList.add("xml-hide");
  }
}

function Toggle_Display_LIXI_Shard() {
  isDisplayShard = !isDisplayShard;
  let showShard = document.getElementById("show-shard-container");
  //Show
  if (isDisplayShard) {
    showShard.classList.remove("display-hide");
  } else {
    //Hide
    showShard.classList.add("display-hide");
  }
}

function Toggle_Sticker(trigger) {
  id = "sticker-" + trigger;
  let sticker = document.getElementById(id);

  if (sticker.classList.contains("display-hide"))
    sticker.classList.remove("display-hide");
  else sticker.classList.add("display-hide");
}

function Toggle_resize_handle_y() {
  let resize_handle = document.getElementById("resize-handle-y");
  let showCode = $("#show-code-container");
  let showShard = document.getElementById("show-shard-container");

  if (isDisplayCode && isDisplayShard) {
    resize_handle.classList.remove("resize-hide");
    document
      .getElementById("show-code-container")
      .setAttribute("style", "max-height:90%");
    document
      .getElementById("show-code-container")
      .setAttribute("style", "height:50%");

    shard_height = showCode.height() - $("#resize-handle-y").height();
    document
      .getElementById("show-shard-container")
      .setAttribute("style", "height:" + shard_height + "px");
  } else {
    resize_handle.classList.add("resize-hide");
    document
      .getElementById("show-code-container")
      .setAttribute("style", "height:100%");
    document
      .getElementById("show-shard-container")
      .setAttribute("style", "height:100%");
  }
}

function HideNavbar() {
  subMenu = document.querySelectorAll(
    ".navbar .top-left .dropdown-wrap .dropdown-content"
  );

  subMenu.forEach(function (menu) {
    if (menu.childElementCount == 0) {
      menu.parentNode.style.display = "none";
    }
  });
}
