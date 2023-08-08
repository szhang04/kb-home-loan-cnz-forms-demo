let WEB_SOCKET_URL;
let ws              = null;
let authorID        = null;
let packageID       = null;
let lixiShard;
let payload;
let action;
let message_no      = 0;
let color_code = [[245,242,240,0], [0, 153, 255, 0.21], [33, 216, 122,0.15], [250, 34, 34,0.15], [73,34,250,0.15], [255, 218,0,0.15], [0, 80, 255,0.15]]
let my_color = [0, 153, 255, 0.21];
let color_code_rotate = 1;
let message_info_arr = [];

$.get("https://lixi-public.s3.ap-southeast-2.amazonaws.com/urls.json", function(response) { 
    WEB_SOCKET_URL = response["lixi-server"]
});

function ConnectToKafka(){

    //Disable Interface until successfully connected to server
    DisableInterface();

    if(isConnectedToKafka == true){
        DisconnectToKafka();
    }

    ws = new WebSocket(WEB_SOCKET_URL);

    //Clear all filled values
    Clear_Field_Values();
    displayMessage_kafka("All field values have been cleared!"+"\n", 'SYSTEM');

    isConnectedToKafka = true;
    Toggle_DisconnectedBtn();
    update_kafka_setting();
    displayMessage_kafka("AuthorID: " + authorID + "  PackageID: "+packageID+"\n \n", 'SYSTEM');

    // Connection opened
    ws.addEventListener('open', (e) => {

        let message = 'Connected to LIXI Server! \n';
        //console.log(message);
        displayMessage_kafka(message, 'SYSTEM');

        //Retrieve messages
        action = "Retrieve";
        message = Update_payload(null, action);
        ws.send(message);

        //Enable Interface
        EnableInterface();
    });

    // Listen to coming messages
    ws.addEventListener('message', (e) => {
        let lixiShard = JSON.parse(e.data);
        let message = lixiShard['LIXI Shard'];

        //If message is an array
        if (Array.isArray(message)){
            //If message is cancel Modal
            if (message[0].split('(')[0] == 'not') {
                message.forEach(function (full_xpath){
                    xml_string= insert_xpath_recursive(full_xpath, xml_string)[1];
                    Update_form();
                    displayMessage_kafka(full_xpath+"\n", lixiShard);
                });
            }
            else{ //If message is Attachment file
                message.forEach(function (full_xpath) {
                    xml_string = insert_xpath_recursive(full_xpath, xml_string)[1];  
                });

                if (message[1].includes('"{delete}"'))
                    Remove_Empty_Items(xml_string);
                Update_form_attachment();
                displayMessage_kafka(message.join("<br/>"), lixiShard);
            }
            
        } else {
            xml_string= insert_xpath_recursive(lixiShard['LIXI Shard'], xml_string)[1];
            Update_form();

            displayMessage_kafka(message+"\n", lixiShard);
        }
    });

    // Listen for possible errors
    ws.addEventListener('error', (e)  =>{
        console.log('WebSocket error: ', e);
        displayMessage_kafka("ERROR: Can't connect to LIXI Server \n", 'SYSTEM');
    });

    // Listen for socket close event
    ws.addEventListener('close', (event)  =>{
        console.log('WebSocket closed: ', event);
        
        var reason;
        // See https://www.rfc-editor.org/rfc/rfc6455#section-7.4.1
        if (event.code == 1000)
            reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
        else if(event.code == 1001)
            reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
        else if(event.code == 1002)
            reason = "An endpoint is terminating the connection due to a protocol error";
        else if(event.code == 1003)
            reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
        else if(event.code == 1004)
            reason = "Reserved. The specific meaning might be defined in the future.";
        else if(event.code == 1005)
            reason = "No status code was actually present.";
        else if(event.code == 1006)
           reason = "This session has been closed due to inactivity. To reconnect to the server select LIXI Shard Setting from the Tools menu.";
        else if(event.code == 1007)
            reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).";
        else if(event.code == 1008)
            reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
        else if(event.code == 1009)
           reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
        else if(event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
        else if(event.code == 1011)
            reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
        else if(event.code == 1015)
            reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
        else
            reason = "Unknown reason";

        if (event.code != 1000)
            displayMessage_kafka("Disconnected from LIXI Server! \n" + reason + " \n", 'SYSTEM');
        else 
            displayMessage_kafka("Disconnected to LIXI Server! \n", 'SYSTEM');
    });
}

