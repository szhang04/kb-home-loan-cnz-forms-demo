function uuid() {    
    var uuid = "", i, random;    
    for (i = 0; i < 32; i++) {      
        random = Math.random() * 16 | 0;        
        if (i == 8 || i == 12 || i == 16 || i == 20) {        
            uuid += "";      
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);    
     }   
     return uuid.slice(0,11);  
}

function split_on_equals_sign (my_string) {
    depth = 0;
    for (var index = 0; index < my_string.length; index++) {
        char = my_string.charAt(index);
        if (char == '[') { depth += 1};
        if (char == ']') { depth -= 1};
        if ((char == '=') && (depth == 0)) {
            start_part = my_string.slice(0, index);
            end_part = my_string.slice(index + 1, my_string.length);
            return [start_part, end_part];
        }
    }
    return false;
}

function is_xpath_attribute (my_string) {
    var index_to_test = my_string.lastIndexOf("/") + 1;
    if (my_string[index_to_test] == "@") {
        return true;
    } 
    return false;
}

// function split_on_comma (my_string) {
//     depth = 0;
//     for (var index = 0; index < my_string.length; index++) {
//         char = my_string.charAt(index);
//         if (char == '[') { depth += 1};
//         if (char == ']') { depth -= 1};
//         if ((char == ',') && (depth == 0)) {
//             start_part = my_string.slice(0, index);
//             end_part = my_string.slice(index + 1, my_string.length);
//             end_array = split_on_comma(end_part) 
//             array_of_paths = [start_part].concat(end_array)
//             return array_of_paths;
//         }
//     }
//     return [my_string];
// }

