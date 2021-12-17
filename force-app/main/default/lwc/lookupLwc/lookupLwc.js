/* eslint-disable no-console */
/* eslint-disable @lwc/lwc/no-async-operation */

import lookUp2 from "@salesforce/apex/ContactController.lookUp2";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getRecord } from "lightning/uiRecordApi";
import { api, LightningElement, track, wire } from "lwc";

let FIELDS = ["JobType__c.Name"];

export default class LookupLwc extends LightningElement {
    @api valueId;
    @api objName;
    @api iconName;
    @api labelName;
    @api readOnly = false;
    @api filter = "";
    @api showLabel = false;
    @api uniqueKey;
    objLabelName;
    @api fields = FIELDS;

    /*Create Record Start*/
    @api createRecord;
    @track recordTypeOptions;
    @track createRecordOpen;
    @track recordTypeSelector;
    @track mainRecord;
    @track isLoaded = false;

    //stencil
    @track cols = [1, 2];
    @track opacs = [
        "opacity: 1",
        "opacity: 0.9",
        "opacity: 0.8",
        "opacity: 0.7",
        "opacity: 0.6",
        "opacity: 0.5",
        "opacity: 0.4",
        "opacity: 0.3",
        "opacity: 0.2",
        "opacity: 0.1"
    ];
    @track double = true;

    //For Stencil
    @track stencilClass = "";
    @track stencilReplacement = "slds-hide";
    //css
    @track myPadding = "slds-modal__content";
    /*Create Record End*/

    searchTerm;
    @track valueObj;
    href;
    @track options; //lookup values
    @track isValue;
    @track blurTimeout;

    blurTimeout;

    //css
    @track boxClass =
        "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus";
    @track inputClass = "";

    connectedCallback() {
        console.log("objName", this.objName);
        // FIELDS.push(this.objName+'.Name');
        console.log("FIELDS", this.fields);
    }
    renderedCallback() {
        if (this.objName) {
            let temp = this.objName;
            if (temp.includes("__c")) {
                let newObjName = temp.replace(/__c/g, "");
                if (newObjName.includes("_")) {
                    let vNewObjName = newObjName.replace(/_/g, " ");
                    this.objLabelName = vNewObjName;
                } else {
                    this.objLabelName = newObjName;
                }
            } else {
                this.objLabelName = this.objName;
            }
        }

        console.log("In rendered", this.objName);
    }

    //Used for creating Record Start
    @wire(getObjectInfo, { objectApiName: "$objName" })
    wiredObjectInfo({ error, data }) {
        if (data) {
            this.record = data;
            this.error = undefined;

            let recordTypeInfos = Object.entries(this.record.recordTypeInfos);
            console.log("ObjectInfo length", recordTypeInfos.length);
            if (recordTypeInfos.length > 1) {
                let temp = [];
                recordTypeInfos.forEach(([key, value]) => {
                    console.log(key);
                    if (value.available === true && value.master !== true) {
                        console.log("Inside ifff", JSON.stringify(key, value));

                        temp.push({
                            label: value.name,
                            value: value.recordTypeId
                        });
                    }
                });
                this.recordTypeOptions = temp;
                if (this.recordTypeOptions.length > 0)
                    this.recordTypeId = this.recordTypeOptions[0].value;
                console.log("recordTypeOptions", this.recordTypeOptions);
            } else {
                this.recordTypeId = this.record.defaultRecordTypeId;
            }

            console.log(
                "this.recordTypeOptions",
                JSON.stringify(this.recordTypeOptions)
            );
        } else if (error) {
            this.error = error;
            this.record = undefined;
            console.log("this.error wire get Obj info", this.error);
        }
    }
    //Used for creating Record End

    @wire(lookUp2, {
        searchTerm: "$searchTerm",
        myObject: "$objName",
        filter: "$filter"
    })
    wiredRecords({ error, data }) {
        if (data) {
            this.record = data;
            this.error = undefined;
            this.options = this.record;
            console.log("common this.options", JSON.stringify(this.options));
        } else if (error) {
            this.error = error;
            this.record = undefined;
            console.log("wire.error", this.error);
        }
    }