function DisconnectToKafka(){
    ws.close();
    isConnectedToKafka = false;
    Toggle_DisconnectedBtn();
}

function Update_form(){
    Remove_Empty_Items();
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
}

function Update_form_attachment(){
    Remove_Empty_Items();
    lixi_package = xmlbuilder2.create(xml_string);
    Import_Field_Values_From_XML(lixi_package);
    Set_Default_Values();
    Display_Message(lixi_package);
    Enable_Dependant_Fields(lixi_package, active_tab_id);
    Update_Cross_Reference_Fields(lixi_package);
    Update_Buttons();
}

function On_Change_Update_XML_Kafka(e){
    message_not_initialised = false;
    var xpath = e.target.attributes['xpath'].value;
    var value = Escape_XML_Char_To_Hex(e.target.value);
    if (value ==""){
        value = "{delete}";
    }
    
    action = 'Submit';
    full_xpath = xpath + '="' + value + '"';
    let message = Update_payload(full_xpath, action);

    ws.send(message);
}

function Insert_XML_Kafka (full_xpath){
    message_not_initialised = false;
    action = 'Submit';
    let message = Update_payload(full_xpath, action);
    ws.send(message);
}

function Reset_Element_Kafka(full_xpath){
    action = 'Submit';
    let message;

    //If reset a modal
    if (Array.isArray(full_xpath)) {
        var xpath_array = [];

        full_xpath.forEach(function (xpath) {
            temp_full_xpath = "not(" + xpath +")";
            xpath_array.push(temp_full_xpath);
        });

        message = Update_payload(xpath_array, action);
    }
    else {  //If reset a single element
        message = Update_payload("not(" + full_xpath +")", action);
    }

    ws.send(message);
}

function On_Change_Update_Modal_Kafka(e){
    On_Change_Update_Modal(e)

    let xpath = e.target.attributes['xpath'].value;
    let value = Escape_XML_Char_To_Hex(e.target.value);
    if (value ==""){
        value = "{delete}";
    }

    action = 'Submit';
    let full_xpath = xpath + '="' + value + '"';
    let message = Update_payload(full_xpath, action);

    ws.send(message);
}

function UploadAttachment_Kafka(xpath){
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => { 
        var file = e.target.files[0]; 
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = readerEvent => {
            var content = readerEvent.target.result; 
            var contentArray = content.split(";base64,")
            var base64 = contentArray[1]
            var mediatype = contentArray[0].slice(5);
            var xpath_array = [];
            
            var full_xpath =  xpath + '="' + base64 + '"';
            xpath_array.push(full_xpath);

            var mediatypeXpath = xpath.replace("/InlineAttachment/text()","/@MediaType") + '="' + mediatype + '"';
            xpath_array.push(mediatypeXpath);

            var filenameXpath = xpath.replace("/InlineAttachment/text()","/@Filename") + '="' + file.name + '"';
            xpath_array.push(filenameXpath);
            
            action = 'Submit';
            let message = Update_payload(xpath_array, action);
        
            ws.send(message);
        }
    }
    input.click();
}

function RemoveAttachment_Kafka (list_of_xpaths) {
    if (Array.isArray(list_of_xpaths)) {
        var xpath_array = [];

        list_of_xpaths.forEach(function (field_path) {
            full_xpath = field_path + '="{delete}"';
            xpath_array.push(full_xpath);
        });

        action = 'Submit';
        let message = Update_payload(xpath_array, action);
    
        ws.send(message);
    }
}

function Update_payload(full_xpath, action){
    if (action == "Submit") {
        payload = JSON.stringify({
          "Action": action,
          "Author ID": authorID,
          "Package ID": packageID,
          "LIXI Shard": full_xpath
        }, undefined, 2)
    }
    else if (action == "Retrieve") {
        payload = JSON.stringify({
          "Action": action,
          "Author ID": authorID,
          "Package ID": packageID,
        }, undefined, 2)
    }

    return payload;
}

