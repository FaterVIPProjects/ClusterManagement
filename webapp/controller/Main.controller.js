sap.ui.define([
	"org/fater/clustermanagement/framework/BaseController",
	"org/fater/clustermanagement/util/formatter",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	'sap/ui/model/SimpleType',
	'sap/ui/model/ValidateException',
	"sap/ui/model/json/JSONModel"
], function(Controller, formatter, Filter, MessageToast, SimpleType,ValidateException, JSONModel) {
	"use strict";

	return Controller.extend("org.fater.clustermanagement.controller.Main", {
		
		formatter: formatter,
		__targetName: "home",
		
		
		onRouteMatched: function(){
			var that=this;
			this.getView().setBusy(true);
			this._oView = this.getView();
			this._oView.getModel("oUserModel").read("/UserSet?$filter=Role eq 'COMMERCIAL_MANAGER' or Role eq 'ANAGRAPHIC_MANAGER'", {
				success: function(oRespData) {
					var oRespModel = new JSONModel();
					oRespModel.setProperty("/RespSet", oRespData.results);
					that._oView.setModel(oRespModel,"oRespModel");
					that._oView.getModel("oDataModel").read("/ClusterSet?$filter=ClusterId ne '0'", {
		                urlParameters:{
		                	"$expand" : "ClusterCom"
		                },					
						success: function(oData) {
							var oClusterModel = new JSONModel();
							oClusterModel.setProperty("/ClusterSet", oData.results);
							that._oView.setModel(oClusterModel);
							that._oView.setBusy(false);
						}, 
						error: function(){
							MessageToast.show("Error Retrieving Cluster Data");
							that._oView.setBusy(false);
						}
					});	
				}, 
				error: function(){
					MessageToast.show("Error Retrieving Cluster Data");
					that._oView.setBusy(false);
				}
			});
		},
		
		//Handle add new Company
		handleAddCompanyClusterPress: function(oEvent){
			this._selectedClusterPath = oEvent.getSource().getBindingContext().getPath();
			this._selectedClusterIndex = parseInt(this._selectedClusterPath.substr(this._selectedClusterPath.lastIndexOf("/" + 1))) + 1;
			this._dialog = sap.ui.xmlfragment("org.fater.clustermanagement.view.fragment.AddCompanyDialog", this);
			this._oView.addDependent(this._dialog);
			this._dialog.open();			
		},
		
		confirmAddCompany: function(){
			var companySelect = sap.ui.getCore().byId("addCompany");
			var purchOrgSelect = sap.ui.getCore().byId("addPurchOrg");
			var isAlreadyExistent = false;
			if (!companySelect.getSelectedKey()){
					companySelect.setValueState("Error");
					MessageToast.show(this.getTranslation("checkFieldsError"), {"duration": 6000});
				return;
			}
			if (!purchOrgSelect.getSelectedKey()){
					purchOrgSelect.setValueState("Error");
					MessageToast.show(this.getTranslation("checkFieldsError"), {"duration": 6000});
				return;
			}		
			var newCompany = {
				"editEnabled": true,
				"ClusterId": this._selectedClusterIndex.toString(),
				"Bukrs" : companySelect.getSelectedKey(),
				"Butxt" : companySelect.getSelectedItem().getText(),
				"Ekorg" : purchOrgSelect.getSelectedKey(),
				"Ekotx" : purchOrgSelect.getSelectedItem().getText(),
				"Hse"   : false,
				"PurchTerms" : false,
				"ScoreManagement" : false,
				"Quality" : false,
				"FirstReminder": 30,
				"SecondReminder": 30
			};
			var clusterComSet = this.getView().getModel().getProperty(this._selectedClusterPath + "/ClusterCom/results" );
			for (var i = 0; clusterComSet[i]; i++){
				if (clusterComSet[i].Bukrs === newCompany.Bukrs){
					isAlreadyExistent = true;
					break;
				}
			}
			if (!isAlreadyExistent){
				clusterComSet.push(newCompany);	
				this.getView().getModel().refresh();
			}
			//Open the new tab
			this.getView().getModel("oUtilsModel").setProperty("/selectedTabKey", this._selectedClusterIndex + "_" + newCompany.Bukrs);
			this._dialog.close();
			this._dialog.destroy();				
		},
		
		cancelAddCompany: function(){
			this._dialog.close();
			this._dialog.destroy();				
		},
		
		//
		
		handleEditClusterPress:	function(oEvent){
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var index = sPath.substr(sPath.lastIndexOf("/") + 1);
			var i = 0;
			this._oView.getModel().setProperty(sPath + "/editEnabled", true);
			while (this._oView.getModel().getProperty(sPath + "/ClusterCom/results/" + i)){
				this._oView.getModel().setProperty(sPath + "/ClusterCom/results/" + i + "/editEnabled", true);
				i++;
			}
			this._oView.byId("clusterList").getItems()[index].getContent()[0].setExpanded(true);
		},
		
		handleSaveEditClusterPress:	function(oEvent){
			this._selectedClusterPath = oEvent.getSource().getBindingContext().getPath();
			this._dialog = sap.ui.xmlfragment("org.fater.clustermanagement.view.fragment.ConfirmSaveClusterDialog", this);
			this._oView.addDependent(this._dialog);
			this._dialog.open();			
		},
	
		//Remove New Cluster
		handleDeleteNewClusterPress: function(oEvent){
			var sPath = oEvent.getSource().getBindingContext().getPath();
			this._selectedClusterIndex = sPath.substr(sPath.lastIndexOf("/") + 1);			
			this._dialog = sap.ui.xmlfragment("org.fater.clustermanagement.view.fragment.ConfirmDeleteNewClusterDialog", this);
			this._oView.addDependent(this._dialog);
			this._dialog.open();	
		},
		
		confirmDeleteNewClusterPress: function(){
			this._oView.byId("clusterList").getItems()[this._selectedClusterIndex].setVisible(false);	
			this._dialog.close();
			this._dialog.destroy();
		},
		
		cancelDeleteNewClusterPress: function(){
			this._dialog.close();
			this._dialog.destroy();			
		},
		
		//Handle add new Cluster
		handleAddCluster: function(){
			var newCluster = {
				"Name" : "",
				"ClusterCom":{
					"results":[{
						"editEnabled": true,
						"Hse": false,
						"ScoreManagement": false,
						"FirstReminder": 30,
						"SecondReminder": 30,
						"PurchTerms": false,
						"Bukrs": "",
						"Butxt": "",
						"Ekorg":"",
						"Ekotx":"" 
					}]
				},
				"editEnabled": true,
				"newCluster": true
			};
			var clusterSet = this.getView().getModel().getProperty("/ClusterSet");
			this._selectedClusterIndex = clusterSet.push(newCluster) - 1;
			//this._selectedClusterIndex = clusterSet.indexOf(newCluster);
			this.getView().getModel().refresh();
			this._dialog = sap.ui.xmlfragment("org.fater.clustermanagement.view.fragment.OtherNewClusterDialog", this);
			sap.ui.getCore().byId("newClusterName").bindElement("/ClusterSet/" + this._selectedClusterIndex);
			sap.ui.getCore().byId("newClusterCompany").bindElement("/ClusterSet/" + this._selectedClusterIndex);
			sap.ui.getCore().byId("newClusterPurchOrg").bindElement("/ClusterSet/" + this._selectedClusterIndex);
			this._oView.addDependent(this._dialog);
			this._dialog.open();
		},

		onCancelCreateNewCluster: function(){
			var oView = this.getView();
//			var oModel = oView.getModel();	
//			var ClusterSet = oModel.getProperty("/ClusterSet");
			//Hide the element instead of remove it 
			oView.byId("clusterList").getItems()[this._selectedClusterIndex].setVisible(false);
/*			ClusterSet.splice(this._selectedClusterIndex, 1);
			oView.byId("clusterList").getItems()[this._selectedClusterIndex].destroyContent();
			oView.byId("clusterList").getItems()[this._selectedClusterIndex].destroy();
			oView.byId("clusterList").removeItem(this._selectedClusterIndex);
			oModel.refresh(true);*/
			this._dialog.close();
			this._dialog.destroy();
		},
		
		onConfirmCreateNewCluster: function(){
			var oView = this.getView();
			var oModel = oView.getModel();
			var clusterName = sap.ui.getCore().byId("newClusterName");
			var companySelect = sap.ui.getCore().byId("newClusterCompany");
			var purchOrgSelect = sap.ui.getCore().byId("newClusterPurchOrg");
			if (!clusterName.getValue() || clusterName.getValue() === ""){
					clusterName.setValueState("Error");
					MessageToast.show(this.getTranslation("checkFieldsError"), {"duration": 6000});
				return;
			}			
			if (!companySelect.getSelectedKey()){
					companySelect.setValueState("Error");
					MessageToast.show(this.getTranslation("checkFieldsError"), {"duration": 6000});
				return;
			}
			if (!purchOrgSelect.getSelectedKey()){
					purchOrgSelect.setValueState("Error");
					MessageToast.show(this.getTranslation("checkFieldsError"), {"duration": 6000});
				return;
			}				
			oModel.setProperty("/ClusterSet/" + this._selectedClusterIndex + "/ClusterCom/results/0/Butxt", companySelect.getSelectedItem().getText());
			oModel.setProperty("/ClusterSet/" + this._selectedClusterIndex + "/ClusterCom/results/0/Ekotx", purchOrgSelect.getSelectedItem().getText());
			this._oView.byId("clusterList").getItems()[this._selectedClusterIndex].getContent()[0].setExpanded(true);
			this._dialog.close();
			this._dialog.destroy();
		},
		
		//
		
		checkField:function(oEvent){
			oEvent.getSource().setValueState("None");	
		},
		
		saveCluster: function(){
			var that = this;
			var i = 0;	
			var oDataModel = this._oView.getModel("oDataModel");
			var oModel = this._oView.getModel();
			if (!this.checkAllCompanies()){
				MessageToast.show(that.getTranslation("checkFieldsError"));
				this._dialog.close();
				this._dialog.destroy();					
				return;
			}
			var cluster = JSON.parse(JSON.stringify(oModel.getProperty(this._selectedClusterPath)));
			this._oView.setBusy(true);
			delete cluster.editEnabled;
			delete cluster.newCluster;
			cluster.ClusterCom = cluster.ClusterCom.results;
			while (cluster.ClusterCom[i]){
				cluster.ClusterCom[i].FirstReminder = parseInt(cluster.ClusterCom[i].FirstReminder);
				cluster.ClusterCom[i].SecondReminder = parseInt(cluster.ClusterCom[i].SecondReminder);
				delete cluster.ClusterCom[i].editEnabled;
				delete cluster.ClusterCom[i].ValueStateResp;
				delete cluster.ClusterCom[i].ValueStateRespAnag;
				delete cluster.ClusterCom[i].ValueStateFirstReminder;
				delete cluster.ClusterCom[i].ValueStateSecondReminder;
				i++;
			}			
			oDataModel.create("/ClusterSet",cluster,null,
				function(){
					oModel.setProperty(that._selectedClusterPath + "/newCluster", false);
					that._oView.getModel().setProperty(that._selectedClusterPath + "/editEnabled", false);
					while (that._oView.getModel().getProperty(that._selectedClusterPath + "/ClusterCom/results/" + i)){
						that._oView.getModel().setProperty(that._selectedClusterPath + "/ClusterCom/results/" + i + "/editEnabled", false);
						i++;
					}					
					that._oView.setBusy(false);
					MessageToast.show(that.getTranslation("clusterSaved"));
				},
				function(){
					that._oView.setBusy(false);
					MessageToast.show(that.getTranslation("gatewayError"));
				}
			);			
			this._dialog.close();
			this._dialog.destroy();			
		},
		
		cancelCluster: function(){
			this._dialog.close();
			this._dialog.destroy();
		},
		
		checkAllCompanies: function(){
			var oModel = this._oView.getModel();
			var ClusterCom = oModel.getProperty(this._selectedClusterPath + "/ClusterCom/results");
			var check = true;
			var i = 0;
			while (ClusterCom[i]){
				if (!ClusterCom[i].Resp){
					check = false;
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateResp", false);
				} else {
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateResp", true);
				}
				if (!ClusterCom[i].RespAnag){
					check = false;
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateRespAnag", false);
				} else {
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateRespAnag", true);
				}				
				if (!ClusterCom[i].FirstReminder){
					check = false;
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateFirstReminder", false);
				} else {
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateFirstReminder", true);
				}	
				if (!ClusterCom[i].SecondReminder){
					check = false;
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateSecondReminder", false);
				}else {
					oModel.setProperty(this._selectedClusterPath + "/ClusterCom/results/" + i + "/ValueStateSecondReminder", true);
				}					
				i++;
			}				
			return check;
		},
		
		handleRemoveCompany: function(oEvent){
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var indexCompany = sPath.substr(sPath.lastIndexOf("/") + 1);
			var clusterComSet = this.getView().getModel().getProperty(sPath.substr(0, sPath.lastIndexOf("/")));
			clusterComSet.splice(indexCompany, 1);
			this.getView().getModel().refresh();
		},
		
/*		checkSocietyChoosed: function(oEvent){
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var oModel = this.getView().getModel();
			var cluster = oModel.getProperty(sPath + "/ClusterId");
			var company = oModel.getProperty(sPath + "/Bukrs");
			var purchOrg = oModel.getProperty(sPath + "/Ekorg");
			
			if (company && purchOrg){
				this.getView().setBusy(true);
				var that = this; 
				var sClusterPath ="/ClusterSet('"+ cluster + "')";
				var aFilters = [
					new Filter("ClusterCom/Bukrs", sap.ui.model.FilterOperator.EQ, company),
					new Filter("ClusterCom/Ekorg", sap.ui.model.FilterOperator.EQ, purchOrg)				
				];
				var mParameters = {
					filters : aFilters,
	                urlParameters:{
	                	"$expand" : "ClusterCom"
	                },		
	                success: function(oRespOData){
	                	that.retrieveUserName(oRespOData.ClusterCom.results[0].Resp, sPath);
	                	that.getView().setBusy(false);
	                },
	                error: function(){
	                	that.getView().setBusy(false);
	                }
				};
				this.getView().getModel("oDataModel").read(sClusterPath, mParameters);				
				this.getView().getModel().setProperty(sPath + "/SelectedCompany", true);
			}
		},*/
		
		retrieveUserName: function(username, sPath){
			var sUserPath ="/UserSet('"+ username + "')";
			var oModel = this.getView().getModel();
			var mParameters = {
                success: function(oUserData){
                	var resp = oUserData.Address.Firstname + " " + oUserData.Address.Lastname;
    	            oModel.setProperty(sPath + "/Resp", resp);
                },
                error: function(){
  
                }
			};
			this.getView().getModel("oUserModel").read(sUserPath, mParameters);
		},
		
		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		
		/**
		 * Get the translation for sKey
		 * @public
		 * @param {string} sKey the translation key
		 * @param {array} aParameters translation paramets (can be null)
		 * @returns {string} The translation of sKey
		 */
		getTranslation: function (sKey, aParameters) {
			if( aParameters === undefined || aParameters === null ) {
				return this.getResourceBundle().getText(sKey);
			} else {
				return this.getResourceBundle().getText(sKey, aParameters);
			}
			
		},

		getRouter : function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		}
	});

});