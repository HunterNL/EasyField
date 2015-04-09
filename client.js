function getType(value) {
	var typelookup = {
		boolean : "checkbox",
		string : "text",
		number : "number"
	};

	var tmp = Template.instance();
	var type = (typeof value);
	var lookedupType = typelookup[type];
	if(!lookedupType) {
		throw new Meteor.Error("easyfield_no_typefound","Could not find an input field to use for a value",value);
	}
	return lookedupType;

}

//Takes object and string like "isAwesome" or "profile.contact.phone" and safely retrieves the value
function safeDecent(obj,keystring) {
	var keyArray = keystring.split(".");
	for(var i=0;i<keyArray.length;i++) {
		if(obj && obj.hasOwnProperty(keyArray[i])) {
			obj = obj[keyArray[i]];
		} else {
			return;
		}

	}
	return obj;
}

Template.easyfield.helpers({
	type: function() {
		return {type:Template.instance().fieldtype.get()};
	},

	checked : function() {
		if(!!safeDecent(Meteor.user(),Template.currentData().field)) {
			return {checked: "checked"};
		}
	},

	value : function() {
		return {value: safeDecent(Meteor.user(),Template.currentData().field)};
	}
});

Template.easyfield.onCreated(function(){
	var args = Template.currentData();
	var templateInstance = Template.instance();

	templateInstance.fieldtype = new ReactiveVar(args.fieldtype || "text");

	var field = args.field;

	if(!field) {
		console.log("no field");
		return;
	}

	//Meteor.user() is undefined onCreated/onRendered, so reactively wait for it
	Template.instance().autorun(function(comp){
		var user = Meteor.user();
		if(!user) {return;}

		comp.stop(); //Stop rerunning once we got the user

		var value = safeDecent(user,field);
		if(typeof value === "undefined") {
			console.warn("easyfield value undefined",field);
		} else {
			templateInstance.fieldtype.set(getType(value));
		}
	});

});

Template.easyfield.events({
	"change input": function(event, template){
		element = template.find("input");
		var value;
		if(element.type === "checkbox") {
			value = element.checked;
		} else {
			value = element.value;
		}

		var query = {};
		query[Template.currentData().field] = value;

		Meteor.users.update(Meteor.userId(),{
			$set : query
		});
	}
});

//TODO Handle secure value changes via methods
