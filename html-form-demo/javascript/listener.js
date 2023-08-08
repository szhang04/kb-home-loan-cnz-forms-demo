let isConnectedToKafka = false;
let inputs = document.querySelectorAll('input, select');

for (var index = 0; index < inputs.length; index++) {
    inputs[index].addEventListener('change', Update_XML);
}

function Update_XML(e){
    if (modal_full_path_arr.length > 0)
        UpdateModalArray(e);

    if (isConnectedToKafka)
        On_Change_Update_XML_Kafka(e);
    else
        On_Change_Update_XML(e);
}

function Insert_Attribute(e){
    if (isConnectedToKafka)
        Insert_XML_Kafka(e);
    else
        Insert_XML(e);
}

function Reset_Element(e){
    if (isConnectedToKafka)
        Reset_Element_Kafka(e);
    else
        Reset_Element_XML(e);
}

function Update_Modal(e){
    if (isConnectedToKafka)
        On_Change_Update_Modal_Kafka(e);
    else
        On_Change_Update_Modal(e);
}

function UploadAttachment(xpath){
    if (isConnectedToKafka)
        UploadAttachment_Kafka(xpath);
    else
        UploadAttachment_XML(xpath);
}

function RemoveAttachment(xpath){
    if (isConnectedToKafka)
        RemoveAttachment_Kafka(xpath);
    else
        RemoveAttachment_XML(xpath);
}

function UpdateModalArray(e){
    var xpath = e.target.attributes['xpath'].value;
    var value = Escape_XML_Char_To_Hex(e.target.value);
    if (value ==""){
        value = "{delete}";
    }
    full_xpath = xpath + '="' + value + '"';

    modal_full_path_arr.push(full_xpath);
}