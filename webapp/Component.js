/*eslint no-empty: "error"*/

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"org/fater/clustermanagement/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("org.fater.clustermanagement.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			this.getRouter().initialize();
		},
		
		parseUserInfo: function() {
			var id = null;
			
			try {
				var userShell = sap.ushell.Container.getService("UserInfo").getUser();
				id = userShell.getId().toUpperCase();
			} catch ( err ) {}
			
			if( id === null || id === undefined ) {
				try {
					id = "RIF_COMM_01";
				} catch ( err ) {}
			}
			
			var oUtilsModel = this.getModel("utils");
			if( oUtilsModel ) {
				this.getModel("oUserModel").read("/UserSet('" + id +"')", {
					async: false,
					success: function(oUserOData) {
						oUtilsModel.setProperty("/User",oUserOData);
					},
					error: function(error) {
						
					}
				});
			}
		}
	});

});