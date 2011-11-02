/*
@desc
	This is a set of javascript functions that mimics the logic used
	when creating a player in EA's NHL 12. Anyone is allowed to
	modify this code as they see fit and use it on whatever website they
	choose. See the README for more info.
@Version	1.1
@Author	AngryMikeGrrrr
@Home	
@Usage
	new PlayerCreator({render_to : "some_div"});
@License	Free
*/

function PlayerCreator(options) {

    $(function() { init(); });
    
    var creator;
    var $root = $("#"+options.render_to);
    var player = {
        "context"   : "player",
        "card"      : "Legend 3",
        "build"     : "",
        "off_xp"    : 0,
        "def_xp"    : 0,
        "ath_xp"    : 0, 
        "attrs"     : {}, 
        "boosts"    : {}
    }

    function init() {
        
        $root.append("<h1>NHL 12 Player Creator</h1><p><label>Type:</label><select id=\"type\"><option value=\"player\">Player</option><option value=\"goalie\">Goalie</option></select><label>Build:</label><select id=\"builds\"></select><label>Card:</label><select id=\"cards\"></select><p id=\"share_build\"></p><h2>Overall: <span class=\"average\"></span></h3><hr><h3 class=\"section_title\"></h3><p class=\"header\">XP: <span id=\"offxp\" class=\"xp\"></span></p><table class=\"attribute\"></table><hr><h3 class=\"section_title\"></h3><p class=\"header\">XP: <span id=\"defxp\" class=\"xp\"></span></p><table class=\"attribute\"></table><hr><h3 class=\"section_title\"></h3><p class=\"header\">XP: <span id=\"athxp\" class=\"xp\"></span></p><table class=\"attribute\"></table><hr><h3>Boosts</h3><table class=\"boosts\"></table>");
        
        if(options.credits != false)
            $root.append("<p class=\"credits\">Created by <a href=\"http://live.xbox.com/en-US/member/AngryMikeGrrrr\">AngryMikeGrrrr</a> in 2011</p>");
        
    	// load json data
    	$.getJSON('attributes.json', function(data) {
            creator = data;
            render_cards(creator.card_types, $root.find("#cards")); 
            render_share($root.find("#share_build"));
            render_page();   
    	});
	
        $root.find(".xp").bind("pc:update_xp", function(event) {
            $root.find("#offxp").html(player.off_xp);
            $root.find("#defxp").html(player.def_xp);
            $root.find("#athxp").html(player.ath_xp);
        }); 
    
        $root.find("#type").change(function() {
            player.context = $(this).val(); 
            render_page(); 
        });
    }

    function render_page() {
        render_attributes(creator[player.context].attribute_categories);
        $root.find("#builds").unbind();
        render_builds(creator[player.context].types, $root.find("#builds"));
        render_boosts(creator[player.context].boosts, $root.find(".boosts"));
    }
    
    function render_share($elm) {
        $elm.css({"cursor": "pointer", "color": "#03f"});
        $elm.append("<span>[+] Share this Build</span>");
        $elm.find("span").click(function() {
            if($(this).text().search(/\+/) > -1)
                $(this).text($(this).text().replace("+", "-"));
            else 
                $(this).text($(this).text().replace("-", "+"));
                
            $elm.find("div").slideToggle();
        }); 
        
        $elm.append("<div style='display:none'><p><input class='share' type='button' value='plain'/><input class='share' type='button' value='bbcode'/><input class='share' type='button' value='reddit'/></p><textarea rows='31' cols='50'></textarea></div>");
        $elm.find("div > p > input").css("margin-right", "0.5em");
        
        $elm.find(".share").click(function() {
            switch($(this).val()) {
                case "plain":
                    $elm.find("textarea").html(output_as_plain()); 
                    break;
                case "bbcode":
                    $elm.find("textarea").html(output_as_bbcode()); 
                    break;
                case "reddit":
                    $elm.find("textarea").html(output_as_reddit());
                    break;    
                default:
                    break; 
            }
        });
    }

    function render_builds(builds, $elm) {
        $elm.empty(); 
        for (var i = 0; i < builds.length; i++) {
            $elm.append("<option>"+builds[i]+"</option>");
        }
    
        $elm.change(function(event, fire_event) {
            if(fire_event == undefined)
                fire_event = true;
            load_build($(this).val());  
            if(fire_event)
                $root.find("#cards").change(); 
        });
    
        $elm.change();
    }

    function render_cards(cards, $elm) {
        $elm.empty(); 
        $.each(cards, function(card_name, xp_val){      
           $elm.append("<option>"+card_name+"</option>"); 
        });
    
        $elm.change(function() {
            change_card($(this).val());  
            $root.find('#builds').trigger('change', false); 
        });
    
        $elm.val(player.card);
        $elm.change();
    }

    function render_attributes(categories) {
        var i = 0; 
        $root.find(".attribute").empty();
        $root.find(".reset").remove();
        $.each(categories, function(name, attrs) {         
            $($root.find(".section_title")[i]).html(name); 
            $($root.find(".attribute")[i]).append("<tr><td></td><td class=\"header\">Value</td><td class=\"header\">XP Cost</td><td class=\"header\">Boost</td><td class=\"header\">Total</td><td></td><td></td></tr>"); 
            $.each(attrs, function(index, attr) {
                $($root.find(".attribute")[i]).append("<tr><td class=\"attr\">"+attr+"</td><td class=\"value\"></td><td class=\"cost\"></td><td class=\"boost\"></td><td class=\"total\"></td><td><input class=\"minus\" type=\"button\" value=\"-\" /></td><td><input class=\"plus\" type=\"button\" value=\"+\" /></td></tr>");
                $root.find(".plus:last").click(function() {
                    update_attribute($(this).parent(), attr, 1);
                });
                $root.find(".minus:last").click(function() {
                    update_attribute($(this).parent(), attr, 0);
                });          
                $root.find(".value:last").parent().bind("pc:update_value", function(event, value) {            
                    $(this).find(".value").html(value); 
                    if(value <= creator[player.context].attributes[player.build][attr].initial)
                        $(this).find(".minus").attr('disabled', 'disabled');
                    else
                        $(this).find(".minus").removeAttr('disabled');
                });
                $root.find(".cost:last").parent().bind("pc:update_cost", function(event, value) {            
                    $(this).find(".cost").html(value); 
                });
                $root.find(".boost:last").parent().bind("pc:update_boost", function(event, value) {            
                    $(this).find(".boost").html(value); 
                });
                $root.find(".total:last").parent().bind("pc:update_total", function(event, value) {            
                    $(this).find(".total").html(Math.min(value,99)); 
                    if(value >= 99) 
                        $(this).find(".plus").attr('disabled', 'disabled');
                    else 
                        $(this).find(".plus").removeAttr('disabled');
                    $root.find(".average").html(calculate_average());
                });
            });
            $($root.find(".attribute")[i]).after("<input class='reset' type='button' value='Reset' \>");
            $root.find(".reset:last").click(function(){
               reset_group(name); 
            });
            i += 1; 
        });    
    }

    function render_boosts(boosts, $elm) {
        $elm.empty(); 
        player.boosts = {};
        $elm.append("<tr><td></td><td class=\"header\">Slot 1</td><td class=\"header\">Slot 2</td><td class=\"header\">Slot 3</td></tr>");
        $.each(boosts, function(boost, attrs) {
            $elm.append("<tr><td class=\"attr\">"+boost+"</td>");
            for(var i = 0; i < 3; i++) {
                $elm.find("tr:last").append("<td><input type=\"radio\" name=\""+boost+"_"+i+"\" value=\"1\">+1</input><input type=\"radio\" name=\""+boost+"_"+i+"\" value=\"3\">+3</input><input type=\"radio\" name=\""+boost+"_"+i+"\" value=\"5\">+5</input><select class=\"slot\"><option value=\"\" selected=\"selected\">&nbsp;</option>");
                $root.find("tr:last > td:last > :radio").attr("disabled", "disabled");
                $root.find("tr:last > td:last > :radio").change(function() {
                    attr_select = $(this).parent().find("select");
                    attr = attr_select.val();  
                    boost = $(this).val(); 
                    update_boost(attr);
                    update_boost_val(attr_select);
                    other_boosts = $root.find(".boosts [value='"+attr+"']:parent").filter("select").not(attr_select);
                    $.each(other_boosts, function(index, elm) {
                        update_boost_val($(elm));
                    });                                
                });
                $root.find("tr:last > td:last > select").change(function() {
                    attr = $(this).val();                     
                    $(this).parent().find("input").prop('checked', false);
                    if(attr == "") {
                        $(this).parent().find("input").attr("disabled", "disabled");                           
                        attr = $(this).data('old_attr');
                        update_boost(attr);
                        other_boosts = $root.find(".boosts [value='"+attr+"']:parent").filter("select");
                        $.each(other_boosts, function(index, elm) {
                            update_boost_val($(elm));
                        });
                        $(this).data('old_attr', "");
                    }                        
                    else {
                        update_boost($(this).data('old_attr'));
                        $(this).data('old_attr', attr); 
                        $(this).parent().find("input").removeAttr("disabled");                        
                        update_boost_val($(this)); 
                    }                
                }); 
                $.each(attrs, function(index, attr) {
                    $elm.find(".slot:last").append("<option value=\""+attr+"\">"+attr+"</option>");
                });
                $elm.append("</select></td>");   
            }
            $elm.append("</tr>");
        });
        $elm.after("<input class='reset' type='button' value='Reset' \>");
        $root.find(".reset:last").click(function() {
            $(".slot").val("");
            $(".slot").change();
            $(".boosts").find("input").attr("disabled", "disabled");
        });      
    }


    function load_build(build_name) {
        initial_data = creator[player.context].attributes[build_name];
        player.build = build_name;    
        player.attrs = {};
        $.each(initial_data, function(attr) {
            reset_attribute(attr);
        });
    }
    
    function reset_group(group_name) {
        keys = [];
        for(var key in creator[player.context].attribute_categories) 
            keys.push(key);   
        attrs = creator[player.context].attribute_categories[group_name];
        $.each(attrs, function(index, attr) {
            reset_attribute(attr);
        });
        xp = creator.card_types[player.card];
        if(group_name == keys[0]) 
            player.off_xp = xp;
        if(group_name == keys[1]) 
            player.def_xp = xp;
        if(group_name == keys[2]) 
            player.ath_xp = xp;
        $root.find(".xp").trigger("pc:update_xp");
    }
    
    function reset_attribute(attr) {
        value = creator[player.context].attributes[player.build][attr].initial;
        player.attrs[attr] = value;
        boost = player.boosts[attr] == undefined ? 0 : player.boosts[attr]; 
        $elm = $root.find('.attribute tr:contains("'+attr+'")');
        $elm.trigger('pc:update_value', value);
        $elm.trigger('pc:update_cost', 10);
        $elm.trigger('pc:update_boost', boost);
        $elm.trigger('pc:update_total', value + boost);
    }

    function change_card(card) {
        xp = creator.card_types[card];
        player.card = card;
        player.off_xp = player.def_xp = player.ath_xp = xp; 
        $root.find(".xp").trigger("pc:update_xp"); 
    }

    // value is 1 for increasing by 1 and 0 for decreasing by 1
    function update_attribute($elm, attribute, value) {
        // check for enough XP
    
        // calculate cost
        attr = creator[player.context].attributes[player.build][attribute]; 
        current = player.attrs[attribute]; 
        new_value = current+((value*2)-1); 
        xp_cost = calculate_cost(attr.initial, current, value, attr.cost);
        new_cost = calculate_cost(attr.initial, new_value, 1, attr.cost);
    
        did_update = false; 
    
        boost = player.boosts[attribute] == undefined ? 0 : player.boosts[attribute]; 
        total = current+boost; 
    
        keys = [];
        for(var key in creator[player.context].attribute_categories) 
            keys.push(key);
    
        if($.inArray(attribute, creator[player.context].attribute_categories[keys[0]]) > -1 ) {
            if(value == 1 && total < 99 && player.off_xp >= xp_cost) {
               did_update = true;  
               player.off_xp -= xp_cost; 
            }
            if(value == 0 && current > attr.initial) {
               did_update = true;  
               player.off_xp += xp_cost;
            }
        }
        else if($.inArray(attribute, creator[player.context].attribute_categories[keys[1]]) > -1 ) {
            if(value == 1 && total < 99 && player.def_xp >= xp_cost) {
                did_update = true; 
                player.def_xp -= xp_cost;
            }
            if(value == 0 && current > attr.initial) {
                did_update = true; 
                player.def_xp += xp_cost;
            }
        }
        else {
            if(value == 1 && total < 99 && player.ath_xp >= xp_cost) {
                did_update = true; 
                player.ath_xp -= xp_cost;
            }
            if(value == 0 && current > attr.initial) {
                did_update = true; 
                player.ath_xp += xp_cost;
            }
        }
    
        // fire event
        if(did_update) {
            player.attrs[attribute] = new_value;        
            $elm.trigger('pc:update_value', new_value);
            $elm.trigger('pc:update_cost', new_cost);  
            $elm.trigger('pc:update_total', new_value+boost);
            $root.find(".xp").trigger("pc:update_xp");
        }
    }

    // inc = 0 for decreasing and 1 for increasing
    function calculate_cost(initial, current, inc, cost) {
        var xp_cost = 10;
        if(cost != 0)
            xp_cost += 10*Math.floor((current-initial+inc-1)/cost);
        return xp_cost;
    }

    function calculate_average() {
        total = 0; 
        num = 0; 
        $.each(player.attrs, function(attr, value) {
            boost = player.boosts[attr] == undefined ? 0 : player.boosts[attr]; 
            total = total + value + boost; 
            num += 1; 
        }); 
        return (num == 0 ? 0 : Math.floor(total/num) ) ;
    }
  
    // takes an attr, figures out which radio buttons are checked and then updates the boost column
    function update_boost(attr) {
        if(attr == "") return;
        total = 0;
        $root.find(".boosts [value='"+attr+"']:parent").filter("select").each(function(i, elm) {
            v = $(elm).parent().find(":radio:checked").val();
            if(v == undefined) v = 0; 
            total += parseInt(v);    
        });
        player.boosts[attr] = total;                    
        $(".attr:contains('"+attr+"')").parent().trigger('pc:update_boost', total);
        $(".attr:contains('"+attr+"')").parent().trigger('pc:update_total', total+player.attrs[attr]);
    }
    
    // $elm is the select element and attr is the value
    function update_boost_val($elm) {
        cur_val = player.boosts[$elm.val()] == undefined ? 0 : player.boosts[$elm.val()];
        $plus5 = $elm.parent().find("[value='5']");
        $plus3 = $elm.parent().find("[value='3']");
        $plus1 = $elm.parent().find("[value='1']");
        
        if(cur_val >= 5 ) {            
            if(!$plus5.is(":checked"))
                $plus5.attr("disabled", "disabled");
        }
        else
            $plus5.removeAttr('disabled');
            
        if(cur_val == 3 || cur_val == 4 || cur_val == 8 || cur_val == 9 ) {
            if(!$plus3.is(":checked"))
                $plus3.attr("disabled", "disabled");
        }   
        else
            $plus3.removeAttr('disabled');
            
        if(cur_val == 1 || cur_val == 4 || cur_val == 6 || cur_val == 9 ) {
            if(!$plus1.is(":checked"))
                $plus1.attr("disabled", "disabled");
        }   
        else
            $plus1.removeAttr('disabled');             
    }
    
    function output_as_plain() {
        str = ""
        str += player.build + ", " + player.card + ", Overall: "+ calculate_average() + "\n\n";
         $.each(player.attrs, function(attr, value) {
             str += attr + ": "+ value;
             boost = player.boosts[attr] == undefined ? 0 : player.boosts[attr]; 
             if(boost > 0)
                str += " (+"+boost+")";
             str += "\n";
         });             
        return str;
    }
    
    function output_as_bbcode() {
        str = ""
        str += "[b]Build:[/b] "+player.build + "\n" 
        str += "[b]Card:[/b] "+player.card +"\n\n";
        str += "[table][b]Attribute[/b] | [b]Value[/b] | [b]Boost[/b] | [b]Total[/b] \n"
         $.each(player.attrs, function(attr, value) {
             str += attr + "|"+ value + "|";
             boost = player.boosts[attr] == undefined ? 0 : player.boosts[attr]; 
             if(boost > 0)
                str += "+"+boost;
             str += "| "+(value+boost)+"\n";
         });     
        str += "[b]Overall[/b]|||"+ calculate_average() + "[/table]"
        return str;
    }
    
    function output_as_reddit() {
        str = ""
        str += "**Build:** " + player.build + "\n\n"
        str += "**Card:** " + player.card + "\n\n"
        str += "Attribute|Value|Boost|Total\n"
        str += ":---|---:|---:|---:\n"
         $.each(player.attrs, function(attr, value) {
             str += attr + "|"+ value + "|";
             boost = player.boosts[attr] == undefined ? 0 : player.boosts[attr]; 
             if(boost > 0)
                str += "+"+boost;
             str += "|"+(value+boost)+"\n";
         });   
         str += "\n**Overall:** " + calculate_average();          
         return str;
    }
    

    function getUrlVars() { 
    	var map = {}; 
    	var parts = window.location.search.replace(/[?&]+([^=&]+)(=[^&]*)?/gi, function(m,key,value) { map[key] = (value === undefined) ? true : value.substring(1); }); 
    	return map; 
    }

    function insertParam(key, value)
    {
        key = escape(key); value = escape(value);

        var kvp = document.location.search.substr(1).split('&');

        var i=kvp.length; var x; while(i--) 
        {
        	x = kvp[i].split('=');

        	if (x[0]==key)
        	{
        		x[1] = value;
        		kvp[i] = x.join('=');
        		break;
        	}
        }

        if(i<0) {kvp[kvp.length] = [key,value].join('=');}
        return kvp.join('&'); 
    }

}