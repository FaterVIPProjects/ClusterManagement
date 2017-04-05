/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
sap.ui.define([
	], function () {
		"use strict";

		return {

			companyName: function(bukrs, ekorg){
				if (this.getId()){
					this.bindElement("oDataModel>/CompanySet('" + bukrs + "')");					
				}
			},
			
			commercialManager: function(resp){
				if (resp){
					try {
						var oRespArray = this.getView().getModel("oRespModel").getProperty("/RespSet");
						var User = oRespArray.filter(function(item) { return item.Username === resp; });
						return User[0].Address.Firstname + " " + User[0].Address.Lastname;	
					} catch (e) {
						
					}
				}
				return "";
			}
			
		};
	}
);