function split_on_forward_slash (my_string) {
    if (!my_string.includes("/")) {
        return [my_string];
    }
    else {
        depth = 0;
        parts = [];
        prev_index = 0;
        for (var index = 0; index < my_string.length; index++) {
                char = my_string.charAt(index);
                if (char == '[') { depth++ };
                if (char == ']') { depth-- };
                if ((char == '/') && (depth == 0)) {
                    parts.push(my_string.slice(prev_index, index));
                    prev_index = index;
                }
            }
        part = my_string.slice(prev_index, my_string.length)
        parts.push(part);
        parts = parts.filter(x => x);
        parts = parts.map(x => x.replace(/^\//, ''));
        return parts;
    }
}

function split_on_and(my_string) {
    let depth = 0;
    let prev_five = '';
    let start_indexes = [0];
    let end_indexes = [];
    let substrings = [];
    let quotes_even = 0
    for (var index = 0; index < my_string.length; index++) {
        char = my_string.charAt(index);
        prev_five += char;
        if (prev_five.length > 5) {
            prev_five = prev_five.slice(1)
        }
        if (char == '[') { depth++ };
        if (char == ']') { depth-- };
        if (char == '"') { quotes_even += 1; };
        if ((prev_five == " and ") && (quotes_even % 2 == 0) && (depth == 0)) {
            start_indexes.push(index + 1);
            end_indexes.push(index - 4);
        }
    }
    end_indexes.push(my_string.length);
    if (start_indexes.length > 1){
        for (var index = 0; index < start_indexes.length; index++) {
            substrings.push(my_string.slice(start_indexes[index], end_indexes[index]));
        }
        return substrings;
    }
    return [my_string];
}


function replace_and(my_string) {
    let prev_five = '';
    let new_string = '';
    let quotes_even = 0
    for (var index = 0; index < my_string.length; index++) {
        char = my_string.charAt(index);
        prev_five += char;
        if (prev_five.length > 5) {
            prev_five = prev_five.slice(1)
        }
        new_string += char;
        if (char == '"') { quotes_even++ };
        if ((prev_five == " and ") && (quotes_even % 2 == 0)) {
            new_string = new_string.slice(0, -5);
            new_string += '][';
        }
    }
    return new_string;
}


function get_inner_matches(xpath_string, strict=false) {
    var depth = 0;
    var previous_depth = 0;
    var inner_match = "";
    var outer_match = "";
    var inner_matches = [];
    for (var index = 0; index < xpath_string.length; index++) {
            var char = xpath_string.charAt(index);
            if (char == '[') { depth++ };
            if (depth == 0) { outer_match += char };
            if (depth > 0) { inner_match += char};
            if (char == ']') { depth-- };
            if ((previous_depth == 1) && (depth == 0)){
                if (((inner_match.endsWith('"]')) || (inner_match.endsWith(')]'))) && !(strict)) {
                    outer_match += inner_match;
                }
                else {
                    var part = inner_match.slice(1, inner_match.length - 1)
                    inner_matches.push({"match":part, "index": index - (inner_match.length - 1)})
                }
                inner_match = "";
            }
            previous_depth = depth
        }
    return [outer_match, inner_matches]
}

function insert_node_alphabetic (current_node, element_name) {
    var new_node = current_node.ele(element_name);
    var children_set = current_node._domNode._children;
    var children = Array.from(children_set);
    children.sort(function(a, b) {
        return a.nodeName.localeCompare(b.nodeName)
    });
    current_node._domNode._children.clear()
    for (var index = 0; index < children.length; index++) {
        current_node._domNode._children.add(children[index]);
    }
    return new_node;
}

function remove_element(field_path, xml_string) {
    var lixi_package = xmlbuilder2.create(xml_string);
    if (xpath.select(field_path, lixi_package.node).length > 0) {
        var elements = xpath.select(field_path, lixi_package.node);
        for (var findex = 0; findex < elements.length; findex++) {
            var element = elements[findex];
            element.remove();
        }
        xml_string = lixi_package.end({ prettyPrint: true});
    }
    return xml_string;
}

function remove_text_nodes (current_node) {
    var children_set = current_node._domNode._children;
    var children = Array.from(children_set);
    current_node._domNode._children.clear()
    for (var index = 0; index < children.length; index++) {
        if (children[index].nodeType != 3) {
            current_node._domNode._children.add(children[index]);
        }    
    }
    return current_node;
}


function retrieve_xpath(xpath_, xml_string){
    if (xml_string != "") 
        var lixi_package = xmlbuilder2.create(xml_string);
    else {
        var root_name = xpath_.substring(1).split("/")[0]
        var lixi_package = xmlbuilder2.create().ele(root_name);
    }
    var result = xpath.select(xpath_, lixi_package.node)
    if (result.length == 0) 
        output = false;
    else if (result[0].nodeType == 2) {
        new_xpath = 'string(' + xpath_ + ')';
        var xpath_result = xpath.select(new_xpath, lixi_package.node);
        output = xpath_result;
    }
    else if (result[0].nodeType == 3) {
        output = result[0].data;
    }
    else 
        output = xmlbuilder2.builder(result[0].value);
    return output;
}

function test_xpath(xpath_, xml_string){
    if (xml_string != "") 
        var lixi_package = xmlbuilder2.create(xml_string);
    else {
        var root_name = xpath_.substring(1).split("/")[0]
        var lixi_package = xmlbuilder2.create().ele(root_name);
    }
    var result = xpath.select(xpath_, lixi_package.node)
    return result;
}

function append_xpath_recursive(node, xpath_, value) {
    if (xpath_.startsWith("@")){
        var attribute_name  = xpath_.substring(1);
        var attribute_value = value;
        node.att(attribute_name, attribute_value);
        return;
    }
    else {
        var current_node = node;
        var lixi_elements = split_on_forward_slash(xpath_);
        var partial_path = "";
        for (var k = 0; k < lixi_elements.length; k++){
            var lixi_element = lixi_elements[k];
            partial_path = partial_path + "/" + lixi_element;
            partial_path = partial_path.replace(/^\//, '');
            if (lixi_element.includes("[")) {
                var inner_and_outer_matches = get_inner_matches(lixi_element, strict=true);
                var outer_match = inner_and_outer_matches[0];
                var inner_matches = inner_and_outer_matches[1];
                if (xpath.select(partial_path, current_node.node).length == 0) {
                    var new_node = insert_node_alphabetic(current_node, outer_match);
                    for (var j = 0; j < inner_matches.length; j++) {
                        var inner_match = inner_matches[j];
                        var pair = split_on_equals_sign(inner_match['match']);
                        if (pair == false) {
                            append_xpath_recursive(new_node, inner_mainner_match['match'], null);
                        }
                        else {
                            var inner_match_left = pair[0];
                            var inner_match_right = pair[1].slice(1,-1);
                            append_xpath_recursive(new_node, inner_match_left, inner_match_right);
                        }   
                    }
                    current_node = new_node;
                }
                else {
                    current_node = xmlbuilder2.builder(xpath.select(partial_path, current_node.node)[0]);
                }
            }
            else if (lixi_element.startsWith("@")){
                var attribute_name  = lixi_element.substring(1);
                var attribute_value = value;
                current_node.att(attribute_name, attribute_value);
                current_node = node;
            }
            else if (lixi_element == "text()"){
                current_node = remove_text_nodes(current_node)
                current_node.txt(value);
            }
            else {
                if (xpath.select(partial_path, node.node).length == 0) {
                    var new_node = insert_node_alphabetic(current_node, lixi_element);
                    current_node = new_node;
                    current_node_name = current_node.node.nodeName;
                }
                else {
                    current_node = xmlbuilder2.builder(xpath.select(partial_path, node.node)[0]);
                }
            }
        }
    }
}

function insert_xpath (xpath_, value, xml_string) {
    if (xml_string != "") {
        var lixi_package = xmlbuilder2.create(xml_string);
    }
    else {
        var root_name = xpath_.substring(1).split("/")[0]
        var lixi_package = xmlbuilder2.create().ele(root_name);
    }
    var current_node = lixi_package;
    var current_node_name = current_node.node.nodeName;;
    var related_path = xpath_;
    var related_value = value;
    var lixi_elements = split_on_forward_slash(related_path);
    var partial_path = "";
    for (var index = 0; index < lixi_elements.length; index++){
        var lixi_element = lixi_elements[index];   
        partial_path = partial_path + "/" + lixi_element
        if (lixi_element.includes("[")){
            var inner_and_outer_matches = get_inner_matches(lixi_element, strict=true);
            var outer_match = inner_and_outer_matches[0];
            var inner_matches = inner_and_outer_matches[1];
            if (xpath.select(partial_path, lixi_package.node).length == 0) {
                var new_node = insert_node_alphabetic(current_node, outer_match);
                for (var j = 0; j < inner_matches.length; j++) {
                    var inner_match = inner_matches[j];
                    if (inner_match['match'].startsWith("not")) {
                        inner_match_not = inner_match['match'];
                        inner_match_not = inner_match_not.replace("not(","");
                        pair = split_on_equals_sign(inner_match_not);
                        pair[1] = "";
                    }
                    else {
                        var pair = split_on_equals_sign(inner_match['match']);
                    }
                    if (pair == false){
                        append_xpath_recursive(new_node, inner_match['match'], null); 
                    }
                    else {
                        var inner_match_left = pair[0];
                        var inner_match_right = pair[1].slice(1,-1);
                        append_xpath_recursive(new_node, inner_match_left, inner_match_right);    
                    }  
                }
                current_node = new_node;
            }
            else {
                current_node = xmlbuilder2.builder(xpath.select(partial_path, lixi_package.node)[0]);
            }
        }
        else if (lixi_element.startsWith("@")){
            var attribute_name  = lixi_element.substring(1);
            var attribute_value = related_value;
            if (attribute_value != null) {
                current_node.att(attribute_name, attribute_value);
            }
            else {
                current_node.att(attribute_name, "");
            }
            current_node = lixi_package;
        }
        else if (lixi_element == "text()"){
            current_node = remove_text_nodes(current_node)
            current_node.txt(related_value);
        }
        else {
            if (xpath.select(partial_path, lixi_package.node).length == 0) {
                var new_node = insert_node_alphabetic(current_node, lixi_element);
                current_node = new_node;
                current_node_name = current_node.node.nodeName;
            }
            else {
                current_node = xmlbuilder2.builder(xpath.select(partial_path, lixi_package.node)[0]);
            }
        }
    }
    var xml_string = lixi_package.end({ prettyPrint: true});
    return xml_string;
}

function remove_empty_items(xml_string){
    var prev = ""
    while (xml_string != prev) {
        prev = xml_string;
        xml_string = xml_string.replaceAll(/(\s+[a-zA-Z0-9_]+\s*=\s*"")/gm,"")
        lixi_package = xmlbuilder2.create(xml_string);
        xml_string = lixi_package.end({ prettyPrint: true});
        xml_string = xml_string.replaceAll(/(<[a-zA-Z]+\s*\/>|<\s+[a-zA-Z]+\s*\/>)/gm,"");
    }
    return xml_string;
}

function insert_xpath_recursive(full_xpath, xml_string) {
    console.log(full_xpath);
    var sub_xpaths = split_on_and(full_xpath);
    for (var lindex = 0; lindex < sub_xpaths.length; lindex++) {
        sub_xpath = sub_xpaths[lindex];
        sub_xpath = replace_and(sub_xpath);
        if (sub_xpath.startsWith("not")) {
            sub_xpath = sub_xpath.replace("not(", "");
            sub_xpath = sub_xpath.slice(0,-1);
            if (!is_xpath_attribute(sub_xpath)) { 
                xml_string = remove_element(sub_xpath, xml_string);
                continue;
            }
            else {
                var pair = split_on_equals_sign(sub_xpath)
                if (pair == false) {
                    var xpath_ = sub_xpath;
                    var value = "{delete}";
                }
                else {
                    var xpath_ = pair[0];
                    var value = "{delete}";
                } 
            }
        }
        else {
            var pair = split_on_equals_sign(sub_xpath);
            if ( pair == false ) {
                var xpath_ = sub_xpath;
                var value = ""
                //var value = "{delete}"
            }
            else {
                var xpath_ = pair[0];
                if (pair[1].startsWith("/")) {
                    var rhs_value_and_xml_string = insert_xpath_recursive(pair[1], xml_string);
                    var value = rhs_value_and_xml_string[0]
                    var xml_string = rhs_value_and_xml_string[1]
                }
                else if (pair[1].startsWith('sum') || pair[1].startsWith('(')) {
                    var value = xpath.select(pair[1], lixi_package.node).toString();
                }
                else{
                    var value = pair[1].slice(1,-1);
                }
            }   
        }
        var outer_match_and_inner_matches = get_inner_matches(xpath_);
        var outer_match = outer_match_and_inner_matches[0];
        var inner_matches = outer_match_and_inner_matches[1];
        for (var index = 0; index < inner_matches.length; index++) {
            var inner_match = inner_matches[index];
            var pair = split_on_equals_sign(inner_match['match']);
            if (pair == false) {
                var single_index = inner_match['index'];
                var single_start_part = outer_match.slice(0, single_index);
                var single_end_part= inner_match['match'];
                var single_outer_match = single_start_part + "[" + single_end_part + "]";
                xml_string = insert_xpath(single_outer_match, null, xml_string)
            }
            else {
                var attribute = pair[0];
                var inner_xpath = pair[1] + "=";
                var value_and_xml_string = insert_xpath_recursive(inner_xpath, xml_string);
                var inner_value = value_and_xml_string[0]
                var xml_string = value_and_xml_string[1]
                var index = inner_match['index']
                var start_part = outer_match.slice(0, index)
                var end_part = outer_match.slice(index, outer_match.length)
                outer_match = start_part + "[" + attribute + '="' + inner_value + '"]' + end_part;
            }
        }
        if (value == "") {
            value = retrieve_xpath(xpath_, xml_string)
            if (value == false){
                value = "x" + uuid();
            }
        }
        if (value == "{delete}") {
            value = "";
        }
        xml_string = insert_xpath(outer_match, value, xml_string);
    }
    return [value, xml_string]
}

function test_code(input_csv_path){

    function rowsToObjects(headers, rows){
        return rows.reduce((acc, e, idx) =>  {
           acc.push(headers.reduce((r, h, i)=> {r[h] = e[i]; return r; }, {}))
           return acc;
        }, []);
      }

    var fs = require('fs');
    var data = fs.readFileSync(input_csv_path)
        .toString()
        .split('\n')
        .map(e => e.trim()) 
        .map(e => e.split(',').map(e => e.trim())); 

    var headers = data[0];
    data.shift();
    
    var lines = rowsToObjects(headers, data);

    var xml_string = '';
    for (var index = 0; index < lines.length; index++) {
        var row = lines[index];
        on = row["on"];
        if (on == 'y') {
            // console.log(row["xpath"] + "=\"" + row["value"] + "\"");
            // var xpath = row["xpath"].replace(/^"(.*)"$/, '$1').replaceAll('""', '"');
            // var value = row["value"];

            xpath = row["xpath"].replace(/^"(.*)"$/, '$1').replaceAll('""', '"');

            value_and_xml_string= insert_xpath_recursive(xpath, xml_string);
            xml_string = value_and_xml_string[1];

        }
    }

    console.log("\n---------------------------RESULT-----------------------------\n");

    console.log(xml_string);

    console.log("\n---------------------------RETRIEVE-----------------------------\n");

    faulty = false;

    for (var index = 0; index < lines.length; index++) {
        var row = lines[index];
        if (row['on'] == 'y') {
            var xpath = row["xpath"].replace(/^"(.*)"$/, '$1').replaceAll('""', '"');
            console.log(xpath);
            result = test_xpath(xpath, xml_string);

            if (result == true) {
                console.log(result)
            }
            else {
                console.log("ERROR!!!!!!!!!!!!!!!!!!!!!!!!");
                faulty = true;
            }
        }
    }
    if (faulty) {
        
        throw ('FAIL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Inserted data has NOT been successfully retrieved from the generated LIXI message.');
    }
    else
        console.log("\nSUCCESS!!  All inserted data has been successfully retrieved from the generated LIXI message.")
}

if (typeof require !== 'undefined' && require.main === module) {
    var xmlbuilder2 = require('xmlbuilder2');
    var xpath = require('xpath');
    const args = require('minimist')(process.argv.slice(2))
    var input_csv_path = args['input_csv_path']
    test_code(input_csv_path);
}