function displayMessage_kafka(message, lixiShard){
    update_message_info(message_no, lixiShard);
    message_no++;

    tooltiptext = message_info_arr[message_no-1]['Tooltip_text']
    color = message_info_arr[message_no-1]['color_code'];
    rgb_color = 'rgb('+color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] +')';

    //Break line on and for long shard
    let message_arr = split_on_and(message);
    if (message_arr.length > 1){
        message = message_arr.join(' and <br>');
    }

    //Add new message at the end
    //$("<p/>").append(message).appendTo($("#lixi-shard-message"))

    //Add new message at the begining  
    $("<p/>").append('<div>' + message_no + ' </div><code class="language-lixi-shard">'+ message + '</code>').addClass("tooltip").css("background-color", rgb_color).prependTo($("#lixi-shard-message"))
    $("<span/>").append(tooltiptext).addClass("tooltiptext").prependTo($("#lixi-shard-message p:first-child"))

    document.getElementById("update-highlight").click();
}

function update_kafka_setting(){
    authorID = document.getElementById("kafka-authorID-input").value;
    packageID = document.getElementById("kafka-packageID-input").value;
}

function Kafka_init(){
    if (authorID == packageID && authorID == null){
        authorID = newID();
        packageID = newID();

        document.getElementById("kafka-authorID-input").value = authorID;
        document.getElementById("kafka-packageID-input").value = packageID;
    }
}

function Toggle_DisconnectedBtn(){
    let disconnectedBtn = document.getElementById("disconnect-btn");

    //Show 
    if (isConnectedToKafka){
        disconnectedBtn.classList.remove("display-hide");
    }else { //Hide
        disconnectedBtn.classList.add("display-hide");
    }
}

function newID () {
    function s4() {
          return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
    return s4() + '-' + s4() + '-' + s4() + '-' + s4();
}

$( "#lixi-shard-dropdown-btn" ).click(function() {
    if ($("#lixi-shard-cancel-btn").text() == "Use Offline Mode")
        $("#lixi-shard-cancel-btn").text('Cancel');
});

function update_message_info(mess_no, lixiShard){

    let message_info_obj = {
        message_no: mess_no,
        Timestamp: null,
        AuthorID: null,
        Tooltip_text: null,
        color_code: null
    }

    if (lixiShard == 'SYSTEM'){
        message_info_obj['Tooltip_text'] = "System message";
        message_info_obj['color_code'] = color_code[0];     //System_color
    }
    else if (lixiShard == 'OFFLINE')
    {
        message_info_obj['Tooltip_text'] = "Offline Mode";
        message_info_obj['color_code'] = color_code[1];     //Offline_mode_color
    }
    else {
        message_info_obj['Timestamp'] = lixiShard['Timestamp'];
        message_info_obj['AuthorID'] = lixiShard['Author ID'];

        //Convert Timestamp to DateTime Format
        let Timestamp = parseInt(lixiShard['Timestamp']);
        let date = new Date(Timestamp);
        let DateTime = "Date: "+date.getDate()+
          "/"+(date.getMonth()+1)+
          "/"+date.getFullYear()+
          " "+date.getHours()+
          ":"+date.getMinutes()+
          ":"+date.getSeconds();

        message_info_obj['Tooltip_text'] = 'AuthorID: '+ lixiShard['Author ID'] + ', '+ DateTime ;
        
        //If messages is from current Client / Author
        if (lixiShard['Author ID'] == authorID){
            message_info_obj['color_code'] = my_color;
        } 
        else {      //If messages is from other Clients / Authors
            let isNewAuthor = true;
            if (message_info_arr.length > 0){
                
                for (const message of message_info_arr){
                    if (message['AuthorID'] == lixiShard['Author ID']){
                        isNewAuthor = false;
                        message_info_obj['color_code'] = message['color_code'];
                        break;
                    }
                }
            }

            if (isNewAuthor == true){
                if (++color_code_rotate > 6)
                    color_code_rotate = 1;
                message_info_obj['color_code'] = color_code[color_code_rotate];
            }
        }
    }
    
    message_info_arr.push(message_info_obj);
}