    //To get preselected or selected record
    @wire(getRecord, { recordId: "$valueId", fields: "$fields" })
    wiredOptions({ error, data }) {
        if (data) {
            this.record = data;
            this.error = undefined;
            this.valueObj = this.record.fields.Name.value;
            this.href = "/" + this.record.id;
            this.isValue = true;
            console.log("this.href", this.href);
            console.log("this.record", JSON.stringify(this.record));
        } else if (error) {
            this.error = error;
            this.record = undefined;
            console.log(
                "this.error get Record",
                `${this.error} ::: ${this.valueId} ::: ${this.fields} :::: ${this.labelName}`
            );
        }
    }

    //when valueId changes
    valueChange() {
        console.log("In valueChange");
    }

    handleClick() {
        console.log("In handleClick");

        this.searchTerm = "";
        this.inputClass = "slds-has-focus";
        this.boxClass =
            "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open";
        //let combobox = this.template.querySelector('#box');
        //combobox.classList.add("slds-is-open");
    }

    inblur() {
        console.log("In inblur");
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.blurTimeout = setTimeout(() => {
            this.boxClass =
                "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus";
        }, 300);
    }

    onSelect(event) {
        console.log("In onSelect");
        let ele = event.currentTarget;
        let selectedId = ele.dataset.id;
        console.log("selectedId", selectedId);
        //As a best practise sending selected value to parent and inreturn parent sends the value to @api valueId
        let key = this.uniqueKey;
        const valueSelectedEvent = new CustomEvent("valueselect", {
            detail: { selectedId, key }
        });
        this.dispatchEvent(valueSelectedEvent);

        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass =
            "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus";
    }

    onChange(event) {
        console.log("In onChange");
        this.searchTerm = event.target.value;
        console.log("searchTerm", this.searchTerm);
    }

    handleRemovePill() {
        console.log("In handleRemovePill");
        this.isValue = false;
        let selectedId = "";
        let key = this.uniqueKey;
        const valueSelectedEvent = new CustomEvent("valueselect", {
            detail: { selectedId, key }
        });
        this.dispatchEvent(valueSelectedEvent);
    }

    createRecordFunc() {
        if (this.recordTypeOptions) {
            this.recordTypeSelector = true;
        } else {
            this.recordTypeSelector = false;
            this.mainRecord = true;
            //stencil before getting data
            this.stencilClass = "";
            this.stencilReplacement = "slds-hide";
        }
        this.createRecordOpen = true;
    }

    handleRecTypeChange(event) {
        console.log("In handleRecTypeChange", event.target.value);
        this.recordTypeId = event.target.value;
    }

    createRecordMain() {
        this.recordTypeSelector = false;
        this.mainRecord = true;
        //stencil before getting data
        this.stencilClass = "";
        this.stencilReplacement = "slds-hide";
    }

    handleLoad(event) {
        let details = event.detail;

        if (details) {
            setTimeout(() => {
                this.stencilClass = "slds-hide";
                this.stencilReplacement = "";
                this.myPadding = "slds-p-around_medium slds-modal__content";
            }, 1000);
        }
    }

    handleSubmit() {
        this.template.querySelector("lightning-record-form").submit();
    }

    handleSuccess(event) {
        this.createRecordOpen = false;
        this.mainRecord = false;
        this.stencilClass = "";
        this.stencilReplacement = "slds-hide";

        let selectedId = event.detail.id;
        let key = this.uniqueKey;
        const valueSelectedEvent = new CustomEvent("valueselect", {
            detail: { selectedId, key }
        });
        this.dispatchEvent(valueSelectedEvent);

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: `Record saved successfully with id: ${event.detail.id}`,
                variant: "success"
            })
        );
    }

    handleError() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error",
                message: "Error saving the record",
                variant: "error"
            })
        );
    }

    closeModal() {
        this.stencilClass = "";
        this.stencilReplacement = "slds-hide";
        this.createRecordOpen = false;
        this.recordTypeSelector = false;
        this.mainRecord = false;
    }
    handleCancel() {
        this.closeModal();
    }
}